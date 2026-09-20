/**
 * #521 SQ-09 — Context-bound knowledge applicability + competing graph paths
 * fixtures (paper; synthetic; no-network).
 *
 * Proves all five Acceptance criteria:
 * 1. Best first branch wrong → recoverable via another retained path
 * 2. Matching topic + violated countercondition → not applicable
 * 3. No-match → none/unknown (not least-bad endorsement)
 * 4. Cycles / duplicate paths / adversarially broad branching terminate in bounds
 * 5. Knowledge/product revision invalidates only dependent inferred applicability;
 *    cannot widen selected provider scope
 *
 * Also: NO_521_IMPL cleared on #520 stamps; NEXT_AFTER advanced to #523 by #522; no network-in-reads.
 */
import { assert, type Harness } from "./_harness.js";
import { digestOf } from "../../../contracts/semantic/canonicalize.js";
import { PLAN_IDENTITY_CANONICALIZATION_VERSION } from "../../../contracts/semantic/query-ir.js";
import {
  FIXTURE_METHOD_CATALOG,
  KNOWLEDGE_METHOD_APPLICABILITY_COORDINATES_75,
  KNOWLEDGE_METHOD_APPLICABILITY_NO_NETWORK,
  KNOWLEDGE_METHOD_APPLICABILITY_NO_REGISTRY,
  KNOWLEDGE_METHOD_APPLICABILITY_STAMP,
  evaluateBoundedCandidates,
  evaluateMethodApplicability,
  type BusinessContextSnapshot,
  type MethodApplicabilityResource,
} from "../../../catalog/ontology/knowledge-method-applicability.js";
import {
  CONTEXT_BOUND_APPLICABILITY_CONSUMES,
  CONTEXT_BOUND_APPLICABILITY_EPIC,
  CONTEXT_BOUND_APPLICABILITY_ISSUE,
  CONTEXT_BOUND_APPLICABILITY_NEXT_AFTER_CLOSE,
  CONTEXT_BOUND_APPLICABILITY_NO_FOUNDER_LOGIC,
  CONTEXT_BOUND_APPLICABILITY_NO_NETWORK,
  CONTEXT_BOUND_APPLICABILITY_NO_REGISTRY,
  CONTEXT_BOUND_APPLICABILITY_PATH_SCORES_ARE_HEURISTICS,
  CONTEXT_BOUND_APPLICABILITY_STAMP,
  boundedCompetingPathBeam,
  evaluateApplicabilityWithCompetingPaths,
  recoverViaRetainedPeerPath,
  type GraphEdge,
  type GraphNode,
} from "../../../kernel/knowledge-service/context-bound-applicability.js";
import {
  APPLICABILITY_PATH_PROJECTION_CONSUMES,
  APPLICABILITY_PATH_PROJECTION_ISSUE,
  APPLICABILITY_PATH_PROJECTION_NEXT_AFTER_CLOSE,
  APPLICABILITY_PATH_PROJECTION_NO_NETWORK,
  APPLICABILITY_PATH_PROJECTION_NO_PROVIDER_SCOPE_WIDEN,
  APPLICABILITY_PATH_PROJECTION_STAMP,
  invalidateDependentApplicabilityEdges,
  projectApplicabilityPaths,
  reevaluateApplicabilityEdge,
} from "../../../kernel/services/applicability-path-projection.js";
import {
  INFERENCE_RECEIPT_STORE_NEXT_AFTER_CLOSE,
  INFERENCE_RECEIPT_STORE_NO_521_IMPL,
  INFERENCE_RECEIPT_STORE_NO_NETWORK,
  InferenceReceiptStore,
  buildScopedCacheKey,
  type ScopedCacheKeyParts,
} from "../../../kernel/services/inference-receipt-store.js";
import { INFERENCE_RECEIPT_OWNERSHIP_NO_521_IMPL } from "../../../kernel/reducer/inference-receipt-ownership.js";
import {
  INFERENCE_RECEIPTS_NEXT_AFTER_CLOSE,
  INFERENCE_RECEIPTS_NO_521_IMPL,
  INFERENCE_RECEIPTS_NO_NETWORK,
} from "../../../catalog/providers/inference-receipts-map.js";
import { SEMANTIC_GRAPH_VIEWS_NEXT_AFTER_CLOSE as MAP_GRAPH_NEXT } from "../../../catalog/providers/semantic-graph-views-map.js";
import {
  SEMANTIC_GRAPH_VIEWS_NEXT_AFTER_CLOSE as MODULE_GRAPH_NEXT,
  SEMANTIC_GRAPH_VIEWS_NO_NETWORK,
} from "../../../kernel/knowledge-service/semantic-graph-views.js";
import {
  KNOWLEDGE_APPLICABILITY_AC,
  KNOWLEDGE_APPLICABILITY_BASE_MAIN_SHA,
  KNOWLEDGE_APPLICABILITY_CONSUMES,
  KNOWLEDGE_APPLICABILITY_COORDINATES_75,
  KNOWLEDGE_APPLICABILITY_EPIC,
  KNOWLEDGE_APPLICABILITY_FIXTURE,
  KNOWLEDGE_APPLICABILITY_HOSTED_KEY_OWNER,
  KNOWLEDGE_APPLICABILITY_IOS_SIM_OOS,
  KNOWLEDGE_APPLICABILITY_ISSUE,
  KNOWLEDGE_APPLICABILITY_LIVE_NOT_PERFORMED,
  KNOWLEDGE_APPLICABILITY_MAP_PATH,
  KNOWLEDGE_APPLICABILITY_NEXT_AFTER_CLOSE,
  KNOWLEDGE_APPLICABILITY_NO_FOUNDER_LOGIC,
  KNOWLEDGE_APPLICABILITY_NO_LEAST_BAD_ENDORSEMENT,
  KNOWLEDGE_APPLICABILITY_NO_NETWORK,
  KNOWLEDGE_APPLICABILITY_NO_REGISTRY,
  KNOWLEDGE_APPLICABILITY_PATH_SCORES_ARE_HEURISTICS,
  KNOWLEDGE_APPLICABILITY_STAMP,
  knowledgeApplicabilityAcEvidence,
} from "../../../catalog/providers/knowledge-applicability-map.js";
import type { CandidateRecord } from "../../../kernel/knowledge-service/projection-helpers.js";

