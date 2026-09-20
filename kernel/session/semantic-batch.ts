/**
 * #518 SQ-07 — Shared-state batches, speculative assessments, bounded map-reduce.
 *
 * Extends kernel/session/ dispatch + batch settlement. Coordinates with
 * kernel/engine/dispatch.ts (buildDispatchBatches / checkBatchBoundary) and
 * kernel/reducer ownership/lock — does NOT invent a second scheduler,
 * provider-owned job queue, or parallel ownership generation.
 *
 * Consumes #512–#517. Does not redo them. Does not implement #511 closeout or #573 (#519–#529 landed).
 * Paper / fake-transport only in fixtures; no live TypeSafe / no paid CI.
 *
 * Jev decides (Choice/Score/Noul); LLM writes; code owns batch + speculative + map-reduce.
 */
import { digestOf } from "../../contracts/semantic/canonicalize.js";
import { checkBatchBoundary, type BatchBoundaryResult, type DispatchHooks, neverHaltDispatchHooks } from "../engine/dispatch.js";

export const SEMANTIC_BATCH_ISSUE = "#518" as const;
export const SEMANTIC_BATCH_EPIC = "#511" as const;
export const SEMANTIC_BATCH_CONSUMES = ["#512", "#513", "#514", "#515", "#516", "#517"] as const;
export const SEMANTIC_BATCH_STAMP = "0.221.38" as const;
export const SEMANTIC_BATCH_SCHEMA_VERSION = 1 as const;
export const SEMANTIC_BATCH_NO_519 = true as const;
export const SEMANTIC_BATCH_NO_SECOND_SCHEDULER = true as const;
export const SEMANTIC_BATCH_LIVE_BATCH_BENCHMARKS_OOS = true as const;

export class SemanticBatchError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "SemanticBatchError";
    this.code = code;
  }
}

/** Hard resource bounds — recipe/catalog declare; code enforces. */
export interface ResourceBounds {
  readonly maxQuestions: number;
  readonly maxCandidates: number;
  readonly maxConcurrency: number;
  readonly maxTokens?: number;
  readonly maxBytes?: number;
  readonly deadlineMs?: number;
  readonly maxRetries: number;
  /** Total inference budget units; omit → unknown budget (never fabricated certainty). */
  readonly totalInferenceBudget?: number;
}

export const DEFAULT_RESOURCE_BOUNDS: ResourceBounds = Object.freeze({
  maxQuestions: 32,
  maxCandidates: 64,
  maxConcurrency: 8,
  maxRetries: 2,
});

/** Cost honesty: never fabricate actual when unavailable. */
export type CostKind = "actual" | "estimated" | "unknown";

export interface CostReport {
  readonly kind: CostKind;
  readonly value?: number;
  readonly currency?: string;
  readonly note?: string;
}

/** Work item admitted into shared-state or map-shard scheduling. */
export interface SemanticWorkItem {
  readonly workId: string;
  readonly questionId: string;
  readonly workspaceId: string;
  readonly sourceSnapshotId: string;
  readonly dataPolicyId: string;
  readonly providerBindingId: string;
  readonly resourceLimitKey: string;
  /** Data-dependency: must wait for these projection/work ids before admit. */
  readonly dependsOn: readonly string[];
  /**
   * Result-use only: another branch may or may not consume this result.
   * Result-use alone MUST NOT serialize independent checks (AC1).
   */
  readonly resultUseOf: readonly string[];
  readonly authorityPrerequisites: readonly string[];
  readonly sourceAccessHeld: boolean;
  readonly authorityHeld: boolean;
  /** Estimated tokens/bytes for reservation accounting. */
  readonly estimatedTokens?: number;
  readonly estimatedBytes?: number;
  /** Map-shard key when this is an independent record/pair map item. */
  readonly mapKey?: string;
  /** Speculative assessment branch id (assessment-only; never tool/product). */
  readonly speculativeBranchId?: string;
}

export type BatchKind = "shared_state" | "independent_map" | "speculative_assessment";

