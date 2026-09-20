/**
 * #524 SQ-12 — Rank eligible next work by evidence gaps and decision impact.
 *
 * Uses stored semantic assessments to order **already permitted** work.
 * Existing planner / frontier remain sole eligibility owners — ranking never
 * creates eligibility, mutates priority class, outranks required founder
 * approval, or changes at-most-one live founder question semantics.
 *
 * Predicted information value is an explicitly labeled heuristic (recipe policy).
 * Plan-time reads of inference/policy receipts are local / stored-only:
 * no network, no cache refresh. Stale or missing → deterministic fallback or
 * explicit unresolved — never invented certainty.
 *
 * Paper / synthetic. Consumes #522+#523. NO_527_IMPL cleared by #527. NO_528_IMPL cleared by #528. NO_529_IMPL cleared by #529. #571 landed. Does not implement #511 closeout or #573.
 */
import {
  EVIDENCE_GAP_ACTION_CLASS_MAP,
  EVIDENCE_GAP_CANDIDATE_ACTIONS,
  EVIDENCE_GAP_KINDS,
  EVIDENCE_GAP_RANKING_RECIPE_POLICY,
  type EvidenceGapCandidateAction,
  type EvidenceGapKind,
  type EvidenceGapMappedActionClass,
  type EvidenceGapRankingRecipePolicy,
  type ReversibilityClass,
} from "../../catalog/workflows/evidence-gap-ranking.js";
import type { ActionClass } from "../schema/types.js";

export const EVIDENCE_GAP_RANKING_ISSUE = "#524" as const;
export const EVIDENCE_GAP_RANKING_EPIC = "#511" as const;
export const EVIDENCE_GAP_RANKING_PLANNING_ID = "SQ-12" as const;
export const EVIDENCE_GAP_RANKING_CONSUMES = ["#522", "#523"] as const;
export const EVIDENCE_GAP_RANKING_STAMP = "0.221.45" as const;
export const EVIDENCE_GAP_RANKING_SCHEMA_VERSION = 1 as const;
export const EVIDENCE_GAP_RANKING_NO_NETWORK = true as const;
export const EVIDENCE_GAP_RANKING_NO_NEW_PLANNER = true as const;
export const EVIDENCE_GAP_RANKING_NO_AUTHORITY_REORDER = true as const;
export const EVIDENCE_GAP_RANKING_NO_FOUNDER_QUESTION_COUNT_CHANGE = true as const;
export const EVIDENCE_GAP_RANKING_NO_AUTO_APPROVAL = true as const;
export const EVIDENCE_GAP_RANKING_NO_INFERRED_PREFERENCES = true as const;
export const EVIDENCE_GAP_RANKING_INFO_VALUE_IS_HEURISTIC = true as const;
export const EVIDENCE_GAP_RANKING_NO_524_IMPL = false as const;
export const EVIDENCE_GAP_RANKING_NEXT_AFTER_CLOSE = "#573" as const;

export class EvidenceGapRankingError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "EvidenceGapRankingError";
    this.code = code;
  }
}

export type { EvidenceGapKind, EvidenceGapCandidateAction, ReversibilityClass, EvidenceGapMappedActionClass };

/** Cost bound — upper bound for ranking, not a spend authorization. */
export interface EvidenceGapCostBound {
  readonly maxCredits: number;
  readonly maxLatencyMs: number;
}

/** Deterministic ranking inputs + heuristic info-value (labeled). */
export interface EvidenceGapRankingFactors {
  readonly dependencyImpact: number;
  readonly blockedDownstreamNodeIds: readonly string[];
  readonly reversibility: ReversibilityClass;
  readonly costBound: EvidenceGapCostBound;
  readonly decisionSensitive: boolean;
  /**
   * HEURISTIC predicted information value (0–1). Must stay labeled as heuristic
   * in explanations; never treated as causal or business-outcome proof.
   */
  readonly heuristicInfoValue: number;
  readonly heuristicInfoValueExplanation: string;
}

export interface ConflictingEvidenceRecord {
  readonly evidenceId: string;
  readonly interpretation: string;
  readonly sourceId: string;
  readonly revision: string;
}

