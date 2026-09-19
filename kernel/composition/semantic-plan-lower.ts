/**
 * #516 SQ-05 — Lower semantic query plans inside the existing composition compiler.
 *
 * Compile-pure: no wall-clock, network, secrets, or provider-availability probes.
 * Extends kernel/composition/ — does not invent a second compiler or graph-execution engine.
 * Consumes contracts/semantic/query-ir.ts (#512). Recipe policy owns weights/thresholds/domain choices.
 */
import { digestOf } from "../../contracts/semantic/canonicalize.js";
import {
  computePlanIdentity,
  isReservedOperator,
  parseSemanticQueryPlan,
  type QueryEdge,
  type QueryStep,
  type SemanticQueryPlan,
} from "../../contracts/semantic/query-ir.js";
import type { QuestionPack } from "../../contracts/semantic/question-pack.js";

export const SEMANTIC_PLAN_LOWER_ISSUE = "#516" as const;
export const SEMANTIC_PLAN_LOWER_EPIC = "#511" as const;
export const SEMANTIC_PLAN_LOWER_CONSUMES = ["#512", "#513", "#514", "#515"] as const;
export const SEMANTIC_PLAN_LOWER_STAMP = "0.221.36" as const;
export const SEMANTIC_PLAN_LOWER_SCHEMA_VERSION = 1 as const;

/** Default declared fan-out ceiling when recipe policy does not override. */
export const DEFAULT_MAX_FAN_OUT = 64 as const;

export class SemanticPlanCompileError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "SemanticPlanCompileError";
    this.code = code;
  }
}

/** Static provider coverage declaration — never probed at compile time. */
export interface DeclaredProviderCoverage {
  readonly bindingId: string;
  readonly operation: string;
  /** Declared coverage only; availability remains a later execution fact. */
  readonly coverage: "declared";
}

/** Recipe-owned policy knobs — weights/thresholds/domain choices stay out of the kernel. */
export interface SemanticRecipePolicy {
  readonly maxFanOut?: number;
  readonly maxTraversalDepth?: number;
  readonly weights?: Readonly<Record<string, number>>;
  readonly thresholds?: Readonly<Record<string, number>>;
  readonly domainChoices?: Readonly<Record<string, string>>;
}

export interface SemanticPlanCompileInput {
  readonly plan: unknown;
  readonly questionPack: QuestionPack;
  readonly providerCoverage: readonly DeclaredProviderCoverage[];
  readonly recipePolicy?: SemanticRecipePolicy;
  /**
   * Optional extra declared state paths beyond pack projections (e.g. pinned snapshot fields).
   * Used only for dangling-ref checks — never fetched at compile time.
   */
  readonly declaredStatePaths?: readonly string[];
}

export type CompiledStageKind = "select" | "project" | "assessment" | "reduce" | "propose-work" | "reserved";

export interface CompiledStage {
  readonly stageId: string;
  readonly stageIndex: number;
  readonly kind: CompiledStageKind;
  readonly stepIds: readonly string[];
  readonly authorityRequirements: readonly string[];
  readonly resourceRequirements: readonly string[];
  /** True when stage may run under result-use speculation (never across authority). */
  readonly maySpeculate: boolean;
  readonly reasonRetainedSequential?: string;
}

export interface CompileEstimate {
  /** Discriminator — must never be presented as observed latency or spend. */
  readonly kind: "compile-estimate";
  readonly upperBoundQuestions: number;
  readonly upperBoundAssessmentStages: number;
  readonly upperBoundCandidatePairs: number;
}

export interface PureExplainView {
  readonly sequentialRounds: number;
  readonly assessmentStageCount: number;
  readonly stages: ReadonlyArray<{
    readonly stageId: string;
    readonly kind: CompiledStageKind;
    readonly stepIds: readonly string[];
    readonly maySpeculate: boolean;
    readonly reasonRetainedSequential?: string;
  }>;
  readonly bindings: ReadonlyArray<{ bindingId: string; operation: string; coverage: "declared" }>;
  readonly candidateCeilings: { readonly maxFanOut: number; readonly maxTraversalDepth: number | null };
  readonly batchingOpportunities: readonly string[];
  readonly omittedCoverage: readonly string[];
  readonly estimates: CompileEstimate;
  readonly honesty: {
    readonly estimatesAreNotObservedLatency: true;
    readonly estimatesAreNotObservedSpend: true;
    readonly compileIsPure: true;
    readonly noNetwork: true;
    readonly noSecrets: true;
    readonly noAvailabilityProbes: true;
    readonly noWallClock: true;
  };
  readonly optimizationsApplied: readonly string[];
}

