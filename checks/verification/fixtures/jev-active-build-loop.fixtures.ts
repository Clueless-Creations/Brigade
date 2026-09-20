/**
 * #573 — Active Jev-directed build loop after next-work ranking (paper; synthetic; no-network).
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { assert, skillRoot, type Harness } from "./_harness.js";
import {
  CHECKPOINT_EXPLICIT_OUTCOMES,
  CHECKPOINT_PURPOSES,
  JEV_ACTIVE_BUILD_LOOP_POLICY,
  JEV_LOOP_BOUNDS,
  JEV_LOOP_LIMITATIONS,
  JEV_LOOP_OWNER_MODULES,
  JEV_LOOP_RECIPE_ACTIVE_LOOP_IMPLEMENTED,
  JEV_LOOP_RECIPE_ARCHITECTURE_DOC_ISSUE,
  JEV_LOOP_RECIPE_CONSUMES,
  JEV_LOOP_RECIPE_EPIC,
  JEV_LOOP_RECIPE_ISSUE,
  JEV_LOOP_RECIPE_LIVE_NOT_PERFORMED,
  JEV_LOOP_RECIPE_NEXT_AFTER_CLOSE,
  JEV_LOOP_RECIPE_NO_511_AUTOCLOSE,
  JEV_LOOP_RECIPE_NO_524_REWRITE,
  JEV_LOOP_RECIPE_NO_571_RECREATE,
  JEV_LOOP_RECIPE_NO_573_IMPL,
  JEV_LOOP_RECIPE_NO_DETERMINISTIC_THROUGH_MODEL,
  JEV_LOOP_RECIPE_NO_DUPLICATE_RUNTIME,
  JEV_LOOP_RECIPE_NO_FRONTIER_REINTERPRET_WRAPPER,
  JEV_LOOP_RECIPE_NO_JEV_IN_BUSINESS_POLICY,
  JEV_LOOP_RECIPE_NO_NESTED_SUPERVISORY,
  JEV_LOOP_RECIPE_NO_NETWORK,
  JEV_LOOP_RECIPE_NO_SELF_EDIT_LIVE_POLICY,
  JEV_LOOP_RECIPE_PROVIDER_IS_SWAPPABLE,
  JEV_LOOP_RECIPE_STAMP,
  LOOP_DIAGNOSES,
  LOOP_PASSIVE_READ_SURFACES,
  ROUTE_KINDS,
  jevLoopTouchesDefaultIndex,
  recreatesJevQualification,
  redefinesEvidenceGapRanking,
} from "../../../catalog/workflows/jev-active-build-loop.js";
import {
  JEV_LOOP_AC,
  JEV_LOOP_ACTIVE_LOOP_IMPLEMENTED,
  JEV_LOOP_ARCHITECTURE_DOC_ISSUE,
  JEV_LOOP_BASE_MAIN_SHA,
  JEV_LOOP_CONSUMES,
  JEV_LOOP_EPIC,
  JEV_LOOP_ISSUE,
  JEV_LOOP_LIVE_NOT_PERFORMED,
  JEV_LOOP_NEXT_AFTER_CLOSE,
  JEV_LOOP_NO_511_AUTOCLOSE,
  JEV_LOOP_NO_524_REWRITE,
  JEV_LOOP_NO_571_RECREATE,
  JEV_LOOP_NO_573_IMPL,
  JEV_LOOP_NO_DETERMINISTIC_THROUGH_MODEL,
  JEV_LOOP_NO_DUPLICATE_RUNTIME,
  JEV_LOOP_NO_FRONTIER_REINTERPRET_WRAPPER,
  JEV_LOOP_NO_JEV_IN_BUSINESS_POLICY,
  JEV_LOOP_NO_NESTED_SUPERVISORY,
  JEV_LOOP_NO_NETWORK,
  JEV_LOOP_NO_SELF_EDIT_LIVE_POLICY,
  JEV_LOOP_PROVIDER_IS_SWAPPABLE,
  JEV_LOOP_STAMP,
  jevLoopAcEvidence,
} from "../../../catalog/providers/jev-active-build-loop-map.js";
import {
  CONSUMER_APP_OBSERVATION_CASES,
  JEV_573_HANDOFF_SURFACE,
  JEV_LOOP_ACTIVE_LOOP_IMPLEMENTED as SERVICE_ACTIVE,
  JEV_LOOP_CONSUMES as SERVICE_CONSUMES,
  JEV_LOOP_EPIC as SERVICE_EPIC,
  JEV_LOOP_ISSUE as SERVICE_ISSUE,
  JEV_LOOP_LIVE_NOT_PERFORMED as SERVICE_LIVE,
  JEV_LOOP_NEXT_AFTER_CLOSE as SERVICE_NEXT,
  JEV_LOOP_NO_511_AUTOCLOSE as SERVICE_NO_511,
  JEV_LOOP_NO_524_REWRITE as SERVICE_NO_524,
  JEV_LOOP_NO_571_RECREATE as SERVICE_NO_571,
  JEV_LOOP_NO_573_IMPL as SERVICE_NO_573,
  JEV_LOOP_NO_DETERMINISTIC_THROUGH_MODEL as SERVICE_NO_DET,
  JEV_LOOP_NO_DUPLICATE_RUNTIME as SERVICE_NO_DUP,
  JEV_LOOP_NO_FRONTIER_REINTERPRET_WRAPPER as SERVICE_NO_FRONTIER,
  JEV_LOOP_NO_JEV_IN_BUSINESS_POLICY as SERVICE_NO_BIZ,
  JEV_LOOP_NO_NESTED_SUPERVISORY as SERVICE_NO_NESTED,
  JEV_LOOP_NO_NETWORK as SERVICE_NO_NET,
  JEV_LOOP_NO_SELF_EDIT_LIVE_POLICY as SERVICE_NO_SELF,
  JEV_LOOP_PROVIDER_IS_SWAPPABLE as SERVICE_SWAP,
  JEV_LOOP_STAMP as SERVICE_STAMP,
  advanceLoopProgress,
  classifyLoopDiagnosis,
  consumeQualifiedHandoff,
  describeFreshAgentPath,
  evaluateIndependentReview,
  explicitFailureCases,
  initialLoopProgress,
  pathCredentialActivatesRoute,
  readActiveLoopPassively,
  runActiveLoopFanout,
  runFrozenBaseline,
  runOfflineObservationStep,
  selectBoundRoute,
  shareOwnershipAcrossCheckpoints,
} from "../../../kernel/services/jev-active-build-loop.js";

export function register(harness: Harness): void {
  harness.check("jev-active-build-loop: stamps + AC map + hard bans + NO_573 cleared", () => {
    assert(JEV_LOOP_ISSUE === "#573" && SERVICE_ISSUE === "#573" && JEV_LOOP_RECIPE_ISSUE === "#573", "issue");
    assert(JEV_LOOP_EPIC === "#511" && SERVICE_EPIC === "#511" && JEV_LOOP_RECIPE_EPIC === "#511", "epic");
    assert(JEV_LOOP_STAMP === "0.221.52" && SERVICE_STAMP === "0.221.52" && JEV_LOOP_RECIPE_STAMP === "0.221.52", "stamp");
    assert(JEV_LOOP_NO_573_IMPL === false && SERVICE_NO_573 === false && JEV_LOOP_RECIPE_NO_573_IMPL === false, "NO_573");
    assert(JEV_LOOP_NEXT_AFTER_CLOSE === "#574" && SERVICE_NEXT === "#574" && JEV_LOOP_RECIPE_NEXT_AFTER_CLOSE === "#574", "next");
    assert(JEV_LOOP_NO_511_AUTOCLOSE && SERVICE_NO_511 && JEV_LOOP_RECIPE_NO_511_AUTOCLOSE, "no autoclose");
    assert(JEV_LOOP_NO_524_REWRITE && SERVICE_NO_524 && JEV_LOOP_RECIPE_NO_524_REWRITE, "no #524");
    assert(JEV_LOOP_NO_571_RECREATE && SERVICE_NO_571 && JEV_LOOP_RECIPE_NO_571_RECREATE, "no #571 recreate");
    assert(JEV_LOOP_NO_NETWORK && SERVICE_NO_NET && JEV_LOOP_RECIPE_NO_NETWORK, "no network");
    assert(JEV_LOOP_LIVE_NOT_PERFORMED && SERVICE_LIVE && JEV_LOOP_RECIPE_LIVE_NOT_PERFORMED, "live");
    assert(JEV_LOOP_NO_DUPLICATE_RUNTIME && SERVICE_NO_DUP && JEV_LOOP_RECIPE_NO_DUPLICATE_RUNTIME, "no dup");
    assert(JEV_LOOP_NO_JEV_IN_BUSINESS_POLICY && SERVICE_NO_BIZ && JEV_LOOP_RECIPE_NO_JEV_IN_BUSINESS_POLICY, "no biz");
    assert(JEV_LOOP_PROVIDER_IS_SWAPPABLE && SERVICE_SWAP && JEV_LOOP_RECIPE_PROVIDER_IS_SWAPPABLE, "swappable");
    assert(JEV_LOOP_NO_DETERMINISTIC_THROUGH_MODEL && SERVICE_NO_DET && JEV_LOOP_RECIPE_NO_DETERMINISTIC_THROUGH_MODEL, "no det");
    assert(JEV_LOOP_NO_FRONTIER_REINTERPRET_WRAPPER && SERVICE_NO_FRONTIER && JEV_LOOP_RECIPE_NO_FRONTIER_REINTERPRET_WRAPPER, "no frontier");
    assert(JEV_LOOP_NO_NESTED_SUPERVISORY && SERVICE_NO_NESTED && JEV_LOOP_RECIPE_NO_NESTED_SUPERVISORY, "no nested");
    assert(JEV_LOOP_NO_SELF_EDIT_LIVE_POLICY && SERVICE_NO_SELF && JEV_LOOP_RECIPE_NO_SELF_EDIT_LIVE_POLICY, "no self-edit");
    assert(JEV_LOOP_ACTIVE_LOOP_IMPLEMENTED && SERVICE_ACTIVE && JEV_LOOP_RECIPE_ACTIVE_LOOP_IMPLEMENTED, "loop");
    assert(JSON.stringify([...JEV_LOOP_CONSUMES]) === JSON.stringify(["#524", "#523", "#571"]), "consumes");
    assert(JSON.stringify([...SERVICE_CONSUMES]) === JSON.stringify([...JEV_LOOP_RECIPE_CONSUMES]), "consumes align");
    assert(JEV_LOOP_AC.length === 11 && jevLoopAcEvidence().every((row) => row.covered), "AC");
    assert(JEV_LOOP_BASE_MAIN_SHA.length === 40, "base sha");
    assert(JEV_LOOP_ARCHITECTURE_DOC_ISSUE === "#574" && JEV_LOOP_RECIPE_ARCHITECTURE_DOC_ISSUE === "#574", "docs");
    assert(CHECKPOINT_PURPOSES.length === 2, "purposes");
    assert(CHECKPOINT_EXPLICIT_OUTCOMES.includes("no_match") && CHECKPOINT_EXPLICIT_OUTCOMES.includes("stale_refused"), "outcomes");
    assert(ROUTE_KINDS.length === 4 && LOOP_DIAGNOSES.length === 5, "vocab");
    assert(LOOP_PASSIVE_READ_SURFACES.length === 5, "passive");
    assert(JEV_LOOP_BOUNDS.maxLoopIterations >= 1 && JEV_LOOP_BOUNDS.maxNoProgressRounds >= 1, "bounds");
    assert(JEV_LOOP_LIMITATIONS.length >= 8, "limitations");
    assert(JEV_ACTIVE_BUILD_LOOP_POLICY.activeLoopImplemented === true, "policy loop");
    assert(JEV_ACTIVE_BUILD_LOOP_POLICY.staleSelectionMayDispatch === false, "stale ban");
    assert(JEV_LOOP_OWNER_MODULES.length >= 5, "owners");
    assert(JEV_573_HANDOFF_SURFACE.consumableBy === "#573", "handoff");
    const indexSource = readFileSync(path.join(skillRoot, "catalog/workflows/index.ts"), "utf8");
    assert(!jevLoopTouchesDefaultIndex(indexSource), "no default index");
    assert(redefinesEvidenceGapRanking("export function rankEligibleWork() {}"), "rewrite detect");
    assert(recreatesJevQualification("function describeJevSupportedTuple() {}"), "recreate detect");
  });

  harness.check("jev-active-build-loop: AC1 changed observation → executed action", () => {
    const revisions = [{ sourceId: "src.app", revision: "rev.573.1" }];
    const steps = CONSUMER_APP_OBSERVATION_CASES.slice(0, 3).map((kase) =>
      runOfflineObservationStep({
        purpose: "within-task",
        observation: kase.observation,
        eligibleCandidateIds: [...kase.eligible],
        sourceRevisions: revisions,
        ownershipHandleId: "own.ac1",
      }),
    );
    assert(steps[0]!.executedAction === "observe", "inspect");
    assert(steps[1]!.executedAction === "repair", "repair");
    assert(steps[2]!.executedAction === "verify-completion", "verify");
    assert(String(steps[0]!.executedAction) !== String(steps[1]!.executedAction), "changed");
    // Ranked generative is never the executed action when inspection fits.
    assert(
      steps.every((s) => (s.executedAction as string | null) !== "generative-worker"),
      "no gen",
    );
    assert(
      steps.every((s) => s.facts.dispatch.dispatchedAction === s.executedAction),
      "dispatch=exec",
    );
  });

  harness.check("jev-active-build-loop: AC2 shared ownership/receipts across checkpoints", () => {
    const shared = shareOwnershipAcrossCheckpoints("own.shared.573");
    assert(shared.buildLevel.purpose === "build-level" && shared.withinTask.purpose === "within-task", "purposes");
    assert(shared.buildLevel.ownershipHandleId === shared.withinTask.ownershipHandleId, "ownership");
    assert(shared.buildLevel.ownershipHandleId === shared.sharedOwnershipHandleId, "id");
    assert(shared.buildLevel.materialSourceRevisions[0]!.revision === shared.withinTask.materialSourceRevisions[0]!.revision, "revisions");
  });

  harness.check("jev-active-build-loop: AC3 admitted policy continues without frontier re-approval", () => {
    const consumed = consumeQualifiedHandoff();
    assert(consumed.implementsActiveLoop === true, "loop");
    assert(consumed.actionable >= 1, "actionable");
    assert(consumed.continuedWithoutFrontier >= 1, "continued");
    assert(JEV_ACTIVE_BUILD_LOOP_POLICY.frontierAgentReinterpretationRequired === false, "policy");
  });

  harness.check("jev-active-build-loop: AC4 unknown → bounded evidence/generation without arbitrary effects", () => {
    const step = runOfflineObservationStep({
      purpose: "within-task",
      observation: "Novel unknown profile gap appeared after the last observation.",
      eligibleCandidateIds: ["cand.inspect-profile", "cand.generate-more", "cand.repair-progress"],
      sourceRevisions: [{ sourceId: "src.app", revision: "rev.573.u" }],
      ownershipHandleId: "own.unknown",
    });
    assert(step.executedAction === "observe", "evidence first");
    assert((step.executedAction as string | null) !== "generative-worker", "not arbitrary gen");
    const route = selectBoundRoute({
      desiredKind: "semantic",
      routes: [
        { routeId: "r.det", routeKind: "deterministic", bindingId: "b.d", authorized: true, supported: true, modality: "paper" },
        { routeId: "r.gen", routeKind: "generative", bindingId: "b.g", authorized: true, supported: true, modality: "paper" },
      ],
      allowBoundedGenerativeFallback: true,
    });
    assert(route.fallback === "observe" || route.fallback === "bounded-generative" || route.outcome === "hold_no_route", "bounded");
    assert(pathCredentialActivatesRoute(true) === false, "path");
  });

  harness.check("jev-active-build-loop: AC5 passive zero inference; stale refuses dispatch", () => {
    for (const surface of LOOP_PASSIVE_READ_SURFACES) {
      const read = readActiveLoopPassively(surface);
      assert(read.inferenceRequests === 0 && read.providerCalls === 0, surface);
      assert(read.runStateMutations === 0 && read.backgroundPollersStarted === 0, surface + " side");
    }
    const stale = runOfflineObservationStep({
      purpose: "within-task",
      observation: "Completion updated progress counters but the profile coverage assertion is unchanged.",
      eligibleCandidateIds: ["cand.inspect-profile", "cand.generate-more"],
      sourceRevisions: [{ sourceId: "src.app", revision: "rev.573.stale" }],
      ownershipHandleId: "own.stale",
      forceStale: true,
    });
    assert(stale.executedAction === null, "no exec");
    assert(stale.outcome === "stale_refused", "stale");
    assert(stale.facts.dispatch.refusedReason !== null, "reason");
  });

  harness.check("jev-active-build-loop: AC6 real async independent/dependent/limits/cancel/late/partial", async () => {
    const fan = await runActiveLoopFanout();
    assert(fan.admitted && !fan.synchronousBarrierOnly, "async");
    assert(fan.independentRounds === 1 && fan.dependentRounds === 1, "rounds");
    assert(fan.peakConcurrency <= fan.concurrencyLimit && fan.peakConcurrency >= 1, "concurrency");
    assert(fan.outcomesComplete && fan.ownershipReleased, "complete");
    assert(fan.partialFailures >= 1, "partial");
    assert(
      fan.outcomes.some((o) => o.status === "recovered"),
      "recovered",
    );
    const cancelled = await runActiveLoopFanout({ cancel: true });
    assert(cancelled.cancelled && cancelled.ownershipReleased, "cancel");
    const deadline = await runActiveLoopFanout({ tightDeadline: true });
    assert(deadline.ownershipReleased, "deadline ownership");
    assert(deadline.deadlineExceeded || deadline.lateResults >= 1 || deadline.outcomes.some((o) => o.status === "late" || o.status === "cancelled"), "late");
    const over = await runActiveLoopFanout({ overCap: true });
    assert(!over.admitted && over.outcomes.every((o) => o.status === "not_admitted"), "cap");
  });

  harness.check("jev-active-build-loop: AC7 explicit no-match/wrong-binding paths", () => {
    const cases = explicitFailureCases();
    const kinds = new Set(cases.map((c) => c.kind));
    for (const needed of ["no_match", "insufficient_evidence", "contradictory_evidence", "wrong_binding", "unsupported_modality", "missing_grant"] as const) {
      assert(kinds.has(needed), needed);
    }
    assert(
      cases.every((c) => c.step.executedAction === null && c.step.outcome === c.kind),
      "explicit",
    );
  });

  harness.check("jev-active-build-loop: AC8 loop/no-progress/fairness bounds", () => {
    let state = initialLoopProgress(["mandatory.review"]);
    for (let i = 0; i < JEV_LOOP_BOUNDS.maxNoProgressRounds; i++) {
      state = advanceLoopProgress(state, { progressed: false, ranMandatory: false });
    }
    assert(state.terminated && state.terminateReason === "no-progress", "no-progress");

    state = initialLoopProgress(["mandatory.review"]);
    for (let i = 0; i < JEV_LOOP_BOUNDS.mandatoryFairnessWindow + 1; i++) {
      state = advanceLoopProgress(state, { progressed: true, ranMandatory: false });
    }
    assert(state.terminated && state.fairnessViolation && state.terminateReason === "fairness-ceiling", "fairness");

    state = initialLoopProgress(["mandatory.review"]);
    for (let i = 0; i < JEV_LOOP_BOUNDS.maxLoopIterations + 1; i++) {
      state = advanceLoopProgress(state, { progressed: true, ranMandatory: true, nextMandatoryId: "mandatory.review" });
    }
    assert(state.terminated && state.terminateReason === "maxLoopIterations", "max iter");

    assert(classifyLoopDiagnosis({ modelWrong: true }) === "model_error", "diag model");
    assert(classifyLoopDiagnosis({ omittedCandidate: true }) === "candidate_omission", "diag omit");
    assert(classifyLoopDiagnosis({ executorFailed: true }) === "executor_failure", "diag exec");
  });

  harness.check("jev-active-build-loop: AC9 independent review mandatory", () => {
    const missing = evaluateIndependentReview({ present: false, deviceEvidenceRequired: false, deviceEvidencePresent: false });
    assert(!missing.mayProceed && missing.required, "missing review");
    const device = evaluateIndependentReview({ present: true, deviceEvidenceRequired: true, deviceEvidencePresent: false });
    assert(!device.mayProceed, "device");
    const ok = evaluateIndependentReview({ present: true, deviceEvidenceRequired: true, deviceEvidencePresent: true });
    assert(ok.mayProceed, "ok");
    assert(JEV_ACTIVE_BUILD_LOOP_POLICY.independentReviewRequired === true, "policy");
  });

  harness.check("jev-active-build-loop: AC10 fresh agents find supported path", () => {
    const fresh = describeFreshAgentPath();
    assert(fresh.architecturePromptRequired === false && fresh.publicCommandsInvented === false, "no invent");
    assert(existsSync(path.join(skillRoot, fresh.recipeModule)), "recipe");
    assert(existsSync(path.join(skillRoot, fresh.mapModule)), "map");
    assert(existsSync(path.join(skillRoot, fresh.serviceModule)), "service");
    assert(existsSync(path.join(skillRoot, fresh.docPath)), "doc");
    assert(fresh.markers.includes("#573") && fresh.markers.includes("0.221.52"), "markers");
    const doc = readFileSync(path.join(skillRoot, fresh.docPath), "utf8");
    assert(doc.includes("#573") && /epic 511 remains open/i.test(doc), "doc epic");
    assert(!/closes?\s+#511|fixes?\s+#511|resolves?\s+#511/i.test(doc), "no autoclose keyword");
  });

  harness.check("jev-active-build-loop: AC11 frozen baseline outcomes/cost", () => {
    const report = runFrozenBaseline();
    assert(report.stamp === "0.221.52", "stamp");
    assert(report.completedOutcomes.length === CONSUMER_APP_OBSERVATION_CASES.length, "cases");
    assert(
      report.completedOutcomes.some((c) => c.executedAction === "observe"),
      "observe",
    );
    assert(
      report.completedOutcomes.some((c) => c.executedAction === "repair"),
      "repair",
    );
    assert(
      report.completedOutcomes.some((c) => c.outcome === "insufficient_evidence"),
      "unknown haptic",
    );
    assert(report.totalCost.kind === "unknown" || report.totalCost.kind === "estimated" || report.totalCost.kind === "actual", "cost");
    assert(report.correctionEffort.kind !== undefined, "correction");
    assert(report.hapticProof === "unknown", "haptic");
    assert(report.limitations.length >= 5, "limitations");
  });
}
