/**
 * #520 SQ-10 — Persist inference receipts / policy replay / scoped caching /
 * invalidation / erasure fixtures (paper; synthetic; no-network).
 *
 * Proves all five Acceptance criteria + crash/model-alias/deletion-after-acceptance:
 * 1. Policy-only → zero provider calls; material input change cannot hit old inference
 * 2. Same projection bytes in two workspaces → no cross-workspace cache access
 * 3. Source change while inference in flight → stale-result refusal
 * 4. Erasure after acceptance removes/redacts derived data; audit tombstone retained
 * 5. Probable-unaffected cannot keep stale mandatory device/provider/source proof valid
 *
 * Also: four #519 hooks implemented; NO_520_IMPL cleared; no parallel cache/invalidation engine.
 */
import { assert, type Harness } from "./_harness.js";
import { digestOf } from "../../../contracts/semantic/canonicalize.js";
import { PLAN_IDENTITY_CANONICALIZATION_VERSION } from "../../../contracts/semantic/query-ir.js";
import {
  INFERENCE_RECEIPT_STORE_CONSUMES,
  INFERENCE_RECEIPT_STORE_EPIC,
  INFERENCE_RECEIPT_STORE_ISSUE,
  INFERENCE_RECEIPT_STORE_NEXT_AFTER_CLOSE,
  INFERENCE_RECEIPT_STORE_NO_521_IMPL,
  INFERENCE_RECEIPT_STORE_NO_EXACTLY_ONCE,
  INFERENCE_RECEIPT_STORE_NO_NETWORK,
  INFERENCE_RECEIPT_STORE_NO_PARALLEL_CACHE_AUTHORITY,
  INFERENCE_RECEIPT_STORE_NO_TTL_ONLY,
  INFERENCE_RECEIPT_STORE_STAMP,
  INFERENCE_RECEIPT_CANONICALIZATION_VERSION,
  InferenceReceiptStore,
  InferenceReceiptStoreError,
  buildScopedCacheKey,
  recordProviderCall,
  sourceRevisionsDigest,
  type ScopedCacheKeyParts,
} from "../../../kernel/services/inference-receipt-store.js";
import {
  INFERENCE_INVALIDATION_COORDINATES,
  INFERENCE_INVALIDATION_NO_PARALLEL_ENGINE,
  INFERENCE_INVALIDATION_PRESERVES_SOURCE_FINGERPRINT,
  SQ10_IMPLEMENTED_HOOK_IDS,
  buildReverseRefIndex,
  evaluateProbableUnaffectedAgainstMandatoryProofs,
  invalidateOnReceiptErasure,
  invalidateOnSourceRevision,
  rebuildIndexAfterInvalidation,
  rejectStaleEdgeAtCommit,
} from "../../../kernel/engine/inference-invalidation.js";
import {
  INFERENCE_RECEIPT_OWNERSHIP_COORDINATES,
  INFERENCE_RECEIPT_OWNERSHIP_NO_PARALLEL_ERASURE_ENGINE,
  INFERENCE_RECEIPT_OWNERSHIP_NO_PARALLEL_INVALIDATION,
  assertHooksImplemented,
  assertReceiptOwnershipShape,
  buildInferenceReceiptErasureTombstone,
  createReceiptOwnershipHandle,
  listImplementedInvalidationHookIds,
  releaseReceiptOwnership,
} from "../../../kernel/reducer/inference-receipt-ownership.js";
import {
  SEMANTIC_GRAPH_VIEWS_NO_520_IMPL,
  SQ10_DELETION_INVALIDATION_HOOKS,
  type CandidateEdge,
  type SourceSnapshotInput,
} from "../../../kernel/knowledge-service/semantic-graph-views.js";
import { isSq10HookDeclaredOnly, isSq10HookImplemented, SEMANTIC_GRAPH_OWNERSHIP_NO_520_IMPL } from "../../../kernel/reducer/semantic-graph-ownership.js";
import { APP_SOURCE_FINGERPRINT_PATH } from "../../../kernel/engine/source-fingerprint.js";
import {
  INFERENCE_RECEIPTS_AC,
  INFERENCE_RECEIPTS_BASE_MAIN_SHA,
  INFERENCE_RECEIPTS_COORDINATES,
  INFERENCE_RECEIPTS_FIXTURE,
  INFERENCE_RECEIPTS_HOOKS_IMPLEMENTED,
  INFERENCE_RECEIPTS_HOSTED_KEY_OWNER,
  INFERENCE_RECEIPTS_IOS_SIM_OOS,
  INFERENCE_RECEIPTS_LIVE_NOT_PERFORMED,
  INFERENCE_RECEIPTS_MAP_PATH,
  INFERENCE_RECEIPTS_NEXT_AFTER_CLOSE,
  INFERENCE_RECEIPTS_NO_521_IMPL,
  INFERENCE_RECEIPTS_NO_NETWORK,
  INFERENCE_RECEIPTS_NO_PARALLEL_CACHE_AUTHORITY,
  INFERENCE_RECEIPTS_NO_PARALLEL_INVALIDATION,
  INFERENCE_RECEIPTS_PRESERVES_SOURCE_FINGERPRINT,
  INFERENCE_RECEIPTS_STAMP,
  inferenceReceiptsAcEvidence,
} from "../../../catalog/providers/inference-receipts-map.js";

