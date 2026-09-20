/**
 * #403 — Continuous experience-delivery continuity (paper / synthetic).
 *
 * Deterministic residual closeout proving requirement→implementation loss,
 * negative controls, distinct delivery projections, preview≠scope-waiver,
 * first-session journey + seeded-defect review/repair at exact revisions,
 * whole-scope closeout retaining missing obligations, D0–D7 creative-loop
 * with truthful Figma/alternative capability, and required issue controls.
 *
 * Consumes #411/#456/#432/#466. Coordinates #66/#71/#74/#72/#73/#75/#378/#390.
 * Not a taste scorer. Fixture success ≠ claimed design quality or autonomous
 * delivery. No live provider/model run. No npm publish. No Profile steal.
 * No #402 rewrite. No #397 start.
 */
import {
  CREATIVE_LOOP_STAGES,
  DELIVERY_PROJECTIONS,
  EXPERIENCE_403_OWNER_MODULES,
  EXPERIENCE_403_RECIPE_BASE_MAIN_SHA,
  EXPERIENCE_403_RECIPE_CONSUMES,
  EXPERIENCE_403_RECIPE_COORDINATES,
  EXPERIENCE_403_RECIPE_HANDOFF_ALSO,
  EXPERIENCE_403_RECIPE_ISSUE,
  EXPERIENCE_403_RECIPE_NEXT_AFTER_CLOSE,
  EXPERIENCE_403_RECIPE_NO_402_REWRITE,
  EXPERIENCE_403_RECIPE_NO_397_START,
  EXPERIENCE_403_RECIPE_NO_LIVE_PROVIDER,
  EXPERIENCE_403_RECIPE_NO_NETWORK,
  EXPERIENCE_403_RECIPE_NO_NPM_PUBLISH,
  EXPERIENCE_403_RECIPE_NO_NUMERIC_BEAUTY,
  EXPERIENCE_403_RECIPE_NO_PHRASE_GATE,
  EXPERIENCE_403_RECIPE_NO_PROFILE_STEAL,
  EXPERIENCE_403_RECIPE_NO_SCOPE_EXPANDER,
  EXPERIENCE_403_RECIPE_NO_UNIVERSAL_LADDER,
  EXPERIENCE_403_RECIPE_POLICY,
  EXPERIENCE_403_RECIPE_PRESERVE_CLOSED,
  EXPERIENCE_403_RECIPE_PROGRAM,
  EXPERIENCE_403_RECIPE_STAMP,
  EXPERIENCE_403_RECIPE_UNIT,
  EXPERIENCE_NEGATIVE_CONTROLS,
  FIGMA_CAPABILITY_STATES,
  FIRST_SESSION_OBLIGATIONS,
  REQUIRED_CONTROLS,
  type CreativeLoopStage,
  type DeliveryProjection,
  type ExperienceNegativeControl,
  type FigmaCapabilityState,
  type FirstSessionObligation,
  type RequiredControl,
} from "../../catalog/workflows/experience-delivery-continuity.js";

