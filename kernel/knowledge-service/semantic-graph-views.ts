/**
 * #519 SQ-08 — Provenance-bound semantic relationships as derived graph views.
 *
 * Pure projections over authorized source snapshots + stored receipts.
 * Rebuildable indexes — NOT a second authoritative graph database.
 * Inference stays labeled as inference; graph queries cannot promote identity
 * or perform authored product changes.
 *
 * Consumes #512–#518. Does not redo them.
 * #520 / SQ-10 deletion/invalidation hooks are IMPLEMENTED (see SQ10_DELETION_INVALIDATION_HOOKS
 * + kernel/engine/inference-invalidation.ts). NEXT_AFTER=#524 via #523. NO_524_IMPL cleared by #524. NO_525_IMPL cleared by #525. NO_526_IMPL cleared by #526. Does not implement #527–#529.
 *
 * Keep distinct: world ontology ≠ expert-method library ≠ agent/work graph.
 * Do not conflate with catalog/agent-graph or knowledge-derivations (ADR-0005).
 *
 * Jev decides (Choice/Score/Noul); LLM writes; code owns graph views + edge accounting.
 */
import { digestOf, sha256Hex } from "../../contracts/semantic/canonicalize.js";
import { type FieldProvenance, verifyPinnedExcerpt, type PinVerifyResult } from "./projection-helpers.js";

export const SEMANTIC_GRAPH_VIEWS_ISSUE = "#519" as const;
export const SEMANTIC_GRAPH_VIEWS_EPIC = "#511" as const;
export const SEMANTIC_GRAPH_VIEWS_CONSUMES = ["#512", "#513", "#514", "#515", "#516", "#517", "#518"] as const;
export const SEMANTIC_GRAPH_VIEWS_STAMP = "0.221.40" as const;
export const SEMANTIC_GRAPH_VIEWS_SCHEMA_VERSION = 1 as const;
export const SEMANTIC_GRAPH_VIEWS_NO_GRAPH_DB = true as const;
export const SEMANTIC_GRAPH_VIEWS_NO_AUTO_MERGE = true as const;
export const SEMANTIC_GRAPH_VIEWS_NO_520_IMPL = false as const;
export const SEMANTIC_GRAPH_VIEWS_NO_NETWORK = true as const;
export const SEMANTIC_GRAPH_VIEWS_NEXT_AFTER_CLOSE = "#527" as const;

/** Narrow ontology predicate inventory (#519 §1) — similarity ≠ equality. */
export const SEMANTIC_RELATIONSHIP_PREDICATES = [
  "sameEntityAs",
  "reportsSameFailureAs",
  "usesSameMechanismAs",
  "evidenceSupports",
  "evidenceContradicts",
] as const;
export type SemanticRelationshipPredicate = (typeof SEMANTIC_RELATIONSHIP_PREDICATES)[number];

/** Ontology slot IDs (stable) corresponding to narrow predicates. */
export const SEMANTIC_PREDICATE_SLOT_IDS = {
  sameEntityAs: "slot.observation.same-entity-as",
  reportsSameFailureAs: "slot.observation.reports-same-failure-as",
  usesSameMechanismAs: "slot.observation.uses-same-mechanism-as",
  evidenceSupports: "slot.evidence.about",
  evidenceContradicts: "slot.evidence.contradicts",
} as const;

export const SEMANTIC_PREDICATE_VERSION = "sq08.v1" as const;

/** Asserted/observed source facts vs model-inferred annotations (distinct). */
export type EdgeAuthority = "asserted" | "observed" | "inferred";

/** Distinct judgment dimensions — never collapsed into one fused score. */
export type ContradictionSupport = "supports" | "contradicts" | "neutral" | "unknown";
export type EvidenceSufficiency = "sufficient" | "insufficient" | "unknown";

export type PolicyOutcome = "apply" | "defer" | "reject" | "require-observation";

export type Sha256Hex = string;

export class SemanticGraphViewsError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "SemanticGraphViewsError";
    this.code = code;
  }
}

/** Endpoint version binding — rejects cross-workspace / private leakage at schema. */
export interface EndpointRef {
  readonly endpointId: string;
  readonly endpointVersion: string;
  readonly workspaceId: string;
  readonly classId: string;
  /** Privacy class of the endpoint content. */
  readonly privacyClass: "workspace" | "public" | "private";
}

