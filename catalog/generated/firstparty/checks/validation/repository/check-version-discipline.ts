#!/usr/bin/env node
import { existsSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { flagString, issue, isRecord, parseFlags, reportAndExit, type Issue } from "../../../tooling/lib/launch-state.js";
import { findGitRoot } from "../../../tooling/lib/git-root.js";
import { stampChangeReason } from "../../../tooling/lib/stamp-files.js";
import { resolveVersionRule } from "../../../tooling/lib/stamp-mode.js";
import { compareSemver } from "../../../tooling/lib/stamp-version.js";

interface Args {
  repoRoot: string;
  skillRoot: string;
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const defaultSkillRoot = path.resolve(scriptDir, "../../..");
const args = parseArgs(process.argv.slice(2));
const issues: Issue[] = [];
const manifestPath = path.join(args.skillRoot, "skill-version.json");

const manifest = loadManifest(manifestPath);
if (manifest) {
  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(manifest.version)) {
    issues.push(issue("error", "version_discipline.semver_invalid", "skill-version.json version must be semver-like.", manifestPath));
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(manifest.updatedAt)) {
    issues.push(issue("error", "version_discipline.updated_at_invalid", "skill-version.json updatedAt must be YYYY-MM-DD.", manifestPath));
  }
  if (
    !Array.isArray(manifest.releaseNotes) ||
    manifest.releaseNotes.length < 2 ||
    manifest.releaseNotes.some((note) => typeof note !== "string" || note.trim().length < 12)
  ) {
    issues.push(
      issue(
        "error",
        "version_discipline.release_notes_thin",
        "skill-version.json needs at least two concrete release notes for this skill version.",
        manifestPath,
      ),
    );
  }
}

/**
 * Since ADR-0002 the package root is the repository root, so "the skill" is every tracked path
 * except the repository-only files that never required a version bump before the move: the
 * maintainer documentation, CI, the contributor guides, and the client entrypoint directories.
 * A skill root nested inside the repository (an older checkout, or a fixture) keeps its own
 * relative pathspec. Git rejects an empty pathspec outright, so the root case must never pass "".
 */
const REPOSITORY_ONLY_PATHS = [
  "docs",
  ".github",
  ".agents",
  ".claude",
  ".claude-plugin",
  ".codex",
  ".cursor",
  ".superdesign",
  "README.md",
  "AGENTS.md",
  "CLAUDE.md",
  "CONTRIBUTING.md",
  "LICENSE",
  ".gitignore",
  ".npmignore",
  ".nvmrc",
  ".node-version",
  ".prettierrc.json",
  ".prettierignore",
];

/** `git rev-parse --show-toplevel` returns a real path; callers may pass a symlinked one (macOS /var). */
function realPath(value: string): string {
  try {
    return realpathSync(value);
  } catch {
    return path.resolve(value);
  }
}

function skillPathspecs(gitRoot: string, skillRoot: string): string[] {
  const relative = path.relative(realPath(gitRoot), realPath(skillRoot));
  if (relative && relative !== ".") {
    // A nested skill root has its own README/docs/etc. that are repository-only for IT, same as
    // the root-layout case below — otherwise #30 (a docs-only branch wrongly counted as ahead of
    // the skill) still reproduces here, just scoped under the nested skill's own directory.
    return [relative, ...REPOSITORY_ONLY_PATHS.map((entry) => `:(exclude)${path.join(relative, entry)}`)];
  }
  return [".", ...REPOSITORY_ONLY_PATHS.map((entry) => `:(exclude)${entry}`)];
}

/** True when a missing merge-base must fail instead of looking like a pass. */
function historyRequired(): boolean {
  return process.env.B2C_REQUIRE_GIT_HISTORY === "1" || process.env.GITHUB_ACTIONS === "true";
}

function gitIsShallow(gitRoot: string): boolean {
  const result = git(["rev-parse", "--is-shallow-repository"], gitRoot);
  return result.status === 0 && result.stdout.trim() === "true";
}

function isNullSha(value: string | undefined): boolean {
  return !value || /^0+$/.test(value);
}

function gitOutput(gitRoot: string, argv: string[], relativeManifest: string): string {
  const result = git(argv, gitRoot);
  if (result.status !== 0) {
    issues.push(issue("error", "version_discipline.git_failed", `git ${argv.slice(0, 2).join(" ")} failed: ${result.stderr.trim()}`, relativeManifest));
    return "";
  }
  return result.stdout.trim();
}

function legacyBumpCheck(gitRoot: string, relativeManifest: string, version: string | undefined, skillSpecs: string[]): void {
  const changed = new Set(
    [
      ...gitOutput(gitRoot, ["diff", "--name-only", "--", ...skillSpecs], relativeManifest).split(/\r?\n/),
      ...gitOutput(gitRoot, ["diff", "--cached", "--name-only", "--", ...skillSpecs], relativeManifest).split(/\r?\n/),
    ].filter(Boolean),
  );
  const pendingManifestChanged = changed.has(relativeManifest);
  const latestSkillCommit = gitOutput(gitRoot, ["log", "-1", "--format=%H", "--", ...skillSpecs], relativeManifest);
  const latestManifestCommit = gitOutput(gitRoot, ["log", "-1", "--format=%H", "--", relativeManifest], relativeManifest);

  if (latestSkillCommit && latestManifestCommit && latestSkillCommit !== latestManifestCommit && !pendingManifestChanged) {
    issues.push(
      issue(
        "error",
        "version_discipline.manifest_not_latest",
        "The latest commit touching the skill did not also touch skill-version.json. Bump the version/release notes in the same commit as skill behavior changes.",
        relativeManifest,
      ),
    );
  }

  monotonicityCheck(gitRoot, relativeManifest, version, changed.size > 0, skillSpecs);

  const meaningfulChanges = Array.from(changed).filter((file) => !file.endsWith("skill-version.json") && !file.includes("/node_modules/"));
  if (meaningfulChanges.length > 0 && !changed.has(relativeManifest)) {
    issues.push(
      issue(
        "error",
        "version_discipline.pending_manifest_update_missing",
        `Pending skill changes require a matching skill-version.json update. Changed examples: ${meaningfulChanges.slice(0, 5).join(", ")}`,
        relativeManifest,
      ),
    );
  }
}

function releaseForwardCheck(gitRoot: string, relativeManifest: string, version: string | undefined, skillSpecs: string[]): void {
  const changed = new Set(
    [
      ...gitOutput(gitRoot, ["diff", "--name-only", "--", ...skillSpecs], relativeManifest).split(/\r?\n/),
      ...gitOutput(gitRoot, ["diff", "--cached", "--name-only", "--", ...skillSpecs], relativeManifest).split(/\r?\n/),
    ].filter(Boolean),
  );
  monotonicityCheck(gitRoot, relativeManifest, version, changed.size > 0, skillSpecs);
}

function stampFileCheck(gitRoot: string, relativeManifest: string): void {
  const base = resolveComparisonBase(gitRoot);
  if (!base) {
    issues.push(
      issue(
        "error",
        "version_discipline.history_insufficient",
        "Git history is too shallow to see which stamp files this pull request changes.",
        relativeManifest,
      ),
    );
    return;
  }
  const names = new Set<string>();
  for (const args of [
    ["diff", "--name-only", `${base}...HEAD`],
    ["diff", "--name-only"],
    ["diff", "--cached", "--name-only"],
  ]) {
    for (const line of gitOutput(gitRoot, args, relativeManifest).split(/\r?\n/)) {
      if (line) names.add(line);
    }
  }
  const reasons: string[] = [];
  for (const relative of names) {
    const reason = stampChangeReason(relative, fileAt(gitRoot, base, relative), fileAt(gitRoot, "HEAD", relative, true));
    if (reason) reasons.push(reason);
  }
  if (reasons.length === 0) return;
  issues.push(
    issue(
      "error",
      "version_discipline.stamp_file_in_pr",
      `Pull requests must not change stamp files (${reasons.slice(0, 8).join(", ")}). Run npm run release:stamp on main.`,
      relativeManifest,
    ),
  );
}

function mainStampWarning(gitRoot: string, relativeManifest: string, version: string | undefined): void {
  const stamp = gitOutput(gitRoot, ["log", "-1", "--format=%H", "--", "skill-version.json"], relativeManifest);
  if (!stamp || !version) return;
  const count = Number(gitOutput(gitRoot, ["rev-list", "--first-parent", "--count", `${stamp}..HEAD`], relativeManifest));
  if (!Number.isFinite(count) || count === 0) return;
  issues.push(issue("warning", "version_discipline.main_unstamped", `main is ${count} commits past stamp ${version}`, relativeManifest));
}

function fileAt(gitRoot: string, rev: string, relative: string, preferWorktree = false): string | undefined {
  if (preferWorktree) {
    const absolute = path.join(gitRoot, relative);
    if (existsSync(absolute)) {
      try {
        return readFileSync(absolute, "utf8");
      } catch {
        return undefined;
      }
    }
  }
  const shown = git(["show", `${rev}:${relative}`], gitRoot);
  return shown.status === 0 ? shown.stdout : undefined;
}

const gitRoot = findGitRoot(args.repoRoot);
if (gitRoot) {
  const skillSpecs = skillPathspecs(gitRoot, args.skillRoot);
  const relativeManifest = path.relative(realPath(gitRoot), realPath(manifestPath));
  if (gitIsShallow(gitRoot)) {
    issues.push(
      issue(
        "error",
        "version_discipline.history_insufficient",
        "Git history is too shallow to compare skill-version.json with earlier commits. Fetch the merge-base (origin/main or GITHUB_BASE_SHA) before this check; a fetch-depth 1 clone must not pass as if the version moved.",
        relativeManifest,
      ),
    );
  } else {
    const rule = resolveVersionRule(gitRoot, process.argv, resolveComparisonBase(gitRoot));
    switch (rule) {
      case "legacy":
        legacyBumpCheck(gitRoot, relativeManifest, manifest?.version, skillSpecs);
        break;
      case "pr":
        stampFileCheck(gitRoot, relativeManifest);
        break;
      case "main":
        mainStampWarning(gitRoot, relativeManifest, manifest?.version);
        break;
      case "release":
        releaseForwardCheck(gitRoot, relativeManifest, manifest?.version, skillSpecs);
        break;
      default: {
        const exhaustive: never = rule;
        throw new Error(`Unhandled version rule ${String(exhaustive)}`);
      }
    }
  }
}

reportAndExit("Skill version discipline check", issues);

function parseArgs(argv: string[]): Args {
  const flags = parseFlags(argv, [
    { flags: ["--repo-root"], key: "repoRoot" },
    { flags: ["--skill-root"], key: "skillRoot" },
  ]);

  return {
    repoRoot: flagString(flags, "repoRoot") ?? process.cwd(),
    skillRoot: flagString(flags, "skillRoot") ?? defaultSkillRoot,
  };
}

function loadManifest(filePath: string): { version: string; updatedAt: string; releaseNotes: unknown } | undefined {
  if (!existsSync(filePath)) {
    issues.push(issue("error", "version_discipline.manifest_missing", "skill-version.json is required.", filePath));
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(readFileSync(filePath, "utf8"));
    if (!isRecord(parsed)) {
      issues.push(issue("error", "version_discipline.manifest_invalid", "skill-version.json must be an object.", filePath));
      return undefined;
    }
    const version = typeof parsed.version === "string" ? parsed.version : "";
    const updatedAt = typeof parsed.updatedAt === "string" ? parsed.updatedAt : "";
    return { version, updatedAt, releaseNotes: parsed.releaseNotes };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    issues.push(issue("error", "version_discipline.manifest_parse_error", `skill-version.json is invalid JSON: ${message}`, filePath));
    return undefined;
  }
}

function git(argv: string[], cwd: string): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync("git", argv, { cwd, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

/**
 * The version must move FORWARD relative to the branch point (#147).
 *
 * Nothing else in the repository asserts this. Every other code this file raises — semver_invalid,
 * updated_at_invalid, manifest_missing, manifest_invalid, manifest_parse_error, manifest_not_latest,
 * pending_manifest_update_missing — is a shape or presence check, and check-skill-version.ts compares
 * source against INSTALLED RUNTIMES rather than the merge base. `semver_invalid` is the trap: it only
 * asserts the string is semver-SHAPED, so scanning the error list it reads like a version check.
 *
 * The gap is not theoretical. On 2026-09-06 four lanes released in parallel and hand-passed version
 * numbers between sessions; main moved 0.217.2 -> .3 -> .4 -> 0.218.0 -> .2 -> .3 while branches held
 * numbers chosen minutes earlier. A branch sat at 0.218.1 after main had reached 0.218.2, and only a
 * manual `git show origin/main:skill-version.json` caught it. Merging it would have moved main
 * backwards with every gate green.
 *
 * Unresolvable base is a WARNING on a complete fixture repository or a fork with no upstream.
 * A shallow clone is an error (`history_insufficient`): fetch-depth 1 used to skip
 * manifest_not_latest and version_not_ahead_of_base and report green.
 */
function monotonicityCheck(
  gitRoot: string,
  relativeManifest: string,
  currentVersion: string | undefined,
  hasPendingChanges: boolean,
  skillSpecs: string[],
): void {
  if (!currentVersion) return;

  const base = resolveComparisonBase(gitRoot);
  if (!base) {
    const envBase = process.env.GITHUB_BASE_SHA;
    const missingFetchedBase = Boolean(envBase) && !isNullSha(envBase);
    const insufficient = historyRequired() && missingFetchedBase;
    issues.push(
      issue(
        insufficient ? "error" : "warning",
        insufficient ? "version_discipline.history_insufficient" : "version_discipline.base_unresolvable",
        insufficient
          ? "Git history is too shallow to compare skill-version.json with the merge base. Fetch origin/main (or GITHUB_BASE_SHA) before running this check; a shallow clone must not pass as if the version moved."
          : "No upstream base commit to compare the version against; monotonicity was not checked. Expected in a fixture repository or before the first upstream commit.",
        relativeManifest,
      ),
    );
    return;
  }

  // A checkout sitting ON the base with nothing pending is not "behind" — it IS the base, and its
  // version legitimately equals the base's. Comparing there would fail a clean main checkout against
  // itself. Only a branch that introduces something must move the number forward.
  //
  // "Ahead" must be scoped to skillSpecs (#30): unscoped, a branch whose only committed change is a
  // REPOSITORY_ONLY_PATHS file (README.md, AGENTS.md, ...) still counted as commits ahead, forcing a
  // version bump on documentation-only branches even though the skill itself never changed.
  const ahead = git(["rev-list", "--count", `${base}..HEAD`, "--", ...skillSpecs], gitRoot);
  const commitsAhead = ahead.status === 0 ? Number(ahead.stdout.trim()) : 0;
  if (!hasPendingChanges && (!Number.isFinite(commitsAhead) || commitsAhead === 0)) return;

  const shown = git(["show", `${base}:${relativeManifest}`], gitRoot);
  if (shown.status !== 0) return;
  let baseVersion: string | undefined;
  try {
    const parsed: unknown = JSON.parse(shown.stdout);
    if (isRecord(parsed) && typeof parsed.version === "string") baseVersion = parsed.version;
  } catch {
    return;
  }
  if (!baseVersion) return;

  if (compareSemver(currentVersion, baseVersion) <= 0) {
    issues.push(
      issue(
        "error",
        "version_discipline.version_not_ahead_of_base",
        `skill-version.json is ${currentVersion}, which does not move forward from ${baseVersion} at the merge base. Re-read \`git show origin/main:skill-version.json\` and take that version plus one; a number chosen before another branch merged is already stale.`,
        relativeManifest,
      ),
    );
  }
}

/** The merge base with the upstream trunk, or undefined when there is nothing to compare against. */
function resolveComparisonBase(gitRoot: string): string | undefined {
  const envBase = process.env.GITHUB_BASE_SHA ?? "";
  if (!isNullSha(envBase)) {
    const mergeBase = git(["merge-base", "HEAD", envBase], gitRoot);
    if (mergeBase.status === 0 && mergeBase.stdout.trim()) return mergeBase.stdout.trim();
  }
  for (const ref of ["origin/main", "main", "origin/HEAD"]) {
    const verified = git(["rev-parse", "--verify", "--quiet", `${ref}^{commit}`], gitRoot);
    if (verified.status !== 0 || !verified.stdout.trim()) continue;
    const mergeBase = git(["merge-base", "HEAD", ref], gitRoot);
    if (mergeBase.status === 0 && mergeBase.stdout.trim()) return mergeBase.stdout.trim();
  }
  return undefined;
}
