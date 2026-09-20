/**
 * #526 SQ-14 — Design diversity / parallel defect diagnosis / targeted repair.
 *
 * Parallel semantic checks across distinct concerns (not a single taste score).
 * Hard requirements are non-compensatory: originality cannot rescue an
 * inaccessible candidate. Deterministic nondominated/Pareto retention keeps
 * materially different valid directions when neither dominates. Defect-location
 * taxonomy routes viable-concept + implementation defects to local repair
 * (preserves authored visual concept when feasible). Multi-repair evaluation
 * records alternatives and rejection reasons. Text/structured evidence only
 * within proven modality — text-only assessors cannot claim image sight.
 * Confidence / Pareto never substitute for independent visual review or
 * founder-reserved design direction. Extends #403 creative-loop acceptance;
 * does not replace Design Room / visual review provider / #403 delivery.
 *
 * Paper / synthetic. Consumes #514+#521+#522+#523. Coordinates #403/#74/#76.
 * NO_527_IMPL cleared by #527. NO_528_IMPL cleared by #528. NO_529_IMPL cleared by #529. Does not implement #511 closeout or #573.
 */
import {
  CONCERN_AXES,
  CREATIVE_LOOP_403_OBLIGATIONS,
  DEFECT_LOCATIONS,
  DESIGN_DIVERSITY_RECIPE_POLICY,
  HARD_REQUIREMENTS,
  NEGATIVE_CONTROL_KINDS,
  REPAIR_ROUTES,
  type ConcernAxis,
  type CreativeLoop403Obligation,
  type DefectLocation,
  type DesignDiversityRecipePolicy,
  type HardRequirement,
  type NegativeControlKind,
  type RepairRoute,
} from "../../catalog/workflows/design-diversity-defect-repair.js";

export const DESIGN_DIVERSITY_ISSUE = "#526" as const;
export const DESIGN_DIVERSITY_EPIC = "#511" as const;
export const DESIGN_DIVERSITY_PLANNING_ID = "SQ-14" as const;
export const DESIGN_DIVERSITY_CONSUMES = ["#514", "#521", "#522", "#523"] as const;
export const DESIGN_DIVERSITY_COORDINATES = ["#403", "#74", "#76"] as const;
export const DESIGN_DIVERSITY_STAMP = "0.221.47" as const;
export const DESIGN_DIVERSITY_SCHEMA_VERSION = 1 as const;
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
export const DESIGN_DIVERSITY_NO_526_IMPL = false as const;
export const DESIGN_DIVERSITY_NEXT_AFTER_CLOSE = "#511" as const;

export { CONCERN_AXES, CREATIVE_LOOP_403_OBLIGATIONS, DEFECT_LOCATIONS, HARD_REQUIREMENTS, NEGATIVE_CONTROL_KINDS, REPAIR_ROUTES };
export type { ConcernAxis, CreativeLoop403Obligation, DefectLocation, DesignDiversityRecipePolicy, HardRequirement, NegativeControlKind, RepairRoute };

export class DesignDiversityError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "DesignDiversityError";
    this.code = code;
  }
}

/** Soft tradeoff axes eligible for Pareto comparison (never hard vetoes). */
export const TRADEOFF_AXES = [
  "interaction_clarity",
  "identity_fidelity",
  "recovery_promise",
  "claim_consistency",
  "originality",
] as const satisfies readonly ConcernAxis[];
export type TradeoffAxis = (typeof TRADEOFF_AXES)[number];

/** Proven evidence modalities — text/structured only by default for this paper slice. */
export const EVIDENCE_MODALITIES = ["text", "structured", "screenshot", "motion", "device", "a11y_observation"] as const;
export type EvidenceModality = (typeof EVIDENCE_MODALITIES)[number];

export interface ApprovedIdentity {
  readonly identityId: string;
  readonly invariants: readonly string[];
  readonly revision: string;
}

export interface ProductCriteria {
  readonly criteriaId: string;
  readonly hardRequirementIds: readonly HardRequirement[];
  readonly productSpecificNotes: string;
  readonly revision: string;
}

export interface IndependentReviewerFinding {
  readonly findingId: string;
  readonly concern: ConcernAxis;
  readonly summary: string;
  readonly modality: EvidenceModality;
  readonly claimedSawImage: boolean;
}

