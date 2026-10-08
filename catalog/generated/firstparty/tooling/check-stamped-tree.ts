#!/usr/bin/env node
/**
 * Strict stamp guard for deploy, runtime:sync, and publish.
 * Presubmit does not run this script. It requires the generated files to match.
 *
 * Usage: tsx tooling/check-stamped-tree.ts [--repo-root <dir>]
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REFUSAL = "This checkout is not a stamped tree. Run npm run release:stamp, or sync from the latest stamp.";

function main(): number {
  const root = path.resolve(readFlag(process.argv.slice(2), "--repo-root") ?? process.cwd());
  const versions = [
    readVersion(path.join(root, "package.json")),
    readVersion(path.join(root, "skill-version.json")),
    readLockVersion(path.join(root, "package-lock.json")),
  ];
  if (versions.some((version) => !version) || new Set(versions).size !== 1) {
    console.error(REFUSAL);
    console.error("package.json, package-lock.json, and skill-version.json versions disagree.");
    return 1;
  }
  const env = { ...process.env, B2C_STAMP_MODE: "release" };
  const checks: Array<[string, string[]]> = [
    ["catalog/render-routing.ts", ["--check", "--skill-root", root, "--stamp-mode", "release"]],
    ["tooling/render-hosted-bundle.ts", ["--check", "--skill-root", root, "--stamp-mode", "release"]],
    ["checks/validation/business/research/check-evidence-schema-drift.ts", ["--skill-root", root, "--stamp-mode", "release"]],
    ["tooling/render-credits.ts", ["--check", "--skill-root", root, "--stamp-mode", "release"]],
    ["checks/validation/business/process/check-generated-pages.ts", ["--stamp-mode", "release"]],
    ["tooling/render-public-api.ts", ["--check", "--stamp-mode", "release"]],
    ["tooling/render-task-skills.ts", ["--root", root, "--check", "--stamp-mode", "release"]],
  ];
  const tsx = process.execPath;
  for (const [script, args] of checks) {
    const target = path.join(root, script);
    if (!existsSync(target)) {
      console.error(REFUSAL);
      console.error(`Missing ${script}.`);
      return 1;
    }
    const result = spawnSync(tsx, ["--import", "tsx", target, ...args], { cwd: root, encoding: "utf8", env });
    if (result.status !== 0) {
      console.error(REFUSAL);
      const detail = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
      if (detail) console.error(detail.split("\n").slice(0, 20).join("\n"));
      return 1;
    }
  }
  if (!specPackMatches(root)) {
    console.error(REFUSAL);
    console.error("examples/spec-pack/index.html does not match a fresh build.");
    return 1;
  }
  console.log(`Stamped tree ${versions[0]}.`);
  return 0;
}

function specPackMatches(root: string): boolean {
  const spec = path.join(root, "examples/spec-pack/build.mjs");
  const committed = path.join(root, "examples/spec-pack/index.html");
  if (!existsSync(spec) || !existsSync(committed)) return false;
  const dir = mkdtempSync(path.join(tmpdir(), "b2c-spec-pack-"));
  try {
    const out = path.join(dir, "index.html");
    const built = spawnSync(process.execPath, [spec, path.join(root, "examples/spec-pack/spec.yaml"), out], { cwd: root, encoding: "utf8" });
    if (built.status !== 0) return false;
    return readFileSync(committed).equals(readFileSync(out));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function readFlag(argv: string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);
  const value = index >= 0 ? argv[index + 1] : undefined;
  return value && !value.startsWith("--") ? value : undefined;
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
    return typeof parsed.version === "string" && parsed.version === root ? parsed.version : undefined;
  } catch {
    return undefined;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
