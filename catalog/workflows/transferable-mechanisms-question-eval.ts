/**
 * #528 SQ-16 — Recipe-owned transferable product-mechanism / semantic-question
 * evaluation policy.
 *
 * Builds a tested vocabulary of product mechanisms and their limits; transfers
 * candidate lessons by context + counterconditions (analogy ≠ identity);
 * evaluates proposed semantic questions against independently observed outcomes
 * without post-hoc leakage or autonomous policy mutation. Coordinates #75/#74
 * (consume; do not replace). Paper / synthetic. No network.
 *
 * Consumes #514+#519+#521+#520+#522+#523. Does not redo #512–#527.
 * NO_529_IMPL cleared by #529. #571 landed. #573 landed. epic 511 remains open. Does not implement #574 architecture as product code.
 */
export const TRANSFERABLE_MECHANISMS_RECIPE_ISSUE = "#528" as const;
export const TRANSFERABLE_MECHANISMS_RECIPE_EPIC = "#511" as const;
export const TRANSFERABLE_MECHANISMS_RECIPE_PLANNING_ID = "SQ-16" as const;
export const TRANSFERABLE_MECHANISMS_RECIPE_STAMP = "0.221.49" as const;
export const TRANSFERABLE_MECHANISMS_RECIPE_CONSUMES = ["#514", "#519", "#521", "#520", "#522", "#523"] as const;
export const TRANSFERABLE_MECHANISMS_RECIPE_COORDINATES = ["#75", "#74"] as const;
export const TRANSFERABLE_MECHANISMS_RECIPE_NO_DEFAULT_REWRITE = true as const;
export const TRANSFERABLE_MECHANISMS_RECIPE_NO_NETWORK = true as const;
export const TRANSFERABLE_MECHANISMS_RECIPE_NO_CROSS_WORKSPACE_CUSTOMER_POOL = true as const;
export const TRANSFERABLE_MECHANISMS_RECIPE_NO_NEW_EXPERIMENT_OWNER = true as const;
export const TRANSFERABLE_MECHANISMS_RECIPE_NO_AUTONOMOUS_POLICY_MUTATION = true as const;
export const TRANSFERABLE_MECHANISMS_RECIPE_NO_CAUSAL_GROWTH_PROMISES = true as const;
export const TRANSFERABLE_MECHANISMS_RECIPE_NO_PORTFOLIO_RANK_FROM_INCOMPARABLE = true as const;
export const TRANSFERABLE_MECHANISMS_RECIPE_NO_SHARED_VISUAL_TEMPLATE = true as const;
export const TRANSFERABLE_MECHANISMS_RECIPE_NO_NEW_EXPERIMENT_ASSIGNMENT = true as const;
export const TRANSFERABLE_MECHANISMS_RECIPE_NO_AUTO_REWRITE_MEASUREMENT_POLICY = true as const;
export const TRANSFERABLE_MECHANISMS_RECIPE_ANALOGY_IS_NOT_IDENTITY = true as const;
export const TRANSFERABLE_MECHANISMS_RECIPE_ASSOCIATION_IS_NOT_CAUSAL = true as const;
export const TRANSFERABLE_MECHANISMS_RECIPE_SESSIONS_ARE_NOT_PRODUCTS = true as const;
export const TRANSFERABLE_MECHANISMS_RECIPE_NO_528_IMPL = false as const;
export const TRANSFERABLE_MECHANISMS_RECIPE_NEXT_AFTER_CLOSE = "#574" as const;

/** Existing owners this slice composes over (consume — do not replace). */
export const TRANSFERABLE_MECHANISMS_OWNER_MODULES = [
  "kernel/operating-model/measurement.ts",
  "kernel/operating-model/market-experiment.ts",
  "contracts/semantic/question-pack.ts",
  "kernel/contribution/check.ts",
  "kernel/knowledge-service/context-bound-applicability.ts",
  "catalog/ontology/knowledge-method-applicability.ts",
] as const;

export const LESSON_FIELDS = ["context", "intervention", "observedResult", "counterconditions", "measurementContract", "sourceRevisions"] as const;
export type LessonField = (typeof LESSON_FIELDS)[number];

