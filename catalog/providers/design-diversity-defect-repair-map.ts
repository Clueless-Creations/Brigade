/**
 * #526 SQ-14 — AC→evidence map for design diversity / defect diagnosis /
 * targeted repair.
 *
 * Consumes #514+#521+#522+#523. Coordinates #403/#74/#76 (extend #403
 * creative-loop acceptance; do not replace Design Room / visual review /
 * #403 delivery). Does not redo #512–#525. NO_527_IMPL cleared by #527. NO_528_IMPL cleared by #528. NO_529_IMPL cleared by #529. #571 landed. Does not implement #511 closeout or #573.
 * Paper / synthetic fixtures only. No numeric beauty score. No unproven
 * image input. No silent scope reduction. No merged identity. No universal
 * templates. Pareto/confidence ≠ visual review / founder direction.
 */
export const DESIGN_DIVERSITY_MAP_PATH = "catalog/providers/design-diversity-defect-repair-map.ts" as const;
export const DESIGN_DIVERSITY_SERVICE_MODULE = "kernel/services/design-diversity-defect-repair.ts" as const;
export const DESIGN_DIVERSITY_RECIPE_MODULE = "catalog/workflows/design-diversity-defect-repair.ts" as const;
export const DESIGN_DIVERSITY_FIXTURE = "checks/verification/fixtures/design-diversity-defect-repair.fixtures.ts" as const;
export const DESIGN_ACCEPTANCE_FIXTURE = "checks/verification/fixtures/design-acceptance.fixtures.ts" as const;
export const DESIGN_FOUNDATION_FIXTURE = "checks/verification/fixtures/design-foundation-guidance.fixtures.ts" as const;
export const QUALITY_LENS_DOC = "knowledge/design/quality-lens.md" as const;
export const PRODUCT_EXPERIENCE_WORKFLOWS = "catalog/workflows/product-experience.ts" as const;

export const DESIGN_DIVERSITY_ISSUE = "#526" as const;
export const DESIGN_DIVERSITY_EPIC = "#511" as const;
export const DESIGN_DIVERSITY_PLANNING_ID = "SQ-14" as const;
export const DESIGN_DIVERSITY_CONSUMES = ["#514", "#521", "#522", "#523"] as const;
export const DESIGN_DIVERSITY_COORDINATES = ["#403", "#74", "#76"] as const;
export const DESIGN_DIVERSITY_STAMP = "0.221.47" as const;
export const DESIGN_DIVERSITY_BASE_MAIN_SHA = "a988541094194924cd5b0704875e39e42d17a3a2" as const;
export const DESIGN_DIVERSITY_LIVE_NOT_PERFORMED = true as const;
export const DESIGN_DIVERSITY_HOSTED_KEY_OWNER = "CoS→Eduardo" as const;
export const DESIGN_DIVERSITY_IOS_SIM_OOS = true as const;
export const DESIGN_DIVERSITY_NO_NETWORK = true as const;
export const DESIGN_DIVERSITY_NO_NUMERIC_BEAUTY = true as const;
export const DESIGN_DIVERSITY_NO_REPLACE_403 = true as const;
export const DESIGN_DIVERSITY_NO_REPLACE_DESIGN_ROOM = true as const;
export const DESIGN_DIVERSITY_NO_REPLACE_VISUAL_REVIEW = true as const;
export const DESIGN_DIVERSITY_NO_UNPROVEN_IMAGE_INPUT = true as const;
export const DESIGN_DIVERSITY_NO_SILENT_SCOPE_REDUCTION = true as const;
export const DESIGN_DIVERSITY_NO_MERGED_IDENTITY = true as const;
export const DESIGN_DIVERSITY_NO_UNIVERSAL_TEMPLATES = true as const;
export const DESIGN_DIVERSITY_NO_MANDATORY_ANIMATION = true as const;
export const DESIGN_DIVERSITY_NO_SYNTHETIC_AS_DEVICE = true as const;
export const DESIGN_DIVERSITY_NO_526_IMPL = false as const;
export const DESIGN_DIVERSITY_NEXT_AFTER_CLOSE = "#573" as const;

export const DESIGN_DIVERSITY_AC = [
  {
    id: "ac1-inaccessible-cannot-compensate-via-originality",
    acceptance: "An inaccessible candidate cannot compensate by scoring highly on originality.",
    evidence: `${DESIGN_DIVERSITY_FIXTURE} :: AC1`,
    covered: true as const,
  },
  {
    id: "ac2-two-nondominated-directions-survive",
    acceptance: "Two materially different valid directions survive when neither dominates the other.",
    evidence: `${DESIGN_DIVERSITY_FIXTURE} :: AC2`,
    covered: true as const,
  },
  {
    id: "ac3-a11y-repair-preserves-authored-concept",
    acceptance: "A repair of a control/accessibility defect preserves the authored visual concept when feasible.",
    evidence: `${DESIGN_DIVERSITY_FIXTURE} :: AC3`,
    covered: true as const,
  },
  {
    id: "ac4-retains-403-creative-loop-and-fidelity",
    acceptance: "The fixture retains #403 reference-led draft/critique/refinement and source-to-implementation fidelity obligations.",
    evidence: `${DESIGN_DIVERSITY_FIXTURE} :: AC4`,
    covered: true as const,
  },
  {
    id: "ac5-confidence-pareto-not-visual-or-founder-authority",
    acceptance: "No confidence value or Pareto selection substitutes for independent visual review or founder-reserved design direction.",
    evidence: `${DESIGN_DIVERSITY_FIXTURE} :: AC5`,
    covered: true as const,
  },
] as const;

export function designDiversityAcEvidence(): readonly {
  id: string;
  acceptance: string;
  evidence: string;
  covered: boolean;
}[] {
  return DESIGN_DIVERSITY_AC;
}
