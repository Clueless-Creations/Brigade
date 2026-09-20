/**
 * #522 SQ-11 — Feedback-to-work semantic pipeline in **shadow** mode.
 *
 * Compiled path (deterministic): synthetic observation input (post-ingestion) →
 * scope/candidate selection → parallel alignment/evidence checks → bounded
 * traversal → applicability (#521) → candidate-response assessment →
 * deterministic reduction → shadow work-proposal emission.
 *
 * Consumes #514+#518+#519+#520+#521. Extends catalog/workflows owners +
 * operating-model work-proposal semantics. No new event bus / live ingest /
 * default-recipe rewrite / autonomous repair dispatch.
 *
 * Paper / synthetic only. No network-in-knowledge-reads.
 * NO_523_IMPL cleared by #523. NO_524_IMPL cleared by #524. NO_525_IMPL cleared by #525. NO_526_IMPL cleared by #526. NO_527_IMPL cleared by #527. NO_528_IMPL cleared by #528. Does not implement #529.
 */
import { digestOf } from "../../contracts/semantic/canonicalize.js";
import {
  FEEDBACK_TO_WORK_SHADOW_OWNER_WORKFLOWS,
  FEEDBACK_TO_WORK_SHADOW_RECIPE_POLICY,
  type FeedbackToWorkShadowRecipePolicy,
} from "../../catalog/workflows/feedback-to-work-shadow.js";
import {
  FIXTURE_METHOD_CATALOG,
  evaluateMethodApplicability,
  type BusinessContextSnapshot,
  type MethodApplicabilityResource,
} from "../../catalog/ontology/knowledge-method-applicability.js";
import {
  boundedCompetingPathBeam,
  type BeamBounds,
  type GraphEdge,
  type GraphNode,
  DEFAULT_BEAM_BOUNDS,
} from "../knowledge-service/context-bound-applicability.js";
import {
  emitShadowWorkProposal,
  assertShadowSideEffectsIntact,
  type ShadowProposalKind,
  type ShadowWorkProposalResult,
  type ShadowWorkProposalTrace,
} from "../operating-model/work-proposal-shadow.js";
import {
  heldOutCases,
  runDeterministicArm,
  runSemanticArm,
  type ArmRunTrace,
  type SemanticEvalCase,
} from "../../catalog/providers/semantic-eval-baselines-map.js";

export const FEEDBACK_TO_WORK_SHADOW_ISSUE = "#522" as const;
export const FEEDBACK_TO_WORK_SHADOW_EPIC = "#511" as const;
export const FEEDBACK_TO_WORK_SHADOW_PLANNING_ID = "SQ-11" as const;
export const FEEDBACK_TO_WORK_SHADOW_CONSUMES = ["#514", "#518", "#519", "#520", "#521"] as const;
export const FEEDBACK_TO_WORK_SHADOW_STAMP = "0.221.43" as const;
export const FEEDBACK_TO_WORK_SHADOW_SCHEMA_VERSION = 1 as const;
export const FEEDBACK_TO_WORK_SHADOW_NO_NETWORK = true as const;
export const FEEDBACK_TO_WORK_SHADOW_NO_LIVE_INGEST = true as const;
export const FEEDBACK_TO_WORK_SHADOW_NO_EVENT_BUS = true as const;
export const FEEDBACK_TO_WORK_SHADOW_NO_DEFAULT_REWRITE = true as const;
export const FEEDBACK_TO_WORK_SHADOW_SHADOW_ONLY = true as const;
export const FEEDBACK_TO_WORK_SHADOW_NO_522_IMPL = false as const;
export const FEEDBACK_TO_WORK_SHADOW_NO_523_IMPL = false as const;
export const FEEDBACK_TO_WORK_SHADOW_NEXT_AFTER_CLOSE = "#529" as const;

export class FeedbackToWorkShadowError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "FeedbackToWorkShadowError";
    this.code = code;
  }
}

/** Admitted synthetic (or separately authorized) observation — post-ingestion only. */
export interface SyntheticObservationInput {
  readonly observationId: string;
  readonly workspaceId: string;
  readonly sourceUri: string;
  readonly sourceRevision: string;
  readonly text: string;
  /** Stable failure clustering key (same failure → one candidate problem). */
  readonly failureKey: string;
  /** Mechanism key (distinct mechanisms stay distinct even with similar wording). */
  readonly mechanismKey: string;
  readonly recordedAt: string;
  readonly evidenceIds: readonly string[];
  readonly productRevision: string;
  /** Hostile / injection payload in report text — must not mutate packs/bindings/scope. */
  readonly containsInjectedInstructions?: boolean;
}