export interface SharedStateBatch {
  readonly batchId: string;
  readonly kind: BatchKind;
  readonly workspaceId: string;
  readonly sourceSnapshotId: string;
  readonly dataPolicyId: string;
  readonly providerBindingId: string;
  readonly resourceLimitKey: string;
  readonly workIds: readonly string[];
  readonly questionIds: readonly string[];
}

export interface GroupBatchesResult {
  readonly sharedStateBatches: readonly SharedStateBatch[];
  readonly independentMapBatches: readonly SharedStateBatch[];
  readonly speculativeBatches: readonly SharedStateBatch[];
  readonly rejected: readonly { readonly workId: string; readonly reason: string }[];
  readonly groupingDigest: string;
}

function batchCompatKey(item: SemanticWorkItem): string {
  return [item.workspaceId, item.sourceSnapshotId, item.dataPolicyId, item.providerBindingId, item.resourceLimitKey].join("\u0001");
}

/**
 * Group compatible questions by snapshot / workspace-data policy / provider binding / limits.
 * Never puts another workspace's data in a batch to save tokens.
 * Shared-state batches are distinct from concurrent independent record/pair map requests.
 */
export function groupSharedStateBatches(items: readonly SemanticWorkItem[], bounds: ResourceBounds = DEFAULT_RESOURCE_BOUNDS): GroupBatchesResult {
  if (!Number.isSafeInteger(bounds.maxQuestions) || bounds.maxQuestions < 1) {
    throw new SemanticBatchError("invalid_bounds", "maxQuestions must be a positive integer.");
  }
  if (!Number.isSafeInteger(bounds.maxConcurrency) || bounds.maxConcurrency < 1) {
    throw new SemanticBatchError("invalid_bounds", "maxConcurrency must be a positive integer.");
  }

  const rejected: { workId: string; reason: string }[] = [];
  const sharedBuckets = new Map<string, SemanticWorkItem[]>();
  const mapBuckets = new Map<string, SemanticWorkItem[]>();
  const speculativeBuckets = new Map<string, SemanticWorkItem[]>();

  for (const item of items) {
    if (!item.workspaceId.trim()) {
      rejected.push({ workId: item.workId, reason: "missing_workspace" });
      continue;
    }
    if (!item.sourceAccessHeld || !item.authorityHeld) {
      // Hold — do not consume unauthorized requests (AC2).
      rejected.push({
        workId: item.workId,
        reason: !item.sourceAccessHeld ? "source_access_hold" : "authority_hold",
      });
      continue;
    }
    if (item.authorityPrerequisites.length > 0 && !item.authorityHeld) {
      rejected.push({ workId: item.workId, reason: "authority_prerequisite_unmet" });
      continue;
    }

    const key = batchCompatKey(item);
    if (item.mapKey !== undefined) {
      const list = mapBuckets.get(key) ?? [];
      list.push(item);
      mapBuckets.set(key, list);
    } else if (item.speculativeBranchId !== undefined) {
      const list = speculativeBuckets.get(key) ?? [];
      list.push(item);
      speculativeBuckets.set(key, list);
    } else {
      const list = sharedBuckets.get(key) ?? [];
      list.push(item);
      sharedBuckets.set(key, list);
    }
  }

  // Cross-workspace contamination guard: never merge distinct workspaceIds into one batch.
  const assertNoCrossWorkspace = (batches: SharedStateBatch[]) => {
    for (const batch of batches) {
      const workspaces = new Set(items.filter((i) => batch.workIds.includes(i.workId)).map((i) => i.workspaceId));
      if (workspaces.size > 1) {
        throw new SemanticBatchError("cross_workspace_batch", "Never put another workspace's data in a batch.");
      }
    }
  };

  const materialize = (buckets: Map<string, SemanticWorkItem[]>, kind: BatchKind, prefix: string): SharedStateBatch[] => {
    const out: SharedStateBatch[] = [];
    let seq = 0;
    const sortedKeys = [...buckets.keys()].sort();
    for (const key of sortedKeys) {
      const group = [...(buckets.get(key) ?? [])].sort((a, b) => a.workId.localeCompare(b.workId));
      // Chunk by maxQuestions and maxConcurrency (questions-per-batch).
      const chunkSize = Math.min(bounds.maxQuestions, bounds.maxConcurrency);
      for (let i = 0; i < group.length; i += chunkSize) {
        const chunk = group.slice(i, i + chunkSize);
        const first = chunk[0]!;
        out.push({
          batchId: `${prefix}-${seq++}`,
          kind,
          workspaceId: first.workspaceId,
          sourceSnapshotId: first.sourceSnapshotId,
          dataPolicyId: first.dataPolicyId,
          providerBindingId: first.providerBindingId,
          resourceLimitKey: first.resourceLimitKey,
          workIds: chunk.map((c) => c.workId),
          questionIds: chunk.map((c) => c.questionId),
        });
      }
    }
    return out;
  };

  const sharedStateBatches = materialize(sharedBuckets, "shared_state", "ss");
  const independentMapBatches = materialize(mapBuckets, "independent_map", "map");
  const speculativeBatches = materialize(speculativeBuckets, "speculative_assessment", "spec");
  assertNoCrossWorkspace([...sharedStateBatches, ...independentMapBatches, ...speculativeBatches]);

  const groupingDigest = digestOf({
    schemaVersion: SEMANTIC_BATCH_SCHEMA_VERSION,
    shared: sharedStateBatches,
    map: independentMapBatches,
    speculative: speculativeBatches,
    rejected,
  });

  return {
    sharedStateBatches,
    independentMapBatches,
    speculativeBatches,
    rejected,
    groupingDigest,
  };
}