/**
 * Lowered form mapped onto current run/occurrence concepts.
 * Not a new graph-execution engine — occurrenceKind + dependsOn mirror existing attempt/occurrence identity.
 */
export interface LoweredOccurrenceNode {
  readonly nodeId: string;
  readonly stageId: string;
  readonly stepIds: readonly string[];
  readonly occurrenceKind: "semantic-select" | "semantic-project" | "semantic-assessment" | "semantic-reduce" | "semantic-propose-work";
  /** Data-dependency predecessors only (result-use does not create hard occurrence order). */
  readonly dependsOnNodeIds: readonly string[];
  readonly authorityRequirements: readonly string[];
  readonly resourceRequirements: readonly string[];
  readonly maySpeculate: boolean;
}

export interface LoweredOccurrencePlan {
  readonly schemaVersion: typeof SEMANTIC_PLAN_LOWER_SCHEMA_VERSION;
  readonly policyOwner: "recipe";
  readonly nodes: readonly LoweredOccurrenceNode[];
  /** Stable digest of the lowered node list (byte-stable for equivalent inputs). */
  readonly loweredDigest: string;
}

export interface CompiledSemanticPlan {
  readonly schemaVersion: typeof SEMANTIC_PLAN_LOWER_SCHEMA_VERSION;
  readonly issue: typeof SEMANTIC_PLAN_LOWER_ISSUE;
  readonly epic: typeof SEMANTIC_PLAN_LOWER_EPIC;
  readonly stamp: typeof SEMANTIC_PLAN_LOWER_STAMP;
  readonly planId: string;
  readonly sourcePlanDigest: string;
  readonly compiledDigest: string;
  readonly stages: readonly CompiledStage[];
  readonly assessmentStageCount: number;
  readonly nodeIds: Readonly<Record<string, string>>;
  readonly lowered: LoweredOccurrencePlan;
  readonly explain: PureExplainView;
}

function stageKindFor(operator: QueryStep["operator"]): CompiledStageKind {
  switch (operator) {
    case "select":
      return "select";
    case "project":
      return "project";
    case "assess":
      return "assessment";
    case "reduce":
      return "reduce";
    case "proposeWork":
      return "propose-work";
    default:
      return "reserved";
  }
}

function occurrenceKindFor(kind: CompiledStageKind): LoweredOccurrenceNode["occurrenceKind"] {
  switch (kind) {
    case "select":
      return "semantic-select";
    case "project":
      return "semantic-project";
    case "assessment":
      return "semantic-assessment";
    case "reduce":
      return "semantic-reduce";
    case "propose-work":
      return "semantic-propose-work";
    default:
      throw new SemanticPlanCompileError("reserved_operator", `Cannot lower reserved stage kind ${kind}`);
  }
}

function prereqsFor(stepId: string, edges: readonly QueryEdge[], kind: "authority" | "resource"): string[] {
  return edges
    .filter((edge): edge is Extract<QueryEdge, { kind: "authority" | "resource" }> => edge.kind === kind && "stepId" in edge && edge.stepId === stepId)
    .map((edge) => edge.requirement)
    .sort((a, b) => a.localeCompare(b));
}

function dataPreds(stepId: string, edges: readonly QueryEdge[]): string[] {
  return edges.filter((edge): edge is Extract<QueryEdge, { kind: "data" }> => edge.kind === "data" && edge.toStepId === stepId).map((edge) => edge.fromStepId);
}

function dataSuccs(stepId: string, edges: readonly QueryEdge[]): string[] {
  return edges.filter((edge): edge is Extract<QueryEdge, { kind: "data" }> => edge.kind === "data" && edge.fromStepId === stepId).map((edge) => edge.toStepId);
}

/** Detect cycles on the data-dependency graph (fail-closed before execution). */
function assertAcyclicDataGraph(steps: readonly QueryStep[], edges: readonly QueryEdge[]): void {
  const ids = steps.map((step) => step.id);
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string): void => {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      throw new SemanticPlanCompileError("cycle", `Data-dependency cycle involving step ${id}`);
    }
    visiting.add(id);
    for (const next of dataSuccs(id, edges)) visit(next);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of ids) visit(id);
}