/** Stored gap assessment — contradictory evidence stays multi-valued. */
export interface StoredEvidenceGapAssessment {
  readonly assessmentId: string;
  readonly nodeId: string;
  readonly priorityClass: string;
  readonly eligible: boolean;
  readonly requiresFounderApproval: boolean;
  readonly gapKind: EvidenceGapKind;
  readonly factors: EvidenceGapRankingFactors;
  readonly appliesToRevision: string;
  readonly sourceRevisions: readonly { readonly sourceId: string; readonly revision: string }[];
  readonly conflictingEvidence: readonly ConflictingEvidenceRecord[];
  readonly recordedAt: string;
}

export type AssessmentReadStatus = "current" | "stale" | "missing" | "unresolved";

export interface AssessmentReadResult {
  readonly status: AssessmentReadStatus;
  readonly assessment: StoredEvidenceGapAssessment | null;
  readonly reason: string;
  readonly providerRequests: 0;
  readonly networkCalls: 0;
  readonly cacheRefreshed: false;
}

export function isAssessmentStale(
  assessment: StoredEvidenceGapAssessment,
  currentSourceRevisions: readonly { readonly sourceId: string; readonly revision: string }[],
): boolean {
  const current = new Map(currentSourceRevisions.map((entry) => [entry.sourceId, entry.revision]));
  for (const bound of assessment.sourceRevisions) {
    const now = current.get(bound.sourceId);
    if (now === undefined || now !== bound.revision) return true;
  }
  return false;
}

/** In-memory stored-assessment ledger for plan-time zero-network reads. */
export class StoredEvidenceGapLedger {
  private readonly byNode = new Map<string, StoredEvidenceGapAssessment>();

  put(assessment: StoredEvidenceGapAssessment): void {
    this.byNode.set(assessment.nodeId, assessment);
  }

  get(nodeId: string): StoredEvidenceGapAssessment | undefined {
    return this.byNode.get(nodeId);
  }

  /** Plan-time read: stored only — never network / never cache refresh. */
  readForPlan(nodeId: string, currentSourceRevisions: readonly { readonly sourceId: string; readonly revision: string }[]): AssessmentReadResult {
    const assessment = this.byNode.get(nodeId) ?? null;
    if (!assessment) {
      return {
        status: "missing",
        assessment: null,
        reason: "no_stored_assessment",
        providerRequests: 0,
        networkCalls: 0,
        cacheRefreshed: false,
      };
    }
    if (isAssessmentStale(assessment, currentSourceRevisions)) {
      return {
        status: "stale",
        assessment,
        reason: "source_revision_changed",
        providerRequests: 0,
        networkCalls: 0,
        cacheRefreshed: false,
      };
    }
    return {
      status: "current",
      assessment,
      reason: "stored_current",
      providerRequests: 0,
      networkCalls: 0,
      cacheRefreshed: false,
    };
  }
}

export function mapGapToActionClass(kind: EvidenceGapKind): ActionClass {
  return EVIDENCE_GAP_ACTION_CLASS_MAP[kind];
}

export function mapGapToCandidateAction(kind: EvidenceGapKind): EvidenceGapCandidateAction {
  return EVIDENCE_GAP_CANDIDATE_ACTIONS[kind];
}

/** AC3: observation vs retrieval must not share a candidate action id. */
export function candidateActionsDistinguishObservationFromRetrieval(): boolean {
  return (
    mapGapToCandidateAction("observation_required") !== mapGapToCandidateAction("source_not_retrieved") &&
    mapGapToCandidateAction("observation_required") === "produce_new_observation" &&
    mapGapToCandidateAction("source_not_retrieved") === "retrieve_existing_source"
  );
}

export interface EligibleRankingCandidate {
  readonly nodeId: string;
  readonly priorityClass: string;
  readonly eligible: true;
  readonly requiresFounderApproval: boolean;
  readonly gapKind?: EvidenceGapKind;
  readonly factors?: EvidenceGapRankingFactors;
  readonly appliesToRevision?: string;
  readonly assessmentStatus?: AssessmentReadStatus;
  readonly conflictingEvidence?: readonly ConflictingEvidenceRecord[];
}