const NOW = "2026-09-19T21:00:00.000Z";
const WS_A = "ws.alpha";
const WS_B = "ws.beta";

function hex(label: string): string {
  return digestOf(label);
}

function baseKeyParts(partial: Partial<ScopedCacheKeyParts> & Pick<ScopedCacheKeyParts, "workspaceId">): ScopedCacheKeyParts {
  return {
    securityScope: "scope.workspace",
    sourceDigest: hex("src-rev-1"),
    projectionDigest: hex("proj-bytes-identical"),
    questionPackDigest: hex("qpack-1"),
    bindingId: "binding.typesafe.fixture",
    adapterDigest: hex("adapter-1"),
    responseContractDigest: hex("response-contract-1"),
    modelIdentity: "model.rev.abc123",
    locale: "en-US",
    purpose: "semantic-assessment",
    canonicalizationVersion: INFERENCE_RECEIPT_CANONICALIZATION_VERSION,
    ...partial,
  };
}

function sampleReceipt(partial: {
  receiptId: string;
  workspaceId: string;
  projectionDigest?: string;
  questionPackDigest?: string;
  sourceRevisions?: { sourceId: string; revision: string }[];
  planIdentity?: string;
}): Record<string, unknown> {
  const projectionDigest = partial.projectionDigest ?? hex("proj-bytes-identical");
  const questionPackDigest = partial.questionPackDigest ?? hex("qpack-1");
  const planIdentity = partial.planIdentity ?? hex("plan-1");
  return {
    schemaVersion: 1,
    kind: "inference-receipt",
    evidenceClass: "inference",
    receiptId: partial.receiptId,
    requestId: "req.fixture.1",
    attemptId: "att.fixture.1",
    workspaceId: partial.workspaceId,
    planId: "plan.fixture.1",
    planIdentity,
    questionPackId: "qpack.fixture.1",
    questionPackDigest,
    projectionDigest,
    sourceRevisions: partial.sourceRevisions ?? [{ sourceId: "src.reports", revision: "rev-1" }],
    coverage: { includedSourceIds: ["src.reports"], omittedSourceIds: [], omittedFields: [] },
    binding: { providerBindingId: "binding.typesafe.fixture", requestedModel: "model.rev.abc123", returnedModel: "model.rev.abc123" },
    results: [{ status: "answered", answer: { kind: "noul", questionId: "q.same-mechanism", probability: 0.72 } }],
    usageCost: { status: "unknown", reason: "fixture-no-provider" },
    recordedAt: NOW,
    privacy: { dataClassification: "workspace", purpose: "semantic-assessment" },
  };
}

function makeEdge(partial: Partial<CandidateEdge> & Pick<CandidateEdge, "edgeId" | "inferenceReceiptId">): CandidateEdge {
  const ws = WS_A;
  const base: CandidateEdge = {
    edgeId: partial.edgeId,
    subject: {
      endpointId: "obs.a",
      endpointVersion: "v1",
      workspaceId: ws,
      classId: "class.observation",
      privacyClass: "workspace",
    },
    object: {
      endpointId: "obs.b",
      endpointVersion: "v1",
      workspaceId: ws,
      classId: "class.observation",
      privacyClass: "workspace",
    },
    predicate: "reportsSameFailureAs",
    predicateVersion: "sq08.v1",
    contextDigest: hex("ctx-1"),
    evidenceSpans: [
      {
        sourceId: "src.reports",
        fieldPath: "body",
        spanStart: 0,
        spanEnd: 10,
        contentSha256: hex("content-a"),
      },
    ],
    inferenceReceiptId: partial.inferenceReceiptId,
    policyOutcome: "defer",
    validityReason: "inferred from receipt",
    authority: "inferred",
    relationshipType: "reportsSameFailureAs",
    contradictionSupport: "supports",
    evidenceSufficiency: "sufficient",
  };
  return { ...base, ...partial, edgeId: partial.edgeId, inferenceReceiptId: partial.inferenceReceiptId };
}