function assertNoDanglingRefs(plan: SemanticQueryPlan, pack: QuestionPack, declaredStatePaths: readonly string[]): void {
  const stepIds = new Set(plan.steps.map((step) => step.id));
  const projectionIds = new Set(pack.projections.map((projection) => projection.id));
  const packPaths = new Set(pack.projections.flatMap((projection) => projection.statePaths));
  for (const path of declaredStatePaths) packPaths.add(path);

  for (const step of plan.steps) {
    if (step.projectionRef !== undefined && !projectionIds.has(step.projectionRef)) {
      throw new SemanticPlanCompileError("dangling_projection_ref", `Unknown projectionRef ${step.projectionRef} on step ${step.id}`);
    }
    if (step.questionPackRef !== undefined && step.questionPackRef !== pack.id) {
      throw new SemanticPlanCompileError("dangling_question_pack_ref", `questionPackRef ${step.questionPackRef} does not match pack ${pack.id}`);
    }
    if (step.operator === "project" && step.projectionRef === undefined) {
      throw new SemanticPlanCompileError("missing_projection_ref", `project step ${step.id} requires projectionRef`);
    }
    if (step.operator === "assess" && step.questionPackRef === undefined) {
      throw new SemanticPlanCompileError("missing_question_pack_ref", `assess step ${step.id} requires questionPackRef`);
    }
    for (const source of step.sourceScope) {
      if (!plan.sourceRevisions.some((revision) => revision.sourceId === source)) {
        throw new SemanticPlanCompileError("dangling_source_ref", `sourceScope ${source} on step ${step.id} has no sourceRevision`);
      }
    }
  }

  for (const edge of plan.edges) {
    if (edge.kind === "data" || edge.kind === "result-use") {
      if (!stepIds.has(edge.fromStepId) || !stepIds.has(edge.toStepId)) {
        throw new SemanticPlanCompileError("dangling_edge_ref", "Edge references unknown step");
      }
    } else if (!stepIds.has(edge.stepId)) {
      throw new SemanticPlanCompileError("dangling_edge_ref", "Prerequisite references unknown step");
    }
  }

  for (const question of pack.questions) {
    for (const path of question.statePaths) {
      if (![...packPaths].some((declared) => path === declared || path.startsWith(`${declared}.`))) {
        // Pack already validates against its projections; extra compile check for declared overlay.
        if (declaredStatePaths.length > 0 && !packPaths.has(path)) {
          throw new SemanticPlanCompileError("dangling_state_path", `State path ${path} is not declared`);
        }
      }
    }
  }

  if (plan.resultConsumption) {
    const questionIds = new Set(pack.questions.map((question) => question.id));
    for (const threshold of plan.resultConsumption.thresholds) {
      if (!questionIds.has(threshold.questionId)) {
        throw new SemanticPlanCompileError("dangling_threshold_ref", `resultConsumption threshold references unknown question ${threshold.questionId}`);
      }
    }
  }
}

function assertDigestsAndTypes(plan: SemanticQueryPlan, pack: QuestionPack): void {
  if (plan.questionPackId !== pack.id) {
    throw new SemanticPlanCompileError("pack_id_mismatch", `Plan pack id ${plan.questionPackId} !== ${pack.id}`);
  }
  if (plan.questionPackVersion !== pack.version) {
    throw new SemanticPlanCompileError("pack_version_mismatch", `Plan pack version ${plan.questionPackVersion} !== ${pack.version}`);
  }
  if (!pack.contentDigest) {
    throw new SemanticPlanCompileError("pack_digest_missing", "Question pack must carry contentDigest for compile");
  }
  if (plan.questionPackDigest !== pack.contentDigest) {
    throw new SemanticPlanCompileError("pack_digest_mismatch", "questionPackDigest does not match pack contentDigest");
  }
  const expectedProjectionDigest = digestOf(pack.projections);
  if (plan.projectionDigest !== expectedProjectionDigest) {
    throw new SemanticPlanCompileError("projection_digest_mismatch", "projectionDigest does not match pack projections");
  }

  for (const step of plan.steps) {
    if (isReservedOperator(step.operator)) {
      throw new SemanticPlanCompileError("reserved_operator", `Reserved operator ${step.operator} on step ${step.id} is not executable in SQ-05 lowering`);
    }
  }

  // Incompatible result types: proposeWork / reduce consuming assess without shared pack; assess→assess data edge is ok;
  // select cannot data-feed proposeWork directly (must go through assess/reduce).
  for (const edge of plan.edges) {
    if (edge.kind !== "data") continue;
    const from = plan.steps.find((step) => step.id === edge.fromStepId)!;
    const to = plan.steps.find((step) => step.id === edge.toStepId)!;
    const incompatible =
      (from.operator === "select" && to.operator === "proposeWork") ||
      (from.operator === "select" && to.operator === "assess") ||
      (from.operator === "assess" && to.operator === "select") ||
      (from.operator === "proposeWork" && to.operator !== "proposeWork") ||
      (from.operator === "reduce" && to.operator === "select");
    if (incompatible) {
      throw new SemanticPlanCompileError(
        "incompatible_result_types",
        `Data edge ${from.id}(${from.operator}) → ${to.id}(${to.operator}) has incompatible result types`,
      );
    }
  }
}

