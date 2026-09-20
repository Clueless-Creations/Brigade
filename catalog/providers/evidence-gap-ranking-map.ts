/**
 * #524 SQ-12 — AC→evidence map for evidence-gap / decision-impact ranking.
 *
 * Consumes #522+#523. Does not redo them. Does not implement #526–#529.
 * Paper / synthetic fixtures only. Planner remains sole eligibility owner.
 * No network in plan reads / no new planner / no authority reorder /
 * no founder-question-count change / no auto-approval / no inferred preferences.
 */
export const EVIDENCE_GAP_RANKING_MAP_PATH = "catalog/providers/evidence-gap-ranking-map.ts" as const;
export const EVIDENCE_GAP_RANKING_SERVICE_MODULE = "kernel/services/evidence-gap-ranking.ts" as const;
export const EVIDENCE_GAP_RANKING_RECIPE_MODULE = "catalog/workflows/evidence-gap-ranking.ts" as const;
export const EVIDENCE_GAP_RANKING_FIXTURE = "checks/verification/fixtures/evidence-gap-ranking.fixtures.ts" as const;
export const PLAN_MODULE = "kernel/session/plan.ts" as const;
export const FRONTIER_MODULE = "kernel/engine/frontier.ts" as const;
export const PLAN_PROJECTION_MODULE = "kernel/services/plan-projection.ts" as const;

export const EVIDENCE_GAP_RANKING_ISSUE = "#524" as const;
export const EVIDENCE_GAP_RANKING_EPIC = "#511" as const;
export const EVIDENCE_GAP_RANKING_PLANNING_ID = "SQ-12" as const;
export const EVIDENCE_GAP_RANKING_CONSUMES = ["#522", "#523"] as const;
export const EVIDENCE_GAP_RANKING_STAMP = "0.221.45" as const;
export const EVIDENCE_GAP_RANKING_BASE_MAIN_SHA = "94334f9cabcaff98309fb80f893e58aa8f344f71" as const;
export const EVIDENCE_GAP_RANKING_LIVE_NOT_PERFORMED = true as const;
export const EVIDENCE_GAP_RANKING_HOSTED_KEY_OWNER = "CoS→Eduardo" as const;
export const EVIDENCE_GAP_RANKING_IOS_SIM_OOS = true as const;
export const EVIDENCE_GAP_RANKING_NO_NETWORK = true as const;
export const EVIDENCE_GAP_RANKING_NO_NEW_PLANNER = true as const;
export const EVIDENCE_GAP_RANKING_NO_AUTHORITY_REORDER = true as const;
export const EVIDENCE_GAP_RANKING_NO_FOUNDER_QUESTION_COUNT_CHANGE = true as const;
export const EVIDENCE_GAP_RANKING_NO_AUTO_APPROVAL = true as const;
export const EVIDENCE_GAP_RANKING_NO_INFERRED_PREFERENCES = true as const;
export const EVIDENCE_GAP_RANKING_INFO_VALUE_IS_HEURISTIC = true as const;
export const EVIDENCE_GAP_RANKING_NO_524_IMPL = false as const;
export const EVIDENCE_GAP_RANKING_NEXT_AFTER_CLOSE = "#526" as const;

export const EVIDENCE_GAP_RANKING_AC = [
  {
    id: "ac1-equal-eligible-diverge-on-blocking-gap",
    acceptance:
      "Two equally eligible steps rank differently when one can resolve a blocking evidence gap; the explanation identifies its downstream dependency.",
    evidence: `${EVIDENCE_GAP_RANKING_FIXTURE} :: AC1`,
    covered: true as const,
  },
  {
    id: "ac2-founder-approval-wins-over-info-gain",
    acceptance: "A required founder approval still wins over a high predicted information-gain task.",
    evidence: `${EVIDENCE_GAP_RANKING_FIXTURE} :: AC2`,
    covered: true as const,
  },
  {
    id: "ac3-observation-vs-retrieval-distinct-actions",
    acceptance: "Missing observation and missing retrieval trigger different candidate actions.",
    evidence: `${EVIDENCE_GAP_RANKING_FIXTURE} :: AC3`,
    covered: true as const,
  },
  {
    id: "ac4-repeated-plan-zero-workspace-provider-delta",
    acceptance: "Repeated plan calls leave all workspace files and provider request counts unchanged.",
    evidence: `${EVIDENCE_GAP_RANKING_FIXTURE} :: AC4`,
    covered: true as const,
  },
  {
    id: "ac5-source-change-invalidates-conflict-legible",
    acceptance: "Source changes invalidate the question/proposal; contradictory evidence remains legible rather than collapsed into one confidence number.",
    evidence: `${EVIDENCE_GAP_RANKING_FIXTURE} :: AC5`,
    covered: true as const,
  },
] as const;

export function evidenceGapRankingAcEvidence(): readonly {
  id: string;
  acceptance: string;
  evidence: string;
  covered: boolean;
}[] {
  return EVIDENCE_GAP_RANKING_AC;
}
