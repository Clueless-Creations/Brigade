/**
 * #522 SQ-11 — Shadow feedback-to-work recipe composition over existing
 * catalog/workflows operating/support recipe owners.
 *
 * Does NOT add a new default workflow to catalog/workflows/index.ts.
 * Does NOT rewrite existing default recipes. Shadow composition only:
 * references closed U4 owners (#73–#76) and existing support/ops workflows.
 *
 * Paper / synthetic. No live customer ingestion / webhooks / polling.
 * Consumes #514+#518+#519+#520+#521. NO_523_IMPL cleared by #523. NO_524_IMPL cleared by #524. NO_525_IMPL cleared by #525. NO_526_IMPL cleared by #526. NO_527_IMPL cleared by #527. Does not implement #528–#529.
 */
export const FEEDBACK_TO_WORK_SHADOW_RECIPE_ISSUE = "#522" as const;
export const FEEDBACK_TO_WORK_SHADOW_RECIPE_EPIC = "#511" as const;
export const FEEDBACK_TO_WORK_SHADOW_RECIPE_PLANNING_ID = "SQ-11" as const;
export const FEEDBACK_TO_WORK_SHADOW_RECIPE_STAMP = "0.221.43" as const;
export const FEEDBACK_TO_WORK_SHADOW_RECIPE_CONSUMES = ["#514", "#518", "#519", "#520", "#521"] as const;
export const FEEDBACK_TO_WORK_SHADOW_RECIPE_COORDINATES = ["#73", "#74", "#75", "#76"] as const;
export const FEEDBACK_TO_WORK_SHADOW_RECIPE_NO_DEFAULT_REWRITE = true as const;
export const FEEDBACK_TO_WORK_SHADOW_RECIPE_NO_EVENT_BUS = true as const;
export const FEEDBACK_TO_WORK_SHADOW_RECIPE_NO_LIVE_INGEST = true as const;
export const FEEDBACK_TO_WORK_SHADOW_RECIPE_SHADOW_ONLY = true as const;
export const FEEDBACK_TO_WORK_SHADOW_RECIPE_NEXT_AFTER_CLOSE = "#528" as const;

/** Existing catalog workflow owners this shadow recipe composes over (do not replace). */
export const FEEDBACK_TO_WORK_SHADOW_OWNER_WORKFLOWS = [
  "workflow.operations.support-queue-operations",
  "workflow.operations.post-launch-operations",
  "workflow.experience.onboarding-system.onb-02-evidence-plan",
  "workflow.operations.agent-operations-ledger",
] as const;

/** Compiled operator sequence for the shadow feedback→work path (docs/semantic-execution.md). */
export const FEEDBACK_TO_WORK_SHADOW_OPERATOR_SEQUENCE = [
  "select",
  "project",
  "assess",
  "semanticJoin",
  "classifyEdge",
  "traverse",
  "reduce",
  "proposeWork",
] as const;

export type FeedbackToWorkShadowMode = "shadow";

export interface FeedbackToWorkShadowRecipePolicy {
  readonly mode: FeedbackToWorkShadowMode;
  readonly changeEligibility: false;
  readonly sendFounderQuestions: false;
  readonly acceptEvidence: false;
  readonly dispatchRepairs: false;
  readonly passivePlannerReadsStoredOnly: true;
  readonly ownerWorkflowIds: readonly (typeof FEEDBACK_TO_WORK_SHADOW_OWNER_WORKFLOWS)[number][];
  readonly operatorSequence: readonly (typeof FEEDBACK_TO_WORK_SHADOW_OPERATOR_SEQUENCE)[number][];
}

/** Frozen shadow recipe policy — side-effect bits are literal false. */
export const FEEDBACK_TO_WORK_SHADOW_RECIPE_POLICY: FeedbackToWorkShadowRecipePolicy = {
  mode: "shadow",
  changeEligibility: false,
  sendFounderQuestions: false,
  acceptEvidence: false,
  dispatchRepairs: false,
  passivePlannerReadsStoredOnly: true,
  ownerWorkflowIds: [...FEEDBACK_TO_WORK_SHADOW_OWNER_WORKFLOWS],
  operatorSequence: [...FEEDBACK_TO_WORK_SHADOW_OPERATOR_SEQUENCE],
};

/** True only if someone wrongly wired this shadow module into the default workflows export. */
export function shadowRecipeTouchesDefaultIndex(indexSource: string): boolean {
  return indexSource.includes("feedback-to-work-shadow") && /export const workflows\s*=/.test(indexSource);
}