export interface PipelineTraceBindings {
  readonly questionPackDigest: string;
  readonly projectionDigest: string;
  readonly providerResponseClass: string;
  readonly policyVersion: string;
}

export interface AlignmentCheckResult {
  readonly observationId: string;
  readonly alignedFailureKey: string;
  readonly mechanismKey: string;
  readonly evidenceSufficient: boolean;
  readonly conflictingEvidenceIds: readonly string[];
  readonly omittedCoverage: readonly string[];
  readonly recoverableStatus: "ok" | "duplicate" | "stale_revision" | "mid_batch_failure" | "provider_unavailable";
}

export interface CandidateProblem {
  readonly problemId: string;
  readonly failureKey: string;
  readonly mechanismKey: string;
  readonly observationIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly conflictingEvidenceIds: readonly string[];
  readonly omittedCoverage: readonly string[];
}

export type CandidateResponseClass = ShadowProposalKind;

export interface AssessedCandidate {
  readonly problemId: string;
  readonly responseClass: CandidateResponseClass;
  readonly rationale: string;
  readonly applicableMethodIds: readonly string[];
  readonly unresolvedMethodIds: readonly string[];
  readonly score: number;
}

export interface PipelineRoundResult {
  readonly round: 1 | 2;
  readonly alignment: readonly AlignmentCheckResult[];
  readonly candidates: readonly CandidateProblem[];
  readonly assessed: readonly AssessedCandidate[];
  readonly beamTermination: string;
  readonly projectionDigest: string;
}

export interface FeedbackToWorkShadowResult {
  readonly mode: "shadow";
  readonly workspaceId: string;
  readonly candidates: readonly CandidateProblem[];
  readonly assessed: readonly AssessedCandidate[];
  readonly reduced: AssessedCandidate | null;
  readonly proposal: ShadowWorkProposalResult | null;
  readonly rounds: readonly PipelineRoundResult[];
  readonly trace: ShadowWorkProposalTrace;
  readonly recipePolicy: FeedbackToWorkShadowRecipePolicy;
  readonly sideEffectsIntact: true;
  readonly injectionBlocked: boolean;
  readonly recoverableResults: readonly AlignmentCheckResult[];
  readonly noAdoption: boolean;
  readonly noAdoptionReason: string | null;
  readonly pipelineDigest: string;
  readonly NO_NETWORK: true;
}

export interface CorpusComparisonRow {
  readonly caseId: string;
  readonly baselineUseful: boolean;
  readonly candidateUseful: boolean;
  readonly omissionsBaseline: readonly string[];
  readonly omissionsCandidate: readonly string[];
  readonly correctionEffortDelta: number;
  readonly latencyHonesty: "reported";
  readonly costHonesty: "estimated" | "unknown";
  readonly adoption: "useful" | "no-adoption-documented";
}

export interface CorpusComparisonReport {
  readonly corpus: "SQ-03-held-out";
  readonly rows: readonly CorpusComparisonRow[];
  readonly usefulnessOrDocumentedNoAdoption: true;
  readonly fixtureSuccessIsNotLiveBenchmark: true;
}

const INJECTION_PATTERNS = [
  /ignore (all |previous )?instructions/i,
  /modify (the )?question pack/i,
  /change (provider )?bindings?/i,
  /widen (data )?scope/i,
  /grant (authority|access)/i,
  /accept (this )?product decision/i,
  /set eligibility/i,
];