export interface EvidenceSpanRef {
  readonly sourceId: string;
  readonly fieldPath: string;
  readonly spanStart: number;
  readonly spanEnd: number;
  readonly contentSha256: Sha256Hex;
}

/**
 * Candidate edge with full provenance (#519 §2).
 * Stored as rebuildable index entries over reducer/artifact inputs — not a graph DB.
 */
export interface CandidateEdge {
  readonly edgeId: string;
  readonly subject: EndpointRef;
  readonly object: EndpointRef;
  readonly predicate: SemanticRelationshipPredicate;
  readonly predicateVersion: string;
  readonly contextDigest: Sha256Hex;
  readonly evidenceSpans: readonly EvidenceSpanRef[];
  /** Required when authority === "inferred"; null for asserted/observed. */
  readonly inferenceReceiptId: string | null;
  readonly policyOutcome: PolicyOutcome | null;
  readonly validityReason: string;
  readonly authority: EdgeAuthority;
  /** Dimension 1 — relationship type (same as predicate; kept explicit). */
  readonly relationshipType: SemanticRelationshipPredicate;
  /** Dimension 2 — contradiction / support (independent of type). */
  readonly contradictionSupport: ContradictionSupport;
  /** Dimension 3 — evidence sufficiency (independent of type/support). */
  readonly evidenceSufficiency: EvidenceSufficiency;
}

export interface SourceSnapshotInput {
  readonly sourceId: string;
  readonly workspaceId: string;
  readonly revision: string;
  readonly content: string;
  readonly contentSha256: Sha256Hex;
  readonly privacyClass: "workspace" | "public" | "private";
  readonly authorized: boolean;
}

export interface StoredReceiptRef {
  readonly receiptId: string;
  readonly workspaceId: string;
  readonly projectionDigest: Sha256Hex;
  readonly planIdentity: Sha256Hex;
}

export interface ObservationRecord {
  readonly observationId: string;
  readonly workspaceId: string;
  readonly version: string;
  readonly wording: string;
  readonly failureKey: string;
  readonly mechanism: string | null;
  /** When mechanism is null and relation unknown. */
  readonly mechanismKnown: boolean;
  readonly classId: string;
  readonly privacyClass: "workspace" | "public" | "private";
  readonly authority: "asserted" | "observed";
  readonly evidenceSpans: readonly EvidenceSpanRef[];
}

export interface RelationshipIndexView {
  readonly schemaVersion: typeof SEMANTIC_GRAPH_VIEWS_SCHEMA_VERSION;
  readonly workspaceId: string;
  readonly viewDigest: Sha256Hex;
  readonly edges: readonly CandidateEdge[];
  /** Observation ids remain distinct even when related by reportsSameFailureAs. */
  readonly observationIds: readonly string[];
  /** Conflicting edge ids that remain visible (not collapsed). */
  readonly conflictingEdgeIds: readonly string[];
  readonly rebuiltFrom: {
    readonly sourceRevisions: readonly { sourceId: string; revision: string }[];
    readonly receiptIds: readonly string[];
  };
}

export interface GraphQuery {
  readonly workspaceId: string;
  readonly predicate?: SemanticRelationshipPredicate;
  readonly subjectId?: string;
  readonly objectId?: string;
  /** When true, only return contradictionSupport === "contradicts" on a separate path. */
  readonly contradictionPathOnly?: boolean;
  /** Allow private endpoints — default false (deny). */
  readonly allowPrivateEndpoints?: boolean;
}

export interface GraphQueryResult {
  readonly edges: readonly CandidateEdge[];
  readonly contradictionPath: readonly CandidateEdge[];
  readonly rejected: readonly { code: string; detail: string }[];
  readonly viewDigest: Sha256Hex;
}

/** Identity / product entities that inferred sameEntityAs must NEVER merge. */
export const PROTECTED_MERGE_CLASS_IDS = ["class.customer", "class.decision", "class.requirement", "class.hypothesis", "class.app"] as const;

/**
 * #520 / SQ-10 deletion/invalidation hooks — IMPLEMENTED.
 * Persistence/cache: kernel/services/inference-receipt-store.ts
 * Invalidation consumers: kernel/engine/inference-invalidation.ts
 * Ownership/erasure cascade: kernel/reducer/inference-receipt-ownership.ts
 * declaredOnly / no*Impl flipped false when hooks + persist are real.
 */
