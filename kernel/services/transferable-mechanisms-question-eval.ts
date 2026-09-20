/**
 * #528 SQ-16 — Transferable product mechanisms + semantic question evaluation.
 *
 * Lesson schema: context, intervention, observed result, counterconditions,
 * measurement contract, source revisions. Comparability gates via existing
 * metric owner (reject incompatible population/window/exposure/revision/unit/
 * assignment). Candidate questions may only use features from artifacts at
 * exposure time (later postmortems / leaked outcomes → leakage reject).
 * Holdout/baseline/ablation evaluation; association ≠ causal; small-n /
 * multiple-testing discipline. Promote via reviewed versioned contribution
 * resources; keep rejected/inconclusive; proposing model never creates success
 * labels or updates active policy. Candidate Q inactive until reviewed into
 * pinned composition; no private payload crosses workspace scope implicitly.
 *
 * Paper / synthetic. Consumes #514+#519+#521+#520+#522+#523.
 * Coordinates #75/#74. NO_529_IMPL cleared by #529. #571 landed. #573 landed. epic 511 remains open. Does not implement #574 architecture as product code.
 */
import { compareObservations, type MeasurementCatalog, type MetricContractDefinition } from "../operating-model/measurement.js";
import type { ObservationRecord } from "../operating-model/types.js";
import {
  FEATURE_SOURCE_KINDS,
  LESSON_FIELDS,
  TRANSFERABLE_MECHANISMS_RECIPE_POLICY,
  type CandidateQuestionStatus,
  type EvalClaimKind,
  type FeatureSourceKind,
  type TransferDecision,
  type TransferableMechanismsRecipePolicy,
} from "../../catalog/workflows/transferable-mechanisms-question-eval.js";

export const TRANSFERABLE_MECHANISMS_ISSUE = "#528" as const;
export const TRANSFERABLE_MECHANISMS_EPIC = "#511" as const;
export const TRANSFERABLE_MECHANISMS_PLANNING_ID = "SQ-16" as const;
export const TRANSFERABLE_MECHANISMS_CONSUMES = ["#514", "#519", "#521", "#520", "#522", "#523"] as const;
export const TRANSFERABLE_MECHANISMS_COORDINATES = ["#75", "#74"] as const;
export const TRANSFERABLE_MECHANISMS_STAMP = "0.221.49" as const;
export const TRANSFERABLE_MECHANISMS_SCHEMA_VERSION = 1 as const;
export const TRANSFERABLE_MECHANISMS_NO_NETWORK = true as const;
export const TRANSFERABLE_MECHANISMS_NO_CROSS_WORKSPACE_CUSTOMER_POOL = true as const;
export const TRANSFERABLE_MECHANISMS_NO_NEW_EXPERIMENT_OWNER = true as const;
export const TRANSFERABLE_MECHANISMS_NO_AUTONOMOUS_POLICY_MUTATION = true as const;
export const TRANSFERABLE_MECHANISMS_NO_CAUSAL_GROWTH_PROMISES = true as const;
export const TRANSFERABLE_MECHANISMS_NO_PORTFOLIO_RANK_FROM_INCOMPARABLE = true as const;
export const TRANSFERABLE_MECHANISMS_NO_SHARED_VISUAL_TEMPLATE = true as const;
export const TRANSFERABLE_MECHANISMS_NO_NEW_EXPERIMENT_ASSIGNMENT = true as const;
export const TRANSFERABLE_MECHANISMS_NO_AUTO_REWRITE_MEASUREMENT_POLICY = true as const;
export const TRANSFERABLE_MECHANISMS_ANALOGY_IS_NOT_IDENTITY = true as const;
export const TRANSFERABLE_MECHANISMS_ASSOCIATION_IS_NOT_CAUSAL = true as const;
export const TRANSFERABLE_MECHANISMS_SESSIONS_ARE_NOT_PRODUCTS = true as const;
export const TRANSFERABLE_MECHANISMS_NO_528_IMPL = false as const;
export const TRANSFERABLE_MECHANISMS_NEXT_AFTER_CLOSE = "#574" as const;

