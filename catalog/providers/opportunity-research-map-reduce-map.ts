/**
 * #527 SQ-15 — AC→evidence map for source-backed opportunity research /
 * semantic map-reduce.
 *
 * Consumes #514+#518+#519+#521+#520+#523. Coordinates #75/#74 (consume; do not
 * replace). Does not redo #512–#526. NO_528_IMPL cleared by #528. NO_529_IMPL cleared by #529. #571 landed. Does not implement #511 closeout or #573.
 * Paper / synthetic fixtures only. No scrape / no new research DB / no
 * product-pick authority / no market-success prediction / no unsourced TAM /
 * no customer PII ID / no founder business selection. Repetition ≠ demand.
 * Hypotheses do not change scope, spend, or collection permissions.
 */
export const OPPORTUNITY_RESEARCH_MAP_PATH = "catalog/providers/opportunity-research-map-reduce-map.ts" as const;
export const OPPORTUNITY_RESEARCH_SERVICE_MODULE = "kernel/services/opportunity-research-map-reduce.ts" as const;
export const OPPORTUNITY_RESEARCH_RECIPE_MODULE = "catalog/workflows/opportunity-research-map-reduce.ts" as const;
export const OPPORTUNITY_RESEARCH_FIXTURE = "checks/verification/fixtures/opportunity-research-map-reduce.fixtures.ts" as const;
export const RESEARCH_OBSERVATION_CONTRACT = "contracts/research/observation.ts" as const;
export const RESEARCH_SERVICE = "kernel/services/research.ts" as const;
export const RESEARCH_DECISION_SERVICE = "kernel/services/research-decision.ts" as const;
export const GO_PIVOT_KNOWLEDGE = "knowledge/research/go-pivot-or-kill.md" as const;

export const OPPORTUNITY_RESEARCH_ISSUE = "#527" as const;
export const OPPORTUNITY_RESEARCH_EPIC = "#511" as const;
export const OPPORTUNITY_RESEARCH_PLANNING_ID = "SQ-15" as const;
export const OPPORTUNITY_RESEARCH_CONSUMES = ["#514", "#518", "#519", "#521", "#520", "#523"] as const;
export const OPPORTUNITY_RESEARCH_COORDINATES = ["#75", "#74"] as const;
export const OPPORTUNITY_RESEARCH_STAMP = "0.221.48" as const;
export const OPPORTUNITY_RESEARCH_BASE_MAIN_SHA = "9f109e4ab114af26100faafe61b0830337e88cfd" as const;
export const OPPORTUNITY_RESEARCH_LIVE_NOT_PERFORMED = true as const;
export const OPPORTUNITY_RESEARCH_HOSTED_KEY_OWNER = "CoS→Eduardo" as const;
export const OPPORTUNITY_RESEARCH_NO_NETWORK = true as const;
export const OPPORTUNITY_RESEARCH_NO_SCRAPE = true as const;
export const OPPORTUNITY_RESEARCH_NO_NEW_RESEARCH_DB = true as const;
export const OPPORTUNITY_RESEARCH_NO_PRODUCT_PICK = true as const;
export const OPPORTUNITY_RESEARCH_NO_MARKET_SUCCESS_PREDICTION = true as const;
export const OPPORTUNITY_RESEARCH_NO_UNSOURCED_TAM = true as const;
export const OPPORTUNITY_RESEARCH_NO_CUSTOMER_PII = true as const;
export const OPPORTUNITY_RESEARCH_NO_FOUNDER_BUSINESS_SELECTION = true as const;
export const OPPORTUNITY_RESEARCH_REPETITION_IS_NOT_DEMAND = true as const;
export const OPPORTUNITY_RESEARCH_NO_527_IMPL = false as const;
export const OPPORTUNITY_RESEARCH_NEXT_AFTER_CLOSE = "#573" as const;

export const OPPORTUNITY_RESEARCH_AC = [
  {
    id: "ac1-three-syndicated-one-source-chain",
    acceptance: "Three syndicated reports count as one source chain, not three independent demand observations.",
    evidence: `${OPPORTUNITY_RESEARCH_FIXTURE} :: AC1`,
    covered: true as const,
  },
  {
    id: "ac2-paraphrase-link-contradictory-contexts-visible",
    acceptance: "Paraphrased problems can link while contradictory contexts remain visible.",
    evidence: `${OPPORTUNITY_RESEARCH_FIXTURE} :: AC2`,
    covered: true as const,
  },
  {
    id: "ac3-recreates-undesirable-compromise-flagged",
    acceptance: "A proposed concept that recreates the reported undesirable compromise is flagged with evidence.",
    evidence: `${OPPORTUNITY_RESEARCH_FIXTURE} :: AC3`,
    covered: true as const,
  },
  {
    id: "ac4-incomplete-corpus-not-complete-market-claim",
    acceptance: "An incomplete corpus cannot yield a complete market claim; missing dates/populations remain unknown.",
    evidence: `${OPPORTUNITY_RESEARCH_FIXTURE} :: AC4`,
    covered: true as const,
  },
  {
    id: "ac5-hypothesis-no-scope-spend-collection",
    acceptance: "No hypothesis changes accepted product scope, allocates traffic/spend or starts external collection.",
    evidence: `${OPPORTUNITY_RESEARCH_FIXTURE} :: AC5`,
    covered: true as const,
  },
] as const;

export function opportunityResearchAcEvidence(): readonly {
  id: string;
  acceptance: string;
  evidence: string;
  covered: boolean;
}[] {
  return OPPORTUNITY_RESEARCH_AC;
}
