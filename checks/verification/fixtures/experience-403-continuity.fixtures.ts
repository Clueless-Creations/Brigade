/**
 * #403 continuous experience-delivery continuity fixtures (U6 R1 residual).
 *
 * Deterministic only. Proves AC1–AC8 + required controls + negative controls +
 * D0–D7 honesty. Consumes #411/#456; does not redo them. No live provider.
 * Fixture success ≠ claimed design quality or autonomous delivery.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { assert, skillRoot, type Harness } from "./_harness.js";
import {
  EXPERIENCE_403_AC,
  EXPERIENCE_403_AUDIT_DOC,
  EXPERIENCE_403_BASE_MAIN_SHA,
  EXPERIENCE_403_CONSUMES,
  EXPERIENCE_403_COORDINATES,
  EXPERIENCE_403_ISSUE,
  EXPERIENCE_403_LIVE_NOT_PERFORMED,
  EXPERIENCE_403_MAP_PATH,
  EXPERIENCE_403_NEXT_AFTER_CLOSE,
  EXPERIENCE_403_NO_397_START,
  EXPERIENCE_403_NO_402_REWRITE,
  EXPERIENCE_403_NO_NETWORK,
  EXPERIENCE_403_NO_NPM_PUBLISH,
  EXPERIENCE_403_NO_NUMERIC_BEAUTY,
  EXPERIENCE_403_NO_PHRASE_GATE,
  EXPERIENCE_403_NO_PROFILE_STEAL,
  EXPERIENCE_403_PRESERVE_CLOSED,
  EXPERIENCE_403_RECIPE_MODULE,
  EXPERIENCE_403_SERVICE_MODULE,
  EXPERIENCE_403_STAMP,
  ELEVEN_STAR_DOC,
  QUALITY_LENS_DOC,
  TASK_SKILLS_MODULE,
  WORKER_PROMPT_MODULE,
  experience403AcEvidence,
  experience403AllAcceptanceDone,
} from "../../../catalog/providers/experience-403-continuity-closeout-map.js";
import {
  CREATIVE_LOOP_STAGES,
  DELIVERY_PROJECTIONS,
  EXPERIENCE_403_OWNER_MODULES,
  EXPERIENCE_403_RECIPE_BASE_MAIN_SHA,
  EXPERIENCE_403_RECIPE_CONSUMES,
  EXPERIENCE_403_RECIPE_COORDINATES,
  EXPERIENCE_403_RECIPE_ISSUE,
  EXPERIENCE_403_RECIPE_NEXT_AFTER_CLOSE,
  EXPERIENCE_403_RECIPE_NO_397_START,
  EXPERIENCE_403_RECIPE_NO_402_REWRITE,
  EXPERIENCE_403_RECIPE_NO_NETWORK,
  EXPERIENCE_403_RECIPE_NO_NPM_PUBLISH,
  EXPERIENCE_403_RECIPE_NO_NUMERIC_BEAUTY,
  EXPERIENCE_403_RECIPE_NO_PHRASE_GATE,
  EXPERIENCE_403_RECIPE_NO_PROFILE_STEAL,
  EXPERIENCE_403_RECIPE_POLICY,
  EXPERIENCE_403_RECIPE_PRESERVE_CLOSED,
  EXPERIENCE_403_RECIPE_STAMP,
  EXPERIENCE_NEGATIVE_CONTROLS,
  experience403TouchesDefaultIndex,
} from "../../../catalog/workflows/experience-delivery-continuity.js";
import {
  EXPERIENCE_403_BASE_MAIN_SHA as SERVICE_BASE,
  EXPERIENCE_403_CONSUMES as SERVICE_CONSUMES,
  EXPERIENCE_403_COORDINATES as SERVICE_COORDINATES,
  EXPERIENCE_403_ISSUE as SERVICE_ISSUE,
  EXPERIENCE_403_NEXT_AFTER_CLOSE as SERVICE_NEXT,
  EXPERIENCE_403_NO_397_START as SERVICE_NO_397,
  EXPERIENCE_403_NO_402_REWRITE as SERVICE_NO_402,
  EXPERIENCE_403_NO_NETWORK as SERVICE_NO_NETWORK,
  EXPERIENCE_403_NO_NPM_PUBLISH as SERVICE_NO_NPM,
  EXPERIENCE_403_NO_NUMERIC_BEAUTY as SERVICE_NO_BEAUTY,
  EXPERIENCE_403_NO_PHRASE_GATE as SERVICE_NO_PHRASE,
  EXPERIENCE_403_NO_PROFILE_STEAL as SERVICE_NO_PROFILE,
  EXPERIENCE_403_STAMP as SERVICE_STAMP,
  SEEDED_NEGATIVE_BOARD_SCAFFOLD,
  SEEDED_POSITIVE_FIRST_SESSION,
  deliveryProjectionsAreDistinct,
  evaluateExperienceDelivery,
  handlePreviewRequest,
  hostAuthoredPreviewBoundary,
  laterCannotWaive,
  narrowWorkQualityPath,
  positiveTargetAndNegativeControlsFrozen,
  runSeededDefectReviewRepair,
  standaloneReview,
} from "../../../kernel/services/experience-delivery-continuity.js";

const AUDIT = path.join(skillRoot, EXPERIENCE_403_AUDIT_DOC);
const MAP = path.join(skillRoot, EXPERIENCE_403_MAP_PATH);
const QUALITY = path.join(skillRoot, QUALITY_LENS_DOC);
const ELEVEN = path.join(skillRoot, ELEVEN_STAR_DOC);
const TASK_SKILLS = path.join(skillRoot, TASK_SKILLS_MODULE);
const WORKER = path.join(skillRoot, WORKER_PROMPT_MODULE);
const DESIGN_EXPLORATION = path.join(skillRoot, "tooling/lib/design-exploration.ts");

export function register(harness: Harness): void {
  harness.check("experience-403: tip stamps / consumes / holds / AC map integrity", () => {
    assert(existsSync(MAP), "map present");
    assert(existsSync(AUDIT), "audit present");
    assert(existsSync(path.join(skillRoot, EXPERIENCE_403_SERVICE_MODULE)), "service present");
    assert(existsSync(path.join(skillRoot, EXPERIENCE_403_RECIPE_MODULE)), "recipe present");
    assert(EXPERIENCE_403_ISSUE === "#403" && SERVICE_ISSUE === "#403" && EXPERIENCE_403_RECIPE_ISSUE === "#403", "issue");
    assert(EXPERIENCE_403_STAMP === "0.221.58" && SERVICE_STAMP === "0.221.58" && EXPERIENCE_403_RECIPE_STAMP === "0.221.58", "stamp");
    assert(EXPERIENCE_403_BASE_MAIN_SHA === SERVICE_BASE && SERVICE_BASE === EXPERIENCE_403_RECIPE_BASE_MAIN_SHA, "base sha align");
    assert(EXPERIENCE_403_BASE_MAIN_SHA.startsWith("92f1852"), "base tip 92f1852");
    assert(JSON.stringify([...EXPERIENCE_403_CONSUMES]) === JSON.stringify(["#411", "#456", "#432", "#466"]), "map consumes");
    assert(JSON.stringify([...SERVICE_CONSUMES]) === JSON.stringify([...EXPERIENCE_403_RECIPE_CONSUMES]), "service consumes");
    assert(JSON.stringify([...EXPERIENCE_403_COORDINATES]) === JSON.stringify([...EXPERIENCE_403_RECIPE_COORDINATES]), "coords");
    assert(JSON.stringify([...SERVICE_COORDINATES]) === JSON.stringify([...EXPERIENCE_403_COORDINATES]), "service coords");
    assert(EXPERIENCE_403_NEXT_AFTER_CLOSE === "#397" && SERVICE_NEXT === "#397" && EXPERIENCE_403_RECIPE_NEXT_AFTER_CLOSE === "#397", "next");
    assert(EXPERIENCE_403_NO_NETWORK && SERVICE_NO_NETWORK && EXPERIENCE_403_RECIPE_NO_NETWORK, "no network");
    assert(EXPERIENCE_403_NO_NUMERIC_BEAUTY && SERVICE_NO_BEAUTY && EXPERIENCE_403_RECIPE_NO_NUMERIC_BEAUTY, "no beauty");
    assert(EXPERIENCE_403_NO_PHRASE_GATE && SERVICE_NO_PHRASE && EXPERIENCE_403_RECIPE_NO_PHRASE_GATE, "no phrase gate");
    assert(EXPERIENCE_403_NO_NPM_PUBLISH && SERVICE_NO_NPM && EXPERIENCE_403_RECIPE_NO_NPM_PUBLISH, "no npm");
    assert(EXPERIENCE_403_NO_PROFILE_STEAL && SERVICE_NO_PROFILE && EXPERIENCE_403_RECIPE_NO_PROFILE_STEAL, "no profile");
    assert(EXPERIENCE_403_NO_402_REWRITE && SERVICE_NO_402 && EXPERIENCE_403_RECIPE_NO_402_REWRITE, "no 402");
    assert(EXPERIENCE_403_NO_397_START && SERVICE_NO_397 && EXPERIENCE_403_RECIPE_NO_397_START, "no 397 start");
    assert(EXPERIENCE_403_LIVE_NOT_PERFORMED, "live not performed");
    assert(EXPERIENCE_403_AC.length === 8 && experience403AllAcceptanceDone(), "eight AC covered");
    assert(
      experience403AcEvidence().every((r) => r.covered),
      "getter covered",
    );
    assert(EXPERIENCE_403_PRESERVE_CLOSED.includes("#381") && EXPERIENCE_403_RECIPE_PRESERVE_CLOSED.includes("#390"), "preserve closed");
    assert(EXPERIENCE_403_RECIPE_POLICY.previewWaivesScope === false, "preview≠waiver");
    assert(EXPERIENCE_403_RECIPE_POLICY.laterWaivesAccepted === false, "later≠waiver");
    assert(EXPERIENCE_403_RECIPE_POLICY.inventFigmaFiles === false, "no invent figma");
    assert(EXPERIENCE_403_RECIPE_POLICY.fixtureSuccessClaimsDesignQuality === false, "no quality claim");
    assert(EXPERIENCE_403_RECIPE_POLICY.fixtureSuccessClaimsAutonomousDelivery === false, "no autonomous claim");
    assert(DELIVERY_PROJECTIONS.length === 6 && deliveryProjectionsAreDistinct(), "six distinct projections");
    assert(CREATIVE_LOOP_STAGES.length === 8, "D0–D7");
    assert(EXPERIENCE_NEGATIVE_CONTROLS.length === 10, "ten negative controls");
    assert(EXPERIENCE_403_OWNER_MODULES.includes(QUALITY_LENS_DOC), "quality-lens owner");
    const indexSource = readFileSync(path.join(skillRoot, "catalog/workflows/index.ts"), "utf8");
    assert(!experience403TouchesDefaultIndex(indexSource), "must not touch default workflows index");
    const audit = readFileSync(AUDIT, "utf8");
    assert(audit.includes("0.221.58"), "audit stamp");
    assert(audit.includes("92f1852"), "audit base");
    assert(/STOP.*#397|#397/i.test(audit), "audit STOP → #397");
    assert(audit.includes("#66") && audit.includes("#71") && audit.includes("#378"), "audit handoffs");
  });

  harness.check("experience-403: AC1 loss-point synthetic + board/scaffold/disconnected onboarding fails", () => {
    const frozen = positiveTargetAndNegativeControlsFrozen();
    assert(frozen.positiveMandateId === "synth.complete-product.first-session", "positive mandate frozen");
    const negative = evaluateExperienceDelivery({ evidence: SEEDED_NEGATIVE_BOARD_SCAFFOLD });
    assert(negative.acceptedAsExperienceDelivery === false, "negative must fail experience-delivery acceptance");
    assert(negative.negativeControlsTriggered.includes("board_scaffold_disconnected_onboarding"), "board+scaffold+disconnected");
    assert(negative.negativeControlsTriggered.includes("polished_screenshots_missing_onboarding"), "missing onboarding");
    assert(
      negative.lossPoints.some((p) => p.includes("requirement_to_implementation_loss")),
      "loss point named",
    );
    assert(SEEDED_NEGATIVE_BOARD_SCAFFOLD.filesAndUnitTestsExist === true, "files/tests exist yet still fail");
    assert(negative.partialProofClaimsCompletedExperience === false, "partial ≠ complete");
    assert(negative.claimsImprovedDesignQuality === false && negative.claimsAutonomousDelivery === false, "no overclaim");
    assert(negative.liveProviderRun === false, "no live run");
  });

  harness.check("experience-403: AC2 continuous quality via canonical/portable entrypoints (consume #411/#456)", () => {
    const taskSkills = readFileSync(TASK_SKILLS, "utf8");
    const worker = readFileSync(WORKER, "utf8");
    const quality = readFileSync(QUALITY, "utf8");
    assert(taskSkills.includes("intended outcome") || taskSkills.includes("user's intended outcome"), "portable principle");
    assert(!taskSkills.includes("require an 11-star exercise") || taskSkills.includes("does not require an 11-star"), "no universal exercise");
    assert(worker.includes("QUALITY PRINCIPLE"), "managed worker principle");
    assert(worker.includes("do not expand scope") || worker.includes("universal 11-star"), "scope-bounded");
    assert(
      quality.includes("standing quality principle") || quality.includes("way of thinking") || quality.includes("Quality principle"),
      "quality-lens principle pointer",
    );
    assert(!quality.includes("mandatory output template") || quality.includes("not a mandatory"), "not a universal doc gate");
    const exploration = readFileSync(DESIGN_EXPLORATION, "utf8");
    assert(exploration.includes("DesignProcessRecord") || exploration.includes("process_record"), "consume #456 process record");
    assert(exploration.includes("figma-unavailable") || exploration.includes("figma-read-only"), "figma capability enum present");
    // No extra universal skill invented by this suite
    assert(!existsSync(path.join(skillRoot, "agents/skills/b2c-eleven-star-universal/SKILL.md")), "no extra universal skill");
  });

  harness.check("experience-403: AC3 preview/deferral preserves accepted scope + distinct projections", () => {
    const open = ["onboarding_wiring", "recovery_return", "share_when_selected"];
    const preview = handlePreviewRequest({ openObligations: open, nextPermittedStep: "continue-onboarding-wiring" });
    assert(preview.presentationTaskChanged === true, "presentation changed");
    assert(preview.acceptedDeliveryScopeUnchanged === true, "scope unchanged");
    assert(JSON.stringify(preview.openObligationsRetained) === JSON.stringify(open), "obligations retained");
    assert(preview.silentScopeReduction === false, "no silent cut");
    assert(preview.hostStopIsBackgroundPromise === false, "host stop ≠ background promise");
    const later = laterCannotWaive(["onboarding", "recovery"], ["onboarding", "paywall-polish"]);
    assert(later.refused === true && later.waived.length === 0, "Later cannot waive");
    const verdict = evaluateExperienceDelivery({
      evidence: {
        ...SEEDED_NEGATIVE_BOARD_SCAFFOLD,
        laterWaivesAccepted: true,
        laterEntries: ["onboarding"],
      },
    });
    assert(verdict.acceptedAsExperienceDelivery === false, "Later waiver fails acceptance");
    assert(verdict.negativeControlsTriggered.includes("later_waives_accepted_requirement"), "later negative");
    assert(verdict.projections.map((p) => p.projection).join(",") === DELIVERY_PROJECTIONS.join(","), "all projections present");
    const accepted = verdict.projections.find((p) => p.projection === "accepted_delivery")!;
    const runnable = verdict.projections.find((p) => p.projection === "runnable_preview")!;
    assert(runnable.satisfied === true || runnable.claimed === true, "preview may exist");
    assert(accepted.satisfied === false, "preview ≠ accepted delivery");
    const silent = evaluateExperienceDelivery({
      evidence: { ...SEEDED_NEGATIVE_BOARD_SCAFFOLD, laterWaivesAccepted: true },
    });
    assert(silent.requiredControls.preview_no_silent_scope_cut === false, "control flags silent cut attempt");
  });

  harness.check("experience-403: AC4 first-session integration + seeded-defect review/repair at revisions", () => {
    const positive = evaluateExperienceDelivery({ evidence: SEEDED_POSITIVE_FIRST_SESSION });
    assert(positive.acceptedAsExperienceDelivery === true, "positive first-session accepts");
    assert(positive.firstSession.promise_to_first_value === true, "promise→value");
    assert(positive.firstSession.onboarding_wiring === true, "onboarding wired");
    assert(positive.firstSession.identity_hierarchy_copy_interaction_a11y_recovery === true, "running craft");
    assert(positive.firstSession.save_restart_return === true, "persistence");
    assert(positive.firstSession.selected_share_funnel_with_consent === true, "share+consent");
    assert(positive.firstSession.preview_preserves_mandate === true, "preview preserves");
    assert(positive.firstSession.seeded_defect_independent_review_repair === true, "seeded repair");
    assert(positive.appliesToRevision === "rev.impl.first-session.2", "revision bound");

    const repaired = runSeededDefectReviewRepair({
      defectId: "finding.seeded.wiring",
      summary: "Onboarding input unused by home value path",
      seededAtRevision: "rev.impl.first-session.1",
      independentReviewerId: "reviewer.independent",
      producerId: "producer.impl",
      repaired: true,
      newEvidenceRevision: "rev.impl.first-session.2",
      producerSelfAccepted: false,
    });
    assert(repaired.ok === true && repaired.evidenceRevision === "rev.impl.first-session.2", "repair at new revision");

    const selfAccept = runSeededDefectReviewRepair({
      defectId: "finding.x",
      summary: "x",
      seededAtRevision: "rev.1",
      independentReviewerId: "same",
      producerId: "same",
      repaired: true,
      newEvidenceRevision: "rev.2",
      producerSelfAccepted: true,
    });
    assert(selfAccept.ok === false, "self-accept rejected");
    assert(
      selfAccept.reasons.some((r) => r.includes("self_acceptance") || r.includes("independent")),
      "reason",
    );

    const sameRev = runSeededDefectReviewRepair({
      defectId: "finding.y",
      summary: "y",
      seededAtRevision: "rev.1",
      independentReviewerId: "r",
      producerId: "p",
      repaired: true,
      newEvidenceRevision: "rev.1",
      producerSelfAccepted: false,
    });
    assert(sameRev.ok === false && sameRev.reasons.some((r) => r.includes("new_evidence")), "same revision refused");
  });

  harness.check("experience-403: AC5 whole-scope retains missing obligations; partial ≠ completed", () => {
    const positive = evaluateExperienceDelivery({ evidence: SEEDED_POSITIVE_FIRST_SESSION });
    assert(positive.missingWholeScopeObligations.length >= 1, "remaining journeys retained");
    assert(positive.missingWholeScopeObligations.includes("return-week-two"), "named remaining journey");
    assert(positive.partialProofClaimsCompletedExperience === false, "partial cannot claim complete");
    const accepted = positive.projections.find((p) => p.projection === "accepted_delivery")!;
    assert(
      accepted.openObligations.some((o) => o.includes("return-week-two") || o.includes("support") || o.includes("share")),
      "open obligations on accepted row",
    );
    const submission = positive.projections.find((p) => p.projection === "submission")!;
    const release = positive.projections.find((p) => p.projection === "release")!;
    assert(submission.satisfied === false && release.satisfied === false, "submission/release distinct");
  });

  harness.check("experience-403: AC6 stale ownership corrected narrowly in quality-lens + eleven-star", () => {
    const quality = readFileSync(QUALITY, "utf8");
    const eleven = readFileSync(ELEVEN, "utf8");
    assert(!/Design Room mutation needs taste/i.test(quality), "legacy Design Room mutation lead removed");
    assert(/DESIGN\.md|accepted design/i.test(quality.slice(0, 500)), "points at DESIGN.md / accepted design");
    assert(!/Use the ladder to mutate the state where it matters/i.test(quality), "legacy mutate-the-state ladder line removed");
    assert(
      /product\.yaml|accepted product truth|DESIGN\.md remains/i.test(quality) || /reducer state changes only through supported/i.test(quality),
      "ownership truth named",
    );
    assert(
      /narrow bug fix|screenshot review|support response|not a prerequisite/i.test(eleven) ||
        /formal.*not.*every task|major-experience|new-product/i.test(eleven),
      "formal exercise scoped",
    );
    assert(!/update reducer-owned state directly|write reducer state yourself/i.test(eleven), "no casual reducer self-write");
    // Preserve existing craft depth
    assert(quality.includes("11-star") || quality.includes("Quality"), "quality depth kept");
    assert(eleven.includes("magical") || eleven.includes("star") || eleven.includes("experience"), "eleven-star depth kept");
  });

  harness.check("experience-403: AC7 D0–D7 + Figma truthfulness + design-to-code fidelity via existing consumers", () => {
    const positive = evaluateExperienceDelivery({ evidence: SEEDED_POSITIVE_FIRST_SESSION });
    for (const stage of CREATIVE_LOOP_STAGES) {
      assert(positive.creativeLoop[stage] === true, `stage ${stage}`);
    }
    assert(positive.figmaHonesty.truthful === true, "unavailable figma truthful");
    assert(positive.figmaHonesty.state === "figma_unavailable", "state recorded");

    const dishonest = evaluateExperienceDelivery({
      evidence: {
        ...SEEDED_POSITIVE_FIRST_SESSION,
        figmaCapability: "figma_read_only",
        figmaEditsClaimed: true,
        inventiveFigmaFileClaimed: false,
      },
    });
    assert(dishonest.figmaHonesty.truthful === false, "read-only edits dishonest");
    assert(dishonest.acceptedAsExperienceDelivery === false, "dishonest figma fails");

    const invented = evaluateExperienceDelivery({
      evidence: {
        ...SEEDED_POSITIVE_FIRST_SESSION,
        inventiveFigmaFileClaimed: true,
      },
    });
    assert(invented.figmaHonesty.truthful === false, "invented file dishonest");

    const exploration = readFileSync(DESIGN_EXPLORATION, "utf8");
    assert(exploration.includes("referenceInspection") && exploration.includes("runtimeComparison"), "process fields");
    assert(exploration.includes("figma-editable") && exploration.includes("figma-unavailable"), "capability enum");

    const cosmetic = evaluateExperienceDelivery({ evidence: SEEDED_NEGATIVE_BOARD_SCAFFOLD });
    assert(cosmetic.negativeControlsTriggered.includes("cosmetic_variants_as_distinct_concepts"), "cosmetic variants rejected");
  });

  harness.check("experience-403: AC8 explicit handoffs + required controls + host-authored preview boundary", () => {
    const audit = readFileSync(AUDIT, "utf8");
    for (const id of EXPERIENCE_403_COORDINATES) {
      assert(audit.includes(id), `handoff ${id}`);
    }
    assert(audit.includes("#402") || audit.includes("402"), "402 named as coordinate-not-rewrite");
    assert(audit.includes("#381") && audit.includes("#383"), "preserve closed increments");

    const positive = evaluateExperienceDelivery({ evidence: SEEDED_POSITIVE_FIRST_SESSION });
    for (const [key, ok] of Object.entries(positive.requiredControls)) {
      assert(ok === true, `control ${key}`);
    }

    const tiny = narrowWorkQualityPath("tiny_fix");
    assert(tiny.formalElevenStarRequired === false && tiny.qualityPrincipleApplies === true, "tiny fix path");
    const staticPage = narrowWorkQualityPath("static_page");
    assert(staticPage.formalElevenStarRequired === false, "static page path");

    const host = hostAuthoredPreviewBoundary({
      hostAuthoredPreviewPresent: true,
      designInputsChanged: true,
      claimedManagedAcceptance: false,
    });
    assert(host.previewSatisfiesNewDesign === false && host.destructiveOverwrite === false, "host preview boundary");
    assert(host.labeledUnacceptedCandidate === true && host.managedAcceptance === false, "unaccepted candidate");

    const mislabel = evaluateExperienceDelivery({
      evidence: {
        ...SEEDED_POSITIVE_FIRST_SESSION,
        hostAuthoredPreviewClaimedAsManagedAcceptance: true,
      },
    });
    assert(mislabel.acceptedAsExperienceDelivery === false, "host preview ≠ managed acceptance");
    assert(mislabel.negativeControlsTriggered.includes("host_authored_preview_as_managed_acceptance"), "host negative");

    const standalone = standaloneReview({
      findings: ["hierarchy weak on first-value screen"],
      implementationPresent: false,
      appliesToRevision: "rev.review.1",
    });
    assert(standalone.fabricatedAcceptance === false && standalone.usefulWithoutImplementation === true, "standalone review");

    const producerSelf = evaluateExperienceDelivery({
      evidence: { ...SEEDED_POSITIVE_FIRST_SESSION, producerAttemptedSelfAcceptance: true },
    });
    assert(producerSelf.acceptedAsExperienceDelivery === false, "producer self-accept fails");
    assert(producerSelf.requiredControls.no_producer_self_acceptance === false, "control flags self-accept");

    const stale = evaluateExperienceDelivery({
      evidence: {
        ...SEEDED_POSITIVE_FIRST_SESSION,
        designChangedAfterEvidence: true,
        evidenceBoundToRevision: SEEDED_POSITIVE_FIRST_SESSION.revision,
      },
    });
    assert(stale.acceptedAsExperienceDelivery === false, "stale proof fails");
    assert(stale.negativeControlsTriggered.includes("stale_proof_after_design_change"), "stale negative");

    const providerErase = evaluateExperienceDelivery({
      evidence: {
        ...SEEDED_POSITIVE_FIRST_SESSION,
        providerHoldErasedLocalObligation: true,
      },
    });
    assert(providerErase.acceptedAsExperienceDelivery === false, "provider hold erase fails");
  });
}
