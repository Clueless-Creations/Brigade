/**
 * #520 SQ-10 — AC→evidence map for persist inference receipts / policy replay /
 * scoped caching / invalidation / erasure.
 *
 * Consumes #512–#519 (implements #519 hooks). Does not redo them.
 * NO_521_IMPL cleared by #521. NO_522_IMPL cleared by #522. NO_523_IMPL cleared by #523. NO_524_IMPL cleared by #524. NO_525_IMPL cleared by #525. Does not implement #526–#529. Paper / synthetic fixtures only.
 * No live / no parallel cache authority / no parallel invalidation engine.
 * Source-fingerprint guarantees intact. Coordinates #74 / #76.
 */
export const INFERENCE_RECEIPTS_MAP_PATH = "catalog/providers/inference-receipts-map.ts" as const;
export const INFERENCE_RECEIPTS_STORE_MODULE = "kernel/services/inference-receipt-store.ts" as const;
export const INFERENCE_INVALIDATION_MODULE = "kernel/engine/inference-invalidation.ts" as const;
export const INFERENCE_RECEIPT_OWNERSHIP_MODULE = "kernel/reducer/inference-receipt-ownership.ts" as const;
export const INFERENCE_RECEIPTS_FIXTURE = "checks/verification/fixtures/inference-receipts.fixtures.ts" as const;
export const SEMANTIC_GRAPH_VIEWS_MODULE = "kernel/knowledge-service/semantic-graph-views.ts" as const;
export const SEMANTIC_GRAPH_OWNERSHIP_MODULE = "kernel/reducer/semantic-graph-ownership.ts" as const;
export const SEMANTIC_CONTRACTS_RECEIPTS = "contracts/semantic/receipts.ts" as const;
export const EVIDENCE_ERASURE_MODULE = "kernel/reducer/erasure.ts" as const;
export const SOURCE_FINGERPRINT_MODULE = "kernel/engine/source-fingerprint.ts" as const;

export const INFERENCE_RECEIPTS_ISSUE = "#520" as const;
export const INFERENCE_RECEIPTS_EPIC = "#511" as const;
export const INFERENCE_RECEIPTS_CONSUMES = ["#512", "#513", "#514", "#515", "#516", "#517", "#518", "#519"] as const;
export const INFERENCE_RECEIPTS_STAMP = "0.221.40" as const;
export const INFERENCE_RECEIPTS_BASE_MAIN_SHA = "4a32176ff8443f9e7cf296ff3a812d8b84086990" as const;
export const INFERENCE_RECEIPTS_LIVE_NOT_PERFORMED = true as const;
export const INFERENCE_RECEIPTS_HOSTED_KEY_OWNER = "CoS→Eduardo" as const;
export const INFERENCE_RECEIPTS_IOS_SIM_OOS = true as const;
export const INFERENCE_RECEIPTS_NO_NETWORK = true as const;
export const INFERENCE_RECEIPTS_NO_PARALLEL_CACHE_AUTHORITY = true as const;
export const INFERENCE_RECEIPTS_NO_PARALLEL_INVALIDATION = true as const;
export const INFERENCE_RECEIPTS_NO_521_IMPL = false as const;
export const INFERENCE_RECEIPTS_NO_522_IMPL = false as const;
export const INFERENCE_RECEIPTS_NO_523_IMPL = false as const;
export const INFERENCE_RECEIPTS_NEXT_AFTER_CLOSE = "#526" as const;
export const INFERENCE_RECEIPTS_COORDINATES = ["#74", "#76"] as const;
export const INFERENCE_RECEIPTS_PRESERVES_SOURCE_FINGERPRINT = true as const;
export const INFERENCE_RECEIPTS_HOOKS_IMPLEMENTED = true as const;

export const INFERENCE_RECEIPTS_AC = [
  {
    id: "ac1-policy-only-zero-provider",
    acceptance: "Changing only policy yields a new policy result with zero provider calls; changing a material input cannot hit the old inference result.",
    evidence: `${INFERENCE_RECEIPTS_FIXTURE} :: AC1`,
    covered: true as const,
  },
  {
    id: "ac2-no-cross-workspace-cache",
    acceptance: "The same projection bytes in two workspaces do not create cross-workspace cache access.",
    evidence: `${INFERENCE_RECEIPTS_FIXTURE} :: AC2`,
    covered: true as const,
  },
  {
    id: "ac3-inflight-source-change-stale-refusal",
    acceptance: "A source change while inference is in flight causes stale-result refusal rather than current acceptance.",
    evidence: `${INFERENCE_RECEIPTS_FIXTURE} :: AC3`,
    covered: true as const,
  },
  {
    id: "ac4-erasure-after-acceptance",
    acceptance: "Erasure after a previously accepted receipt removes/redacts all covered derived data and does not break the audit contract silently.",
    evidence: `${INFERENCE_RECEIPTS_FIXTURE} :: AC4`,
    covered: true as const,
  },
  {
    id: "ac5-probable-unaffected-no-stale-proof",
    acceptance: "A probable-unaffected assessment cannot keep stale mandatory device/provider/source proof valid.",
    evidence: `${INFERENCE_RECEIPTS_FIXTURE} :: AC5`,
    covered: true as const,
  },
] as const;

export function inferenceReceiptsAcEvidence(): readonly {
  id: string;
  acceptance: string;
  evidence: string;
  covered: boolean;
}[] {
  return INFERENCE_RECEIPTS_AC;
}
