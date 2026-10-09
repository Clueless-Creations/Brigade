import { discoverGates } from "../../catalog/gates.js";
import { loadProviderContracts } from "../../adapters/providers/load.js";
import { verifyGateArguments, type SelectedOperationBinding } from "../composition/compile-bindings.js";
import { spawnSync } from "node:child_process";
import path from "node:path";

import { buildAuditPlan, GATE_TIMEOUT_MS, stripAuditOnlyFlags } from "../../tooling/lib/audit-plan.js";
import { skillRoot } from "./reducer-cli.js";
import type { CompiledPlan, RunNodeId } from "../engine/compile.js";
import type { RunStateDocument } from "../schema/types.js";
import {
  REVENUE_ACCEPTANCE_EVIDENCE,
  canRefreshRevenueVerification,
  recordDeterministicVerification,
  requiresRevenueVerificationRefresh,
} from "../engine/verification.js";
import { reconcileEnvironmentalArtifacts, requestVerificationRepair } from "../engine/runstate.js";
import { workspaceArtifactFingerprint } from "../engine/review-evidence.js";

export interface GateOutcome {
  readonly allPassed: boolean;
  readonly evidence: string[];
  readonly issueCodes: string[];
  /** The failed gate emitted no typed issue, so no product judgment exists. */
  readonly unclassifiedFailure: boolean;
}

/**
 * Run a node's deterministic gates against one business workspace. Gate arguments come from the
 * canonical audit plan, and failures retain only typed issue codes plus bounded metadata.
 */
export interface GateBindingContext {
  gateArguments?: Record<string, string[]>;
  selectedOperation?: SelectedOperationBinding;
}
export function assertGateProviderBindings(gateIds: readonly string[], context: GateBindingContext, root: string): void {
  verifyGateArguments(gateIds, context.gateArguments, context.selectedOperation);
  if (!context.selectedOperation || !gateIds.includes("check:revenue")) return;
  const expected = context.selectedOperation.implementation.validationContract!;
  const loaded = loadProviderContracts(root);
  const matches = loaded.contracts.filter((entry) => entry.id === expected.id && entry.version === expected.version && entry.kind === expected.kind);
  if (loaded.issues.length || matches.length !== 1) throw new Error("binding.provider_validation_contract_unavailable");
}
export function runDeterministicGates(gateIds: readonly string[], workspaceDir: string, context: GateBindingContext = {}): GateOutcome {
  try {
    assertGateProviderBindings(gateIds, context, skillRoot());
  } catch {
    return { allPassed: false, evidence: [], issueCodes: ["gate.provider_binding_invalid"], unclassifiedFailure: false };
  }
  // Imported declarations select host gates; they cannot turn arbitrary package scripts into gates.
  // Preflight the complete set before starting even the first valid gate.
  const registered = new Set(discoverGates(skillRoot(), []).map((gate) => gate.command));
  if (gateIds.some((gate) => !registered.has(gate))) {
    return { allPassed: false, evidence: [], issueCodes: ["gate.unregistered_host_command"], unclassifiedFailure: false };
  }
  const planArgs = new Map(
    buildAuditPlan("repo", { businessRoot: path.resolve(workspaceDir), skillRoot: skillRoot() }).map((step) => [step.id, stripAuditOnlyFlags(step.args ?? [])]),
  );
  const evidence: string[] = [];
  const issueCodes: string[] = [];
  for (const gate of gateIds) {
    // Acceptance runs before the reducer-owned lane can claim success. Revenue's
    // ordinary inspection mode permits unfinished setup; it cannot accept a node.
    const gateArgs = [...(planArgs.get(gate) ?? []), ...(gate === "check:revenue" ? ["--require-done"] : []), ...(context.gateArguments?.[gate] ?? [])];
    const result = spawnSync("npm", ["run", "--prefix", skillRoot(), gate, ...(gateArgs && gateArgs.length > 0 ? ["--", ...gateArgs] : [])], {
      cwd: workspaceDir,
      encoding: "utf8",
      env: { ...process.env, BUSINESS_ROOT: workspaceDir },
      timeout: GATE_TIMEOUT_MS,
    });
    const passed = result.status === 0;
    const timedOut = !passed && (result.error as NodeJS.ErrnoException | undefined)?.code === "ETIMEDOUT";
    const outcome = passed ? "passed" : timedOut ? `timed out after ${GATE_TIMEOUT_MS / 1000}s` : `exit ${result.status ?? "spawn-error"}`;
    evidence.push(`gate:${gate}=${outcome}`);
    if (passed && gate === "check:revenue") evidence.push(REVENUE_ACCEPTANCE_EVIDENCE);
    if (!passed && typeof result.stdout === "string") {
      for (const match of result.stdout.matchAll(/^- ERROR ([a-z][a-z0-9_.-]+)/gim)) {
        const code = match[1];
        if (code && !issueCodes.includes(code)) issueCodes.push(code);
      }
      evidence.push(...issueCodes.map((code) => `gate_issue:${code}`));
    }
    if (!passed) {
      console.error(`session.deterministic_gate_${timedOut ? "timed_out" : "failed"} ${gate}: ${outcome}`);
      return { allPassed: false, evidence, issueCodes, unclassifiedFailure: issueCodes.length === 0 };
    }
  }
  return { allPassed: true, evidence, issueCodes, unclassifiedFailure: false };
}

/** Recheck pending legacy proof once through the existing gate/repair owners. Never replay an external action. */
export function refreshPendingRevenueVerification(
  plan: CompiledPlan,
  run: RunStateDocument,
  nodeId: RunNodeId,
  workspaceDir: string,
  now: string,
): "unchanged" | "refreshed" | "repair" {
  if (!requiresRevenueVerificationRefresh(plan, run, nodeId)) return "unchanged";
  const node = plan.nodes.find((candidate) => candidate.id === nodeId)!;
  const attempt = run.nodes[nodeId]!.attempts.at(-1)!;
  const stale = (): "repair" => {
    requestVerificationRepair(
      plan,
      run,
      nodeId,
      ["Revenue acceptance evidence changed. Preserve existing work, reconcile its current inputs and outputs, and rerun the required checks."],
      now,
    );
    return "repair";
  };
  if (!canRefreshRevenueVerification(plan, run, nodeId)) return stale();
  if (attempt.proofSource !== "synthetic") {
    try {
      // Environmental inputs retain their original fingerprint format. Reuse
      // their owner on a copy; output fingerprints cannot replace those hashes.
      const observed = structuredClone(run);
      reconcileEnvironmentalArtifacts(plan, observed, workspaceDir, now);
      for (const id of [...node.inputs, ...node.outputs]) {
        const binding = run.artifactBindings.find((candidate) => candidate.artifactId === id);
        if (!binding?.fingerprint) return stale();
        const outputFingerprint = workspaceArtifactFingerprint(workspaceDir, binding.path);
        const fingerprint =
          binding.producedBy === undefined ? observed.artifactBindings.find((candidate) => candidate.artifactId === id)?.fingerprint : outputFingerprint;
        if (fingerprint !== binding.fingerprint) return stale();
      }
    } catch {
      return stale();
    }
  }
  const outcome = runDeterministicGates(node.verification.gateIds, workspaceDir, {
    gateArguments: node.verification.gateArguments,
    selectedOperation: node.selectedOperation,
  });
  recordDeterministicVerification(plan, run, nodeId, outcome, now);
  if (outcome.allPassed) return "refreshed";
  requestVerificationRepair(plan, run, nodeId, outcome.evidence, now);
  return "repair";
}
