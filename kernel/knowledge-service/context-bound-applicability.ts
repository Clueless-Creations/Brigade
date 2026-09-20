/**
 * #521 SQ-09 — Context-bound knowledge applicability + deterministic bounded beam
 * over competing explanation paths.
 *
 * Pure helpers only — no network, filesystem, clock, or workspace I/O inside
 * knowledge reads. Consumes #518 batches + #519 graph views + #520 receipts
 * (via callers). Coordinates closed #75 — no new search infra / registry.
 *
 * Applicability is an inference about a method in a particular business context,
 * not a permanent endorsement. Path scores are ranking heuristics — NOT
 * calibrated probabilities or independence claims. Contradictory sources are
 * retained, never silently dropped.
 *
 * NEXT_AFTER=#524 via #523. NO_524_IMPL cleared by #524. NO_525_IMPL cleared by #525. NO_526_IMPL cleared by #526. NO_527_IMPL cleared by #527. NO_528_IMPL cleared by #528. NO_529_IMPL cleared by #529. Does not implement #511 closeout or #573. No founder decision logic.
 * Jev decides (Choice/Score/Noul); LLM writes; code owns beam + applicability.
 */
import { digestOf } from "../../contracts/semantic/canonicalize.js";
import {
  APPLICABILITY_RELATION_TYPES,
  evaluateBoundedCandidates,
  evaluateMethodApplicability,
  type ApplicabilityJudgment,
  type ApplicabilityRelationType,
  type BusinessContextSnapshot,
  type ExplanationFamily,
  type MethodApplicabilityResource,
} from "../../catalog/ontology/knowledge-method-applicability.js";

export const CONTEXT_BOUND_APPLICABILITY_ISSUE = "#521" as const;
export const CONTEXT_BOUND_APPLICABILITY_EPIC = "#511" as const;
export const CONTEXT_BOUND_APPLICABILITY_CONSUMES = ["#518", "#519", "#520"] as const;
export const CONTEXT_BOUND_APPLICABILITY_STAMP = "0.221.42" as const;
export const CONTEXT_BOUND_APPLICABILITY_SCHEMA_VERSION = 1 as const;
export const CONTEXT_BOUND_APPLICABILITY_NO_NETWORK = true as const;
export const CONTEXT_BOUND_APPLICABILITY_NO_REGISTRY = true as const;
export const CONTEXT_BOUND_APPLICABILITY_NO_FOUNDER_LOGIC = true as const;
export const CONTEXT_BOUND_APPLICABILITY_PATH_SCORES_ARE_HEURISTICS = true as const;
export const CONTEXT_BOUND_APPLICABILITY_NEXT_AFTER_CLOSE = "#511" as const;

export class ContextBoundApplicabilityError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ContextBoundApplicabilityError";
    this.code = code;
  }
}

/** Explicit beam termination reasons (AC4). */
export const BEAM_TERMINATION_REASONS = [
  "budget_exhausted",
  "max_depth_reached",
  "max_candidates_reached",
  "max_inference_rounds_reached",
  "cycle_detected",
  "duplicate_path_pruned",
  "adversarial_branch_capped",
  "frontier_empty",
  "complete",
] as const;
export type BeamTerminationReason = (typeof BEAM_TERMINATION_REASONS)[number];

export interface BeamBounds {
  readonly maxDepth: number;
  readonly maxCandidates: number;
  readonly maxInferenceRounds: number;
  /** Total expansion steps (nodes expanded) — hard budget. */
  readonly totalBudget: number;
  /** Max children expanded per node (adversarial broad-branch cap). */
  readonly maxBranchFactor: number;
}

export const DEFAULT_BEAM_BOUNDS: BeamBounds = {
  maxDepth: 4,
  maxCandidates: 16,
  maxInferenceRounds: 8,
  totalBudget: 32,
  maxBranchFactor: 4,
};

export interface GraphNode {
  readonly nodeId: string;
  readonly kind: "observation" | "method" | "evidence" | "explanation";
  readonly label: string;
  readonly methodId?: string;
  readonly explanationFamily?: ExplanationFamily;
  readonly evidenceIds?: readonly string[];
}

export interface GraphEdge {
  readonly edgeId: string;
  readonly from: string;
  readonly to: string;
  readonly relation: ApplicabilityRelationType;
  /** Ranking heuristic only — not a calibrated probability. */
  readonly heuristicScore: number;
  readonly contradicts?: boolean;
}

export interface ExplanationPath {
  readonly pathId: string;
  readonly nodeIds: readonly string[];
  readonly edgeIds: readonly string[];
  readonly explanationFamily: ExplanationFamily | "unknown";
  readonly methodId?: string;
  /** Sum of edge heuristics — ranking only, not causal confidence. */
  readonly heuristicRank: number;
  readonly evidenceIds: readonly string[];
  readonly limitations: readonly string[];
  readonly contradictsPeer: boolean;
}

