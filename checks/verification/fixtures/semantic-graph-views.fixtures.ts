/**
 * #519 SQ-08 — provenance-bound semantic relationships / derived graph views fixtures.
 *
 * Synthetic sources only; no network. Proves all five Acceptance criteria:
 * 1. Differently worded same-failure reports related without deduplicating observations
 * 2. Differently-mechanism (similar wording) stay separate; unknown ≠ known-related-but-different
 * 3. Inferred same-entity does NOT merge accounts/experiments/requirements/accepted decisions
 * 4. Delete+rebuild index from permitted inputs reproduces the same view
 * 5. Each edge → exact source+receipt refs; conflicting edges visible
 *
 * Also covers denial seams: invalid endpoints, stale spans, inferred-to-authoritative
 * confusion, cross-workspace denial (extends check:graph-foundations / ontology fixtures).
 */
import { sha256Hex } from "../../../contracts/semantic/canonicalize.js";
import {
  SEMANTIC_GRAPH_VIEWS_AC,
  SEMANTIC_GRAPH_VIEWS_BASE_MAIN_SHA,
  SEMANTIC_GRAPH_VIEWS_CONSUMES,
  SEMANTIC_GRAPH_VIEWS_EPIC,
  SEMANTIC_GRAPH_VIEWS_FIXTURE,
  SEMANTIC_GRAPH_VIEWS_HOSTED_KEY_OWNER,
  SEMANTIC_GRAPH_VIEWS_IOS_SIM_OOS,
  SEMANTIC_GRAPH_VIEWS_ISSUE,
  SEMANTIC_GRAPH_VIEWS_LIVE_NOT_PERFORMED,
  SEMANTIC_GRAPH_VIEWS_MAP_PATH,
  SEMANTIC_GRAPH_VIEWS_NEXT_AFTER_CLOSE,
  SEMANTIC_GRAPH_VIEWS_NO_520_IMPL,
  SEMANTIC_GRAPH_VIEWS_NO_AUTO_MERGE,
  SEMANTIC_GRAPH_VIEWS_NO_GRAPH_DB,
  SEMANTIC_GRAPH_VIEWS_NO_NETWORK,
  SEMANTIC_GRAPH_VIEWS_STAMP,
  semanticGraphViewsAcEvidence,
} from "../../../catalog/providers/semantic-graph-views-map.js";
import {
  SEMANTIC_GRAPH_VIEWS_NO_520_IMPL as MODULE_NO_520,
  SEMANTIC_GRAPH_VIEWS_NO_AUTO_MERGE as MODULE_NO_AUTO_MERGE,
  SEMANTIC_GRAPH_VIEWS_NO_GRAPH_DB as MODULE_NO_GRAPH_DB,
  SEMANTIC_GRAPH_VIEWS_NO_NETWORK as MODULE_NO_NETWORK,
  SEMANTIC_GRAPH_VIEWS_SCHEMA_VERSION,
  SEMANTIC_GRAPH_VIEWS_STAMP as MODULE_STAMP,
  SEMANTIC_PREDICATE_VERSION,
  SEMANTIC_RELATIONSHIP_PREDICATES,
  SQ10_DELETION_INVALIDATION_HOOKS,
  ONTOLOGY_INVENTORY_FOR_SQ08,
  PROTECTED_MERGE_CLASS_IDS,
  buildRelationshipIndex,
  canPromoteIdentity,
  classifyMechanismRelation,
  contextDigestFromParts,
  deleteAndRebuildIndex,
  inferredSameEntityAnnotation,
  maybeRelateSameMechanism,
  queryRelationships,
  relateSameFailureReports,
  resolveEdgeProvenance,
  validateCandidateEdge,
  wouldMergeProtectedEntities,
  type CandidateEdge,
  type EvidenceSpanRef,
  type ObservationRecord,
  type SourceSnapshotInput,
  type StoredReceiptRef,
} from "../../../kernel/knowledge-service/semantic-graph-views.js";
import {
  IDENTITY_PROMOTION_REQUIRES_ACCEPTED_CHANGE_OP,
  SEMANTIC_GRAPH_OWNERSHIP_COORDINATES,
  SEMANTIC_GRAPH_OWNERSHIP_NO_520_IMPL,
  SEMANTIC_GRAPH_OWNERSHIP_NO_SECOND_GRAPH_DB,
  assertInferenceArtifactIsNotAuthoritative,
  isSq10HookDeclaredOnly,
  isSq10HookImplemented,
  listDeclaredInvalidationHookIds,
} from "../../../kernel/reducer/semantic-graph-ownership.js";
import { assert, type Harness } from "./_harness.js";

