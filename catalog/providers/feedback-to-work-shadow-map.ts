/**
 * #522 SQ-11 — AC→evidence map for feedback-to-work semantic pipeline in shadow mode.
 *
 * Consumes #514+#518+#519+#520+#521. Does not redo them. NO_523_IMPL cleared by #523. NO_524_IMPL cleared by #524. NO_525_IMPL cleared by #525. NO_526_IMPL cleared by #526. NO_527_IMPL cleared by #527. NO_528_IMPL cleared by #528. NO_529_IMPL cleared by #529. Does not implement #511 closeout or #573.
 * Paper / synthetic fixtures only. No live customer ingestion / webhooks / polling /
 * new event bus / default-recipe rewrite / autonomous repair dispatch.
 * Coordinates closed #73–#76. Shadow only: record candidates; no eligibility /
 * founder / evidence-accept / repair side effects.
 */
export const FEEDBACK_TO_WORK_SHADOW_MAP_PATH = "catalog/providers/feedback-to-work-shadow-map.ts" as const;
export const FEEDBACK_TO_WORK_SHADOW_RECIPE_MODULE = "catalog/workflows/feedback-to-work-shadow.ts" as const;
export const FEEDBACK_TO_WORK_SHADOW_SERVICE_MODULE = "kernel/services/feedback-to-work-shadow.ts" as const;
export const WORK_PROPOSAL_SHADOW_MODULE = "kernel/operating-model/work-proposal-shadow.ts" as const;
export const FEEDBACK_TO_WORK_SHADOW_FIXTURE = "checks/verification/fixtures/feedback-to-work-shadow.fixtures.ts" as const;
export const KNOWLEDGE_APPLICABILITY_MODULE = "kernel/knowledge-service/context-bound-applicability.ts" as const;
export const SEMANTIC_EVAL_BASELINES_MAP = "catalog/providers/semantic-eval-baselines-map.ts" as const;
export const INFERENCE_RECEIPT_STORE_MODULE = "kernel/services/inference-receipt-store.ts" as const;
export const SEMANTIC_GRAPH_VIEWS_MODULE = "kernel/knowledge-service/semantic-graph-views.ts" as const;

export const FEEDBACK_TO_WORK_SHADOW_ISSUE = "#522" as const;
export const FEEDBACK_TO_WORK_SHADOW_EPIC = "#511" as const;
export const FEEDBACK_TO_WORK_SHADOW_PLANNING_ID = "SQ-11" as const;
export const FEEDBACK_TO_WORK_SHADOW_CONSUMES = ["#514", "#518", "#519", "#520", "#521"] as const;
export const FEEDBACK_TO_WORK_SHADOW_COORDINATES = ["#73", "#74", "#75", "#76"] as const;
export const FEEDBACK_TO_WORK_SHADOW_STAMP = "0.221.43" as const;
export const FEEDBACK_TO_WORK_SHADOW_BASE_MAIN_SHA = "372b00d39dcf43452cd7e09b982d5e9e2856d773" as const;
export const FEEDBACK_TO_WORK_SHADOW_LIVE_NOT_PERFORMED = true as const;
export const FEEDBACK_TO_WORK_SHADOW_HOSTED_KEY_OWNER = "CoS→Eduardo" as const;
export const FEEDBACK_TO_WORK_SHADOW_IOS_SIM_OOS = true as const;
export const FEEDBACK_TO_WORK_SHADOW_NO_NETWORK = true as const;
export const FEEDBACK_TO_WORK_SHADOW_NO_LIVE_INGEST = true as const;
export const FEEDBACK_TO_WORK_SHADOW_NO_EVENT_BUS = true as const;
export const FEEDBACK_TO_WORK_SHADOW_NO_DEFAULT_REWRITE = true as const;
export const FEEDBACK_TO_WORK_SHADOW_SHADOW_ONLY = true as const;
export const FEEDBACK_TO_WORK_SHADOW_NO_522_IMPL = false as const;
export const FEEDBACK_TO_WORK_SHADOW_NO_523_IMPL = false as const;
export const FEEDBACK_TO_WORK_SHADOW_NEXT_AFTER_CLOSE = "#511" as const;

export const FEEDBACK_TO_WORK_SHADOW_AC = [
  {
    id: "ac1-paraphrase-one-problem",
    acceptance: "Paraphrased reports about one failure become one candidate problem with distinct observations, not duplicated work or lost provenance.",
    evidence: `${FEEDBACK_TO_WORK_SHADOW_FIXTURE} :: AC1`,
    covered: true as const,
  },
  {
    id: "ac2-distinct-mechanisms-conflicts-retained",
    acceptance: "Similar wording about different mechanisms stays distinct; conflicting evidence remains present.",
    evidence: `${FEEDBACK_TO_WORK_SHADOW_FIXTURE} :: AC2`,
    covered: true as const,
  },
  {
    id: "ac3-missing-evidence-observation-request",
    acceptance: "Missing evidence produces a useful next observation request rather than an invented repair.",
    evidence: `${FEEDBACK_TO_WORK_SHADOW_FIXTURE} :: AC3`,
    covered: true as const,
  },
  {
    id: "ac4-injection-cannot-mutate",
    acceptance: "Injected instructions cannot modify question packs, provider bindings, data scope, accepted product decisions or grants.",
    evidence: `${FEEDBACK_TO_WORK_SHADOW_FIXTURE} :: AC4`,
    covered: true as const,
  },
  {
    id: "ac5-recoverable-no-default-regression",
    acceptance:
      "Duplicate events, stale revisions, mid-batch failure and unavailable provider produce explicit, recoverable results without default-path regression.",
    evidence: `${FEEDBACK_TO_WORK_SHADOW_FIXTURE} :: AC5`,
    covered: true as const,
  },
  {
    id: "ac6-usefulness-or-documented-no-adoption",
    acceptance: "Case-level results demonstrate usefulness or lead to a documented no-adoption decision; fixture success is not a live business benchmark.",
    evidence: `${FEEDBACK_TO_WORK_SHADOW_FIXTURE} :: AC6`,
    covered: true as const,
  },
] as const;

export function feedbackToWorkShadowAcEvidence(): readonly {
  id: string;
  acceptance: string;
  evidence: string;
  covered: boolean;
}[] {
  return FEEDBACK_TO_WORK_SHADOW_AC;
}