export type ReservationOutcome =
  | {
      readonly admitted: true;
      readonly reservationId: string;
      readonly cost: CostReport;
      readonly bounds: ResourceBounds;
      readonly questionsReserved: number;
      readonly candidatesReserved: number;
    }
  | {
      readonly admitted: false;
      readonly reason: "budget_hold" | "authority_hold" | "question_limit" | "candidate_limit" | "concurrency_limit" | "token_limit" | "byte_limit";
      readonly cost: CostReport;
      /** Holds must not consume unauthorized requests. */
      readonly requestsConsumed: 0;
    };

/**
 * Admit spend/resource reservations under existing authority.
 * Cost unavailable → estimated or unknown (never fabricated actual certainty).
 */
export function reserveResources(input: {
  readonly items: readonly SemanticWorkItem[];
  readonly bounds: ResourceBounds;
  readonly authorityOk: boolean;
  readonly budgetRemaining?: number;
  readonly estimatedCostPerQuestion?: number;
  readonly costKnownActual?: number;
}): ReservationOutcome {
  const unknownCost = (): CostReport => ({ kind: "unknown", note: "provider cost unavailable" });
  const estimatedCost = (n: number): CostReport => ({
    kind: "estimated",
    value: n,
    note: "estimated from bounds; not observed actual",
  });

  if (!input.authorityOk) {
    return { admitted: false, reason: "authority_hold", cost: unknownCost(), requestsConsumed: 0 };
  }

  const questions = input.items.length;
  if (questions > input.bounds.maxQuestions) {
    return { admitted: false, reason: "question_limit", cost: unknownCost(), requestsConsumed: 0 };
  }
  if (questions > input.bounds.maxConcurrency) {
    return { admitted: false, reason: "concurrency_limit", cost: unknownCost(), requestsConsumed: 0 };
  }

  const candidates = input.items.filter((i) => i.mapKey !== undefined).length;
  if (candidates > input.bounds.maxCandidates) {
    return { admitted: false, reason: "candidate_limit", cost: unknownCost(), requestsConsumed: 0 };
  }

  const tokens = input.items.reduce((sum, i) => sum + (i.estimatedTokens ?? 0), 0);
  if (input.bounds.maxTokens !== undefined && tokens > input.bounds.maxTokens) {
    return { admitted: false, reason: "token_limit", cost: unknownCost(), requestsConsumed: 0 };
  }
  const bytes = input.items.reduce((sum, i) => sum + (i.estimatedBytes ?? 0), 0);
  if (input.bounds.maxBytes !== undefined && bytes > input.bounds.maxBytes) {
    return { admitted: false, reason: "byte_limit", cost: unknownCost(), requestsConsumed: 0 };
  }

  if (input.bounds.totalInferenceBudget !== undefined) {
    const remaining = input.budgetRemaining ?? input.bounds.totalInferenceBudget;
    if (remaining <= 0) {
      return { admitted: false, reason: "budget_hold", cost: unknownCost(), requestsConsumed: 0 };
    }
  }

  let cost: CostReport;
  if (input.costKnownActual !== undefined) {
    cost = { kind: "actual", value: input.costKnownActual };
  } else if (input.estimatedCostPerQuestion !== undefined) {
    cost = estimatedCost(input.estimatedCostPerQuestion * questions);
  } else {
    cost = unknownCost();
  }

  return {
    admitted: true,
    reservationId: digestOf({ q: questions, c: candidates, t: tokens }).slice(0, 16),
    cost,
    bounds: input.bounds,
    questionsReserved: questions,
    candidatesReserved: candidates,
  };
}