export const SQ10_DELETION_INVALIDATION_HOOKS = Object.freeze({
  issue: "#520" as const,
  sq: "SQ-10" as const,
  declaredOnly: false as const,
  noPersistenceImpl: false as const,
  noCacheImpl: false as const,
  noErasureImpl: false as const,
  implemented: true as const,
  implementationModules: [
    "kernel/services/inference-receipt-store.ts",
    "kernel/engine/inference-invalidation.ts",
    "kernel/reducer/inference-receipt-ownership.ts",
  ] as const,
  hooks: [
    {
      id: "hook.invalidate-edges-on-source-revision",
      trigger: "source-revision-change",
      effect: "mark-dependent-edges-stale",
      owner: "kernel/engine/inference-invalidation + #520",
      implemented: true as const,
    },
    {
      id: "hook.invalidate-edges-on-receipt-erasure",
      trigger: "authorized-erasure",
      effect: "drop-receipt-bound-edges-from-rebuildable-index",
      owner: "kernel/engine/inference-invalidation + kernel/reducer/erasure + #520",
      implemented: true as const,
    },
    {
      id: "hook.reject-stale-edge-at-commit",
      trigger: "commit-time",
      effect: "reject-stale-view-digest",
      owner: "kernel/engine/inference-invalidation + #520",
      implemented: true as const,
    },
    {
      id: "hook.rebuild-index-after-invalidation",
      trigger: "post-invalidation",
      effect: "rebuild-from-permitted-inputs-only",
      owner: "kernel/engine/inference-invalidation + semantic-graph-views + #520",
      implemented: true as const,
    },
  ] as const,
});

export function isSemanticRelationshipPredicate(value: string): value is SemanticRelationshipPredicate {
  return (SEMANTIC_RELATIONSHIP_PREDICATES as readonly string[]).includes(value);
}

/** Inventory of world classes consumed for SQ-08 endpoints (read-only cite). */
export const ONTOLOGY_INVENTORY_FOR_SQ08 = Object.freeze({
  planesKeptDistinct: ["plane.world", "plane.operator", "plane.operating"] as const,
  epistemicClasses: ["class.evidence", "class.decision", "class.hypothesis", "class.metric", "class.risk", "class.observation"] as const,
  narrowPredicatesAdded: SEMANTIC_RELATIONSHIP_PREDICATES,
  slotIds: SEMANTIC_PREDICATE_SLOT_IDS,
  agentGraphKeptDistinct: "catalog/agent-graph",
  knowledgeDerivationsNotConflated: "ADR-0005",
});

function endpointKey(ep: EndpointRef): string {
  return `${ep.workspaceId}\0${ep.endpointId}\0${ep.endpointVersion}`;
}

function assertEndpointInWorkspace(ep: EndpointRef, workspaceId: string): void {
  if (ep.workspaceId !== workspaceId) {
    throw new SemanticGraphViewsError(
      "graph.cross_workspace_endpoint",
      `endpoint ${ep.endpointId} workspace ${ep.workspaceId} ≠ query workspace ${workspaceId}`,
    );
  }
}

/**
 * Mechanically verify citation span exists in authorized pinned source before
 * any semantic support judgment — no invented citation spans.
 */
export function verifyCitationSpan(input: {
  readonly span: EvidenceSpanRef;
  readonly pinnedContent: string;
  readonly expectedContentSha256: Sha256Hex;
}): PinVerifyResult {
  return verifyPinnedExcerpt({
    pinnedContent: input.pinnedContent,
    expectedContentSha256: input.expectedContentSha256,
    spanStart: input.span.spanStart,
    spanEnd: input.span.spanEnd,
  });
}

export function allCitationsExist(
  spans: readonly EvidenceSpanRef[],
  sourcesById: ReadonlyMap<string, SourceSnapshotInput>,
): { ok: true } | { ok: false; reason: string; span: EvidenceSpanRef } {
  for (const span of spans) {
    const source = sourcesById.get(span.sourceId);
    if (!source) {
      return { ok: false, reason: "missing_source", span };
    }
    if (!source.authorized) {
      return { ok: false, reason: "unauthorized_source", span };
    }
    const verified = verifyCitationSpan({
      span,
      pinnedContent: source.content,
      expectedContentSha256: source.contentSha256,
    });
    if (verified.status !== "ok") {
      return { ok: false, reason: verified.reason, span };
    }
    if (source.contentSha256 !== span.contentSha256) {
      return { ok: false, reason: "stale_span_hash", span };
    }
  }
  return { ok: true };
}

