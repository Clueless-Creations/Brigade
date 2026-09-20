/**
 * #520 SQ-10 — Reverse-ref invalidation consumers for inference receipts / graph views.
 *
 * Extends kernel/engine/ source bindings + invalidation consumers.
 * Coordinates #74 / #76 — does NOT invent a parallel invalidation engine.
 * Preserves kernel/engine/source-fingerprint.ts guarantees: a probable-unaffected
 * semantic assessment NEVER bypasses mandatory device/provider/source fingerprint
 * invalidation.
 *
 * Implements the four #519-declared SQ-10 hooks:
 *   hook.invalidate-edges-on-source-revision
 *   hook.invalidate-edges-on-receipt-erasure
 *   hook.reject-stale-edge-at-commit
 *   hook.rebuild-index-after-invalidation
 *
 * Consumes #512–#519. Does not implement #521–#529.
 */
import {
  buildRelationshipIndex,
  type CandidateEdge,
  type RelationshipIndexView,
  type SourceSnapshotInput,
  type StoredReceiptRef,
} from "../knowledge-service/semantic-graph-views.js";
import type { InferenceReceiptStore } from "../services/inference-receipt-store.js";

export const INFERENCE_INVALIDATION_ISSUE = "#520" as const;
export const INFERENCE_INVALIDATION_EPIC = "#511" as const;
export const INFERENCE_INVALIDATION_COORDINATES = ["#74", "#76"] as const;
export const INFERENCE_INVALIDATION_NO_PARALLEL_ENGINE = true as const;
export const INFERENCE_INVALIDATION_PRESERVES_SOURCE_FINGERPRINT = true as const;
export const INFERENCE_INVALIDATION_STAMP = "0.221.40" as const;

export class InferenceInvalidationError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "InferenceInvalidationError";
    this.code = code;
  }
}

/** Rebuildable reverse references: sourceId → receiptIds / edgeIds that depend on it. */
export interface ReverseRefIndex {
  readonly bySourceId: ReadonlyMap<string, readonly string[]>;
  readonly byReceiptId: ReadonlyMap<string, readonly string[]>;
  readonly byProjectionDigest: ReadonlyMap<string, readonly string[]>;
  readonly byQuestionPackDigest: ReadonlyMap<string, readonly string[]>;
}

export function buildReverseRefIndex(input: {
  readonly receipts: readonly {
    readonly receiptId: string;
    readonly sourceIds: readonly string[];
    readonly projectionDigest: string;
    readonly questionPackDigest: string;
  }[];
  readonly edges: readonly CandidateEdge[];
}): ReverseRefIndex {
  const bySourceId = new Map<string, string[]>();
  const byReceiptId = new Map<string, string[]>();
  const byProjectionDigest = new Map<string, string[]>();
  const byQuestionPackDigest = new Map<string, string[]>();

  const push = (map: Map<string, string[]>, key: string, value: string) => {
    const list = map.get(key) ?? [];
    if (!list.includes(value)) list.push(value);
    map.set(key, list);
  };

  for (const r of input.receipts) {
    for (const sid of r.sourceIds) push(bySourceId, sid, r.receiptId);
    push(byProjectionDigest, r.projectionDigest, r.receiptId);
    push(byQuestionPackDigest, r.questionPackDigest, r.receiptId);
  }
  for (const edge of input.edges) {
    if (edge.inferenceReceiptId) {
      push(byReceiptId, edge.inferenceReceiptId, edge.edgeId);
    }
    for (const span of edge.evidenceSpans) {
      push(bySourceId, span.sourceId, edge.edgeId);
    }
  }

  return { bySourceId, byReceiptId, byProjectionDigest, byQuestionPackDigest };
}

export type InvalidationEffect =
  | { readonly kind: "mark-receipt-stale"; readonly receiptId: string; readonly reason: string }
  | { readonly kind: "drop-edge"; readonly edgeId: string; readonly reason: string }
  | { readonly kind: "preserve-unrelated"; readonly receiptId: string };

/**
 * Hook: invalidate-edges-on-source-revision
 * Source revision change → mark dependent receipts/edges stale; preserve unrelated.
 */
