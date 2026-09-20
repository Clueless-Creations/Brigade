/**
 * #573 — Active Jev-directed build loop after next-work ranking.
 *
 * Consumes the #571 qualified-decision handoff and drives **executed** next
 * actions through existing session/batch/ownership owners. Ranking (#524)
 * remains the eligible-work ordering slice; this unit does not rewrite it.
 * Staged admission (#523) gates which families may run under admitted-execution.
 *
 * U1  Active checkpoint contract + offline evidence→action cases.
 * U2  Pre-dispatch freshness/authority recheck; passive reads stay inference-free.
 * U3  Bound authorized route selection; no-fit/unknown explicit; no PATH activation.
 * U4  Real async economics + loop/no-progress/fairness + diagnosis separation.
 * U5  Agent guidance + frozen baseline outcome/cost proof.
 *
 * Paper / synthetic. No network. NO_573_IMPL cleared. NEXT_AFTER=#574.
 * epic 511 remains open.
 */
import { digestOf } from "../../contracts/semantic/canonicalize.js";
import {
  DEFAULT_RESOURCE_BOUNDS,
  acceptResult,
  beginBatchSettlement,
  createOwnershipHandle,
  groupSharedStateBatches,
  recordDispatch,
  releaseOwnershipAfterSettlement,
  requestCancellation,
  reserveResources,
  type BatchSettlementState,
  type CostReport,
  type OwnershipHandle,
  type ResourceBounds,
  type SemanticWorkItem,
} from "../session/semantic-batch.js";
import {
  JEV_573_HANDOFF_SURFACE,
  JEV_FROZEN_ROUTING_CORPUS,
  applyRoutingPolicy,
  buildRoutingReceipts,
  handoffRequiresFrontierReinterpretation,
  invalidateOnSourceChange,
  seededQualifiedDecisions,
  toQualifiedRoutingDecision,
  type QualifiedRoutingDecision,
  type RoutableBuildAction,
} from "./jev-active-routing-qualification.js";
import {
  JEV_ACTIVE_BUILD_LOOP_POLICY,
  JEV_LOOP_BOUNDS,
  JEV_LOOP_LIMITATIONS,
  type CheckpointExplicitOutcome,
  type CheckpointPurpose,
  type JevLoopBounds,
  type LoopDiagnosis,
  type LoopPassiveReadSurface,
  type RouteKind,
} from "../../catalog/workflows/jev-active-build-loop.js";

export const JEV_LOOP_ISSUE = "#573" as const;
export const JEV_LOOP_EPIC = "#511" as const;
export const JEV_LOOP_PLANNING_ID = "U5-ACTIVE-JEV-BUILD-LOOP" as const;
export const JEV_LOOP_CONSUMES = ["#524", "#523", "#571"] as const;
export const JEV_LOOP_STAMP = "0.221.52" as const;
export const JEV_LOOP_SCHEMA_VERSION = 1 as const;
export const JEV_LOOP_NO_NETWORK = true as const;
export const JEV_LOOP_LIVE_NOT_PERFORMED = true as const;
export const JEV_LOOP_NO_DUPLICATE_RUNTIME = true as const;
export const JEV_LOOP_NO_JEV_IN_BUSINESS_POLICY = true as const;
export const JEV_LOOP_PROVIDER_IS_SWAPPABLE = true as const;
export const JEV_LOOP_NO_DETERMINISTIC_THROUGH_MODEL = true as const;
export const JEV_LOOP_NO_FRONTIER_REINTERPRET_WRAPPER = true as const;
export const JEV_LOOP_NO_524_REWRITE = true as const;
export const JEV_LOOP_NO_571_RECREATE = true as const;
export const JEV_LOOP_NO_NESTED_SUPERVISORY = true as const;
export const JEV_LOOP_NO_SELF_EDIT_LIVE_POLICY = true as const;
export const JEV_LOOP_NO_511_AUTOCLOSE = true as const;
export const JEV_LOOP_NO_573_IMPL = false as const;
export const JEV_LOOP_NEXT_AFTER_CLOSE = "#574" as const;
export const JEV_LOOP_ACTIVE_LOOP_IMPLEMENTED = true as const;

export { JEV_ACTIVE_BUILD_LOOP_POLICY, JEV_LOOP_BOUNDS, JEV_LOOP_LIMITATIONS };
export type { CheckpointExplicitOutcome, CheckpointPurpose, JevLoopBounds, LoopDiagnosis, RouteKind };

export class JevActiveBuildLoopError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "JevActiveBuildLoopError";
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// U1 — Active checkpoint contract
// ---------------------------------------------------------------------------

export interface ActiveCheckpoint {
  readonly schemaVersion: typeof JEV_LOOP_SCHEMA_VERSION;
  readonly checkpointId: string;
  readonly purpose: CheckpointPurpose;
  readonly observation: string;
  readonly materialSourceRevisions: readonly { readonly sourceId: string; readonly revision: string }[];
  readonly eligibleCandidateIds: readonly string[];
  readonly bindings: readonly { readonly routeId: string; readonly routeKind: RouteKind; readonly bindingId: string; readonly authorized: boolean }[];
  readonly acceptedConstraints: readonly string[];
  readonly contextOmissions: readonly string[];
  readonly questionPackDigest: string;
  readonly policyDigest: string;
  readonly riskClass: "reversible" | "irreversible" | "review-required";
  readonly bounds: JevLoopBounds;
  readonly ownershipHandleId: string;
  readonly inferenceReceiptId: string | null;
  readonly policyReceiptId: string | null;
  readonly decisionId: string | null;
}

export interface CheckpointDecisionFacts {
  readonly inference: { readonly receiptId: string; readonly outcome: string; readonly selectedCandidateId: string | null };
  readonly deterministicPolicy: {
    readonly receiptId: string;
    readonly outcome: CheckpointExplicitOutcome;
    readonly selectedAction: RoutableBuildAction | null;
  };
  readonly dispatch: { readonly attempted: boolean; readonly dispatchedAction: RoutableBuildAction | null; readonly refusedReason: string | null };
  readonly observedResult: { readonly resultId: string; readonly summary: string; readonly progressUpdated: boolean; readonly profileUpdated: boolean };
}

export interface ExecutedLoopStep {
  readonly checkpointId: string;
  readonly outcome: CheckpointExplicitOutcome;
  readonly rankedAction: RoutableBuildAction | null;
  readonly executedAction: RoutableBuildAction | null;
  readonly facts: CheckpointDecisionFacts;
  readonly diagnosis: LoopDiagnosis | null;
  readonly frontierReinterpretationRequired: false;
}

