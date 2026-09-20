/**
 * #523 SQ-18 — AC→evidence map for semantic-runtime safety, recovery,
 * observability and staged rollout.
 *
 * Consumes #514+#515+#518+#519+#520+#522. Does not redo them.
 * NO_524_IMPL cleared by #524. NO_525_IMPL cleared by #525. NO_526_IMPL cleared by #526. NO_527_IMPL cleared by #527. NO_528_IMPL cleared by #528. NO_529_IMPL cleared by #529. #571 landed. Does not implement #511 closeout or #573. Paper / synthetic fixtures only.
 * No new metrics daemon / no auto provider fallback / no new authority /
 * no CI weakening / no key-installed=live / no paid probes in reads.
 * Coordinates closed #73+#74+#75+#109.
 */
export const SEMANTIC_RUNTIME_SAFETY_MAP_PATH = "catalog/providers/semantic-runtime-safety-map.ts" as const;
export const SEMANTIC_RUNTIME_SAFETY_SERVICE_MODULE = "kernel/services/semantic-runtime-safety.ts" as const;
export const SEMANTIC_RUNTIME_SAFETY_ROLLOUT_MODULE = "catalog/workflows/semantic-runtime-safety-rollout.ts" as const;
export const SEMANTIC_RUNTIME_SAFETY_FIXTURE = "checks/verification/fixtures/semantic-runtime-safety.fixtures.ts" as const;
export const FEEDBACK_TO_WORK_SHADOW_SERVICE_MODULE = "kernel/services/feedback-to-work-shadow.ts" as const;
export const INFERENCE_RECEIPT_STORE_MODULE = "kernel/services/inference-receipt-store.ts" as const;
export const SEMANTIC_GRAPH_VIEWS_MODULE = "kernel/knowledge-service/semantic-graph-views.ts" as const;

export const SEMANTIC_RUNTIME_SAFETY_ISSUE = "#523" as const;
export const SEMANTIC_RUNTIME_SAFETY_EPIC = "#511" as const;
export const SEMANTIC_RUNTIME_SAFETY_PLANNING_ID = "SQ-18" as const;
export const SEMANTIC_RUNTIME_SAFETY_CONSUMES = ["#514", "#515", "#518", "#519", "#520", "#522"] as const;
export const SEMANTIC_RUNTIME_SAFETY_COORDINATES = ["#73", "#74", "#75", "#109"] as const;
export const SEMANTIC_RUNTIME_SAFETY_STAMP = "0.221.44" as const;
export const SEMANTIC_RUNTIME_SAFETY_BASE_MAIN_SHA = "8870d87bd79de4699dc271eafa7418c6175a639e" as const;
export const SEMANTIC_RUNTIME_SAFETY_LIVE_NOT_PERFORMED = true as const;
export const SEMANTIC_RUNTIME_SAFETY_HOSTED_KEY_OWNER = "CoS→Eduardo" as const;
export const SEMANTIC_RUNTIME_SAFETY_IOS_SIM_OOS = true as const;
export const SEMANTIC_RUNTIME_SAFETY_NO_NETWORK = true as const;
export const SEMANTIC_RUNTIME_SAFETY_NO_METRICS_DAEMON = true as const;
export const SEMANTIC_RUNTIME_SAFETY_NO_AUTO_PROVIDER_FALLBACK = true as const;
export const SEMANTIC_RUNTIME_SAFETY_NO_NEW_AUTHORITY = true as const;
export const SEMANTIC_RUNTIME_SAFETY_NO_KEY_IMPLIES_LIVE = true as const;
export const SEMANTIC_RUNTIME_SAFETY_NO_523_IMPL = false as const;
export const SEMANTIC_RUNTIME_SAFETY_NEXT_AFTER_CLOSE = "#573" as const;
export const INFERENCE_RECEIPTS_NO_523_IMPL = false as const;

export const SEMANTIC_RUNTIME_SAFETY_AC = [
  {
    id: "ac1-adversarial-source-cannot-mutate",
    acceptance: "Adversarial source text cannot change bindings, tools, grants, question resources or approved purpose.",
    evidence: `${SEMANTIC_RUNTIME_SAFETY_FIXTURE} :: AC1`,
    covered: true as const,
  },
  {
    id: "ac2-passive-public-zero-paid-zero-mutation",
    acceptance: "Passive public calls produce zero paid/provider inference and zero run-state changes.",
    evidence: `${SEMANTIC_RUNTIME_SAFETY_FIXTURE} :: AC2`,
    covered: true as const,
  },
  {
    id: "ac3-partial-uncertain-not-complete-evidence",
    acceptance: "Partial/uncertain results cannot become complete graph evidence or cause duplicate repair/external effects.",
    evidence: `${SEMANTIC_RUNTIME_SAFETY_FIXTURE} :: AC3`,
    covered: true as const,
  },
  {
    id: "ac4-deletion-stale-covers-derived-history",
    acceptance: "Deletion and stale-revision tests cover cached and derived history, not just the newest source record.",
    evidence: `${SEMANTIC_RUNTIME_SAFETY_FIXTURE} :: AC4`,
    covered: true as const,
  },
  {
    id: "ac5-independent-shadow-review-blocks-admission",
    acceptance:
      "Integrated shadow evidence is reviewed independently; advisory/execution stays blocked when benefit, provider conformance or required safety proof is missing.",
    evidence: `${SEMANTIC_RUNTIME_SAFETY_FIXTURE} :: AC5`,
    covered: true as const,
  },
  {
    id: "ac6-support-statements-distinguish-classes",
    acceptance: "Final support statements distinguish fixtures, authorized live provider proof, product behavior and production readiness.",
    evidence: `${SEMANTIC_RUNTIME_SAFETY_FIXTURE} :: AC6`,
    covered: true as const,
  },
] as const;

export function semanticRuntimeSafetyAcEvidence(): readonly {
  id: string;
  acceptance: string;
  evidence: string;
  covered: boolean;
}[] {
  return SEMANTIC_RUNTIME_SAFETY_AC;
}
