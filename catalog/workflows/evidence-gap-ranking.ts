/**
 * #524 SQ-12 — Recipe-owned evidence-gap / decision-impact ranking policy.
 *
 * Heuristic information-value weights live here beside objective dependency /
 * cost / reversibility fields. Does NOT rewrite catalog/workflows/index.ts.
 * Planner remains sole eligibility owner — this policy only ranks already
 * permitted work within the same priority class.
 *
 * Paper / synthetic. No network. Consumes #522+#523. NO_527_IMPL cleared by #527. NO_528_IMPL cleared by #528. NO_529_IMPL cleared by #529. #571 landed. #573 landed. epic 511 remains open. Does not implement #574 architecture as product code.
 */
export const EVIDENCE_GAP_RANKING_RECIPE_ISSUE = "#524" as const;
export const EVIDENCE_GAP_RANKING_RECIPE_EPIC = "#511" as const;
export const EVIDENCE_GAP_RANKING_RECIPE_PLANNING_ID = "SQ-12" as const;
export const EVIDENCE_GAP_RANKING_RECIPE_STAMP = "0.221.45" as const;
export const EVIDENCE_GAP_RANKING_RECIPE_CONSUMES = ["#522", "#523"] as const;
export const EVIDENCE_GAP_RANKING_RECIPE_NO_DEFAULT_REWRITE = true as const;
export const EVIDENCE_GAP_RANKING_RECIPE_NO_NEW_PLANNER = true as const;
export const EVIDENCE_GAP_RANKING_RECIPE_NO_NETWORK = true as const;
export const EVIDENCE_GAP_RANKING_RECIPE_INFO_VALUE_IS_HEURISTIC = true as const;
export const EVIDENCE_GAP_RANKING_RECIPE_NO_524_IMPL = false as const;
export const EVIDENCE_GAP_RANKING_RECIPE_NEXT_AFTER_CLOSE = "#574" as const;

/** Existing catalog / session owners this ranking composes over (do not replace). */
export const EVIDENCE_GAP_RANKING_OWNER_MODULES = [
  "kernel/session/plan.ts",
  "kernel/services/plan-projection.ts",
  "kernel/engine/frontier.ts",
  "kernel/services/inference-receipt-store.ts",
  "catalog/workflows/feedback-to-work-shadow.ts",
  "catalog/workflows/semantic-runtime-safety-rollout.ts",
] as const;

/**
 * Gap classes stored on assessments (issue #524). Each maps to an existing
 * ActionClass — ranking never invents a new action vocabulary.
 */
export const EVIDENCE_GAP_KINDS = ["source_not_retrieved", "observation_required", "evidence_conflict", "founder_preference"] as const;
export type EvidenceGapKind = (typeof EVIDENCE_GAP_KINDS)[number];

/** Existing ActionClass values used as candidate-action targets for each gap. */
export const EVIDENCE_GAP_ACTION_CLASS_MAP = {
  source_not_retrieved: "observe",
  observation_required: "observe",
  evidence_conflict: "observe",
  founder_preference: "draft",
} as const;
export type EvidenceGapMappedActionClass = (typeof EVIDENCE_GAP_ACTION_CLASS_MAP)[EvidenceGapKind];

/**
 * Candidate action discriminators (same ActionClass can still mean different
 * concrete work — AC3: missing observation ≠ missing retrieval).
 */
export const EVIDENCE_GAP_CANDIDATE_ACTIONS = {
  source_not_retrieved: "retrieve_existing_source",
  observation_required: "produce_new_observation",
  evidence_conflict: "surface_conflicting_evidence",
  founder_preference: "ask_founder_preference",
} as const;
export type EvidenceGapCandidateAction = (typeof EVIDENCE_GAP_CANDIDATE_ACTIONS)[EvidenceGapKind];

export type ReversibilityClass = "reversible" | "partially_reversible" | "irreversible";

/**
 * Recipe ranking policy: objective fields + explicitly heuristic info-value.
 * Weights are labeled heuristic until validated in approved trials.
 */
export interface EvidenceGapRankingRecipePolicy {
  readonly mode: "paper";
  readonly changeEligibility: false;
  readonly promoteIneligibleWork: false;
  readonly outrankFounderApproval: false;
  readonly maxLiveFounderQuestions: 1;
  readonly requireAppliesToRevision: true;
  readonly passiveReadsStoredOnly: true;
  readonly networkInPlanReads: false;
  readonly cacheRefreshOnPlan: false;
  readonly dependencyImpactWeight: number;
  readonly reversibilityWeight: number;
  readonly reversibilityScores: Readonly<Record<ReversibilityClass, number>>;
  readonly costBoundWeight: number;
  readonly decisionSensitivityWeight: number;
  readonly heuristicInfoValueWeight: number;
  readonly heuristicInfoValueExplanation: string;
  readonly stableTieBreakByNodeId: true;
  readonly ownerModules: readonly (typeof EVIDENCE_GAP_RANKING_OWNER_MODULES)[number][];
  readonly gapActionClassMap: typeof EVIDENCE_GAP_ACTION_CLASS_MAP;
  readonly gapCandidateActions: typeof EVIDENCE_GAP_CANDIDATE_ACTIONS;
}

export const EVIDENCE_GAP_RANKING_RECIPE_POLICY: EvidenceGapRankingRecipePolicy = {
  mode: "paper",
  changeEligibility: false,
  promoteIneligibleWork: false,
  outrankFounderApproval: false,
  maxLiveFounderQuestions: 1,
  requireAppliesToRevision: true,
  passiveReadsStoredOnly: true,
  networkInPlanReads: false,
  cacheRefreshOnPlan: false,
  dependencyImpactWeight: 4,
  reversibilityWeight: 2,
  reversibilityScores: {
    reversible: 1,
    partially_reversible: 0.5,
    irreversible: 0,
  },
  costBoundWeight: 1.5,
  decisionSensitivityWeight: 3,
  heuristicInfoValueWeight: 1,
  heuristicInfoValueExplanation:
    "Predicted information value is a labeled heuristic until validated in approved trials; it ranks within a permitted priority class only and never creates eligibility, mutates authority, or replaces founder approval.",
  stableTieBreakByNodeId: true,
  ownerModules: [...EVIDENCE_GAP_RANKING_OWNER_MODULES],
  gapActionClassMap: EVIDENCE_GAP_ACTION_CLASS_MAP,
  gapCandidateActions: EVIDENCE_GAP_CANDIDATE_ACTIONS,
};

/** True only if someone wrongly wired this ranking module into the default workflows export. */
export function evidenceGapRankingTouchesDefaultIndex(indexSource: string): boolean {
  return indexSource.includes("evidence-gap-ranking") && /export const workflows\s*=/.test(indexSource);
}