export interface RankedEligibleCandidate {
  readonly nodeId: string;
  readonly priorityClass: string;
  readonly requiresFounderApproval: boolean;
  readonly gapKind: EvidenceGapKind | null;
  readonly mappedActionClass: ActionClass | null;
  readonly candidateAction: EvidenceGapCandidateAction | null;
  readonly score: number;
  readonly explanation: string;
  readonly objective: {
    readonly dependencyImpact: number;
    readonly blockedDownstreamNodeIds: readonly string[];
    readonly reversibility: ReversibilityClass | null;
    readonly costBound: EvidenceGapCostBound | null;
    readonly decisionSensitive: boolean;
  };
  readonly heuristic: {
    readonly infoValue: number;
    readonly labeledHeuristic: true;
    readonly explanation: string;
  };
  readonly assessmentStatus: AssessmentReadStatus;
  readonly appliesToRevision: string | null;
  readonly conflictingEvidence: readonly ConflictingEvidenceRecord[];
}

export interface RankEligibleWorkResult {
  readonly ranked: readonly RankedEligibleCandidate[];
  readonly orderedNodeIds: readonly string[];
  readonly providerRequests: 0;
  readonly networkCalls: 0;
  readonly cacheRefreshed: false;
}

function normalizeCost(cost: EvidenceGapCostBound): number {
  const raw = cost.maxCredits + cost.maxLatencyMs / 1000;
  return 1 / (1 + raw);
}

function computeScore(
  factors: EvidenceGapRankingFactors | undefined,
  policy: EvidenceGapRankingRecipePolicy,
): { score: number; heuristicInfoValue: number; heuristicExplanation: string } {
  if (!factors) {
    return {
      score: 0,
      heuristicInfoValue: 0,
      heuristicExplanation: "No stored assessment — deterministic zero info-value fallback (unresolved).",
    };
  }
  const dependency = factors.dependencyImpact * policy.dependencyImpactWeight;
  const reversibility = policy.reversibilityScores[factors.reversibility] * policy.reversibilityWeight;
  const cost = normalizeCost(factors.costBound) * policy.costBoundWeight;
  const decision = (factors.decisionSensitive ? 1 : 0) * policy.decisionSensitivityWeight;
  const heuristic = factors.heuristicInfoValue * policy.heuristicInfoValueWeight;
  return {
    score: dependency + reversibility + cost + decision + heuristic,
    heuristicInfoValue: factors.heuristicInfoValue,
    heuristicExplanation: factors.heuristicInfoValueExplanation || policy.heuristicInfoValueExplanation,
  };
}

function buildExplanation(input: {
  readonly nodeId: string;
  readonly requiresFounderApproval: boolean;
  readonly gapKind: EvidenceGapKind | null;
  readonly factors: EvidenceGapRankingFactors | undefined;
  readonly assessmentStatus: AssessmentReadStatus;
  readonly score: number;
}): string {
  if (input.requiresFounderApproval) {
    return `Founder approval required for ${input.nodeId} — outranks heuristic information-gain within its permitted priority class.`;
  }
  if (input.assessmentStatus === "missing" || input.assessmentStatus === "unresolved") {
    return `No current stored assessment for ${input.nodeId}; ranked by deterministic fallback (score=${input.score.toFixed(3)}).`;
  }
  if (input.assessmentStatus === "stale") {
    return `Stored assessment for ${input.nodeId} is stale relative to source revisions; question/proposal invalidated — deterministic unresolved fallback (score=${input.score.toFixed(3)}).`;
  }
  const downstream = input.factors?.blockedDownstreamNodeIds ?? [];
  const gap = input.gapKind ?? "none";
  const dependencyClause =
    downstream.length > 0
      ? `resolves blocking evidence gap (${gap}) for downstream ${downstream.join(", ")}`
      : `gap=${gap} with no recorded downstream blockers`;
  return (
    `Eligible step ${input.nodeId} ${dependencyClause}; ` +
    `dependencyImpact=${input.factors?.dependencyImpact ?? 0}, ` +
    `decisionSensitive=${input.factors?.decisionSensitive ?? false}, ` +
    `heuristicInfoValue=${input.factors?.heuristicInfoValue ?? 0} (labeled heuristic); ` +
    `score=${input.score.toFixed(3)}.`
  );
}