export const EXPERIENCE_403_ISSUE = EXPERIENCE_403_RECIPE_ISSUE;
export const EXPERIENCE_403_PROGRAM = EXPERIENCE_403_RECIPE_PROGRAM;
export const EXPERIENCE_403_UNIT = EXPERIENCE_403_RECIPE_UNIT;
export const EXPERIENCE_403_STAMP = EXPERIENCE_403_RECIPE_STAMP;
export const EXPERIENCE_403_BASE_MAIN_SHA = EXPERIENCE_403_RECIPE_BASE_MAIN_SHA;
export const EXPERIENCE_403_CONSUMES = EXPERIENCE_403_RECIPE_CONSUMES;
export const EXPERIENCE_403_COORDINATES = EXPERIENCE_403_RECIPE_COORDINATES;
export const EXPERIENCE_403_HANDOFF_ALSO = EXPERIENCE_403_RECIPE_HANDOFF_ALSO;
export const EXPERIENCE_403_PRESERVE_CLOSED = EXPERIENCE_403_RECIPE_PRESERVE_CLOSED;
export const EXPERIENCE_403_NEXT_AFTER_CLOSE = EXPERIENCE_403_RECIPE_NEXT_AFTER_CLOSE;
export const EXPERIENCE_403_NO_NETWORK = EXPERIENCE_403_RECIPE_NO_NETWORK;
export const EXPERIENCE_403_NO_NUMERIC_BEAUTY = EXPERIENCE_403_RECIPE_NO_NUMERIC_BEAUTY;
export const EXPERIENCE_403_NO_UNIVERSAL_LADDER = EXPERIENCE_403_RECIPE_NO_UNIVERSAL_LADDER;
export const EXPERIENCE_403_NO_PHRASE_GATE = EXPERIENCE_403_RECIPE_NO_PHRASE_GATE;
export const EXPERIENCE_403_NO_SCOPE_EXPANDER = EXPERIENCE_403_RECIPE_NO_SCOPE_EXPANDER;
export const EXPERIENCE_403_NO_NPM_PUBLISH = EXPERIENCE_403_RECIPE_NO_NPM_PUBLISH;
export const EXPERIENCE_403_NO_PROFILE_STEAL = EXPERIENCE_403_RECIPE_NO_PROFILE_STEAL;
export const EXPERIENCE_403_NO_402_REWRITE = EXPERIENCE_403_RECIPE_NO_402_REWRITE;
export const EXPERIENCE_403_NO_LIVE_PROVIDER = EXPERIENCE_403_RECIPE_NO_LIVE_PROVIDER;
export const EXPERIENCE_403_NO_397_START = EXPERIENCE_403_RECIPE_NO_397_START;
export const EXPERIENCE_403_SCHEMA_VERSION = 1 as const;

export {
  CREATIVE_LOOP_STAGES,
  DELIVERY_PROJECTIONS,
  EXPERIENCE_403_OWNER_MODULES,
  EXPERIENCE_403_RECIPE_POLICY,
  EXPERIENCE_NEGATIVE_CONTROLS,
  FIGMA_CAPABILITY_STATES,
  FIRST_SESSION_OBLIGATIONS,
  REQUIRED_CONTROLS,
};
export type { CreativeLoopStage, DeliveryProjection, ExperienceNegativeControl, FigmaCapabilityState, FirstSessionObligation, RequiredControl };

export class ExperienceDeliveryError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ExperienceDeliveryError";
    this.code = code;
  }
}

/** Synthetic complete-product mandate used to reproduce requirement→implementation loss. */
export interface SyntheticExperienceMandate {
  readonly mandateId: string;
  readonly revision: string;
  readonly firstUseJourney: boolean;
  readonly coreValue: boolean;
  readonly recoveryReturn: boolean;
  readonly supportingSurface: boolean;
  /** Accepted experience requirements still open outside the first-session slice. */
  readonly remainingAcceptedJourneys: readonly string[];
}

