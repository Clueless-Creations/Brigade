/**
 * #519 SQ-08 — Inference-artifact ownership notes for provenance-bound graph views.
 *
 * Extends existing reducer inference-artifact handling. Does NOT invent a second
 * graph database, automatic entity merges, or model-written reducer state.
 *
 * #520 / SQ-10 deletion/invalidation hooks are IMPLEMENTED
 * (see SQ10_DELETION_INVALIDATION_HOOKS + inference-invalidation / inference-receipt-store).
 *
 * Coordinate with #74 / #76 — do not replace proof/padding or change-impact ownership.
 */
import {
  SQ10_DELETION_INVALIDATION_HOOKS,
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

/** Hook ids (declared in #519; implemented in #520). */
export function listDeclaredInvalidationHookIds(): readonly string[] {
  return SEMANTIC_GRAPH_OWNERSHIP_HOOKS.hooks.map((h) => h.id);
}

/** True only while hooks remain declaration stubs — false after #520 lands. */
export function isSq10HookDeclaredOnly(): boolean {
  return Boolean(
    SEMANTIC_GRAPH_OWNERSHIP_HOOKS.declaredOnly &&
    SEMANTIC_GRAPH_OWNERSHIP_HOOKS.noPersistenceImpl &&
    SEMANTIC_GRAPH_OWNERSHIP_HOOKS.noCacheImpl &&
    SEMANTIC_GRAPH_OWNERSHIP_HOOKS.noErasureImpl,
  );
}

/** True when #520 persist/cache/invalidation/erasure hooks are implemented. */
export function isSq10HookImplemented(): boolean {
  return (
    !SEMANTIC_GRAPH_OWNERSHIP_HOOKS.declaredOnly &&
    !SEMANTIC_GRAPH_OWNERSHIP_HOOKS.noPersistenceImpl &&
    !SEMANTIC_GRAPH_OWNERSHIP_HOOKS.noCacheImpl &&
    !SEMANTIC_GRAPH_OWNERSHIP_HOOKS.noErasureImpl &&
    SEMANTIC_GRAPH_OWNERSHIP_HOOKS.implemented &&
    !SEMANTIC_GRAPH_VIEWS_NO_520_IMPL
  );
}
