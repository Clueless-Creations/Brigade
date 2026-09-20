/**
 * #528 SQ-16 — Transferable product mechanisms / semantic question evaluation
 * fixtures (paper; synthetic; no-network).
 *
 * Proves all five Acceptance criteria + tip stamps / hard bans / NO_528 cleared.
 * Import identifiers are locked to live exports.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { assert, skillRoot, type Harness } from "./_harness.js";
import {
  TRANSFERABLE_MECHANISMS_OWNER_MODULES,
  TRANSFERABLE_MECHANISMS_RECIPE_CONSUMES,
  TRANSFERABLE_MECHANISMS_RECIPE_COORDINATES,
  TRANSFERABLE_MECHANISMS_RECIPE_EPIC,
  TRANSFERABLE_MECHANISMS_RECIPE_ISSUE,
  TRANSFERABLE_MECHANISMS_RECIPE_NEXT_AFTER_CLOSE,
  TRANSFERABLE_MECHANISMS_RECIPE_NO_528_IMPL,
  TRANSFERABLE_MECHANISMS_RECIPE_NO_AUTONOMOUS_POLICY_MUTATION,
  TRANSFERABLE_MECHANISMS_RECIPE_NO_CROSS_WORKSPACE_CUSTOMER_POOL,
  TRANSFERABLE_MECHANISMS_RECIPE_NO_DEFAULT_REWRITE,
  TRANSFERABLE_MECHANISMS_RECIPE_NO_NETWORK,
  TRANSFERABLE_MECHANISMS_RECIPE_NO_NEW_EXPERIMENT_OWNER,
  TRANSFERABLE_MECHANISMS_RECIPE_ANALOGY_IS_NOT_IDENTITY,
  TRANSFERABLE_MECHANISMS_RECIPE_ASSOCIATION_IS_NOT_CAUSAL,
  TRANSFERABLE_MECHANISMS_RECIPE_SESSIONS_ARE_NOT_PRODUCTS,
  TRANSFERABLE_MECHANISMS_RECIPE_PLANNING_ID,
  TRANSFERABLE_MECHANISMS_RECIPE_POLICY,
  TRANSFERABLE_MECHANISMS_RECIPE_STAMP,
  transferableMechanismsTouchesDefaultIndex,
} from "../../../catalog/workflows/transferable-mechanisms-question-eval.js";
import {
  TRANSFERABLE_MECHANISMS_AC,
  TRANSFERABLE_MECHANISMS_BASE_MAIN_SHA,
  TRANSFERABLE_MECHANISMS_CONSUMES,
  TRANSFERABLE_MECHANISMS_COORDINATES,
  TRANSFERABLE_MECHANISMS_EPIC,
  TRANSFERABLE_MECHANISMS_FIXTURE,
  TRANSFERABLE_MECHANISMS_HOSTED_KEY_OWNER,
  TRANSFERABLE_MECHANISMS_ISSUE,
  TRANSFERABLE_MECHANISMS_LIVE_NOT_PERFORMED,
  TRANSFERABLE_MECHANISMS_MAP_PATH,
  TRANSFERABLE_MECHANISMS_NEXT_AFTER_CLOSE,
  TRANSFERABLE_MECHANISMS_NO_528_IMPL,
  TRANSFERABLE_MECHANISMS_NO_AUTONOMOUS_POLICY_MUTATION,
  TRANSFERABLE_MECHANISMS_NO_CAUSAL_GROWTH_PROMISES,
  TRANSFERABLE_MECHANISMS_NO_CROSS_WORKSPACE_CUSTOMER_POOL,
  TRANSFERABLE_MECHANISMS_NO_NETWORK,
  TRANSFERABLE_MECHANISMS_NO_NEW_EXPERIMENT_ASSIGNMENT,
  TRANSFERABLE_MECHANISMS_NO_NEW_EXPERIMENT_OWNER,
  TRANSFERABLE_MECHANISMS_NO_PORTFOLIO_RANK_FROM_INCOMPARABLE,
  TRANSFERABLE_MECHANISMS_NO_SHARED_VISUAL_TEMPLATE,
  TRANSFERABLE_MECHANISMS_NO_AUTO_REWRITE_MEASUREMENT_POLICY,
  TRANSFERABLE_MECHANISMS_ANALOGY_IS_NOT_IDENTITY,
  TRANSFERABLE_MECHANISMS_ASSOCIATION_IS_NOT_CAUSAL,
  TRANSFERABLE_MECHANISMS_SESSIONS_ARE_NOT_PRODUCTS,
  TRANSFERABLE_MECHANISMS_PLANNING_ID,
  TRANSFERABLE_MECHANISMS_STAMP,
  transferableMechanismsAcEvidence,
} from "../../../catalog/providers/transferable-mechanisms-question-eval-map.js";
import {
  TRANSFERABLE_MECHANISMS_CONSUMES as SERVICE_CONSUMES,
  TRANSFERABLE_MECHANISMS_COORDINATES as SERVICE_COORDINATES,
  TRANSFERABLE_MECHANISMS_EPIC as SERVICE_EPIC,
  TRANSFERABLE_MECHANISMS_ISSUE as SERVICE_ISSUE,
  TRANSFERABLE_MECHANISMS_NEXT_AFTER_CLOSE as SERVICE_NEXT_AFTER,
  TRANSFERABLE_MECHANISMS_NO_528_IMPL as SERVICE_NO_528,
  TRANSFERABLE_MECHANISMS_NO_NETWORK as SERVICE_NO_NETWORK,
  TRANSFERABLE_MECHANISMS_NO_AUTONOMOUS_POLICY_MUTATION as SERVICE_NO_POLICY,
  TRANSFERABLE_MECHANISMS_ANALOGY_IS_NOT_IDENTITY as SERVICE_ANALOGY,
  TRANSFERABLE_MECHANISMS_ASSOCIATION_IS_NOT_CAUSAL as SERVICE_ASSOC,
  TRANSFERABLE_MECHANISMS_SESSIONS_ARE_NOT_PRODUCTS as SERVICE_SESSIONS,
  TRANSFERABLE_MECHANISMS_SEEDED_FIXTURE,
  TRANSFERABLE_MECHANISMS_STAMP as SERVICE_STAMP,
  assessSeededTransferableMechanismsFixture,
  assertAuthorityBoundary,
  censusProductExamples,
  gateComparativeClaim,
  gateFeatureAtExposure,
  assessTransfer,
  promoteCandidateQuestion,
  runTransferableMechanismsEval,
} from "../../../kernel/services/transferable-mechanisms-question-eval.js";

export function register(harness: Harness): void {
  harness.check("transferable-mechanisms-question-eval: stamp/issue/consumes + AC map + hard bans + NO_528 cleared", () => {
    assert(TRANSFERABLE_MECHANISMS_ISSUE === "#528", "map issue");
    assert(SERVICE_ISSUE === "#528", "service issue");
    assert(TRANSFERABLE_MECHANISMS_RECIPE_ISSUE === "#528", "recipe issue");
    assert(TRANSFERABLE_MECHANISMS_EPIC === "#511" && SERVICE_EPIC === "#511" && TRANSFERABLE_MECHANISMS_RECIPE_EPIC === "#511", "epic");
    assert(TRANSFERABLE_MECHANISMS_PLANNING_ID === "SQ-16" && TRANSFERABLE_MECHANISMS_RECIPE_PLANNING_ID === "SQ-16", "planning id");
    assert(TRANSFERABLE_MECHANISMS_STAMP === "0.221.49" && SERVICE_STAMP === "0.221.49" && TRANSFERABLE_MECHANISMS_RECIPE_STAMP === "0.221.49", "stamp");
    assert(TRANSFERABLE_MECHANISMS_NO_528_IMPL === false && SERVICE_NO_528 === false && TRANSFERABLE_MECHANISMS_RECIPE_NO_528_IMPL === false, "NO_528 cleared");
    assert(
      TRANSFERABLE_MECHANISMS_NEXT_AFTER_CLOSE === "#511" && SERVICE_NEXT_AFTER === "#511" && TRANSFERABLE_MECHANISMS_RECIPE_NEXT_AFTER_CLOSE === "#511",
      "NEXT_AFTER=#511",
    );
    assert(JSON.stringify([...TRANSFERABLE_MECHANISMS_CONSUMES]) === JSON.stringify(["#514", "#519", "#521", "#520", "#522", "#523"]), "map consumes");
    assert(JSON.stringify([...SERVICE_CONSUMES]) === JSON.stringify(["#514", "#519", "#521", "#520", "#522", "#523"]), "service consumes");
    assert(
      JSON.stringify([...TRANSFERABLE_MECHANISMS_RECIPE_CONSUMES]) === JSON.stringify(["#514", "#519", "#521", "#520", "#522", "#523"]),
      "recipe consumes",
    );
    assert(JSON.stringify([...TRANSFERABLE_MECHANISMS_COORDINATES]) === JSON.stringify(["#75", "#74"]), "map coordinates");
    assert(JSON.stringify([...SERVICE_COORDINATES]) === JSON.stringify(["#75", "#74"]), "service coordinates");
    assert(JSON.stringify([...TRANSFERABLE_MECHANISMS_RECIPE_COORDINATES]) === JSON.stringify(["#75", "#74"]), "recipe coordinates");
    assert(TRANSFERABLE_MECHANISMS_NO_NETWORK && SERVICE_NO_NETWORK && TRANSFERABLE_MECHANISMS_RECIPE_NO_NETWORK, "no network");
    assert(TRANSFERABLE_MECHANISMS_NO_CROSS_WORKSPACE_CUSTOMER_POOL && TRANSFERABLE_MECHANISMS_RECIPE_NO_CROSS_WORKSPACE_CUSTOMER_POOL, "no customer pool");
    assert(TRANSFERABLE_MECHANISMS_NO_NEW_EXPERIMENT_OWNER && TRANSFERABLE_MECHANISMS_RECIPE_NO_NEW_EXPERIMENT_OWNER, "no new experiment owner");
    assert(
      TRANSFERABLE_MECHANISMS_NO_AUTONOMOUS_POLICY_MUTATION && SERVICE_NO_POLICY && TRANSFERABLE_MECHANISMS_RECIPE_NO_AUTONOMOUS_POLICY_MUTATION,
      "no policy mutation",
    );
    assert(TRANSFERABLE_MECHANISMS_NO_CAUSAL_GROWTH_PROMISES, "no causal growth promises");
    assert(TRANSFERABLE_MECHANISMS_NO_PORTFOLIO_RANK_FROM_INCOMPARABLE, "no portfolio from incomparable");
    assert(TRANSFERABLE_MECHANISMS_NO_SHARED_VISUAL_TEMPLATE, "no shared visual template");
    assert(TRANSFERABLE_MECHANISMS_NO_NEW_EXPERIMENT_ASSIGNMENT, "no new experiment assignment");
    assert(TRANSFERABLE_MECHANISMS_NO_AUTO_REWRITE_MEASUREMENT_POLICY, "no auto rewrite measurement/policy");
    assert(TRANSFERABLE_MECHANISMS_ANALOGY_IS_NOT_IDENTITY && SERVICE_ANALOGY && TRANSFERABLE_MECHANISMS_RECIPE_ANALOGY_IS_NOT_IDENTITY, "analogy ≠ identity");
    assert(
      TRANSFERABLE_MECHANISMS_ASSOCIATION_IS_NOT_CAUSAL && SERVICE_ASSOC && TRANSFERABLE_MECHANISMS_RECIPE_ASSOCIATION_IS_NOT_CAUSAL,
      "association ≠ causal",
    );
    assert(
      TRANSFERABLE_MECHANISMS_SESSIONS_ARE_NOT_PRODUCTS && SERVICE_SESSIONS && TRANSFERABLE_MECHANISMS_RECIPE_SESSIONS_ARE_NOT_PRODUCTS,
      "sessions ≠ products",
    );
    assert(TRANSFERABLE_MECHANISMS_LIVE_NOT_PERFORMED, "live not performed");
    assert(TRANSFERABLE_MECHANISMS_HOSTED_KEY_OWNER.includes("Eduardo"), "key owner");
    assert(TRANSFERABLE_MECHANISMS_BASE_MAIN_SHA === "f9e46b6c4a78af62a79ad17af66d5514a94071c0", "base sha");
    assert(TRANSFERABLE_MECHANISMS_AC.length === 5 && transferableMechanismsAcEvidence().every((row) => row.covered), "AC covered");
    assert(TRANSFERABLE_MECHANISMS_MAP_PATH.includes("transferable-mechanisms-question-eval-map"), "map path");
    assert(TRANSFERABLE_MECHANISMS_FIXTURE.includes("transferable-mechanisms-question-eval.fixtures"), "fixture path");
    assert(TRANSFERABLE_MECHANISMS_RECIPE_POLICY.analogyIsIdentity === false, "policy analogy");
    assert(TRANSFERABLE_MECHANISMS_RECIPE_POLICY.associationIsCausal === false, "policy association");
    assert(TRANSFERABLE_MECHANISMS_RECIPE_POLICY.sessionsEqualIndependentProducts === false, "policy sessions");
    assert(TRANSFERABLE_MECHANISMS_RECIPE_POLICY.postmortemFeaturesAllowed === false, "policy postmortem");
    assert(TRANSFERABLE_MECHANISMS_RECIPE_POLICY.proposingModelCreatesSuccessLabels === false, "policy success labels");
    assert(TRANSFERABLE_MECHANISMS_RECIPE_POLICY.proposingModelUpdatesActivePolicy === false, "policy active policy");
    assert(TRANSFERABLE_MECHANISMS_RECIPE_POLICY.candidateActiveUntilReviewed === false, "policy candidate inactive");
    assert(TRANSFERABLE_MECHANISMS_RECIPE_POLICY.privatePayloadCrossesWorkspaceImplicitly === false, "policy private payload");
    assert(TRANSFERABLE_MECHANISMS_RECIPE_NO_DEFAULT_REWRITE, "no default rewrite");
    assert(TRANSFERABLE_MECHANISMS_OWNER_MODULES.includes("kernel/operating-model/measurement.ts"), "measurement owner");
    assert(TRANSFERABLE_MECHANISMS_OWNER_MODULES.includes("contracts/semantic/question-pack.ts"), "question-pack owner");
    const indexSource = readFileSync(path.join(skillRoot, "catalog/workflows/index.ts"), "utf8");
    assert(!transferableMechanismsTouchesDefaultIndex(indexSource), "must not touch default workflows index");
  });

  harness.check("transferable-mechanisms-question-eval: AC1 postmortem feature rejected as leakage", () => {
    const seeded = TRANSFERABLE_MECHANISMS_SEEDED_FIXTURE;
    const postmortem = seeded.features.find((f) => f.featureId === "feat.postmortem-winner-label");
    assert(postmortem !== undefined, "postmortem feature present");
    const gate = gateFeatureAtExposure(postmortem!);
    assert(gate.accepted === false, "postmortem feature rejected");
    assert(gate.leakage === true, "marked as leakage");
    assert(/postmortem/i.test(gate.reason), "reason names postmortem");
    const exposure = gateFeatureAtExposure(seeded.features.find((f) => f.featureId === "feat.exposure-checklist-copy")!);
    assert(exposure.accepted === true && exposure.leakage === false, "exposure-time feature accepted");
  });

  harness.check("transferable-mechanisms-question-eval: AC2 sessions from one product ≠ independent products", () => {
    const census = censusProductExamples(TRANSFERABLE_MECHANISMS_SEEDED_FIXTURE.sessionCensus);
    assert(census.sessionCount === 5000, "five thousand sessions");
    assert(census.independentProductExampleCount === 1, "one independent product example");
    assert(census.sessionsPresentedAsIndependentProducts === false, "not presented as N products");
    assert(!census.note.includes("5000 independent"), "note must not claim 5000 independent products");
    assert(/1 independent product example/i.test(census.note), "note clarifies collapse to one");
  });

  harness.check("transferable-mechanisms-question-eval: AC3 incompatible analogy → countercondition not auto-reuse", () => {
    const seeded = TRANSFERABLE_MECHANISMS_SEEDED_FIXTURE;
    const lesson = seeded.lessons[0]!;
    const assessment = assessTransfer(lesson, seeded.transferAttempt.attempt);
    assert(seeded.transferAttempt.attempt.structuralAnalogy === true, "structural analogy present");
    assert(assessment.decision === "countercondition_block", "countercondition block");
    assert(assessment.automaticReuse === false, "no automatic reuse");
    assert(assessment.counterconditions.length > 0, "counterconditions recorded");
    assert(/countercondition|incompatible/i.test(assessment.reason), "reason cites countercondition");
  });

  harness.check("transferable-mechanisms-question-eval: AC4 incompatible metrics / unknown attribution block claims", () => {
    const claim = gateComparativeClaim(TRANSFERABLE_MECHANISMS_SEEDED_FIXTURE.comparativeIncompatible);
    assert(claim.allowed === false, "comparative claim blocked");
    assert(claim.reasonCodes.includes("attribution_unknown"), "unknown attribution");
    assert(
      claim.reasonCodes.includes("metric_version_mismatch") ||
        claim.reasonCodes.includes("units_mismatch") ||
        claim.reasonCodes.includes("incomparable") ||
        claim.reasonCodes.includes("cohort_mismatch") ||
        claim.reasonCodes.includes("population_incompatible"),
      `incompatible metrics signaled: ${claim.reasonCodes.join(",")}`,
    );
    assert(/block comparative claims/i.test(claim.reason), "reason blocks comparative claims");
  });

  harness.check("transferable-mechanisms-question-eval: AC5 candidate inactive until reviewed into pinned composition", () => {
    const seeded = TRANSFERABLE_MECHANISMS_SEEDED_FIXTURE;
    const featureGates = seeded.features.map(gateFeatureAtExposure);
    const inactive = promoteCandidateQuestion({
      question: seeded.questionUsefulInactive.question,
      featureGates,
      reviewed: false,
      includeInPinnedComposition: false,
      pinnedCompositionId: null,
      contributionResourceId: null,
      contributionVersion: null,
      targetWorkspaceId: "ws.paper.528",
    });
    assert(seeded.questionUsefulInactive.question.usefulHeuristic === true, "candidate is useful");
    assert(inactive.status === "proposed_inactive", "inactive until reviewed");
    assert(inactive.includedInPinnedComposition === false, "not in pinned composition");
    assert(inactive.proposingModelCreatedSuccessLabel === false, "no self success label");
    assert(inactive.proposingModelUpdatedActivePolicy === false, "no policy update");
    const active = promoteCandidateQuestion({
      question: seeded.questionReviewedPinned.question,
      featureGates,
      reviewed: true,
      includeInPinnedComposition: true,
      pinnedCompositionId: "pin.composition.528.v1",
      contributionResourceId: "contrib.question.checklist",
      contributionVersion: 1,
      targetWorkspaceId: "ws.paper.528",
    });
    assert(active.status === "reviewed_active_in_pinned", "active only after review + pin");
    assert(active.includedInPinnedComposition === true, "explicitly included in pinned composition");
    assert(active.pinnedCompositionId === "pin.composition.528.v1", "pin id retained");
    let crossBlocked = false;
    try {
      promoteCandidateQuestion({
        question: { ...seeded.questionUsefulInactive.question, privatePayload: true, workspaceId: "ws.private.a" },
        featureGates,
        reviewed: true,
        includeInPinnedComposition: true,
        pinnedCompositionId: "pin.x",
        contributionResourceId: "contrib.x",
        contributionVersion: 1,
        targetWorkspaceId: "ws.private.b",
      });
    } catch (err) {
      crossBlocked = err instanceof Error && /private payload/i.test(err.message);
    }
    assert(crossBlocked, "private payload cannot cross workspace implicitly");
  });

  harness.check("transferable-mechanisms-question-eval: seeded e2e + authority + association-only eval", () => {
    const result = assessSeededTransferableMechanismsFixture();
    assert(result.networkCalls === 0, "no network");
    assert(result.evalProtocol.claimKind === "association", "association not causal");
    assert(result.evalProtocol.holdout && result.evalProtocol.baseline && result.evalProtocol.ablation, "eval protocol");
    assert(result.evalProtocol.smallNGuard && result.evalProtocol.multipleTestingGuard, "small-n / multi-test");
    assert(result.authority.autonomousPolicyMutation === false, "authority no policy mutation");
    assert(result.authority.newExperimentOwner === false, "authority no new experiment owner");
    assert(
      result.featureGates.some((g) => g.leakage),
      "leakage gate present",
    );
    assert(result.census[0]!.independentProductExampleCount === 1, "census collapse");
    assert(result.transfers[0]!.decision === "countercondition_block", "transfer blocked");
    assert(result.comparativeClaims[0]!.allowed === false, "comparative blocked");
    assert(result.promotions[0]!.status === "proposed_inactive", "promotion inactive");
    const authority = assertAuthorityBoundary();
    assert(authority.causalGrowthPromise === false && authority.sharedVisualTemplate === false, "hard bans");
    const e2e = runTransferableMechanismsEval({
      lessons: TRANSFERABLE_MECHANISMS_SEEDED_FIXTURE.lessons,
      features: TRANSFERABLE_MECHANISMS_SEEDED_FIXTURE.features,
      transferAttempts: [TRANSFERABLE_MECHANISMS_SEEDED_FIXTURE.transferAttempt],
      comparativeClaims: [TRANSFERABLE_MECHANISMS_SEEDED_FIXTURE.comparativeIncompatible],
      questions: [TRANSFERABLE_MECHANISMS_SEEDED_FIXTURE.questionReviewedPinned],
      sessionCensuses: [TRANSFERABLE_MECHANISMS_SEEDED_FIXTURE.sessionCensus],
    });
    assert(e2e.promotions[0]!.status === "reviewed_active_in_pinned", "reviewed path activates");
  });
}