export interface SyntheticImplementationEvidence {
  readonly revision: string;
  readonly hasBoard: boolean;
  readonly hasGenericScaffold: boolean;
  readonly onboardingConnectedToCollectedInputs: boolean;
  readonly onboardingProgress: { readonly done: number; readonly total: number };
  readonly promiseReachesFirstValue: boolean;
  readonly identityHierarchyCopyInteractionA11yRecoveryInRunningCode: boolean;
  readonly stateSurvivesSaveRestartReturn: boolean;
  readonly selectedShareFunnelRespectsConsent: boolean | "not_applicable";
  readonly filesAndUnitTestsExist: boolean;
  readonly laterEntries: readonly string[];
  readonly laterWaivesAccepted: boolean;
  readonly producerAttemptedSelfAcceptance: boolean;
  readonly independentReviewPerformed: boolean;
  readonly independentReviewFindingIds: readonly string[];
  readonly repairedFindingIds: readonly string[];
  readonly evidenceBoundToRevision: string;
  readonly designChangedAfterEvidence: boolean;
  readonly providerHoldIds: readonly string[];
  readonly providerHoldErasedLocalObligation: boolean;
  readonly hostAuthoredPreviewPresent: boolean;
  readonly hostAuthoredPreviewClaimedAsManagedAcceptance: boolean;
  readonly userUtteredElevenStar: boolean;
  readonly qualityPrinciplePresentInWorkerEntrypoint: boolean;
  readonly taskKind: "complete_product" | "tiny_fix" | "static_page" | "screenshot_review" | "support_response";
  readonly formalElevenStarExerciseRun: boolean;
  readonly cinematicMotionInventedForStaticPage: boolean;
  readonly figmaCapability: FigmaCapabilityState;
  readonly figmaEditsClaimed: boolean;
  readonly inventiveFigmaFileClaimed: boolean;
  readonly creativeLoopCompleted: Readonly<Record<CreativeLoopStage, boolean>>;
  readonly distinctConceptCount: number;
  readonly cosmeticOnlyVariantCount: number;
  readonly runtimeComparisonPerformed: boolean;
  readonly materialRepairRecaptured: boolean;
}

export interface DeliveryProjectionState {
  readonly projection: DeliveryProjection;
  readonly claimed: boolean;
  readonly satisfied: boolean;
  readonly openObligations: readonly string[];
  readonly explanation: string;
}

export interface PreviewRequestResult {
  readonly presentationTaskChanged: true;
  readonly acceptedDeliveryScopeUnchanged: true;
  readonly openObligationsRetained: readonly string[];
  readonly nextPermittedStep: string;
  readonly hostStopIsBackgroundPromise: false;
  readonly silentScopeReduction: false;
}

export interface ExperienceDeliveryVerdict {
  readonly acceptedAsExperienceDelivery: boolean;
  readonly lossPoints: readonly string[];
  readonly negativeControlsTriggered: readonly ExperienceNegativeControl[];
  readonly projections: readonly DeliveryProjectionState[];
  readonly firstSession: Readonly<Record<FirstSessionObligation, boolean | "not_applicable">>;
  readonly missingWholeScopeObligations: readonly string[];
  readonly partialProofClaimsCompletedExperience: false;
  readonly creativeLoop: Readonly<Record<CreativeLoopStage, boolean>>;
  readonly figmaHonesty: { readonly state: FigmaCapabilityState; readonly truthful: boolean; readonly reason: string };
  readonly requiredControls: Readonly<Record<RequiredControl, boolean>>;
  readonly appliesToRevision: string;
  readonly claimsImprovedDesignQuality: false;
  readonly claimsAutonomousDelivery: false;
  readonly liveProviderRun: false;
}

export interface SeededDefectCase {
  readonly defectId: string;
  readonly summary: string;
  readonly seededAtRevision: string;
  readonly independentReviewerId: string;
  readonly producerId: string;
  readonly repaired: boolean;
  readonly newEvidenceRevision: string | null;
  readonly producerSelfAccepted: boolean;
}

export interface IndependentReviewOutcome {
  readonly findingIds: readonly string[];
  readonly fabricatedAcceptance: false;
  readonly usefulWithoutImplementation: boolean;
  readonly appliesToRevision: string;
}

const POSITIVE_MANDATE: SyntheticExperienceMandate = {
  mandateId: "synth.complete-product.first-session",
  revision: "rev.mandate.1",
  firstUseJourney: true,
  coreValue: true,
  recoveryReturn: true,
  supportingSurface: true,
  remainingAcceptedJourneys: ["return-week-two", "support-recovery-path", "share-when-selected"],
};