/**
 * Rank **only** within the same permitted priority class among already-eligible
 * candidates. Founder-approval-required candidates always sort before high
 * info-gain peers in the same class. Never promotes ineligible work.
 */
export function rankEligibleWork(
  candidates: readonly EligibleRankingCandidate[],
  policy: EvidenceGapRankingRecipePolicy = EVIDENCE_GAP_RANKING_RECIPE_POLICY,
): RankEligibleWorkResult {
  for (const candidate of candidates) {
    if (candidate.eligible !== true) {
      throw new EvidenceGapRankingError("rank.ineligible_input", `Refusing to rank ineligible node ${candidate.nodeId}`);
    }
  }

  const byClass = new Map<string, EligibleRankingCandidate[]>();
  for (const candidate of candidates) {
    const bucket = byClass.get(candidate.priorityClass) ?? [];
    bucket.push(candidate);
    byClass.set(candidate.priorityClass, bucket);
  }

  const classOrder: string[] = [];
  for (const candidate of candidates) {
    if (!classOrder.includes(candidate.priorityClass)) classOrder.push(candidate.priorityClass);
  }

  const ranked: RankedEligibleCandidate[] = [];
  for (const priorityClass of classOrder) {
    const group = byClass.get(priorityClass) ?? [];
    const decorated = group.map((candidate) => {
      const status = candidate.assessmentStatus ?? (candidate.factors ? "current" : "missing");
      const effectiveFactors = status === "current" ? candidate.factors : undefined;
      const { score, heuristicInfoValue, heuristicExplanation } = computeScore(effectiveFactors, policy);
      const gapKind = status === "current" ? (candidate.gapKind ?? null) : null;
      return { candidate, score, gapKind, status, heuristicInfoValue, heuristicExplanation };
    });

    decorated.sort((left, right) => {
      if (left.candidate.requiresFounderApproval !== right.candidate.requiresFounderApproval) {
        return left.candidate.requiresFounderApproval ? -1 : 1;
      }
      if (right.score !== left.score) return right.score - left.score;
      return left.candidate.nodeId < right.candidate.nodeId ? -1 : left.candidate.nodeId > right.candidate.nodeId ? 1 : 0;
    });

    for (const entry of decorated) {
      ranked.push({
        nodeId: entry.candidate.nodeId,
        priorityClass,
        requiresFounderApproval: entry.candidate.requiresFounderApproval,
        gapKind: entry.gapKind,
        mappedActionClass: entry.gapKind ? mapGapToActionClass(entry.gapKind) : null,
        candidateAction: entry.gapKind ? mapGapToCandidateAction(entry.gapKind) : null,
        score: entry.score,
        explanation: buildExplanation({
          nodeId: entry.candidate.nodeId,
          requiresFounderApproval: entry.candidate.requiresFounderApproval,
          gapKind: entry.gapKind,
          factors: entry.status === "current" ? entry.candidate.factors : undefined,
          assessmentStatus: entry.status,
          score: entry.score,
        }),
        objective: {
          dependencyImpact: entry.candidate.factors?.dependencyImpact ?? 0,
          blockedDownstreamNodeIds: entry.candidate.factors?.blockedDownstreamNodeIds ?? [],
          reversibility: entry.candidate.factors?.reversibility ?? null,
          costBound: entry.candidate.factors?.costBound ?? null,
          decisionSensitive: entry.candidate.factors?.decisionSensitive ?? false,
        },
        heuristic: {
          infoValue: entry.heuristicInfoValue,
          labeledHeuristic: true,
          explanation: entry.heuristicExplanation,
        },
        assessmentStatus: entry.status,
        appliesToRevision: entry.candidate.appliesToRevision ?? null,
        conflictingEvidence: entry.candidate.conflictingEvidence ?? [],
      });
    }
  }

  return {
    ranked,
    orderedNodeIds: ranked.map((entry) => entry.nodeId),
    providerRequests: 0,
    networkCalls: 0,
    cacheRefreshed: false,
  };
}