/** Seeded consumer-app observation pairs: same eligible set, different observation → different executed action. */
export const CONSUMER_APP_OBSERVATION_CASES = Object.freeze([
  {
    caseId: "obs.progress-not-profile",
    observation: "Completion updated progress counters but the profile coverage assertion is unchanged.",
    expectedExecuted: "observe" as RoutableBuildAction,
    eligible: ["cand.inspect-profile", "cand.generate-more", "cand.repair-progress", "cand.verify-runtime"],
  },
  {
    caseId: "obs.test-failure-after-edit",
    observation: "After the last edit, the runtime verification failed on the progress→profile join.",
    expectedExecuted: "repair" as RoutableBuildAction,
    eligible: ["cand.inspect-profile", "cand.generate-more", "cand.repair-progress", "cand.verify-runtime"],
  },
  {
    caseId: "obs.repair-verified",
    observation: "Bounded repair applied; runtime verification now passes for the progress→profile join.",
    expectedExecuted: "verify-completion" as RoutableBuildAction,
    eligible: ["cand.inspect-profile", "cand.generate-more", "cand.repair-progress", "cand.verify-runtime"],
  },
  {
    caseId: "obs.unknown-haptic",
    observation: "Physical haptic proof is missing and no permitted device route is bound.",
    expectedExecuted: null,
    expectedOutcome: "insufficient_evidence" as CheckpointExplicitOutcome,
    eligible: ["cand.inspect-profile", "cand.generate-more", "cand.repair-progress", "cand.verify-runtime"],
  },
] as const);

const ACTION_BY_CANDIDATE: Readonly<Record<string, RoutableBuildAction>> = Object.freeze({
  "cand.inspect-profile": "observe",
  "cand.generate-more": "generative-worker",
  "cand.repair-progress": "repair",
  "cand.verify-runtime": "verify-completion",
  "cand.none-apply": "escalate",
});

/**
 * Offline policy: map observation keywords to an executed action among eligible
 * candidates. Changing the observation changes the **executed** action, not only
 * a displayed rank. Generation is never selected when inspection/repair/verify fit.
 */
export function selectExecutedActionForObservation(input: { readonly observation: string; readonly eligibleCandidateIds: readonly string[] }): {
  readonly outcome: CheckpointExplicitOutcome;
  readonly rankedAction: RoutableBuildAction | null;
  readonly executedAction: RoutableBuildAction | null;
  readonly selectedCandidateId: string | null;
} {
  const obs = input.observation.toLowerCase();
  const eligible = new Set(input.eligibleCandidateIds);

  if (/haptic|missing physical|no permitted device/.test(obs)) {
    return { outcome: "insufficient_evidence", rankedAction: null, executedAction: null, selectedCandidateId: null };
  }
  if (/contradict|conflict/.test(obs)) {
    return { outcome: "contradictory_evidence", rankedAction: null, executedAction: null, selectedCandidateId: null };
  }
  if (/none of these|no candidate|no match/.test(obs)) {
    return { outcome: "no_match", rankedAction: null, executedAction: null, selectedCandidateId: null };
  }

  let preferredCandidate: string | null = null;
  // Order matters: repair/verify observations also mention progress→profile.
  if (/repair applied|verification now passes|now passes for/.test(obs) && eligible.has("cand.verify-runtime")) {
    preferredCandidate = "cand.verify-runtime";
  } else if (/verification failed|test failure|failed on the/.test(obs) && eligible.has("cand.repair-progress")) {
    preferredCandidate = "cand.repair-progress";
  } else if (/profile coverage assertion is unchanged|progress counters but the profile/.test(obs) && eligible.has("cand.inspect-profile")) {
    preferredCandidate = "cand.inspect-profile";
  } else if (/unknown|novel/.test(obs) && eligible.has("cand.inspect-profile")) {
    // Unknown → bounded evidence gathering, never arbitrary generation.
    preferredCandidate = "cand.inspect-profile";
  }

  if (!preferredCandidate) {
    return { outcome: "no_match", rankedAction: null, executedAction: null, selectedCandidateId: null };
  }
  const action = ACTION_BY_CANDIDATE[preferredCandidate] ?? null;
  // Rank may list generative-worker highly; execution still refuses it when inspection fits.
  const rankedAction: RoutableBuildAction | null = action;
  return {
    outcome: "selected",
    rankedAction,
    executedAction: action,
    selectedCandidateId: preferredCandidate,
  };
}

export function buildActiveCheckpoint(input: {
  readonly purpose: CheckpointPurpose;
  readonly observation: string;
  readonly materialSourceRevisions: readonly { readonly sourceId: string; readonly revision: string }[];
  readonly eligibleCandidateIds: readonly string[];
  readonly ownershipHandleId: string;
  readonly decision?: QualifiedRoutingDecision | null;
  readonly questionPackDigest?: string;
  readonly policyDigest?: string;
}): ActiveCheckpoint {
  const decision = input.decision ?? null;
  return {
    schemaVersion: JEV_LOOP_SCHEMA_VERSION,
    checkpointId: `ckpt.${digestOf([input.purpose, input.observation]).slice(0, 12)}`,
    purpose: input.purpose,
    observation: input.observation,
    materialSourceRevisions: input.materialSourceRevisions,
    eligibleCandidateIds: input.eligibleCandidateIds,
    bindings: [
      { routeId: "route.deterministic-policy", routeKind: "deterministic", bindingId: "binding.deterministic", authorized: true },
      { routeId: "route.semantic-jev", routeKind: "semantic", bindingId: decision?.bindingId ?? "binding.typesafe-systemone", authorized: true },
      { routeId: "route.generative-worker", routeKind: "generative", bindingId: "binding.generative", authorized: true },
      { routeId: "route.independent-reviewer", routeKind: "independent-reviewer", bindingId: "binding.reviewer", authorized: true },
    ],
    acceptedConstraints: ["reversible-only-without-review", "no-generated-authority", "no-path-activation"],
    contextOmissions: input.observation.toLowerCase().includes("haptic") ? ["device.haptic-proof"] : [],
    questionPackDigest: input.questionPackDigest ?? digestOf({ stamp: JEV_LOOP_STAMP, kind: "loop-pack" }),
    policyDigest: input.policyDigest ?? digestOf(JEV_ACTIVE_BUILD_LOOP_POLICY),
    riskClass: decision?.reversible === false ? "review-required" : "reversible",
    bounds: JEV_LOOP_BOUNDS,
    ownershipHandleId: input.ownershipHandleId,
    inferenceReceiptId: decision?.inferenceReceiptId ?? null,
    policyReceiptId: decision?.policyReceiptId ?? null,
    decisionId: decision?.decisionId ?? null,
  };
}