function makeSource(revision: string, content = "payment failed after onboarding"): SourceSnapshotInput {
  return {
    sourceId: "src.reports",
    workspaceId: WS_A,
    revision,
    content,
    contentSha256: hex(content),
    privacyClass: "workspace",
    authorized: true,
  };
}

export function register(harness: Harness): void {
  harness.check("inference-receipts: stamp/issue/consumes + AC map + hard bans + hooks implemented", () => {
    assert(INFERENCE_RECEIPT_STORE_ISSUE === "#520", "issue");
    assert(INFERENCE_RECEIPT_STORE_EPIC === "#511", "epic");
    assert(INFERENCE_RECEIPT_STORE_STAMP === "0.221.40", "stamp store");
    assert(INFERENCE_RECEIPTS_STAMP === "0.221.40", "stamp map");
    assert(INFERENCE_RECEIPT_STORE_CONSUMES.includes("#512"), "consumes #512");
    assert(INFERENCE_RECEIPT_STORE_CONSUMES.includes("#518"), "consumes #518");
    assert(INFERENCE_RECEIPT_STORE_CONSUMES.includes("#519"), "consumes #519");
    assert(INFERENCE_RECEIPT_STORE_CONSUMES.length === 8, "consumes eight");
    assert(INFERENCE_RECEIPT_STORE_NO_521_IMPL === false, "NO_521 cleared");
    assert(INFERENCE_RECEIPTS_NO_521_IMPL === false, "map NO_521 cleared");
    assert(INFERENCE_RECEIPT_STORE_NO_NETWORK === true && INFERENCE_RECEIPTS_NO_NETWORK === true, "no network");
    assert(INFERENCE_RECEIPT_STORE_NO_PARALLEL_CACHE_AUTHORITY === true, "no parallel cache");
    assert(INFERENCE_RECEIPTS_NO_PARALLEL_CACHE_AUTHORITY === true, "map no parallel cache");
    assert(INFERENCE_RECEIPTS_NO_PARALLEL_INVALIDATION === true, "no parallel invalidation");
    assert(INFERENCE_INVALIDATION_NO_PARALLEL_ENGINE === true, "engine no parallel");
    assert(INFERENCE_RECEIPT_OWNERSHIP_NO_PARALLEL_INVALIDATION === true, "ownership no parallel invalidation");
    assert(INFERENCE_RECEIPT_OWNERSHIP_NO_PARALLEL_ERASURE_ENGINE === true, "no parallel erasure");
    assert(INFERENCE_RECEIPT_STORE_NO_TTL_ONLY === true, "no TTL-only");
    assert(INFERENCE_RECEIPT_STORE_NO_EXACTLY_ONCE === true, "no exactly-once");
    assert(INFERENCE_RECEIPTS_LIVE_NOT_PERFORMED === true, "live not performed");
    assert(INFERENCE_RECEIPTS_IOS_SIM_OOS === true, "iOS-sim OOS");
    assert(INFERENCE_RECEIPTS_HOSTED_KEY_OWNER.includes("Eduardo"), "hosted key");
    assert(INFERENCE_RECEIPTS_NEXT_AFTER_CLOSE === "#574", "next #511");
    assert(INFERENCE_RECEIPT_STORE_NEXT_AFTER_CLOSE === "#574", "store next");
    assert(INFERENCE_RECEIPTS_BASE_MAIN_SHA.startsWith("4a32176"), "base sha");
    assert(INFERENCE_RECEIPTS_MAP_PATH.includes("inference-receipts-map"), "map path");
    assert(INFERENCE_RECEIPTS_FIXTURE.includes("inference-receipts.fixtures"), "fixture path");
    assert(INFERENCE_RECEIPTS_COORDINATES.includes("#74") && INFERENCE_RECEIPTS_COORDINATES.includes("#76"), "coords");
    assert(INFERENCE_INVALIDATION_COORDINATES.includes("#76"), "engine coords #76");
    assert(INFERENCE_RECEIPT_OWNERSHIP_COORDINATES.includes("#74"), "ownership coords");
    assert(INFERENCE_INVALIDATION_PRESERVES_SOURCE_FINGERPRINT === true, "preserves fingerprint");
    assert(INFERENCE_RECEIPTS_PRESERVES_SOURCE_FINGERPRINT === true, "map preserves fingerprint");
    assert(APP_SOURCE_FINGERPRINT_PATH.includes("app-source-fingerprint"), "fingerprint path intact");
    assert(INFERENCE_RECEIPT_CANONICALIZATION_VERSION === PLAN_IDENTITY_CANONICALIZATION_VERSION, "canon version");
    assert(SEMANTIC_GRAPH_VIEWS_NO_520_IMPL === false, "NO_520_IMPL cleared (views)");
    assert(SEMANTIC_GRAPH_OWNERSHIP_NO_520_IMPL === false, "NO_520_IMPL cleared (ownership)");
    assert(isSq10HookDeclaredOnly() === false, "hooks not declaredOnly");
    assert(isSq10HookImplemented() === true, "hooks implemented");
    assert(SQ10_DELETION_INVALIDATION_HOOKS.declaredOnly === false, "hooks flag");
    assert(SQ10_DELETION_INVALIDATION_HOOKS.implemented === true, "implemented flag");
    assert(SQ10_DELETION_INVALIDATION_HOOKS.noPersistenceImpl === false, "persist impl");
    assert(SQ10_DELETION_INVALIDATION_HOOKS.noCacheImpl === false, "cache impl");
    assert(SQ10_DELETION_INVALIDATION_HOOKS.noErasureImpl === false, "erasure impl");
    assert(SQ10_IMPLEMENTED_HOOK_IDS.length === 4, "four implemented hooks");
    assert(listImplementedInvalidationHookIds().length === 4, "ownership lists four");
    assertHooksImplemented();
    assert(INFERENCE_RECEIPTS_HOOKS_IMPLEMENTED === true, "map hooks implemented");
    const ac = inferenceReceiptsAcEvidence();
    assert(ac.length === 5 && INFERENCE_RECEIPTS_AC.length === 5, "five AC");
    assert(
      ac.every((row) => row.covered),
      "all AC covered",
    );
  });

  harness.check("inference-receipts: AC1 policy-only zero provider calls; material input misses old inference", () => {
    const store = new InferenceReceiptStore();
    const ownership = createReceiptOwnershipHandle({
      generation: "gen-1",
      workspaceId: WS_A,
      occurrenceId: "occ-1",
    });
    assertReceiptOwnershipShape(ownership);
    const keyParts = baseKeyParts({ workspaceId: WS_A });
    const cacheKey = buildScopedCacheKey(keyParts);

    // Persist after (simulated) provider call for the original inference.
    recordProviderCall(store.providerCalls);
    assert(store.providerCalls.calls === 1, "one provider call for original inference");
    const persisted = store.persistInferenceReceipt({
      receipt: sampleReceipt({ receiptId: "rcpt.ac1", workspaceId: WS_A }),
      cacheKeyParts: keyParts,
      ownership,
      persistSourceRevision: "rev-1",
    });
    assert(persisted.published === false, "not published yet");
    store.publishDerivedAnnotations("rcpt.ac1");
    assert(store.get("rcpt.ac1")!.published === true, "published after persist");

    const callsBeforePolicy = store.providerCalls.calls;
    const policyA = store.applyPolicy({
      inferenceReceiptId: "rcpt.ac1",
      policyDigest: hex("policy-v1"),
      policyReceiptId: "rcpt.policy.a",
      decision: {
        outcome: "defer",
        excludedAlternatives: [{ alternativeId: "repair-now", reason: "below threshold" }],
        derived: { next: "observe" },
      },
      recordedAt: NOW,
    });
    assert(policyA.providerCallsDuringReplay === 0, "zero provider during replay");
    assert(store.providerCalls.calls === callsBeforePolicy, "provider calls unchanged on policy-only");
    assert(policyA.policyReceipt.inferenceReceiptId === "rcpt.ac1", "refs immutable original");
    assert(policyA.inferenceReceiptDigest === persisted.receiptDigest, "digest bound");

    // Policy-only change → new policy result, still zero provider calls.
    const policyB = store.applyPolicy({
      inferenceReceiptId: "rcpt.ac1",
      policyDigest: hex("policy-v2"),
      policyReceiptId: "rcpt.policy.b",
      decision: {
        outcome: "apply",
        selectedAlternativeId: "observe-more",
        excludedAlternatives: [],
        derived: { next: "apply" },
      },
      recordedAt: "2026-09-19T21:01:00.000Z",
    });
    assert(policyB.policyReceipt.decision.outcome === "apply", "new policy outcome");
    assert(policyB.providerCallsDuringReplay === 0, "still zero provider");
    assert(store.providerCalls.calls === callsBeforePolicy, "still no new provider calls");
    assert(policyB.inferenceReceiptDigest === persisted.receiptDigest, "same immutable original");

    // Material input change (projection digest) cannot hit the old inference.
    const changedKey = baseKeyParts({ workspaceId: WS_A, projectionDigest: hex("proj-bytes-CHANGED") });
    const miss = store.lookupByCacheKey({
      cacheKeyParts: changedKey,
      auth: { workspaceId: WS_A, securityScope: "scope.workspace", authorized: true, purpose: "semantic-assessment" },
    });
    assert(miss.hit === false, "material input change misses old inference");
    assert(miss.reason === "cache.miss", "miss reason");

    // Unchanged key still hits (auth recheck passes).
    const hit = store.lookupByCacheKey({
      cacheKeyParts: keyParts,
      auth: { workspaceId: WS_A, securityScope: "scope.workspace", authorized: true, purpose: "semantic-assessment" },
    });
    assert(hit.hit === true, "same key hits");
    assert(hit.hit && hit.record.cacheKey === cacheKey, "same cache key");

    // Unauthorized reuse refused even on key match.
    const denied = store.lookupByCacheKey({
      cacheKeyParts: keyParts,
      auth: { workspaceId: WS_A, securityScope: "scope.workspace", authorized: false, purpose: "semantic-assessment" },
    });
    assert(denied.hit === false && denied.reason === "auth.not_authorized", "auth recheck");
  });

  harness.check("inference-receipts: AC2 same projection bytes two workspaces → no cross-workspace cache", () => {
    const store = new InferenceReceiptStore();
    const identicalProjection = hex("proj-bytes-identical");
    const keyA = baseKeyParts({ workspaceId: WS_A, projectionDigest: identicalProjection });
    const keyB = baseKeyParts({ workspaceId: WS_B, projectionDigest: identicalProjection });
    assert(keyA.projectionDigest === keyB.projectionDigest, "same projection bytes");
    assert(buildScopedCacheKey(keyA) !== buildScopedCacheKey(keyB), "keys differ by workspace");

    store.persistInferenceReceipt({
      receipt: sampleReceipt({ receiptId: "rcpt.ws.a", workspaceId: WS_A, projectionDigest: identicalProjection }),
      cacheKeyParts: keyA,
      ownership: createReceiptOwnershipHandle({ generation: "g-a", workspaceId: WS_A, occurrenceId: "o-a" }),
      persistSourceRevision: "rev-1",
    });
    store.publishDerivedAnnotations("rcpt.ws.a");

    // Workspace B must NOT see workspace A's cache even with identical projection bytes.
    const cross = store.lookupByCacheKey({
      cacheKeyParts: keyB,
      auth: { workspaceId: WS_B, securityScope: "scope.workspace", authorized: true, purpose: "semantic-assessment" },
    });
    assert(cross.hit === false, "no cross-workspace cache access");

    // Auth workspace mismatch also denied.
    const mismatch = store.lookupByCacheKey({
      cacheKeyParts: keyA,
      auth: { workspaceId: WS_B, securityScope: "scope.workspace", authorized: true, purpose: "semantic-assessment" },
    });
    assert(mismatch.hit === false && mismatch.reason === "auth.workspace_mismatch", "auth workspace mismatch");
  });

  harness.check("inference-receipts: AC3 source change while in flight → stale refusal", () => {
    const store = new InferenceReceiptStore();
    const keyParts = baseKeyParts({ workspaceId: WS_A, sourceDigest: sourceRevisionsDigest([{ sourceId: "src.reports", revision: "rev-1" }]) });
    store.persistInferenceReceipt({
      receipt: sampleReceipt({
        receiptId: "rcpt.inflight",
        workspaceId: WS_A,
        sourceRevisions: [{ sourceId: "src.reports", revision: "rev-1" }],
      }),
      cacheKeyParts: keyParts,
      ownership: createReceiptOwnershipHandle({ generation: "g-if", workspaceId: WS_A, occurrenceId: "o-if" }),
      persistSourceRevision: "rev-1",
    });
    store.beginInFlight("rcpt.inflight", "rev-1");

    let refused = false;
    try {
      store.acceptInFlightResult({
        receiptId: "rcpt.inflight",
        sourceRevisionAtStart: "rev-1",
        sourceRevisionAtAccept: "rev-2", // source changed while in flight
      });
    } catch (err) {
      refused = err instanceof InferenceReceiptStoreError && err.code === "accept.stale_source";
    }
    assert(refused, "stale-result refusal");
    const record = store.get("rcpt.inflight")!;
    assert(record.stale === true, "marked stale");
    assert(record.published === false, "not current acceptance");
    assert(record.staleReason === "source_changed_while_in_flight", "reason");

    // Unrelated valid receipt preserved when source invalidation runs.
    store.persistInferenceReceipt({
      receipt: sampleReceipt({
        receiptId: "rcpt.unrelated",
        workspaceId: WS_A,
        sourceRevisions: [{ sourceId: "src.other", revision: "rev-1" }],
        projectionDigest: hex("proj-other"),
        planIdentity: hex("plan-other"),
      }),
      cacheKeyParts: baseKeyParts({
        workspaceId: WS_A,
        projectionDigest: hex("proj-other"),
        sourceDigest: sourceRevisionsDigest([{ sourceId: "src.other", revision: "rev-1" }]),
      }),
      ownership: createReceiptOwnershipHandle({ generation: "g-u", workspaceId: WS_A, occurrenceId: "o-u" }),
      persistSourceRevision: "rev-1",
    });
    store.publishDerivedAnnotations("rcpt.unrelated");

    const reverse = buildReverseRefIndex({
      receipts: [
        { receiptId: "rcpt.inflight", sourceIds: ["src.reports"], projectionDigest: hex("proj-bytes-identical"), questionPackDigest: hex("qpack-1") },
        { receiptId: "rcpt.unrelated", sourceIds: ["src.other"], projectionDigest: hex("proj-other"), questionPackDigest: hex("qpack-1") },
      ],
      edges: [],
    });
    const inv = invalidateOnSourceRevision({
      changedSourceId: "src.reports",
      newRevision: "rev-2",
      previousRevision: "rev-1",
      reverseRefs: reverse,
      store,
      allReceiptIds: ["rcpt.inflight", "rcpt.unrelated"],
    });
    assert(
      inv.effects.some((e) => e.kind === "preserve-unrelated" && e.receiptId === "rcpt.unrelated"),
      "preserve unrelated",
    );
    assert(store.get("rcpt.unrelated")!.stale === false, "unrelated still valid");
    assert(store.get("rcpt.unrelated")!.published === true, "unrelated still published");
  });

  harness.check("inference-receipts: AC4 erasure after acceptance redacts derived; audit tombstone retained", () => {
    const store = new InferenceReceiptStore();
    const keyParts = baseKeyParts({ workspaceId: WS_A });
    store.persistInferenceReceipt({
      receipt: sampleReceipt({ receiptId: "rcpt.erase", workspaceId: WS_A }),
      cacheKeyParts: keyParts,
      ownership: createReceiptOwnershipHandle({ generation: "g-e", workspaceId: WS_A, occurrenceId: "o-e" }),
      persistSourceRevision: "rev-1",
    });
    store.publishDerivedAnnotations("rcpt.erase");
    store.applyPolicy({
      inferenceReceiptId: "rcpt.erase",
      policyDigest: hex("policy-erase"),
      policyReceiptId: "rcpt.policy.erase",
      decision: { outcome: "apply", excludedAlternatives: [] },
      recordedAt: NOW,
    });

    const content = "payment failed after onboarding";
    const source = makeSource("rev-1", content);
    // Fix span hash to match content
    const edge = makeEdge({
      edgeId: "edge.erase.1",
      inferenceReceiptId: "rcpt.erase",
      evidenceSpans: [
        {
          sourceId: "src.reports",
          fieldPath: "body",
          spanStart: 0,
          spanEnd: 10,
          contentSha256: source.contentSha256,
        },
      ],
    });
    const reverse = buildReverseRefIndex({
      receipts: [
        {
          receiptId: "rcpt.erase",
          sourceIds: ["src.reports"],
          projectionDigest: hex("proj-bytes-identical"),
          questionPackDigest: hex("qpack-1"),
        },
      ],
      edges: [edge],
    });

    const erasure = store.eraseReceipt({
      receiptId: "rcpt.erase",
      erasureId: "erase.1",
      erasedAt: NOW,
      authorized: true,
    });
    assert(erasure.erasedPolicyIds.includes("rcpt.policy.erase"), "policy erased");
    assert(store.isErased("rcpt.erase"), "receipt erased");
    assert(store.listErasureTombstones().length === 1, "tombstone retained");
    const tombstone = buildInferenceReceiptErasureTombstone({
      erasureId: erasure.tombstone.erasureId,
      receiptDigest: erasure.tombstone.receiptDigest,
      erasedAt: erasure.tombstone.erasedAt,
      workspaceBindingDigest: hex(WS_A),
      coveredDerivedCount: erasure.tombstone.coveredDerivedCount,
    });
    assert(tombstone.coveredDerivedCount >= 2, "covered derived count");
    assert(!("results" in (tombstone as object) && Array.isArray((tombstone as { results?: unknown }).results)), "no payload in tombstone");

    const dropped = invalidateOnReceiptErasure({
      erasedReceiptId: "rcpt.erase",
      reverseRefs: reverse,
      edges: [edge],
    });
    assert(dropped.droppedEdgeIds.includes("edge.erase.1"), "edge dropped");
    assert(dropped.retainedEdges.length === 0, "no retained erased-bound edges");

    // Rebuild must NOT restore erased receipt/edges.
    const rebuilt = rebuildIndexAfterInvalidation({
      workspaceId: WS_A,
      sources: [source],
      store,
      edges: [edge],
      observationIds: ["obs.a", "obs.b"],
    });
    assert(rebuilt.edges.length === 0, "rebuild does not restore erased edges");
    assert(!rebuilt.rebuiltFrom.receiptIds.includes("rcpt.erase"), "erased receipt absent from rebuild");
    assert(store.listErasureTombstones().length === 1, "audit tombstone still present");

    // Cache miss after erasure.
    const after = store.lookupByCacheKey({
      cacheKeyParts: keyParts,
      auth: { workspaceId: WS_A, securityScope: "scope.workspace", authorized: true, purpose: "semantic-assessment" },
    });
    assert(after.hit === false, "cache cleared on erasure");
  });

  harness.check("inference-receipts: AC5 probable-unaffected cannot keep stale mandatory proof valid", () => {
    const assessment = { probablyUnaffected: true as const, confidence: 0.95, note: "looks unrelated" };
    // Stale source fingerprint → refuse keep-valid despite high-confidence probable-unaffected.
    const staleSource = evaluateProbableUnaffectedAgainstMandatoryProofs({
      assessment,
      mandatoryProofs: [
        { kind: "source", acceptedFingerprint: "sha256:aaaa", currentFingerprint: "sha256:bbbb" },
        { kind: "device", acceptedFingerprint: "sha256:dev1", currentFingerprint: "sha256:dev1" },
        { kind: "provider", acceptedFingerprint: "sha256:prov1", currentFingerprint: "sha256:prov1" },
      ],
    });
    assert(staleSource.mayKeepValid === false, "cannot keep valid");
    assert(staleSource.mayKeepValid === false && staleSource.reason === "stale_mandatory_proof", "stale reason");
    assert(staleSource.mayKeepValid === false && staleSource.staleKinds.includes("source"), "source stale");
    assert(staleSource.mayKeepValid === false && staleSource.assessmentIgnoredForWaiver === true, "assessment ignored for waiver");

    // Stale device also refused.
    const staleDevice = evaluateProbableUnaffectedAgainstMandatoryProofs({
      assessment,
      mandatoryProofs: [{ kind: "device", acceptedFingerprint: "sha256:d1", currentFingerprint: "sha256:d2" }],
    });
    assert(staleDevice.mayKeepValid === false, "device stale refused");

    // All current → may keep (assessment does not invent waiver when already current).
    const current = evaluateProbableUnaffectedAgainstMandatoryProofs({
      assessment,
      mandatoryProofs: [
        { kind: "source", acceptedFingerprint: "sha256:s", currentFingerprint: "sha256:s" },
        { kind: "device", acceptedFingerprint: "sha256:d", currentFingerprint: "sha256:d" },
        { kind: "provider", acceptedFingerprint: "sha256:p", currentFingerprint: "sha256:p" },
      ],
    });
    assert(current.mayKeepValid === true && current.allProofsCurrent === true, "current proofs ok");
  });

  harness.check("inference-receipts: crash before persist commit refuses publish; model-alias drift honesty", () => {
    const store = new InferenceReceiptStore();
    const ownership = createReceiptOwnershipHandle({ generation: "g-crash", workspaceId: WS_A, occurrenceId: "o-crash" });
    let crashed = false;
    try {
      store.persistInferenceReceipt({
        receipt: sampleReceipt({ receiptId: "rcpt.crash", workspaceId: WS_A }),
        cacheKeyParts: baseKeyParts({ workspaceId: WS_A }),
        ownership,
        persistSourceRevision: "rev-1",
        simulateCrashBeforeCommit: true,
      });
    } catch (err) {
      crashed = err instanceof InferenceReceiptStoreError && err.code === "persist.crash_before_commit";
    }
    assert(crashed, "crash simulated");
    assert(store.get("rcpt.crash") === undefined, "nothing persisted");
    let publishRefused = false;
    try {
      store.publishDerivedAnnotations("rcpt.crash");
    } catch (err) {
      publishRefused = err instanceof InferenceReceiptStoreError && err.code === "receipt.not_found";
    }
    assert(publishRefused, "publish refused without persist");

    // Model alias requires freshness bound.
    let aliasRefused = false;
    try {
      buildScopedCacheKey(
        baseKeyParts({
          workspaceId: WS_A,
          modelIdentity: "alias:latest-ultrafast",
          modelAliasFreshnessBound: undefined,
        }),
      );
    } catch (err) {
      aliasRefused = err instanceof InferenceReceiptStoreError && err.code === "cache.alias_freshness_required";
    }
    assert(aliasRefused, "alias without freshness refused");

    const aliasKey = baseKeyParts({
      workspaceId: WS_A,
      modelIdentity: "alias:latest-ultrafast",
      modelAliasFreshnessBound: "bound-2026-09-19",
    });
    store.persistInferenceReceipt({
      receipt: sampleReceipt({ receiptId: "rcpt.alias", workspaceId: WS_A }),
      cacheKeyParts: aliasKey,
      ownership,
      persistSourceRevision: "rev-1",
    });
    store.publishDerivedAnnotations("rcpt.alias");
    let drift = false;
    try {
      store.assertModelAliasStillValid("rcpt.alias", "bound-2026-09-20");
    } catch (err) {
      drift = err instanceof InferenceReceiptStoreError && err.code === "alias.drift";
    }
    assert(drift, "alias drift detected");
    store.assertModelAliasStillValid("rcpt.alias", "bound-2026-09-19"); // same bound ok
  });

  harness.check("inference-receipts: reject-stale-edge-at-commit + ownership release + secrets hygiene", () => {
    const store = new InferenceReceiptStore();
    const ownership = createReceiptOwnershipHandle({ generation: "g-commit", workspaceId: WS_A, occurrenceId: "o-commit" });
    store.persistInferenceReceipt({
      receipt: sampleReceipt({ receiptId: "rcpt.commit", workspaceId: WS_A }),
      cacheKeyParts: baseKeyParts({ workspaceId: WS_A }),
      ownership,
      persistSourceRevision: "rev-1",
    });
    store.publishDerivedAnnotations("rcpt.commit");
    const edge = makeEdge({ edgeId: "edge.commit.1", inferenceReceiptId: "rcpt.commit" });

    const ok = rejectStaleEdgeAtCommit({
      edge,
      expectedViewDigest: hex("view-1"),
      currentViewDigest: hex("view-1"),
      store,
    });
    assert(ok.ok === true, "fresh commit ok");

    const staleView = rejectStaleEdgeAtCommit({
      edge,
      expectedViewDigest: hex("view-1"),
      currentViewDigest: hex("view-2"),
      store,
    });
    assert(staleView.ok === false && staleView.code === "commit.stale_view_digest", "stale view refused");

    store.markStale("rcpt.commit", "test-stale");
    const staleReceipt = rejectStaleEdgeAtCommit({
      edge,
      expectedViewDigest: hex("view-1"),
      currentViewDigest: hex("view-1"),
      store,
    });
    assert(staleReceipt.ok === false && staleReceipt.code === "commit.receipt_stale", "stale receipt refused");

    const released = releaseReceiptOwnership(ownership);
    assert(released.active === false, "ownership released");

    // Secrets/PII in receipt surfaces refused.
    let pii = false;
    try {
      store.persistInferenceReceipt({
        receipt: {
          ...sampleReceipt({ receiptId: "rcpt.pii", workspaceId: WS_A }),
          binding: { providerBindingId: "binding.typesafe.fixture", requestedModel: "sk-SECRETvalue12345678" },
        },
        cacheKeyParts: baseKeyParts({ workspaceId: WS_A, projectionDigest: hex("proj-pii") }),
        ownership: createReceiptOwnershipHandle({ generation: "g-pii", workspaceId: WS_A, occurrenceId: "o-pii" }),
        persistSourceRevision: "rev-1",
      });
    } catch (err) {
      pii = err instanceof InferenceReceiptStoreError && err.code === "privacy.secret_or_pii_in_surface";
    }
    assert(pii, "secrets refused in surfaces");
  });
}
