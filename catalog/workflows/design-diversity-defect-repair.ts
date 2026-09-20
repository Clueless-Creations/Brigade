/**
 * #526 SQ-14 — Recipe-owned design-diversity / parallel defect diagnosis /
 * targeted repair policy.
 *
 * Extends #403 creative-loop acceptance: parallel concern checks, non-
 * compensatory hard requirements, deterministic nondominated/Pareto retention,
 * defect-location taxonomy → local repair (not wholesale generic regen).
 * Does NOT replace Design Room / visual review provider / #403 delivery
 * workflow. Does NOT invent a numeric beauty/taste score. Does NOT rewrite
 * catalog/workflows/index.ts. Paper / synthetic. No network. No unproven
 * TypeSafe image input. No silent scope reduction.
 *
 * Consumes #514+#521+#522+#523 (+ #525 tip). Coordinates #403/#74/#76.
 * Does not implement #527–#529.
 */
export const DESIGN_DIVERSITY_RECIPE_ISSUE = "#526" as const;
export const DESIGN_DIVERSITY_RECIPE_EPIC = "#511" as const;
export const DESIGN_DIVERSITY_RECIPE_PLANNING_ID = "SQ-14" as const;
export const DESIGN_DIVERSITY_RECIPE_STAMP = "0.221.47" as const;
export const DESIGN_DIVERSITY_RECIPE_CONSUMES = ["#514", "#521", "#522", "#523"] as const;
export const DESIGN_DIVERSITY_RECIPE_COORDINATES = ["#403", "#74", "#76"] as const;
export const DESIGN_DIVERSITY_RECIPE_NO_DEFAULT_REWRITE = true as const;
export const DESIGN_DIVERSITY_RECIPE_NO_NETWORK = true as const;
export const DESIGN_DIVERSITY_RECIPE_NO_NUMERIC_BEAUTY = true as const;
export const DESIGN_DIVERSITY_RECIPE_NO_REPLACE_403 = true as const;
export const DESIGN_DIVERSITY_RECIPE_NO_REPLACE_DESIGN_ROOM = true as const;
export const DESIGN_DIVERSITY_RECIPE_NO_REPLACE_VISUAL_REVIEW = true as const;
export const DESIGN_DIVERSITY_RECIPE_NO_UNPROVEN_IMAGE_INPUT = true as const;
export const DESIGN_DIVERSITY_RECIPE_NO_SILENT_SCOPE_REDUCTION = true as const;
export const DESIGN_DIVERSITY_RECIPE_NO_MERGED_IDENTITY = true as const;
export const DESIGN_DIVERSITY_RECIPE_NO_UNIVERSAL_TEMPLATES = true as const;
export const DESIGN_DIVERSITY_RECIPE_NO_MANDATORY_ANIMATION = true as const;
export const DESIGN_DIVERSITY_RECIPE_NO_526_IMPL = false as const;
export const DESIGN_DIVERSITY_RECIPE_NEXT_AFTER_CLOSE = "#527" as const;

/** Existing owners this slice composes over (consume — do not replace). */
export const DESIGN_DIVERSITY_OWNER_MODULES = [
  "catalog/workflows/product-experience.ts",
  "knowledge/design/quality-lens.md",
  "tooling/lib/design-taste-rubric.ts",
  "checks/verification/fixtures/design-acceptance.fixtures.ts",
  "checks/verification/fixtures/design-foundation-guidance.fixtures.ts",
  "checks/verification/fixtures/design-worthiness.fixtures.ts",
  "checks/validation/business/design/design-acceptance.ts",
] as const;

/**
 * Parallel concern axes — assessed separately; never fused into one compensatory
 * taste/beauty score. Originality is a soft tradeoff axis and cannot rescue a
 * hard-requirement failure.
 */
export const CONCERN_AXES = [
  "interaction_clarity",
  "identity_fidelity",
  "recovery_promise",
  "claim_consistency",
  "implementation_mismatch",
  "accessibility",
  "originality",
] as const;
export type ConcernAxis = (typeof CONCERN_AXES)[number];