/** Speculative branch accounting — assessment-only. */
export type SpeculativeBranchStatus = "pending" | "completed" | "consumed" | "unused" | "rejected_prereq";

export interface SpeculativeBranchRecord {
  readonly branchId: string;
  readonly workId: string;
  readonly status: SpeculativeBranchStatus;
  readonly resultDigest?: string;
}

export interface SpeculativeAssessmentPlan {
  readonly planId: string;
  readonly branches: readonly SpeculativeBranchRecord[];
  readonly maySpeculate: boolean;
  readonly rejectReason?: string;
}

/**
 * Speculative assessments only when source-access + authority prerequisites already hold.
 * Never speculate tool execution or product changes (assessment-only).
 */
export function planSpeculativeAssessments(input: {
  readonly items: readonly SemanticWorkItem[];
  readonly allowToolSpeculation?: boolean;
  readonly allowProductSpeculation?: boolean;
}): SpeculativeAssessmentPlan {
  if (input.allowToolSpeculation || input.allowProductSpeculation) {
    throw new SemanticBatchError("speculation_forbidden", "Never speculate tool execution or product changes; assessment-only.");
  }

  const branches: SpeculativeBranchRecord[] = [];
  let maySpeculate = true;
  let rejectReason: string | undefined;

  for (const item of input.items) {
    if (item.speculativeBranchId === undefined) continue;
    if (!item.sourceAccessHeld || !item.authorityHeld) {
      maySpeculate = false;
      rejectReason = "prerequisites_unmet";
      branches.push({
        branchId: item.speculativeBranchId,
        workId: item.workId,
        status: "rejected_prereq",
      });
      continue;
    }
    branches.push({
      branchId: item.speculativeBranchId,
      workId: item.workId,
      status: "pending",
    });
  }

  return {
    planId: digestOf({ branches: branches.map((b) => b.branchId) }).slice(0, 16),
    branches,
    maySpeculate,
    rejectReason,
  };
}

/** Record which speculative branch results were consumed vs unused. */
export function settleSpeculativeBranches(
  plan: SpeculativeAssessmentPlan,
  consumedBranchIds: readonly string[],
  completedResults: Readonly<Record<string, string>>,
): SpeculativeAssessmentPlan {
  const consumed = new Set(consumedBranchIds);
  const next: SpeculativeBranchRecord[] = plan.branches.map((b) => {
    if (b.status === "rejected_prereq") return b;
    const digest = completedResults[b.branchId];
    if (digest === undefined) return b;
    if (consumed.has(b.branchId)) {
      return { ...b, status: "consumed", resultDigest: digest };
    }
    return { ...b, status: "unused", resultDigest: digest };
  });
  return { ...plan, branches: next };
}