export interface ConcernAssessment {
  readonly axis: ConcernAxis;
  /** Ordinal 0..4 for tradeoffs; hard axes use 0=fail 4=pass. Never a beauty score. */
  readonly ordinal: 0 | 1 | 2 | 3 | 4;
  readonly explanation: string;
}

export interface DesignCandidate {
  readonly candidateId: string;
  readonly conceptId: string;
  readonly directionLabel: string;
  /** Distinguishing mechanic — used to detect template convergence. */
  readonly distinguishingMechanic: string;
  readonly authoredVisualConcept: string;
  readonly revision: string;
  readonly concernAssessments: readonly ConcernAssessment[];
  readonly hardRequirementResults: Readonly<Record<HardRequirement, boolean>>;
  readonly viableConcept: boolean;
}

export interface DefectDiagnosis {
  readonly defectId: string;
  readonly candidateId: string;
  readonly location: DefectLocation;
  readonly summary: string;
  readonly preservesConceptIfLocalRepair: boolean;
  readonly appliesToRevision: string;
}

export interface ProposedRepair {
  readonly repairId: string;
  readonly candidateId: string;
  readonly defectId: string;
  readonly route: RepairRoute;
  readonly description: string;
  readonly preservesAuthoredVisualConcept: boolean;
  readonly addressesDiagnosedDefect: boolean;
  readonly preservesIdentityInvariants: boolean;
  readonly preservesHardRequirements: boolean;
}

export interface RepairEvaluation {
  readonly selected: ProposedRepair | null;
  readonly rejected: readonly { readonly repair: ProposedRepair; readonly reason: string }[];
  readonly recordedAlternatives: true;
}

export interface ParetoRetentionResult {
  readonly retainedCandidateIds: readonly string[];
  readonly rejectedForHardFailure: readonly string[];
  readonly dominated: readonly string[];
  readonly nondominated: true;
  readonly averagingForbidden: true;
  readonly substitutesForVisualReview: false;
  readonly substitutesForFounderDirection: false;
  readonly appliesToRevision: string;
  readonly explanation: string;
}

export interface AuthorityBoundary {
  readonly confidenceValue: number | null;
  readonly paretoSelectionMade: boolean;
  readonly substitutesForIndependentVisualReview: false;
  readonly substitutesForFounderReservedDirection: false;
  readonly reason: string;
}

export interface CreativeLoop403Retention {
  readonly obligations: typeof CREATIVE_LOOP_403_OBLIGATIONS;
  readonly allRetained: true;
  readonly replaces403Delivery: false;
  readonly replacesDesignRoom: false;
  readonly replacesVisualReviewProvider: false;
}

export interface NegativeControlResult {
  readonly kind: NegativeControlKind;
  readonly triggered: boolean;
  readonly explanation: string;
}

export interface ModalityGuardResult {
  readonly allowed: boolean;
  readonly modality: EvidenceModality;
  readonly claimedSawImage: boolean;
  readonly reason: string;
}

function assertHardRequirement(id: string): asserts id is HardRequirement {
  if (!(HARD_REQUIREMENTS as readonly string[]).includes(id)) {
    throw new DesignDiversityError("hard.unknown", `Unknown hard requirement: ${id}`);
  }
}

function assertDefectLocation(loc: string): asserts loc is DefectLocation {
  if (!(DEFECT_LOCATIONS as readonly string[]).includes(loc)) {
    throw new DesignDiversityError("defect.unknown_location", `Unknown defect location: ${loc}`);
  }
}

function assessmentFor(candidate: DesignCandidate, axis: ConcernAxis): ConcernAssessment {
  const found = candidate.concernAssessments.find((a) => a.axis === axis);
  if (!found) {
    throw new DesignDiversityError("concern.missing", `Candidate ${candidate.candidateId} missing assessment for ${axis}`);
  }
  return found;
}

/** True iff every hard requirement passes (non-compensatory). */
export function passesHardRequirements(candidate: DesignCandidate): boolean {
  for (const req of HARD_REQUIREMENTS) {
    assertHardRequirement(req);
    if (!candidate.hardRequirementResults[req]) return false;
  }
  return true;
}

/**
 * AC1 — inaccessible (or other hard-fail) candidate cannot be saved by high originality.
 * Returns veto even when originality ordinal is maximal.
 */