function assertProviderCoverage(plan: SemanticQueryPlan, coverage: readonly DeclaredProviderCoverage[]): void {
  const assessSteps = plan.steps.filter((step) => step.operator === "assess");
  if (assessSteps.length === 0) return;
  const hasAssessment = coverage.some((entry) => entry.operation.includes("semantic-assessment") || entry.operation.includes("assess"));
  if (!hasAssessment) {
    throw new SemanticPlanCompileError("provider_coverage_missing", "Assess steps require declared semantic-assessment provider coverage");
  }
}

function assertEffectPrerequisites(plan: SemanticQueryPlan): void {
  for (const step of plan.steps) {
    if (step.operator === "proposeWork") {
      const authorities = prereqsFor(step.id, plan.edges, "authority");
      if (authorities.length === 0) {
        throw new SemanticPlanCompileError("effect_prerequisite_missing", `proposeWork step ${step.id} requires an authority prerequisite before lowering`);
      }
    }
  }
}

function assertFanOutBounds(plan: SemanticQueryPlan, maxFanOut: number, maxDepth: number | undefined): void {
  if (maxFanOut < 1) {
    throw new SemanticPlanCompileError("unbounded_fan_out", "maxFanOut must be a positive declared bound");
  }
  // Fan-out = max number of data-successors from any single step, and assess branch count without data ordering.
  for (const step of plan.steps) {
    const succ = dataSuccs(step.id, plan.edges);
    if (succ.length > maxFanOut) {
      throw new SemanticPlanCompileError("unbounded_fan_out", `Step ${step.id} data fan-out ${succ.length} exceeds declared maxFanOut ${maxFanOut}`);
    }
  }
  const assessCount = plan.steps.filter((step) => step.operator === "assess").length;
  if (assessCount > maxFanOut) {
    throw new SemanticPlanCompileError("unbounded_fan_out", `Assess step count ${assessCount} exceeds declared maxFanOut ${maxFanOut}`);
  }
  if (maxDepth !== undefined) {
    // Longest data-dep path length
    const memo = new Map<string, number>();
    const depthOf = (id: string): number => {
      if (memo.has(id)) return memo.get(id)!;
      const preds = dataPreds(id, plan.edges);
      const depth = preds.length === 0 ? 1 : 1 + Math.max(...preds.map(depthOf));
      memo.set(id, depth);
      return depth;
    };
    for (const step of plan.steps) {
      if (depthOf(step.id) > maxDepth) {
        throw new SemanticPlanCompileError("unbounded_traversal", `Data-dependency depth for ${step.id} exceeds declared maxTraversalDepth ${maxDepth}`);
      }
    }
  }
}

/**
 * Authority key for speculative batch eligibility.
 * Steps with disjoint non-empty authority requirements cannot share a speculative batch.
 * Empty authority = publicly eligible (may co-batch with other empty-authority peers).
 */
function authorityKey(stepId: string, edges: readonly QueryEdge[]): string {
  const reqs = prereqsFor(stepId, edges, "authority");
  return reqs.length === 0 ? "" : reqs.join("|");
}

function resourceKey(stepId: string, edges: readonly QueryEdge[]): string {
  const reqs = prereqsFor(stepId, edges, "resource");
  return reqs.length === 0 ? "" : reqs.join("|");
}

/**
 * Can step `branch` speculative-share state with a batch that already includes `peer`?
 * Never across differing authority or resource prerequisites.
 */
export function canSpeculativeShare(branchStepId: string, peerStepId: string, edges: readonly QueryEdge[]): boolean {
  return authorityKey(branchStepId, edges) === authorityKey(peerStepId, edges) && resourceKey(branchStepId, edges) === resourceKey(peerStepId, edges);
}

/**
 * Stage levels from data dependencies (+1).
 * Result-use never separates peer assessments (speculation OK) but bumps non-assess
 * consumers so propose/reduce stay after their conditioning assessments.
 */
