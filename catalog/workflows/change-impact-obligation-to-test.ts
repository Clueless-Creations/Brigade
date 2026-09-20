/**
 * #525 SQ-13 — Recipe-owned semantic change-impact / obligation-to-test review policy.
 *
 * Names the missing semantic relation beyond graph reachability, owns bounded
 * matrix policy (change×obligation, obligation×evidence, uncovered×candidate
 * test), and keeps four support states distinct. Does NOT rewrite
 * catalog/workflows/index.ts. Does NOT replace #76 cascade / invalidation /
 * repair — consumes it. Paper / synthetic. No network. No second obligation
 * ledger. No semantic waiver of acceptance invalidation. No device proof gen.
 *
 * Consumes #519+#521+#520+#522+#523 (+ #524 tip). NO_527_IMPL cleared by #527. NO_528_IMPL cleared by #528. NO_529_IMPL cleared by #529. #571 landed. #573 landed. epic 511 remains open. Does not implement #574 architecture as product code.
 */
export const CHANGE_IMPACT_OBLIGATION_RECIPE_ISSUE = "#525" as const;
export const CHANGE_IMPACT_OBLIGATION_RECIPE_EPIC = "#511" as const;
export const CHANGE_IMPACT_OBLIGATION_RECIPE_PLANNING_ID = "SQ-13" as const;
export const CHANGE_IMPACT_OBLIGATION_RECIPE_STAMP = "0.221.46" as const;
export const CHANGE_IMPACT_OBLIGATION_RECIPE_CONSUMES = ["#519", "#521", "#520", "#522", "#523"] as const;
export const CHANGE_IMPACT_OBLIGATION_RECIPE_COORDINATES = ["#74", "#76", "#403"] as const;
export const CHANGE_IMPACT_OBLIGATION_RECIPE_NO_DEFAULT_REWRITE = true as const;
export const CHANGE_IMPACT_OBLIGATION_RECIPE_NO_NETWORK = true as const;
export const CHANGE_IMPACT_OBLIGATION_RECIPE_NO_SECOND_LEDGER = true as const;
export const CHANGE_IMPACT_OBLIGATION_RECIPE_NO_REPLACE_76 = true as const;
export const CHANGE_IMPACT_OBLIGATION_RECIPE_NO_SEMANTIC_WAIVER = true as const;
export const CHANGE_IMPACT_OBLIGATION_RECIPE_NO_DEVICE_PROOF = true as const;
export const CHANGE_IMPACT_OBLIGATION_RECIPE_NO_AUTO_ACCEPT_SCOPE = true as const;
export const CHANGE_IMPACT_OBLIGATION_RECIPE_NO_525_IMPL = false as const;
export const CHANGE_IMPACT_OBLIGATION_RECIPE_NEXT_AFTER_CLOSE = "#574" as const;

/** Existing owners this slice composes over (consume — do not replace). */
export const CHANGE_IMPACT_OBLIGATION_OWNER_MODULES = [
  "catalog/workflows/operating-system.ts",
  "checks/validation/business/process/check-change-cascade.ts",
  "checks/verification/fixtures/business-change-impact.fixtures.ts",
  "kernel/engine/runstate.ts",
  "kernel/engine/review-evidence.ts",
  "kernel/engine/source-fingerprint.ts",
  "kernel/engine/inference-invalidation.ts",
  "kernel/knowledge-service/semantic-graph-views.ts",
  "catalog/providers/greenfield-76-change-impact-closeout-map.ts",
] as const;

/**
 * Missing semantic relation identified before adding a predicate (#525 §1).
 * Graph reachability alone cannot establish whether a product/evidence change
 * impacts a product obligation (promise). This relation fills that gap —
 * without inventing a parallel cascade ledger or replacing #76.
 */
export const MISSING_SEMANTIC_RELATION = "impactsProductObligation" as const;
export const MISSING_SEMANTIC_RELATION_GAP =
  "Graph reachability alone cannot establish impact of a product or evidence change on a product obligation; impactsProductObligation assesses that semantic relationship and yields review/test obligations while #76 retains base invalidation/repair." as const;

/** Bounded support / coverage states — must stay distinct (never fused into one score). */
export const RELATION_SUPPORT_STATES = ["supported", "contradicted", "insufficient", "not_applicable"] as const;
export type RelationSupportState = (typeof RELATION_SUPPORT_STATES)[number];

/** Candidate-test proposal status — proposed ≠ passed until accepted evidence arrives. */
export const CANDIDATE_TEST_STATUSES = ["proposed", "incomplete", "passed_with_accepted_evidence"] as const;
export type CandidateTestStatus = (typeof CANDIDATE_TEST_STATUSES)[number];

export interface ChangeImpactObligationRecipePolicy {
  readonly mode: "paper";
  readonly missingRelation: typeof MISSING_SEMANTIC_RELATION;
  readonly missingRelationGap: typeof MISSING_SEMANTIC_RELATION_GAP;
  readonly supportStates: typeof RELATION_SUPPORT_STATES;
  readonly replace76: false;
  readonly secondObligationLedger: false;
  readonly semanticWaiverOfInvalidation: false;
  readonly autoAcceptScope: false;
  readonly syntheticAsDeviceBehavior: false;
  readonly deviceProofGeneration: false;
  readonly proposedTestEqualsPassed: false;
  readonly requireAppliesToRevision: true;
  readonly fingerprintCurrencyUnchanged: true;
  readonly routeThroughExistingCascade: true;
  readonly independentDecisionPathsRequired: true;
  readonly networkInAssessment: false;
  readonly maxCandidateTestsPerUncovered: number;
  readonly ownerModules: readonly (typeof CHANGE_IMPACT_OBLIGATION_OWNER_MODULES)[number][];
}

export const CHANGE_IMPACT_OBLIGATION_RECIPE_POLICY: ChangeImpactObligationRecipePolicy = {
  mode: "paper",
  missingRelation: MISSING_SEMANTIC_RELATION,
  missingRelationGap: MISSING_SEMANTIC_RELATION_GAP,
  supportStates: RELATION_SUPPORT_STATES,
  replace76: false,
  secondObligationLedger: false,
  semanticWaiverOfInvalidation: false,
  autoAcceptScope: false,
  syntheticAsDeviceBehavior: false,
  deviceProofGeneration: false,
  proposedTestEqualsPassed: false,
  requireAppliesToRevision: true,
  fingerprintCurrencyUnchanged: true,
  routeThroughExistingCascade: true,
  independentDecisionPathsRequired: true,
  networkInAssessment: false,
  maxCandidateTestsPerUncovered: 3,
  ownerModules: [...CHANGE_IMPACT_OBLIGATION_OWNER_MODULES],
};

/** True only if someone wrongly wired this module into the default workflows export. */
export function changeImpactObligationTouchesDefaultIndex(indexSource: string): boolean {
  return indexSource.includes("change-impact-obligation-to-test") && /export const workflows\s*=/.test(indexSource);
}