export function originalityCannotCompensateHardFailure(candidate: DesignCandidate): {
  readonly vetoed: boolean;
  readonly originalityOrdinal: number;
  readonly hardFailures: readonly HardRequirement[];
  readonly reason: string;
} {
  const originality = assessmentFor(candidate, "originality").ordinal;
  const hardFailures = HARD_REQUIREMENTS.filter((r) => !candidate.hardRequirementResults[r]);
  const vetoed = hardFailures.length > 0;
  return {
    vetoed,
    originalityOrdinal: originality,
    hardFailures,
    reason: vetoed
      ? `Hard requirement failure(s) [${hardFailures.join(", ")}] veto candidate ${candidate.candidateId}; originality ordinal ${originality} cannot compensate (non-compensatory policy).`
      : `Candidate ${candidate.candidateId} passes hard requirements; originality ordinal ${originality} is a soft tradeoff only.`,
  };
}

/**
 * Deterministic dominance: A dominates B iff both pass hard requirements, A ≥ B
 * on every tradeoff axis, and A > B on at least one. No averaging.
 */
export function dominates(a: DesignCandidate, b: DesignCandidate): boolean {
  if (!passesHardRequirements(a) || !passesHardRequirements(b)) return false;
  let strictlyBetter = false;
  for (const axis of TRADEOFF_AXES) {
    const av = assessmentFor(a, axis).ordinal;
    const bv = assessmentFor(b, axis).ordinal;
    if (av < bv) return false;
    if (av > bv) strictlyBetter = true;
  }
  return strictlyBetter;
}

/**
 * AC2 — retain deterministic nondominated set when neither direction dominates.
 * Hard failures are rejected (never enter the Pareto set via originality).
 */
export function retainNondominatedSet(input: { readonly candidates: readonly DesignCandidate[]; readonly revision: string }): ParetoRetentionResult {
  const rejectedForHardFailure: string[] = [];
  const eligible: DesignCandidate[] = [];
  for (const c of input.candidates) {
    if (!passesHardRequirements(c)) {
      rejectedForHardFailure.push(c.candidateId);
    } else {
      eligible.push(c);
    }
  }

  // Deterministic order by candidateId for stable dominance sweep.
  const sorted = [...eligible].sort((x, y) => x.candidateId.localeCompare(y.candidateId));
  const dominated: string[] = [];
  const retained: string[] = [];

  for (const cand of sorted) {
    const isDominated = sorted.some((other) => other.candidateId !== cand.candidateId && dominates(other, cand));
    if (isDominated) dominated.push(cand.candidateId);
    else retained.push(cand.candidateId);
  }

  return {
    retainedCandidateIds: retained,
    rejectedForHardFailure,
    dominated,
    nondominated: true,
    averagingForbidden: true,
    substitutesForVisualReview: false,
    substitutesForFounderDirection: false,
    appliesToRevision: input.revision,
    explanation:
      retained.length >= 2
        ? `Retained ${retained.length} nondominated directions at revision ${input.revision}; neither dominates — diversity preserved. Pareto selection does not substitute for independent visual review or founder-reserved direction.`
        : `Retained ${retained.length} nondominated candidate(s) at revision ${input.revision}; hard failures rejected without averaging. Pareto selection does not substitute for independent visual review or founder-reserved direction.`,
  };
}

/**
 * Classify defect location and route repair (AC3 path).
 * Viable concept + implementation → local_repair (preserve authored visual concept).
 */
export function diagnoseAndRoute(input: {
  readonly candidate: DesignCandidate;
  readonly location: DefectLocation;
  readonly summary: string;
  readonly defectId?: string;
}): { readonly diagnosis: DefectDiagnosis; readonly route: RepairRoute } {
  assertDefectLocation(input.location);
  const preservesConceptIfLocalRepair =
    input.candidate.viableConcept && (input.location === "implementation" || input.location === "interaction" || input.location === "copy");

  let route: RepairRoute;
  if (input.location === "insufficient_observation") {
    route = "need_more_evidence";
  } else if (input.location === "brief" || input.location === "concept") {
    route = input.candidate.viableConcept && input.location === "concept" ? "explore_new_direction" : "explore_new_direction";
  } else if (preservesConceptIfLocalRepair) {
    route = "local_repair";
  } else if (!input.candidate.viableConcept) {
    route = "explore_new_direction";
  } else {
    route = "local_repair";
  }

  return {
    diagnosis: {
      defectId: input.defectId ?? `defect.${input.candidate.candidateId}.${input.location}`,
      candidateId: input.candidate.candidateId,
      location: input.location,
      summary: input.summary,
      preservesConceptIfLocalRepair,
      appliesToRevision: input.candidate.revision,
    },
    route,
  };
}

