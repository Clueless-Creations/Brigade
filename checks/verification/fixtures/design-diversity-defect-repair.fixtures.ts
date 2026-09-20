/**
 * #526 SQ-14 — Design diversity / parallel defect diagnosis / targeted repair
 * fixtures (paper; synthetic; no-network).
 *
 * Proves all five Acceptance criteria + tip stamps / hard bans / negative
 * controls / #403 retention. Import identifiers are locked to live exports.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { assert, skillRoot, type Harness } from "./_harness.js";
import {
  CONCERN_AXES,
  CREATIVE_LOOP_403_OBLIGATIONS,
  DEFECT_LOCATIONS,
  DESIGN_DIVERSITY_OWNER_MODULES,
  DESIGN_DIVERSITY_RECIPE_CONSUMES,
  DESIGN_DIVERSITY_RECIPE_COORDINATES,
  DESIGN_DIVERSITY_RECIPE_EPIC,
  DESIGN_DIVERSITY_RECIPE_ISSUE,
  DESIGN_DIVERSITY_RECIPE_NEXT_AFTER_CLOSE,
  DESIGN_DIVERSITY_RECIPE_NO_526_IMPL,
  DESIGN_DIVERSITY_RECIPE_NO_DEFAULT_REWRITE,
  DESIGN_DIVERSITY_RECIPE_NO_MANDATORY_ANIMATION,
  DESIGN_DIVERSITY_RECIPE_NO_MERGED_IDENTITY,
  DESIGN_DIVERSITY_RECIPE_NO_NETWORK,
  DESIGN_DIVERSITY_RECIPE_NO_NUMERIC_BEAUTY,
  DESIGN_DIVERSITY_RECIPE_NO_REPLACE_403,
  DESIGN_DIVERSITY_RECIPE_NO_REPLACE_DESIGN_ROOM,
  DESIGN_DIVERSITY_RECIPE_NO_REPLACE_VISUAL_REVIEW,
  DESIGN_DIVERSITY_RECIPE_NO_SILENT_SCOPE_REDUCTION,
  DESIGN_DIVERSITY_RECIPE_NO_UNIVERSAL_TEMPLATES,
  DESIGN_DIVERSITY_RECIPE_NO_UNPROVEN_IMAGE_INPUT,
  DESIGN_DIVERSITY_RECIPE_PLANNING_ID,
  DESIGN_DIVERSITY_RECIPE_POLICY,
  DESIGN_DIVERSITY_RECIPE_STAMP,
  HARD_REQUIREMENTS,
  NEGATIVE_CONTROL_KINDS,
  designDiversityTouchesDefaultIndex,
} from "../../../catalog/workflows/design-diversity-defect-repair.js";
import {
  DESIGN_DIVERSITY_AC,
  DESIGN_DIVERSITY_BASE_MAIN_SHA,
  DESIGN_DIVERSITY_CONSUMES,
  DESIGN_DIVERSITY_COORDINATES,
  DESIGN_DIVERSITY_EPIC,
  DESIGN_DIVERSITY_FIXTURE,
  DESIGN_DIVERSITY_HOSTED_KEY_OWNER,
  DESIGN_DIVERSITY_IOS_SIM_OOS,
  DESIGN_DIVERSITY_ISSUE,
  DESIGN_DIVERSITY_LIVE_NOT_PERFORMED,
  DESIGN_DIVERSITY_MAP_PATH,
  DESIGN_DIVERSITY_NEXT_AFTER_CLOSE,
  DESIGN_DIVERSITY_NO_526_IMPL,
  DESIGN_DIVERSITY_NO_MANDATORY_ANIMATION,
  DESIGN_DIVERSITY_NO_MERGED_IDENTITY,
  DESIGN_DIVERSITY_NO_NETWORK,
  DESIGN_DIVERSITY_NO_NUMERIC_BEAUTY,
  DESIGN_DIVERSITY_NO_REPLACE_403,
  DESIGN_DIVERSITY_NO_REPLACE_DESIGN_ROOM,
  DESIGN_DIVERSITY_NO_REPLACE_VISUAL_REVIEW,
  DESIGN_DIVERSITY_NO_SILENT_SCOPE_REDUCTION,
  DESIGN_DIVERSITY_NO_SYNTHETIC_AS_DEVICE,
  DESIGN_DIVERSITY_NO_UNIVERSAL_TEMPLATES,
  DESIGN_DIVERSITY_NO_UNPROVEN_IMAGE_INPUT,
  DESIGN_DIVERSITY_PLANNING_ID,
  DESIGN_DIVERSITY_STAMP,
  designDiversityAcEvidence,
} from "../../../catalog/providers/design-diversity-defect-repair-map.js";
import {
  DESIGN_DIVERSITY_CONSUMES as SERVICE_CONSUMES,
  DESIGN_DIVERSITY_COORDINATES as SERVICE_COORDINATES,
  DESIGN_DIVERSITY_EPIC as SERVICE_EPIC,
  DESIGN_DIVERSITY_ISSUE as SERVICE_ISSUE,
  DESIGN_DIVERSITY_NEXT_AFTER_CLOSE as SERVICE_NEXT_AFTER,
  DESIGN_DIVERSITY_NO_526_IMPL as SERVICE_NO_526,
  DESIGN_DIVERSITY_NO_NETWORK as SERVICE_NO_NETWORK,
  DESIGN_DIVERSITY_NO_NUMERIC_BEAUTY as SERVICE_NO_BEAUTY,
  DESIGN_DIVERSITY_NO_REPLACE_403 as SERVICE_NO_REPLACE_403,
  DESIGN_DIVERSITY_SEEDED_FIXTURE,
  DESIGN_DIVERSITY_STAMP as SERVICE_STAMP,
  assessSeededDesignDiversityFixture,
  assertAuthorityBoundary,
  concernAxesAreSeparate,
  diagnoseAndRoute,
  evaluateRepairs,
  guardEvidenceModality,
  originalityCannotCompensateHardFailure,
  retainCreativeLoop403,
  retainNondominatedSet,
  runNegativeControls,
  seededCandidates,
  type ProposedRepair,
} from "../../../kernel/services/design-diversity-defect-repair.js";

export function register(harness: Harness): void {
  harness.check("design-diversity-defect-repair: stamp/issue/consumes + AC map + hard bans + NO_526 cleared", () => {
    assert(DESIGN_DIVERSITY_ISSUE === "#526", "map issue");
    assert(SERVICE_ISSUE === "#526", "service issue");
    assert(DESIGN_DIVERSITY_RECIPE_ISSUE === "#526", "recipe issue");
    assert(DESIGN_DIVERSITY_EPIC === "#511" && SERVICE_EPIC === "#511" && DESIGN_DIVERSITY_RECIPE_EPIC === "#511", "epic");
    assert(DESIGN_DIVERSITY_PLANNING_ID === "SQ-14" && DESIGN_DIVERSITY_RECIPE_PLANNING_ID === "SQ-14", "planning id");
    assert(DESIGN_DIVERSITY_STAMP === "0.221.47" && SERVICE_STAMP === "0.221.47" && DESIGN_DIVERSITY_RECIPE_STAMP === "0.221.47", "stamp");
    assert(DESIGN_DIVERSITY_NO_526_IMPL === false && SERVICE_NO_526 === false && DESIGN_DIVERSITY_RECIPE_NO_526_IMPL === false, "NO_526 cleared");
    assert(
      DESIGN_DIVERSITY_NEXT_AFTER_CLOSE === "#511" && SERVICE_NEXT_AFTER === "#511" && DESIGN_DIVERSITY_RECIPE_NEXT_AFTER_CLOSE === "#511",
      "NEXT_AFTER=#511",
    );
    assert(JSON.stringify([...DESIGN_DIVERSITY_CONSUMES]) === JSON.stringify(["#514", "#521", "#522", "#523"]), "map consumes");
    assert(JSON.stringify([...SERVICE_CONSUMES]) === JSON.stringify(["#514", "#521", "#522", "#523"]), "service consumes");
    assert(JSON.stringify([...DESIGN_DIVERSITY_RECIPE_CONSUMES]) === JSON.stringify(["#514", "#521", "#522", "#523"]), "recipe consumes");
    assert(JSON.stringify([...DESIGN_DIVERSITY_COORDINATES]) === JSON.stringify(["#403", "#74", "#76"]), "map coordinates");
    assert(JSON.stringify([...SERVICE_COORDINATES]) === JSON.stringify(["#403", "#74", "#76"]), "service coordinates");
    assert(JSON.stringify([...DESIGN_DIVERSITY_RECIPE_COORDINATES]) === JSON.stringify(["#403", "#74", "#76"]), "recipe coordinates");
    assert(DESIGN_DIVERSITY_NO_NETWORK && SERVICE_NO_NETWORK && DESIGN_DIVERSITY_RECIPE_NO_NETWORK, "no network");
    assert(DESIGN_DIVERSITY_NO_NUMERIC_BEAUTY && SERVICE_NO_BEAUTY && DESIGN_DIVERSITY_RECIPE_NO_NUMERIC_BEAUTY, "no numeric beauty");
    assert(DESIGN_DIVERSITY_NO_REPLACE_403 && SERVICE_NO_REPLACE_403 && DESIGN_DIVERSITY_RECIPE_NO_REPLACE_403, "no replace #403");
    assert(DESIGN_DIVERSITY_NO_REPLACE_DESIGN_ROOM && DESIGN_DIVERSITY_RECIPE_NO_REPLACE_DESIGN_ROOM, "no replace Design Room");
    assert(DESIGN_DIVERSITY_NO_REPLACE_VISUAL_REVIEW && DESIGN_DIVERSITY_RECIPE_NO_REPLACE_VISUAL_REVIEW, "no replace visual review");
    assert(DESIGN_DIVERSITY_NO_UNPROVEN_IMAGE_INPUT && DESIGN_DIVERSITY_RECIPE_NO_UNPROVEN_IMAGE_INPUT, "no unproven image");
    assert(DESIGN_DIVERSITY_NO_SILENT_SCOPE_REDUCTION && DESIGN_DIVERSITY_RECIPE_NO_SILENT_SCOPE_REDUCTION, "no silent scope cut");
    assert(DESIGN_DIVERSITY_NO_MERGED_IDENTITY && DESIGN_DIVERSITY_RECIPE_NO_MERGED_IDENTITY, "no merged identity");
    assert(DESIGN_DIVERSITY_NO_UNIVERSAL_TEMPLATES && DESIGN_DIVERSITY_RECIPE_NO_UNIVERSAL_TEMPLATES, "no universal templates");
    assert(DESIGN_DIVERSITY_NO_MANDATORY_ANIMATION && DESIGN_DIVERSITY_RECIPE_NO_MANDATORY_ANIMATION, "no mandatory animation");
    assert(DESIGN_DIVERSITY_NO_SYNTHETIC_AS_DEVICE, "no synthetic-as-device");
    assert(DESIGN_DIVERSITY_LIVE_NOT_PERFORMED && DESIGN_DIVERSITY_IOS_SIM_OOS, "live/ios oos");
    assert(DESIGN_DIVERSITY_HOSTED_KEY_OWNER.includes("Eduardo"), "key owner");
    assert(DESIGN_DIVERSITY_BASE_MAIN_SHA === "a988541094194924cd5b0704875e39e42d17a3a2", "base sha");
    assert(DESIGN_DIVERSITY_AC.length === 5 && designDiversityAcEvidence().every((row) => row.covered), "AC covered");
    assert(DESIGN_DIVERSITY_MAP_PATH.includes("design-diversity-defect-repair-map"), "map path");
    assert(DESIGN_DIVERSITY_FIXTURE.includes("design-diversity-defect-repair.fixtures"), "fixture path");
    assert(CONCERN_AXES.length === 7 && HARD_REQUIREMENTS.length === 4 && DEFECT_LOCATIONS.length === 7, "taxonomies sized");
    assert(NEGATIVE_CONTROL_KINDS.length === 4, "four negative controls");
    assert(CREATIVE_LOOP_403_OBLIGATIONS.length === 4, "four #403 obligations");
    assert(DESIGN_DIVERSITY_RECIPE_POLICY.hardRequirementsCompensatory === false, "non-compensatory");
    assert(DESIGN_DIVERSITY_RECIPE_POLICY.paretoSubstitutesForVisualReview === false, "pareto ≠ visual");
    assert(DESIGN_DIVERSITY_RECIPE_POLICY.confidenceSubstitutesForFounderDirection === false, "confidence ≠ founder");
    assert(DESIGN_DIVERSITY_RECIPE_POLICY.numericBeautyScore === false, "no beauty score policy");
    assert(DESIGN_DIVERSITY_RECIPE_NO_DEFAULT_REWRITE, "no default rewrite");
    assert(DESIGN_DIVERSITY_OWNER_MODULES.includes("knowledge/design/quality-lens.md"), "quality-lens owner");
    assert(DESIGN_DIVERSITY_OWNER_MODULES.includes("catalog/workflows/product-experience.ts"), "product-experience owner");
    const indexSource = readFileSync(path.join(skillRoot, "catalog/workflows/index.ts"), "utf8");
    assert(!designDiversityTouchesDefaultIndex(indexSource), "must not touch default workflows index");
    const separate = concernAxesAreSeparate();
    assert(separate.fusedTasteScoreForbidden && separate.numericBeautyForbidden, "no fused taste/beauty");
  });

  harness.check("design-diversity-defect-repair: AC1 inaccessible cannot compensate via originality", () => {
    const seeded = seededCandidates();
    const veto = originalityCannotCompensateHardFailure(seeded.inaccessibleHighOriginality);
    assert(veto.vetoed === true, "vetoed");
    assert(veto.originalityOrdinal === 4, "originality maximal");
    assert(veto.hardFailures.includes("accessibility_pass"), "a11y hard failure");
    assert(veto.reason.includes("cannot compensate"), "reason names non-compensation");

    const pareto = retainNondominatedSet({
      candidates: [seeded.inaccessibleHighOriginality, seeded.directionA],
      revision: DESIGN_DIVERSITY_SEEDED_FIXTURE.revision,
    });
    assert(pareto.rejectedForHardFailure.includes("cand.inaccessible-original"), "hard-fail rejected from Pareto");
    assert(!pareto.retainedCandidateIds.includes("cand.inaccessible-original"), "not retained");
    assert(pareto.averagingForbidden === true, "no averaging");
  });

  harness.check("design-diversity-defect-repair: AC2 two nondominated directions survive", () => {
    const seeded = seededCandidates();
    const pareto = retainNondominatedSet({
      candidates: [seeded.directionA, seeded.directionB],
      revision: DESIGN_DIVERSITY_SEEDED_FIXTURE.revision,
    });
    assert(pareto.retainedCandidateIds.includes("cand.direction-a-calm-list"), "direction A retained");
    assert(pareto.retainedCandidateIds.includes("cand.direction-b-spatial-map"), "direction B retained");
    assert(pareto.retainedCandidateIds.length === 2, "both survive");
    assert(pareto.dominated.length === 0, "neither dominated");
    assert(pareto.nondominated === true, "nondominated flag");
    assert(pareto.substitutesForVisualReview === false, "Pareto ≠ visual review");
    assert(pareto.substitutesForFounderDirection === false, "Pareto ≠ founder direction");
    assert(pareto.explanation.includes("diversity preserved") || pareto.explanation.includes("nondominated"), "explanation");
    assert(seeded.directionA.distinguishingMechanic !== seeded.directionB.distinguishingMechanic, "materially different mechanics");
  });

  harness.check("design-diversity-defect-repair: AC3 a11y/control repair preserves authored visual concept", () => {
    const seeded = seededCandidates();
    const { diagnosis, route } = diagnoseAndRoute({
      candidate: seeded.a11yDefectViableConcept,
      location: "implementation",
      summary: "Control a11y defect; concept viable",
    });
    assert(diagnosis.location === "implementation", "implementation location");
    assert(diagnosis.preservesConceptIfLocalRepair === true, "local repair can preserve concept");
    assert(route === "local_repair", "routes to local repair");

    const repairs: ProposedRepair[] = [
      {
        repairId: "repair.wholesale-regen",
        candidateId: seeded.a11yDefectViableConcept.candidateId,
        defectId: diagnosis.defectId,
        route: "explore_new_direction",
        description: "Wholesale generic regeneration",
        preservesAuthoredVisualConcept: false,
        addressesDiagnosedDefect: true,
        preservesIdentityInvariants: true,
        preservesHardRequirements: true,
      },
      {
        repairId: "repair.local-a11y",
        candidateId: seeded.a11yDefectViableConcept.candidateId,
        defectId: diagnosis.defectId,
        route: "local_repair",
        description: "Local a11y control fix",
        preservesAuthoredVisualConcept: true,
        addressesDiagnosedDefect: true,
        preservesIdentityInvariants: true,
        preservesHardRequirements: true,
      },
    ];
    const evaluation = evaluateRepairs({ repairs, preferredRoute: "local_repair" });
    assert(evaluation.selected !== null, "selected a repair");
    assert(evaluation.selected!.repairId === "repair.local-a11y", "selected local repair");
    assert(evaluation.selected!.preservesAuthoredVisualConcept === true, "preserves authored concept");
    assert(evaluation.recordedAlternatives === true, "alternatives recorded");
    assert(
      evaluation.rejected.some((r) => r.repair.repairId === "repair.wholesale-regen"),
      "wholesale regen rejected/recorded",
    );
  });

  harness.check("design-diversity-defect-repair: AC4 retains #403 creative-loop + source fidelity", () => {
    const retention = retainCreativeLoop403();
    assert(retention.allRetained === true, "all retained");
    assert(retention.replaces403Delivery === false, "does not replace #403 delivery");
    assert(retention.replacesDesignRoom === false, "does not replace Design Room");
    assert(retention.replacesVisualReviewProvider === false, "does not replace visual review");
    assert(retention.obligations.includes("reference_led_draft"), "reference-led draft");
    assert(retention.obligations.includes("critique"), "critique");
    assert(retention.obligations.includes("refinement"), "refinement");
    assert(retention.obligations.includes("source_to_implementation_fidelity"), "source fidelity");

    // Design Room workflow still carries the reference-led loop terms (#403).
    const productExperience = readFileSync(path.join(skillRoot, "catalog/workflows/product-experience.ts"), "utf8");
    assert(productExperience.includes("inspect the relevant references"), "Design Room: inspect references");
    assert(productExperience.includes("tangible draft"), "Design Room: tangible draft");
    assert(productExperience.includes("critique concrete"), "Design Room: critique");
    assert(productExperience.includes("revise the candidate"), "Design Room: refinement");
    assert(productExperience.includes("compare the revised candidate"), "Design Room: compare revised");

    const qualityLens = readFileSync(path.join(skillRoot, "knowledge/design/quality-lens.md"), "utf8");
    assert(qualityLens.includes("Defect diagnosis"), "quality-lens defect diagnosis retained");
    assert(qualityLens.includes("Do not invent a beauty score"), "quality-lens forbids beauty score");
  });

  harness.check("design-diversity-defect-repair: AC5 confidence/Pareto ≠ visual review or founder direction", () => {
    const boundary = assertAuthorityBoundary({ confidenceValue: 0.99, paretoSelectionMade: true });
    assert(boundary.substitutesForIndependentVisualReview === false, "confidence/Pareto ≠ visual review");
    assert(boundary.substitutesForFounderReservedDirection === false, "confidence/Pareto ≠ founder");
    assert(boundary.reason.includes("independent visual review"), "reason names visual review");
    assert(boundary.reason.includes("founder-reserved"), "reason names founder");

    const seeded = seededCandidates();
    const pareto = retainNondominatedSet({
      candidates: [seeded.directionA, seeded.directionB],
      revision: DESIGN_DIVERSITY_SEEDED_FIXTURE.revision,
    });
    assert(pareto.substitutesForVisualReview === false, "pareto result ≠ visual");
    assert(pareto.substitutesForFounderDirection === false, "pareto result ≠ founder");
    assert(DESIGN_DIVERSITY_RECIPE_POLICY.paretoSubstitutesForVisualReview === false, "policy");
    assert(DESIGN_DIVERSITY_RECIPE_POLICY.confidenceSubstitutesForFounderDirection === false, "policy confidence");
  });

  harness.check("design-diversity-defect-repair: negative controls + modality guard + seeded e2e", () => {
    const full = assessSeededDesignDiversityFixture();
    assert(full.seeded === true, "seeded");
    assert(full.ac1Veto.vetoed === true, "e2e AC1");
    assert(full.pareto.retainedCandidateIds.length === 2, "e2e AC2 two retained");
    assert(full.localRepair.route === "local_repair", "e2e AC3 route");
    assert(full.localRepair.evaluation.selected?.preservesAuthoredVisualConcept === true, "e2e AC3 preserve");
    assert(full.creativeLoop403.allRetained === true, "e2e AC4");
    assert(full.authority.substitutesForIndependentVisualReview === false, "e2e AC5");

    const byKind = new Map(full.negativeControls.map((c) => [c.kind, c]));
    assert(byKind.get("template_convergence")?.triggered === true, "template convergence control fires");
    assert(byKind.get("rubric_gaming")?.triggered === true, "rubric gaming control fires");
    assert(byKind.get("text_only_claimed_image_sight")?.triggered === true, "fake image sight control fires");

    const guard = guardEvidenceModality({
      modality: "text",
      claimedSawImage: true,
      providerSupportsImage: false,
    });
    assert(guard.allowed === false, "text-only image claim refused");
    assert(guard.reason.includes("cannot claim"), "guard reason");

    const ok = guardEvidenceModality({
      modality: "structured",
      claimedSawImage: false,
      providerSupportsImage: false,
    });
    assert(ok.allowed === true, "structured without image claim ok");

    // polished copy + broken behavior control
    const seeded = seededCandidates();
    const polishedBroken = {
      ...seeded.directionA,
      candidateId: "cand.polished-broken",
      concernAssessments: seeded.directionA.concernAssessments.map((a) =>
        a.axis === "claim_consistency"
          ? { ...a, ordinal: 4 as const }
          : a.axis === "implementation_mismatch"
            ? { ...a, ordinal: 0 as const }
            : a.axis === "recovery_promise"
              ? { ...a, ordinal: 0 as const }
              : a,
      ),
    };
    const controls = runNegativeControls({ candidates: [polishedBroken] });
    assert(
      controls.some((c) => c.kind === "polished_copy_broken_behavior" && c.triggered),
      "polished+broken fires",
    );
  });

  harness.check("design-diversity-defect-repair: defect taxonomy + concept failure routes explore_new", () => {
    const seeded = seededCandidates();
    for (const loc of DEFECT_LOCATIONS) {
      assert(typeof loc === "string" && loc.length > 0, `location ${loc}`);
    }
    const conceptFail = diagnoseAndRoute({
      candidate: { ...seeded.directionA, viableConcept: false },
      location: "concept",
      summary: "Organizing idea conveys wrong meaning",
    });
    assert(conceptFail.route === "explore_new_direction", "concept failure → explore new");
    assert(conceptFail.diagnosis.preservesConceptIfLocalRepair === false, "cannot local-polish a bad premise");

    const needEvidence = diagnoseAndRoute({
      candidate: seeded.directionA,
      location: "insufficient_observation",
      summary: "No independent observation yet",
    });
    assert(needEvidence.route === "need_more_evidence", "insufficient observation → need evidence");
  });
}
