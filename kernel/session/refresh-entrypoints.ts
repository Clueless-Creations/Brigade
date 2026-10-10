import { randomUUID } from "node:crypto";
import { existsSync, lstatSync, rmdirSync } from "node:fs";
import path from "node:path";
import { hasWorkspaceScaffold } from "../../adapters/registry.js";
import { inspectWorkspaceEntrypoints, refreshWorkspaceEntrypoints, type WorkspaceEntrypointReport } from "../../adapters/workspace-entrypoints.js";
import { loadProductInstanceDocument, productYamlPath } from "../../catalog/ontology/instance-load.js";
import { assertCompositionActivationComplete } from "../composition/activation.js";
import { isMainModule } from "../lib/cli.js";
import { assertNoPendingErasure } from "../reducer/erasure-guard.js";
import { acquireLock, releaseLock } from "../reducer/lock.js";
import { assertNoPendingInitialization } from "./initialization-guard.js";
import { resolveCliWorkspace } from "./status.js";

const USAGE =
  "Usage: b2c refresh-entrypoints --workspace <id-or-path> [--apply [--break-stale-verified]] [--json]\nPreview or refresh Brigade-owned startup guidance. App instructions remain active; runtime pins, permissions and business state are unchanged. Break a stale session lock only after verifying its previous owner is inactive.";

function safePath(workspace: string, relative: string): string {
  let current = workspace;
  const segments = relative.split("/");
  for (const [index, segment] of segments.entries()) {
    current = path.join(current, segment);
    try {
      const stat = lstatSync(current);
      if (stat.isSymbolicLink() || (index < segments.length - 1 && !stat.isDirectory())) throw new Error("entrypoints.unsafe_path");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  return current;
}

/** Uses the existing workspace lock only for explicit writes; preview is passive. */
export function refreshWorkspaceGuidance(workspace: string, apply: boolean, breakStaleVerified = false): WorkspaceEntrypointReport {
  if (breakStaleVerified && !apply) throw new Error("entrypoints.recovery_requires_apply");
  const inspected = inspectWorkspaceEntrypoints({ target: workspace });
  if (inspected.status === "unsafe" || inspected.status === "modified") return inspected;
  if (!hasWorkspaceScaffold(workspace)) throw new Error("entrypoints.scaffold_required");
  const variables = () => {
    const product = safePath(workspace, "product.yaml");
    return existsSync(product) ? { APP_NAME: loadProductInstanceDocument(productYamlPath(workspace)).meta.name } : undefined;
  };
  if (!apply) return refreshWorkspaceEntrypoints({ target: workspace, apply: false, vars: variables() });

  const controlPath = safePath(workspace, "control");
  const lockPath = safePath(workspace, "control/session.lock");
  try {
    const lock = lstatSync(lockPath);
    if (!lock.isFile() || lock.size > 64 * 1024) throw new Error("entrypoints.unsafe_lock");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const hadControl = existsSync(controlPath);
  const owner = `entrypoints-${randomUUID()}`;
  const locked = acquireLock(lockPath, { ownerSessionId: owner, retries: 0, ttlSeconds: 300, breakStale: breakStaleVerified });
  if (!locked.ok) throw new Error(locked.reason === "stale_unverified" ? "entrypoints.session_lock_stale" : "entrypoints.session_lock_unavailable");
  try {
    safePath(workspace, ".b2c-launch/initialization.json");
    safePath(workspace, "control/erasure-intent.json");
    assertNoPendingInitialization(workspace);
    assertNoPendingErasure(workspace);
    assertCompositionActivationComplete(workspace);
    return refreshWorkspaceEntrypoints({ target: workspace, apply: true, vars: variables() });
  } finally {
    releaseLock(lockPath, owner);
    if (!hadControl) {
      try {
        rmdirSync(controlPath);
      } catch (error) {
        if (!["ENOTEMPTY", "ENOENT"].includes((error as NodeJS.ErrnoException).code ?? "")) throw error;
      }
    }
  }
}

export function main(argv = process.argv.slice(2)): number {
  const json = argv.includes("--json");
  try {
    if (argv.length === 1 && ["--help", "-h"].includes(argv[0]!)) {
      console.log(USAGE);
      return 0;
    }
    let workspace: string | undefined;
    let apply = false;
    let breakStaleVerified = false;
    const seen = new Set<string>();
    for (let index = 0; index < argv.length; index++) {
      const flag = argv[index]!;
      if (seen.has(flag)) throw new Error("entrypoints.invalid_arguments");
      seen.add(flag);
      if (flag === "--apply") apply = true;
      else if (flag === "--break-stale-verified") breakStaleVerified = true;
      else if (flag === "--json") continue;
      else if (flag === "--workspace" && argv[index + 1] && !argv[index + 1]!.startsWith("--")) workspace = argv[++index];
      else throw new Error("entrypoints.invalid_arguments");
    }
    if (!workspace) throw new Error("entrypoints.workspace_required");
    const resolved = resolveCliWorkspace(workspace);
    if (!resolved.ok) throw new Error("entrypoints.workspace_unavailable");
    const report = refreshWorkspaceGuidance(resolved.path, apply, breakStaleVerified);
    const ok = !["modified", "unsafe"].includes(report.status);
    if (json) console.log(JSON.stringify({ ok, ...report }));
    else {
      console.log(`Startup guidance: ${report.status}${report.applied ? " (refresh applied)" : " (preview; no changes)"}.`);
      for (const file of report.files) console.log(`${file.file}: ${file.status}${file.reason ? ` — ${file.reason}` : ""}`);
      if (!ok) console.log("Reconcile the affected guide or unsafe path before retrying. App instructions were not replaced.");
      else if (!apply && report.changed) console.log("Use --apply to refresh only Brigade-owned guidance.");
    }
    return ok ? 0 : 1;
  } catch (error) {
    const reason =
      error instanceof Error && /^(entrypoints|business|composition|erasure)\.[a-z_]+(?::|$)/.test(error.message)
        ? error.message.split(":")[0]!
        : "entrypoints.refresh_failed";
    if (json) console.log(JSON.stringify({ ok: false, error: reason }));
    else console.error(`${reason}\n${USAGE}`);
    return 1;
  }
}

if (isMainModule(import.meta.url)) process.exitCode = main();