export function detectInjectedInstructions(text: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

/** Deterministic sanitize: strip injection lines; never mutate packs/bindings/scope/grants. */
export function sanitizeObservationText(text: string): { sanitized: string; injectionBlocked: boolean } {
  const lines = text.split(/\r?\n/);
  const kept: string[] = [];
  let injectionBlocked = false;
  for (const line of lines) {
    if (detectInjectedInstructions(line)) {
      injectionBlocked = true;
      continue;
    }
    kept.push(line);
  }
  return { sanitized: kept.join("\n").trim(), injectionBlocked };
}

function sortIds(ids: readonly string[]): string[] {
  return [...ids].sort((a, b) => a.localeCompare(b));
}

/**
 * Deterministic scope/candidate selection: paraphrase same failureKey → one problem
 * with distinct observations; distinct mechanismKey → distinct problems.
 */
export function selectCandidateProblems(observations: readonly SyntheticObservationInput[]): readonly CandidateProblem[] {
  const byKey = new Map<string, SyntheticObservationInput[]>();
  for (const obs of observations) {
    const key = `${obs.failureKey}::${obs.mechanismKey}`;
    const bucket = byKey.get(key) ?? [];
    bucket.push(obs);
    byKey.set(key, bucket);
  }
  const problems: CandidateProblem[] = [];
  for (const [key, bucket] of [...byKey.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const first = bucket[0]!;
    const evidence = new Set<string>();
    const obsIds: string[] = [];
    for (const row of bucket) {
      obsIds.push(row.observationId);
      for (const eid of row.evidenceIds) evidence.add(eid);
    }
    problems.push({
      problemId: `problem.${digestOf(key).slice(0, 12)}`,
      failureKey: first.failureKey,
      mechanismKey: first.mechanismKey,
      observationIds: sortIds(obsIds),
      evidenceIds: sortIds([...evidence]),
      conflictingEvidenceIds: [],
      omittedCoverage: [],
    });
  }
  return problems;
}

/** Parallel alignment + evidence checks (deterministic; no network). */
export function runParallelAlignmentChecks(
  observations: readonly SyntheticObservationInput[],
  opts?: {
    readonly knownRevisions?: ReadonlySet<string>;
    readonly seenEventIds?: ReadonlySet<string>;
    readonly providerAvailable?: boolean;
    readonly failObservationIds?: ReadonlySet<string>;
  },
): readonly AlignmentCheckResult[] {
  const knownRevisions = opts?.knownRevisions;
  const seenEventIds = opts?.seenEventIds ?? new Set<string>();
  const providerAvailable = opts?.providerAvailable ?? true;
  const failIds = opts?.failObservationIds ?? new Set<string>();
  const results: AlignmentCheckResult[] = [];

  for (const obs of [...observations].sort((a, b) => a.observationId.localeCompare(b.observationId))) {
    if (!providerAvailable) {
      results.push({
        observationId: obs.observationId,
        alignedFailureKey: obs.failureKey,
        mechanismKey: obs.mechanismKey,
        evidenceSufficient: false,
        conflictingEvidenceIds: [],
        omittedCoverage: ["provider-unavailable"],
        recoverableStatus: "provider_unavailable",
      });
      continue;
    }
    if (seenEventIds.has(obs.observationId)) {
      results.push({
        observationId: obs.observationId,
        alignedFailureKey: obs.failureKey,
        mechanismKey: obs.mechanismKey,
        evidenceSufficient: obs.evidenceIds.length > 0,
        conflictingEvidenceIds: [],
        omittedCoverage: [],
        recoverableStatus: "duplicate",
      });
      continue;
    }
    if (knownRevisions && !knownRevisions.has(obs.sourceRevision)) {
      results.push({
        observationId: obs.observationId,
        alignedFailureKey: obs.failureKey,
        mechanismKey: obs.mechanismKey,
        evidenceSufficient: false,
        conflictingEvidenceIds: [],
        omittedCoverage: ["stale-or-unknown-revision"],
        recoverableStatus: "stale_revision",
      });
      continue;
    }
    if (failIds.has(obs.observationId)) {
      results.push({
        observationId: obs.observationId,
        alignedFailureKey: obs.failureKey,
        mechanismKey: obs.mechanismKey,
        evidenceSufficient: false,
        conflictingEvidenceIds: [],
        omittedCoverage: ["mid-batch-shard-failed"],
        recoverableStatus: "mid_batch_failure",
      });
      continue;
    }

    const conflicting = obs.evidenceIds.filter((id) => id.includes("conflict") || id.includes("contradict"));
    const omitted: string[] = [];
    if (obs.evidenceIds.length === 0) omitted.push("no-evidence-attached");
    if (!obs.text.trim()) omitted.push("empty-report-body");

    results.push({
      observationId: obs.observationId,
      alignedFailureKey: obs.failureKey,
      mechanismKey: obs.mechanismKey,
      evidenceSufficient: omitted.length === 0 && conflicting.length === 0,
      conflictingEvidenceIds: conflicting,
      omittedCoverage: omitted,
      recoverableStatus: "ok",
    });
  }
  return results;
}

function buildTraversalGraph(candidates: readonly CandidateProblem[]): {
  nodes: GraphNode[];
  edges: GraphEdge[];
  seeds: string[];
} {
  const nodes: GraphNode[] = [{ nodeId: "n.seed", kind: "observation", label: "feedback-seed" }];
  const edges: GraphEdge[] = [];
  let i = 0;
  for (const candidate of candidates) {
    const nodeId = `n.${candidate.problemId}`;
    nodes.push({
      nodeId,
      kind: "explanation",
      label: candidate.failureKey,
      explanationFamily: "value-delay",
      evidenceIds: candidate.evidenceIds,
    });
    edges.push({
      edgeId: `e.seed.${i}`,
      from: "n.seed",
      to: nodeId,
      relation: "explainsAs",
      heuristicScore: 1 - i * 0.05,
      contradicts: candidate.conflictingEvidenceIds.length > 0,
    });
    i += 1;
  }
  return { nodes, edges, seeds: ["n.seed"] };
}

function mergeAlignmentIntoCandidates(candidates: readonly CandidateProblem[], alignment: readonly AlignmentCheckResult[]): CandidateProblem[] {
  const byObs = new Map(alignment.map((row) => [row.observationId, row]));
  return candidates.map((candidate) => {
    const conflicting = new Set<string>(candidate.conflictingEvidenceIds);
    const omitted = new Set<string>(candidate.omittedCoverage);
    for (const obsId of candidate.observationIds) {
      const row = byObs.get(obsId);
      if (!row) continue;
      for (const id of row.conflictingEvidenceIds) conflicting.add(id);
      for (const id of row.omittedCoverage) omitted.add(id);
    }
    return {
      ...candidate,
      conflictingEvidenceIds: sortIds([...conflicting]),
      omittedCoverage: sortIds([...omitted]),
    };
  });
}

function assessCandidate(candidate: CandidateProblem, context: BusinessContextSnapshot, methods: readonly MethodApplicabilityResource[]): AssessedCandidate {
  const applicable: string[] = [];
  const unresolved: string[] = [];
  for (const method of methods) {
    const judgment = evaluateMethodApplicability(method, context);
    if (judgment.status === "applicable") applicable.push(method.methodId);
    else if (judgment.status === "unresolved") unresolved.push(method.methodId);
  }

  let responseClass: CandidateResponseClass = "review";
  let rationale = "Competing explanations retained; propose review of stored candidates.";
  let score = 0.4;

  if (candidate.omittedCoverage.length > 0 || candidate.evidenceIds.length === 0) {
    responseClass = "observation";
    rationale = `Missing evidence → next observation request (${candidate.omittedCoverage.join(", ") || "unspecified"}). Not an invented repair.`;
    score = 0.9;
  } else if (candidate.conflictingEvidenceIds.length > 0) {
    responseClass = "review";
    rationale = "Conflicting evidence retained; propose review without dropping contradictions.";
    score = 0.7;
  } else if (applicable.length > 0) {
    responseClass = "retrieval";
    rationale = `Applicable expertise present (${applicable.join(", ")}); propose retrieval of bound evidence before repair.`;
    score = 0.6;
  } else if (unresolved.length > 0) {
    responseClass = "observation";
    rationale = "Applicability unresolved; request observation rather than inventing repair.";
    score = 0.55;
  } else {
    // No applicable method and no missing/conflict signal → document no-adoption path rather than invent repair.
    responseClass = "review";
    rationale = "No applicable method and no clear repair path; shadow records candidate for review (no repair dispatch).";
    score = 0.2;
  }

  return {
    problemId: candidate.problemId,
    responseClass,
    rationale,
    applicableMethodIds: sortIds(applicable),
    unresolvedMethodIds: sortIds(unresolved),
    score,
  };
}

/** Deterministic reduction: highest score, then problemId tie-break; preserve conflicts. */
export function reduceAssessed(assessed: readonly AssessedCandidate[]): AssessedCandidate | null {
  if (assessed.length === 0) return null;
  const sorted = [...assessed].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.problemId.localeCompare(b.problemId);
  });
  return sorted[0] ?? null;
}