export const FEATURE_SOURCE_KINDS = ["exposure_time_artifact", "later_postmortem", "leaked_outcome", "synthetic_labeled"] as const;
export type FeatureSourceKind = (typeof FEATURE_SOURCE_KINDS)[number];

export const TRANSFER_DECISIONS = ["reuse_with_context", "countercondition_block", "incomparable_block", "insufficient_n"] as const;
export type TransferDecision = (typeof TRANSFER_DECISIONS)[number];

export const CANDIDATE_QUESTION_STATUSES = ["proposed_inactive", "rejected", "inconclusive", "reviewed_active_in_pinned"] as const;
export type CandidateQuestionStatus = (typeof CANDIDATE_QUESTION_STATUSES)[number];

export const EVAL_CLAIM_KINDS = ["association", "causal"] as const;
export type EvalClaimKind = (typeof EVAL_CLAIM_KINDS)[number];

export interface TransferableMechanismsRecipePolicy {
  readonly mode: "paper";
  readonly lessonFields: typeof LESSON_FIELDS;
  readonly featureSourceKinds: typeof FEATURE_SOURCE_KINDS;
  readonly transferDecisions: typeof TRANSFER_DECISIONS;
  readonly candidateQuestionStatuses: typeof CANDIDATE_QUESTION_STATUSES;
  readonly evalClaimKinds: typeof EVAL_CLAIM_KINDS;
  readonly crossWorkspaceCustomerPool: false;
  readonly newExperimentOwner: false;
  readonly autonomousPolicyMutation: false;
  readonly causalGrowthPromises: false;
  readonly portfolioRankFromIncomparable: false;
  readonly sharedVisualTemplate: false;
  readonly newExperimentAssignment: false;
  readonly autoRewriteMeasurementPolicy: false;
  readonly analogyIsIdentity: false;
  readonly associationIsCausal: false;
  readonly sessionsEqualIndependentProducts: false;
  readonly postmortemFeaturesAllowed: false;
  readonly proposingModelCreatesSuccessLabels: false;
  readonly proposingModelUpdatesActivePolicy: false;
  readonly candidateActiveUntilReviewed: false;
  readonly privatePayloadCrossesWorkspaceImplicitly: false;
  readonly requireExistingMetricOwner: true;
  readonly requireReviewedContributionPromotion: true;
  readonly networkInAssessment: false;
  readonly minIndependentProductsForPortfolio: number;
  readonly multipleTestingGuard: true;
  readonly ownerModules: readonly (typeof TRANSFERABLE_MECHANISMS_OWNER_MODULES)[number][];
}

export const TRANSFERABLE_MECHANISMS_RECIPE_POLICY: TransferableMechanismsRecipePolicy = {
  mode: "paper",
  lessonFields: LESSON_FIELDS,
  featureSourceKinds: FEATURE_SOURCE_KINDS,
  transferDecisions: TRANSFER_DECISIONS,
  candidateQuestionStatuses: CANDIDATE_QUESTION_STATUSES,
  evalClaimKinds: EVAL_CLAIM_KINDS,
  crossWorkspaceCustomerPool: false,
  newExperimentOwner: false,
  autonomousPolicyMutation: false,
  causalGrowthPromises: false,
  portfolioRankFromIncomparable: false,
  sharedVisualTemplate: false,
  newExperimentAssignment: false,
  autoRewriteMeasurementPolicy: false,
  analogyIsIdentity: false,
  associationIsCausal: false,
  sessionsEqualIndependentProducts: false,
  postmortemFeaturesAllowed: false,
  proposingModelCreatesSuccessLabels: false,
  proposingModelUpdatesActivePolicy: false,
  candidateActiveUntilReviewed: false,
  privatePayloadCrossesWorkspaceImplicitly: false,
  requireExistingMetricOwner: true,
  requireReviewedContributionPromotion: true,
  networkInAssessment: false,
  minIndependentProductsForPortfolio: 2,
  multipleTestingGuard: true,
  ownerModules: [...TRANSFERABLE_MECHANISMS_OWNER_MODULES],
};

/** True only if someone wrongly wired this module into the default workflows export. */
export function transferableMechanismsTouchesDefaultIndex(indexSource: string): boolean {
  return indexSource.includes("transferable-mechanisms-question-eval") && /export const workflows\s*=/.test(indexSource);
}