/**
 * Validate a candidate edge before admission to the rebuildable index.
 * Rejects: cross-workspace, private endpoints (unless allowed), stale/missing
 * spans, inferred-as-authoritative confusion, missing receipt on inferred edges.
 */
export function validateCandidateEdge(
  edge: CandidateEdge,
  options: {
    readonly workspaceId: string;
    readonly sourcesById: ReadonlyMap<string, SourceSnapshotInput>;
    readonly receiptsById: ReadonlyMap<string, StoredReceiptRef>;
    readonly allowPrivateEndpoints?: boolean;
  },
): { ok: true } | { ok: false; code: string; detail: string } {
  try {
    assertEndpointInWorkspace(edge.subject, options.workspaceId);
    assertEndpointInWorkspace(edge.object, options.workspaceId);
  } catch (err) {
    if (err instanceof SemanticGraphViewsError) {
      return { ok: false, code: err.code, detail: err.message };
    }
    throw err;
  }

  if (edge.subject.workspaceId !== edge.object.workspaceId) {
    return { ok: false, code: "graph.cross_workspace_edge", detail: "subject/object workspace mismatch" };
  }

  if (!options.allowPrivateEndpoints) {
    if (edge.subject.privacyClass === "private" || edge.object.privacyClass === "private") {
      return { ok: false, code: "graph.private_endpoint_denied", detail: "private endpoints rejected" };
    }
  }

  if (!isSemanticRelationshipPredicate(edge.predicate)) {
    return { ok: false, code: "graph.unknown_predicate", detail: edge.predicate };
  }

  if (edge.predicateVersion !== SEMANTIC_PREDICATE_VERSION) {
    return { ok: false, code: "graph.stale_predicate_version", detail: edge.predicateVersion };
  }

  if (edge.relationshipType !== edge.predicate) {
    return { ok: false, code: "graph.dimension_type_mismatch", detail: "relationshipType must equal predicate" };
  }

  // Inferred edges must carry receipt; asserted/observed must not pretend to be authoritative merges.
  if (edge.authority === "inferred") {
    if (!edge.inferenceReceiptId) {
      return { ok: false, code: "graph.inferred_missing_receipt", detail: edge.edgeId };
    }
    const receipt = options.receiptsById.get(edge.inferenceReceiptId);
    if (!receipt) {
      return { ok: false, code: "graph.receipt_not_found", detail: edge.inferenceReceiptId };
    }
    if (receipt.workspaceId !== options.workspaceId) {
      return { ok: false, code: "graph.cross_workspace_receipt", detail: receipt.receiptId };
    }
  } else if (edge.inferenceReceiptId !== null) {
    return { ok: false, code: "graph.asserted_with_inference_receipt", detail: "asserted/observed edges must not carry inference receipts" };
  }

  // Inferred sameEntityAs must never be presented as authoritative identity.
  if (edge.predicate === "sameEntityAs" && edge.authority === "inferred") {
    const protectedSubject = (PROTECTED_MERGE_CLASS_IDS as readonly string[]).includes(edge.subject.classId);
    const protectedObject = (PROTECTED_MERGE_CLASS_IDS as readonly string[]).includes(edge.object.classId);
    if (protectedSubject || protectedObject) {
      // Edge may exist as inference annotation, but validityReason must declare non-authoritative.
      if (!edge.validityReason.includes("non-authoritative") && !edge.validityReason.includes("inference-only")) {
        return {
          ok: false,
          code: "graph.inferred_to_authoritative_confusion",
          detail: "inferred sameEntityAs on protected class must declare inference-only / non-authoritative",
        };
      }
    }
  }

  if (edge.evidenceSpans.length === 0 && edge.authority === "inferred") {
    return { ok: false, code: "graph.inferred_without_spans", detail: edge.edgeId };
  }

  const citations = allCitationsExist(edge.evidenceSpans, options.sourcesById);
  if (!citations.ok) {
    return {
      ok: false,
      code: citations.reason === "stale_span_hash" || citations.reason === "stale_hash" ? "graph.stale_span" : "graph.invalid_citation",
      detail: `${citations.reason}:${citations.span.sourceId}`,
    };
  }

  return { ok: true };
}

function edgeOrderKey(edge: CandidateEdge): string {
  return `${edge.predicate}\0${endpointKey(edge.subject)}\0${endpointKey(edge.object)}\0${edge.edgeId}`;
}