export { FEATURE_SOURCE_KINDS, LESSON_FIELDS, TRANSFERABLE_MECHANISMS_RECIPE_POLICY };
export type { CandidateQuestionStatus, EvalClaimKind, FeatureSourceKind, TransferDecision, TransferableMechanismsRecipePolicy };

export class TransferableMechanismsError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "TransferableMechanismsError";
    this.code = code;
  }
}

export interface MeasurementContractRef {
  readonly definitionId: string;
  readonly revision: number;
  readonly units: string;
  readonly population: string;
  readonly windowLabel: string;
  readonly exposureRule: string;
  readonly assignmentUnit: string;
}

export interface ProductMechanismLesson {
  readonly lessonId: string;
  readonly mechanismKey: string;
  readonly context: string;
  readonly intervention: string;
  readonly observedResult: string;
  readonly counterconditions: readonly string[];
  readonly measurementContract: MeasurementContractRef;
  readonly sourceRevisions: readonly string[];
  readonly productId: string;
  readonly independentObservation: boolean;
  readonly syntheticLabeled: boolean;
}

export interface FeatureCandidate {
  readonly featureId: string;
  readonly label: string;
  readonly sourceKind: FeatureSourceKind;
  readonly artifactRevisionAtExposure: string;
  readonly artifactAvailableAtExposure: boolean;
  readonly derivedFromPostmortemAfterOutcome: boolean;
  readonly leakedOutcomeLabel: boolean;
  readonly workspaceId: string;
}

export interface FeatureGateResult {
  readonly featureId: string;
  readonly accepted: boolean;
  readonly reason: string;
  readonly leakage: boolean;
}

export interface ProductExampleCensus {
  readonly productId: string;
  readonly sessionCount: number;
  readonly independentProductExampleCount: 1;
  readonly sessionsPresentedAsIndependentProducts: false;
  readonly note: string;
}

export interface TransferAttempt {
  readonly attemptId: string;
  readonly sourceLessonId: string;
  readonly targetContext: string;
  readonly structuralAnalogy: boolean;
  readonly incompatibleContextKeys: readonly string[];
  readonly matchedCounterconditions: readonly string[];
}

export interface TransferAssessment {
  readonly attemptId: string;
  readonly decision: TransferDecision;
  readonly automaticReuse: false;
  readonly reason: string;
  readonly counterconditions: readonly string[];
}

export interface ComparativeClaimInput {
  readonly claimId: string;
  readonly left: ObservationRecord;
  readonly right: ObservationRecord;
  readonly catalog: MeasurementCatalog;
  readonly attribution: "known" | "unknown";
  readonly populationCompatible: boolean;
  readonly exposureCompatible: boolean;
  readonly assignmentCompatible: boolean;
}

export interface ComparativeClaimResult {
  readonly claimId: string;
  readonly allowed: boolean;
  readonly reasonCodes: readonly string[];
  readonly reason: string;
  readonly measurementStatus: string;
}

export interface CandidateSemanticQuestion {
  readonly questionId: string;
  readonly prompt: string;
  readonly featureIds: readonly string[];
  readonly usefulHeuristic: boolean;
  readonly workspaceId: string;
  readonly privatePayload: boolean;
}

export interface QuestionPromotionRecord {
  readonly questionId: string;
  readonly status: CandidateQuestionStatus;
  readonly reviewed: boolean;
  readonly includedInPinnedComposition: boolean;
  readonly pinnedCompositionId: string | null;
  readonly contributionResourceId: string | null;
  readonly contributionVersion: number | null;
  readonly proposingModelCreatedSuccessLabel: false;
  readonly proposingModelUpdatedActivePolicy: false;
  readonly privatePayloadCrossedWorkspace: false;
  readonly retainedRejectedOrInconclusive: boolean;
}