const WS = "ws.applicability.demo";
const NOW = "2026-09-19T23:48:00.000Z";

function hex(label: string): string {
  return digestOf(label);
}

function baseContext(partial: Partial<BusinessContextSnapshot> = {}): BusinessContextSnapshot {
  return {
    workspaceId: WS,
    productRevision: "rev-1",
    stage: "activation",
    audience: "consumer",
    scope: "onboarding",
    selectedProviderId: "b2c/revenuecat",
    facts: { paywallShown: "false", monetizationSelected: "true" },
    availableEvidenceIds: [
      "evidence.first-value-event",
      "evidence.session-timeline",
      "evidence.offer-impression",
      "evidence.journey-graph",
      "evidence.error-receipt",
    ],
    ...partial,
  };
}

function cacheParts(partial: Partial<ScopedCacheKeyParts> = {}): ScopedCacheKeyParts {
  return {
    workspaceId: WS,
    securityScope: "scope.workspace",
    sourceDigest: hex("src-applicability-1"),
    projectionDigest: hex("proj-applicability-1"),
    questionPackDigest: hex("qpack-applicability-1"),
    bindingId: "binding.typesafe.fixture",
    adapterDigest: hex("adapter-1"),
    responseContractDigest: hex("response-contract-1"),
    modelIdentity: "model.rev.fixture",
    locale: "en-US",
    purpose: "knowledge-applicability",
    canonicalizationVersion: PLAN_IDENTITY_CANONICALIZATION_VERSION,
    ...partial,
  };
}

function sampleReceipt(receiptId: string): Record<string, unknown> {
  return {
    schemaVersion: 1,
    kind: "inference-receipt",
    evidenceClass: "inference",
    receiptId,
    requestId: "req.applicability.1",
    attemptId: "att.applicability.1",
    workspaceId: WS,
    planId: "plan.applicability.1",
    planIdentity: hex("plan-applicability-1"),
    questionPackId: "qpack.applicability.1",
    questionPackDigest: hex("qpack-applicability-1"),
    projectionDigest: hex("proj-applicability-1"),
    sourceRevisions: [{ sourceId: "src.reports", revision: "rev-1" }],
    coverage: { includedSourceIds: ["src.reports"], omittedSourceIds: [], omittedFields: [] },
    binding: {
      providerBindingId: "binding.typesafe.fixture",
      requestedModel: "model.rev.fixture",
      returnedModel: "model.rev.fixture",
    },
    results: [{ status: "answered", answer: { kind: "noul", questionId: "q.applicability", probability: 0.61 } }],
    usageCost: { status: "unknown", reason: "fixture-no-provider" },
    recordedAt: NOW,
    privacy: { dataClassification: "workspace", purpose: "knowledge-applicability" },
  };
}

