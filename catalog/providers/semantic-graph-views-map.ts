/**
 * #519 SQ-08 — AC→evidence map for provenance-bound semantic relationships / derived graph views.
 *
 * Consumes #512–#518. Does not redo them.
 * #520 hooks IMPLEMENTED. NEXT_AFTER advanced to #523 by #522. Does not implement #523–#529.
 * Paper / synthetic fixtures only. No live / no new graph DB / no auto merges.
 */
export const SEMANTIC_GRAPH_VIEWS_MAP_PATH = "catalog/providers/semantic-graph-views-map.ts" as const;
export const SEMANTIC_GRAPH_VIEWS_MODULE = "kernel/knowledge-service/semantic-graph-views.ts" as const;
export const SEMANTIC_GRAPH_OWNERSHIP_MODULE = "kernel/reducer/semantic-graph-ownership.ts" as const;
export const SEMANTIC_GRAPH_VIEWS_FIXTURE = "checks/verification/fixtures/semantic-graph-views.fixtures.ts" as const;
export const SEMANTIC_SOURCE_PROJECTION_MODULE = "kernel/services/source-projection.ts" as const;
export const SEMANTIC_SOURCE_PROJECTION_HELPERS = "kernel/knowledge-service/projection-helpers.ts" as const;
export const SEMANTIC_BATCH_MODULE = "kernel/session/semantic-batch.ts" as const;
export const SEMANTIC_CONTRACTS_RECEIPTS = "contracts/semantic/receipts.ts" as const;
export const SEMANTIC_ONTOLOGY_WORLD = "catalog/ontology/world.yaml" as const;
export const SEMANTIC_GRAPH_FOUNDATIONS_CHECK = "checks/validation/repository/check-graph-foundations.ts" as const;

export const SEMANTIC_GRAPH_VIEWS_ISSUE = "#519" as const;
export const SEMANTIC_GRAPH_VIEWS_EPIC = "#511" as const;
export const SEMANTIC_GRAPH_VIEWS_CONSUMES = ["#512", "#513", "#514", "#515", "#516", "#517", "#518"] as const;
export const SEMANTIC_GRAPH_VIEWS_STAMP = "0.221.40" as const;
export const SEMANTIC_GRAPH_VIEWS_BASE_MAIN_SHA = "45a664075f394392cd113913c685780f4e47819f" as const;
export const SEMANTIC_GRAPH_VIEWS_LIVE_NOT_PERFORMED = true as const;
export const SEMANTIC_GRAPH_VIEWS_HOSTED_KEY_OWNER = "CoS→Eduardo" as const;
export const SEMANTIC_GRAPH_VIEWS_IOS_SIM_OOS = true as const;
export const SEMANTIC_GRAPH_VIEWS_NO_NETWORK = true as const;
export const SEMANTIC_GRAPH_VIEWS_NO_GRAPH_DB = true as const;
export const SEMANTIC_GRAPH_VIEWS_NO_AUTO_MERGE = true as const;
export const SEMANTIC_GRAPH_VIEWS_NO_520_IMPL = false as const;
export const SEMANTIC_GRAPH_VIEWS_NEXT_AFTER_CLOSE = "#523" as const;
export const SEMANTIC_GRAPH_VIEWS_HOOKS_ONLY_520 = false as const;
export const SEMANTIC_GRAPH_VIEWS_HOOKS_IMPLEMENTED_520 = true as const;

export const SEMANTIC_GRAPH_VIEWS_AC = [
  {
    id: "ac1-same-failure-no-dedupe",
    acceptance: "Differently worded same-failure reports can be related without deduplicating the observations themselves.",
    evidence: `${SEMANTIC_GRAPH_VIEWS_FIXTURE} :: AC1`,
    covered: true as const,
  },
  {
    id: "ac2-different-mechanism-unknown-distinct",
    acceptance: "Similarly worded reports about different mechanisms stay separate; unknown is distinct from known-related-but-different.",
    evidence: `${SEMANTIC_GRAPH_VIEWS_FIXTURE} :: AC2`,
    covered: true as const,
  },
  {
    id: "ac3-inferred-same-entity-no-merge",
    acceptance: "An inferred same-entity result does not merge user accounts, experiments, requirements or accepted decisions.",
    evidence: `${SEMANTIC_GRAPH_VIEWS_FIXTURE} :: AC3`,
    covered: true as const,
  },
  {
    id: "ac4-delete-rebuild-same-view",
    acceptance: "Deleting and rebuilding the index from permitted source/receipt inputs reproduces the same view.",
    evidence: `${SEMANTIC_GRAPH_VIEWS_FIXTURE} :: AC4`,
    covered: true as const,
  },
  {
    id: "ac5-source-receipt-refs-conflicts-visible",
    acceptance: "Each surfaced relationship resolves to exact source and receipt references; conflicting edges remain visible.",
    evidence: `${SEMANTIC_GRAPH_VIEWS_FIXTURE} :: AC5`,
    covered: true as const,
  },
] as const;

export function semanticGraphViewsAcEvidence(): readonly {
  id: string;
  acceptance: string;
  evidence: string;
  covered: boolean;
}[] {
  return SEMANTIC_GRAPH_VIEWS_AC;
}