export interface EvalProtocol {
  readonly holdout: true;
  readonly baseline: true;
  readonly ablation: true;
  readonly claimKind: EvalClaimKind;
  readonly smallNGuard: true;
  readonly multipleTestingGuard: true;
  readonly independentOutcomesOnly: true;
}

export interface AuthorityBoundary {
  readonly autonomousPolicyMutation: false;
  readonly causalGrowthPromise: false;
  readonly newExperimentOwner: false;
  readonly newExperimentAssignment: false;
  readonly crossWorkspaceCustomerPool: false;
  readonly portfolioRankFromIncomparable: false;
  readonly autoRewriteMeasurementPolicy: false;
  readonly sharedVisualTemplate: false;
  readonly reason: string;
}

export interface TransferableMechanismsResult {
  readonly lessons: readonly ProductMechanismLesson[];
  readonly featureGates: readonly FeatureGateResult[];
  readonly census: readonly ProductExampleCensus[];
  readonly transfers: readonly TransferAssessment[];
  readonly comparativeClaims: readonly ComparativeClaimResult[];
  readonly promotions: readonly QuestionPromotionRecord[];
  readonly evalProtocol: EvalProtocol;
  readonly authority: AuthorityBoundary;
  readonly networkCalls: 0;
}

export function gateFeatureAtExposure(feature: FeatureCandidate): FeatureGateResult {
  if (feature.sourceKind === "later_postmortem" || feature.derivedFromPostmortemAfterOutcome) {
    return {
      featureId: feature.featureId,
      accepted: false,
      reason: "Feature derived from a later postmortem is rejected as leakage.",
      leakage: true,
    };
  }
  if (feature.sourceKind === "leaked_outcome" || feature.leakedOutcomeLabel) {
    return {
      featureId: feature.featureId,
      accepted: false,
      reason: "Feature uses leaked outcome labels unavailable at exposure time.",
      leakage: true,
    };
  }
  if (!feature.artifactAvailableAtExposure) {
    return {
      featureId: feature.featureId,
      accepted: false,
      reason: `Artifact revision ${feature.artifactRevisionAtExposure} was not available at exposure time.`,
      leakage: true,
    };
  }
  if (feature.sourceKind === "synthetic_labeled") {
    return {
      featureId: feature.featureId,
      accepted: true,
      reason: "Accepted only as explicitly labeled synthetic/defect/reviewer feature; not an independent observation.",
      leakage: false,
    };
  }
  return {
    featureId: feature.featureId,
    accepted: true,
    reason: "Feature sourced from exposure-time artifact only.",
    leakage: false,
  };
}

export function censusProductExamples(input: { readonly productId: string; readonly sessionCount: number }): ProductExampleCensus {
  if (input.sessionCount < 0) {
    throw new TransferableMechanismsError("census.invalid_sessions", "sessionCount must be non-negative");
  }
  return {
    productId: input.productId,
    sessionCount: input.sessionCount,
    independentProductExampleCount: 1,
    sessionsPresentedAsIndependentProducts: false,
    note:
      input.sessionCount >= 1000
        ? `${input.sessionCount} sessions from one product count as 1 independent product example, not ${input.sessionCount}.`
        : `Sessions from product ${input.productId} collapse to one independent product example.`,
  };
}

export function assessTransfer(lesson: ProductMechanismLesson, attempt: TransferAttempt): TransferAssessment {
  const matched = lesson.counterconditions.filter(
    (c) =>
      attempt.matchedCounterconditions.includes(c) ||
      attempt.incompatibleContextKeys.some((k) => c.toLowerCase().includes(k.toLowerCase()) || attempt.targetContext.toLowerCase().includes(c.toLowerCase())),
  );
  const incompatible = attempt.incompatibleContextKeys.length > 0 || matched.length > 0;
  if (incompatible) {
    return {
      attemptId: attempt.attemptId,
      decision: "countercondition_block",
      automaticReuse: false,
      reason: "Structural analogy with incompatible context yields a countercondition, not automatic reuse.",
      counterconditions: matched.length > 0 ? matched : attempt.incompatibleContextKeys.map((k) => `incompatible:${k}`),
    };
  }
  if (!lesson.independentObservation && !lesson.syntheticLabeled) {
    return {
      attemptId: attempt.attemptId,
      decision: "insufficient_n",
      automaticReuse: false,
      reason: "No independently observed lesson; transfer blocked pending labeled synthetic or independent evidence.",
      counterconditions: [],
    };
  }
  return {
    attemptId: attempt.attemptId,
    decision: "reuse_with_context",
    automaticReuse: false,
    reason: "Context-compatible transfer candidate retained with explicit context binding (analogy ≠ identity).",
    counterconditions: [],
  };
}