/** Hard requirements — non-compensatory vetoes (AC1). */
export const HARD_REQUIREMENTS = ["accessibility_pass", "scope_not_silently_reduced", "claims_honest", "identity_not_merged"] as const;
export type HardRequirement = (typeof HARD_REQUIREMENTS)[number];

/**
 * Defect location taxonomy (quality-lens aligned; #526 §3).
 * Viable concept + implementation defect → local repair, not generic regen.
 */
export const DEFECT_LOCATIONS = ["brief", "concept", "composition", "copy", "interaction", "implementation", "insufficient_observation"] as const;
export type DefectLocation = (typeof DEFECT_LOCATIONS)[number];

/** Repair routing outcomes. */
export const REPAIR_ROUTES = ["local_repair", "explore_new_direction", "need_more_evidence", "reject"] as const;
export type RepairRoute = (typeof REPAIR_ROUTES)[number];

/** Frozen negative-control kinds (#526 §6). */
export const NEGATIVE_CONTROL_KINDS = ["template_convergence", "rubric_gaming", "polished_copy_broken_behavior", "text_only_claimed_image_sight"] as const;
export type NegativeControlKind = (typeof NEGATIVE_CONTROL_KINDS)[number];

/** #403 creative-loop obligations this fixture must retain (AC4). */
export const CREATIVE_LOOP_403_OBLIGATIONS = ["reference_led_draft", "critique", "refinement", "source_to_implementation_fidelity"] as const;
export type CreativeLoop403Obligation = (typeof CREATIVE_LOOP_403_OBLIGATIONS)[number];

export interface DesignDiversityRecipePolicy {
  readonly mode: "paper";
  readonly concernAxes: typeof CONCERN_AXES;
  readonly hardRequirements: typeof HARD_REQUIREMENTS;
  readonly defectLocations: typeof DEFECT_LOCATIONS;
  readonly creativeLoop403Obligations: typeof CREATIVE_LOOP_403_OBLIGATIONS;
  readonly numericBeautyScore: false;
  readonly replace403: false;
  readonly replaceDesignRoom: false;
  readonly replaceVisualReviewProvider: false;
  readonly unprovenImageInput: false;
  readonly silentScopeReduction: false;
  readonly mergedProductIdentity: false;
  readonly universalDesignTemplates: false;
  readonly mandatoryAnimation: false;
  readonly hardRequirementsCompensatory: false;
  readonly paretoSubstitutesForVisualReview: false;
  readonly confidenceSubstitutesForFounderDirection: false;
  readonly textOnlyMayClaimImageSight: false;
  readonly requireAppliesToRevision: true;
  readonly networkInAssessment: false;
  readonly maxRepairsEvaluated: number;
  readonly ownerModules: readonly (typeof DESIGN_DIVERSITY_OWNER_MODULES)[number][];
}

export const DESIGN_DIVERSITY_RECIPE_POLICY: DesignDiversityRecipePolicy = {
  mode: "paper",
  concernAxes: CONCERN_AXES,
  hardRequirements: HARD_REQUIREMENTS,
  defectLocations: DEFECT_LOCATIONS,
  creativeLoop403Obligations: CREATIVE_LOOP_403_OBLIGATIONS,
  numericBeautyScore: false,
  replace403: false,
  replaceDesignRoom: false,
  replaceVisualReviewProvider: false,
  unprovenImageInput: false,
  silentScopeReduction: false,
  mergedProductIdentity: false,
  universalDesignTemplates: false,
  mandatoryAnimation: false,
  hardRequirementsCompensatory: false,
  paretoSubstitutesForVisualReview: false,
  confidenceSubstitutesForFounderDirection: false,
  textOnlyMayClaimImageSight: false,
  requireAppliesToRevision: true,
  networkInAssessment: false,
  maxRepairsEvaluated: 4,
  ownerModules: [...DESIGN_DIVERSITY_OWNER_MODULES],
};

/** True only if someone wrongly wired this module into the default workflows export. */
export function designDiversityTouchesDefaultIndex(indexSource: string): boolean {
  return indexSource.includes("design-diversity-defect-repair") && /export const workflows\s*=/.test(indexSource);
}