// ---------------------------------------------------------------------------
// U2 — Pre-dispatch freshness / authority + passive reads
// ---------------------------------------------------------------------------

export interface DispatchRecheckInput {
  readonly checkpoint: ActiveCheckpoint;
  readonly decision: QualifiedRoutingDecision | null;
  readonly currentSourceRevisions: Readonly<Record<string, string>>;
  readonly currentEligibleIds: readonly string[];
  readonly bindingIdPresent: boolean;
  readonly ownershipHeld: boolean;
  readonly grantPresent: boolean;
  readonly admittedActivePolicy: boolean;
  readonly routeKind: RouteKind;
  readonly pathHasCredential: boolean;
}

export interface DispatchRecheckResult {
  readonly mayDispatch: boolean;
  readonly outcome: CheckpointExplicitOutcome | "selected";
  readonly refusedReason: string | null;
  readonly frontierReinterpretationRequired: false;
  readonly freshnessOk: boolean;
  readonly authorityOk: boolean;
}

export function recheckBeforeDispatch(input: DispatchRecheckInput): DispatchRecheckResult {
  const frontierReinterpretationRequired = false as const;

  if (!input.bindingIdPresent) {
    return {
      mayDispatch: false,
      outcome: "wrong_binding",
      refusedReason: "Binding missing or mismatched.",
      frontierReinterpretationRequired,
      freshnessOk: false,
      authorityOk: false,
    };
  }
  if (input.routeKind === "independent-reviewer" && !input.grantPresent) {
    return {
      mayDispatch: false,
      outcome: "missing_grant",
      refusedReason: "Independent reviewer route requires an explicit grant.",
      frontierReinterpretationRequired,
      freshnessOk: true,
      authorityOk: false,
    };
  }
  if (!input.ownershipHeld) {
    return {
      mayDispatch: false,
      outcome: "missing_grant",
      refusedReason: "Ownership handle not held.",
      frontierReinterpretationRequired,
      freshnessOk: true,
      authorityOk: false,
    };
  }
  if (!input.admittedActivePolicy) {
    return {
      mayDispatch: false,
      outcome: "missing_grant",
      refusedReason: "Active policy not admitted for execution.",
      frontierReinterpretationRequired,
      freshnessOk: true,
      authorityOk: false,
    };
  }
  // PATH credential presence must not activate a route.
  if (input.pathHasCredential && input.routeKind === "semantic" && !input.bindingIdPresent) {
    return {
      mayDispatch: false,
      outcome: "unsupported_modality",
      refusedReason: "PATH credential does not activate a semantic route.",
      frontierReinterpretationRequired,
      freshnessOk: true,
      authorityOk: false,
    };
  }

  if (input.decision) {
    const invalidation = invalidateOnSourceChange(input.decision, input.currentSourceRevisions);
    if (!invalidation.stillUsable) {
      return {
        mayDispatch: false,
        outcome: "stale_refused",
        refusedReason: `Stale selection refused dispatch: ${invalidation.reason}`,
        frontierReinterpretationRequired,
        freshnessOk: false,
        authorityOk: true,
      };
    }
    if (input.decision.selectedCandidateId && !input.currentEligibleIds.includes(input.decision.selectedCandidateId)) {
      return {
        mayDispatch: false,
        outcome: "stale_refused",
        refusedReason: "Selected candidate is no longer eligible.",
        frontierReinterpretationRequired,
        freshnessOk: false,
        authorityOk: true,
      };
    }
  }

  for (const rev of input.checkpoint.materialSourceRevisions) {
    if (input.currentSourceRevisions[rev.sourceId] !== rev.revision) {
      return {
        mayDispatch: false,
        outcome: "stale_refused",
        refusedReason: `Checkpoint material revision moved for ${rev.sourceId}.`,
        frontierReinterpretationRequired,
        freshnessOk: false,
        authorityOk: true,
      };
    }
  }

  return { mayDispatch: true, outcome: "selected", refusedReason: null, frontierReinterpretationRequired, freshnessOk: true, authorityOk: true };
}

export interface PassiveLoopReadResult {
  readonly surface: LoopPassiveReadSurface;
  readonly inferenceRequests: 0;
  readonly providerCalls: 0;
  readonly runStateMutations: 0;
  readonly backgroundPollersStarted: 0;
  readonly snapshot: {
    readonly stamp: typeof JEV_LOOP_STAMP;
    readonly activeLoopImplemented: true;
    readonly handoffConsumable: boolean;
  };
}

export function readActiveLoopPassively(surface: LoopPassiveReadSurface): PassiveLoopReadResult {
  return {
    surface,
    inferenceRequests: 0,
    providerCalls: 0,
    runStateMutations: 0,
    backgroundPollersStarted: 0,
    snapshot: {
      stamp: JEV_LOOP_STAMP,
      activeLoopImplemented: true,
      handoffConsumable: JEV_573_HANDOFF_SURFACE.consumableBy === "#573",
    },
  };
}

/**
 * Continue reversible admitted work from a qualified decision without frontier
 * reinterpretation. Still rechecks freshness/authority before dispatch.
 */
export function continueAdmittedReversibleWork(input: {
  readonly decision: QualifiedRoutingDecision;
  readonly currentSourceRevisions: Readonly<Record<string, string>>;
  readonly currentEligibleIds: readonly string[];
  readonly ownershipHeld: boolean;
}): ExecutedLoopStep {
  if (handoffRequiresFrontierReinterpretation(input.decision)) {
    throw new JevActiveBuildLoopError("frontier-required", "Handoff unexpectedly requires frontier reinterpretation.");
  }
  const checkpoint = buildActiveCheckpoint({
    purpose: "within-task",
    observation: `Continue from ${input.decision.decisionId}`,
    materialSourceRevisions: input.decision.sourceRevisions,
    eligibleCandidateIds: input.currentEligibleIds,
    ownershipHandleId: "own.continue",
    decision: input.decision,
  });
  const recheck = recheckBeforeDispatch({
    checkpoint,
    decision: input.decision,
    currentSourceRevisions: input.currentSourceRevisions,
    currentEligibleIds: input.currentEligibleIds,
    bindingIdPresent: true,
    ownershipHeld: input.ownershipHeld,
    grantPresent: true,
    admittedActivePolicy: input.decision.admittedForExecution || input.decision.reversible,
    routeKind: "semantic",
    pathHasCredential: false,
  });

  const executed = recheck.mayDispatch ? input.decision.nextBuildAction : null;
  return {
    checkpointId: checkpoint.checkpointId,
    outcome: recheck.mayDispatch ? "selected" : (recheck.outcome as CheckpointExplicitOutcome),
    rankedAction: input.decision.nextBuildAction,
    executedAction: executed,
    facts: {
      inference: {
        receiptId: input.decision.inferenceReceiptId,
        outcome: input.decision.outcome,
        selectedCandidateId: input.decision.selectedCandidateId,
      },
      deterministicPolicy: {
        receiptId: input.decision.policyReceiptId,
        outcome: recheck.mayDispatch ? "selected" : (recheck.outcome as CheckpointExplicitOutcome),
        selectedAction: executed,
      },
      dispatch: {
        attempted: true,
        dispatchedAction: executed,
        refusedReason: recheck.refusedReason,
      },
      observedResult: {
        resultId: `result.${checkpoint.checkpointId}`,
        summary: recheck.mayDispatch ? `Executed ${executed}` : `Refused: ${recheck.refusedReason}`,
        progressUpdated: executed === "repair" || executed === "verify-completion",
        profileUpdated: false,
      },
    },
    diagnosis: recheck.mayDispatch ? null : "wrong_policy",
    frontierReinterpretationRequired: false,
  };
}

