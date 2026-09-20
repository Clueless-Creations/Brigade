/**
 * #571 — Qualify Jev for active build routing/validation (paper; synthetic; no-network).
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { assert, skillRoot, type Harness } from "./_harness.js";
import {
  CONFORMANCE_FAILURE_CLASSES,
  DETERMINISTIC_ONLY_OPERATIONS,
  JEV_DECISION_FAMILIES,
  JEV_EVIDENCE_CLASSES,
  JEV_FANOUT_LIMITS,
  JEV_ROUTING_OWNER_MODULES,
  JEV_ROUTING_QUALIFICATION_LIMITATIONS,
  JEV_ROUTING_QUALIFICATION_POLICY,
  JEV_ROUTING_RECIPE_CONFIDENCE_IS_NOT_CALIBRATION,
  JEV_ROUTING_RECIPE_CONSUMES,
  JEV_ROUTING_RECIPE_EPIC,
  JEV_ROUTING_RECIPE_GATEWAY_EQUIVALENCE_NOT_ASSUMED,
  JEV_ROUTING_RECIPE_ISSUE,
  JEV_ROUTING_RECIPE_LIVE_NOT_PERFORMED,
  JEV_ROUTING_RECIPE_MARKETING_IS_NOT_PROOF,
  JEV_ROUTING_RECIPE_NEXT_AFTER_CLOSE,
  JEV_ROUTING_RECIPE_NO_511_AUTOCLOSE,
  JEV_ROUTING_RECIPE_NO_524_REWRITE,
  JEV_ROUTING_RECIPE_NO_571_IMPL,
  JEV_ROUTING_RECIPE_NO_573_IMPL,
  JEV_ROUTING_RECIPE_NO_DETERMINISTIC_THROUGH_MODEL,
  JEV_ROUTING_RECIPE_NO_DUPLICATE_RUNTIME,
  JEV_ROUTING_RECIPE_NO_FRONTIER_REINTERPRET_WRAPPER,
  JEV_ROUTING_RECIPE_NO_JEV_IN_BUSINESS_POLICY,
  JEV_ROUTING_RECIPE_NO_NETWORK,
  JEV_ROUTING_RECIPE_PROVIDER_IS_SWAPPABLE,
  JEV_ROUTING_RECIPE_SOURCE_PRESENCE_IS_NOT_LIVE_QUALIFICATION,
  JEV_ROUTING_RECIPE_STAMP,
  JEV_ROUTING_RECIPE_STRICT_SHAPE_IS_NOT_TRUTH,
  JEV_TUPLE_DIMENSIONS,
  PASSIVE_READ_SURFACES,
  ROUTABLE_BUILD_ACTIONS,
  ROUTING_CASE_KINDS,
  ROUTING_OUTCOMES,
  jevRoutingTouchesDefaultIndex,
  namesProviderAsBusinessPolicy,
  redefinesEvidenceGapRanking,
} from "../../../catalog/workflows/jev-active-routing-qualification.js";
import {
  JEV_ROUTING_AC,
  JEV_ROUTING_ACTIVE_LOOP_ISSUE,
  JEV_ROUTING_ARCHITECTURE_DOC_ISSUE,
  JEV_ROUTING_BASE_MAIN_SHA,
  JEV_ROUTING_CONFIDENCE_IS_NOT_CALIBRATION,
  JEV_ROUTING_CONSUMES,
  JEV_ROUTING_DOC,
  JEV_ROUTING_EPIC,
  JEV_ROUTING_GATEWAY_EQUIVALENCE_NOT_ASSUMED,
  JEV_ROUTING_HOSTED_KEY_OWNER,
  JEV_ROUTING_ISSUE,
  JEV_ROUTING_LIVE_NOT_PERFORMED,
  JEV_ROUTING_MARKETING_IS_NOT_PROOF,
  JEV_ROUTING_NEXT_AFTER_CLOSE,
  JEV_ROUTING_NO_511_AUTOCLOSE,
  JEV_ROUTING_NO_524_REWRITE,
  JEV_ROUTING_NO_571_IMPL,
  JEV_ROUTING_NO_573_IMPL,
  JEV_ROUTING_NO_DETERMINISTIC_THROUGH_MODEL,
  JEV_ROUTING_NO_DUPLICATE_RUNTIME,
  JEV_ROUTING_NO_FRONTIER_REINTERPRET_WRAPPER,
  JEV_ROUTING_NO_JEV_IN_BUSINESS_POLICY,
  JEV_ROUTING_NO_NETWORK,
  JEV_ROUTING_PROFILE_CONSUMER_ISSUES,
  JEV_ROUTING_PROVIDER_IS_SWAPPABLE,
  JEV_ROUTING_SOURCE_PRESENCE_IS_NOT_LIVE_QUALIFICATION,
  JEV_ROUTING_STAMP,
  JEV_ROUTING_STRICT_SHAPE_IS_NOT_TRUTH,
  jevRoutingAcEvidence,
} from "../../../catalog/providers/jev-active-routing-qualification-map.js";
import {
  JEV_573_HANDOFF_SURFACE,
  JEV_CONFORMANCE_FAILURE_CASES,
  JEV_FAKE_WIRING_CONFORMANCE_CASES,
  JEV_FROZEN_ROUTING_CORPUS,
  JEV_OFFICIAL_CONFORMANCE_CASES,
  JEV_PROFILE_CONSUMER_ID,
  JEV_ROUTING_CONFIDENCE_IS_NOT_CALIBRATION as SERVICE_CONFIDENCE,
  JEV_ROUTING_CONSUMES as SERVICE_CONSUMES,
  JEV_ROUTING_EPIC as SERVICE_EPIC,
  JEV_ROUTING_ISSUE as SERVICE_ISSUE,
  JEV_ROUTING_LIVE_NOT_PERFORMED as SERVICE_LIVE,
  JEV_ROUTING_NEXT_AFTER_CLOSE as SERVICE_NEXT,
  JEV_ROUTING_NO_511_AUTOCLOSE as SERVICE_NO_511,
  JEV_ROUTING_NO_524_REWRITE as SERVICE_NO_524,
  JEV_ROUTING_NO_571_IMPL as SERVICE_NO_571,
  JEV_ROUTING_NO_573_IMPL as SERVICE_NO_573,
  JEV_ROUTING_NO_DETERMINISTIC_THROUGH_MODEL as SERVICE_NO_DET,
  JEV_ROUTING_NO_DUPLICATE_RUNTIME as SERVICE_NO_DUP,
  JEV_ROUTING_NO_FRONTIER_REINTERPRET_WRAPPER as SERVICE_NO_FRONTIER,
  JEV_ROUTING_NO_JEV_IN_BUSINESS_POLICY as SERVICE_NO_BIZ,
  JEV_ROUTING_NO_NETWORK as SERVICE_NO_NET,
  JEV_ROUTING_PROVIDER_IS_SWAPPABLE as SERVICE_SWAP,
  JEV_ROUTING_STAMP as SERVICE_STAMP,
  JEV_ROUTING_STRICT_SHAPE_IS_NOT_TRUTH as SERVICE_SHAPE,
  applyRoutingPolicy,
  buildRoutingReceipts,
  corpusContainsInjectedInstruction,
  describeJevSupportedTuple,
  deterministicOnlyOperations,
  evaluateFamilyPromotion,
  evaluateFrozenRoutingCorpus,
  frozenRoutingCorpusDigest,
  guardDeterministicOperation,
  handoffRequiresFrontierReinterpretation,
  invalidateOnSourceChange,
  jevAuthorityInvariants,
  jevSupportStatements,
  paperAdmissionFreeze,
  productProfileValidationConsumer,
  readJevQualificationPassively,
  receiptBindingId,
  runConformanceCase,
  runSeededJevFanout,
  runSeededJevFanoutCancelled,
  runSeededJevFanoutDeadline,
  runSeededJevFanoutOverCap,
  seededProfileAssessmentDecision,
  seededQualifiedDecisions,
  selectJevBinding,
  summarizeConformance,
  tuplesAreEquivalent,
} from "../../../kernel/services/jev-active-routing-qualification.js";
import { TYPESAFE_ADAPTER_BINDING_ID, TYPESAFE_ADAPTER_PROVIDER_ID, TYPESAFE_ADAPTER_STAMP } from "../../../adapters/providers/typesafe/index.js";
import {
  TYPESAFE_API_BASE_DEFAULT,
  TYPESAFE_MODEL_DEFAULT,
  TYPESAFE_NPM_SDK_VERSION,
  TYPESAFE_OFFICIAL_DOC_FIXTURES,
  TYPESAFE_PYTHON_SDK_VERSION,
} from "../../../catalog/providers/typesafe-qualify-map.js";

export function register(harness: Harness): void {
  harness.check("jev-active-routing-qualification: stamps + AC map + hard bans + NO_571 cleared", () => {
    assert(JEV_ROUTING_ISSUE === "#571" && SERVICE_ISSUE === "#571" && JEV_ROUTING_RECIPE_ISSUE === "#571", "issue");
    assert(JEV_ROUTING_EPIC === "#511" && SERVICE_EPIC === "#511" && JEV_ROUTING_RECIPE_EPIC === "#511", "epic");
    assert(JEV_ROUTING_STAMP === "0.221.51" && SERVICE_STAMP === "0.221.51" && JEV_ROUTING_RECIPE_STAMP === "0.221.51", "stamp");
    assert(JEV_ROUTING_NO_571_IMPL === false && SERVICE_NO_571 === false && JEV_ROUTING_RECIPE_NO_571_IMPL === false, "NO_571");
    assert(JEV_ROUTING_NEXT_AFTER_CLOSE === "#573" && SERVICE_NEXT === "#573" && JEV_ROUTING_RECIPE_NEXT_AFTER_CLOSE === "#573", "next");
    assert(JEV_ROUTING_NO_573_IMPL && SERVICE_NO_573 && JEV_ROUTING_RECIPE_NO_573_IMPL, "no #573");
    assert(JEV_ROUTING_NO_511_AUTOCLOSE && SERVICE_NO_511 && JEV_ROUTING_RECIPE_NO_511_AUTOCLOSE, "no autoclose");
    assert(JEV_ROUTING_NO_524_REWRITE && SERVICE_NO_524 && JEV_ROUTING_RECIPE_NO_524_REWRITE, "no #524");
    assert(JEV_ROUTING_NO_NETWORK && SERVICE_NO_NET && JEV_ROUTING_RECIPE_NO_NETWORK, "no network");
    assert(JEV_ROUTING_LIVE_NOT_PERFORMED && SERVICE_LIVE && JEV_ROUTING_RECIPE_LIVE_NOT_PERFORMED, "live");
    assert(JEV_ROUTING_NO_DUPLICATE_RUNTIME && SERVICE_NO_DUP && JEV_ROUTING_RECIPE_NO_DUPLICATE_RUNTIME, "no dup");
    assert(JEV_ROUTING_NO_JEV_IN_BUSINESS_POLICY && SERVICE_NO_BIZ && JEV_ROUTING_RECIPE_NO_JEV_IN_BUSINESS_POLICY, "no biz");
    assert(JEV_ROUTING_PROVIDER_IS_SWAPPABLE && SERVICE_SWAP && JEV_ROUTING_RECIPE_PROVIDER_IS_SWAPPABLE, "swappable");
    assert(JEV_ROUTING_NO_DETERMINISTIC_THROUGH_MODEL && SERVICE_NO_DET && JEV_ROUTING_RECIPE_NO_DETERMINISTIC_THROUGH_MODEL, "no det");
    assert(JEV_ROUTING_NO_FRONTIER_REINTERPRET_WRAPPER && SERVICE_NO_FRONTIER && JEV_ROUTING_RECIPE_NO_FRONTIER_REINTERPRET_WRAPPER, "no frontier");
    assert(JEV_ROUTING_CONFIDENCE_IS_NOT_CALIBRATION && SERVICE_CONFIDENCE && JEV_ROUTING_RECIPE_CONFIDENCE_IS_NOT_CALIBRATION, "confidence");
    assert(JEV_ROUTING_STRICT_SHAPE_IS_NOT_TRUTH && SERVICE_SHAPE && JEV_ROUTING_RECIPE_STRICT_SHAPE_IS_NOT_TRUTH, "shape");
    assert(JEV_ROUTING_MARKETING_IS_NOT_PROOF && JEV_ROUTING_RECIPE_MARKETING_IS_NOT_PROOF, "marketing");
    assert(JEV_ROUTING_SOURCE_PRESENCE_IS_NOT_LIVE_QUALIFICATION && JEV_ROUTING_RECIPE_SOURCE_PRESENCE_IS_NOT_LIVE_QUALIFICATION, "source");
    assert(JEV_ROUTING_GATEWAY_EQUIVALENCE_NOT_ASSUMED && JEV_ROUTING_RECIPE_GATEWAY_EQUIVALENCE_NOT_ASSUMED, "gateway");
    assert(JSON.stringify([...JEV_ROUTING_CONSUMES]) === JSON.stringify(["#513", "#514", "#515", "#518", "#523", "#524"]), "consumes");
    assert(JSON.stringify([...SERVICE_CONSUMES]) === JSON.stringify([...JEV_ROUTING_RECIPE_CONSUMES]), "consumes align");
    assert(JEV_ROUTING_AC.length === 10 && jevRoutingAcEvidence().every((row) => row.covered), "AC");
    assert(JEV_ROUTING_BASE_MAIN_SHA.length === 40, "base sha");
    assert(JEV_ROUTING_HOSTED_KEY_OWNER.length > 0, "key owner");
    assert(JEV_ROUTING_ACTIVE_LOOP_ISSUE === "#573" && JEV_ROUTING_ARCHITECTURE_DOC_ISSUE === "#574", "related");
    assert(JEV_ROUTING_PROFILE_CONSUMER_ISSUES.length >= 1, "profile issues");
    assert(JEV_TUPLE_DIMENSIONS.length === 4, "tuple");
    assert(JEV_DECISION_FAMILIES.length >= 5, "families");
    assert(DETERMINISTIC_ONLY_OPERATIONS.length === 5, "det ops");
    assert(ROUTING_OUTCOMES.includes("no_match"), "no_match");
    assert(ROUTABLE_BUILD_ACTIONS.length >= 6, "actions");
    assert(JEV_EVIDENCE_CLASSES.includes("official-public-docs") && JEV_EVIDENCE_CLASSES.includes("fake-wiring"), "evidence");
    assert(CONFORMANCE_FAILURE_CLASSES.length >= 4, "failures");
    assert(ROUTING_CASE_KINDS.includes("true_no_match") && ROUTING_CASE_KINDS.includes("confidently_wrong"), "kinds");
    assert(PASSIVE_READ_SURFACES.length === 5, "passive");
    assert(JEV_FANOUT_LIMITS.maxConcurrency >= 1 && JEV_FANOUT_LIMITS.deadlineMs > 0, "fanout");
    assert(JEV_ROUTING_QUALIFICATION_LIMITATIONS.length >= 5, "limitations");
    assert(JEV_ROUTING_QUALIFICATION_POLICY.admittedForExecution.length === 0, "none admitted");
    assert(JEV_ROUTING_OWNER_MODULES.length >= 6, "owners");
    const indexSource = readFileSync(path.join(skillRoot, "catalog/workflows/index.ts"), "utf8");
    assert(!jevRoutingTouchesDefaultIndex(indexSource), "no default index");
    assert(namesProviderAsBusinessPolicy("jev decides the roadmap"), "provider-as-policy");
    assert(redefinesEvidenceGapRanking("export function rankEligibleWork() {}"), "rewrite");
  });

  harness.check("jev-active-routing-qualification: AC1 provider-neutral selection + documented tuple", () => {
    const tuple = describeJevSupportedTuple();
    assert(tuple.modelAlias === TYPESAFE_MODEL_DEFAULT, "model");
    assert(tuple.resolvedModelId === null && tuple.aliasPinConfirmed === false, "pin");
    assert(tuple.endpointUrl.startsWith(TYPESAFE_API_BASE_DEFAULT), "endpoint");
    assert(tuple.npmSdkVersion === TYPESAFE_NPM_SDK_VERSION && tuple.pythonSdkVersion === TYPESAFE_PYTHON_SDK_VERSION, "sdks");
    assert(tuple.adapterRevision === TYPESAFE_ADAPTER_STAMP, "adapter");
    assert(tuple.providerId === TYPESAFE_ADAPTER_PROVIDER_ID && tuple.bindingId === TYPESAFE_ADAPTER_BINDING_ID, "ids");
    assert(tuple.evidenceClass === "official-public-docs" && tuple.liveNotPerformed === true, "evidence");
    assert(tuplesAreEquivalent(tuple, describeJevSupportedTuple()), "stable");
    const states = [
      selectJevBinding({ selected: false, configured: false, available: false }),
      selectJevBinding({ selected: true, configured: false, available: true }),
      selectJevBinding({ selected: true, configured: true, available: false }),
      selectJevBinding({ selected: true, configured: true, available: true }),
    ];
    assert(states.map((s) => s.availability).join(",") === "unselected,unconfigured,unavailable,ready", "states");
    assert(states[3]!.mayDispatch && states.slice(0, 3).every((s) => !s.mayDispatch), "dispatch");
    assert(states[3]!.autoSelectForbidden && states[3]!.selectionIsHostExplicit, "host");
    assert(
      states[3]!.reusedOwnerModules.some((m) => m.includes("typesafe")),
      "reuses",
    );
    for (const op of deterministicOnlyOperations()) {
      assert(!guardDeterministicOperation(op).routableThroughModel, op);
    }
    assert(guardDeterministicOperation("next-useful-action").routableThroughModel, "judgement");
    assert(receiptBindingId().length > 0, "receipt");
  });

  harness.check("jev-active-routing-qualification: AC2 official-source ≠ fake wiring", () => {
    assert(
      JEV_OFFICIAL_CONFORMANCE_CASES.every((c) => c.evidenceClass === "official-public-docs"),
      "official",
    );
    assert(
      JEV_FAKE_WIRING_CONFORMANCE_CASES.every((c) => c.evidenceClass === "fake-wiring"),
      "fake",
    );
    assert(TYPESAFE_OFFICIAL_DOC_FIXTURES.choiceResponse !== undefined, "fixture");
    const summary = summarizeConformance();
    assert(summary.evidenceClassesSeparate === true, "separate");
    assert(summary.officialSourceDecoded >= 2 && summary.fakeWiringDecoded >= 1, "decoded");
    assert(summary.liveProviderProofPresent === false, "no live");
    assert(summary.allExpectationsMatched === true, "expectations");
  });

  harness.check("jev-active-routing-qualification: AC3 fail classes clear", () => {
    const results = JEV_CONFORMANCE_FAILURE_CASES.map(runConformanceCase);
    for (const result of results) {
      assert(result.decoded === false && result.failureClass !== null && result.matchedExpectation === true, result.caseId);
    }
    const classes = new Set(results.map((r) => r.failureClass));
    for (const needed of ["malformed", "missing", "duplicate", "unsupported"] as const) {
      assert(classes.has(needed), needed);
    }
  });

  harness.check("jev-active-routing-qualification: AC4 frozen routing eval", () => {
    assert(JEV_FROZEN_ROUTING_CORPUS.length >= 8, "size");
    assert(corpusContainsInjectedInstruction(), "injection");
    assert(frozenRoutingCorpusDigest() === frozenRoutingCorpusDigest(), "digest");
    const report = evaluateFrozenRoutingCorpus();
    assert(report.frozenBeforeTuning === true, "frozen");
    assert(report.trueNoMatch >= 1 && report.candidateOmissions >= 1 && report.confidentlyWrong >= 1, "kinds");
    assert(report.injectionsBlocked >= 1 && report.familiesCovered.length >= 4, "coverage");
    assert(report.latencyMeasured === false, "latency");
    assert(/no /i.test(report.accuracyClaim), "accuracy");
  });

  harness.check("jev-active-routing-qualification: AC5 async fanout", async () => {
    const fan = await runSeededJevFanout();
    assert(fan.admitted && !fan.synchronousBarrierOnly, "async");
    assert(fan.peakConcurrency <= fan.concurrencyLimit && fan.peakConcurrency >= 1, "concurrency");
    assert(fan.outcomesComplete && fan.ownershipReleased, "complete");
    assert(fan.recovered.length >= 1, "recovered");
    const cancelled = await runSeededJevFanoutCancelled();
    assert(cancelled.cancelled && cancelled.ownershipReleased && cancelled.outcomesComplete, "cancel");
    const deadline = await runSeededJevFanoutDeadline();
    assert(deadline.ownershipReleased && deadline.deadlineExceeded, "deadline");
    const over = await runSeededJevFanoutOverCap();
    assert(!over.admitted && over.dispatched === 0, "cap");
  });

  harness.check("jev-active-routing-qualification: AC6 #573 handoff", () => {
    assert(JEV_573_HANDOFF_SURFACE.consumableBy === "#573", "consumable");
    assert(JEV_573_HANDOFF_SURFACE.implementsActiveLoop === false, "no loop");
    assert(JEV_573_HANDOFF_SURFACE.requiresFrontierAgentReinterpretation === false, "no frontier");
    const batch = seededQualifiedDecisions();
    assert(batch.consumableBy === "#573" && batch.producedBy === "#571", "ids");
    assert(batch.decisions.length >= 1 && batch.actionableDecisions.length >= 1, "decisions");
    assert(
      batch.decisions.every((d) => !d.frontierAgentReinterpretationRequired && !handoffRequiresFrontierReinterpretation(d)),
      "no reinterpret",
    );
    assert(
      batch.decisions.every((d) => d.freshnessRecheckRequired && d.authorityRecheckRequired),
      "recheck",
    );
    assert(
      batch.actionableDecisions.every((d) => d.nextBuildAction !== null && (ROUTABLE_BUILD_ACTIONS as readonly string[]).includes(d.nextBuildAction!)),
      "vocab",
    );
    assert(
      batch.decisions.every((d) => d.inferenceReceiptId && d.policyReceiptId && d.confidenceIsCalibrated === false),
      "receipts",
    );
  });

  harness.check("jev-active-routing-qualification: AC7 profile consumer", () => {
    const pending = productProfileValidationConsumer({ readiness: "pending-contract" });
    assert(pending.readiness === "pending-contract", "pending");
    assert(pending.isSoleDefinitionOfSupport === false && pending.blocksRoutingProof === false, "not sole");
    assert(pending.otherQualifiedFamilies.length >= 1, "others");
    assert(pending.consumerId === JEV_PROFILE_CONSUMER_ID, "id");
    const decision = seededProfileAssessmentDecision();
    const ready = productProfileValidationConsumer({
      readiness: "ready",
      profileContractVersion: "profile.contract.v-test",
      decision,
      receiptId: decision.inferenceReceiptId,
    });
    assert(ready.readiness === "ready" && ready.isSoleDefinitionOfSupport === false, "ready");
  });

  harness.check("jev-active-routing-qualification: AC8 passive + receipts", () => {
    for (const surface of PASSIVE_READ_SURFACES) {
      const read = readJevQualificationPassively(surface);
      assert(read.inferenceRequests === 0 && read.providerCalls === 0, surface);
      assert(read.runStateMutations === 0 && read.backgroundPollersStarted === 0, surface + " side");
    }
    const decision = seededQualifiedDecisions().decisions[0]!;
    const kase = JEV_FROZEN_ROUTING_CORPUS[0]!;
    const policy = applyRoutingPolicy(kase);
    const receipts = buildRoutingReceipts({
      kase,
      decision: policy,
      recordedAt: "2026-09-20T08:00:00.000Z",
      sourceRevisions: decision.sourceRevisions,
    });
    assert(receipts.inference.receiptId.length > 0 && receipts.policy.receiptId.length > 0, "receipts");
  });

  harness.check("jev-active-routing-qualification: AC9 authority + invalidation", () => {
    const auth = jevAuthorityInvariants();
    assert(auth.releaseAuthorityOwner.includes("release"), "release");
    assert(auth.acceptanceAuthorityOwner.includes("acceptance"), "acceptance");
    assert(auth.independentReviewRequired && auth.sourceProofInvalidationHonored, "review");
    assert(!auth.jevMayGrantAuthority && !auth.jevIsSourceOfProductTruth && !auth.cacheHitIsAGrant, "limits");
    assert(auth.admittedFamilies.length === 0, "none");
    const decision = seededQualifiedDecisions().decisions[0]!;
    const current = Object.fromEntries(decision.sourceRevisions.map((s) => [s.sourceId, s.revision]));
    assert(invalidateOnSourceChange(decision, current).stillUsable === true, "fresh");
    const stale = Object.fromEntries(decision.sourceRevisions.map((s) => [s.sourceId, `${s.revision}.moved`]));
    const invalidated = invalidateOnSourceChange(decision, stale);
    assert(invalidated.stillUsable === false && invalidated.staleSourceIds.length >= 1, "stale");
    const promo = evaluateFamilyPromotion({
      family: JEV_DECISION_FAMILIES[0]!,
      to: "admitted-execution",
      freeze: paperAdmissionFreeze(),
      independentReviewPresent: false,
      benefitProven: false,
    });
    assert(promo.allowed === false, "blocked");
  });

  harness.check("jev-active-routing-qualification: AC10 docs match proof", () => {
    const docPath = path.join(skillRoot, JEV_ROUTING_DOC);
    assert(existsSync(docPath), "doc");
    const doc = readFileSync(docPath, "utf8");
    assert(doc.includes("#571") && doc.includes("0.221.51"), "cites");
    assert(/live not performed|paper|synthetic|no live/i.test(doc), "honest");
    assert(doc.includes("#573") && doc.includes("#511"), "related");
    assert(!/guarantees?\s+\d+%|universal speedup/i.test(doc), "no overclaim");
    const statements = jevSupportStatements();
    assert(
      statements.some((s) => s.proven),
      "proven",
    );
    assert(
      statements.some((s) => !s.proven && /live/i.test(s.statement)),
      "live unproven",
    );
    assert(
      statements.some((s) => !s.proven && /promoted|shadow/i.test(s.statement)),
      "promo unproven",
    );
  });
}