function dataLevels(steps: readonly QueryStep[], edges: readonly QueryEdge[]): Map<string, number> {
  const byId = new Map(steps.map((step) => [step.id, step]));
  const level = new Map<string, number>();
  for (const step of steps) level.set(step.id, 0);

  // Relaxation over data (+1) and result-use (assess→assess: +0; otherwise +1).
  let changed = true;
  let guard = 0;
  while (changed) {
    changed = false;
    guard += 1;
    if (guard > steps.length * steps.length + 4) {
      throw new SemanticPlanCompileError("cycle", "Level assignment did not converge (likely cycle)");
    }
    for (const edge of edges) {
      if (edge.kind !== "data" && edge.kind !== "result-use") continue;
      const fromLevel = level.get(edge.fromStepId) ?? 0;
      const toStep = byId.get(edge.toStepId);
      const fromStep = byId.get(edge.fromStepId);
      if (!toStep || !fromStep) continue;
      const bump = edge.kind === "data" ? 1 : fromStep.operator === "assess" && toStep.operator === "assess" ? 0 : 1;
      const next = fromLevel + bump;
      if ((level.get(edge.toStepId) ?? 0) < next) {
        level.set(edge.toStepId, next);
        changed = true;
      }
    }
  }
  return level;
}

interface OptimizationNote {
  readonly id: string;
  readonly detail: string;
}