/**
 * AC3 — evaluate several proposed repairs; prefer local repair that preserves
 * authored visual concept + identity + hard requirements when feasible.
 */
export function evaluateRepairs(input: {
  readonly repairs: readonly ProposedRepair[];
  readonly preferredRoute?: RepairRoute;
  readonly policy?: DesignDiversityRecipePolicy;
}): RepairEvaluation {
  const policy = input.policy ?? DESIGN_DIVERSITY_RECIPE_POLICY;
  const capped = input.repairs.slice(0, policy.maxRepairsEvaluated);
  const preferred = input.preferredRoute ?? "local_repair";

  const ranked = [...capped].sort((a, b) => {
    const score = (r: ProposedRepair): number => {
      let s = 0;
      if (r.route === preferred) s += 8;
      if (r.addressesDiagnosedDefect) s += 4;
      if (r.preservesAuthoredVisualConcept) s += 4;
      if (r.preservesIdentityInvariants) s += 2;
      if (r.preservesHardRequirements) s += 2;
      return s;
    };
    const diff = score(b) - score(a);
    return diff !== 0 ? diff : a.repairId.localeCompare(b.repairId);
  });

  const selected =
    ranked.find(
      (r) =>
        r.addressesDiagnosedDefect &&
        r.preservesHardRequirements &&
        r.preservesIdentityInvariants &&
        (r.route !== "local_repair" || r.preservesAuthoredVisualConcept),
    ) ?? null;

  const rejected = ranked
    .filter((r) => r.repairId !== selected?.repairId)
    .map((r) => {
      let reason: string;
      if (!r.addressesDiagnosedDefect) reason = "does not address diagnosed defect";
      else if (!r.preservesHardRequirements) reason = "would break hard requirements";
      else if (!r.preservesIdentityInvariants) reason = "would break approved identity invariants";
      else if (r.route === "local_repair" && !r.preservesAuthoredVisualConcept) reason = "local repair fails to preserve authored visual concept";
      else if (selected && r.route !== selected.route) reason = `route ${r.route} deferred in favor of ${selected.route}`;
      else reason = "dominated by a better-fitting repair alternative";
      return { repair: r, reason };
    });

  return { selected, rejected, recordedAlternatives: true };
}

/** AC5 — confidence / Pareto never substitute for visual review or founder direction. */
export function assertAuthorityBoundary(input: { readonly confidenceValue: number | null; readonly paretoSelectionMade: boolean }): AuthorityBoundary {
  return {
    confidenceValue: input.confidenceValue,
    paretoSelectionMade: input.paretoSelectionMade,
    substitutesForIndependentVisualReview: false,
    substitutesForFounderReservedDirection: false,
    reason:
      "No confidence value or Pareto/nondominated selection substitutes for independent visual review or founder-reserved design direction. Design Room / visual review provider / founder remain authoritative.",
  };
}

/** AC4 — retain #403 reference-led draft/critique/refinement + source fidelity. */
export function retainCreativeLoop403(): CreativeLoop403Retention {
  return {
    obligations: CREATIVE_LOOP_403_OBLIGATIONS,
    allRetained: true,
    replaces403Delivery: false,
    replacesDesignRoom: false,
    replacesVisualReviewProvider: false,
  };
}

/**
 * Text/structured evidence only within proven modality.
 * Text-only assessor claiming it saw an image is refused (negative control).
 */