/** Map-shard outcomes with partial honesty. */
export type ShardStatus = "ok" | "failed" | "cancelled" | "unresolved" | "active";

export interface MapShardOutcome {
  readonly key: string;
  readonly status: ShardStatus;
  readonly resultDigest?: string;
  readonly errorCode?: string;
}

export interface MapReduceSummary {
  readonly coverageComplete: boolean;
  readonly numerator: number;
  readonly denominator: number;
  readonly failedKeys: readonly string[];
  readonly cancelledKeys: readonly string[];
  readonly activeKeys: readonly string[];
  readonly ownershipReleased: boolean;
  readonly ownershipGeneration: string;
  readonly reductionDigest: string;
}

/**
 * Persist keyed map outcomes + deterministic reduction.
 * One failed shard cannot report complete coverage or release ownership while siblings active (AC3).
 */
export function reduceMapShards(input: {
  readonly ownershipGeneration: string;
  readonly shards: readonly MapShardOutcome[];
  /** Caller requests release; code refuses if siblings still active or coverage incomplete. */
  readonly requestOwnershipRelease: boolean;
}): MapReduceSummary {
  const sorted = [...input.shards].sort((a, b) => a.key.localeCompare(b.key));
  const denominator = sorted.length;
  const ok = sorted.filter((s) => s.status === "ok");
  const failed = sorted.filter((s) => s.status === "failed");
  const cancelled = sorted.filter((s) => s.status === "cancelled");
  const active = sorted.filter((s) => s.status === "active");
  const unresolved = sorted.filter((s) => s.status === "unresolved");

  const coverageComplete =
    denominator > 0 && failed.length === 0 && cancelled.length === 0 && active.length === 0 && unresolved.length === 0 && ok.length === denominator;

  // Ownership may release only when no siblings remain active and all are settled.
  const allSettled = active.length === 0;
  const ownershipReleased = input.requestOwnershipRelease && allSettled && (coverageComplete || failed.length + cancelled.length + unresolved.length > 0);

  // Explicit AC3: if any failed while siblings still active → coverageComplete false AND ownership not released.
  const blockedByActiveSiblings = failed.length > 0 && active.length > 0;
  const finalCoverage = blockedByActiveSiblings ? false : coverageComplete;
  const finalRelease = blockedByActiveSiblings ? false : ownershipReleased;

  return {
    coverageComplete: finalCoverage,
    numerator: ok.length,
    denominator,
    failedKeys: failed.map((s) => s.key),
    cancelledKeys: cancelled.map((s) => s.key),
    activeKeys: active.map((s) => s.key),
    ownershipReleased: finalRelease,
    ownershipGeneration: input.ownershipGeneration,
    reductionDigest: digestOf({
      ownershipGeneration: input.ownershipGeneration,
      shards: sorted,
      coverageComplete: finalCoverage,
      ownershipReleased: finalRelease,
    }),
  };
}

/** In-memory ownership generation tracker — reuses semantics; does not replace shared-claims. */
export interface OwnershipHandle {
  readonly generation: string;
  readonly workspaceId: string;
  readonly occurrenceId: string;
  readonly resource: string;
  readonly active: boolean;
  readonly cancelled: boolean;
}

export interface BatchSettlementState {
  readonly ownership: OwnershipHandle;
  readonly sourceRevision: string;
  readonly dispatchedWorkIds: readonly string[];
  readonly settledWorkIds: readonly string[];
  readonly unresolvedWorkIds: readonly string[];
  readonly acceptedResultIds: readonly string[];
  readonly uncertainCharges: readonly {
    readonly requestId: string;
    readonly attemptId: string;
    readonly reason: string;
  }[];
  readonly cancelled: boolean;
  readonly stopNewDispatch: boolean;
}