/** Competing-path graph: misleading high-score first branch + recoverable gold peer. */
function competingPathGraph(): { nodes: GraphNode[]; edges: GraphEdge[]; seeds: string[] } {
  const nodes: GraphNode[] = [
    { nodeId: "obs.dropoff", kind: "observation", label: "activation dropoff report" },
    {
      nodeId: "expl.unexpected-offer",
      kind: "explanation",
      label: "unexpected offer (misleading first)",
      explanationFamily: "unexpected-offer",
      methodId: "method.unexpected-offer",
      evidenceIds: ["evidence.offer-impression"],
    },
    {
      nodeId: "expl.value-delay",
      kind: "explanation",
      label: "value delay (gold)",
      explanationFamily: "value-delay",
      methodId: "method.value-delay-activation",
      evidenceIds: ["evidence.first-value-event", "evidence.session-timeline"],
    },
    {
      nodeId: "expl.wrong-journey",
      kind: "explanation",
      label: "wrong journey (also gold)",
      explanationFamily: "wrong-journey",
      methodId: "method.wrong-journey",
      evidenceIds: ["evidence.journey-graph"],
    },
    {
      nodeId: "expl.impl-defect",
      kind: "explanation",
      label: "implementation defect",
      explanationFamily: "implementation-defect",
      methodId: "method.implementation-defect",
      evidenceIds: ["evidence.error-receipt"],
    },
  ];
  const edges: GraphEdge[] = [
    // Misleading first branch ranks highest.
    {
      edgeId: "edge.obs->unexpected",
      from: "obs.dropoff",
      to: "expl.unexpected-offer",
      relation: "explainsAs",
      heuristicScore: 0.95,
    },
    {
      edgeId: "edge.obs->value-delay",
      from: "obs.dropoff",
      to: "expl.value-delay",
      relation: "explainsAs",
      heuristicScore: 0.7,
    },
    {
      edgeId: "edge.obs->wrong-journey",
      from: "obs.dropoff",
      to: "expl.wrong-journey",
      relation: "explainsAs",
      heuristicScore: 0.65,
    },
    {
      edgeId: "edge.obs->impl",
      from: "obs.dropoff",
      to: "expl.impl-defect",
      relation: "explainsAs",
      heuristicScore: 0.4,
      contradicts: true,
    },
  ];
  return { nodes, edges, seeds: ["obs.dropoff"] };
}

function adversarialGraph(): { nodes: GraphNode[]; edges: GraphEdge[]; seeds: string[] } {
  const nodes: GraphNode[] = [{ nodeId: "n.root", kind: "observation", label: "root" }];
  const edges: GraphEdge[] = [];
  // Broad branching + cycle back to root.
  for (let i = 0; i < 12; i += 1) {
    const id = `n.child.${i}`;
    nodes.push({ nodeId: id, kind: "explanation", label: `child ${i}`, explanationFamily: "unknown" });
    edges.push({
      edgeId: `edge.root->${i}`,
      from: "n.root",
      to: id,
      relation: "explainsAs",
      heuristicScore: 1 - i * 0.01,
    });
    // Cycle: child → root
    edges.push({
      edgeId: `edge.${i}->root`,
      from: id,
      to: "n.root",
      relation: "evidenceSupports",
      heuristicScore: 0.1,
    });
    // Duplicate-ish parallel edge to same child from a side node creates visited dedupe pressure
    if (i > 0) {
      edges.push({
        edgeId: `edge.side.${i}`,
        from: `n.child.${i - 1}`,
        to: id,
        relation: "evidenceSupports",
        heuristicScore: 0.05,
      });
    }
  }
  return { nodes, edges, seeds: ["n.root"] };
}