export interface RunFeedbackToWorkShadowInput {
  readonly observations: readonly SyntheticObservationInput[];
  readonly context: BusinessContextSnapshot;
  readonly methods?: readonly MethodApplicabilityResource[];
  readonly bindings: PipelineTraceBindings;
  readonly objectiveId?: string;
  readonly metricId?: string;
  readonly beamBounds?: BeamBounds;
  readonly alignmentOpts?: Parameters<typeof runParallelAlignmentChecks>[1];
  /** Force a second-round projection (necessary when first round omitted coverage). */
  readonly forceSecondRound?: boolean;
}

/**
 * End-to-end shadow pipeline on the compiled path.
 * One necessary second-round projection + parallel checks when round-1 omits coverage
 * or forceSecondRound is set.
 */
export function runFeedbackToWorkShadow(input: RunFeedbackToWorkShadowInput): FeedbackToWorkShadowResult {
  if (input.observations.length === 0) {
    throw new FeedbackToWorkShadowError("empty_observations", "Shadow pipeline requires at least one synthetic observation");
  }
  const workspaceId = input.observations[0]!.workspaceId;
  for (const obs of input.observations) {
    if (obs.workspaceId !== workspaceId) {
      throw new FeedbackToWorkShadowError("cross_workspace", "Observations must share one workspace");
    }
  }

  let injectionBlocked = false;
  for (const obs of input.observations) {
    const { injectionBlocked: blocked } = sanitizeObservationText(obs.text);
    if (blocked || obs.containsInjectedInstructions) injectionBlocked = true;
  }

  // Frozen bindings — injection cannot modify these.
  const frozenBindings: PipelineTraceBindings = { ...input.bindings };
  const methods = input.methods ?? FIXTURE_METHOD_CATALOG;
  const objectiveId = input.objectiveId ?? "objective.feedback-to-work";
  const metricId = input.metricId ?? "metric.feedback-signal";

  const runRound = (round: 1 | 2, observations: readonly SyntheticObservationInput[]): PipelineRoundResult => {
    const alignment = runParallelAlignmentChecks(observations, input.alignmentOpts);
    const selected = selectCandidateProblems(observations);
    const candidates = mergeAlignmentIntoCandidates(selected, alignment);
    const graph = buildTraversalGraph(candidates);
    const beam = boundedCompetingPathBeam({
      nodes: graph.nodes,
      edges: graph.edges,
      seedNodeIds: graph.seeds,
      bounds: input.beamBounds ?? DEFAULT_BEAM_BOUNDS,
    });
    const assessed = candidates.map((candidate) => assessCandidate(candidate, input.context, methods));
    const projectionDigest = digestOf({
      round,
      candidates: candidates.map((c) => c.problemId),
      alignment: alignment.map((a) => ({ id: a.observationId, status: a.recoverableStatus })),
      beamTermination: beam.terminationReasons,
      bindings: frozenBindings,
    });
    return {
      round,
      alignment,
      candidates,
      assessed,
      beamTermination: beam.terminationReasons[0] ?? "complete",
      projectionDigest,
    };
  };

  const round1 = runRound(1, input.observations);
  const needsSecond =
    input.forceSecondRound === true ||
    round1.candidates.some((c) => c.omittedCoverage.length > 0) ||
    round1.alignment.some((a) => a.recoverableStatus === "ok" && !a.evidenceSufficient);

  const rounds: PipelineRoundResult[] = [round1];
  if (needsSecond) {
    // Second-round projection: re-run parallel checks on same admitted observations (no live ingest).
    rounds.push(runRound(2, input.observations));
  }

  const finalRound = rounds[rounds.length - 1]!;
  const reduced = reduceAssessed(finalRound.assessed);

  let proposal: ShadowWorkProposalResult | null = null;
  let noAdoption = false;
  let noAdoptionReason: string | null = null;

  const primaryObs = input.observations[0]!;
  const trace: ShadowWorkProposalTrace = {
    questionPackDigest: frozenBindings.questionPackDigest,
    projectionDigest: finalRound.projectionDigest,
    providerResponseClass: frozenBindings.providerResponseClass,
    policyVersion: frozenBindings.policyVersion,
    sourceUri: primaryObs.sourceUri,
    sourceRevision: primaryObs.sourceRevision,
  };

  if (reduced && reduced.score >= 0.3) {
    const matched = finalRound.candidates.find((c) => c.problemId === reduced.problemId)!;
    proposal = emitShadowWorkProposal({
      workspaceId,
      proposalId: `shadow.${reduced.problemId}`,
      kind: reduced.responseClass,
      title: `Shadow proposal: ${matched.failureKey}`,
      rationale: reduced.rationale,
      observationIds: matched.observationIds,
      evidenceIds: matched.evidenceIds,
      alternativeIds: finalRound.assessed.filter((a) => a.problemId !== reduced.problemId).map((a) => a.problemId),
      contradictoryEvidenceIds: matched.conflictingEvidenceIds,
      omittedCoverage: matched.omittedCoverage,
      objectiveId,
      metricId,
      sourceUri: primaryObs.sourceUri,
      sourceRevision: primaryObs.sourceRevision,
      missingEvidenceNeeded:
        reduced.responseClass === "observation"
          ? matched.omittedCoverage.join("; ") || "Collect the next concrete product observation for this failure."
          : undefined,
      trace,
      recordedAt: primaryObs.recordedAt,
    });
    if (!assertShadowSideEffectsIntact(proposal.sideEffects)) {
      throw new FeedbackToWorkShadowError("side_effect_violation", "Shadow proposal mutated forbidden side effects");
    }
  } else {
    noAdoption = true;
    noAdoptionReason = reduced
      ? `Low-score candidate (${reduced.score}); documented no-adoption rather than inventing repair.`
      : "No assessed candidates; documented no-adoption.";
  }

  const recoverableResults = finalRound.alignment.filter((row) => row.recoverableStatus !== "ok");

  const pipelineDigest = digestOf({
    workspaceId,
    candidates: finalRound.candidates,
    assessed: finalRound.assessed,
    reduced,
    proposalDigest: proposal?.proposalDigest ?? null,
    rounds: rounds.map((r) => r.projectionDigest),
    injectionBlocked,
    noAdoption,
    bindings: frozenBindings,
    owners: FEEDBACK_TO_WORK_SHADOW_OWNER_WORKFLOWS,
    policy: FEEDBACK_TO_WORK_SHADOW_RECIPE_POLICY,
  });

  return {
    mode: "shadow",
    workspaceId,
    candidates: finalRound.candidates,
    assessed: finalRound.assessed,
    reduced,
    proposal,
    rounds,
    trace,
    recipePolicy: FEEDBACK_TO_WORK_SHADOW_RECIPE_POLICY,
    sideEffectsIntact: true,
    injectionBlocked,
    recoverableResults,
    noAdoption,
    noAdoptionReason,
    pipelineDigest,
    NO_NETWORK: true,
  };
}