export function createOwnershipHandle(input: {
  readonly generation: string;
  readonly workspaceId: string;
  readonly occurrenceId: string;
  readonly resource: string;
}): OwnershipHandle {
  return {
    generation: input.generation,
    workspaceId: input.workspaceId,
    occurrenceId: input.occurrenceId,
    resource: input.resource,
    active: true,
    cancelled: false,
  };
}

export function beginBatchSettlement(input: { readonly ownership: OwnershipHandle; readonly sourceRevision: string }): BatchSettlementState {
  return {
    ownership: input.ownership,
    sourceRevision: input.sourceRevision,
    dispatchedWorkIds: [],
    settledWorkIds: [],
    unresolvedWorkIds: [],
    acceptedResultIds: [],
    uncertainCharges: [],
    cancelled: false,
    stopNewDispatch: false,
  };
}

/** Stop new dispatch on cancellation; settle in-flight or mark unresolved before lock/claim release. */
export function requestCancellation(state: BatchSettlementState): BatchSettlementState {
  return {
    ...state,
    cancelled: true,
    stopNewDispatch: true,
    ownership: { ...state.ownership, cancelled: true },
  };
}

export function recordDispatch(state: BatchSettlementState, workIds: readonly string[]): BatchSettlementState {
  if (state.stopNewDispatch) {
    throw new SemanticBatchError("dispatch_stopped", "Cancellation stopped new dispatch.");
  }
  if (!state.ownership.active) {
    throw new SemanticBatchError("ownership_inactive", "Cannot dispatch without active ownership.");
  }
  return {
    ...state,
    dispatchedWorkIds: [...state.dispatchedWorkIds, ...workIds],
  };
}

export type AcceptResult =
  | { readonly ok: true; readonly state: BatchSettlementState }
  | {
      readonly ok: false;
      readonly reason: "duplicate_accept" | "late_after_ownership" | "late_after_revision" | "ownership_mismatch";
      readonly state: BatchSettlementState;
    };

/**
 * Accept a result under ownership + source revision. Rejects late results after
 * ownership or source revision changes. Duplicate event/request → no duplicate accepts (AC4).
 */
export function acceptResult(
  state: BatchSettlementState,
  input: {
    readonly resultId: string;
    readonly workId: string;
    readonly ownershipGeneration: string;
    readonly sourceRevision: string;
    readonly uncertainCharge?: { readonly requestId: string; readonly attemptId: string; readonly reason: string };
  },
): AcceptResult {
  if (input.ownershipGeneration !== state.ownership.generation || !state.ownership.active) {
    return { ok: false, reason: "late_after_ownership", state };
  }
  if (input.sourceRevision !== state.sourceRevision) {
    return { ok: false, reason: "late_after_revision", state };
  }
  if (state.acceptedResultIds.includes(input.resultId)) {
    return { ok: false, reason: "duplicate_accept", state };
  }

  const next: BatchSettlementState = {
    ...state,
    acceptedResultIds: [...state.acceptedResultIds, input.resultId],
    settledWorkIds: state.settledWorkIds.includes(input.workId) ? state.settledWorkIds : [...state.settledWorkIds, input.workId],
    uncertainCharges: input.uncertainCharge ? [...state.uncertainCharges, input.uncertainCharge] : state.uncertainCharges,
  };
  return { ok: true, state: next };
}

/**
 * Release ownership only after in-flight settled or marked unresolved.
 * Cooperative yield only at batch boundaries (caller supplies DispatchHooks).
 */
export function releaseOwnershipAfterSettlement(
  state: BatchSettlementState,
  hooks: DispatchHooks = neverHaltDispatchHooks,
): { readonly released: boolean; readonly boundary: BatchBoundaryResult; readonly state: BatchSettlementState } {
  const boundary = checkBatchBoundary(hooks);
  if (boundary.halt) {
    return { released: false, boundary, state };
  }

  const inFlight = state.dispatchedWorkIds.filter((id) => !state.settledWorkIds.includes(id) && !state.unresolvedWorkIds.includes(id));
  if (inFlight.length > 0) {
    // Mark unresolved before release when cancelling.
    if (state.cancelled) {
      const marked: BatchSettlementState = {
        ...state,
        unresolvedWorkIds: [...state.unresolvedWorkIds, ...inFlight],
        ownership: { ...state.ownership, active: false },
      };
      return { released: true, boundary, state: marked };
    }
    return { released: false, boundary, state };
  }

  return {
    released: true,
    boundary,
    state: { ...state, ownership: { ...state.ownership, active: false } },
  };
}