export function invalidateOnSourceRevision(input: {
  readonly changedSourceId: string;
  readonly newRevision: string;
  readonly previousRevision: string;
  readonly reverseRefs: ReverseRefIndex;
  readonly store: InferenceReceiptStore;
  readonly allReceiptIds: readonly string[];
}): { readonly effects: readonly InvalidationEffect[]; readonly invalidatedEdgeIds: readonly string[] } {
  if (input.newRevision === input.previousRevision) {
    return { effects: [], invalidatedEdgeIds: [] };
  }
  const dependent = input.reverseRefs.bySourceId.get(input.changedSourceId) ?? [];
  const effects: InvalidationEffect[] = [];
  const invalidatedEdgeIds: string[] = [];
  const touchedReceipts = new Set<string>();

  for (const id of dependent) {
    if (id.startsWith("edge.")) {
      invalidatedEdgeIds.push(id);
      effects.push({ kind: "drop-edge", edgeId: id, reason: "source-revision-change" });
    } else {
      touchedReceipts.add(id);
      input.store.markStale(id, `source-revision-change:${input.changedSourceId}`);
      effects.push({ kind: "mark-receipt-stale", receiptId: id, reason: "source-revision-change" });
    }
  }
  for (const rid of input.allReceiptIds) {
    if (!touchedReceipts.has(rid) && !input.store.isErased(rid)) {
      effects.push({ kind: "preserve-unrelated", receiptId: rid });
    }
  }
  return { effects, invalidatedEdgeIds };
}

/**
 * Hook: invalidate-edges-on-receipt-erasure
 * Authorized erasure → drop receipt-bound edges from rebuildable index.
 */
export function invalidateOnReceiptErasure(input: {
  readonly erasedReceiptId: string;
  readonly reverseRefs: ReverseRefIndex;
  readonly edges: readonly CandidateEdge[];
}): {
  readonly droppedEdgeIds: readonly string[];
  readonly retainedEdges: readonly CandidateEdge[];
} {
  const bound = new Set(input.reverseRefs.byReceiptId.get(input.erasedReceiptId) ?? []);
  // Also drop any edge that still references the erased receipt id directly.
  for (const e of input.edges) {
    if (e.inferenceReceiptId === input.erasedReceiptId) bound.add(e.edgeId);
  }
  const droppedEdgeIds = [...bound].sort((a, b) => a.localeCompare(b));
  const retainedEdges = input.edges.filter((e) => !bound.has(e.edgeId));
  return { droppedEdgeIds, retainedEdges };
}

/**
 * Hook: reject-stale-edge-at-commit
 * Commit-time check: refuse stale view digest / stale receipt-bound edges.
 */
export function rejectStaleEdgeAtCommit(input: {
  readonly edge: CandidateEdge;
  readonly expectedViewDigest: string;
  readonly currentViewDigest: string;
  readonly store: InferenceReceiptStore;
}): { readonly ok: true } | { readonly ok: false; readonly code: string; readonly detail: string } {
  if (input.expectedViewDigest !== input.currentViewDigest) {
    return { ok: false, code: "commit.stale_view_digest", detail: "view digest drifted — refuse stale commit" };
  }
  if (input.edge.inferenceReceiptId) {
    const record = input.store.get(input.edge.inferenceReceiptId);
    if (!record) {
      return { ok: false, code: "commit.receipt_missing", detail: input.edge.inferenceReceiptId };
    }
    if (record.erased) {
      return { ok: false, code: "commit.receipt_erased", detail: input.edge.inferenceReceiptId };
    }
    if (record.stale) {
      return { ok: false, code: "commit.receipt_stale", detail: record.staleReason ?? "stale" };
    }
    if (!record.published) {
      return { ok: false, code: "commit.receipt_unpublished", detail: "persist-before-publish required" };
    }
  }
  return { ok: true };
}

/**
 * Hook: rebuild-index-after-invalidation
 * Rebuild from permitted inputs only — erased receipts MUST NOT be restored.
 */