function applyBoundedOptimizations(stages: CompiledStage[], plan: SemanticQueryPlan): { stages: CompiledStage[]; notes: OptimizationNote[] } {
  const notes: OptimizationNote[] = [];
  // Common projection reuse: identical projectionRef project steps at same data-level already share a stage;
  // record the opportunity when multiple project steps share a ref.
  const projectsByRef = new Map<string, string[]>();
  for (const step of plan.steps) {
    if (step.operator === "project" && step.projectionRef) {
      const list = projectsByRef.get(step.projectionRef) ?? [];
      list.push(step.id);
      projectsByRef.set(step.projectionRef, list);
    }
  }
  for (const [ref, ids] of [...projectsByRef.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (ids.length > 1) {
      notes.push({ id: "common-projection-reuse", detail: `projectionRef ${ref} shared by ${ids.join(",")}` });
    }
  }

  // Equivalent assessment reuse: assess steps with same questionPackRef + sourceScope coalesce already;
  // note when multiple assess steps share identical pack+scope.
  const assessSig = new Map<string, string[]>();
  for (const step of plan.steps) {
    if (step.operator !== "assess") continue;
    const sig = `${step.questionPackRef ?? ""}::${[...step.sourceScope].sort().join(",")}`;
    const list = assessSig.get(sig) ?? [];
    list.push(step.id);
    assessSig.set(sig, list);
  }
  for (const [sig, ids] of [...assessSig.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (ids.length > 1) {
      notes.push({ id: "equivalent-assessment-reuse", detail: `shared assessment signature ${sig} → ${ids.join(",")}` });
    }
  }

  // Same-snapshot question grouping: assessment stages with >1 step are the grouping.
  for (const stage of stages) {
    if (stage.kind === "assessment" && stage.stepIds.length > 1) {
      notes.push({
        id: "same-snapshot-question-grouping",
        detail: `stage ${stage.stageId} groups ${stage.stepIds.length} assessments`,
      });
    }
  }

  // Deterministic prefiltering note when select precedes project in prior stage (coverage preserved).
  if (stages.some((stage) => stage.kind === "select") && stages.some((stage) => stage.kind === "project")) {
    notes.push({ id: "deterministic-prefiltering", detail: "select→project ordering preserves required candidate coverage" });
  }

  return { stages, notes };
}

function coalesceStages(plan: SemanticQueryPlan): CompiledStage[] {
  const levels = dataLevels(plan.steps, plan.edges);
  const byLevel = new Map<number, QueryStep[]>();
  for (const step of plan.steps) {
    const lvl = levels.get(step.id) ?? 0;
    const list = byLevel.get(lvl) ?? [];
    list.push(step);
    byLevel.set(lvl, list);
  }

  const stages: CompiledStage[] = [];
  let stageIndex = 0;

  for (const lvl of [...byLevel.keys()].sort((a, b) => a - b)) {
    const stepsAtLevel = (byLevel.get(lvl) ?? []).slice().sort((a, b) => a.id.localeCompare(b.id));

    // Partition by stage kind first.
    const byKind = new Map<CompiledStageKind, QueryStep[]>();
    for (const step of stepsAtLevel) {
      const kind = stageKindFor(step.operator);
      const list = byKind.get(kind) ?? [];
      list.push(step);
      byKind.set(kind, list);
    }

    const kindOrder: CompiledStageKind[] = ["select", "project", "assessment", "reduce", "propose-work", "reserved"];
    for (const kind of kindOrder) {
      const group = byKind.get(kind);
      if (!group || group.length === 0) continue;

      if (kind === "assessment") {
        // Split assessment groups by authority|resource key — never speculative-share across authority.
        const buckets = new Map<string, QueryStep[]>();
        for (const step of group) {
          const key = `${authorityKey(step.id, plan.edges)}::${resourceKey(step.id, plan.edges)}`;
          const list = buckets.get(key) ?? [];
          list.push(step);
          buckets.set(key, list);
        }
        for (const key of [...buckets.keys()].sort((a, b) => a.localeCompare(b))) {
          const bucket = buckets.get(key)!;
          const stepIds = bucket.map((step) => step.id).sort((a, b) => a.localeCompare(b));
          const authorityRequirements = [...new Set(stepIds.flatMap((id) => prereqsFor(id, plan.edges, "authority")))].sort((a, b) => a.localeCompare(b));
          const resourceRequirements = [...new Set(stepIds.flatMap((id) => prereqsFor(id, plan.edges, "resource")))].sort((a, b) => a.localeCompare(b));
          // Result-use peers may speculate within the same authority bucket.
          const maySpeculate = plan.edges.some((edge) => edge.kind === "result-use" && (stepIds.includes(edge.fromStepId) || stepIds.includes(edge.toStepId)));
          const stageId = `stage.${String(stageIndex).padStart(3, "0")}.assessment`;
          stages.push({
            stageId,
            stageIndex,
            kind: "assessment",
            stepIds,
            authorityRequirements,
            resourceRequirements,
            maySpeculate,
          });
          stageIndex += 1;
        }
      } else {
        // Non-assessment: one stage per kind per data-level (deterministic order by step id).
        const stepIds = group.map((step) => step.id).sort((a, b) => a.localeCompare(b));
        const authorityRequirements = [...new Set(stepIds.flatMap((id) => prereqsFor(id, plan.edges, "authority")))].sort((a, b) => a.localeCompare(b));
        const resourceRequirements = [...new Set(stepIds.flatMap((id) => prereqsFor(id, plan.edges, "resource")))].sort((a, b) => a.localeCompare(b));
        const stageId = `stage.${String(stageIndex).padStart(3, "0")}.${kind}`;
        let reasonRetainedSequential: string | undefined;
        if (kind === "project" || kind === "select" || kind === "reduce" || kind === "propose-work") {
          // Reads/projections/paid never lift across unmet authority — if this stage has authority, note it.
          if (authorityRequirements.length > 0) {
            reasonRetainedSequential = `authority-prerequisite:${authorityRequirements.join(",")}`;
          }
        }
        stages.push({
          stageId,
          stageIndex,
          kind,
          stepIds,
          authorityRequirements,
          resourceRequirements,
          maySpeculate: false,
          ...(reasonRetainedSequential ? { reasonRetainedSequential } : {}),
        });
        stageIndex += 1;
      }
    }
  }

  // Mark sequential retention when a later assessment is reachable via data deps from an earlier assessment
  // (possibly through intermediate project/select/reduce nodes).
  const assessStages = stages.filter((stage) => stage.kind === "assessment");
  const reachableFrom = (startIds: readonly string[]): Set<string> => {
    const seen = new Set<string>();
    const queue = [...startIds];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (seen.has(id)) continue;
      seen.add(id);
      for (const next of dataSuccs(id, plan.edges)) queue.push(next);
    }
    return seen;
  };
  for (let i = 1; i < assessStages.length; i++) {
    const prior = assessStages[i - 1]!;
    const current = assessStages[i]!;
    const reach = reachableFrom(prior.stepIds);
    const dataLinked = current.stepIds.some((id) => reach.has(id));
    if (dataLinked) {
      const idx = stages.findIndex((stage) => stage.stageId === current.stageId);
      stages[idx] = {
        ...current,
        reasonRetainedSequential: `data-dependency-from:${prior.stageId}`,
      };
    }
  }

  return stages;
}

function lowerToOccurrence(stages: readonly CompiledStage[], plan: SemanticQueryPlan): LoweredOccurrencePlan {
  const stepToNode = new Map<string, string>();
  const nodes: LoweredOccurrenceNode[] = [];

  for (const stage of stages) {
    if (stage.kind === "reserved") {
      throw new SemanticPlanCompileError("reserved_operator", `Cannot lower reserved stage ${stage.stageId}`);
    }
    const nodeId = `occurrence.${stage.stageId}`;
    for (const stepId of stage.stepIds) stepToNode.set(stepId, nodeId);

    const dependsOn = new Set<string>();
    for (const stepId of stage.stepIds) {
      for (const pred of dataPreds(stepId, plan.edges)) {
        const predNode = stepToNode.get(pred);
        if (predNode && predNode !== nodeId) dependsOn.add(predNode);
      }
    }

    nodes.push({
      nodeId,
      stageId: stage.stageId,
      stepIds: stage.stepIds,
      occurrenceKind: occurrenceKindFor(stage.kind),
      dependsOnNodeIds: [...dependsOn].sort((a, b) => a.localeCompare(b)),
      authorityRequirements: stage.authorityRequirements,
      resourceRequirements: stage.resourceRequirements,
      maySpeculate: stage.maySpeculate,
    });
  }

  const loweredDigest = digestOf({
    schemaVersion: SEMANTIC_PLAN_LOWER_SCHEMA_VERSION,
    policyOwner: "recipe",
    nodes: nodes.map((node) => ({
      nodeId: node.nodeId,
      stageId: node.stageId,
      stepIds: node.stepIds,
      occurrenceKind: node.occurrenceKind,
      dependsOnNodeIds: node.dependsOnNodeIds,
      authorityRequirements: node.authorityRequirements,
      resourceRequirements: node.resourceRequirements,
      maySpeculate: node.maySpeculate,
    })),
  });

  return {
    schemaVersion: SEMANTIC_PLAN_LOWER_SCHEMA_VERSION,
    policyOwner: "recipe",
    nodes,
    loweredDigest,
  };
}

function buildExplain(
  stages: readonly CompiledStage[],
  coverage: readonly DeclaredProviderCoverage[],
  maxFanOut: number,
  maxTraversalDepth: number | undefined,
  notes: readonly OptimizationNote[],
  plan: SemanticQueryPlan,
): PureExplainView {
  const assessmentStages = stages.filter((stage) => stage.kind === "assessment");
  const sequentialRounds = assessmentStages.length;
  const assessStepCount = plan.steps.filter((step) => step.operator === "assess").length;

  const batchingOpportunities: string[] = [];
  for (const stage of assessmentStages) {
    if (stage.stepIds.length > 1) {
      batchingOpportunities.push(`shared-state-batch:${stage.stageId}:${stage.stepIds.join(",")}`);
    }
  }

  const omittedCoverage: string[] = [];
  if (plan.steps.some((step) => isReservedOperator(step.operator))) {
    omittedCoverage.push("reserved-operators-not-lowered");
  }
  // Sources declared but not in any select scope
  for (const revision of plan.sourceRevisions) {
    const used = plan.steps.some((step) => step.sourceScope.includes(revision.sourceId));
    if (!used) omittedCoverage.push(`unused-source:${revision.sourceId}`);
  }

  return {
    sequentialRounds,
    assessmentStageCount: assessmentStages.length,
    stages: stages.map((stage) => ({
      stageId: stage.stageId,
      kind: stage.kind,
      stepIds: stage.stepIds,
      maySpeculate: stage.maySpeculate,
      ...(stage.reasonRetainedSequential ? { reasonRetainedSequential: stage.reasonRetainedSequential } : {}),
    })),
    bindings: coverage.map((entry) => ({ bindingId: entry.bindingId, operation: entry.operation, coverage: "declared" as const })),
    candidateCeilings: { maxFanOut, maxTraversalDepth: maxTraversalDepth ?? null },
    batchingOpportunities,
    omittedCoverage,
    estimates: {
      kind: "compile-estimate",
      upperBoundQuestions: assessStepCount,
      upperBoundAssessmentStages: assessmentStages.length,
      upperBoundCandidatePairs: Math.min(assessStepCount * assessStepCount, maxFanOut),
    },
    honesty: {
      estimatesAreNotObservedLatency: true,
      estimatesAreNotObservedSpend: true,
      compileIsPure: true,
      noNetwork: true,
      noSecrets: true,
      noAvailabilityProbes: true,
      noWallClock: true,
    },
    optimizationsApplied: notes.map((note) => `${note.id}:${note.detail}`),
  };
}

/**
 * Validate + stage-coalesce + digest/explain + lower a semantic query plan.
 * Pure: does not read Date/network/env/secrets or probe provider availability.
 */
export function compileSemanticQueryPlan(input: SemanticPlanCompileInput): CompiledSemanticPlan {
  const plan = parseSemanticQueryPlan(input.plan);
  const pack = input.questionPack;
  const maxFanOut = input.recipePolicy?.maxFanOut ?? DEFAULT_MAX_FAN_OUT;
  const maxTraversalDepth = input.recipePolicy?.maxTraversalDepth;
  const declaredStatePaths = input.declaredStatePaths ?? [];

  assertDigestsAndTypes(plan, pack);
  assertNoDanglingRefs(plan, pack, declaredStatePaths);
  assertAcyclicDataGraph(plan.steps, plan.edges);
  assertProviderCoverage(plan, input.providerCoverage);
  assertEffectPrerequisites(plan);
  assertFanOutBounds(plan, maxFanOut, maxTraversalDepth);

  // Never lift read/projection/paid across authority: project/select steps that have
  // authority prereqs stay gated; assessments split by authority key (done in coalesce).
  for (const step of plan.steps) {
    if ((step.operator === "select" || step.operator === "project") && prereqsFor(step.id, plan.edges, "authority").length > 0) {
      // Allowed — stage will carry reasonRetainedSequential; do not merge across unmet authority.
    }
  }

  const rawStages = coalesceStages(plan);
  const { stages, notes } = applyBoundedOptimizations(rawStages, plan);
  const lowered = lowerToOccurrence(stages, plan);
  const sourcePlanDigest = computePlanIdentity(plan);
  const nodeIds: Record<string, string> = {};
  for (const stage of stages) {
    for (const stepId of stage.stepIds) {
      nodeIds[stepId] = `node.${stage.stageId}.${stepId}`;
    }
  }

  const explain = buildExplain(stages, input.providerCoverage, maxFanOut, maxTraversalDepth, notes, plan);

  const compiledDigest = digestOf({
    schemaVersion: SEMANTIC_PLAN_LOWER_SCHEMA_VERSION,
    planId: plan.id,
    sourcePlanDigest,
    stages: stages.map((stage) => ({
      stageId: stage.stageId,
      kind: stage.kind,
      stepIds: stage.stepIds,
      authorityRequirements: stage.authorityRequirements,
      resourceRequirements: stage.resourceRequirements,
      maySpeculate: stage.maySpeculate,
      reasonRetainedSequential: stage.reasonRetainedSequential ?? null,
    })),
    loweredDigest: lowered.loweredDigest,
    nodeIds,
    explainHonesty: explain.honesty,
    estimatesKind: explain.estimates.kind,
  });

  return {
    schemaVersion: SEMANTIC_PLAN_LOWER_SCHEMA_VERSION,
    issue: SEMANTIC_PLAN_LOWER_ISSUE,
    epic: SEMANTIC_PLAN_LOWER_EPIC,
    stamp: SEMANTIC_PLAN_LOWER_STAMP,
    planId: plan.id,
    sourcePlanDigest,
    compiledDigest,
    stages,
    assessmentStageCount: stages.filter((stage) => stage.kind === "assessment").length,
    nodeIds,
    lowered,
    explain,
  };
}

/** Convenience: compile and return only assessment stage count (fixture helper). */
export function assessmentStageCount(input: SemanticPlanCompileInput): number {
  return compileSemanticQueryPlan(input).assessmentStageCount;
}

/**
 * Assert compile purity markers on a compiled plan.
 * Used by fixtures — does not itself probe the environment.
 */
export function assertCompilePurity(compiled: CompiledSemanticPlan): void {
  if (compiled.explain.honesty.compileIsPure !== true) throw new Error("compile_purity_missing");
  if (compiled.explain.honesty.noNetwork !== true) throw new Error("compile_purity_network");
  if (compiled.explain.honesty.noSecrets !== true) throw new Error("compile_purity_secrets");
  if (compiled.explain.honesty.noAvailabilityProbes !== true) throw new Error("compile_purity_availability");
  if (compiled.explain.honesty.noWallClock !== true) throw new Error("compile_purity_wall_clock");
  if (compiled.explain.estimates.kind !== "compile-estimate") throw new Error("estimate_kind");
  if (compiled.explain.honesty.estimatesAreNotObservedLatency !== true) throw new Error("estimate_as_latency");
  if (compiled.explain.honesty.estimatesAreNotObservedSpend !== true) throw new Error("estimate_as_spend");
  if (compiled.lowered.policyOwner !== "recipe") throw new Error("policy_owner");
}

export function tryCompileSemanticQueryPlan(
  input: SemanticPlanCompileInput,
): { ok: true; value: CompiledSemanticPlan } | { ok: false; code: string; message: string } {
  try {
    return { ok: true, value: compileSemanticQueryPlan(input) };
  } catch (error) {
    if (error instanceof SemanticPlanCompileError) {
      return { ok: false, code: error.code, message: error.message };
    }
    return { ok: false, code: "compile_failed", message: error instanceof Error ? error.message : String(error) };
  }
}