/** Seeded negative control: board + scaffold + disconnected onboarding. */
export const SEEDED_NEGATIVE_BOARD_SCAFFOLD: SyntheticImplementationEvidence = {
  revision: "rev.impl.board-scaffold.1",
  hasBoard: true,
  hasGenericScaffold: true,
  onboardingConnectedToCollectedInputs: false,
  onboardingProgress: { done: 0, total: 23 },
  promiseReachesFirstValue: false,
  identityHierarchyCopyInteractionA11yRecoveryInRunningCode: false,
  stateSurvivesSaveRestartReturn: false,
  selectedShareFunnelRespectsConsent: "not_applicable",
  filesAndUnitTestsExist: true,
  laterEntries: ["onboarding", "recovery", "share"],
  laterWaivesAccepted: false,
  producerAttemptedSelfAcceptance: false,
  independentReviewPerformed: false,
  independentReviewFindingIds: [],
  repairedFindingIds: [],
  evidenceBoundToRevision: "rev.impl.board-scaffold.1",
  designChangedAfterEvidence: false,
  providerHoldIds: [],
  providerHoldErasedLocalObligation: false,
  hostAuthoredPreviewPresent: true,
  hostAuthoredPreviewClaimedAsManagedAcceptance: false,
  userUtteredElevenStar: false,
  qualityPrinciplePresentInWorkerEntrypoint: true,
  taskKind: "complete_product",
  formalElevenStarExerciseRun: false,
  cinematicMotionInventedForStaticPage: false,
  figmaCapability: "figma_unavailable",
  figmaEditsClaimed: false,
  inventiveFigmaFileClaimed: false,
  creativeLoopCompleted: {
    d0_map_existing_owners: true,
    d1_inspect_references: true,
    d2_tangible_draft_critique: false,
    d3_visual_refinement_figma_or_alternative: false,
    d4_ai_creative_exploration: false,
    d5_lock_revision_bound_target: false,
    d6_faithful_implementation_compare: false,
    d7_regression_handoff_evidence: false,
  },
  distinctConceptCount: 0,
  cosmeticOnlyVariantCount: 3,
  runtimeComparisonPerformed: false,
  materialRepairRecaptured: false,
};

/** Positive target: wired first-session with honest holds for remaining journeys. */
export const SEEDED_POSITIVE_FIRST_SESSION: SyntheticImplementationEvidence = {
  revision: "rev.impl.first-session.2",
  hasBoard: true,
  hasGenericScaffold: false,
  onboardingConnectedToCollectedInputs: true,
  onboardingProgress: { done: 23, total: 23 },
  promiseReachesFirstValue: true,
  identityHierarchyCopyInteractionA11yRecoveryInRunningCode: true,
  stateSurvivesSaveRestartReturn: true,
  selectedShareFunnelRespectsConsent: true,
  filesAndUnitTestsExist: true,
  laterEntries: [],
  laterWaivesAccepted: false,
  producerAttemptedSelfAcceptance: false,
  independentReviewPerformed: true,
  independentReviewFindingIds: ["finding.seeded.wiring"],
  repairedFindingIds: ["finding.seeded.wiring"],
  evidenceBoundToRevision: "rev.impl.first-session.2",
  designChangedAfterEvidence: false,
  providerHoldIds: ["provider.share.analytics"],
  providerHoldErasedLocalObligation: false,
  hostAuthoredPreviewPresent: true,
  hostAuthoredPreviewClaimedAsManagedAcceptance: false,
  userUtteredElevenStar: false,
  qualityPrinciplePresentInWorkerEntrypoint: true,
  taskKind: "complete_product",
  formalElevenStarExerciseRun: true,
  cinematicMotionInventedForStaticPage: false,
  figmaCapability: "figma_unavailable",
  figmaEditsClaimed: false,
  inventiveFigmaFileClaimed: false,
  creativeLoopCompleted: {
    d0_map_existing_owners: true,
    d1_inspect_references: true,
    d2_tangible_draft_critique: true,
    d3_visual_refinement_figma_or_alternative: true,
    d4_ai_creative_exploration: true,
    d5_lock_revision_bound_target: true,
    d6_faithful_implementation_compare: true,
    d7_regression_handoff_evidence: true,
  },
  distinctConceptCount: 3,
  cosmeticOnlyVariantCount: 0,
  runtimeComparisonPerformed: true,
  materialRepairRecaptured: true,
};