function computeViewDigest(workspaceId: string, edges: readonly CandidateEdge[]): Sha256Hex {
  const payload = {
    schemaVersion: SEMANTIC_GRAPH_VIEWS_SCHEMA_VERSION,
    workspaceId,
    edges: [...edges]
      .sort((a, b) => edgeOrderKey(a).localeCompare(edgeOrderKey(b)))
      .map((e) => ({
        edgeId: e.edgeId,
        subject: e.subject,
        object: e.object,
        predicate: e.predicate,
        predicateVersion: e.predicateVersion,
        contextDigest: e.contextDigest,
        evidenceSpans: e.evidenceSpans,
        inferenceReceiptId: e.inferenceReceiptId,
        policyOutcome: e.policyOutcome,
        validityReason: e.validityReason,
        authority: e.authority,
        relationshipType: e.relationshipType,
        contradictionSupport: e.contradictionSupport,
        evidenceSufficiency: e.evidenceSufficiency,
      })),
  };
  return digestOf(payload);
}

/**
 * Build a rebuildable relationship index from permitted source snapshots + stored receipts.
 * Does not write reducer state; does not merge entities; does not invent citations.
 */
export function buildRelationshipIndex(input: {
  readonly workspaceId: string;
  readonly sources: readonly SourceSnapshotInput[];
  readonly receipts: readonly StoredReceiptRef[];
  readonly edges: readonly CandidateEdge[];
  readonly observationIds: readonly string[];
  readonly allowPrivateEndpoints?: boolean;
}): RelationshipIndexView {
  const sourcesById = new Map(input.sources.map((s) => [s.sourceId, s]));
  const receiptsById = new Map(input.receipts.map((r) => [r.receiptId, r]));

  for (const source of input.sources) {
    if (source.workspaceId !== input.workspaceId) {
      throw new SemanticGraphViewsError("graph.cross_workspace_source", source.sourceId);
    }
    if (!source.authorized) {
      throw new SemanticGraphViewsError("graph.unauthorized_source", source.sourceId);
    }
  }

  const admitted: CandidateEdge[] = [];
  for (const edge of input.edges) {
    const result = validateCandidateEdge(edge, {
      workspaceId: input.workspaceId,
      sourcesById,
      receiptsById,
      allowPrivateEndpoints: input.allowPrivateEndpoints,
    });
    if (!result.ok) {
      throw new SemanticGraphViewsError(result.code, result.detail);
    }
    admitted.push(edge);
  }

  admitted.sort((a, b) => edgeOrderKey(a).localeCompare(edgeOrderKey(b)));
  const observationIds = [...new Set(input.observationIds)].sort((a, b) => a.localeCompare(b));

  // Conflicting edges: same subject/object/predicate with opposing contradictionSupport, or dual support+contradict.
  const conflictingEdgeIds: string[] = [];
  for (let i = 0; i < admitted.length; i++) {
    for (let j = i + 1; j < admitted.length; j++) {
      const a = admitted[i]!;
      const b = admitted[j]!;
      if (
        a.subject.endpointId === b.subject.endpointId &&
        a.object.endpointId === b.object.endpointId &&
        a.predicate === b.predicate &&
        a.contradictionSupport !== b.contradictionSupport &&
        (a.contradictionSupport === "supports" || a.contradictionSupport === "contradicts") &&
        (b.contradictionSupport === "supports" || b.contradictionSupport === "contradicts")
      ) {
        conflictingEdgeIds.push(a.edgeId, b.edgeId);
      }
      // Also: evidenceSupports vs evidenceContradicts on same endpoints
      if (
        a.subject.endpointId === b.subject.endpointId &&
        a.object.endpointId === b.object.endpointId &&
        ((a.predicate === "evidenceSupports" && b.predicate === "evidenceContradicts") ||
          (a.predicate === "evidenceContradicts" && b.predicate === "evidenceSupports"))
      ) {
        conflictingEdgeIds.push(a.edgeId, b.edgeId);
      }
    }
  }
  const uniqueConflicts = [...new Set(conflictingEdgeIds)].sort((a, b) => a.localeCompare(b));

  return {
    schemaVersion: SEMANTIC_GRAPH_VIEWS_SCHEMA_VERSION,
    workspaceId: input.workspaceId,
    viewDigest: computeViewDigest(input.workspaceId, admitted),
    edges: admitted,
    observationIds,
    conflictingEdgeIds: uniqueConflicts,
    rebuiltFrom: {
      sourceRevisions: input.sources.map((s) => ({ sourceId: s.sourceId, revision: s.revision })).sort((a, b) => a.sourceId.localeCompare(b.sourceId)),
      receiptIds: [...input.receipts.map((r) => r.receiptId)].sort((a, b) => a.localeCompare(b)),
    },
  };
}