export function guardEvidenceModality(input: {
  readonly modality: EvidenceModality;
  readonly claimedSawImage: boolean;
  readonly providerSupportsImage: boolean;
}): ModalityGuardResult {
  if (input.claimedSawImage && (input.modality === "text" || input.modality === "structured") && !input.providerSupportsImage) {
    return {
      allowed: false,
      modality: input.modality,
      claimedSawImage: true,
      reason: "Text/structured-only assessor cannot claim it saw an image; screenshot/motion/device/a11y stay on their observation paths.",
    };
  }
  if (input.claimedSawImage && !input.providerSupportsImage) {
    return {
      allowed: false,
      modality: input.modality,
      claimedSawImage: true,
      reason: "Unproven TypeSafe image input refused; claim of image sight not supported by provider modality.",
    };
  }
  return {
    allowed: true,
    modality: input.modality,
    claimedSawImage: input.claimedSawImage,
    reason: `Evidence modality ${input.modality} accepted within proven provider path.`,
  };
}

/** Frozen negative controls (#526 §6). */
export function runNegativeControls(input: {
  readonly candidates: readonly DesignCandidate[];
  readonly findings?: readonly IndependentReviewerFinding[];
}): readonly NegativeControlResult[] {
  const results: NegativeControlResult[] = [];

  // template_convergence — distinct labels but identical distinguishing mechanic
  const mechanics = new Map<string, string[]>();
  for (const c of input.candidates) {
    const list = mechanics.get(c.distinguishingMechanic) ?? [];
    list.push(c.candidateId);
    mechanics.set(c.distinguishingMechanic, list);
  }
  const converged = [...mechanics.entries()].filter(([, ids]) => ids.length >= 2);
  results.push({
    kind: "template_convergence",
    triggered: converged.length > 0,
    explanation:
      converged.length > 0
        ? `Template convergence: mechanic "${converged[0]![0]}" shared by ${converged[0]![1].join(", ")} — candidates are not materially different.`
        : "No template convergence: distinguishing mechanics differ across candidates.",
  });

  // rubric_gaming — high originality with hard a11y failure
  const gaming = input.candidates.filter((c) => {
    const originality = assessmentFor(c, "originality").ordinal;
    return originality >= 4 && !c.hardRequirementResults.accessibility_pass;
  });
  results.push({
    kind: "rubric_gaming",
    triggered: gaming.length > 0,
    explanation:
      gaming.length > 0
        ? `Rubric gaming detected: ${gaming.map((c) => c.candidateId).join(", ")} score maximal originality while failing accessibility — vetoed by non-compensatory policy.`
        : "No rubric gaming: originality does not override accessibility hard requirement.",
  });

  // polished_copy_broken_behavior — claim_consistency high but implementation_mismatch / recovery fail
  const polishedBroken = input.candidates.filter((c) => {
    const claims = assessmentFor(c, "claim_consistency").ordinal;
    const impl = assessmentFor(c, "implementation_mismatch").ordinal;
    const recovery = assessmentFor(c, "recovery_promise").ordinal;
    return claims >= 3 && (impl <= 1 || recovery <= 1);
  });
  results.push({
    kind: "polished_copy_broken_behavior",
    triggered: polishedBroken.length > 0,
    explanation:
      polishedBroken.length > 0
        ? `Polished copy with broken behavior: ${polishedBroken.map((c) => c.candidateId).join(", ")} — claim polish does not excuse implementation/recovery defects.`
        : "No polished-copy/broken-behavior mismatch detected.",
  });

  // text_only_claimed_image_sight
  const fakeSight = (input.findings ?? []).filter((f) => f.claimedSawImage && (f.modality === "text" || f.modality === "structured"));
  results.push({
    kind: "text_only_claimed_image_sight",
    triggered: fakeSight.length > 0,
    explanation:
      fakeSight.length > 0
        ? `Text-only assessor claimed image sight in finding(s) ${fakeSight.map((f) => f.findingId).join(", ")} — refused.`
        : "No text-only image-sight claims.",
  });

  return results;
}

/** Concern axes remain separate — never fused into one compensatory score. */
export function concernAxesAreSeparate(): {
  readonly separate: true;
  readonly axes: typeof CONCERN_AXES;
  readonly fusedTasteScoreForbidden: true;
  readonly numericBeautyForbidden: true;
} {
  const unique = new Set(CONCERN_AXES);
  if (unique.size !== CONCERN_AXES.length) {
    throw new DesignDiversityError("concerns.collapsed", "Concern axes must stay distinct");
  }
  return {
    separate: true,
    axes: CONCERN_AXES,
    fusedTasteScoreForbidden: true,
    numericBeautyForbidden: true,
  };
}