/** Phase-separated latency/cost report (AC5). */
export interface PhaseOverhead {
  readonly phase: "compile" | "projection" | "transport" | "queue" | "reduction" | "recovery";
  readonly latencyMs: number;
  readonly cost: CostReport;
}

export interface LatencyCostReport {
  readonly phases: readonly PhaseOverhead[];
  readonly totalLatencyMs: number;
  readonly reportDigest: string;
}

export function buildLatencyCostReport(phases: readonly PhaseOverhead[]): LatencyCostReport {
  const required = ["compile", "projection", "transport", "queue", "reduction", "recovery"] as const;
  const byPhase = new Map(phases.map((p) => [p.phase, p]));
  for (const name of required) {
    if (!byPhase.has(name)) {
      throw new SemanticBatchError("incomplete_report", `Latency/cost report missing phase: ${name}`);
    }
  }
  const ordered = required.map((name) => byPhase.get(name)!);
  const totalLatencyMs = ordered.reduce((sum, p) => sum + p.latencyMs, 0);
  return {
    phases: ordered,
    totalLatencyMs,
    reportDigest: digestOf({ phases: ordered, totalLatencyMs }),
  };
}

// ---------------------------------------------------------------------------
// Fake transport + deterministic barrier (fixtures / paper only)
// ---------------------------------------------------------------------------

export type FakeTransportResult =
  | { readonly ok: true; readonly workId: string; readonly resultId: string; readonly body: unknown }
  | {
      readonly ok: false;
      readonly workId: string;
      readonly kind: "failed" | "cancelled" | "uncertain" | "duplicate";
      readonly code: string;
      readonly detail: string;
    };

/**
 * Synchronous deterministic barrier transport for fixtures.
 * All admitted dispatches enter the barrier before any completes — proves concurrency
 * without relying on the async harness (check() is sync-only).
 */
export interface SyncBarrierTransport {
  readonly kind: "fake-sync";
  /** Script outcome for a work id (default ok). */
  script(workId: string, result: FakeTransportResult): void;
  /** Admit work ids into the barrier (increments concurrent peak; does not complete). */
  enterBarrier(workIds: readonly string[]): void;
  concurrentAtBarrier(): number;
  peakConcurrency(): number;
  /** Release barrier and complete all waiting work synchronously. */
  releaseAndComplete(): readonly FakeTransportResult[];
}

export function createSyncBarrierTransport(): SyncBarrierTransport {
  const scripts = new Map<string, FakeTransportResult>();
  let waiting: string[] = [];
  let peak = 0;

  return {
    kind: "fake-sync",
    script(workId, result) {
      scripts.set(workId, result);
    },
    enterBarrier(workIds) {
      waiting = [...waiting, ...workIds];
      peak = Math.max(peak, waiting.length);
    },
    concurrentAtBarrier: () => waiting.length,
    peakConcurrency: () => peak,
    releaseAndComplete() {
      const ids = waiting;
      waiting = [];
      return ids.map((workId) => {
        const scripted = scripts.get(workId);
        if (scripted) return scripted;
        return { ok: true as const, workId, resultId: `r-${workId}`, body: { workId } };
      });
    },
  };
}

/**
 * Run independent work under a sync barrier through session settlement.
 * Data-dependent items wait; budget/authority holds never dispatch.
 * Result-use alone does not block (AC1).
 */
