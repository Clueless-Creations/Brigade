/**
 * #518 SQ-07 — shared-state batches / speculative / map-reduce fixtures (paper; fake transport).
 *
 * Proves all five Acceptance criteria through the actual session/reducer path
 * (semantic-batch settlement + ownership helper + engine dispatch gate):
 * 1. Independent checks concurrent under deterministic barrier; result-use alone does not serialize
 * 2. Dependent projections wait; budget/authority holds do not consume unauthorized requests
 * 3. One failed shard cannot report complete coverage or release ownership while siblings active
 * 4. Duplicate event/request + interrupted commit → no duplicate accepts; uncertain charges visible
 * 5. Latency/cost report separates compile / projection / transport / queue / reduction / recovery
 */
import { assert, type Harness } from "./_harness.js";
import {
  SEMANTIC_BATCH_CONSUMES,
  SEMANTIC_BATCH_EPIC,
  SEMANTIC_BATCH_ISSUE,
  SEMANTIC_BATCH_LIVE_BATCH_BENCHMARKS_OOS,
  SEMANTIC_BATCH_NO_519,
  SEMANTIC_BATCH_NO_SECOND_SCHEDULER,
  SEMANTIC_BATCH_STAMP,
  acceptResult,
  beginBatchSettlement,
  buildLatencyCostReport,
  createOwnershipHandle,
  createSyncBarrierTransport,
  gateSemanticBatchBoundary,
  groupSharedStateBatches,
  planSpeculativeAssessments,
  recordDispatch,
  reduceMapShards,
  releaseOwnershipAfterSettlement,
  requestCancellation,
  reserveResources,
  runSyncBarrierBatch,
  settleSpeculativeBranches,
  type SemanticWorkItem,
} from "../../../kernel/session/semantic-batch.js";
import { gateSemanticDispatchBatch, neverHaltDispatchHooks, SEMANTIC_DISPATCH_COORDINATES, SEMANTIC_DISPATCH_ISSUE } from "../../../kernel/engine/dispatch.js";
import {
  assertOwnershipGenerationShape,
  mayReleaseOwnership,
  SEMANTIC_BATCH_OWNERSHIP_COORDINATES,
  SEMANTIC_BATCH_OWNERSHIP_NO_SECOND_GENERATION,
} from "../../../kernel/reducer/semantic-batch-ownership.js";
import {
  SEMANTIC_BATCH_AC,
  SEMANTIC_BATCH_BASE_MAIN_SHA,
  SEMANTIC_BATCH_FAKE_TRANSPORT_ONLY,
  SEMANTIC_BATCH_FIXTURE,
  SEMANTIC_BATCH_HOSTED_KEY_OWNER,
  SEMANTIC_BATCH_LIVE_NOT_PERFORMED,
  SEMANTIC_BATCH_MAP_PATH,
  SEMANTIC_BATCH_NEXT_AFTER_CLOSE,
  semanticBatchAcEvidence,
} from "../../../catalog/providers/semantic-batch-map.js";

function baseWork(partial: Partial<SemanticWorkItem> & Pick<SemanticWorkItem, "workId" | "questionId">): SemanticWorkItem {
  return {
    workspaceId: "ws.demo",
    sourceSnapshotId: "snap-1",
    dataPolicyId: "policy-workspace",
    providerBindingId: "typesafe/systemone",
    resourceLimitKey: "limits-default",
    dependsOn: [],
    resultUseOf: [],
    authorityPrerequisites: [],
    sourceAccessHeld: true,
    authorityHeld: true,
    ...partial,
  };
}