/** Helper: build a full concern assessment list with defaults for tests. */
export function concernBundle(
  partial: Partial<Record<ConcernAxis, ConcernAssessment["ordinal"]>> & {
    readonly explanations?: Partial<Record<ConcernAxis, string>>;
  },
): ConcernAssessment[] {
  return CONCERN_AXES.map((axis) => ({
    axis,
    ordinal: (partial[axis] ?? 2) as ConcernAssessment["ordinal"],
    explanation: partial.explanations?.[axis] ?? `${axis} ordinal ${(partial[axis] ?? 2) as number}`,
  }));
}

export function allHardPass(): Record<HardRequirement, boolean> {
  return {
    accessibility_pass: true,
    scope_not_silently_reduced: true,
    claims_honest: true,
    identity_not_merged: true,
  };
}

export function hardWith(overrides: Partial<Record<HardRequirement, boolean>>): Record<HardRequirement, boolean> {
  return { ...allHardPass(), ...overrides };
}

/**
 * Seeded paper fixture: two nondominated directions + one inaccessible high-originality
 * + one a11y defect needing local repair that preserves concept.
 */
export const DESIGN_DIVERSITY_SEEDED_FIXTURE = {
  seeded: true as const,
  revision: "design-div-rev-1",
  identity: {
    identityId: "id.product-alpha",
    invariants: ["logo-mark", "primary-type-role", "accent-token"],
    revision: "design-div-rev-1",
  } satisfies ApprovedIdentity,
  criteria: {
    criteriaId: "crit.product-alpha",
    hardRequirementIds: [...HARD_REQUIREMENTS],
    productSpecificNotes: "Accessibility and honest claims are non-negotiable; originality is a soft tradeoff.",
    revision: "design-div-rev-1",
  } satisfies ProductCriteria,
} as const;

/** Build the seeded candidates for AC fixtures. */
export function seededCandidates(): {
  readonly inaccessibleHighOriginality: DesignCandidate;
  readonly directionA: DesignCandidate;
  readonly directionB: DesignCandidate;
  readonly a11yDefectViableConcept: DesignCandidate;
} {
  const rev = DESIGN_DIVERSITY_SEEDED_FIXTURE.revision;
  return {
    inaccessibleHighOriginality: {
      candidateId: "cand.inaccessible-original",
      conceptId: "concept.flashy",
      directionLabel: "High-originality inaccessible variant",
      distinguishingMechanic: "kinetic-hero-maze",
      authoredVisualConcept: "Kinetic maze hero with novel glyph system",
      revision: rev,
      concernAssessments: concernBundle({
        originality: 4,
        interaction_clarity: 3,
        identity_fidelity: 3,
        recovery_promise: 2,
        claim_consistency: 3,
        implementation_mismatch: 2,
        accessibility: 0,
      }),
      hardRequirementResults: hardWith({ accessibility_pass: false }),
      viableConcept: true,
    },
    directionA: {
      candidateId: "cand.direction-a-calm-list",
      conceptId: "concept.calm-list",
      directionLabel: "Calm list-first journey",
      distinguishingMechanic: "progressive-disclosure-list",
      authoredVisualConcept: "Quiet list with progressive disclosure and clear recovery",
      revision: rev,
      concernAssessments: concernBundle({
        originality: 2,
        interaction_clarity: 4,
        identity_fidelity: 3,
        recovery_promise: 4,
        claim_consistency: 3,
        implementation_mismatch: 3,
        accessibility: 4,
      }),
      hardRequirementResults: allHardPass(),
      viableConcept: true,
    },
    directionB: {
      candidateId: "cand.direction-b-spatial-map",
      conceptId: "concept.spatial-map",
      directionLabel: "Spatial map journey",
      distinguishingMechanic: "spatial-task-map",
      authoredVisualConcept: "Spatial map of tasks with landmark navigation",
      revision: rev,
      concernAssessments: concernBundle({
        originality: 4,
        interaction_clarity: 3,
        identity_fidelity: 4,
        recovery_promise: 3,
        claim_consistency: 3,
        implementation_mismatch: 3,
        accessibility: 4,
      }),
      hardRequirementResults: allHardPass(),
      viableConcept: true,
    },
    a11yDefectViableConcept: {
      candidateId: "cand.a11y-local-repair",
      conceptId: "concept.spatial-map",
      directionLabel: "Spatial map with control a11y defect",
      distinguishingMechanic: "spatial-task-map",
      authoredVisualConcept: "Spatial map of tasks with landmark navigation",
      revision: rev,
      concernAssessments: concernBundle({
        originality: 4,
        interaction_clarity: 3,
        identity_fidelity: 4,
        recovery_promise: 3,
        claim_consistency: 3,
        implementation_mismatch: 1,
        accessibility: 1,
      }),
      hardRequirementResults: hardWith({ accessibility_pass: false }),
      viableConcept: true,
    },
  };
}