export function rebuildIndexAfterInvalidation(input: {
  readonly workspaceId: string;
  readonly sources: readonly SourceSnapshotInput[];
  readonly store: InferenceReceiptStore;
  readonly edges: readonly CandidateEdge[];
  readonly observationIds: readonly string[];
  readonly priorIndex?: RelationshipIndexView;
}): RelationshipIndexView {
  const live = input.store.listLiveReceiptsForRebuild(input.workspaceId);
  const receipts: StoredReceiptRef[] = live.map((r) => ({
    receiptId: r.receipt.receiptId,
    workspaceId: r.workspaceId,
    projectionDigest: r.receipt.projectionDigest,
    planIdentity: r.receipt.planIdentity,
  }));
  // Filter edges whose inference receipts are erased / missing from live set.
  const liveIds = new Set(receipts.map((r) => r.receiptId));
  const permittedEdges = input.edges.filter((e) => {
    if (e.authority !== "inferred") return true;
    if (!e.inferenceReceiptId) return false;
    if (input.store.isErased(e.inferenceReceiptId)) return false;
    return liveIds.has(e.inferenceReceiptId);
  });
  if (input.priorIndex) {
    // Explicit discard — rebuildable index, not durable graph DB restoring erased data.
    void input.priorIndex.viewDigest;
  }
  return buildRelationshipIndex({
    workspaceId: input.workspaceId,
    sources: input.sources,
    receipts,
    edges: permittedEdges,
    observationIds: input.observationIds,
  });
}

/**
 * AC5 — A probable-unaffected assessment cannot keep stale mandatory
 * device/provider/source proof valid. Coordinates source-fingerprint guarantees;
 * does not alter them. Semantic "probably unaffected" NEVER waives fingerprint drift.
 */
export type MandatoryProofKind = "device" | "provider" | "source";

export interface MandatoryProofState {
  readonly kind: MandatoryProofKind;
  readonly acceptedFingerprint: string;
  readonly currentFingerprint: string;
}

export interface ProbableUnaffectedAssessment {
  readonly probablyUnaffected: true;
  /** Assessment confidence in [0,1] — never fabricates certainty that waives proof. */
  readonly confidence: number;
  readonly note?: string;
}

export function evaluateProbableUnaffectedAgainstMandatoryProofs(input: {
  readonly assessment: ProbableUnaffectedAssessment;
  readonly mandatoryProofs: readonly MandatoryProofState[];
}):
  | { readonly mayKeepValid: true; readonly allProofsCurrent: true }
  | {
      readonly mayKeepValid: false;
      readonly reason: "stale_mandatory_proof";
      readonly staleKinds: readonly MandatoryProofKind[];
      readonly assessmentIgnoredForWaiver: true;
    } {
  void input.assessment.confidence; // confidence never waives
  void input.assessment.probablyUnaffected;
  const staleKinds = input.mandatoryProofs.filter((p) => p.acceptedFingerprint !== p.currentFingerprint).map((p) => p.kind);
  if (staleKinds.length > 0) {
    return {
      mayKeepValid: false,
      reason: "stale_mandatory_proof",
      staleKinds,
      assessmentIgnoredForWaiver: true,
    };
  }
  return { mayKeepValid: true, allProofsCurrent: true };
}

/** Implemented hook registry — clears #519 declaredOnly seam when wired. */
export const SQ10_IMPLEMENTED_HOOKS = Object.freeze({
  "hook.invalidate-edges-on-source-revision": invalidateOnSourceRevision,
  "hook.invalidate-edges-on-receipt-erasure": invalidateOnReceiptErasure,
  "hook.reject-stale-edge-at-commit": rejectStaleEdgeAtCommit,
  "hook.rebuild-index-after-invalidation": rebuildIndexAfterInvalidation,
} as const);

export const SQ10_IMPLEMENTED_HOOK_IDS = [
  "hook.invalidate-edges-on-source-revision",
  "hook.invalidate-edges-on-receipt-erasure",
  "hook.reject-stale-edge-at-commit",
  "hook.rebuild-index-after-invalidation",
] as const;
