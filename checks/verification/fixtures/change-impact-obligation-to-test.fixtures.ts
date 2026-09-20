/**
 * #525 SQ-13 — Semantic change-impact / obligation-to-test fixtures (paper; synthetic; no-network).
 *
 * Proves all five Acceptance criteria + tip stamps / hard bans / TUCK seeded fixture.
 * Import identifiers are locked to the live module exports.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { assert, skillRoot, type Harness } from "./_harness.js";
import {
  CHANGE_IMPACT_OBLIGATION_OWNER_MODULES,
  CHANGE_IMPACT_OBLIGATION_RECIPE_CONSUMES,
  CHANGE_IMPACT_OBLIGATION_RECIPE_COORDINATES,
  CHANGE_IMPACT_OBLIGATION_RECIPE_EPIC,
  CHANGE_IMPACT_OBLIGATION_RECIPE_ISSUE,
  CHANGE_IMPACT_OBLIGATION_RECIPE_NEXT_AFTER_CLOSE,
  CHANGE_IMPACT_OBLIGATION_RECIPE_NO_525_IMPL,
  CHANGE_IMPACT_OBLIGATION_RECIPE_NO_AUTO_ACCEPT_SCOPE,
  CHANGE_IMPACT_OBLIGATION_RECIPE_NO_DEFAULT_REWRITE,
  CHANGE_IMPACT_OBLIGATION_RECIPE_NO_DEVICE_PROOF,
  CHANGE_IMPACT_OBLIGATION_RECIPE_NO_NETWORK,
  CHANGE_IMPACT_OBLIGATION_RECIPE_NO_REPLACE_76,
  CHANGE_IMPACT_OBLIGATION_RECIPE_NO_SECOND_LEDGER,
  CHANGE_IMPACT_OBLIGATION_RECIPE_NO_SEMANTIC_WAIVER,
  CHANGE_IMPACT_OBLIGATION_RECIPE_PLANNING_ID,
  CHANGE_IMPACT_OBLIGATION_RECIPE_POLICY,
  CHANGE_IMPACT_OBLIGATION_RECIPE_STAMP,
  MISSING_SEMANTIC_RELATION,
  MISSING_SEMANTIC_RELATION_GAP,
  RELATION_SUPPORT_STATES,
  changeImpactObligationTouchesDefaultIndex,
} from "../../../catalog/workflows/change-impact-obligation-to-test.js";
import {
  CHANGE_IMPACT_OBLIGATION_AC,
  CHANGE_IMPACT_OBLIGATION_BASE_MAIN_SHA,
  CHANGE_IMPACT_OBLIGATION_CONSUMES,
  CHANGE_IMPACT_OBLIGATION_COORDINATES,
  CHANGE_IMPACT_OBLIGATION_EPIC,
  CHANGE_IMPACT_OBLIGATION_FIXTURE,
  CHANGE_IMPACT_OBLIGATION_HOSTED_KEY_OWNER,
  CHANGE_IMPACT_OBLIGATION_IOS_SIM_OOS,
  CHANGE_IMPACT_OBLIGATION_ISSUE,
  CHANGE_IMPACT_OBLIGATION_LIVE_NOT_PERFORMED,
  CHANGE_IMPACT_OBLIGATION_MAP_PATH,
  CHANGE_IMPACT_OBLIGATION_NEXT_AFTER_CLOSE,
  CHANGE_IMPACT_OBLIGATION_NO_525_IMPL,
  CHANGE_IMPACT_OBLIGATION_NO_AUTO_ACCEPT_SCOPE,
  CHANGE_IMPACT_OBLIGATION_NO_DEVICE_PROOF,
  CHANGE_IMPACT_OBLIGATION_NO_NETWORK,
  CHANGE_IMPACT_OBLIGATION_NO_REPLACE_76,
  CHANGE_IMPACT_OBLIGATION_NO_SECOND_LEDGER,
  CHANGE_IMPACT_OBLIGATION_NO_SEMANTIC_WAIVER,
  CHANGE_IMPACT_OBLIGATION_NO_SYNTHETIC_AS_DEVICE,
  CHANGE_IMPACT_OBLIGATION_PLANNING_ID,
  CHANGE_IMPACT_OBLIGATION_STAMP,
  changeImpactObligationAcEvidence,
} from "../../../catalog/providers/change-impact-obligation-to-test-map.js";
import {
  CHANGE_IMPACT_OBLIGATION_CONSUMES as SERVICE_CONSUMES,
  CHANGE_IMPACT_OBLIGATION_COORDINATES as SERVICE_COORDINATES,
  CHANGE_IMPACT_OBLIGATION_EPIC as SERVICE_EPIC,
  CHANGE_IMPACT_OBLIGATION_ISSUE as SERVICE_ISSUE,
  CHANGE_IMPACT_OBLIGATION_NEXT_AFTER_CLOSE as SERVICE_NEXT_AFTER,
  CHANGE_IMPACT_OBLIGATION_NO_525_IMPL as SERVICE_NO_525,
  CHANGE_IMPACT_OBLIGATION_NO_AUTO_ACCEPT_SCOPE as SERVICE_NO_AUTO,
  CHANGE_IMPACT_OBLIGATION_NO_DEVICE_PROOF as SERVICE_NO_DEVICE,
  CHANGE_IMPACT_OBLIGATION_NO_NETWORK as SERVICE_NO_NETWORK,
  CHANGE_IMPACT_OBLIGATION_NO_REPLACE_76 as SERVICE_NO_REPLACE_76,
  CHANGE_IMPACT_OBLIGATION_NO_SECOND_LEDGER as SERVICE_NO_SECOND,
  CHANGE_IMPACT_OBLIGATION_NO_SEMANTIC_WAIVER as SERVICE_NO_WAIVER,
  CHANGE_IMPACT_OBLIGATION_STAMP as SERVICE_STAMP,
  CascadeIdentityLedger,
  MISSING_SEMANTIC_RELATION as SERVICE_RELATION,
  TUCK_TRIP_EDIT_FIXTURE,
  assessChangeObligationMatrix,
  assessObligationEvidenceMatrix,
  assessTuckTripEditFixture,
  attemptSemanticWaiver,
  evidenceRemainsCurrent,
  explainAssessment,
  proposeTestsForUncovered,
  supportStatesAreDistinct,
  type ObligationEvidence,
  type ProductObligation,
  type ProposedChange,
  type RelationSupportState,
} from "../../../kernel/services/change-impact-obligation-to-test.js";

function change(overrides: Partial<ProposedChange> = {}): ProposedChange {
  return {
    changeId: "chg.product-promise",
    kind: "product_promise_edit",
    description: "Edit that invalidates a product promise",
    sourceIds: ["src.product"],
    revision: "rev-1",
    graphReachableSurfaceIds: ["surface.promise"],
    ...overrides,
  };
}

function obligation(overrides: Partial<ProductObligation> & Pick<ProductObligation, "obligationId">): ProductObligation {
  return {
    promise: "Product promise",
    surfaceId: "surface.promise",
    dependentSurfaceIds: ["surface.dependent"],
    ...overrides,
  };
}

export function register(harness: Harness): void {
  harness.check("change-impact-obligation-to-test: stamp/issue/consumes + AC map + hard bans + NO_525 cleared", () => {
    assert(CHANGE_IMPACT_OBLIGATION_ISSUE === "#525", "map issue");
    assert(SERVICE_ISSUE === "#525", "service issue");
    assert(CHANGE_IMPACT_OBLIGATION_RECIPE_ISSUE === "#525", "recipe issue");
    assert(CHANGE_IMPACT_OBLIGATION_EPIC === "#511" && SERVICE_EPIC === "#511" && CHANGE_IMPACT_OBLIGATION_RECIPE_EPIC === "#511", "epic");
    assert(CHANGE_IMPACT_OBLIGATION_PLANNING_ID === "SQ-13" && CHANGE_IMPACT_OBLIGATION_RECIPE_PLANNING_ID === "SQ-13", "planning id");
    assert(CHANGE_IMPACT_OBLIGATION_STAMP === "0.221.46" && SERVICE_STAMP === "0.221.46" && CHANGE_IMPACT_OBLIGATION_RECIPE_STAMP === "0.221.46", "stamp");
    assert(
      CHANGE_IMPACT_OBLIGATION_NO_525_IMPL === false && SERVICE_NO_525 === false && CHANGE_IMPACT_OBLIGATION_RECIPE_NO_525_IMPL === false,
      "NO_525 cleared",
    );
    assert(
      CHANGE_IMPACT_OBLIGATION_NEXT_AFTER_CLOSE === "#528" && SERVICE_NEXT_AFTER === "#528" && CHANGE_IMPACT_OBLIGATION_RECIPE_NEXT_AFTER_CLOSE === "#528",
      "NEXT_AFTER=#528",
    );
    assert(JSON.stringify([...CHANGE_IMPACT_OBLIGATION_CONSUMES]) === JSON.stringify(["#519", "#521", "#520", "#522", "#523"]), "map consumes");
    assert(JSON.stringify([...SERVICE_CONSUMES]) === JSON.stringify(["#519", "#521", "#520", "#522", "#523"]), "service consumes");
    assert(JSON.stringify([...CHANGE_IMPACT_OBLIGATION_RECIPE_CONSUMES]) === JSON.stringify(["#519", "#521", "#520", "#522", "#523"]), "recipe consumes");
    assert(JSON.stringify([...CHANGE_IMPACT_OBLIGATION_COORDINATES]) === JSON.stringify(["#74", "#76", "#403"]), "map coordinates");
    assert(JSON.stringify([...SERVICE_COORDINATES]) === JSON.stringify(["#74", "#76", "#403"]), "service coordinates");
    assert(JSON.stringify([...CHANGE_IMPACT_OBLIGATION_RECIPE_COORDINATES]) === JSON.stringify(["#74", "#76", "#403"]), "recipe coordinates");
    assert(CHANGE_IMPACT_OBLIGATION_NO_NETWORK && SERVICE_NO_NETWORK && CHANGE_IMPACT_OBLIGATION_RECIPE_NO_NETWORK, "no network");
    assert(CHANGE_IMPACT_OBLIGATION_NO_SECOND_LEDGER && SERVICE_NO_SECOND && CHANGE_IMPACT_OBLIGATION_RECIPE_NO_SECOND_LEDGER, "no second ledger");
    assert(CHANGE_IMPACT_OBLIGATION_NO_REPLACE_76 && SERVICE_NO_REPLACE_76 && CHANGE_IMPACT_OBLIGATION_RECIPE_NO_REPLACE_76, "no replace #76");
    assert(CHANGE_IMPACT_OBLIGATION_NO_SEMANTIC_WAIVER && SERVICE_NO_WAIVER && CHANGE_IMPACT_OBLIGATION_RECIPE_NO_SEMANTIC_WAIVER, "no semantic waiver");
    assert(CHANGE_IMPACT_OBLIGATION_NO_DEVICE_PROOF && SERVICE_NO_DEVICE && CHANGE_IMPACT_OBLIGATION_RECIPE_NO_DEVICE_PROOF, "no device proof");
    assert(CHANGE_IMPACT_OBLIGATION_NO_AUTO_ACCEPT_SCOPE && SERVICE_NO_AUTO && CHANGE_IMPACT_OBLIGATION_RECIPE_NO_AUTO_ACCEPT_SCOPE, "no auto-accept scope");
    assert(CHANGE_IMPACT_OBLIGATION_NO_SYNTHETIC_AS_DEVICE, "no synthetic-as-device");
    assert(CHANGE_IMPACT_OBLIGATION_LIVE_NOT_PERFORMED && CHANGE_IMPACT_OBLIGATION_IOS_SIM_OOS, "live/ios oos");
    assert(CHANGE_IMPACT_OBLIGATION_HOSTED_KEY_OWNER.includes("Eduardo"), "key owner");
    assert(CHANGE_IMPACT_OBLIGATION_BASE_MAIN_SHA === "2a16e48bced0abb0143ae94aea59a4dd9db3966f", "base sha");
    assert(CHANGE_IMPACT_OBLIGATION_AC.length === 5 && changeImpactObligationAcEvidence().every((row) => row.covered), "AC covered");
    assert(CHANGE_IMPACT_OBLIGATION_MAP_PATH.includes("change-impact-obligation-to-test-map"), "map path");
    assert(CHANGE_IMPACT_OBLIGATION_FIXTURE.includes("change-impact-obligation-to-test.fixtures"), "fixture path");
    assert(MISSING_SEMANTIC_RELATION === "impactsProductObligation" && SERVICE_RELATION === "impactsProductObligation", "missing relation");
    assert(MISSING_SEMANTIC_RELATION_GAP.includes("Graph reachability"), "gap explanation");
    assert(RELATION_SUPPORT_STATES.length === 4 && supportStatesAreDistinct().distinct, "four distinct states");
    assert(CHANGE_IMPACT_OBLIGATION_RECIPE_POLICY.proposedTestEqualsPassed === false, "proposed ≠ passed");
    assert(CHANGE_IMPACT_OBLIGATION_RECIPE_POLICY.semanticWaiverOfInvalidation === false, "no waiver policy");
    assert(CHANGE_IMPACT_OBLIGATION_RECIPE_NO_DEFAULT_REWRITE, "no default rewrite");
    assert(CHANGE_IMPACT_OBLIGATION_OWNER_MODULES.includes("kernel/engine/runstate.ts"), "runstate owner");
    const indexSource = readFileSync(path.join(skillRoot, "catalog/workflows/index.ts"), "utf8");
    assert(!changeImpactObligationTouchesDefaultIndex(indexSource), "must not touch default workflows index");
  });

  harness.check("change-impact-obligation-to-test: AC1 invalidating change → affected surfaces + retain unrelated", () => {
    const matrix = assessChangeObligationMatrix({
      change: change(),
      obligations: [
        obligation({ obligationId: "obl.promise", surfaceId: "surface.promise", dependentSurfaceIds: ["surface.dependent"] }),
        obligation({
          obligationId: "obl.unrelated",
          promise: "Unrelated valid feature",
          surfaceId: "surface.unrelated",
          dependentSurfaceIds: [],
        }),
      ],
      unrelatedObligationIds: ["obl.unrelated"],
      impactByObligationId: new Map<string, RelationSupportState>([
        ["obl.promise", "supported"],
        ["obl.unrelated", "not_applicable"],
      ]),
    });
    assert(matrix.relation === "impactsProductObligation", "uses missing relation");
    assert(matrix.affectedSurfaceIds.includes("surface.promise"), "promise surface affected");
    assert(matrix.affectedSurfaceIds.includes("surface.dependent"), "dependent surface affected");
    assert(matrix.retainedUnrelatedSurfaceIds.includes("surface.unrelated"), "unrelated retained");
    assert(!matrix.affectedSurfaceIds.includes("surface.unrelated"), "unrelated not in affected");
    assert(matrix.appliesToRevision === "rev-1", "revision-bound");
  });

  harness.check("change-impact-obligation-to-test: AC2 source exists but unsupported ≠ coverage", () => {
    const evidence: ObligationEvidence[] = [
      {
        evidenceId: "ev.exists-unsupported",
        sourceId: "src.mirror",
        revision: "rev-1",
        claim: "mirror exists but does not support the obligation",
        supportsObligation: false,
        fingerprint: "sha256:mirror-v1",
      },
    ];
    const matrix = assessObligationEvidenceMatrix({
      obligations: [obligation({ obligationId: "obl.need-support" })],
      evidenceByObligationId: new Map([["obl.need-support", evidence]]),
      revision: "rev-1",
    });
    assert(matrix.unsupportedExistingSourceIds.includes("src.mirror"), "unsupported existing source recorded");
    assert(!matrix.coveredObligationIds.includes("obl.need-support"), "not counted as coverage");
    assert(matrix.uncoveredObligationIds.includes("obl.need-support"), "remains uncovered");
    assert(matrix.cells[0]!.state === "contradicted", "unsupported → contradicted cell");
    assert(matrix.cells[0]!.explanation.includes("not counted as coverage"), "explanation names non-coverage");
  });

  harness.check("change-impact-obligation-to-test: AC3 no semantic score waives acceptance invalidation", () => {
    const attempt = attemptSemanticWaiver({ semanticScore: 0.99, sourceChanged: true });
    assert(attempt.waived === false, "never waived");
    assert(attempt.acceptanceInvalidationRequired === true, "invalidation still required");
    assert(attempt.reason.includes("cannot waive"), "reason forbids waiver");
    const highScoreStillBlocked = attemptSemanticWaiver({ semanticScore: 1, sourceChanged: true, fingerprintMatches: false });
    assert(highScoreStillBlocked.waived === false, "score=1 still cannot waive");
    const currency = evidenceRemainsCurrent({
      evidence: {
        evidenceId: "ev.fp",
        sourceId: "src.product",
        revision: "rev-1",
        claim: "claim",
        supportsObligation: true,
        fingerprint: "sha256:old",
      },
      currentFingerprints: new Map([["src.product", "sha256:new"]]),
      trueDependencySourceIds: ["src.product"],
    });
    assert(currency.current === false, "fingerprint drift clears currency");
    assert(currency.reason.includes("fingerprint"), "reason names fingerprint");
  });

  harness.check("change-impact-obligation-to-test: AC4 proposed test ≠ passed until accepted evidence", () => {
    const uncovered = proposeTestsForUncovered({
      uncoveredObligationIds: ["obl.need-test"],
      obligations: [obligation({ obligationId: "obl.need-test", promise: "Needs a compact additional test" })],
    });
    assert(uncovered.incompleteCoverageExplicit === true, "incomplete explicit");
    assert(uncovered.proposals.length === 1, "one compact proposal");
    const proposal = uncovered.proposals[0]!;
    assert(proposal.status === "proposed", "status proposed");
    assert(proposal.acceptedEvidenceId === null, "no accepted evidence yet");
    assert(proposal.explanation.includes("has not passed"), "explanation says not passed");

    const afterEvidence = proposeTestsForUncovered({
      uncoveredObligationIds: ["obl.need-test"],
      obligations: [obligation({ obligationId: "obl.need-test", promise: "Needs a compact additional test" })],
      acceptedEvidenceByTestId: new Map([[proposal.testId, "ev.accepted-1"]]),
    });
    assert(afterEvidence.proposals[0]!.status === "passed_with_accepted_evidence", "passed only with accepted evidence");
    assert(afterEvidence.proposals[0]!.acceptedEvidenceId === "ev.accepted-1", "evidence id bound");
  });

  harness.check("change-impact-obligation-to-test: AC5 repeat/interrupt cascade IDs stable without duplicate effects", () => {
    const ledger = new CascadeIdentityLedger();
    const first = ledger.route({
      changeId: "chg.product-promise",
      revision: "rev-1",
      affectedSurfaceIds: ["surface.promise", "surface.dependent"],
      retainedUnrelatedSurfaceIds: ["surface.unrelated"],
    });
    const repeat = ledger.route({
      changeId: "chg.product-promise",
      revision: "rev-1",
      affectedSurfaceIds: ["surface.promise", "surface.dependent"],
      retainedUnrelatedSurfaceIds: ["surface.unrelated"],
    });
    assert(first.cascadeEventId === repeat.cascadeEventId, "cascade id stable on repeat");
    assert(first.recoveryId === repeat.recoveryId, "recovery id stable on repeat");
    assert(JSON.stringify(first.effectKeys) === JSON.stringify(repeat.effectKeys), "no duplicate effects on repeat");
    assert(first.replaced76 === false && first.secondLedger === false, "consumes #76; no second ledger");
    assert(first.routedThroughExistingCascade === true, "routed through existing cascade");

    const resumed = ledger.resumeAfterInterrupt("chg.product-promise", "rev-1");
    assert(resumed.cascadeEventId === first.cascadeEventId, "interrupt resume keeps cascade id");
    assert(JSON.stringify(resumed.effectKeys) === JSON.stringify(first.effectKeys), "interrupt resume no duplicate effects");
    assert(resumed.retainedUnrelatedSurfaceIds.includes("surface.unrelated"), "unrelated retained across interrupt");
  });

  harness.check("change-impact-obligation-to-test: TUCK trip-edit seeded fixture + revision-bound need-more-evidence", () => {
    assert(TUCK_TRIP_EDIT_FIXTURE.seeded === true, "seeded");
    assert(TUCK_TRIP_EDIT_FIXTURE.claimsExistingBug === false, "not claiming existing bug");
    const tuck = assessTuckTripEditFixture();
    assert(tuck.claimsExistingBug === false, "assessment not claiming bug");
    assert(tuck.changeMatrix.affectedSurfaceIds.includes("tuck.surface.custom-items"), "custom items affected");
    assert(tuck.changeMatrix.affectedSurfaceIds.includes("tuck.surface.packed-state"), "packed state in affected (insufficient still flags surface)");
    assert(tuck.changeMatrix.retainedUnrelatedSurfaceIds.includes("tuck.surface.weather-widget"), "weather retained");
    assert(tuck.evidenceMatrix.unsupportedExistingSourceIds.includes("tuck.src.analytics-mirror"), "analytics mirror not coverage");
    assert(
      tuck.testMatrix.proposals.some((p) => p.obligationId === "tuck.obl.preserve-packed-state" && p.status === "proposed"),
      "packed-state test proposed",
    );
    assert(tuck.explanation.needMoreEvidence === true, "need more evidence path");
    assert(tuck.explanation.revision === "tuck-rev-seed-1", "revision-bound");
    assert(tuck.explanation.nextWork.includes("evidence"), "next work names evidence");

    const explanation = explainAssessment({
      revision: "tuck-rev-seed-1",
      changeMatrix: tuck.changeMatrix,
      evidenceMatrix: tuck.evidenceMatrix,
    });
    assert(explanation.relation === "impactsProductObligation", "explanation names relation");
    assert(explanation.needMoreEvidence === true, "explicit need-more-evidence");
  });

  harness.check("change-impact-obligation-to-test: four states distinct; graph reachability alone insufficient", () => {
    const distinct = supportStatesAreDistinct();
    assert(distinct.fusedScoreForbidden === true, "no fused score");
    assert(JSON.stringify([...distinct.states]) === JSON.stringify(["supported", "contradicted", "insufficient", "not_applicable"]), "exact states");

    // Obligation not graph-reachable still assessed via missing semantic relation.
    const matrix = assessChangeObligationMatrix({
      change: change({ graphReachableSurfaceIds: [] }),
      obligations: [obligation({ obligationId: "obl.semantic-only", surfaceId: "surface.semantic", dependentSurfaceIds: [] })],
      impactByObligationId: new Map([["obl.semantic-only", "supported"]]),
    });
    assert(matrix.affectedSurfaceIds.includes("surface.semantic"), "semantic impact beyond graph reachability");
    assert(matrix.cells[0]!.explanation.includes("beyond graph reachability"), "explanation names gap");
  });
}