export function gateComparativeClaim(input: ComparativeClaimInput): ComparativeClaimResult {
  const reasons: string[] = [];
  if (input.attribution === "unknown") reasons.push("attribution_unknown");
  if (!input.populationCompatible) reasons.push("population_incompatible");
  if (!input.exposureCompatible) reasons.push("exposure_incompatible");
  if (!input.assignmentCompatible) reasons.push("assignment_incompatible");
  const comparison = compareObservations(input.left, input.right, input.catalog);
  if (comparison.status !== "comparable") {
    reasons.push(...comparison.reasonCodes.filter((c) => c !== "refused"));
    if (!reasons.includes(comparison.status)) reasons.push(comparison.status);
  }
  const unique = [...new Set(reasons)].sort();
  if (unique.length > 0) {
    return {
      claimId: input.claimId,
      allowed: false,
      reasonCodes: unique,
      reason: "Incompatible metrics and/or unknown attribution block comparative claims.",
      measurementStatus: comparison.status,
    };
  }
  return {
    claimId: input.claimId,
    allowed: true,
    reasonCodes: [],
    reason: "Comparable via existing metric owner; attribution known; population/exposure/assignment compatible.",
    measurementStatus: comparison.status,
  };
}

export function promoteCandidateQuestion(input: {
  readonly question: CandidateSemanticQuestion;
  readonly featureGates: readonly FeatureGateResult[];
  readonly reviewed: boolean;
  readonly includeInPinnedComposition: boolean;
  readonly pinnedCompositionId: string | null;
  readonly contributionResourceId: string | null;
  readonly contributionVersion: number | null;
  readonly targetWorkspaceId: string;
}): QuestionPromotionRecord {
  const rejectedFeatures = input.featureGates.filter((g) => input.question.featureIds.includes(g.featureId) && !g.accepted);
  if (rejectedFeatures.length > 0) {
    return {
      questionId: input.question.questionId,
      status: "rejected",
      reviewed: input.reviewed,
      includedInPinnedComposition: false,
      pinnedCompositionId: null,
      contributionResourceId: input.contributionResourceId,
      contributionVersion: input.contributionVersion,
      proposingModelCreatedSuccessLabel: false,
      proposingModelUpdatedActivePolicy: false,
      privatePayloadCrossedWorkspace: false,
      retainedRejectedOrInconclusive: true,
    };
  }
  if (input.question.privatePayload && input.question.workspaceId !== input.targetWorkspaceId) {
    throw new TransferableMechanismsError("workspace.private_payload_cross", "Private payload must not cross workspace scope implicitly.");
  }
  if (!input.reviewed || !input.includeInPinnedComposition || !input.pinnedCompositionId) {
    return {
      questionId: input.question.questionId,
      status: "proposed_inactive",
      reviewed: input.reviewed,
      includedInPinnedComposition: false,
      pinnedCompositionId: null,
      contributionResourceId: input.contributionResourceId,
      contributionVersion: input.contributionVersion,
      proposingModelCreatedSuccessLabel: false,
      proposingModelUpdatedActivePolicy: false,
      privatePayloadCrossedWorkspace: false,
      retainedRejectedOrInconclusive: false,
    };
  }
  if (!input.contributionResourceId || input.contributionVersion === null) {
    return {
      questionId: input.question.questionId,
      status: "inconclusive",
      reviewed: true,
      includedInPinnedComposition: false,
      pinnedCompositionId: null,
      contributionResourceId: input.contributionResourceId,
      contributionVersion: input.contributionVersion,
      proposingModelCreatedSuccessLabel: false,
      proposingModelUpdatedActivePolicy: false,
      privatePayloadCrossedWorkspace: false,
      retainedRejectedOrInconclusive: true,
    };
  }
  return {
    questionId: input.question.questionId,
    status: "reviewed_active_in_pinned",
    reviewed: true,
    includedInPinnedComposition: true,
    pinnedCompositionId: input.pinnedCompositionId,
    contributionResourceId: input.contributionResourceId,
    contributionVersion: input.contributionVersion,
    proposingModelCreatedSuccessLabel: false,
    proposingModelUpdatedActivePolicy: false,
    privatePayloadCrossedWorkspace: false,
    retainedRejectedOrInconclusive: false,
  };
}