export interface PrunedAlternative {
  readonly pathId: string;
  readonly reason: BeamTerminationReason | "lower_rank_pruned" | "visited_state_dedupe";
  readonly nodeIds: readonly string[];
  readonly heuristicRank: number;
}

export interface BeamSearchResult {
  readonly retainedPaths: readonly ExplanationPath[];
  readonly prunedAlternatives: readonly PrunedAlternative[];
  readonly terminationReasons: readonly BeamTerminationReason[];
  readonly stats: {
    readonly expansions: number;
    readonly inferenceRounds: number;
    readonly candidatesConsidered: number;
    readonly cyclesDetected: number;
    readonly duplicatesPruned: number;
    readonly adversarialCaps: number;
    readonly maxDepthSeen: number;
  };
  readonly pathScoresAreHeuristics: true;
  readonly contradictorySourcesRetained: true;
}

export interface BeamSearchInput {
  readonly seedNodeIds: readonly string[];
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
  readonly permittedRelations?: readonly ApplicabilityRelationType[];
  readonly bounds?: Partial<BeamBounds>;
  /** Max retained competing explanations (beam width at finish). */
  readonly retainTopK?: number;
}

function assertPermittedRelation(relation: ApplicabilityRelationType, permitted: readonly ApplicabilityRelationType[]): void {
  if (!permitted.includes(relation)) {
    throw new ContextBoundApplicabilityError("relation_not_permitted", `Relation ${relation} not in permitted set`);
  }
}

function pathKey(nodeIds: readonly string[]): string {
  return nodeIds.join(">");
}

function visitedStateKey(nodeId: string, depth: number, methodId: string | undefined): string {
  return `${nodeId}|d=${depth}|m=${methodId ?? "-"}`;
}

/**
 * Deterministic bounded beam over permitted relation types.
 * Visited-state dedupe, max depth, candidate count, inference rounds, total budget,
 * explicit termination reasons. Preserves multiple explanations; records pruned alts.
 */
