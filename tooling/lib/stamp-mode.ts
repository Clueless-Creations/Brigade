import { spawnSync } from "node:child_process";

/** How a drift check or the version gate treats the checkout. */
export type StampMode = "pr" | "main" | "release";

/** Version-discipline rule. `legacy` is the per-change bump, used until main has `release:stamp`. */
export type VersionRule = StampMode | "legacy";

const STAMP_BRANCH = /^release\/stamp-/u;

export function stampModeFromArgv(argv: readonly string[]): StampMode | undefined {
  const index = argv.indexOf("--stamp-mode");
  if (index < 0) return undefined;
  return parseStampMode(argv[index + 1]);
}

export function stampModeFromEnv(env: NodeJS.ProcessEnv = process.env): StampMode | undefined {
  return parseStampMode(env.B2C_STAMP_MODE);
}

function parseStampMode(value: string | undefined): StampMode | undefined {
  if (value === "pr" || value === "main" || value === "release") return value;
  return undefined;
}

/** Drift stays strict unless a caller asks for pull-request or main-push mode. */
export function resolveDriftMode(argv: readonly string[], env: NodeJS.ProcessEnv = process.env): StampMode {
  return stampModeFromArgv(argv) ?? stampModeFromEnv(env) ?? "release";
}

export function driftIsLoose(mode: StampMode): boolean {
  return mode === "pr" || mode === "main";
}

export function currentBranch(gitRoot: string, env: NodeJS.ProcessEnv = process.env): string {
  const headRef = env.GITHUB_HEAD_REF?.trim();
  if (headRef) return headRef;
  const result = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: gitRoot, encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "";
}

export function isStampBranch(branch: string): boolean {
  return STAMP_BRANCH.test(branch);
}

/**
 * Pull requests and main pushes use the new rule only after the merge base itself
 * contains `release:stamp`. Until then, version discipline keeps the per-change bump
 * so the pull request that introduces the stamp can still land a stamped tree.
 * An explicit `release/stamp-*` branch always uses the release rule.
 */
export function resolveVersionRule(gitRoot: string, argv: readonly string[], base: string | undefined, env: NodeJS.ProcessEnv = process.env): VersionRule {
  const branch = currentBranch(gitRoot, env);
  if (isStampBranch(branch)) return "release";
  const requested = stampModeFromArgv(argv) ?? stampModeFromEnv(env);
  if (!requested) return "legacy";
  if (requested === "release") return "release";
  if (!base || !baseHasReleaseStamp(gitRoot, base)) return "legacy";
  return requested;
}

function baseHasReleaseStamp(gitRoot: string, base: string): boolean {
  const shown = spawnSync("git", ["show", `${base}:package.json`], { cwd: gitRoot, encoding: "utf8" });
  if (shown.status !== 0) return false;
  try {
    const parsed: unknown = JSON.parse(shown.stdout);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
    const scripts = (parsed as { scripts?: unknown }).scripts;
    if (!scripts || typeof scripts !== "object" || Array.isArray(scripts)) return false;
    return typeof (scripts as { ["release:stamp"]?: unknown })["release:stamp"] === "string";
  } catch {
    return false;
  }
}
