/**
 * #521 SQ-09 — AC→evidence map for context-bound knowledge applicability +
 * competing graph-path retention.
 *
 * Consumes #518–#520. Does not redo them. Does not implement #522–#529.
 * Paper / synthetic fixtures only. No network-in-knowledge-reads / no new
 * registry / no founder decision logic / no least-bad endorsement.
 * Coordinates closed #75. Path scores = ranking heuristics only.
 */
export const KNOWLEDGE_APPLICABILITY_MAP_PATH = "catalog/providers/knowledge-applicability-map.ts" as const;
export const KNOWLEDGE_METHOD_ONTOLOGY = "catalog/ontology/knowledge-method-applicability.ts" as const;
export const CONTEXT_BOUND_APPLICABILITY_MODULE = "kernel/knowledge-service/context-bound-applicability.ts" as const;
export const APPLICABILITY_PATH_PROJECTION_MODULE = "kernel/services/applicability-path-projection.ts" as const;
export const KNOWLEDGE_APPLICABILITY_FIXTURE = "checks/verification/fixtures/knowledge-applicability.fixtures.ts" as const;
export const INFERENCE_RECEIPT_STORE_MODULE = "kernel/services/inference-receipt-store.ts" as const;
export const INFERENCE_INVALIDATION_MODULE = "kernel/engine/inference-invalidation.ts" as const;
export const SEMANTIC_GRAPH_VIEWS_MODULE = "kernel/knowledge-service/semantic-graph-views.ts" as const;

export const KNOWLEDGE_APPLICABILITY_ISSUE = "#521" as const;
export const KNOWLEDGE_APPLICABILITY_EPIC = "#511" as const;
export const KNOWLEDGE_APPLICABILITY_CONSUMES = ["#518", "#519", "#520"] as const;
export const KNOWLEDGE_APPLICABILITY_STAMP = "0.221.42" as const;
export const KNOWLEDGE_APPLICABILITY_BASE_MAIN_SHA = "f53f3c7bfa1573ffff5bd7fc6928d7db3acfecc2" as const;
export const KNOWLEDGE_APPLICABILITY_LIVE_NOT_PERFORMED = true as const;
export const KNOWLEDGE_APPLICABILITY_HOSTED_KEY_OWNER = "CoS→Eduardo" as const;
export const KNOWLEDGE_APPLICABILITY_IOS_SIM_OOS = true as const;
export const KNOWLEDGE_APPLICABILITY_NO_NETWORK = true as const;
export const KNOWLEDGE_APPLICABILITY_NO_REGISTRY = true as const;
export const KNOWLEDGE_APPLICABILITY_NO_FOUNDER_LOGIC = true as const;
export const KNOWLEDGE_APPLICABILITY_NO_LEAST_BAD_ENDORSEMENT = true as const;
export const KNOWLEDGE_APPLICABILITY_PATH_SCORES_ARE_HEURISTICS = true as const;
export const KNOWLEDGE_APPLICABILITY_COORDINATES_75 = true as const;
export const KNOWLEDGE_APPLICABILITY_NEXT_AFTER_CLOSE = "#522" as const;

export const KNOWLEDGE_APPLICABILITY_AC = [
  {
    id: "ac1-wrong-first-branch-recoverable",
    acceptance: "A fixture where the best first branch is wrong remains recoverable through another retained path.",
    evidence: `${KNOWLEDGE_APPLICABILITY_FIXTURE} :: AC1`,
    covered: true as const,
  },
  {
    id: "ac2-countercondition-not-applicable",
    acceptance: "A method with a matching topic but a violated countercondition is not proposed as applicable.",
    evidence: `${KNOWLEDGE_APPLICABILITY_FIXTURE} :: AC2`,
    covered: true as const,
  },
  {
    id: "ac3-no-match-none-unknown",
    acceptance: "A no-match set returns none/unknown rather than the least-bad method as an endorsement.",
    evidence: `${KNOWLEDGE_APPLICABILITY_FIXTURE} :: AC3`,
    covered: true as const,
  },
  {
    id: "ac4-bounds-terminate-explicit",
    acceptance: "Cycles, duplicate paths and adversarially broad branching terminate within declared bounds.",
    evidence: `${KNOWLEDGE_APPLICABILITY_FIXTURE} :: AC4`,
    covered: true as const,
  },
  {
    id: "ac5-invalidate-dependent-no-widen",
    acceptance: "Knowledge updates or product revisions invalidate only dependent inferred applicability, and cannot widen a selected provider scope.",
    evidence: `${KNOWLEDGE_APPLICABILITY_FIXTURE} :: AC5`,
    covered: true as const,
  },
] as const;

export function knowledgeApplicabilityAcEvidence(): readonly {
  id: string;
  acceptance: string;
  evidence: string;
  covered: boolean;
}[] {
  return KNOWLEDGE_APPLICABILITY_AC;
}
