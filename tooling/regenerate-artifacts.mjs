#!/usr/bin/env node
/**
 * regenerate-artifacts.mjs — run the generators declared in tooling/generated-artifacts.json.
 *
 * No package imports: the dependency-regen workflow runs this with the runner's stock Node.
 *
 *   node tooling/regenerate-artifacts.mjs                 install, regenerate, list changed paths
 *   node tooling/regenerate-artifacts.mjs --check         same, and exit 1 when a declared path changed
 *   node tooling/regenerate-artifacts.mjs --skip-install  use the packages already installed
 *   node tooling/regenerate-artifacts.mjs --paths         print the declared paths, one per line
 *   node tooling/regenerate-artifacts.mjs --verify-patch <file>
 *                                                         exit 1 when the patch touches an undeclared path
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_PATH = path.join(repoRoot, "tooling/generated-artifacts.json");

const isCommand = (value) => Array.isArray(value) && value.length > 0 && value.every((part) => typeof part === "string" && part.length > 0);

export function loadArtifacts(manifestPath = MANIFEST_PATH) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length === 0) throw new Error(`${manifestPath}: artifacts must be a non-empty list`);
  for (const artifact of manifest.artifacts) {
    const label = JSON.stringify(artifact);
    if (typeof artifact.path !== "string" || typeof artifact.directory !== "string") throw new Error(`${label}: path and directory are required`);
    if (path.isAbsolute(artifact.path) || artifact.path.split("/").includes("..")) throw new Error(`${label}: path must stay inside the repository`);
    if (!artifact.path.startsWith(`${artifact.directory}/`)) throw new Error(`${label}: path must be inside directory`);
    if (!isCommand(artifact.install) || !isCommand(artifact.regenerate)) throw new Error(`${label}: install and regenerate must be argv lists`);
  }
  return manifest.artifacts;
}

/** Paths listed in a `git apply --numstat` report that are not declared artifacts. */
export function undeclaredPatchPaths(numstat, declared) {
  const allowed = new Set(declared);
  return numstat
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => line.split("\t").slice(2).join("\t"))
    .filter((file) => !allowed.has(file));
}

function run(command, cwd) {
  console.error(`$ (${path.relative(repoRoot, cwd) || "."}) ${command.join(" ")}`);
  const result = spawnSync(command[0], command.slice(1), { cwd, stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${command.join(" ")} failed in ${path.relative(repoRoot, cwd)} (exit ${result.status ?? result.signal})`);
}

function changedPaths(paths) {
  const result = spawnSync("git", ["status", "--porcelain", "--", ...paths], { cwd: repoRoot, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git status failed: ${result.stderr}`);
  return result.stdout
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => line.slice(3));
}

function main(argv) {
  const artifacts = loadArtifacts();
  const paths = artifacts.map((artifact) => artifact.path);
  if (argv.includes("--paths")) {
    for (const file of paths) console.log(file);
    return 0;
  }
  const patchAt = argv.indexOf("--verify-patch");
  if (patchAt >= 0) {
    const patch = argv[patchAt + 1];
    if (!patch) throw new Error("--verify-patch needs a file");
    const result = spawnSync("git", ["apply", "--numstat", patch], { cwd: repoRoot, encoding: "utf8" });
    if (result.status !== 0) throw new Error(`git apply --numstat failed: ${result.stderr}`);
    const undeclared = undeclaredPatchPaths(result.stdout, paths);
    if (undeclared.length > 0) {
      console.error(`Patch touches undeclared paths: ${undeclared.join(", ")}`);
      return 1;
    }
    return 0;
  }

  const before = new Set(changedPaths(paths));
  const directories = new Map();
  for (const artifact of artifacts) {
    const entry = directories.get(artifact.directory) ?? { install: artifact.install, regenerate: [] };
    if (!entry.regenerate.some((command) => command.join("\0") === artifact.regenerate.join("\0"))) entry.regenerate.push(artifact.regenerate);
    directories.set(artifact.directory, entry);
  }
  for (const [directory, entry] of directories) {
    const cwd = path.join(repoRoot, directory);
    if (!argv.includes("--skip-install")) run(entry.install, cwd);
    for (const command of entry.regenerate) run(command, cwd);
  }

  const changed = changedPaths(paths).filter((file) => !before.has(file));
  for (const file of changed) console.log(file);
  if (argv.includes("--check") && changed.length > 0) {
    console.error(`Generated artifacts were stale and are now regenerated: ${changed.join(", ")}. Review git diff --stat, then commit them.`);
    return 1;
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