function assertRevision(revision: string): void {
  if (!revision.trim()) throw new ExperienceDeliveryError("revision.empty", "Evidence must bind to a non-empty revision.");
}

function figmaHonesty(evidence: SyntheticImplementationEvidence): { state: FigmaCapabilityState; truthful: boolean; reason: string } {
  if (evidence.inventiveFigmaFileClaimed) {
    return { state: evidence.figmaCapability, truthful: false, reason: "Invented Figma file/asset claim is dishonest." };
  }
  if (evidence.figmaEditsClaimed && (evidence.figmaCapability === "figma_unavailable" || evidence.figmaCapability === "figma_read_only")) {
    return {
      state: evidence.figmaCapability,
      truthful: false,
      reason: "Claimed Figma edits without editable authorized route.",
    };
  }
  if (evidence.figmaCapability === "unauthorized_generation_refused" && evidence.figmaEditsClaimed) {
    return { state: evidence.figmaCapability, truthful: false, reason: "Unauthorized generation was refused but edits were still claimed." };
  }
  return {
    state: evidence.figmaCapability,
    truthful: true,
    reason:
      evidence.figmaCapability === "figma_unavailable" || evidence.figmaCapability === "figma_read_only"
        ? "Figma unavailable/read-only stated; refinement continued on supported visual/code route without inventing files."
        : "Figma capability matches claimed use.",
  };
}

function requiredControls(evidence: SyntheticImplementationEvidence, deliveryAccepted: boolean): Record<RequiredControl, boolean> {
  const incompleteOnboarding =
    evidence.taskKind === "complete_product" &&
    (evidence.onboardingProgress.done < evidence.onboardingProgress.total || !evidence.onboardingConnectedToCollectedInputs);
  return {
    user_never_says_eleven_star_principle_present: !evidence.userUtteredElevenStar && evidence.qualityPrinciplePresentInWorkerEntrypoint,
    tiny_fix_path_no_full_ladder: evidence.taskKind !== "tiny_fix" || !evidence.formalElevenStarExerciseRun,
    static_page_clarity_without_cinematic_motion: evidence.taskKind !== "static_page" || !evidence.cinematicMotionInventedForStaticPage,
    // Fail-closed: incomplete/disconnected onboarding must not yield accepted delivery.
    missing_onboarding_fail_closed: !incompleteOnboarding || !deliveryAccepted,
    preview_no_silent_scope_cut: !evidence.laterWaivesAccepted,
    provider_hold_preserves_obligation: !evidence.providerHoldErasedLocalObligation,
    stale_proof_on_change: !(evidence.designChangedAfterEvidence && evidence.evidenceBoundToRevision === evidence.revision),
    no_producer_self_acceptance: !evidence.producerAttemptedSelfAcceptance,
    standalone_review_without_fabricated_acceptance: true,
  };
}