export function register(harness: Harness): void {
  harness.check("semantic-batch: stamp/issue/consumes + AC map present", () => {
    assert(SEMANTIC_BATCH_ISSUE === "#518", "issue");
    assert(SEMANTIC_BATCH_EPIC === "#511", "epic");
    assert(SEMANTIC_BATCH_STAMP === "0.221.38", "stamp");
    assert(SEMANTIC_BATCH_CONSUMES.includes("#517"), "consumes #517");
    assert(SEMANTIC_BATCH_CONSUMES.includes("#512"), "consumes #512");
    assert(SEMANTIC_BATCH_NO_519 === true, "no #519");
    assert(SEMANTIC_BATCH_NO_SECOND_SCHEDULER === true, "no second scheduler");
    assert(SEMANTIC_BATCH_LIVE_BATCH_BENCHMARKS_OOS === true, "live batch benchmarks OOS");
    assert(SEMANTIC_BATCH_FAKE_TRANSPORT_ONLY === true, "fake transport only");
    assert(SEMANTIC_BATCH_LIVE_NOT_PERFORMED === true, "live not performed");
    assert(SEMANTIC_BATCH_NEXT_AFTER_CLOSE === "#519", "next after close");
    assert(SEMANTIC_BATCH_HOSTED_KEY_OWNER.includes("Eduardo"), "hosted key owner");
    assert(SEMANTIC_BATCH_BASE_MAIN_SHA.startsWith("610e0e8"), "base main sha");
    assert(SEMANTIC_BATCH_MAP_PATH.includes("semantic-batch-map"), "map path");
    assert(SEMANTIC_BATCH_FIXTURE.includes("semantic-batch.fixtures"), "fixture path");
    assert(SEMANTIC_DISPATCH_ISSUE === "#518", "dispatch bridge issue");
    assert(SEMANTIC_DISPATCH_COORDINATES === "#73", "coordinates #73");
    assert(SEMANTIC_BATCH_OWNERSHIP_COORDINATES === "#73", "ownership coordinates #73");
    assert(SEMANTIC_BATCH_OWNERSHIP_NO_SECOND_GENERATION === true, "no second ownership generation");
    const ac = semanticBatchAcEvidence();
    assert(ac.length === 5 && SEMANTIC_BATCH_AC.length === 5, "five AC rows");
    assert(
      ac.every((row) => row.covered),
      "all AC covered",
    );
  });

  harness.check("semantic-batch: AC1 independent checks concurrent under barrier; result-use alone does not serialize", () => {
    const ownership = createOwnershipHandle({
      generation: "gen-ac1-0000-0000-0000-000000000001",
      workspaceId: "ws.demo",
      occurrenceId: "occ-ac1",
      resource: "semantic-batch/ac1",
    });
    assertOwnershipGenerationShape(ownership);
    const state = beginBatchSettlement({ ownership, sourceRevision: "rev-1" });

    // Four independent branch checks that share snapshot/policy/binding — result-use edges only.
    const items: SemanticWorkItem[] = [
      baseWork({ workId: "w1", questionId: "q.onboarding", resultUseOf: ["branch-select"] }),
      baseWork({ workId: "w2", questionId: "q.offer", resultUseOf: ["branch-select"] }),
      baseWork({ workId: "w3", questionId: "q.impl", resultUseOf: ["branch-select"] }),
      baseWork({ workId: "w4", questionId: "q.audience", resultUseOf: ["branch-select"] }),
    ];

    const grouped = groupSharedStateBatches(items);
    assert(grouped.sharedStateBatches.length === 1, "one shared-state batch");
    assert(grouped.sharedStateBatches[0]!.workIds.length === 4, "four questions batched");
    assert(grouped.independentMapBatches.length === 0, "not independent-map");

    const transport = createSyncBarrierTransport();
    const run = runSyncBarrierBatch({ items, transport, state });
    // All four entered the barrier together before any completed (deterministic concurrency).
    assert(run.concurrentAtBarrier === 4, `expected 4 at barrier, got ${run.concurrentAtBarrier}`);
    assert(run.concurrentPeak >= 4, `peak concurrency ${run.concurrentPeak} proves concurrent dispatch`);
    assert(run.results.length === 4, "four results");
    assert(
      run.results.every((r) => r.ok),
      "all ok",
    );
    assert(run.heldWorkIds.length === 0, "none held");
    assert(run.waitedForDependency.length === 0, "result-use alone did not serialize/wait");
    assert(run.state.acceptedResultIds.length === 4, "four accepts");

    // Speculative plan records consumed vs unused (assessment-only).
    const speculativeItems = items.map((item, i) => ({
      ...item,
      speculativeBranchId: `branch-${i}`,
    }));
    const plan = planSpeculativeAssessments({ items: speculativeItems });
    assert(plan.maySpeculate === true, "prereqs held → may speculate");
    const settled = settleSpeculativeBranches(plan, ["branch-0", "branch-2"], {
      "branch-0": "d0",
      "branch-1": "d1",
      "branch-2": "d2",
      "branch-3": "d3",
    });
    assert(settled.branches.filter((b) => b.status === "consumed").length === 2, "consumed");
    assert(settled.branches.filter((b) => b.status === "unused").length === 2, "unused recorded");

    // Engine gate uses existing batch boundary (not a second scheduler).
    const gate = gateSemanticDispatchBatch(neverHaltDispatchHooks, {
      batchId: grouped.sharedStateBatches[0]!.batchId,
      workspaceId: "ws.demo",
      workIds: grouped.sharedStateBatches[0]!.workIds,
    });
    assert(gate.halt === false, "boundary open");
    assert(gateSemanticBatchBoundary(neverHaltDispatchHooks).halt === false, "session gate open");
  });

  harness.check("semantic-batch: AC2 dependent projections wait; budget/authority holds do not consume unauthorized requests", () => {
    const ownership = createOwnershipHandle({
      generation: "gen-ac2-0000-0000-0000-000000000002",
      workspaceId: "ws.demo",
      occurrenceId: "occ-ac2",
      resource: "semantic-batch/ac2",
    });
    const state = beginBatchSettlement({ ownership, sourceRevision: "rev-2" });

    const dependent = baseWork({
      workId: "w-dep",
      questionId: "q.detail",
      dependsOn: ["proj.round1"],
    });
    const unauthorized = baseWork({
      workId: "w-unauth",
      questionId: "q.secret",
      authorityHeld: false,
      sourceAccessHeld: true,
    });
    const noSource = baseWork({
      workId: "w-nosrc",
      questionId: "q.private",
      sourceAccessHeld: false,
      authorityHeld: true,
    });
    const independent = baseWork({ workId: "w-ok", questionId: "q.ready" });

    const transport = createSyncBarrierTransport();
    const run1 = runSyncBarrierBatch({
      items: [dependent, unauthorized, noSource, independent],
      transport,
      state,
      readyProjectionIds: new Set(),
    });
    assert(run1.waitedForDependency.includes("w-dep"), "dependent waited");
    assert(run1.heldWorkIds.includes("w-unauth"), "authority hold");
    assert(run1.heldWorkIds.includes("w-nosrc"), "source-access hold");
    assert(
      run1.results.every((r) => r.ok && r.workId === "w-ok"),
      "only authorized ready dispatched",
    );
    assert(run1.results.length === 1, "exactly one consume");

    const grouped = groupSharedStateBatches([unauthorized, noSource, independent]);
    assert(
      grouped.rejected.some((r) => r.workId === "w-unauth" && r.reason === "authority_hold"),
      "auth hold reject",
    );
    assert(
      grouped.rejected.some((r) => r.workId === "w-nosrc" && r.reason === "source_access_hold"),
      "source hold reject",
    );
    assert(
      grouped.sharedStateBatches.every((b) => !b.workIds.includes("w-unauth")),
      "unauth not batched",
    );

    const budgetHold = reserveResources({
      items: [independent, baseWork({ workId: "w2", questionId: "q2" })],
      bounds: { maxQuestions: 32, maxCandidates: 64, maxConcurrency: 8, maxRetries: 1, totalInferenceBudget: 10 },
      authorityOk: true,
      budgetRemaining: 0,
    });
    assert(budgetHold.admitted === false && budgetHold.reason === "budget_hold", "budget hold");
    if (!budgetHold.admitted) {
      assert(budgetHold.requestsConsumed === 0, "holds must not consume unauthorized requests");
    }

    const authHold = reserveResources({
      items: [independent],
      bounds: { maxQuestions: 32, maxCandidates: 64, maxConcurrency: 8, maxRetries: 1 },
      authorityOk: false,
    });
    assert(authHold.admitted === false && authHold.reason === "authority_hold", "reservation authority hold");
    if (!authHold.admitted) {
      assert(authHold.requestsConsumed === 0, "no consume on authority hold");
    }

    const foreign = baseWork({ workId: "w-foreign", questionId: "q.x", workspaceId: "ws.other" });
    const cross = groupSharedStateBatches([independent, foreign]);
    assert(cross.sharedStateBatches.length === 2, "separate workspace batches");
    for (const batch of cross.sharedStateBatches) {
      const ws = new Set([independent, foreign].filter((i) => batch.workIds.includes(i.workId)).map((i) => i.workspaceId));
      assert(ws.size === 1, "no cross-workspace contamination");
    }

    const transport2 = createSyncBarrierTransport();
    const run2 = runSyncBarrierBatch({
      items: [dependent],
      transport: transport2,
      state: beginBatchSettlement({ ownership, sourceRevision: "rev-2" }),
      readyProjectionIds: new Set(["proj.round1"]),
    });
    assert(run2.waitedForDependency.length === 0, "dependency satisfied");
    assert(run2.results.length === 1 && run2.results[0]!.ok, "dependent ran after wait");
  });

  harness.check("semantic-batch: AC3 failed shard cannot report complete coverage or release ownership while siblings active", () => {
    const ownership = createOwnershipHandle({
      generation: "gen-ac3-0000-0000-0000-000000000003",
      workspaceId: "ws.demo",
      occurrenceId: "occ-ac3",
      resource: "semantic-batch/ac3",
    });
    assertOwnershipGenerationShape(ownership);

    const summary = reduceMapShards({
      ownershipGeneration: ownership.generation,
      requestOwnershipRelease: true,
      shards: [
        { key: "shard-a", status: "ok", resultDigest: "da" },
        { key: "shard-b", status: "failed", errorCode: "transport_error" },
        { key: "shard-c", status: "active" }, // sibling still active
      ],
    });
    assert(summary.coverageComplete === false, "must not report complete coverage");
    assert(summary.ownershipReleased === false, "must not release ownership while siblings active");
    assert(summary.denominator === 3, "failed shard remains in denominator");
    assert(summary.numerator === 1, "only ok count in numerator");
    assert(summary.failedKeys.includes("shard-b"), "failed key preserved");
    assert(summary.activeKeys.includes("shard-c"), "active sibling visible");
    assert(mayReleaseOwnership(ownership, true) === false, "helper refuses while siblings active");

    // After all settle (failed + ok + cancelled), coverage still incomplete but ownership may release.
    const after = reduceMapShards({
      ownershipGeneration: ownership.generation,
      requestOwnershipRelease: true,
      shards: [
        { key: "shard-a", status: "ok", resultDigest: "da" },
        { key: "shard-b", status: "failed", errorCode: "transport_error" },
        { key: "shard-c", status: "cancelled" },
      ],
    });
    assert(after.coverageComplete === false, "partial still incomplete");
    assert(after.ownershipReleased === true, "ownership may release once siblings settled");
    assert(after.denominator === 3, "denominator preserves all shards");
    assert(after.cancelledKeys.includes("shard-c"), "cancellation preserved");
  });

  harness.check("semantic-batch: AC4 duplicate event/request + interrupted commit → no duplicate accepts; uncertain charges visible", () => {
    const ownership = createOwnershipHandle({
      generation: "gen-ac4-0000-0000-0000-000000000004",
      workspaceId: "ws.demo",
      occurrenceId: "occ-ac4",
      resource: "semantic-batch/ac4",
    });
    let state = beginBatchSettlement({ ownership, sourceRevision: "rev-4" });
    state = {
      ...state,
      dispatchedWorkIds: ["w-dup", "w-unc"],
    };

    const first = acceptResult(state, {
      resultId: "res-1",
      workId: "w-dup",
      ownershipGeneration: ownership.generation,
      sourceRevision: "rev-4",
    });
    assert(first.ok === true, "first accept");
    if (first.ok) state = first.state;

    const dup = acceptResult(state, {
      resultId: "res-1", // same event/request id
      workId: "w-dup",
      ownershipGeneration: ownership.generation,
      sourceRevision: "rev-4",
    });
    assert(dup.ok === false && dup.reason === "duplicate_accept", "no duplicate accept");
    assert(dup.state.acceptedResultIds.filter((id) => id === "res-1").length === 1, "single accept retained");

    // Interrupted commit / uncertain charge stays visible.
    const uncertain = acceptResult(state, {
      resultId: "res-unc-1",
      workId: "w-unc",
      ownershipGeneration: ownership.generation,
      sourceRevision: "rev-4",
      uncertainCharge: {
        requestId: "req-unc",
        attemptId: "att-unc",
        reason: "timeout_after_dispatch_billing_uncertain",
      },
    });
    assert(uncertain.ok === true, "uncertain accept path");
    if (uncertain.ok) state = uncertain.state;
    assert(state.uncertainCharges.length === 1, "uncertain charge visible");
    assert(state.uncertainCharges[0]!.reason.includes("uncertain"), "charge reason preserved");

    // Late after ownership change rejected.
    const lateOwn = acceptResult(
      { ...state, ownership: { ...state.ownership, active: false } },
      {
        resultId: "res-late",
        workId: "w-dup",
        ownershipGeneration: ownership.generation,
        sourceRevision: "rev-4",
      },
    );
    assert(lateOwn.ok === false && lateOwn.reason === "late_after_ownership", "late after ownership");

    // Late after source revision rejected.
    const lateRev = acceptResult(state, {
      resultId: "res-late-rev",
      workId: "w-dup",
      ownershipGeneration: ownership.generation,
      sourceRevision: "rev-OTHER",
    });
    assert(lateRev.ok === false && lateRev.reason === "late_after_revision", "late after revision");

    // Cancellation stops new dispatch; settle before release.
    let cancelled = requestCancellation(state);
    assert(cancelled.stopNewDispatch === true, "stop new dispatch");
    let threw = false;
    try {
      recordDispatch(cancelled, ["w-new"]);
    } catch {
      threw = true;
    }
    assert(threw, "dispatch after cancel throws");

    // Mark in-flight unresolved then release at batch boundary.
    cancelled = {
      ...cancelled,
      dispatchedWorkIds: ["w-inflight"],
      settledWorkIds: [],
      unresolvedWorkIds: [],
    };
    const released = releaseOwnershipAfterSettlement(cancelled, neverHaltDispatchHooks);
    assert(released.released === true, "released after mark unresolved");
    assert(released.state.unresolvedWorkIds.includes("w-inflight"), "in-flight marked unresolved");
    assert(released.state.ownership.active === false, "ownership inactive after release");
    assert(released.state.uncertainCharges.length === 1, "uncertain charges still visible after cancel");
  });

  harness.check("semantic-batch: AC5 latency/cost report separates compile/projection/transport/queue/reduction/recovery", () => {
    const report = buildLatencyCostReport([
      { phase: "compile", latencyMs: 3, cost: { kind: "unknown", note: "compile has no provider cost" } },
      { phase: "projection", latencyMs: 5, cost: { kind: "unknown" } },
      { phase: "transport", latencyMs: 40, cost: { kind: "estimated", value: 0.02, note: "estimated; not actual" } },
      { phase: "queue", latencyMs: 2, cost: { kind: "unknown" } },
      { phase: "reduction", latencyMs: 1, cost: { kind: "unknown" } },
      { phase: "recovery", latencyMs: 4, cost: { kind: "unknown" } },
    ]);
    assert(report.phases.length === 6, "six phases");
    const names = report.phases.map((p) => p.phase);
    assert(names.join(",") === "compile,projection,transport,queue,reduction,recovery", `phase order ${names.join(",")}`);
    assert(report.totalLatencyMs === 55, "sum latency");
    assert(report.phases[2]!.cost.kind === "estimated", "transport estimated not fabricated actual");
    assert(report.phases[0]!.cost.kind === "unknown", "compile unknown not zero-as-actual");
    assert(typeof report.reportDigest === "string" && report.reportDigest.length > 8, "digest");

    // Incomplete report fails closed.
    let threw = false;
    try {
      buildLatencyCostReport([{ phase: "compile", latencyMs: 1, cost: { kind: "unknown" } }]);
    } catch {
      threw = true;
    }
    assert(threw, "incomplete phases fail closed");

    // Reservation cost honesty.
    const reserved = reserveResources({
      items: [baseWork({ workId: "w1", questionId: "q1" })],
      bounds: { maxQuestions: 8, maxCandidates: 8, maxConcurrency: 4, maxRetries: 1 },
      authorityOk: true,
    });
    assert(reserved.admitted === true && reserved.cost.kind === "unknown", "unavailable cost → unknown");
    const estimated = reserveResources({
      items: [baseWork({ workId: "w1", questionId: "q1" })],
      bounds: { maxQuestions: 8, maxCandidates: 8, maxConcurrency: 4, maxRetries: 1 },
      authorityOk: true,
      estimatedCostPerQuestion: 0.01,
    });
    assert(estimated.admitted === true && estimated.cost.kind === "estimated", "estimated when provided");
  });

  harness.check("semantic-batch: no second scheduler / no #519 / fake transport only in API surface", () => {
    assert(SEMANTIC_BATCH_NO_SECOND_SCHEDULER === true, "flag");
    assert(SEMANTIC_BATCH_NO_519 === true, "no 519");
    assert(SEMANTIC_BATCH_FAKE_TRANSPORT_ONLY === true, "fake only");
    assert(SEMANTIC_BATCH_LIVE_BATCH_BENCHMARKS_OOS === true, "benchmarks OOS");
    // Tool/product speculation forbidden.
    let threw = false;
    try {
      planSpeculativeAssessments({
        items: [baseWork({ workId: "w", questionId: "q", speculativeBranchId: "b1" })],
        allowToolSpeculation: true,
      });
    } catch {
      threw = true;
    }
    assert(threw, "tool speculation forbidden");
  });
}