export function assertAuthorityBoundary(): AuthorityBoundary {
  return {
    autonomousPolicyMutation: false,
    causalGrowthPromise: false,
    newExperimentOwner: false,
    newExperimentAssignment: false,
    crossWorkspaceCustomerPool: false,
    portfolioRankFromIncomparable: false,
    autoRewriteMeasurementPolicy: false,
    sharedVisualTemplate: false,
    reason:
      "Proposing model never creates success labels or updates active policy; comparability uses existing metric/market-experiment owners; no new experiment assignment or cross-workspace customer pool.",
  };
}

export function defaultEvalProtocol(): EvalProtocol {
  return {
    holdout: true,
    baseline: true,
    ablation: true,
    claimKind: "association",
    smallNGuard: true,
    multipleTestingGuard: true,
    independentOutcomesOnly: true,
  };
}

export function runTransferableMechanismsEval(input: {
  readonly lessons: readonly ProductMechanismLesson[];
  readonly features: readonly FeatureCandidate[];
  readonly transferAttempts: readonly { lessonId: string; attempt: TransferAttempt }[];
  readonly comparativeClaims: readonly ComparativeClaimInput[];
  readonly questions: readonly {
    question: CandidateSemanticQuestion;
    reviewed: boolean;
    includeInPinnedComposition: boolean;
    pinnedCompositionId: string | null;
    contributionResourceId: string | null;
    contributionVersion: number | null;
    targetWorkspaceId: string;
  }[];
  readonly sessionCensuses: readonly { productId: string; sessionCount: number }[];
}): TransferableMechanismsResult {
  const featureGates = input.features.map(gateFeatureAtExposure);
  const lessonById = new Map(input.lessons.map((l) => [l.lessonId, l]));
  const transfers = input.transferAttempts.map(({ lessonId, attempt }) => {
    const lesson = lessonById.get(lessonId);
    if (!lesson) {
      throw new TransferableMechanismsError("lesson.missing", `Unknown lesson ${lessonId}`);
    }
    return assessTransfer(lesson, attempt);
  });
  const comparativeClaims = input.comparativeClaims.map(gateComparativeClaim);
  const promotions = input.questions.map((q) =>
    promoteCandidateQuestion({
      question: q.question,
      featureGates,
      reviewed: q.reviewed,
      includeInPinnedComposition: q.includeInPinnedComposition,
      pinnedCompositionId: q.pinnedCompositionId,
      contributionResourceId: q.contributionResourceId,
      contributionVersion: q.contributionVersion,
      targetWorkspaceId: q.targetWorkspaceId,
    }),
  );
  return {
    lessons: input.lessons,
    featureGates,
    census: input.sessionCensuses.map(censusProductExamples),
    transfers,
    comparativeClaims,
    promotions,
    evalProtocol: defaultEvalProtocol(),
    authority: assertAuthorityBoundary(),
    networkCalls: 0,
  };
}

