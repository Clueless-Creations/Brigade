/**
 * #516 SQ-05 — AC→evidence map for semantic query plan lowering (compile-pure).
 *
 * Consumes #512 IR / #513 qualify / #515 adapter / #514 eval. Does not redo them.
 * Does not implement #511 closeout or #573 (#517–#529 landed). No live / network / secrets in compile.
 */
export const SEMANTIC_PLAN_LOWER_MAP_PATH = "catalog/providers/semantic-plan-lower-map.ts" as const;
export const SEMANTIC_PLAN_LOWER_MODULE = "kernel/composition/semantic-plan-lower.ts" as const;
export const SEMANTIC_PLAN_LOWER_FIXTURE = "checks/verification/fixtures/semantic-plan-lower.fixtures.ts" as const;
export const SEMANTIC_CONTRACTS_QUERY_IR = "contracts/semantic/query-ir.ts" as const;

export const SEMANTIC_PLAN_LOWER_ISSUE = "#516" as const;
export const SEMANTIC_PLAN_LOWER_EPIC = "#511" as const;
export const SEMANTIC_PLAN_LOWER_CONSUMES = ["#512", "#513", "#514", "#515"] as const;
export const SEMANTIC_PLAN_LOWER_STAMP = "0.221.36" as const;
export const SEMANTIC_PLAN_LOWER_BASE_MAIN_SHA = "b8d7c7a705a16a9731017078306c8944b3da7700" as const;
export const SEMANTIC_PLAN_LOWER_LIVE_NOT_PERFORMED = true as const;
export const SEMANTIC_PLAN_LOWER_HOSTED_KEY_OWNER = "CoS→Eduardo" as const;
export const SEMANTIC_PLAN_LOWER_IOS_SIM_OOS = true as const;
export const SEMANTIC_PLAN_LOWER_NEXT_AFTER_CLOSE = "#517" as const;

export const SEMANTIC_PLAN_LOWER_AC = [
  {
    id: "ac1-four-branch-one-stage",
    acceptance: "A fixture with four independent branch checks compiles to one assessment stage, not four sequential turns.",
    evidence: `${SEMANTIC_PLAN_LOWER_FIXTURE} :: AC1`,
    covered: true as const,
  },
  {
    id: "ac2-data-dep-second-stage",
    acceptance: "A second fixture whose candidate records depend on first-round answers retains its necessary second stage.",
    evidence: `${SEMANTIC_PLAN_LOWER_FIXTURE} :: AC2`,
    covered: true as const,
  },
  {
    id: "ac3-unauthorized-no-speculative-share",
    acceptance: "An unauthorized branch cannot expose its state in a speculative shared batch.",
    evidence: `${SEMANTIC_PLAN_LOWER_FIXTURE} :: AC3`,
    covered: true as const,
  },
  {
    id: "ac4-fail-closed-invalid",
    acceptance: "Cycles, dangling state references, incompatible result types and unbounded fan-out fail before execution.",
    evidence: `${SEMANTIC_PLAN_LOWER_FIXTURE} :: AC4`,
    covered: true as const,
  },
  {
    id: "ac5-byte-stable-honest-explain",
    acceptance: "Equivalent pinned inputs yield byte-stable plans; explain estimates cannot be presented as observed latency or spend.",
    evidence: `${SEMANTIC_PLAN_LOWER_FIXTURE} :: AC5`,
    covered: true as const,
  },
] as const;

export function semanticPlanLowerAcEvidence(): readonly {
  id: string;
  acceptance: string;
  evidence: string;
  covered: boolean;
}[] {
  return SEMANTIC_PLAN_LOWER_AC;
}