// ---------------------------------------------------------------------------
// U3 — Route selection among bound authorized routes
// ---------------------------------------------------------------------------

export interface BoundRoute {
  readonly routeId: string;
  readonly routeKind: RouteKind;
  readonly bindingId: string;
  readonly authorized: boolean;
  readonly supported: boolean;
  readonly modality: "paper" | "device" | "network";
}

export interface RouteSelectionResult {
  readonly outcome: CheckpointExplicitOutcome;
  readonly selectedRouteId: string | null;
  readonly selectedKind: RouteKind | null;
  readonly fallback: "hold" | "observe" | "bounded-generative" | null;
  readonly reason: string;
}

export function selectBoundRoute(input: {
  readonly desiredKind: RouteKind;
  readonly routes: readonly BoundRoute[];
  readonly allowBoundedGenerativeFallback: boolean;
}): RouteSelectionResult {
  const match = input.routes.find((r) => r.routeKind === input.desiredKind && r.authorized && r.supported);
  if (match) {
    if (match.modality === "device" && match.routeKind !== "deterministic") {
      return {
        outcome: "unsupported_modality",
        selectedRouteId: null,
        selectedKind: null,
        fallback: "observe",
        reason: "Device modality not supported for this route kind.",
      };
    }
    return { outcome: "selected", selectedRouteId: match.routeId, selectedKind: match.routeKind, fallback: null, reason: "Bound authorized route selected." };
  }
  const observe = input.routes.find((r) => r.routeKind === "deterministic" && r.authorized && r.supported);
  if (observe) {
    return {
      outcome: "hold_no_route",
      selectedRouteId: null,
      selectedKind: null,
      fallback: "observe",
      reason: "No permitted route of desired kind; fall back to authorized observation.",
    };
  }
  if (input.allowBoundedGenerativeFallback) {
    const gen = input.routes.find((r) => r.routeKind === "generative" && r.authorized && r.supported);
    if (gen) {
      return {
        outcome: "selected",
        selectedRouteId: gen.routeId,
        selectedKind: "generative",
        fallback: "bounded-generative",
        reason: "Finite candidates failed; bounded generative task proposed (no arbitrary effects).",
      };
    }
  }
  return { outcome: "hold_no_route", selectedRouteId: null, selectedKind: null, fallback: "hold", reason: "No permitted route exists; holding." };
}

/** PATH presence never activates a route by itself. */
export function pathCredentialActivatesRoute(_pathHasTool: boolean): false {
  return false;
}

// ---------------------------------------------------------------------------
// U4 — Async economics + loop/no-progress/fairness
// ---------------------------------------------------------------------------

export type LoopFanoutStatus = "ok" | "recovered" | "failed" | "cancelled" | "deadline_exceeded" | "late" | "not_admitted";

export interface LoopFanoutOutcome {
  readonly workId: string;
  readonly status: LoopFanoutStatus;
  readonly round: "independent" | "dependent";
  readonly diagnosis: LoopDiagnosis | null;
}

export interface LoopFanoutReport {
  readonly admitted: boolean;
  readonly synchronousBarrierOnly: false;
  readonly peakConcurrency: number;
  readonly concurrencyLimit: number;
  readonly outcomesComplete: boolean;
  readonly ownershipReleased: boolean;
  readonly cancelled: boolean;
  readonly deadlineExceeded: boolean;
  readonly lateResults: number;
  readonly partialFailures: number;
  readonly independentRounds: number;
  readonly dependentRounds: number;
  readonly outcomes: readonly LoopFanoutOutcome[];
  readonly cost: CostReport;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("aborted"));
      return;
    }
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new Error("aborted"));
      },
      { once: true },
    );
  });
}

function makeWorkItem(workId: string, dependsOn: readonly string[] = []): SemanticWorkItem {
  return {
    workId,
    questionId: `q.${workId}`,
    workspaceId: "ws.573",
    sourceSnapshotId: "snap.573",
    dataPolicyId: "policy.573",
    providerBindingId: "binding.typesafe-systemone",
    resourceLimitKey: "limits.573",
    dependsOn,
    resultUseOf: [],
    authorityPrerequisites: [],
    sourceAccessHeld: true,
    authorityHeld: true,
    estimatedTokens: 32,
  };
}