function paperObservation(partial: Partial<ObservationRecord> & Pick<ObservationRecord, "id" | "metricId" | "value">): ObservationRecord {
  return {
    id: partial.id,
    revision: 1,
    recordedAt: "2026-09-20T06:00:00.000Z",
    producer: "paper.528",
    epistemic: "known",
    kind: "observation",
    status: "recorded",
    metricId: partial.metricId,
    observedAt: "2026-09-20T06:00:00.000Z",
    source: { uri: "evidence://paper.528", revision: "synthetic.528" },
    independenceGroup: "ig.paper.528",
    confidence: { lower: 0, upper: 1 },
    value: partial.value,
    metricDefinitionId: partial.metricDefinitionId ?? "metric.activation_rate",
    metricDefinitionRevision: partial.metricDefinitionRevision ?? 1,
    currency: partial.currency,
    amountUnits: partial.amountUnits,
    amountTreatment: partial.amountTreatment,
    costKind: partial.costKind,
    cohortId: partial.cohortId ?? "cohort.default",
    window: partial.window ?? { start: "2026-09-01T00:00:00.000Z", end: "2026-09-14T00:00:00.000Z", timezone: "UTC", maturity: "mature" },
    experimentId: partial.experimentId ?? "exp.paper.528",
    experimentRevision: partial.experimentRevision ?? 1,
    participationKind: partial.participationKind ?? "exposure",
    subjectRef: partial.subjectRef,
    identityLifecycle: partial.identityLifecycle,
    eventKind: partial.eventKind,
    sourceEventId: partial.sourceEventId,
  };
}

const PAPER_METRIC: MetricContractDefinition = {
  id: "metric.activation_rate",
  revision: 1,
  name: "Activation rate",
  objectiveId: "obj.activation",
  eventSchemaVersion: "1",
  numerator: "activated",
  denominator: "exposed",
  units: "rate",
  cohortId: "cohort.default",
  window: { start: "2026-09-01T00:00:00.000Z", end: "2026-09-14T00:00:00.000Z", timezone: "UTC" },
};

const PAPER_CATALOG: MeasurementCatalog = {
  definitions: [PAPER_METRIC],
};

const INCOMPATIBLE_METRIC: MetricContractDefinition = {
  ...PAPER_METRIC,
  id: "metric.revenue_net",
  revision: 2,
  name: "Net revenue",
  numerator: "net_revenue",
  denominator: undefined,
  units: "currency",
  currency: "USD",
  amountTreatment: "net",
};

