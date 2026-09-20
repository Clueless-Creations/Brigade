/**
 * #527 SQ-15 — Recipe-owned source-backed opportunity research / semantic
 * map-reduce policy.
 *
 * Turns an already-authorized research corpus into auditable opportunity
 * hypotheses by joining stated problems, contexts, workarounds, tradeoffs, and
 * evidence — without treating repetition as proof of demand. Does NOT scrape,
 * open a new research DB, pick a product, invent TAM, or change
 * scope/spend/collection permissions. Coordinates #75/#74 (consume; do not
 * replace). Paper / synthetic. No network.
 *
 * Consumes #514+#518+#519+#521+#520+#523. Does not redo #512–#526.
 * NO_528_IMPL cleared by #528. Does not implement #529.
 */
export const OPPORTUNITY_RESEARCH_RECIPE_ISSUE = "#527" as const;
export const OPPORTUNITY_RESEARCH_RECIPE_EPIC = "#511" as const;
export const OPPORTUNITY_RESEARCH_RECIPE_PLANNING_ID = "SQ-15" as const;
export const OPPORTUNITY_RESEARCH_RECIPE_STAMP = "0.221.48" as const;
export const OPPORTUNITY_RESEARCH_RECIPE_CONSUMES = ["#514", "#518", "#519", "#521", "#520", "#523"] as const;
export const OPPORTUNITY_RESEARCH_RECIPE_COORDINATES = ["#75", "#74"] as const;
export const OPPORTUNITY_RESEARCH_RECIPE_NO_DEFAULT_REWRITE = true as const;
export const OPPORTUNITY_RESEARCH_RECIPE_NO_NETWORK = true as const;
export const OPPORTUNITY_RESEARCH_RECIPE_NO_SCRAPE = true as const;
export const OPPORTUNITY_RESEARCH_RECIPE_NO_NEW_RESEARCH_DB = true as const;
export const OPPORTUNITY_RESEARCH_RECIPE_NO_PRODUCT_PICK = true as const;
export const OPPORTUNITY_RESEARCH_RECIPE_NO_MARKET_SUCCESS_PREDICTION = true as const;
export const OPPORTUNITY_RESEARCH_RECIPE_NO_UNSOURCED_TAM = true as const;
export const OPPORTUNITY_RESEARCH_RECIPE_NO_CUSTOMER_PII = true as const;
export const OPPORTUNITY_RESEARCH_RECIPE_NO_FOUNDER_BUSINESS_SELECTION = true as const;
export const OPPORTUNITY_RESEARCH_RECIPE_NO_INFERRED_WTP = true as const;
export const OPPORTUNITY_RESEARCH_RECIPE_NO_INFERRED_DEMOGRAPHICS = true as const;
export const OPPORTUNITY_RESEARCH_RECIPE_REPETITION_IS_NOT_DEMAND = true as const;
export const OPPORTUNITY_RESEARCH_RECIPE_PAGE_COUNTS_ARE_NOT_CUSTOMERS = true as const;
export const OPPORTUNITY_RESEARCH_RECIPE_NO_527_IMPL = false as const;
export const OPPORTUNITY_RESEARCH_RECIPE_NEXT_AFTER_CLOSE = "#529" as const;

/** Existing owners this slice composes over (consume — do not replace). */
export const OPPORTUNITY_RESEARCH_OWNER_MODULES = [
  "contracts/research/observation.ts",
  "kernel/services/research.ts",
  "kernel/services/research-decision.ts",
  "knowledge/research/go-pivot-or-kill.md",
  "catalog/knowledge/research/research-go-pivot-or-kill.yaml",
  "checks/verification/fixtures/porchwatch-research.fixtures.ts",
] as const;

export const OBSERVATION_FIELDS = ["sourceId", "date", "context", "population", "workaround", "reportedCostOrFrustration"] as const;
export type ObservationField = (typeof OBSERVATION_FIELDS)[number];

export const INDEPENDENCE_MARKS = ["independent", "syndicated_same_chain", "exact_duplicate", "uncertain_independence"] as const;
export type IndependenceMark = (typeof INDEPENDENCE_MARKS)[number];

export const CONCEPT_FLAG_KINDS = ["fit", "unresolved_assumption", "recreates_undesirable_compromise", "countercondition"] as const;
export type ConceptFlagKind = (typeof CONCEPT_FLAG_KINDS)[number];

export const CORPUS_COMPLETENESS = ["complete_enough_for_hypotheses", "incomplete", "unknown"] as const;
export type CorpusCompleteness = (typeof CORPUS_COMPLETENESS)[number];

export interface OpportunityResearchRecipePolicy {
  readonly mode: "paper";
  readonly observationFields: typeof OBSERVATION_FIELDS;
  readonly independenceMarks: typeof INDEPENDENCE_MARKS;
  readonly conceptFlagKinds: typeof CONCEPT_FLAG_KINDS;
  readonly scrape: false;
  readonly newResearchDb: false;
  readonly productPickAuthority: false;
  readonly marketSuccessPrediction: false;
  readonly unsourcedTam: false;
  readonly customerPiiId: false;
  readonly founderBusinessSelection: false;
  readonly inferredWtp: false;
  readonly inferredDemographics: false;
  readonly repetitionProvesDemand: false;
  readonly pageCountsEqualCustomers: false;
  readonly hypothesisChangesScope: false;
  readonly hypothesisAllocatesSpend: false;
  readonly hypothesisStartsCollection: false;
  readonly incompleteCorpusYieldsCompleteMarketClaim: false;
  readonly requireExistingDecisionPath: true;
  readonly networkInAssessment: false;
  readonly maxJoinFanout: number;
  readonly ownerModules: readonly (typeof OPPORTUNITY_RESEARCH_OWNER_MODULES)[number][];
}

export const OPPORTUNITY_RESEARCH_RECIPE_POLICY: OpportunityResearchRecipePolicy = {
  mode: "paper",
  observationFields: OBSERVATION_FIELDS,
  independenceMarks: INDEPENDENCE_MARKS,
  conceptFlagKinds: CONCEPT_FLAG_KINDS,
  scrape: false,
  newResearchDb: false,
  productPickAuthority: false,
  marketSuccessPrediction: false,
  unsourcedTam: false,
  customerPiiId: false,
  founderBusinessSelection: false,
  inferredWtp: false,
  inferredDemographics: false,
  repetitionProvesDemand: false,
  pageCountsEqualCustomers: false,
  hypothesisChangesScope: false,
  hypothesisAllocatesSpend: false,
  hypothesisStartsCollection: false,
  incompleteCorpusYieldsCompleteMarketClaim: false,
  requireExistingDecisionPath: true,
  networkInAssessment: false,
  maxJoinFanout: 8,
  ownerModules: [...OPPORTUNITY_RESEARCH_OWNER_MODULES],
};

/** True only if someone wrongly wired this module into the default workflows export. */
export function opportunityResearchTouchesDefaultIndex(indexSource: string): boolean {
  return indexSource.includes("opportunity-research-map-reduce") && /export const workflows\s*=/.test(indexSource);
}