const WS = "ws.demo";
const OTHER_WS = "ws.other";

function pin(content: string): { content: string; contentSha256: string } {
  return { content, contentSha256: sha256Hex(content) };
}

function makeSource(partial: Partial<SourceSnapshotInput> & Pick<SourceSnapshotInput, "sourceId" | "content">): SourceSnapshotInput {
  const pinned = pin(partial.content);
  return {
    workspaceId: WS,
    revision: "rev-1",
    privacyClass: "workspace",
    authorized: true,
    ...partial,
    content: pinned.content,
    contentSha256: pinned.contentSha256,
  };
}

function spanOn(source: SourceSnapshotInput, start: number, end: number): EvidenceSpanRef {
  return {
    sourceId: source.sourceId,
    fieldPath: "content",
    spanStart: start,
    spanEnd: end,
    contentSha256: source.contentSha256,
  };
}

function receipt(id: string, workspaceId = WS): StoredReceiptRef {
  return {
    receiptId: id,
    workspaceId,
    projectionDigest: sha256Hex(`proj:${id}`),
    planIdentity: sha256Hex(`plan:${id}`),
  };
}

function observation(partial: Partial<ObservationRecord> & Pick<ObservationRecord, "observationId" | "wording" | "failureKey">): ObservationRecord {
  const mechanism = partial.mechanism !== undefined ? partial.mechanism : null;
  const mechanismKnown = partial.mechanismKnown !== undefined ? partial.mechanismKnown : mechanism !== null;
  return {
    workspaceId: WS,
    version: "v1",
    classId: "class.observation",
    privacyClass: "workspace",
    authority: "observed",
    evidenceSpans: [],
    ...partial,
    mechanism,
    mechanismKnown,
  };
}