export function boundedCompetingPathBeam(input: BeamSearchInput): BeamSearchResult {
  const bounds: BeamBounds = { ...DEFAULT_BEAM_BOUNDS, ...input.bounds };
  const permitted = input.permittedRelations ?? [...APPLICABILITY_RELATION_TYPES];
  const retainTopK = input.retainTopK ?? 4;

  const nodeById = new Map(input.nodes.map((n) => [n.nodeId, n]));
  const outEdges = new Map<string, GraphEdge[]>();
  for (const edge of input.edges) {
    assertPermittedRelation(edge.relation, permitted);
    const list = outEdges.get(edge.from) ?? [];
    list.push(edge);
    outEdges.set(edge.from, list);
  }
  // Deterministic edge order: higher heuristic first, then edgeId.
  for (const [, list] of outEdges) {
    list.sort((a, b) => b.heuristicScore - a.heuristicScore || a.edgeId.localeCompare(b.edgeId));
  }

  type FrontierItem = {
    nodeIds: string[];
    edgeIds: string[];
    heuristicRank: number;
    depth: number;
    methodId?: string;
    explanationFamily: ExplanationFamily | "unknown";
    evidenceIds: string[];
    limitations: string[];
    contradictsPeer: boolean;
  };

  const frontier: FrontierItem[] = [];
  for (const seed of [...input.seedNodeIds].sort((a, b) => a.localeCompare(b))) {
    const node = nodeById.get(seed);
    if (!node) continue;
    frontier.push({
      nodeIds: [seed],
      edgeIds: [],
      heuristicRank: 0,
      depth: 0,
      methodId: node.methodId,
      explanationFamily: node.explanationFamily ?? "unknown",
      evidenceIds: [...(node.evidenceIds ?? [])],
      limitations: [],
      contradictsPeer: false,
    });
  }
  // Stable frontier order.
  frontier.sort((a, b) => b.heuristicRank - a.heuristicRank || pathKey(a.nodeIds).localeCompare(pathKey(b.nodeIds)));

  const visited = new Set<string>();
  const completed: FrontierItem[] = [];
  const pruned: PrunedAlternative[] = [];
  const termination = new Set<BeamTerminationReason>();

  let expansions = 0;
  let inferenceRounds = 0;
  let candidatesConsidered = 0;
  let cyclesDetected = 0;
  let duplicatesPruned = 0;
  let adversarialCaps = 0;
  let maxDepthSeen = 0;

  while (frontier.length > 0) {
    if (expansions >= bounds.totalBudget) {
      termination.add("budget_exhausted");
      break;
    }
    if (inferenceRounds >= bounds.maxInferenceRounds) {
      termination.add("max_inference_rounds_reached");
      break;
    }
    if (candidatesConsidered >= bounds.maxCandidates) {
      termination.add("max_candidates_reached");
      break;
    }

    // Pop best (already sorted).
    const current = frontier.shift()!;
    expansions += 1;
    maxDepthSeen = Math.max(maxDepthSeen, current.depth);

    const stateKey = visitedStateKey(current.nodeIds[current.nodeIds.length - 1]!, current.depth, current.methodId);
    if (visited.has(stateKey)) {
      duplicatesPruned += 1;
      pruned.push({
        pathId: `pruned.${digestOf(pathKey(current.nodeIds)).slice(0, 12)}`,
        reason: "visited_state_dedupe",
        nodeIds: current.nodeIds,
        heuristicRank: current.heuristicRank,
      });
      termination.add("duplicate_path_pruned");
      continue;
    }
    visited.add(stateKey);

    const tip = current.nodeIds[current.nodeIds.length - 1]!;
    const children = outEdges.get(tip) ?? [];

    if (children.length === 0 || current.depth >= bounds.maxDepth) {
      if (current.depth >= bounds.maxDepth && children.length > 0) {
        termination.add("max_depth_reached");
        pruned.push({
          pathId: `pruned.depth.${digestOf(pathKey(current.nodeIds)).slice(0, 12)}`,
          reason: "max_depth_reached",
          nodeIds: current.nodeIds,
          heuristicRank: current.heuristicRank,
        });
      }
      completed.push(current);
      candidatesConsidered += 1;
      continue;
    }

    inferenceRounds += 1;
    let branched = 0;
    for (const edge of children) {
      if (branched >= bounds.maxBranchFactor) {
        adversarialCaps += 1;
        termination.add("adversarial_branch_capped");
        pruned.push({
          pathId: `pruned.branch.${edge.edgeId}`,
          reason: "adversarial_branch_capped",
          nodeIds: [...current.nodeIds, edge.to],
          heuristicRank: current.heuristicRank + edge.heuristicScore,
        });
        continue;
      }
      if (current.nodeIds.includes(edge.to)) {
        cyclesDetected += 1;
        termination.add("cycle_detected");
        pruned.push({
          pathId: `pruned.cycle.${edge.edgeId}`,
          reason: "cycle_detected",
          nodeIds: [...current.nodeIds, edge.to],
          heuristicRank: current.heuristicRank + edge.heuristicScore,
        });
        continue;
      }

      const nextNode = nodeById.get(edge.to);
      const next: FrontierItem = {
        nodeIds: [...current.nodeIds, edge.to],
        edgeIds: [...current.edgeIds, edge.edgeId],
        heuristicRank: current.heuristicRank + edge.heuristicScore,
        depth: current.depth + 1,
        methodId: nextNode?.methodId ?? current.methodId,
        explanationFamily: nextNode?.explanationFamily ?? current.explanationFamily,
        evidenceIds: [...new Set([...current.evidenceIds, ...(nextNode?.evidenceIds ?? [])])].sort((a, b) => a.localeCompare(b)),
        limitations: edge.contradicts ? [...current.limitations, `contradiction-via:${edge.edgeId}`] : [...current.limitations],
        contradictsPeer: current.contradictsPeer || Boolean(edge.contradicts),
      };
      frontier.push(next);
      branched += 1;
      candidatesConsidered += 1;
    }

    frontier.sort((a, b) => b.heuristicRank - a.heuristicRank || pathKey(a.nodeIds).localeCompare(pathKey(b.nodeIds)));
  }

  if (frontier.length === 0 && !termination.has("budget_exhausted") && !termination.has("max_inference_rounds_reached")) {
    termination.add("frontier_empty");
  }
  if (completed.length > 0 && termination.size === 0) {
    termination.add("complete");
  }
  // Drain remaining frontier into pruned (budget / round stop) for honesty.
  for (const left of frontier) {
    pruned.push({
      pathId: `pruned.remaining.${digestOf(pathKey(left.nodeIds)).slice(0, 12)}`,
      reason: termination.has("budget_exhausted")
        ? "budget_exhausted"
        : termination.has("max_inference_rounds_reached")
          ? "max_inference_rounds_reached"
          : "lower_rank_pruned",
      nodeIds: left.nodeIds,
      heuristicRank: left.heuristicRank,
    });
  }

  completed.sort((a, b) => b.heuristicRank - a.heuristicRank || pathKey(a.nodeIds).localeCompare(pathKey(b.nodeIds)));
  const retained = completed.slice(0, retainTopK);
  for (const drop of completed.slice(retainTopK)) {
    pruned.push({
      pathId: `pruned.rank.${digestOf(pathKey(drop.nodeIds)).slice(0, 12)}`,
      reason: "lower_rank_pruned",
      nodeIds: drop.nodeIds,
      heuristicRank: drop.heuristicRank,
    });
  }

  const retainedPaths: ExplanationPath[] = retained.map((item) => ({
    pathId: `path.${digestOf(pathKey(item.nodeIds)).slice(0, 16)}`,
    nodeIds: item.nodeIds,
    edgeIds: item.edgeIds,
    explanationFamily: item.explanationFamily,
    ...(item.methodId ? { methodId: item.methodId } : {}),
    heuristicRank: item.heuristicRank,
    evidenceIds: item.evidenceIds,
    limitations: item.limitations,
    contradictsPeer: item.contradictsPeer,
  }));

  const terminationReasons = [...termination].sort((a, b) => a.localeCompare(b));

  return {
    retainedPaths,
    prunedAlternatives: pruned.sort((a, b) => a.pathId.localeCompare(b.pathId)),
    terminationReasons,
    stats: {
      expansions,
      inferenceRounds,
      candidatesConsidered,
      cyclesDetected,
      duplicatesPruned,
      adversarialCaps,
      maxDepthSeen,
    },
    pathScoresAreHeuristics: true,
    contradictorySourcesRetained: true,
  };
}