/**
 * Delete and rebuild the index from the same permitted inputs — must reproduce the same viewDigest (AC4).
 */
export function deleteAndRebuildIndex(previous: RelationshipIndexView, input: Parameters<typeof buildRelationshipIndex>[0]): RelationshipIndexView {
  // Explicit discard of previous view — rebuildable index, not durable graph DB.
  void previous.viewDigest;
  return buildRelationshipIndex(input);
}

/**
 * Bounded no-network graph query over an authorized index.
 * Separate contradiction path; rejects cross-workspace / private endpoints.
 * Graph query CANNOT perform identity promotion or authored product changes.
 */
export function queryRelationships(index: RelationshipIndexView, query: GraphQuery): GraphQueryResult {
  const rejected: { code: string; detail: string }[] = [];

  if (query.workspaceId !== index.workspaceId) {
    return {
      edges: [],
      contradictionPath: [],
      rejected: [{ code: "graph.cross_workspace_query", detail: `${query.workspaceId} ≠ ${index.workspaceId}` }],
      viewDigest: index.viewDigest,
    };
  }

  let edges = index.edges.filter((e) => {
    if (query.predicate && e.predicate !== query.predicate) return false;
    if (query.subjectId && e.subject.endpointId !== query.subjectId) return false;
    if (query.objectId && e.object.endpointId !== query.objectId) return false;
    if (!query.allowPrivateEndpoints) {
      if (e.subject.privacyClass === "private" || e.object.privacyClass === "private") {
        rejected.push({ code: "graph.private_endpoint_denied", detail: e.edgeId });
        return false;
      }
    }
    return true;
  });

  const contradictionPath = edges.filter((e) => e.contradictionSupport === "contradicts" || e.predicate === "evidenceContradicts");

  if (query.contradictionPathOnly) {
    edges = contradictionPath;
  }

  return {
    edges,
    contradictionPath,
    rejected,
    viewDigest: index.viewDigest,
  };
}

/**
 * Graph query must never merge protected entities. Returns false when a caller
 * attempts to treat inferred sameEntityAs as an authoritative merge.
 */
export function canPromoteIdentity(edge: CandidateEdge): false {
  void edge;
  return false;
}

export function wouldMergeProtectedEntities(edge: CandidateEdge): boolean {
  if (edge.predicate !== "sameEntityAs") return false;
  if (edge.authority !== "inferred") return false;
  return (
    (PROTECTED_MERGE_CLASS_IDS as readonly string[]).includes(edge.subject.classId) ||
    (PROTECTED_MERGE_CLASS_IDS as readonly string[]).includes(edge.object.classId)
  );
}

/** Relate differently worded same-failure reports without deduplicating observations. */
export function relateSameFailureReports(input: {
  readonly left: ObservationRecord;
  readonly right: ObservationRecord;
  readonly receiptId: string;
  readonly contextDigest: Sha256Hex;
  readonly evidenceSpans: readonly EvidenceSpanRef[];
}): CandidateEdge {
  if (input.left.workspaceId !== input.right.workspaceId) {
    throw new SemanticGraphViewsError("graph.cross_workspace_endpoint", "observations in different workspaces");
  }
  if (input.left.failureKey !== input.right.failureKey) {
    throw new SemanticGraphViewsError("graph.failure_key_mismatch", "reportsSameFailureAs requires shared failureKey");
  }
  return {
    edgeId: `edge.same-failure.${input.left.observationId}.${input.right.observationId}`,
    subject: {
      endpointId: input.left.observationId,
      endpointVersion: input.left.version,
      workspaceId: input.left.workspaceId,
      classId: input.left.classId,
      privacyClass: input.left.privacyClass,
    },
    object: {
      endpointId: input.right.observationId,
      endpointVersion: input.right.version,
      workspaceId: input.right.workspaceId,
      classId: input.right.classId,
      privacyClass: input.right.privacyClass,
    },
    predicate: "reportsSameFailureAs",
    predicateVersion: SEMANTIC_PREDICATE_VERSION,
    contextDigest: input.contextDigest,
    evidenceSpans: input.evidenceSpans,
    inferenceReceiptId: input.receiptId,
    policyOutcome: "apply",
    validityReason: "inference-only: differently worded same-failure reports related without observation merge",
    authority: "inferred",
    relationshipType: "reportsSameFailureAs",
    contradictionSupport: "supports",
    evidenceSufficiency: "sufficient",
  };
}