export function register(harness: Harness): void {
  harness.check("semantic-graph-views: stamp/issue/consumes + AC map + hard bans", () => {
    assert(SEMANTIC_GRAPH_VIEWS_ISSUE === "#519", "issue");
    assert(SEMANTIC_GRAPH_VIEWS_EPIC === "#511", "epic");
    assert(SEMANTIC_GRAPH_VIEWS_STAMP === "0.221.40", "stamp map");
    assert(MODULE_STAMP === "0.221.40", "stamp module");
    assert(SEMANTIC_GRAPH_VIEWS_SCHEMA_VERSION === 1, "schema version");
    assert(SEMANTIC_GRAPH_VIEWS_CONSUMES.includes("#512"), "consumes #512");
    assert(SEMANTIC_GRAPH_VIEWS_CONSUMES.includes("#517"), "consumes #517");
    assert(SEMANTIC_GRAPH_VIEWS_CONSUMES.includes("#518"), "consumes #518");
    assert(SEMANTIC_GRAPH_VIEWS_CONSUMES.length === 7, "consumes seven closed slices");
    assert(SEMANTIC_GRAPH_VIEWS_NO_GRAPH_DB === true && MODULE_NO_GRAPH_DB === true, "no graph DB");
    assert(SEMANTIC_GRAPH_VIEWS_NO_AUTO_MERGE === true && MODULE_NO_AUTO_MERGE === true, "no auto merge");
    assert(SEMANTIC_GRAPH_VIEWS_NO_520_IMPL === false && MODULE_NO_520 === false, "#520 impl landed");
    assert(SEMANTIC_GRAPH_VIEWS_NO_NETWORK === true && MODULE_NO_NETWORK === true, "no network");
    assert(SEMANTIC_GRAPH_VIEWS_LIVE_NOT_PERFORMED === true, "live not performed");
    assert(SEMANTIC_GRAPH_VIEWS_IOS_SIM_OOS === true, "iOS-sim OOS");
    assert(SEMANTIC_GRAPH_VIEWS_HOSTED_KEY_OWNER.includes("Eduardo"), "hosted key owner");
    assert(SEMANTIC_GRAPH_VIEWS_NEXT_AFTER_CLOSE === "#574", "next after epic 511 remains open");
    assert(SEMANTIC_GRAPH_VIEWS_BASE_MAIN_SHA.startsWith("45a6640"), "base main sha");
    assert(SEMANTIC_GRAPH_VIEWS_MAP_PATH.includes("semantic-graph-views-map"), "map path");
    assert(SEMANTIC_GRAPH_VIEWS_FIXTURE.includes("semantic-graph-views.fixtures"), "fixture path");
    assert(SEMANTIC_RELATIONSHIP_PREDICATES.length === 5, "five narrow predicates");
    assert(ONTOLOGY_INVENTORY_FOR_SQ08.agentGraphKeptDistinct === "catalog/agent-graph", "planes distinct");
    assert(SEMANTIC_GRAPH_OWNERSHIP_NO_SECOND_GRAPH_DB === true, "ownership no second DB");
    assert(SEMANTIC_GRAPH_OWNERSHIP_NO_520_IMPL === false, "ownership 520 impl");
    assert(SEMANTIC_GRAPH_OWNERSHIP_COORDINATES.includes("#74"), "coordinates #74");
    assert(SEMANTIC_GRAPH_OWNERSHIP_COORDINATES.includes("#76"), "coordinates #76");
    assert(IDENTITY_PROMOTION_REQUIRES_ACCEPTED_CHANGE_OP === true, "accepted-change only");
    assert(isSq10HookDeclaredOnly() === false, "hooks no longer declared only");
    assert(isSq10HookImplemented() === true, "hooks implemented");
    assert(listDeclaredInvalidationHookIds().length === 4, "four hook ids");
    assert(SQ10_DELETION_INVALIDATION_HOOKS.declaredOnly === false, "sq10 implemented");
    assert(SQ10_DELETION_INVALIDATION_HOOKS.implemented === true, "sq10 implemented flag");
    const ac = semanticGraphViewsAcEvidence();
    assert(ac.length === 5 && SEMANTIC_GRAPH_VIEWS_AC.length === 5, "five AC rows");
    assert(
      ac.every((row) => row.covered),
      "all AC covered in map",
    );
  });

  harness.check("semantic-graph-views: AC1 differently worded same-failure related without dedupe", () => {
    const contentA = "Payment failed after long onboarding setup — card declined unexpectedly.";
    const contentB = "Checkout error: unexpected card decline following extended setup flow.";
    const srcA = makeSource({ sourceId: "src.obs.a", content: contentA });
    const srcB = makeSource({ sourceId: "src.obs.b", content: contentB });
    const left = observation({
      observationId: "obs.a",
      wording: contentA,
      failureKey: "payment-surprise",
      mechanism: "onboarding-effort",
      evidenceSpans: [spanOn(srcA, 0, 20)],
    });
    const right = observation({
      observationId: "obs.b",
      wording: contentB,
      failureKey: "payment-surprise",
      mechanism: "onboarding-effort",
      evidenceSpans: [spanOn(srcB, 0, 20)],
    });
    assert(left.wording !== right.wording, "differently worded");
    assert(left.observationId !== right.observationId, "distinct observation ids");

    const rct = receipt("rcpt.same-failure-1");
    const edge = relateSameFailureReports({
      left,
      right,
      receiptId: rct.receiptId,
      contextDigest: contextDigestFromParts([left.failureKey, left.observationId, right.observationId]),
      evidenceSpans: [...left.evidenceSpans, ...right.evidenceSpans],
    });
    assert(edge.predicate === "reportsSameFailureAs", "predicate");
    assert(edge.authority === "inferred", "inferred");
    assert(edge.inferenceReceiptId === rct.receiptId, "receipt bound");

    const index = buildRelationshipIndex({
      workspaceId: WS,
      sources: [srcA, srcB],
      receipts: [rct],
      edges: [edge],
      observationIds: [left.observationId, right.observationId],
    });
    assert(index.observationIds.length === 2, "observations not deduplicated");
    assert(index.observationIds.includes("obs.a") && index.observationIds.includes("obs.b"), "both ids retained");
    assert(index.edges.length === 1, "one relationship edge");
    assert(index.edges[0]!.predicate === "reportsSameFailureAs", "related by same-failure");
  });

  harness.check("semantic-graph-views: AC2 different-mechanism separate; unknown ≠ known-different", () => {
    const wording = "App freezes on paywall after long setup.";
    const src = makeSource({ sourceId: "src.mech", content: wording });
    const similarA = observation({
      observationId: "obs.mech.a",
      wording,
      failureKey: "freeze-paywall",
      mechanism: "memory-leak",
      evidenceSpans: [spanOn(src, 0, 10)],
    });
    const similarB = observation({
      observationId: "obs.mech.b",
      wording, // similarly worded
      failureKey: "freeze-paywall",
      mechanism: "network-timeout", // different mechanism
      evidenceSpans: [spanOn(src, 0, 10)],
    });
    const unknownC = observation({
      observationId: "obs.mech.c",
      wording,
      failureKey: "freeze-paywall",
      mechanism: null,
      mechanismKnown: false,
      evidenceSpans: [spanOn(src, 0, 10)],
    });

    assert(classifyMechanismRelation(similarA, similarB) === "known-different", "known different");
    assert(classifyMechanismRelation(similarA, unknownC) === "unknown", "unknown distinct");
    assert(classifyMechanismRelation(similarB, unknownC) === "unknown", "unknown vs B");
    assert(
      maybeRelateSameMechanism({
        left: similarA,
        right: similarB,
        receiptId: "rcpt.x",
        contextDigest: contextDigestFromParts(["x"]),
        evidenceSpans: [spanOn(src, 0, 10)],
      }) === null,
      "no same-mechanism edge for known-different",
    );
    assert(
      maybeRelateSameMechanism({
        left: similarA,
        right: unknownC,
        receiptId: "rcpt.x",
        contextDigest: contextDigestFromParts(["x"]),
        evidenceSpans: [spanOn(src, 0, 10)],
      }) === null,
      "no same-mechanism edge for unknown",
    );

    // Same mechanism → edge admitted
    const sameMech = observation({
      observationId: "obs.mech.d",
      wording: "Paywall freeze after setup.",
      failureKey: "freeze-paywall",
      mechanism: "memory-leak",
      evidenceSpans: [spanOn(src, 0, 10)],
    });
    assert(classifyMechanismRelation(similarA, sameMech) === "same-mechanism", "same mechanism");
    const rct = receipt("rcpt.same-mech");
    const edge = maybeRelateSameMechanism({
      left: similarA,
      right: sameMech,
      receiptId: rct.receiptId,
      contextDigest: contextDigestFromParts(["same-mech"]),
      evidenceSpans: [spanOn(src, 0, 10)],
    });
    assert(edge !== null && edge.predicate === "usesSameMechanismAs", "same-mechanism edge");

    const index = buildRelationshipIndex({
      workspaceId: WS,
      sources: [src],
      receipts: [rct],
      edges: [edge!],
      observationIds: [similarA.observationId, similarB.observationId, unknownC.observationId, sameMech.observationId],
    });
    assert(index.observationIds.length === 4, "all four observations retained separately");
    assert(
      index.edges.every((e) => e.predicate !== "usesSameMechanismAs" || e.subject.endpointId === "obs.mech.a"),
      "only same-mech pair related",
    );
    // unknown and known-different are not collapsed into each other
    assert(classifyMechanismRelation(similarA, similarB) !== classifyMechanismRelation(similarA, unknownC), "unknown ≠ known-different");
  });

  harness.check("semantic-graph-views: AC3 inferred same-entity does not merge protected entities", () => {
    const content = "Customer account A looks similar to account B in feedback wording.";
    const src = makeSource({ sourceId: "src.identity", content });
    const spans = [spanOn(src, 0, 30)];
    const rct = receipt("rcpt.same-entity");

    const protectedPairs: { leftClass: string; rightClass: string; label: string }[] = [
      { leftClass: "class.customer", rightClass: "class.customer", label: "accounts" },
      { leftClass: "class.hypothesis", rightClass: "class.hypothesis", label: "experiments" },
      { leftClass: "class.requirement", rightClass: "class.requirement", label: "requirements" },
      { leftClass: "class.decision", rightClass: "class.decision", label: "accepted decisions" },
    ];

    for (const pair of protectedPairs) {
      assert((PROTECTED_MERGE_CLASS_IDS as readonly string[]).includes(pair.leftClass), `${pair.label} protected`);
      const edge = inferredSameEntityAnnotation({
        left: {
          endpointId: `ep.${pair.label}.left`,
          endpointVersion: "v1",
          workspaceId: WS,
          classId: pair.leftClass,
          privacyClass: "workspace",
        },
        right: {
          endpointId: `ep.${pair.label}.right`,
          endpointVersion: "v1",
          workspaceId: WS,
          classId: pair.rightClass,
          privacyClass: "workspace",
        },
        receiptId: rct.receiptId,
        contextDigest: contextDigestFromParts([pair.label]),
        evidenceSpans: spans,
      });
      assert(edge.authority === "inferred", `${pair.label} inferred`);
      assert(canPromoteIdentity(edge) === false, `${pair.label} cannot promote`);
      assert(wouldMergeProtectedEntities(edge) === true, `${pair.label} would-merge flagged`);
      assert(edge.validityReason.includes("non-authoritative") || edge.validityReason.includes("inference-only"), `${pair.label} non-authoritative`);
      assertInferenceArtifactIsNotAuthoritative(edge);
      assert(edge.policyOutcome === "require-observation", `${pair.label} require-observation`);
    }

    // Build index with one inferred sameEntityAs — entities remain distinct endpoints
    const edge = inferredSameEntityAnnotation({
      left: {
        endpointId: "acct.1",
        endpointVersion: "v1",
        workspaceId: WS,
        classId: "class.customer",
        privacyClass: "workspace",
      },
      right: {
        endpointId: "acct.2",
        endpointVersion: "v1",
        workspaceId: WS,
        classId: "class.customer",
        privacyClass: "workspace",
      },
      receiptId: rct.receiptId,
      contextDigest: contextDigestFromParts(["accts"]),
      evidenceSpans: spans,
    });
    const index = buildRelationshipIndex({
      workspaceId: WS,
      sources: [src],
      receipts: [rct],
      edges: [edge],
      observationIds: ["acct.1", "acct.2"],
    });
    assert(index.observationIds.length === 2, "accounts not merged");
    assert(index.edges[0]!.subject.endpointId === "acct.1", "left endpoint retained");
    assert(index.edges[0]!.object.endpointId === "acct.2", "right endpoint retained");
  });

  harness.check("semantic-graph-views: AC4 delete+rebuild reproduces same viewDigest", () => {
    const content = "Shared failure report for rebuildability.";
    const src = makeSource({ sourceId: "src.rebuild", content, revision: "rev-rebuild-1" });
    const left = observation({
      observationId: "obs.rebuild.a",
      wording: content,
      failureKey: "rebuild-key",
      mechanism: "m1",
      evidenceSpans: [spanOn(src, 0, 15)],
    });
    const right = observation({
      observationId: "obs.rebuild.b",
      wording: "Another wording of shared failure report for rebuildability.",
      failureKey: "rebuild-key",
      mechanism: "m1",
      evidenceSpans: [spanOn(src, 0, 15)],
    });
    const rct = receipt("rcpt.rebuild");
    const edge = relateSameFailureReports({
      left,
      right,
      receiptId: rct.receiptId,
      contextDigest: contextDigestFromParts(["rebuild"]),
      evidenceSpans: [spanOn(src, 0, 15)],
    });
    const input = {
      workspaceId: WS,
      sources: [src] as const,
      receipts: [rct] as const,
      edges: [edge] as const,
      observationIds: [left.observationId, right.observationId] as const,
    };
    const first = buildRelationshipIndex({
      ...input,
      sources: [...input.sources],
      receipts: [...input.receipts],
      edges: [...input.edges],
      observationIds: [...input.observationIds],
    });
    const rebuilt = deleteAndRebuildIndex(first, {
      workspaceId: WS,
      sources: [...input.sources],
      receipts: [...input.receipts],
      edges: [...input.edges],
      observationIds: [...input.observationIds],
    });
    assert(rebuilt.viewDigest === first.viewDigest, "viewDigest identical after delete+rebuild");
    assert(rebuilt.edges.length === first.edges.length, "edge count identical");
    assert(JSON.stringify(rebuilt.observationIds) === JSON.stringify(first.observationIds), "observation ids identical");
    assert(JSON.stringify(rebuilt.rebuiltFrom) === JSON.stringify(first.rebuiltFrom), "rebuild provenance identical");
  });

  harness.check("semantic-graph-views: AC5 source+receipt refs exact; conflicting edges visible", () => {
    const supportContent = "Evidence supports the onboarding-effort mechanism claim.";
    const contradictContent = "Evidence contradicts the onboarding-effort mechanism claim.";
    const srcSupport = makeSource({ sourceId: "src.support", content: supportContent });
    const srcContradict = makeSource({ sourceId: "src.contradict", content: contradictContent });
    const rctSupport = receipt("rcpt.support");
    const rctContradict = receipt("rcpt.contradict");

    const supportEdge: CandidateEdge = {
      edgeId: "edge.evidence.support",
      subject: {
        endpointId: "ev.support",
        endpointVersion: "v1",
        workspaceId: WS,
        classId: "class.evidence",
        privacyClass: "workspace",
      },
      object: {
        endpointId: "hyp.1",
        endpointVersion: "v1",
        workspaceId: WS,
        classId: "class.hypothesis",
        privacyClass: "workspace",
      },
      predicate: "evidenceSupports",
      predicateVersion: SEMANTIC_PREDICATE_VERSION,
      contextDigest: contextDigestFromParts(["support"]),
      evidenceSpans: [spanOn(srcSupport, 0, 20)],
      inferenceReceiptId: rctSupport.receiptId,
      policyOutcome: "apply",
      validityReason: "inference-only: support judgment with citation",
      authority: "inferred",
      relationshipType: "evidenceSupports",
      contradictionSupport: "supports",
      evidenceSufficiency: "sufficient",
    };

    const contradictEdge: CandidateEdge = {
      edgeId: "edge.evidence.contradict",
      subject: {
        endpointId: "ev.contradict",
        endpointVersion: "v1",
        workspaceId: WS,
        classId: "class.evidence",
        privacyClass: "workspace",
      },
      object: {
        endpointId: "hyp.1",
        endpointVersion: "v1",
        workspaceId: WS,
        classId: "class.hypothesis",
        privacyClass: "workspace",
      },
      predicate: "evidenceContradicts",
      predicateVersion: SEMANTIC_PREDICATE_VERSION,
      contextDigest: contextDigestFromParts(["contradict"]),
      evidenceSpans: [spanOn(srcContradict, 0, 20)],
      inferenceReceiptId: rctContradict.receiptId,
      policyOutcome: "defer",
      validityReason: "inference-only: contradict judgment with citation",
      authority: "inferred",
      relationshipType: "evidenceContradicts",
      contradictionSupport: "contradicts",
      evidenceSufficiency: "sufficient",
    };

    // Same endpoints + same predicate with opposing support/contradict also conflicts
    const opposeSupport: CandidateEdge = {
      ...supportEdge,
      edgeId: "edge.evidence.oppose-support",
      subject: supportEdge.subject,
      object: supportEdge.object,
      predicate: "evidenceSupports",
      relationshipType: "evidenceSupports",
      contradictionSupport: "contradicts",
      inferenceReceiptId: rctContradict.receiptId,
      evidenceSpans: [spanOn(srcContradict, 0, 20)],
      contextDigest: contextDigestFromParts(["oppose"]),
      validityReason: "inference-only: opposing support judgment remains visible",
    };

    const index = buildRelationshipIndex({
      workspaceId: WS,
      sources: [srcSupport, srcContradict],
      receipts: [rctSupport, rctContradict],
      edges: [supportEdge, contradictEdge, opposeSupport],
      observationIds: ["ev.support", "ev.contradict", "hyp.1"],
    });

    assert(index.conflictingEdgeIds.length >= 2, "conflicting edges recorded");
    assert(index.conflictingEdgeIds.includes("edge.evidence.support"), "support in conflicts");
    assert(
      index.conflictingEdgeIds.includes("edge.evidence.contradict") || index.conflictingEdgeIds.includes("edge.evidence.oppose-support"),
      "opposing edge in conflicts",
    );

    for (const edge of index.edges) {
      const prov = resolveEdgeProvenance(edge);
      assert(prov.sourceRefs.length > 0, `${edge.edgeId} has source refs`);
      assert(prov.receiptRef !== null, `${edge.edgeId} has receipt ref`);
      assert(
        prov.sourceRefs.every((s) => s.sourceId === "src.support" || s.sourceId === "src.contradict"),
        `${edge.edgeId} exact source ids`,
      );
      assert(prov.receiptRef === "rcpt.support" || prov.receiptRef === "rcpt.contradict", `${edge.edgeId} exact receipt id`);
    }

    const queried = queryRelationships(index, { workspaceId: WS });
    assert(queried.edges.length === 3, "all edges surfaced (conflicts not hidden)");
    assert(queried.contradictionPath.length >= 1, "separate contradiction path");
    const contradictionOnly = queryRelationships(index, { workspaceId: WS, contradictionPathOnly: true });
    assert(
      contradictionOnly.edges.every((e) => e.contradictionSupport === "contradicts" || e.predicate === "evidenceContradicts"),
      "contradiction path only",
    );
  });

  harness.check("semantic-graph-views: denial — cross-workspace endpoint/source/query rejected", () => {
    const src = makeSource({ sourceId: "src.local", content: "local workspace content" });
    const rct = receipt("rcpt.local");
    const edge: CandidateEdge = {
      edgeId: "edge.cross",
      subject: {
        endpointId: "obs.local",
        endpointVersion: "v1",
        workspaceId: WS,
        classId: "class.observation",
        privacyClass: "workspace",
      },
      object: {
        endpointId: "obs.foreign",
        endpointVersion: "v1",
        workspaceId: OTHER_WS,
        classId: "class.observation",
        privacyClass: "workspace",
      },
      predicate: "reportsSameFailureAs",
      predicateVersion: SEMANTIC_PREDICATE_VERSION,
      contextDigest: contextDigestFromParts(["cross"]),
      evidenceSpans: [spanOn(src, 0, 5)],
      inferenceReceiptId: rct.receiptId,
      policyOutcome: "reject",
      validityReason: "inference-only: should be rejected for cross-workspace",
      authority: "inferred",
      relationshipType: "reportsSameFailureAs",
      contradictionSupport: "supports",
      evidenceSufficiency: "sufficient",
    };
    const validated = validateCandidateEdge(edge, {
      workspaceId: WS,
      sourcesById: new Map([[src.sourceId, src]]),
      receiptsById: new Map([[rct.receiptId, rct]]),
    });
    assert(!validated.ok && validated.code.includes("cross_workspace"), `cross-workspace denied: ${JSON.stringify(validated)}`);

    let threw = false;
    try {
      buildRelationshipIndex({
        workspaceId: WS,
        sources: [{ ...src, workspaceId: OTHER_WS }],
        receipts: [rct],
        edges: [],
        observationIds: [],
      });
    } catch (err) {
      threw = true;
      const code = (err as { code?: string }).code;
      const msg = err instanceof Error ? err.message : "";
      assert(code === "graph.cross_workspace_source" || msg.includes("src.local"), "cross-workspace source");
    }
    assert(threw, "cross-workspace source throws");

    const localEdge = inferredSameEntityAnnotation({
      left: {
        endpointId: "a1",
        endpointVersion: "v1",
        workspaceId: WS,
        classId: "class.observation",
        privacyClass: "workspace",
      },
      right: {
        endpointId: "a2",
        endpointVersion: "v1",
        workspaceId: WS,
        classId: "class.observation",
        privacyClass: "workspace",
      },
      receiptId: rct.receiptId,
      contextDigest: contextDigestFromParts(["local"]),
      evidenceSpans: [spanOn(src, 0, 5)],
    });
    const index = buildRelationshipIndex({
      workspaceId: WS,
      sources: [src],
      receipts: [rct],
      edges: [localEdge],
      observationIds: ["a1", "a2"],
    });
    const foreignQuery = queryRelationships(index, { workspaceId: OTHER_WS });
    assert(
      foreignQuery.rejected.some((r) => r.code === "graph.cross_workspace_query"),
      "cross-workspace query denied",
    );
    assert(foreignQuery.edges.length === 0, "no edges leaked");
  });

  harness.check("semantic-graph-views: denial — stale spans + private endpoints + inferred-to-authoritative", () => {
    const content = "Pinned observation text for citation checks.";
    const src = makeSource({ sourceId: "src.stale", content });
    const rct = receipt("rcpt.stale");

    // Stale span: wrong content hash
    const staleSpan: EvidenceSpanRef = {
      sourceId: src.sourceId,
      fieldPath: "content",
      spanStart: 0,
      spanEnd: 10,
      contentSha256: sha256Hex("NOT-THE-CONTENT"),
    };
    const staleEdge = inferredSameEntityAnnotation({
      left: {
        endpointId: "s1",
        endpointVersion: "v1",
        workspaceId: WS,
        classId: "class.observation",
        privacyClass: "workspace",
      },
      right: {
        endpointId: "s2",
        endpointVersion: "v1",
        workspaceId: WS,
        classId: "class.observation",
        privacyClass: "workspace",
      },
      receiptId: rct.receiptId,
      contextDigest: contextDigestFromParts(["stale"]),
      evidenceSpans: [staleSpan],
    });
    const staleResult = validateCandidateEdge(staleEdge, {
      workspaceId: WS,
      sourcesById: new Map([[src.sourceId, src]]),
      receiptsById: new Map([[rct.receiptId, rct]]),
    });
    assert(
      !staleResult.ok && (staleResult.code === "graph.stale_span" || staleResult.code === "graph.invalid_citation"),
      `stale span denied: ${JSON.stringify(staleResult)}`,
    );

    // Invalid endpoint span (out of bounds)
    const badSpan: EvidenceSpanRef = {
      sourceId: src.sourceId,
      fieldPath: "content",
      spanStart: 0,
      spanEnd: 9999,
      contentSha256: src.contentSha256,
    };
    const badEndpointEdge = { ...staleEdge, evidenceSpans: [badSpan], edgeId: "edge.bad-span" };
    const badResult = validateCandidateEdge(badEndpointEdge, {
      workspaceId: WS,
      sourcesById: new Map([[src.sourceId, src]]),
      receiptsById: new Map([[rct.receiptId, rct]]),
    });
    assert(!badResult.ok, `invalid span denied: ${JSON.stringify(badResult)}`);

    // Private endpoint denied
    const privateEdge = inferredSameEntityAnnotation({
      left: {
        endpointId: "priv.1",
        endpointVersion: "v1",
        workspaceId: WS,
        classId: "class.observation",
        privacyClass: "private",
      },
      right: {
        endpointId: "priv.2",
        endpointVersion: "v1",
        workspaceId: WS,
        classId: "class.observation",
        privacyClass: "workspace",
      },
      receiptId: rct.receiptId,
      contextDigest: contextDigestFromParts(["priv"]),
      evidenceSpans: [spanOn(src, 0, 10)],
    });
    const privResult = validateCandidateEdge(privateEdge, {
      workspaceId: WS,
      sourcesById: new Map([[src.sourceId, src]]),
      receiptsById: new Map([[rct.receiptId, rct]]),
      allowPrivateEndpoints: false,
    });
    assert(!privResult.ok && privResult.code === "graph.private_endpoint_denied", "private denied");

    // Inferred-to-authoritative confusion: protected class without non-authoritative reason
    const confused: CandidateEdge = {
      edgeId: "edge.confused",
      subject: {
        endpointId: "cust.1",
        endpointVersion: "v1",
        workspaceId: WS,
        classId: "class.customer",
        privacyClass: "workspace",
      },
      object: {
        endpointId: "cust.2",
        endpointVersion: "v1",
        workspaceId: WS,
        classId: "class.customer",
        privacyClass: "workspace",
      },
      predicate: "sameEntityAs",
      predicateVersion: SEMANTIC_PREDICATE_VERSION,
      contextDigest: contextDigestFromParts(["confused"]),
      evidenceSpans: [spanOn(src, 0, 10)],
      inferenceReceiptId: rct.receiptId,
      policyOutcome: "apply",
      validityReason: "merge these accounts", // missing inference-only / non-authoritative
      authority: "inferred",
      relationshipType: "sameEntityAs",
      contradictionSupport: "neutral",
      evidenceSufficiency: "sufficient",
    };
    const confusedResult = validateCandidateEdge(confused, {
      workspaceId: WS,
      sourcesById: new Map([[src.sourceId, src]]),
      receiptsById: new Map([[rct.receiptId, rct]]),
    });
    assert(
      !confusedResult.ok && confusedResult.code === "graph.inferred_to_authoritative_confusion",
      `inferred-to-authoritative denied: ${JSON.stringify(confusedResult)}`,
    );

    // Missing receipt on inferred
    const noReceipt = { ...confused, edgeId: "edge.no-receipt", inferenceReceiptId: null, validityReason: "inference-only / non-authoritative" };
    const noReceiptResult = validateCandidateEdge(noReceipt, {
      workspaceId: WS,
      sourcesById: new Map([[src.sourceId, src]]),
      receiptsById: new Map([[rct.receiptId, rct]]),
    });
    assert(!noReceiptResult.ok && noReceiptResult.code === "graph.inferred_missing_receipt", "missing receipt denied");
  });
}