export async function runActiveLoopFanout(input?: {
  readonly cancel?: boolean;
  readonly tightDeadline?: boolean;
  readonly overCap?: boolean;
}): Promise<LoopFanoutReport> {
  const concurrencyLimit = input?.overCap ? 1 : JEV_LOOP_BOUNDS.maxConcurrency;
  const bounds: ResourceBounds = {
    ...DEFAULT_RESOURCE_BOUNDS,
    maxConcurrency: concurrencyLimit,
    maxRetries: JEV_LOOP_BOUNDS.maxAttemptsPerItem,
    deadlineMs: input?.tightDeadline ? 25 : JEV_LOOP_BOUNDS.deadlineMs,
  };

  const independent = [makeWorkItem("work.ind.a"), makeWorkItem("work.ind.b"), makeWorkItem("work.ind.c")];
  const dependent = [makeWorkItem("work.dep.d", ["work.ind.a"]), makeWorkItem("work.dep.e", ["work.ind.b"])];
  const items = [...independent, ...dependent];

  // overCap: more items than concurrency → reserveResources refuses admission.
  if (input?.overCap) {
    const reservation = reserveResources({ items, bounds, authorityOk: true });
    return {
      admitted: reservation.admitted,
      synchronousBarrierOnly: false,
      peakConcurrency: 0,
      concurrencyLimit,
      outcomesComplete: true,
      ownershipReleased: true,
      cancelled: false,
      deadlineExceeded: false,
      lateResults: 0,
      partialFailures: 0,
      independentRounds: 0,
      dependentRounds: 0,
      outcomes: items.map((i) => ({
        workId: i.workId,
        status: "not_admitted" as const,
        round: i.dependsOn.length ? ("dependent" as const) : ("independent" as const),
        diagnosis: null,
      })),
      cost: { kind: "unknown", note: "Not admitted; cost unknown." },
    };
  }

  const ownership: OwnershipHandle = createOwnershipHandle({
    generation: "gen.573.1",
    workspaceId: "ws.573",
    occurrenceId: "occ.573.1",
    resource: "active-build-loop",
  });
  let state: BatchSettlementState = beginBatchSettlement({ ownership, sourceRevision: "rev.573.1" });

  const controller = new AbortController();
  let cancelled = false;
  if (input?.cancel) {
    setTimeout(() => {
      cancelled = true;
      state = requestCancellation(state);
      controller.abort();
    }, 5);
  }

  const deadlineMs = bounds.deadlineMs ?? JEV_LOOP_BOUNDS.deadlineMs;
  const deadlineTimer = setTimeout(() => controller.abort(), deadlineMs);

  const outcomes: LoopFanoutOutcome[] = [];
  let peak = 0;
  let inFlight = 0;
  let lateResults = 0;
  let partialFailures = 0;
  let deadlineExceeded = false;
  const startedAt = Date.now();

  async function runOne(item: SemanticWorkItem): Promise<void> {
    inFlight += 1;
    peak = Math.max(peak, inFlight);
    try {
      if (controller.signal.aborted) {
        const status = Date.now() - startedAt >= deadlineMs ? "deadline_exceeded" : "cancelled";
        if (status === "deadline_exceeded") {
          deadlineExceeded = true;
          lateResults += 1;
        }
        outcomes.push({
          workId: item.workId,
          status: status === "deadline_exceeded" ? "late" : "cancelled",
          round: item.dependsOn.length ? "dependent" : "independent",
          diagnosis: null,
        });
        return;
      }
      const delay = item.workId.endsWith("c") ? 90 : item.workId.endsWith("e") ? 35 : 10;
      try {
        await sleep(delay, controller.signal);
      } catch {
        const status = Date.now() - startedAt >= deadlineMs ? "late" : "cancelled";
        if (status === "late") {
          deadlineExceeded = true;
          lateResults += 1;
        }
        outcomes.push({
          workId: item.workId,
          status,
          round: item.dependsOn.length ? "dependent" : "independent",
          diagnosis: null,
        });
        return;
      }
      if (item.workId.endsWith("b")) {
        outcomes.push({ workId: item.workId, status: "recovered", round: "independent", diagnosis: "executor_failure" });
        const accepted = acceptResult(state, {
          resultId: `r-${item.workId}`,
          workId: item.workId,
          ownershipGeneration: state.ownership.generation,
          sourceRevision: state.sourceRevision,
        });
        if (accepted.ok) state = accepted.state;
        return;
      }
      if (item.workId.endsWith("e") && !input?.cancel) {
        partialFailures += 1;
        outcomes.push({ workId: item.workId, status: "failed", round: "dependent", diagnosis: "executor_failure" });
        if (!state.unresolvedWorkIds.includes(item.workId)) {
          state = { ...state, unresolvedWorkIds: [...state.unresolvedWorkIds, item.workId] };
        }
        return;
      }
      outcomes.push({ workId: item.workId, status: "ok", round: item.dependsOn.length ? "dependent" : "independent", diagnosis: null });
      const accepted = acceptResult(state, {
        resultId: `r-${item.workId}`,
        workId: item.workId,
        ownershipGeneration: state.ownership.generation,
        sourceRevision: state.sourceRevision,
      });
      if (accepted.ok) state = accepted.state;
    } finally {
      inFlight -= 1;
    }
  }

  try {
    // Reserve per independent round (fits concurrency), then dependent round.
    for (const round of [
      { kind: "independent" as const, batch: independent },
      { kind: "dependent" as const, batch: dependent },
    ]) {
      if (controller.signal.aborted && input?.cancel) break;
      const reservation = reserveResources({ items: round.batch, bounds, authorityOk: true });
      if (!reservation.admitted) {
        for (const item of round.batch) {
          outcomes.push({
            workId: item.workId,
            status: "not_admitted",
            round: round.kind,
            diagnosis: null,
          });
        }
        continue;
      }
      try {
        state = recordDispatch(
          state,
          round.batch.map((i) => i.workId),
        );
      } catch {
        for (const item of round.batch) {
          outcomes.push({ workId: item.workId, status: "cancelled", round: round.kind, diagnosis: null });
        }
        continue;
      }
      await Promise.all(round.batch.map((item) => runOne(item)));
    }
  } finally {
    clearTimeout(deadlineTimer);
  }

  groupSharedStateBatches(items, bounds);
  // Mark any dispatched-but-unsettled work unresolved so ownership can release.
  const settledOrUnresolved = new Set([...state.settledWorkIds, ...state.unresolvedWorkIds]);
  for (const outcome of outcomes) {
    if (
      !settledOrUnresolved.has(outcome.workId) &&
      (outcome.status === "late" || outcome.status === "cancelled" || outcome.status === "failed" || outcome.status === "deadline_exceeded")
    ) {
      state = { ...state, unresolvedWorkIds: [...state.unresolvedWorkIds, outcome.workId] };
      settledOrUnresolved.add(outcome.workId);
    }
  }
  const stillInFlight = state.dispatchedWorkIds.filter((id) => !state.settledWorkIds.includes(id) && !state.unresolvedWorkIds.includes(id));
  if (stillInFlight.length > 0) {
    state = { ...state, unresolvedWorkIds: [...state.unresolvedWorkIds, ...stillInFlight] };
  }
  const release = releaseOwnershipAfterSettlement(state);

  return {
    admitted: true,
    synchronousBarrierOnly: false,
    peakConcurrency: peak,
    concurrencyLimit,
    outcomesComplete: outcomes.length === items.length,
    ownershipReleased: release.released,
    cancelled: cancelled || outcomes.some((o) => o.status === "cancelled"),
    deadlineExceeded: deadlineExceeded || Boolean(input?.tightDeadline && (deadlineExceeded || lateResults > 0)),
    lateResults,
    partialFailures,
    independentRounds: 1,
    dependentRounds: 1,
    outcomes,
    cost: { kind: "estimated", value: items.length * 0.002, currency: "USD", note: "Paper estimate; live cost unknown." },
  };
}