export function register(harness: Harness): void {
  harness.check("knowledge-applicability: stamp/issue/consumes + AC map + hard bans + NO_521 cleared", () => {
    assert(KNOWLEDGE_APPLICABILITY_ISSUE === "#521", "issue");
    assert(CONTEXT_BOUND_APPLICABILITY_ISSUE === "#521", "module issue");
    assert(APPLICABILITY_PATH_PROJECTION_ISSUE === "#521", "projection issue");
    assert(KNOWLEDGE_APPLICABILITY_EPIC === "#511", "epic");
    assert(CONTEXT_BOUND_APPLICABILITY_EPIC === "#511", "module epic");
    assert(KNOWLEDGE_APPLICABILITY_STAMP === "0.221.42", "map stamp");
    assert(CONTEXT_BOUND_APPLICABILITY_STAMP === "0.221.42", "module stamp");
    assert(APPLICABILITY_PATH_PROJECTION_STAMP === "0.221.42", "projection stamp");
    assert(KNOWLEDGE_METHOD_APPLICABILITY_STAMP === "0.221.42", "ontology stamp");
    assert(KNOWLEDGE_APPLICABILITY_CONSUMES.includes("#518"), "consumes #518");
    assert(KNOWLEDGE_APPLICABILITY_CONSUMES.includes("#519"), "consumes #519");
    assert(KNOWLEDGE_APPLICABILITY_CONSUMES.includes("#520"), "consumes #520");
    assert(KNOWLEDGE_APPLICABILITY_CONSUMES.length === 3, "consumes three");
    assert(CONTEXT_BOUND_APPLICABILITY_CONSUMES.length === 3, "module consumes three");
    assert(APPLICABILITY_PATH_PROJECTION_CONSUMES.length === 3, "projection consumes three");
    assert(KNOWLEDGE_APPLICABILITY_NO_NETWORK === true, "map no network");
    assert(CONTEXT_BOUND_APPLICABILITY_NO_NETWORK === true, "module no network");
    assert(APPLICABILITY_PATH_PROJECTION_NO_NETWORK === true, "projection no network");
    assert(KNOWLEDGE_METHOD_APPLICABILITY_NO_NETWORK === true, "ontology no network");
    assert(INFERENCE_RECEIPTS_NO_NETWORK === true, "receipts no network");
    assert(INFERENCE_RECEIPT_STORE_NO_NETWORK === true, "store no network");
    assert(SEMANTIC_GRAPH_VIEWS_NO_NETWORK === true, "graph views no network");
    assert(KNOWLEDGE_APPLICABILITY_NO_REGISTRY === true, "no registry");
    assert(CONTEXT_BOUND_APPLICABILITY_NO_REGISTRY === true, "module no registry");
    assert(KNOWLEDGE_METHOD_APPLICABILITY_NO_REGISTRY === true, "ontology no registry");
    assert(KNOWLEDGE_APPLICABILITY_NO_FOUNDER_LOGIC === true, "no founder");
    assert(CONTEXT_BOUND_APPLICABILITY_NO_FOUNDER_LOGIC === true, "module no founder");
    assert(KNOWLEDGE_APPLICABILITY_NO_LEAST_BAD_ENDORSEMENT === true, "no least-bad");
    assert(KNOWLEDGE_APPLICABILITY_PATH_SCORES_ARE_HEURISTICS === true, "heuristics");
    assert(CONTEXT_BOUND_APPLICABILITY_PATH_SCORES_ARE_HEURISTICS === true, "module heuristics");
    assert(APPLICABILITY_PATH_PROJECTION_NO_PROVIDER_SCOPE_WIDEN === true, "no widen");
    assert(KNOWLEDGE_APPLICABILITY_COORDINATES_75 === true, "coords #75");
    assert(KNOWLEDGE_METHOD_APPLICABILITY_COORDINATES_75 === true, "ontology coords #75");
    assert(KNOWLEDGE_APPLICABILITY_LIVE_NOT_PERFORMED === true, "live not performed");
    assert(KNOWLEDGE_APPLICABILITY_IOS_SIM_OOS === true, "iOS-sim OOS");
    assert(KNOWLEDGE_APPLICABILITY_HOSTED_KEY_OWNER.includes("Eduardo"), "hosted key");
    assert(KNOWLEDGE_APPLICABILITY_BASE_MAIN_SHA.startsWith("f53f3c7"), "base sha");
    assert(KNOWLEDGE_APPLICABILITY_MAP_PATH.includes("knowledge-applicability-map"), "map path");
    assert(KNOWLEDGE_APPLICABILITY_FIXTURE.includes("knowledge-applicability.fixtures"), "fixture path");

    // #520 tip stamps cleared / advanced.
    assert(INFERENCE_RECEIPTS_NO_521_IMPL === false, "map NO_521 cleared");
    assert(INFERENCE_RECEIPT_STORE_NO_521_IMPL === false, "store NO_521 cleared");
    assert(INFERENCE_RECEIPT_OWNERSHIP_NO_521_IMPL === false, "ownership NO_521 cleared");
    assert(INFERENCE_RECEIPTS_NEXT_AFTER_CLOSE === "#523", "receipts next #523");
    assert(INFERENCE_RECEIPT_STORE_NEXT_AFTER_CLOSE === "#523", "store next #523");
    assert(MAP_GRAPH_NEXT === "#523", "graph map next #523");
    assert(MODULE_GRAPH_NEXT === "#523", "graph module next #523");
    assert(KNOWLEDGE_APPLICABILITY_NEXT_AFTER_CLOSE === "#523", "map next #523");
    assert(CONTEXT_BOUND_APPLICABILITY_NEXT_AFTER_CLOSE === "#523", "module next #523");
    assert(APPLICABILITY_PATH_PROJECTION_NEXT_AFTER_CLOSE === "#523", "projection next #523");

    const ac = knowledgeApplicabilityAcEvidence();
    assert(ac.length === 5 && KNOWLEDGE_APPLICABILITY_AC.length === 5, "five AC");
    assert(
      ac.every((row) => row.covered === true),
      "all AC covered",
    );
  });

  harness.check("knowledge-applicability: AC1 wrong first branch recoverable via retained peer", () => {
    const { nodes, edges, seeds } = competingPathGraph();
    const beam = boundedCompetingPathBeam({
      seedNodeIds: seeds,
      nodes,
      edges,
      retainTopK: 4,
      bounds: { maxDepth: 2, maxCandidates: 16, maxInferenceRounds: 8, totalBudget: 32, maxBranchFactor: 4 },
    });
    assert(beam.retainedPaths.length >= 2, "retains multiple paths");
    assert(beam.pathScoresAreHeuristics === true, "scores are heuristics");
    assert(beam.contradictorySourcesRetained === true, "contradictions retained");
    const recovery = recoverViaRetainedPeerPath({
      beam,
      goldExplanationFamilies: ["value-delay", "wrong-journey"],
    });
    assert(recovery.firstBranchFamily === "unexpected-offer", "first branch is misleading unexpected-offer");
    assert(recovery.firstBranchWrong === true, "first branch wrong vs gold");
    assert(recovery.recoverable === true, "recoverable via peer");
    assert(recovery.recoveredPath !== null, "recovered path present");
    assert(
      recovery.recoveredPath!.explanationFamily === "value-delay" || recovery.recoveredPath!.explanationFamily === "wrong-journey",
      "recovered is gold family",
    );
  });

  harness.check("knowledge-applicability: AC2 matching topic + violated countercondition → not applicable", () => {
    const method = FIXTURE_METHOD_CATALOG.find((m) => m.methodId === "method.value-delay-activation")!;
    const matchingTopic = baseContext({
      facts: { paywallShown: "true", monetizationSelected: "true" },
    });
    const judgment = evaluateMethodApplicability(method, matchingTopic, { topicQuery: "activation-dropoff" });
    assert(judgment.status === "not_applicable", "not applicable");
    assert(judgment.status === "not_applicable" && judgment.reason === "countercondition_violated", "countercondition");
    assert(judgment.status === "not_applicable" && judgment.detail.includes("cc.paywall-already-shown"), "detail");

    // Control: same topic without violation → applicable.
    const ok = evaluateMethodApplicability(method, baseContext(), { topicQuery: "activation-dropoff" });
    assert(ok.status === "applicable", "control applicable");
  });

  harness.check("knowledge-applicability: AC3 no-match → none/unknown not least-bad endorsement", () => {
    // Only unrelated ASO method; topic query is activation-dropoff → no applicable.
    const asoOnly: MethodApplicabilityResource[] = [FIXTURE_METHOD_CATALOG.find((m) => m.methodId === "method.unrelated-aso")!];
    const result = evaluateBoundedCandidates({
      methods: asoOnly,
      context: baseContext({ stage: "activation", scope: "onboarding" }),
      topicQuery: "activation-dropoff",
      maxCandidates: 4,
    });
    assert(result.applicable.length === 0, "no applicable");
    assert(result.endorsement === "none" || result.endorsement === "unknown", "none/unknown");
    assert(result.leastBadRejected === true, "least-bad rejected");
    // Explicitly: do not treat the ASO method as an endorsement.
    assert(!result.applicable.some((j) => j.methodId === "method.unrelated-aso"), "aso not endorsed");

    // Empty candidate set → unknown.
    const empty = evaluateBoundedCandidates({
      methods: [],
      context: baseContext(),
      topicQuery: "activation-dropoff",
    });
    assert(empty.endorsement === "unknown", "empty → unknown");
    assert(empty.leastBadRejected === true, "empty least-bad rejected");
  });

  harness.check("knowledge-applicability: AC4 cycles/dupes/broad branch terminate within bounds", () => {
    const { nodes, edges, seeds } = adversarialGraph();
    const beam = boundedCompetingPathBeam({
      seedNodeIds: seeds,
      nodes,
      edges,
      retainTopK: 3,
      bounds: {
        maxDepth: 3,
        maxCandidates: 20,
        maxInferenceRounds: 6,
        totalBudget: 24,
        maxBranchFactor: 3,
      },
    });
    assert(beam.stats.expansions <= 24, "within total budget");
    assert(beam.stats.inferenceRounds <= 6, "within inference rounds");
    assert(beam.stats.maxDepthSeen <= 3, "within max depth");
    assert(beam.stats.cyclesDetected > 0, "detected cycles");
    assert(beam.stats.adversarialCaps > 0, "capped adversarial branching");
    const reasons = new Set(beam.terminationReasons);
    assert(
      reasons.has("cycle_detected") ||
        reasons.has("adversarial_branch_capped") ||
        reasons.has("budget_exhausted") ||
        reasons.has("max_inference_rounds_reached") ||
        reasons.has("max_candidates_reached") ||
        reasons.has("duplicate_path_pruned") ||
        reasons.has("max_depth_reached"),
      "explicit termination reason present",
    );
    assert(beam.terminationReasons.length > 0, "has termination reasons");
    assert(beam.prunedAlternatives.length > 0, "records pruned alternatives");
    // Duplicate path prune may also appear when revisiting states.
    assert(typeof beam.stats.duplicatesPruned === "number", "dupes counted");
  });

  harness.check("knowledge-applicability: AC5 invalidate dependent only; no provider-scope widen", () => {
    const store = new InferenceReceiptStore();
    const receiptId = "receipt.applicability.1";
    store.persistInferenceReceipt({
      receipt: sampleReceipt(receiptId),
      cacheKeyParts: cacheParts(),
      ownership: {
        generation: "gen.1",
        workspaceId: WS,
        occurrenceId: "occ.1",
        resource: "semantic.inference-receipt",
        active: true,
      },
      persistSourceRevision: "rev-1",
    });

    const context = baseContext();
    const { nodes, edges, seeds } = competingPathGraph();
    const methods = [...FIXTURE_METHOD_CATALOG].filter((m) => m.topic === "activation-dropoff");

    const selectedRecords: CandidateRecord[] = [
      {
        id: "cand.rc.1",
        key: "paywall-present",
        providerId: "b2c/revenuecat",
        contextTags: ["monetization"],
        evidenceChars: 40,
        sourceId: "src.rc",
      },
    ];
    const unselectedGuidance: CandidateRecord[] = [
      {
        id: "cand.sw.1",
        key: "paywall-present",
        providerId: "b2c/superwall",
        contextTags: ["monetization"],
        evidenceChars: 40,
        sourceId: "src.sw",
      },
    ];

    const projected = projectApplicabilityPaths({
      methods,
      context,
      graph: { seedNodeIds: seeds, nodes, edges, retainTopK: 4 },
      store,
      receiptId,
      cacheKeyParts: cacheParts(),
      selectedProviderRecords: selectedRecords,
      unselectedGuidance,
    });
    assert(projected.providerScopeWidened === false, "no widen on project");
    assert(projected.rejectedProviderReplacements.includes("cand.sw.1"), "rejects unselected replacement");
    assert(projected.edges.length === methods.length, "edge per method");
    assert(
      projected.edges.every((e) => e.knowledgeArtifactDeclaredFalse === false),
      "knowledge not declared false",
    );

    // Product revision / stage change → invalidate dependent edges only.
    const nextContext = baseContext({ productRevision: "rev-2", stage: "retention" });
    const invalidation = invalidateDependentApplicabilityEdges({
      previousContext: context,
      nextContext,
      edges: projected.edges,
      store,
    });
    assert(invalidation.providerScopeWidened === false, "no widen on invalidate");
    assert(invalidation.knowledgeArtifactsDeclaredFalse.length === 0, "artifacts not false");
    assert(invalidation.reevaluateRequired === true, "reeval required");
    assert(invalidation.invalidatedEdgeIds.length > 0, "invalidated some edges");

    // Knowledge artifact update invalidates only dependents of that artifact.
    const knowledgeUpdate = invalidateDependentApplicabilityEdges({
      changedKnowledgeArtifactId: "capability.retention-intervention",
      previousContext: context,
      nextContext: context,
      edges: projected.edges,
      store,
    });
    assert(knowledgeUpdate.knowledgeArtifactsDeclaredFalse.length === 0, "update ≠ false");
    const dependentMethods = methods.filter((m) => m.catalogResourceId === "capability.retention-intervention");
    assert(knowledgeUpdate.invalidatedEdgeIds.length === dependentMethods.length, "only dependents");
    const unrelated = projected.edges.filter((e) => e.knowledgeArtifactId !== "capability.retention-intervention");
    for (const edge of unrelated) {
      assert(knowledgeUpdate.retainedEdgeIds.includes(edge.edgeId), `retained ${edge.edgeId}`);
    }

    // Re-evaluate edge: knowledge still not false; provider scope not widened.
    const method = methods.find((m) => m.methodId === "method.unexpected-offer")!;
    const reeval = reevaluateApplicabilityEdge({
      method,
      context: nextContext,
      priorSelectedProviderId: context.selectedProviderId ?? null,
    });
    assert(reeval.knowledgeArtifactDeclaredFalse === false, "reeval not false");
    assert(reeval.providerScopeWidened === false, "reeval no widen");

    // Provider-scope denied method cannot become applicable for a different selected provider.
    const denied = evaluateMethodApplicability(method, baseContext({ selectedProviderId: "b2c/superwall" }));
    assert(denied.status === "not_applicable" && denied.reason === "provider_scope_denied", "scope denied");
  });

  harness.check("knowledge-applicability: composed evaluate + unresolved retain + cache key scoped", () => {
    const { nodes, edges, seeds } = competingPathGraph();
    // Missing evidence → unresolved (retain required guidance), not least-bad.
    const context = baseContext({
      availableEvidenceIds: ["evidence.session-timeline"], // incomplete
    });
    const composed = evaluateApplicabilityWithCompetingPaths({
      methods: [...FIXTURE_METHOD_CATALOG],
      context,
      topicQuery: "activation-dropoff",
      maxCandidates: 8,
      graph: { seedNodeIds: seeds, nodes, edges, retainTopK: 3 },
    });
    assert(composed.candidateEvaluation.unresolved.length > 0, "has unresolved");
    assert(
      composed.candidateEvaluation.unresolved.every((j) => j.status === "unresolved" && j.retainRequiredGuidance === true),
      "retain required guidance",
    );
    assert(composed.beam.retainedPaths.length >= 1, "beam retains paths");
    assert(composed.beam.pathScoresAreHeuristics === true, "heuristics");

    const keyA = buildScopedCacheKey(cacheParts({ workspaceId: WS }));
    const keyB = buildScopedCacheKey(cacheParts({ workspaceId: "ws.other" }));
    assert(keyA !== keyB, "workspace-scoped cache keys");
  });
}
