/**
 * #528 SQ-16 — AC→evidence map for transferable product mechanisms / semantic
 * question evaluation.
 *
 * Consumes #514+#519+#521+#520+#522+#523. Coordinates #75/#74 (consume; do not
 * replace). Does not redo #512–#527. NO_529_IMPL cleared by #529. Does not implement #511 closeout or #573.
 * Paper / synthetic fixtures only. No cross-workspace customer pool / no new
 * experiment owner / no autonomous policy mutation / no causal growth promises /
 * no portfolio ranking from incomparable data / no shared visual template /
 * no new experiment assignment / no auto rewrite of measurement/policy.
 * Analogy ≠ identity. Association ≠ causal. Sessions ≠ independent products.
 * Candidate questions stay inactive until reviewed into a pinned composition.
 */
export const TRANSFERABLE_MECHANISMS_MAP_PATH = "catalog/providers/transferable-mechanisms-question-eval-map.ts" as const;
export const TRANSFERABLE_MECHANISMS_SERVICE_MODULE = "kernel/services/transferable-mechanisms-question-eval.ts" as const;
export const TRANSFERABLE_MECHANISMS_RECIPE_MODULE = "catalog/workflows/transferable-mechanisms-question-eval.ts" as const;
export const TRANSFERABLE_MECHANISMS_FIXTURE = "checks/verification/fixtures/transferable-mechanisms-question-eval.fixtures.ts" as const;
export const MEASUREMENT_OWNER = "kernel/operating-model/measurement.ts" as const;
export const MARKET_EXPERIMENT_OWNER = "kernel/operating-model/market-experiment.ts" as const;
export const QUESTION_PACK_CONTRACT = "contracts/semantic/question-pack.ts" as const;
export const CONTRIBUTION_CHECK = "kernel/contribution/check.ts" as const;

export const TRANSFERABLE_MECHANISMS_ISSUE = "#528" as const;
export const TRANSFERABLE_MECHANISMS_EPIC = "#511" as const;
export const TRANSFERABLE_MECHANISMS_PLANNING_ID = "SQ-16" as const;
export const TRANSFERABLE_MECHANISMS_CONSUMES = ["#514", "#519", "#521", "#520", "#522", "#523"] as const;
export const TRANSFERABLE_MECHANISMS_COORDINATES = ["#75", "#74"] as const;
export const TRANSFERABLE_MECHANISMS_STAMP = "0.221.49" as const;
export const TRANSFERABLE_MECHANISMS_BASE_MAIN_SHA = "f9e46b6c4a78af62a79ad17af66d5514a94071c0" as const;
export const TRANSFERABLE_MECHANISMS_LIVE_NOT_PERFORMED = true as const;
export const TRANSFERABLE_MECHANISMS_HOSTED_KEY_OWNER = "CoS→Eduardo" as const;
export const TRANSFERABLE_MECHANISMS_NO_NETWORK = true as const;
export const TRANSFERABLE_MECHANISMS_NO_CROSS_WORKSPACE_CUSTOMER_POOL = true as const;
export const TRANSFERABLE_MECHANISMS_NO_NEW_EXPERIMENT_OWNER = true as const;
export const TRANSFERABLE_MECHANISMS_NO_AUTONOMOUS_POLICY_MUTATION = true as const;
export const TRANSFERABLE_MECHANISMS_NO_CAUSAL_GROWTH_PROMISES = true as const;
export const TRANSFERABLE_MECHANISMS_NO_PORTFOLIO_RANK_FROM_INCOMPARABLE = true as const;
export const TRANSFERABLE_MECHANISMS_NO_SHARED_VISUAL_TEMPLATE = true as const;
export const TRANSFERABLE_MECHANISMS_NO_NEW_EXPERIMENT_ASSIGNMENT = true as const;
export const TRANSFERABLE_MECHANISMS_NO_AUTO_REWRITE_MEASUREMENT_POLICY = true as const;
export const TRANSFERABLE_MECHANISMS_ANALOGY_IS_NOT_IDENTITY = true as const;
export const TRANSFERABLE_MECHANISMS_ASSOCIATION_IS_NOT_CAUSAL = true as const;
export const TRANSFERABLE_MECHANISMS_SESSIONS_ARE_NOT_PRODUCTS = true as const;
export const TRANSFERABLE_MECHANISMS_NO_528_IMPL = false as const;
export const TRANSFERABLE_MECHANISMS_NEXT_AFTER_CLOSE = "#511" as const;

export const TRANSFERABLE_MECHANISMS_AC = [
  {
    id: "ac1-postmortem-feature-rejected-as-leakage",
    acceptance: "A feature derived from a later postmortem is rejected as leakage.",
    evidence: `${TRANSFERABLE_MECHANISMS_FIXTURE} :: AC1`,
    covered: true as const,
  },
  {
    id: "ac2-sessions-not-independent-products",
    acceptance: "Thousands of sessions from one product are not presented as thousands of independent product examples.",
    evidence: `${TRANSFERABLE_MECHANISMS_FIXTURE} :: AC2`,
    covered: true as const,
  },
  {
    id: "ac3-incompatible-analogy-yields-countercondition",
    acceptance: "A structural analogy with incompatible context yields a countercondition, not automatic reuse.",
    evidence: `${TRANSFERABLE_MECHANISMS_FIXTURE} :: AC3`,
    covered: true as const,
  },
  {
    id: "ac4-incompatible-metrics-unknown-attribution-block",
    acceptance: "Incompatible metrics and unknown attribution block comparative claims.",
    evidence: `${TRANSFERABLE_MECHANISMS_FIXTURE} :: AC4`,
    covered: true as const,
  },
  {
    id: "ac5-candidate-inactive-until-pinned-review",
    acceptance:
      "A useful candidate question is inactive until reviewed and explicitly included in a pinned composition; no private payload crosses workspace scope implicitly.",
    evidence: `${TRANSFERABLE_MECHANISMS_FIXTURE} :: AC5`,
    covered: true as const,
  },
] as const;

export function transferableMechanismsAcEvidence(): readonly {
  id: string;
  acceptance: string;
  evidence: string;
  covered: boolean;
}[] {
  return TRANSFERABLE_MECHANISMS_AC;
}