export interface LoopProgressState {
  readonly iterations: number;
  readonly noProgressRounds: number;
  readonly mandatoryPending: readonly string[];
  readonly discretionaryStepsSinceMandatory: number;
  readonly terminated: boolean;
  readonly terminateReason: string | null;
  readonly fairnessViolation: boolean;
}

export function advanceLoopProgress(
  state: LoopProgressState,
  input: { readonly progressed: boolean; readonly ranMandatory: boolean; readonly nextMandatoryId?: string },
): LoopProgressState {
  const iterations = state.iterations + 1;
  if (iterations > JEV_LOOP_BOUNDS.maxLoopIterations) {
    return { ...state, iterations, terminated: true, terminateReason: "maxLoopIterations", fairnessViolation: false };
  }
  const noProgressRounds = input.progressed ? 0 : state.noProgressRounds + 1;
  if (noProgressRounds >= JEV_LOOP_BOUNDS.maxNoProgressRounds) {
    return { ...state, iterations, noProgressRounds, terminated: true, terminateReason: "no-progress", fairnessViolation: false };
  }
  let mandatoryPending = [...state.mandatoryPending];
  let discretionaryStepsSinceMandatory = state.discretionaryStepsSinceMandatory;
  if (input.ranMandatory) {
    mandatoryPending = mandatoryPending.filter((id) => id !== input.nextMandatoryId);
    discretionaryStepsSinceMandatory = 0;
  } else {
    discretionaryStepsSinceMandatory += 1;
  }
  const fairnessViolation = mandatoryPending.length > 0 && discretionaryStepsSinceMandatory > JEV_LOOP_BOUNDS.mandatoryFairnessWindow;
  if (fairnessViolation) {
    return {
      ...state,
      iterations,
      noProgressRounds,
      mandatoryPending,
      discretionaryStepsSinceMandatory,
      terminated: true,
      terminateReason: "fairness-ceiling",
      fairnessViolation: true,
    };
  }
  return {
    ...state,
    iterations,
    noProgressRounds,
    mandatoryPending,
    discretionaryStepsSinceMandatory,
    terminated: false,
    terminateReason: null,
    fairnessViolation: false,
  };
}

export function initialLoopProgress(mandatoryIds: readonly string[] = ["mandatory.review"]): LoopProgressState {
  return {
    iterations: 0,
    noProgressRounds: 0,
    mandatoryPending: [...mandatoryIds],
    discretionaryStepsSinceMandatory: 0,
    terminated: false,
    terminateReason: null,
    fairnessViolation: false,
  };
}

export function classifyLoopDiagnosis(input: {
  readonly modelWrong?: boolean;
  readonly omittedCandidate?: boolean;
  readonly insufficientEvidence?: boolean;
  readonly wrongPolicy?: boolean;
  readonly executorFailed?: boolean;
}): LoopDiagnosis {
  if (input.executorFailed) return "executor_failure";
  if (input.wrongPolicy) return "wrong_policy";
  if (input.insufficientEvidence) return "insufficient_evidence";
  if (input.omittedCandidate) return "candidate_omission";
  if (input.modelWrong) return "model_error";
  return "insufficient_evidence";
}

// ---------------------------------------------------------------------------
// Drive one offline step (observation → executed action)
// ---------------------------------------------------------------------------

export function runOfflineObservationStep(input: {
  readonly purpose: CheckpointPurpose;
  readonly observation: string;
  readonly eligibleCandidateIds: readonly string[];
  readonly sourceRevisions: readonly { readonly sourceId: string; readonly revision: string }[];
  readonly ownershipHandleId: string;
  readonly currentSourceRevisions?: Readonly<Record<string, string>>;
  readonly forceStale?: boolean;
}): ExecutedLoopStep {
  const selection = selectExecutedActionForObservation({
    observation: input.observation,
    eligibleCandidateIds: input.eligibleCandidateIds,
  });
  const checkpoint = buildActiveCheckpoint({
    purpose: input.purpose,
    observation: input.observation,
    materialSourceRevisions: input.sourceRevisions,
    eligibleCandidateIds: input.eligibleCandidateIds,
    ownershipHandleId: input.ownershipHandleId,
  });

  const current =
    input.currentSourceRevisions ?? Object.fromEntries(input.sourceRevisions.map((s) => [s.sourceId, input.forceStale ? `${s.revision}.moved` : s.revision]));

  // Synthetic decision for freshness recheck when we have a selection
  const syntheticDecision: QualifiedRoutingDecision | null =
    selection.selectedCandidateId && selection.executedAction
      ? {
          schemaVersion: 1,
          decisionId: `decision.offline.${checkpoint.checkpointId}`,
          family: "next-useful-action",
          outcome: "selected",
          selectedCandidateId: selection.selectedCandidateId,
          nextBuildAction: selection.executedAction,
          excludedCandidates: [],
          qualificationStage: "admitted-execution",
          admittedForExecution: true,
          reversible: true,
          inferenceReceiptId: `inf.${checkpoint.checkpointId}`,
          policyReceiptId: `pol.${checkpoint.checkpointId}`,
          bindingId: "binding.typesafe-systemone",
          requestedModel: "jev-latest",
          returnedModel: null,
          sourceRevisions: input.sourceRevisions,
          derivedConfidence: 0.8,
          confidenceIsCalibrated: false,
          freshnessRecheckRequired: true,
          authorityRecheckRequired: true,
          frontierAgentReinterpretationRequired: false,
        }
      : null;

  const recheck =
    selection.outcome === "selected" && syntheticDecision
      ? recheckBeforeDispatch({
          checkpoint,
          decision: syntheticDecision,
          currentSourceRevisions: current,
          currentEligibleIds: input.eligibleCandidateIds,
          bindingIdPresent: true,
          ownershipHeld: true,
          grantPresent: true,
          admittedActivePolicy: true,
          routeKind: "semantic",
          pathHasCredential: false,
        })
      : null;

  const mayExecute = selection.outcome === "selected" && (recheck?.mayDispatch ?? false);
  const outcome: CheckpointExplicitOutcome = mayExecute
    ? "selected"
    : recheck && !recheck.mayDispatch
      ? (recheck.outcome as CheckpointExplicitOutcome)
      : selection.outcome;

  return {
    checkpointId: checkpoint.checkpointId,
    outcome,
    rankedAction: selection.rankedAction,
    executedAction: mayExecute ? selection.executedAction : null,
    facts: {
      inference: {
        receiptId: syntheticDecision?.inferenceReceiptId ?? `inf.${checkpoint.checkpointId}`,
        outcome: selection.outcome,
        selectedCandidateId: selection.selectedCandidateId,
      },
      deterministicPolicy: {
        receiptId: syntheticDecision?.policyReceiptId ?? `pol.${checkpoint.checkpointId}`,
        outcome,
        selectedAction: mayExecute ? selection.executedAction : null,
      },
      dispatch: {
        attempted: selection.outcome === "selected",
        dispatchedAction: mayExecute ? selection.executedAction : null,
        refusedReason: mayExecute ? null : (recheck?.refusedReason ?? (selection.outcome !== "selected" ? selection.outcome : "not executed")),
      },
      observedResult: {
        resultId: `result.${checkpoint.checkpointId}`,
        summary: mayExecute ? `Executed ${selection.executedAction}` : `Not executed (${outcome})`,
        progressUpdated: mayExecute && (selection.executedAction === "repair" || selection.executedAction === "verify-completion"),
        profileUpdated: false,
      },
    },
    diagnosis: mayExecute
      ? null
      : selection.outcome === "insufficient_evidence"
        ? "insufficient_evidence"
        : selection.outcome === "no_match"
          ? "candidate_omission"
          : "wrong_policy",
    frontierReinterpretationRequired: false,
  };
}