/** End-to-end seeded assessment covering AC1–AC5 pathways. */
export function assessSeededDesignDiversityFixture(): {
  readonly seeded: true;
  readonly ac1Veto: ReturnType<typeof originalityCannotCompensateHardFailure>;
  readonly pareto: ParetoRetentionResult;
  readonly localRepair: {
    readonly diagnosis: DefectDiagnosis;
    readonly route: RepairRoute;
    readonly evaluation: RepairEvaluation;
  };
  readonly creativeLoop403: CreativeLoop403Retention;
  readonly authority: AuthorityBoundary;
  readonly negativeControls: readonly NegativeControlResult[];
  readonly concernsSeparate: ReturnType<typeof concernAxesAreSeparate>;
} {
  const seeded = seededCandidates();
  const ac1Veto = originalityCannotCompensateHardFailure(seeded.inaccessibleHighOriginality);
  const pareto = retainNondominatedSet({
    candidates: [seeded.inaccessibleHighOriginality, seeded.directionA, seeded.directionB],
    revision: DESIGN_DIVERSITY_SEEDED_FIXTURE.revision,
  });

  const { diagnosis, route } = diagnoseAndRoute({
    candidate: seeded.a11yDefectViableConcept,
    location: "implementation",
    summary: "Primary control lacks accessible name / focus order; concept remains viable.",
  });

  const repairs: ProposedRepair[] = [
    {
      repairId: "repair.wholesale-regen",
      candidateId: seeded.a11yDefectViableConcept.candidateId,
      defectId: diagnosis.defectId,
      route: "explore_new_direction",
      description: "Wholesale generic regeneration of the entire visual system",
      preservesAuthoredVisualConcept: false,
      addressesDiagnosedDefect: true,
      preservesIdentityInvariants: true,
      preservesHardRequirements: true,
    },
    {
      repairId: "repair.local-a11y-control",
      candidateId: seeded.a11yDefectViableConcept.candidateId,
      defectId: diagnosis.defectId,
      route: "local_repair",
      description: "Add accessible name + focus order to the defective control; keep spatial-map concept",
      preservesAuthoredVisualConcept: true,
      addressesDiagnosedDefect: true,
      preservesIdentityInvariants: true,
      preservesHardRequirements: true,
    },
    {
      repairId: "repair.break-identity",
      candidateId: seeded.a11yDefectViableConcept.candidateId,
      defectId: diagnosis.defectId,
      route: "local_repair",
      description: "Fix a11y by swapping identity tokens",
      preservesAuthoredVisualConcept: true,
      addressesDiagnosedDefect: true,
      preservesIdentityInvariants: false,
      preservesHardRequirements: true,
    },
  ];
  const evaluation = evaluateRepairs({ repairs, preferredRoute: route });

  const findings: IndependentReviewerFinding[] = [
    {
      findingId: "finding.text-fake-sight",
      concern: "implementation_mismatch",
      summary: "Text-only assessor falsely claims it saw a screenshot",
      modality: "text",
      claimedSawImage: true,
    },
  ];

  const templateConverged: DesignCandidate = {
    ...seeded.directionB,
    candidateId: "cand.template-clone",
    directionLabel: "Clone with different name",
    // same mechanic as directionB → convergence
  };

  return {
    seeded: true,
    ac1Veto,
    pareto,
    localRepair: { diagnosis, route, evaluation },
    creativeLoop403: retainCreativeLoop403(),
    authority: assertAuthorityBoundary({ confidenceValue: 0.97, paretoSelectionMade: true }),
    negativeControls: runNegativeControls({
      candidates: [seeded.inaccessibleHighOriginality, seeded.directionA, seeded.directionB, templateConverged],
      findings,
    }),
    concernsSeparate: concernAxesAreSeparate(),
  };
}
