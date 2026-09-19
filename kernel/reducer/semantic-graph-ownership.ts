/**
 * #519 SQ-08 — Inference-artifact ownership notes for provenance-bound graph views.
 *
 * Extends existing reducer inference-artifact handling. Does NOT invent a second
 * graph database, automatic entity merges, or model-written reducer state.
 *
 * Declares deletion/invalidation hooks toward #520 / SQ-10 only —
 * no persistence / cache / erasure implementation here.
 *
 * Coordinate with #74 / #76 — do not replace proof/padding or change-impact ownership.
 */
import {
  SQ10_DELETION_INVALIDATION_HOOKS,
  SEMANTIC_GRAPH_VIEWS_ISSUE,
  SEMANTIC_GRAPH_VIEWS_NO_520_IMPL,
  type CandidateEdge,
  canPromoteIdentity,
} from "../knowledge-service/semantic-graph-views.js";

export const SEMANTIC_GRAPH_OWNERSHIP_ISSUE = "#519" as const;
export const SEMANTIC_GRAPH_OWNERSHIP_COORDINATES = ["#74", "#76"] as const;
export const SEMANTIC_GRAPH_OWNERSHIP_NO_SECOND_GRAPH_DB = true as const;
export const SEMANTIC_GRAPH_OWNERSHIP_NO_520_IMPL = SEMANTIC_GRAPH_VIEWS_NO_520_IMPL;
export const SEMANTIC_GRAPH_OWNERSHIP_HOOKS = SQ10_DELETION_INVALIDATION_HOOKS;

/** Inference artifacts may annotate; they never write accepted product truth via graph query. */
export function assertInferenceArtifactIsNotAuthoritative(edge: CandidateEdge): void {
  if (edge.authority === "inferred" && edge.predicate === "sameEntityAs") {
    if (canPromoteIdentity(edge) !== false) {
      throw new Error("graph.identity_promotion_forbidden");
    }
  }
  if (edge.authority !== "inferred" && edge.authority !== "asserted" && edge.authority !== "observed") {
    throw new Error("graph.unknown_authority");
  }
}

/** Accepted-change ops (existing) are the only path for identity promotion / product changes. */
export const IDENTITY_PROMOTION_REQUIRES_ACCEPTED_CHANGE_OP = true as const;

/** Hook seam: callers of #520 will register invalidation; #519 only declares. */
export function listDeclaredInvalidationHookIds(): readonly string[] {
  return SEMANTIC_GRAPH_OWNERSHIP_HOOKS.hooks.map((h) => h.id);
}

export function isSq10HookDeclaredOnly(): boolean {
  return (
    SEMANTIC_GRAPH_OWNERSHIP_HOOKS.declaredOnly === true &&
    SEMANTIC_GRAPH_OWNERSHIP_HOOKS.noPersistenceImpl === true &&
    SEMANTIC_GRAPH_OWNERSHIP_HOOKS.noCacheImpl === true &&
    SEMANTIC_GRAPH_OWNERSHIP_HOOKS.noErasureImpl === true &&
    SEMANTIC_GRAPH_OWNERSHIP_ISSUE === SEMANTIC_GRAPH_VIEWS_ISSUE
  );
}