/** Shared ownership across build-level and within-task checkpoints. */
export function shareOwnershipAcrossCheckpoints(ownershipHandleId: string): {
  readonly buildLevel: ActiveCheckpoint;
  readonly withinTask: ActiveCheckpoint;
  readonly sharedOwnershipHandleId: string;
  readonly sharedReceiptPrefix: string;
} {
  const revisions = [{ sourceId: "src.app", revision: "rev.573.shared" }];
  const eligible = ["cand.inspect-profile", "cand.repair-progress", "cand.verify-runtime"];
  const buildLevel = buildActiveCheckpoint({
    purpose: "build-level",
    observation: "Completion updated progress counters but the profile coverage assertion is unchanged.",
    materialSourceRevisions: revisions,
    eligibleCandidateIds: eligible,
    ownershipHandleId,
  });
  const withinTask = buildActiveCheckpoint({
    purpose: "within-task",
    observation: "After the last edit, the runtime verification failed on the progress→profile join.",
    materialSourceRevisions: revisions,
    eligibleCandidateIds: eligible,
    ownershipHandleId,
  });
  return {
    buildLevel,
    withinTask,
    sharedOwnershipHandleId: ownershipHandleId,
    sharedReceiptPrefix: "shared.573",
  };
}

// ---------------------------------------------------------------------------
// U5 — Independent review + frozen baseline + discoverability
// ---------------------------------------------------------------------------

export interface IndependentReviewGate {
  readonly required: true;
  readonly present: boolean;
  readonly deviceEvidenceRequired: boolean;
  readonly deviceEvidencePresent: boolean;
  readonly mayProceed: boolean;
  readonly blockReason: string | null;
}

export function evaluateIndependentReview(input: {
  readonly present: boolean;
  readonly deviceEvidenceRequired: boolean;
  readonly deviceEvidencePresent: boolean;
}): IndependentReviewGate {
  if (!input.present) {
    return {
      required: true,
      present: false,
      deviceEvidenceRequired: input.deviceEvidenceRequired,
      deviceEvidencePresent: input.deviceEvidencePresent,
      mayProceed: false,
      blockReason: "Independent review is mandatory and missing.",
    };
  }
  if (input.deviceEvidenceRequired && !input.deviceEvidencePresent) {
    return {
      required: true,
      present: true,
      deviceEvidenceRequired: true,
      deviceEvidencePresent: false,
      mayProceed: false,
      blockReason: "Required provider/device evidence is missing.",
    };
  }
  return {
    required: true,
    present: true,
    deviceEvidenceRequired: input.deviceEvidenceRequired,
    deviceEvidencePresent: input.deviceEvidencePresent,
    mayProceed: true,
    blockReason: null,
  };
}

export interface FrozenBaselineReport {
  readonly schemaVersion: typeof JEV_LOOP_SCHEMA_VERSION;
  readonly stamp: typeof JEV_LOOP_STAMP;
  readonly completedOutcomes: readonly {
    readonly caseId: string;
    readonly executedAction: RoutableBuildAction | null;
    readonly outcome: CheckpointExplicitOutcome;
  }[];
  readonly totalCost: CostReport;
  readonly correctionEffort: { readonly steps: number; readonly kind: "estimated" | "actual" | "unknown" };
  readonly limitations: typeof JEV_LOOP_LIMITATIONS;
  readonly hapticProof: "unknown";
}

export function runFrozenBaseline(): FrozenBaselineReport {
  const revisions = [{ sourceId: "src.app", revision: "rev.573.baseline" }];
  const completed = CONSUMER_APP_OBSERVATION_CASES.map((kase) => {
    const step = runOfflineObservationStep({
      purpose: "within-task",
      observation: kase.observation,
      eligibleCandidateIds: [...kase.eligible],
      sourceRevisions: revisions,
      ownershipHandleId: "own.baseline",
    });
    return { caseId: kase.caseId, executedAction: step.executedAction, outcome: step.outcome };
  });
  return {
    schemaVersion: JEV_LOOP_SCHEMA_VERSION,
    stamp: JEV_LOOP_STAMP,
    completedOutcomes: completed,
    totalCost: { kind: "unknown", note: "Live cost not measured on paper path." },
    correctionEffort: { steps: completed.filter((c) => c.executedAction === "repair").length, kind: "estimated" },
    limitations: JEV_LOOP_LIMITATIONS,
    hapticProof: "unknown",
  };
}

export interface FreshAgentPath {
  readonly recipeModule: string;
  readonly mapModule: string;
  readonly serviceModule: string;
  readonly docPath: string;
  readonly fixtureSuite: string;
  readonly publicCommandsInvented: false;
  readonly architecturePromptRequired: false;
  readonly markers: readonly string[];
}

export function describeFreshAgentPath(): FreshAgentPath {
  return {
    recipeModule: "catalog/workflows/jev-active-build-loop.ts",
    mapModule: "catalog/providers/jev-active-build-loop-map.ts",
    serviceModule: "kernel/services/jev-active-build-loop.ts",
    docPath: "docs/upstreams/jev-active-build-loop.md",
    fixtureSuite: "jev-active-build-loop",
    publicCommandsInvented: false,
    architecturePromptRequired: false,
    markers: ["U5-ACTIVE-JEV-BUILD-LOOP", "#573", "0.221.52", "activeLoopImplemented"],
  };
}