/**
 * Similarly worded different-mechanism reports stay separate.
 * unknown ≠ known-related-but-different.
 */
export function classifyMechanismRelation(left: ObservationRecord, right: ObservationRecord): "same-mechanism" | "known-different" | "unknown" {
  if (!left.mechanismKnown || !right.mechanismKnown || left.mechanism === null || right.mechanism === null) {
    return "unknown";
  }
  if (left.mechanism === right.mechanism) return "same-mechanism";
  return "known-different";
}

export function maybeRelateSameMechanism(input: {
  readonly left: ObservationRecord;
  readonly right: ObservationRecord;
  readonly receiptId: string;
  readonly contextDigest: Sha256Hex;
  readonly evidenceSpans: readonly EvidenceSpanRef[];
}): CandidateEdge | null {
  const kind = classifyMechanismRelation(input.left, input.right);
  if (kind !== "same-mechanism") return null;
  return {
    edgeId: `edge.same-mechanism.${input.left.observationId}.${input.right.observationId}`,
    subject: {
      endpointId: input.left.observationId,
      endpointVersion: input.left.version,
      workspaceId: input.left.workspaceId,
      classId: input.left.classId,
      privacyClass: input.left.privacyClass,
    },
    object: {
      endpointId: input.right.observationId,
      endpointVersion: input.right.version,
      workspaceId: input.right.workspaceId,
      classId: input.right.classId,
      privacyClass: input.right.privacyClass,
    },
    predicate: "usesSameMechanismAs",
    predicateVersion: SEMANTIC_PREDICATE_VERSION,
    contextDigest: input.contextDigest,
    evidenceSpans: input.evidenceSpans,
    inferenceReceiptId: input.receiptId,
    policyOutcome: "apply",
    validityReason: "inference-only: same mechanism",
    authority: "inferred",
    relationshipType: "usesSameMechanismAs",
    contradictionSupport: "supports",
    evidenceSufficiency: "sufficient",
  };
}

/** Build an inferred sameEntityAs edge that does NOT merge protected entities. */
export function inferredSameEntityAnnotation(input: {
  readonly left: EndpointRef;
  readonly right: EndpointRef;
  readonly receiptId: string;
  readonly contextDigest: Sha256Hex;
  readonly evidenceSpans: readonly EvidenceSpanRef[];
}): CandidateEdge {
  return {
    edgeId: `edge.same-entity.${input.left.endpointId}.${input.right.endpointId}`,
    subject: input.left,
    object: input.right,
    predicate: "sameEntityAs",
    predicateVersion: SEMANTIC_PREDICATE_VERSION,
    contextDigest: input.contextDigest,
    evidenceSpans: input.evidenceSpans,
    inferenceReceiptId: input.receiptId,
    policyOutcome: "require-observation",
    validityReason: "inference-only / non-authoritative: does not merge accounts, experiments, requirements, or accepted decisions",
    authority: "inferred",
    relationshipType: "sameEntityAs",
    contradictionSupport: "neutral",
    evidenceSufficiency: input.evidenceSpans.length > 0 ? "sufficient" : "insufficient",
  };
}

export function resolveEdgeProvenance(edge: CandidateEdge): { sourceRefs: readonly EvidenceSpanRef[]; receiptRef: string | null; authority: EdgeAuthority } {
  return {
    sourceRefs: edge.evidenceSpans,
    receiptRef: edge.inferenceReceiptId,
    authority: edge.authority,
  };
}

/** FieldProvenance → EvidenceSpanRef helper (consume #517). */
export function spanFromProvenance(p: FieldProvenance): EvidenceSpanRef {
  return {
    sourceId: p.sourceId,
    fieldPath: p.fieldPath,
    spanStart: p.spanStart,
    spanEnd: p.spanEnd,
    contentSha256: p.contentSha256,
  };
}

export function contextDigestFromParts(parts: readonly string[]): Sha256Hex {
  return sha256Hex(parts.join("\n"));
}