/** Evaluate whether implementation satisfies experience-delivery acceptance for the mandate. */
export function evaluateExperienceDelivery(input: {
  readonly mandate?: SyntheticExperienceMandate;
  readonly evidence: SyntheticImplementationEvidence;
}): ExperienceDeliveryVerdict {
  const mandate = input.mandate ?? POSITIVE_MANDATE;
  assertRevision(input.evidence.revision);
  assertRevision(input.evidence.evidenceBoundToRevision);

  const lossPoints: string[] = [];
  const negatives: ExperienceNegativeControl[] = [];

  if (input.evidence.hasBoard && input.evidence.hasGenericScaffold && !input.evidence.onboardingConnectedToCollectedInputs) {
    lossPoints.push("requirement_to_implementation_loss:board_scaffold_disconnected_onboarding");
    negatives.push("board_scaffold_disconnected_onboarding");
  }
  if (input.evidence.onboardingProgress.done === 0 && input.evidence.onboardingProgress.total > 0 && input.evidence.hasBoard) {
    negatives.push("polished_screenshots_missing_onboarding");
    lossPoints.push("onboarding_not_delivered");
  }
  if (input.evidence.laterWaivesAccepted) {
    negatives.push("later_waives_accepted_requirement");
    lossPoints.push("later_waiver");
  }
  if (input.evidence.producerAttemptedSelfAcceptance) {
    negatives.push("producer_self_acceptance");
    lossPoints.push("producer_self_acceptance");
  }
  if (input.evidence.hostAuthoredPreviewClaimedAsManagedAcceptance) {
    negatives.push("host_authored_preview_as_managed_acceptance");
    lossPoints.push("host_authored_preview_mislabeled");
  }
  if (input.evidence.designChangedAfterEvidence && input.evidence.evidenceBoundToRevision !== input.evidence.revision) {
    // expected stale handling — not a negative if proof is marked stale; negative if still claimed current
  }
  if (input.evidence.designChangedAfterEvidence && input.evidence.evidenceBoundToRevision === input.evidence.revision) {
    negatives.push("stale_proof_after_design_change");
    lossPoints.push("stale_proof_still_current");
  }
  if (input.evidence.providerHoldErasedLocalObligation) {
    negatives.push("provider_hold_erases_local_obligation");
    lossPoints.push("provider_hold_erased_obligation");
  }
  if (input.evidence.cosmeticOnlyVariantCount >= 3 && input.evidence.distinctConceptCount < 3 && input.evidence.taskKind === "complete_product") {
    negatives.push("cosmetic_variants_as_distinct_concepts");
    lossPoints.push("distinct_concept_requirement_unmet");
  }
  if (!input.evidence.promiseReachesFirstValue) lossPoints.push("promise_not_reaching_first_value");
  if (!input.evidence.identityHierarchyCopyInteractionA11yRecoveryInRunningCode) lossPoints.push("accepted_experience_not_in_running_code");
  if (!input.evidence.stateSurvivesSaveRestartReturn) lossPoints.push("persistence_not_wired");

  const firstSession: Record<FirstSessionObligation, boolean | "not_applicable"> = {
    promise_to_first_value: input.evidence.promiseReachesFirstValue,
    onboarding_wiring: input.evidence.onboardingConnectedToCollectedInputs,
    identity_hierarchy_copy_interaction_a11y_recovery: input.evidence.identityHierarchyCopyInteractionA11yRecoveryInRunningCode,
    save_restart_return: input.evidence.stateSurvivesSaveRestartReturn,
    selected_share_funnel_with_consent: input.evidence.selectedShareFunnelRespectsConsent,
    preview_preserves_mandate: !input.evidence.laterWaivesAccepted && !input.evidence.hostAuthoredPreviewClaimedAsManagedAcceptance,
    seeded_defect_independent_review_repair:
      input.evidence.independentReviewPerformed &&
      input.evidence.independentReviewFindingIds.every((id) => input.evidence.repairedFindingIds.includes(id)) &&
      input.evidence.evidenceBoundToRevision === input.evidence.revision &&
      input.evidence.materialRepairRecaptured,
  };

  const missingWholeScope = [...mandate.remainingAcceptedJourneys];
  // Partial first-session proof must not erase remaining obligations.
  const projections: DeliveryProjectionState[] = DELIVERY_PROJECTIONS.map((projection) => {
    switch (projection) {
      case "runnable_preview":
        return {
          projection,
          claimed: input.evidence.hasBoard || input.evidence.hasGenericScaffold || input.evidence.hostAuthoredPreviewPresent,
          satisfied: input.evidence.hasBoard || input.evidence.hasGenericScaffold || input.evidence.hostAuthoredPreviewPresent,
          openObligations: lossPoints,
          explanation: "Runnable preview may exist without completing accepted delivery.",
        };
      case "current_review_candidate":
        return {
          projection,
          claimed: input.evidence.independentReviewPerformed,
          satisfied: input.evidence.independentReviewPerformed && input.evidence.runtimeComparisonPerformed,
          openObligations: lossPoints,
          explanation: "Review candidate requires inspectable runtime comparison, not board alone.",
        };
      case "accepted_delivery": {
        const firstSessionOk = Object.values(firstSession).every((v) => v === true || v === "not_applicable");
        const creativeOk = CREATIVE_LOOP_STAGES.every((s) => input.evidence.creativeLoopCompleted[s]);
        const honesty = figmaHonesty(input.evidence);
        const accepted =
          firstSessionOk &&
          creativeOk &&
          honesty.truthful &&
          negatives.length === 0 &&
          !input.evidence.producerAttemptedSelfAcceptance &&
          input.evidence.evidenceBoundToRevision === input.evidence.revision &&
          !input.evidence.designChangedAfterEvidence;
        return {
          projection,
          claimed: accepted,
          satisfied: accepted,
          openObligations: accepted ? missingWholeScope : [...lossPoints, ...missingWholeScope],
          explanation: accepted
            ? "First-session experience delivery accepted; remaining journeys retained as open whole-scope obligations."
            : "Experience-delivery acceptance refused; open obligations retained.",
        };
      }
      case "submission_readiness":
        return {
          projection,
          claimed: false,
          satisfied: false,
          openObligations: ["submission_readiness_out_of_scope_for_403_fixture"],
          explanation: "Submission readiness remains a separate claim from accepted delivery.",
        };
      case "submission":
        return {
          projection,
          claimed: false,
          satisfied: false,
          openObligations: ["submission_out_of_scope"],
          explanation: "Store submission is not experience-delivery acceptance.",
        };
      case "release":
        return {
          projection,
          claimed: false,
          satisfied: false,
          openObligations: ["release_out_of_scope"],
          explanation: "Release is not experience-delivery acceptance.",
        };
    }
  });

  const acceptedProjection = projections.find((p) => p.projection === "accepted_delivery")!;
  const honesty = figmaHonesty(input.evidence);
  const controls = requiredControls(input.evidence, acceptedProjection.satisfied);

  return {
    acceptedAsExperienceDelivery: acceptedProjection.satisfied,
    lossPoints,
    negativeControlsTriggered: negatives,
    projections,
    firstSession,
    missingWholeScopeObligations: missingWholeScope,
    partialProofClaimsCompletedExperience: false,
    creativeLoop: { ...input.evidence.creativeLoopCompleted },
    figmaHonesty: honesty,
    requiredControls: controls,
    appliesToRevision: input.evidence.revision,
    claimsImprovedDesignQuality: false,
    claimsAutonomousDelivery: false,
    liveProviderRun: false,
  };
}

