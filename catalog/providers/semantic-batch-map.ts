/**
 * #518 SQ-07 — AC→evidence map for shared-state batches / speculative / map-reduce.
 *
 * Consumes #512–#517. Does not redo them. Does not implement #511 closeout or #573 (#519–#529 landed).
 * Paper fixtures + fake transport only. No live / no second scheduler / no live batch benchmarks.
 */
export const SEMANTIC_BATCH_MAP_PATH = "catalog/providers/semantic-batch-map.ts" as const;
export const SEMANTIC_BATCH_MODULE = "kernel/session/semantic-batch.ts" as const;
export const SEMANTIC_BATCH_DISPATCH_MODULE = "kernel/engine/dispatch.ts" as const;
export const SEMANTIC_BATCH_OWNERSHIP_MODULE = "kernel/reducer/semantic-batch-ownership.ts" as const;
export const SEMANTIC_BATCH_FIXTURE = "checks/verification/fixtures/semantic-batch.fixtures.ts" as const;
export const SEMANTIC_SOURCE_PROJECTION_MODULE = "kernel/services/source-projection.ts" as const;
export const SEMANTIC_PLAN_LOWER_MODULE = "kernel/composition/semantic-plan-lower.ts" as const;
export const SEMANTIC_CONTRACTS_QUERY_IR = "contracts/semantic/query-ir.ts" as const;

export const SEMANTIC_BATCH_ISSUE = "#518" as const;
export const SEMANTIC_BATCH_EPIC = "#511" as const;
export const SEMANTIC_BATCH_CONSUMES = ["#512", "#513", "#514", "#515", "#516", "#517"] as const;
export const SEMANTIC_BATCH_STAMP = "0.221.38" as const;
export const SEMANTIC_BATCH_BASE_MAIN_SHA = "610e0e8a3e44aa0f97fcb9fc75d57a410bf0818a" as const;
export const SEMANTIC_BATCH_LIVE_NOT_PERFORMED = true as const;
export const SEMANTIC_BATCH_HOSTED_KEY_OWNER = "CoS→Eduardo" as const;
export const SEMANTIC_BATCH_IOS_SIM_OOS = true as const;
export const SEMANTIC_BATCH_LIVE_BATCH_BENCHMARKS_OOS = true as const;
export const SEMANTIC_BATCH_NEXT_AFTER_CLOSE = "#519" as const;
export const SEMANTIC_BATCH_NO_SECOND_SCHEDULER = true as const;
export const SEMANTIC_BATCH_NO_519 = true as const;
export const SEMANTIC_BATCH_FAKE_TRANSPORT_ONLY = true as const;

export const SEMANTIC_BATCH_AC = [
  {
    id: "ac1-independent-concurrent-barrier",
    acceptance: "Independent checks run concurrently under a deterministic barrier-based fixture; result-use conditions alone do not serialize them.",
    evidence: `${SEMANTIC_BATCH_FIXTURE} :: AC1`,
    covered: true as const,
  },
  {
    id: "ac2-dependent-wait-holds-no-consume",
    acceptance: "Dependent projections wait for their inputs; budget or authority holds do not consume unauthorized requests.",
    evidence: `${SEMANTIC_BATCH_FIXTURE} :: AC2`,
    covered: true as const,
  },
  {
    id: "ac3-failed-shard-no-complete-coverage",
    acceptance: "One failed shard cannot report complete coverage or release ownership while siblings remain active.",
    evidence: `${SEMANTIC_BATCH_FIXTURE} :: AC3`,
    covered: true as const,
  },
  {
    id: "ac4-duplicate-interrupted-uncertain",
    acceptance: "Duplicate event/request and interrupted commit tests do not create duplicate accepted results or hide uncertain charges.",
    evidence: `${SEMANTIC_BATCH_FIXTURE} :: AC4`,
    covered: true as const,
  },
  {
    id: "ac5-latency-cost-phases",
    acceptance: "The latency/cost report separates compile, projection, transport, queue, reduction and recovery overhead.",
    evidence: `${SEMANTIC_BATCH_FIXTURE} :: AC5`,
    covered: true as const,
  },
] as const;

export function semanticBatchAcEvidence(): readonly {
  id: string;
  acceptance: string;
  evidence: string;
  covered: boolean;
}[] {
  return SEMANTIC_BATCH_AC;
}