export const TRANSFERABLE_MECHANISMS_SEEDED_FIXTURE = {
  revision: "paper.528.seeded.v1",
  lessons: [
    {
      lessonId: "lesson.onboarding-checklist",
      mechanismKey: "progressive_onboarding_checklist",
      context: "consumer B2C mobile; first-session activation; paywall after value",
      intervention: "Show a three-step checklist before paywall",
      observedResult: "Association: higher checklist completion co-occurred with activation (not causal claim)",
      counterconditions: ["b2b multi-seat admin onboarding", "already-activated returning users", "paywall-before-value surfaces"],
      measurementContract: {
        definitionId: "metric.activation_rate",
        revision: 1,
        units: "rate",
        population: "first-session new users",
        windowLabel: "14d mature",
        exposureRule: "checklist_shown",
        assignmentUnit: "user",
      },
      sourceRevisions: ["rev.source.a1", "rev.product.p1"],
      productId: "product.alpha",
      independentObservation: true,
      syntheticLabeled: false,
    },
  ] satisfies ProductMechanismLesson[],
  features: [
    {
      featureId: "feat.exposure-checklist-copy",
      label: "checklist copy at exposure",
      sourceKind: "exposure_time_artifact" as const,
      artifactRevisionAtExposure: "rev.artifact.exp-1",
      artifactAvailableAtExposure: true,
      derivedFromPostmortemAfterOutcome: false,
      leakedOutcomeLabel: false,
      workspaceId: "ws.paper.528",
    },
    {
      featureId: "feat.postmortem-winner-label",
      label: "postmortem called this the winning variant",
      sourceKind: "later_postmortem" as const,
      artifactRevisionAtExposure: "rev.artifact.post-9",
      artifactAvailableAtExposure: false,
      derivedFromPostmortemAfterOutcome: true,
      leakedOutcomeLabel: true,
      workspaceId: "ws.paper.528",
    },
  ] satisfies FeatureCandidate[],
  sessionCensus: { productId: "product.alpha", sessionCount: 5000 },
  transferAttempt: {
    lessonId: "lesson.onboarding-checklist",
    attempt: {
      attemptId: "xfer.b2b-admin",
      sourceLessonId: "lesson.onboarding-checklist",
      targetContext: "b2b multi-seat admin onboarding with SSO",
      structuralAnalogy: true,
      incompatibleContextKeys: ["b2b multi-seat admin onboarding"],
      matchedCounterconditions: ["b2b multi-seat admin onboarding"],
    } satisfies TransferAttempt,
  },
  comparativeIncompatible: {
    claimId: "claim.incompatible-metrics",
    left: paperObservation({
      id: "obs.left",
      metricId: "metric.activation_rate",
      value: 0.42,
      metricDefinitionId: "metric.activation_rate",
      metricDefinitionRevision: 1,
    }),
    right: paperObservation({
      id: "obs.right",
      metricId: "metric.revenue_net",
      value: 1200,
      metricDefinitionId: "metric.revenue_net",
      metricDefinitionRevision: 2,
      currency: "USD",
      amountTreatment: "net",
      cohortId: "cohort.other",
      window: { start: "2026-08-01T00:00:00.000Z", end: "2026-08-14T00:00:00.000Z", timezone: "UTC", maturity: "mature" },
      experimentId: "exp.other",
      experimentRevision: 3,
    }),
    catalog: { definitions: [PAPER_METRIC, INCOMPATIBLE_METRIC] } satisfies MeasurementCatalog,
    attribution: "unknown" as const,
    populationCompatible: false,
    exposureCompatible: false,
    assignmentCompatible: false,
  } satisfies ComparativeClaimInput,
  questionUsefulInactive: {
    question: {
      questionId: "q.checklist-before-paywall",
      prompt: "Does a progressive checklist before paywall associate with activation in this context?",
      featureIds: ["feat.exposure-checklist-copy"],
      usefulHeuristic: true,
      workspaceId: "ws.paper.528",
      privatePayload: false,
    } satisfies CandidateSemanticQuestion,
    reviewed: false,
    includeInPinnedComposition: false,
    pinnedCompositionId: null,
    contributionResourceId: null,
    contributionVersion: null,
    targetWorkspaceId: "ws.paper.528",
  },
  questionReviewedPinned: {
    question: {
      questionId: "q.checklist-before-paywall",
      prompt: "Does a progressive checklist before paywall associate with activation in this context?",
      featureIds: ["feat.exposure-checklist-copy"],
      usefulHeuristic: true,
      workspaceId: "ws.paper.528",
      privatePayload: false,
    } satisfies CandidateSemanticQuestion,
    reviewed: true,
    includeInPinnedComposition: true,
    pinnedCompositionId: "pin.composition.528.v1",
    contributionResourceId: "contrib.question.checklist",
    contributionVersion: 1,
    targetWorkspaceId: "ws.paper.528",
  },
  paperCatalog: PAPER_CATALOG,
};

export function assessSeededTransferableMechanismsFixture(): TransferableMechanismsResult {
  const seeded = TRANSFERABLE_MECHANISMS_SEEDED_FIXTURE;
  return runTransferableMechanismsEval({
    lessons: seeded.lessons,
    features: seeded.features,
    transferAttempts: [seeded.transferAttempt],
    comparativeClaims: [seeded.comparativeIncompatible],
    questions: [seeded.questionUsefulInactive],
    sessionCensuses: [seeded.sessionCensus],
  });
}