/** Preview / "show me" changes presentation task only. */
export function handlePreviewRequest(input: { readonly openObligations: readonly string[]; readonly nextPermittedStep: string }): PreviewRequestResult {
  return {
    presentationTaskChanged: true,
    acceptedDeliveryScopeUnchanged: true,
    openObligationsRetained: [...input.openObligations],
    nextPermittedStep: input.nextPermittedStep,
    hostStopIsBackgroundPromise: false,
    silentScopeReduction: false,
  };
}

/** Later may sequence work but cannot waive accepted requirements. */
export function laterCannotWaive(
  acceptedRequirementIds: readonly string[],
  laterEntries: readonly string[],
): {
  readonly waived: readonly string[];
  readonly refused: true;
  readonly explanation: string;
} {
  const overlap = acceptedRequirementIds.filter((id) => laterEntries.includes(id));
  return {
    waived: [],
    refused: true,
    explanation:
      overlap.length > 0
        ? `Later entries ${overlap.join(", ")} sequence work but do not waive accepted requirements; use authorized product/change path for scope reduction.`
        : "Later sequencing does not waive accepted requirements.",
  };
}

/** Seeded defect → independent review → repair → new evidence at exact revision. */
export function runSeededDefectReviewRepair(input: SeededDefectCase): {
  readonly ok: boolean;
  readonly independent: true;
  readonly evidenceRevision: string | null;
  readonly reasons: readonly string[];
} {
  const reasons: string[] = [];
  if (input.producerId === input.independentReviewerId) reasons.push("producer_cannot_be_independent_reviewer");
  if (input.producerSelfAccepted) reasons.push("producer_self_acceptance_rejected");
  if (!input.repaired) reasons.push("defect_not_repaired");
  if (input.repaired && (!input.newEvidenceRevision || input.newEvidenceRevision === input.seededAtRevision)) {
    reasons.push("repair_requires_new_evidence_at_changed_revision");
  }
  return {
    ok: reasons.length === 0,
    independent: true,
    evidenceRevision: input.newEvidenceRevision,
    reasons,
  };
}