/**
 * Compile applicability over bounded candidates then attach competing explanation
 * paths for applicable / unresolved methods. Unknown → unresolved (not least-bad).
 */
export function evaluateApplicabilityWithCompetingPaths(input: {
  readonly methods: readonly MethodApplicabilityResource[];
  readonly context: BusinessContextSnapshot;
  readonly topicQuery?: string;
  readonly maxCandidates?: number;
  readonly graph: BeamSearchInput;
}): {
  readonly candidateEvaluation: ReturnType<typeof evaluateBoundedCandidates>;
  readonly beam: BeamSearchResult;
  readonly applicableMethodIds: readonly string[];
  readonly unresolvedMethodIds: readonly string[];
  readonly noMatchEndorsement: "none" | "unknown";
} {
  const candidateEvaluation = evaluateBoundedCandidates({
    methods: input.methods,
    context: input.context,
    topicQuery: input.topicQuery,
    maxCandidates: input.maxCandidates,
  });

  const beam = boundedCompetingPathBeam(input.graph);

  const applicableMethodIds = candidateEvaluation.applicable.map((j) => j.methodId);
  const unresolvedMethodIds = candidateEvaluation.unresolved.map((j) => j.methodId);

  let noMatchEndorsement: "none" | "unknown" = "none";
  if (candidateEvaluation.endorsement === "none") noMatchEndorsement = "none";
  else if (candidateEvaluation.endorsement === "unknown") noMatchEndorsement = "unknown";
  else noMatchEndorsement = "none"; // applicable_set — caller uses applicableMethodIds

  return {
    candidateEvaluation,
    beam,
    applicableMethodIds,
    unresolvedMethodIds,
    noMatchEndorsement: candidateEvaluation.endorsement === "applicable_set" ? "none" : noMatchEndorsement,
  };
}

/**
 * AC1 helper: if the highest-ranked first branch is wrong (not in gold families),
 * recover via another retained path that matches a gold explanation family.
 */
export function recoverViaRetainedPeerPath(input: { readonly beam: BeamSearchResult; readonly goldExplanationFamilies: readonly ExplanationFamily[] }): {
  readonly firstBranchFamily: ExplanationFamily | "unknown" | null;
  readonly firstBranchWrong: boolean;
  readonly recoveredPath: ExplanationPath | null;
  readonly recoverable: boolean;
} {
  const paths = input.beam.retainedPaths;
  if (paths.length === 0) {
    return { firstBranchFamily: null, firstBranchWrong: true, recoveredPath: null, recoverable: false };
  }
  const first = paths[0]!;
  const firstBranchWrong = !input.goldExplanationFamilies.includes(first.explanationFamily as ExplanationFamily);
  const recovered = paths.slice(1).find((p) => input.goldExplanationFamilies.includes(p.explanationFamily as ExplanationFamily)) ?? null;
  return {
    firstBranchFamily: first.explanationFamily,
    firstBranchWrong,
    recoveredPath: recovered,
    recoverable: firstBranchWrong && recovered !== null,
  };
}

export {
  evaluateMethodApplicability,
  evaluateBoundedCandidates,
  type ApplicabilityJudgment,
  type BusinessContextSnapshot,
  type MethodApplicabilityResource,
  type ExplanationFamily,
  type ApplicabilityRelationType,
};