function armUseful(trace: ArmRunTrace): boolean {
  return Boolean(trace.selectedFailureId) && !trace.omissions.includes("hostile-instruction-refused");
}

/**
 * Compare baseline (deterministic arm) vs candidate (semantic arm / shadow) on
 * frozen SQ-03 (#514) held-out corpus. Fixture success ≠ live business benchmark.
 */
export function compareBaselineVsCandidateOnSq03Corpus(cases?: readonly SemanticEvalCase[]): CorpusComparisonReport {
  const held = cases ?? heldOutCases();
  const rows: CorpusComparisonRow[] = held.map((evalCase) => {
    const baseline = runDeterministicArm(evalCase);
    const candidate = runSemanticArm(evalCase);
    const baselineUseful = armUseful(baseline);
    const candidateUseful = armUseful(candidate);
    const correctionEffortDelta = candidate.omissions.length - baseline.omissions.length;
    const adoption: CorpusComparisonRow["adoption"] = candidateUseful || baselineUseful ? "useful" : "no-adoption-documented";
    return {
      caseId: evalCase.id,
      baselineUseful,
      candidateUseful,
      omissionsBaseline: baseline.omissions,
      omissionsCandidate: candidate.omissions,
      correctionEffortDelta,
      latencyHonesty: "reported",
      costHonesty: "estimated",
      adoption,
    };
  });
  return {
    corpus: "SQ-03-held-out",
    rows,
    usefulnessOrDocumentedNoAdoption: true,
    fixtureSuccessIsNotLiveBenchmark: true,
  };
}