/** Standalone review yields findings without fabricated acceptance. */
export function standaloneReview(input: {
  readonly findings: readonly string[];
  readonly implementationPresent: boolean;
  readonly appliesToRevision: string;
}): IndependentReviewOutcome {
  assertRevision(input.appliesToRevision);
  return {
    findingIds: [...input.findings],
    fabricatedAcceptance: false,
    usefulWithoutImplementation: input.findings.length > 0,
    appliesToRevision: input.appliesToRevision,
  };
}

/** Host-authored preview vs managed acceptance control. */
export function hostAuthoredPreviewBoundary(input: {
  readonly hostAuthoredPreviewPresent: boolean;
  readonly designInputsChanged: boolean;
  readonly claimedManagedAcceptance: boolean;
}): {
  readonly previewSatisfiesNewDesign: false;
  readonly destructiveOverwrite: false;
  readonly labeledUnacceptedCandidate: boolean;
  readonly managedAcceptance: false;
  readonly explanation: string;
} {
  if (input.claimedManagedAcceptance) {
    return {
      previewSatisfiesNewDesign: false,
      destructiveOverwrite: false,
      labeledUnacceptedCandidate: false,
      managedAcceptance: false,
      explanation: "Host-authored preview cannot become managed acceptance; resume via authoring/adoption/verification.",
    };
  }
  return {
    previewSatisfiesNewDesign: false,
    destructiveOverwrite: false,
    labeledUnacceptedCandidate: input.hostAuthoredPreviewPresent,
    managedAcceptance: false,
    explanation: input.designInputsChanged
      ? "Existing host preview neither silently satisfies changed design nor is destructively overwritten."
      : "Host-authored exploratory preview remains unaccepted candidate work.",
  };
}

/** Tiny fix / static page / narrow work must not require formal 11-star exercise. */
export function narrowWorkQualityPath(taskKind: SyntheticImplementationEvidence["taskKind"]): {
  readonly formalElevenStarRequired: boolean;
  readonly qualityPrincipleApplies: boolean;
  readonly explanation: string;
} {
  const narrow = taskKind === "tiny_fix" || taskKind === "static_page" || taskKind === "screenshot_review" || taskKind === "support_response";
  return {
    formalElevenStarRequired: false,
    qualityPrincipleApplies: true,
    explanation: narrow
      ? "Narrow work carries the standing quality principle without a formal 11-star exercise or broad research."
      : "Complete-product / major-experience work may use the formal exploration via existing workflow; still not a phrase gate.",
  };
}

export function deliveryProjectionsAreDistinct(): boolean {
  return new Set(DELIVERY_PROJECTIONS).size === DELIVERY_PROJECTIONS.length && DELIVERY_PROJECTIONS.length === 6;
}

export function positiveTargetAndNegativeControlsFrozen(): {
  readonly positiveMandateId: string;
  readonly negativeControl: typeof SEEDED_NEGATIVE_BOARD_SCAFFOLD;
  readonly positiveEvidence: typeof SEEDED_POSITIVE_FIRST_SESSION;
} {
  return {
    positiveMandateId: POSITIVE_MANDATE.mandateId,
    negativeControl: SEEDED_NEGATIVE_BOARD_SCAFFOLD,
    positiveEvidence: SEEDED_POSITIVE_FIRST_SESSION,
  };
}