/**
 * Frontier consumer: reorder an already-computed ready list using stored
 * assessments. Does not change parked / eligibility sets.
 */
export function orderReadyByEvidenceGaps(input: {
  readonly readyNodeIds: readonly string[];
  readonly priorityClassByNodeId: ReadonlyMap<string, string>;
  readonly founderApprovalNodeIds?: ReadonlySet<string>;
  readonly ledger: StoredEvidenceGapLedger;
  readonly currentSourceRevisions: readonly { readonly sourceId: string; readonly revision: string }[];
  readonly policy?: EvidenceGapRankingRecipePolicy;
}): RankEligibleWorkResult {
  const candidates: EligibleRankingCandidate[] = input.readyNodeIds.map((nodeId) => {
    const read = input.ledger.readForPlan(nodeId, input.currentSourceRevisions);
    const assessment = read.assessment;
    const status: AssessmentReadStatus = read.status === "stale" ? "stale" : read.status === "missing" ? "missing" : assessment ? "current" : "unresolved";
    return {
      nodeId,
      priorityClass: input.priorityClassByNodeId.get(nodeId) ?? "default",
      eligible: true as const,
      requiresFounderApproval: input.founderApprovalNodeIds?.has(nodeId) ?? assessment?.requiresFounderApproval ?? false,
      gapKind: status === "current" ? assessment?.gapKind : undefined,
      factors: status === "current" ? assessment?.factors : undefined,
      appliesToRevision: assessment?.appliesToRevision,
      assessmentStatus: status,
      conflictingEvidence: assessment?.conflictingEvidence,
    };
  });
  return rankEligibleWork(candidates, input.policy ?? EVIDENCE_GAP_RANKING_RECIPE_POLICY);
}

/** Invalidate founder question / proposal when appliesToRevision no longer matches. */
export function questionAppliesToCurrentRevision(appliesToRevision: string | null | undefined, currentRevision: string): boolean {
  if (!appliesToRevision) return false;
  return appliesToRevision === currentRevision;
}

/** Preserve conflicting evidence as legible parallel records (AC5). */
export function conflictingEvidenceIsLegible(conflicting: readonly ConflictingEvidenceRecord[]): {
  readonly legible: boolean;
  readonly collapsedToSingleConfidence: false;
  readonly count: number;
} {
  return {
    legible: conflicting.length >= 2 && conflicting.every((entry) => entry.interpretation.trim().length > 0 && entry.evidenceId.trim().length > 0),
    collapsedToSingleConfidence: false,
    count: conflicting.length,
  };
}

export function assertKnownGapKind(kind: string): asserts kind is EvidenceGapKind {
  if (!(EVIDENCE_GAP_KINDS as readonly string[]).includes(kind)) {
    throw new EvidenceGapRankingError("gap.unknown_kind", `Unknown evidence gap kind: ${kind}`);
  }
}

/** Observational usefulness metric hook — separate from ranking-code correctness. */
export interface ObservationalUsefulnessTrial {
  readonly trialId: string;
  readonly selectedNodeId: string;
  readonly reworkDelta: number;
  readonly founderEffortDelta: number;
  readonly notes: string;
}

export function summarizeObservationalUsefulness(trials: readonly ObservationalUsefulnessTrial[]): {
  readonly trialCount: number;
  readonly meanReworkDelta: number;
  readonly meanFounderEffortDelta: number;
  readonly separateFromRankingCorrectness: true;
} {
  const trialCount = trials.length;
  const meanReworkDelta = trialCount === 0 ? 0 : trials.reduce((sum, trial) => sum + trial.reworkDelta, 0) / trialCount;
  const meanFounderEffortDelta = trialCount === 0 ? 0 : trials.reduce((sum, trial) => sum + trial.founderEffortDelta, 0) / trialCount;
  return {
    trialCount,
    meanReworkDelta,
    meanFounderEffortDelta,
    separateFromRankingCorrectness: true,
  };
}