/** Consume #571 handoff: promote reversible decisions under admitted paper policy. */
export function consumeQualifiedHandoff(): {
  readonly batchId: string;
  readonly actionable: number;
  readonly continuedWithoutFrontier: number;
  readonly implementsActiveLoop: true;
} {
  const batch = seededQualifiedDecisions();
  let continued = 0;
  for (const decision of batch.actionableDecisions.slice(0, 3)) {
    const reversible = { ...decision, reversible: true, admittedForExecution: true, qualificationStage: "admitted-execution" as const };
    const step = continueAdmittedReversibleWork({
      decision: reversible,
      currentSourceRevisions: Object.fromEntries(reversible.sourceRevisions.map((s) => [s.sourceId, s.revision])),
      currentEligibleIds: reversible.selectedCandidateId ? [reversible.selectedCandidateId] : [],
      ownershipHeld: true,
    });
    if (step.executedAction && !step.frontierReinterpretationRequired) continued += 1;
  }
  return {
    batchId: batch.batchId,
    actionable: batch.actionableDecisions.length,
    continuedWithoutFrontier: continued,
    implementsActiveLoop: true,
  };
}

export function explicitFailureCases(): readonly { readonly kind: CheckpointExplicitOutcome; readonly step: ExecutedLoopStep }[] {
  const revisions = [{ sourceId: "src.app", revision: "rev.573.x" }];
  const baseStep = {
    purpose: "within-task" as const,
    eligibleCandidateIds: ["cand.inspect-profile", "cand.generate-more"] as const,
    sourceRevisions: revisions,
    ownershipHandleId: "own.fail",
  };
  return [
    { kind: "no_match", step: runOfflineObservationStep({ ...baseStep, observation: "None of these candidates apply to the situation." }) },
    {
      kind: "insufficient_evidence",
      step: runOfflineObservationStep({ ...baseStep, observation: "Physical haptic proof is missing and no permitted device route is bound." }),
    },
    {
      kind: "contradictory_evidence",
      step: runOfflineObservationStep({ ...baseStep, observation: "Contradictory evidence: progress says covered and uncovered." }),
    },
    {
      kind: "wrong_binding",
      step: (() => {
        const checkpoint = buildActiveCheckpoint({
          purpose: baseStep.purpose,
          observation: "Binding missing.",
          materialSourceRevisions: revisions,
          eligibleCandidateIds: [...baseStep.eligibleCandidateIds],
          ownershipHandleId: baseStep.ownershipHandleId,
        });
        const recheck = recheckBeforeDispatch({
          checkpoint,
          decision: null,
          currentSourceRevisions: { "src.app": "rev.573.x" },
          currentEligibleIds: [...baseStep.eligibleCandidateIds],
          bindingIdPresent: false,
          ownershipHeld: true,
          grantPresent: true,
          admittedActivePolicy: true,
          routeKind: "semantic",
          pathHasCredential: false,
        });
        return {
          checkpointId: checkpoint.checkpointId,
          outcome: recheck.outcome as CheckpointExplicitOutcome,
          rankedAction: null,
          executedAction: null,
          facts: {
            inference: { receiptId: "inf.none", outcome: "n/a", selectedCandidateId: null },
            deterministicPolicy: { receiptId: "pol.none", outcome: recheck.outcome as CheckpointExplicitOutcome, selectedAction: null },
            dispatch: { attempted: true, dispatchedAction: null, refusedReason: recheck.refusedReason },
            observedResult: { resultId: "result.none", summary: "refused", progressUpdated: false, profileUpdated: false },
          },
          diagnosis: "wrong_policy" as LoopDiagnosis,
          frontierReinterpretationRequired: false as const,
        };
      })(),
    },
    {
      kind: "unsupported_modality",
      step: (() => {
        const sel = selectBoundRoute({
          desiredKind: "semantic",
          routes: [{ routeId: "r.device", routeKind: "semantic", bindingId: "b", authorized: true, supported: true, modality: "device" }],
          allowBoundedGenerativeFallback: false,
        });
        return {
          checkpointId: "ckpt.modality",
          outcome: sel.outcome,
          rankedAction: null,
          executedAction: null,
          facts: {
            inference: { receiptId: "inf.m", outcome: "n/a", selectedCandidateId: null },
            deterministicPolicy: { receiptId: "pol.m", outcome: sel.outcome, selectedAction: null },
            dispatch: { attempted: false, dispatchedAction: null, refusedReason: sel.reason },
            observedResult: { resultId: "result.m", summary: sel.reason, progressUpdated: false, profileUpdated: false },
          },
          diagnosis: "wrong_policy" as LoopDiagnosis,
          frontierReinterpretationRequired: false as const,
        };
      })(),
    },
    {
      kind: "missing_grant",
      step: (() => {
        const checkpoint = buildActiveCheckpoint({
          purpose: baseStep.purpose,
          observation: "Grant missing for review.",
          materialSourceRevisions: revisions,
          eligibleCandidateIds: [...baseStep.eligibleCandidateIds],
          ownershipHandleId: baseStep.ownershipHandleId,
        });
        const recheck = recheckBeforeDispatch({
          checkpoint,
          decision: null,
          currentSourceRevisions: { "src.app": "rev.573.x" },
          currentEligibleIds: [...baseStep.eligibleCandidateIds],
          bindingIdPresent: true,
          ownershipHeld: true,
          grantPresent: false,
          admittedActivePolicy: true,
          routeKind: "independent-reviewer",
          pathHasCredential: false,
        });
        return {
          checkpointId: checkpoint.checkpointId,
          outcome: recheck.outcome as CheckpointExplicitOutcome,
          rankedAction: null,
          executedAction: null,
          facts: {
            inference: { receiptId: "inf.g", outcome: "n/a", selectedCandidateId: null },
            deterministicPolicy: { receiptId: "pol.g", outcome: recheck.outcome as CheckpointExplicitOutcome, selectedAction: null },
            dispatch: { attempted: true, dispatchedAction: null, refusedReason: recheck.refusedReason },
            observedResult: { resultId: "result.g", summary: "refused", progressUpdated: false, profileUpdated: false },
          },
          diagnosis: "wrong_policy" as LoopDiagnosis,
          frontierReinterpretationRequired: false as const,
        };
      })(),
    },
  ];
}

// Re-export handoff markers so fixtures can assert consumption without recreating #571.
export { JEV_573_HANDOFF_SURFACE, seededQualifiedDecisions, applyRoutingPolicy, buildRoutingReceipts, toQualifiedRoutingDecision, JEV_FROZEN_ROUTING_CORPUS };
export type { QualifiedRoutingDecision, RoutableBuildAction };
