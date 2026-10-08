#!/usr/bin/env node
/**
 * release:stamp — one commit on a release/stamp-* branch.
 *
 * Refuses a dirty tree, a branch other than main, or a main that does not
 * contain origin/main. Patch + 1 is the version. `--version` may set a higher
 * number. The second run on the same stamp is a no-op.
 *
 * Usage: tsx tooling/release-stamp.ts [--version <semver>] [--branch <name>] [--push] [--repo-root <dir>]
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { bumpPatch, compareSemver, isSemver } from "./lib/stamp-version.js";

interface StampArgs {
  repoRoot: string;
  version?: string;
  branch?: string;
  push: boolean;
}

const STAMP_SUBJECT = /^Stamp \d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/u;

function main(): number {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(args.repoRoot);
  const ready = assertReady(root);
  if (ready) {
    console.error(ready);
    return 1;
  }

  const current = readVersion(path.join(root, "skill-version.json"));
  const packageVersion = readVersion(path.join(root, "package.json"));
  const lockVersion = readLockVersion(path.join(root, "package-lock.json"));
  if (!current || !packageVersion || !lockVersion || current !== packageVersion || current !== lockVersion) {
    console.error("package.json, package-lock.json, and skill-version.json versions disagree. Refusing to stamp.");
    return 1;
  }

  const lastStamp = gitOut(root, ["log", "-1", "--format=%H", "--", "skill-version.json"]);
  const subjects = lastStamp
    ? gitOut(root, ["log", "--first-parent", `${lastStamp}..HEAD`, "--format=%s"])
        .split("\n")
        .filter(Boolean)
    : [];
  const notes = subjects.filter((subject) => !STAMP_SUBJECT.test(subject));
  if (notes.length === 0) {
    console.log(`Nothing changed since stamp ${current}.`);
    return 0;
  }

  const next = args.version ?? bumpPatch(current);
  if (!isSemver(next) || compareSemver(next, current) <= 0) {
    console.error(`Refusing ${next}. The next version must be greater than ${current}.`);
    return 1;
  }

  writeRootVersion(path.join(root, "package.json"), current, next, 1);
  writeRootVersion(path.join(root, "package-lock.json"), current, next, 2);
  writeManifest(path.join(root, "skill-version.json"), next, concreteNotes(root, notes));

  if (!runGenerators(root) || !runStrictChecks(root)) return 1;

  const branch = args.branch ?? `release/stamp-${next}`;
  if (!branch.startsWith("release/stamp-")) {
    console.error(`Refusing branch ${branch}. Stamp branches start with release/stamp-.`);
    return 1;
  }
  if (git(root, ["checkout", "-B", branch]).status !== 0) return 1;
  if (git(root, ["add", "-A"]).status !== 0) return 1;
  const staged = gitOut(root, ["diff", "--cached", "--name-only"]);
  if (!staged.trim()) {
    console.error("Stamp changed no files.");
    return 1;
  }
  const committed = git(root, ["commit", "-q", "--no-verify", "-m", `Stamp ${next}`]);
  if (committed.status !== 0) {
    console.error(committed.stderr.trim() || "git commit failed.");
    return 1;
  }
  console.log(`Committed Stamp ${next} on ${branch}.`);
  console.log(`gh pr create --base main --head ${branch} --title "Stamp ${next}" --body "Release stamp ${next}."`);
  if (args.push) {
    const pushed = git(root, ["push", "--force-with-lease", "-u", "origin", branch]);
    if (pushed.status !== 0) {
      console.error(pushed.stderr.trim() || "git push failed.");
      return 1;
    }
    console.log(`stamp: pushed ${branch}`);
  } else {
    console.log("Not pushed. Pass --push to update origin.");
  }
  return 0;
}

function concreteNotes(root: string, subjects: string[]): string[] {
  const fresh = subjects.map((subject) => subject.trim()).filter((subject) => subject.length >= 12);
  const previous = readNotes(path.join(root, "skill-version.json"));
  const notes: string[] = [];
  for (const note of [...fresh, ...previous]) {
    if (notes.includes(note)) continue;
    notes.push(note);
  }
  if (notes.length < 2 || notes.some((note) => note.trim().length < 12)) {
    throw new Error("Release notes need at least two concrete lines of 12 characters or more.");
  }
  return notes;
}

function runGenerators(root: string): boolean {
  const steps: Array<[string, string[]]> = [
    ["npm", ["run", "render:all"]],
    ["npm", ["run", "render:evidence-schema-version"]],
    ["npm", ["run", "render:artifact-pages"]],
    [process.execPath, ["examples/spec-pack/build.mjs"]],
  ];
  for (const [command, args] of steps) {
    const result = spawnSync(command, args, { cwd: root, encoding: "utf8", stdio: "inherit" });
    if (result.status !== 0) {
      console.error(`${command} ${args.join(" ")} failed.`);
      return false;
    }
  }
  return true;
}

function runStrictChecks(root: string): boolean {
  const env = { ...process.env, B2C_STAMP_MODE: "release" };
  const checks: Array<[string, string[]]> = [
    ["catalog:render-routing", ["--check", "--stamp-mode", "release"]],
    ["check:hosted-bundle", ["--stamp-mode", "release"]],
    ["check:evidence-schema-drift", ["--stamp-mode", "release"]],
    ["check:credits", ["--stamp-mode", "release"]],
    ["check:generated-pages", ["--stamp-mode", "release"]],
    ["check:public-api", ["--stamp-mode", "release"]],
  ];
  for (const [script, extra] of checks) {
    const result = spawnSync("npm", ["run", script, "--", ...extra], { cwd: root, encoding: "utf8", env });
    if (result.status !== 0) {
      if (result.stdout) process.stdout.write(result.stdout);
      if (result.stderr) process.stderr.write(result.stderr);
      console.error(`${script} failed in release mode.`);
      return false;
    }
  }
  const task = spawnSync(process.execPath, ["--import", "tsx", "tooling/render-task-skills.ts", "--check", "--stamp-mode", "release"], {
    cwd: root,
    encoding: "utf8",
    env,
  });
  if (task.status !== 0) {
    if (task.stdout) process.stdout.write(task.stdout);
    if (task.stderr) process.stderr.write(task.stderr);
    console.error("render:task-skills --check failed in release mode.");
    return false;
  }
  if (!specPackMatches(root)) {
    console.error("examples/spec-pack/index.html does not match a fresh build.");
    return false;
  }
  return true;
}

function specPackMatches(root: string): boolean {
  const dir = mkdtempSync(path.join(tmpdir(), "b2c-spec-pack-"));
  try {
    const out = path.join(dir, "index.html");
    const built = spawnSync(process.execPath, ["examples/spec-pack/build.mjs", "examples/spec-pack/spec.yaml", out], { cwd: root, encoding: "utf8" });
    if (built.status !== 0) return false;
    const committed = path.join(root, "examples/spec-pack/index.html");
    if (!existsSync(committed)) return false;
    return readFileSync(committed).equals(readFileSync(out));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function assertReady(root: string): string | undefined {
  const branch = gitOut(root, ["rev-parse", "--abbrev-ref", "HEAD"]);
  if (branch !== "main" && !branch.startsWith("release/stamp-")) {
    return `Refusing to stamp from ${branch || "this checkout"}. Check out main first.`;
  }
  const status = gitOut(root, ["status", "--porcelain"]);
  if (status.trim()) return "Refusing to stamp a dirty tree.";
  const origin = git(root, ["rev-parse", "--verify", "--quiet", "origin/main"]);
  if (origin.status !== 0) return "Refusing to stamp without origin/main. Fetch main first.";
  const contains = git(root, ["merge-base", "--is-ancestor", "origin/main", "HEAD"]);
  if (contains.status !== 0) return "Refusing to stamp. This checkout does not contain origin/main.";
  return undefined;
}

function writeManifest(file: string, version: string, notes: string[]): void {
  const parsed = JSON.parse(readFileSync(file, "utf8")) as { updatedAt?: string; releaseNotes?: unknown; version?: string };
  parsed.version = version;
  parsed.updatedAt = new Date().toISOString().slice(0, 10);
  parsed.releaseNotes = notes;
  writeFileSync(file, `${JSON.stringify(parsed, null, 2)}\n`);
}

function readNotes(file: string): string[] {
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as { releaseNotes?: unknown };
    if (!Array.isArray(parsed.releaseNotes)) return [];
    return parsed.releaseNotes.filter((note): note is string => typeof note === "string");
  } catch {
    return [];
  }
}

function writeRootVersion(file: string, from: string, to: string, limit: number): void {
  const needle = `"version": "${from}"`;
  let seen = 0;
  const next = readFileSync(file, "utf8").replaceAll(needle, (match) => {
    seen += 1;
    return seen <= limit ? `"version": "${to}"` : match;
  });
  if (seen < limit) throw new Error(`${file} did not contain ${limit} root version field(s).`);
  writeFileSync(file, next);
}

function readVersion(file: string): string | undefined {
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as { version?: unknown };
    return typeof parsed.version === "string" ? parsed.version : undefined;
  } catch {
    return undefined;
  }
}

function readLockVersion(file: string): string | undefined {
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as { version?: unknown; packages?: { [""]?: { version?: unknown } } };
    const root = parsed.packages?.[""]?.version;
    if (typeof parsed.version === "string" && parsed.version === root) return parsed.version;
    return undefined;
  } catch {
    return undefined;
  }
}

function parseArgs(argv: string[]): StampArgs {
  const args: StampArgs = { repoRoot: process.cwd(), push: false };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];
    if (token === "--push") args.push = true;
    else if (token === "--version" && value) {
      args.version = value;
      index += 1;
    } else if (token === "--branch" && value) {
      args.branch = value;
      index += 1;
    } else if (token === "--repo-root" && value) {
      args.repoRoot = value;
      index += 1;
    } else throw new Error("Usage: release-stamp.ts [--version <semver>] [--branch <name>] [--push] [--repo-root <dir>]");
  }
  return args;
}

function git(cwd: string, argv: string[]): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync("git", argv, { cwd, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

function gitOut(cwd: string, argv: string[]): string {
  const result = git(cwd, argv);
  if (result.status !== 0) return "";
  return result.stdout.trim();
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(error instanceof Error ? error.message : "release:stamp failed.");
  process.exitCode = 1;
}