export function runSyncBarrierBatch(input: {
  readonly items: readonly SemanticWorkItem[];
  readonly transport: SyncBarrierTransport;
  readonly state: BatchSettlementState;
  readonly bounds?: ResourceBounds;
  readonly readyProjectionIds?: ReadonlySet<string>;
}): {
  readonly state: BatchSettlementState;
  readonly results: readonly FakeTransportResult[];
  readonly heldWorkIds: readonly string[];
  readonly waitedForDependency: readonly string[];
  readonly concurrentPeak: number;
  readonly concurrentAtBarrier: number;
} {
  const bounds = input.bounds ?? DEFAULT_RESOURCE_BOUNDS;
  const ready = new Set(input.readyProjectionIds ?? []);
  const held: string[] = [];
  const waited: string[] = [];
  let state = input.state;

  const runnable: SemanticWorkItem[] = [];
  for (const item of input.items) {
    if (!item.sourceAccessHeld || !item.authorityHeld) {
      held.push(item.workId);
      continue;
    }
    const unmet = item.dependsOn.filter((d) => !ready.has(d));
    if (unmet.length > 0) {
      waited.push(item.workId);
      continue;
    }
    runnable.push(item);
  }

  const reservation = reserveResources({ items: runnable, bounds, authorityOk: true });
  if (!reservation.admitted) {
    return {
      state,
      results: [],
      heldWorkIds: [...held, ...runnable.map((r) => r.workId)],
      waitedForDependency: waited,
      concurrentPeak: input.transport.peakConcurrency(),
      concurrentAtBarrier: 0,
    };
  }

  try {
    state = recordDispatch(
      state,
      runnable.map((r) => r.workId),
    );
  } catch {
    return {
      state,
      results: [],
      heldWorkIds: [...held, ...runnable.map((r) => r.workId)],
      waitedForDependency: waited,
      concurrentPeak: input.transport.peakConcurrency(),
      concurrentAtBarrier: 0,
    };
  }

  // All runnable enter barrier together before any completes (deterministic concurrency).
  input.transport.enterBarrier(runnable.map((r) => r.workId));
  const concurrentAtBarrier = input.transport.concurrentAtBarrier();
  const results = input.transport.releaseAndComplete();

  for (const result of results) {
    if (result.ok) {
      const accepted = acceptResult(state, {
        resultId: result.resultId,
        workId: result.workId,
        ownershipGeneration: state.ownership.generation,
        sourceRevision: state.sourceRevision,
      });
      if (accepted.ok) state = accepted.state;
    } else if (result.kind === "uncertain") {
      const accepted = acceptResult(state, {
        resultId: `uncertain-${result.workId}-${state.uncertainCharges.length}`,
        workId: result.workId,
        ownershipGeneration: state.ownership.generation,
        sourceRevision: state.sourceRevision,
        uncertainCharge: {
          requestId: result.workId,
          attemptId: `attempt-${result.workId}`,
          reason: result.detail,
        },
      });
      if (accepted.ok) {
        state = accepted.state;
      } else {
        state = {
          ...state,
          uncertainCharges: [...state.uncertainCharges, { requestId: result.workId, attemptId: `attempt-${result.workId}`, reason: result.detail }],
          unresolvedWorkIds: state.unresolvedWorkIds.includes(result.workId) ? state.unresolvedWorkIds : [...state.unresolvedWorkIds, result.workId],
        };
      }
    } else if (result.kind === "failed" || result.kind === "cancelled") {
      state = {
        ...state,
        unresolvedWorkIds: state.unresolvedWorkIds.includes(result.workId) ? state.unresolvedWorkIds : [...state.unresolvedWorkIds, result.workId],
      };
    }
  }

  return {
    state,
    results,
    heldWorkIds: held,
    waitedForDependency: waited,
    concurrentPeak: input.transport.peakConcurrency(),
    concurrentAtBarrier,
  };
}

/** Gate at existing dispatch batch boundary before starting the next semantic batch. */
export function gateSemanticBatchBoundary(hooks: DispatchHooks = neverHaltDispatchHooks): BatchBoundaryResult {
  return checkBatchBoundary(hooks);
}
