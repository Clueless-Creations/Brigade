import { z } from "zod";
import { digestOf } from "./canonicalize.js";

/**
 * Typed semantic query IR (SQ-01). Named operators from #512; only the initial slice is
 * executable-capable. Reserved operators exist as types only — not an executable surface.
 *
 * Data dependencies, result-use conditions, and authority/resource prerequisites are separate.
 * Thresholds and result-consumption policy stay outside inference results.
 */

export const QUERY_IR_SCHEMA_VERSION = 1 as const;
export const PLAN_IDENTITY_CANONICALIZATION_VERSION = 1 as const;

export const SEMANTIC_OPERATORS = [
  "select",
  "project",
  "assess",
  "semanticFilter",
  "semanticJoin",
  "classifyEdge",
  "traverse",
  "reduce",
  "proposeWork",
] as const;
export type SemanticOperator = (typeof SEMANTIC_OPERATORS)[number];

export const INITIAL_SLICE_OPERATORS = ["select", "project", "assess", "reduce", "proposeWork"] as const;
export type InitialSliceOperator = (typeof INITIAL_SLICE_OPERATORS)[number];

export const RESERVED_OPERATORS = ["semanticFilter", "semanticJoin", "classifyEdge", "traverse"] as const;
export type ReservedOperator = (typeof RESERVED_OPERATORS)[number];

export function isInitialSliceOperator(operator: SemanticOperator): operator is InitialSliceOperator {
  return (INITIAL_SLICE_OPERATORS as readonly string[]).includes(operator);
}

export function isReservedOperator(operator: SemanticOperator): operator is ReservedOperator {
  return (RESERVED_OPERATORS as readonly string[]).includes(operator);
}

const id = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-z][a-z0-9._:-]*$/u);
const nonEmptyText = z.string().trim().min(1).max(2000);
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u);

export const dataDependencySchema = z.strictObject({
  kind: z.literal("data"),
  fromStepId: id,
  toStepId: id,
  outputKey: id.optional(),
});

export const resultUseConditionSchema = z.strictObject({
  kind: z.literal("result-use"),
  fromStepId: id,
  toStepId: id,
  predicate: nonEmptyText.max(500),
});

export const authorityPrerequisiteSchema = z.strictObject({
  kind: z.literal("authority"),
  stepId: id,
  requirement: nonEmptyText.max(500),
});

export const resourcePrerequisiteSchema = z.strictObject({
  kind: z.literal("resource"),
  stepId: id,
  requirement: nonEmptyText.max(500),
});

export const queryEdgeSchema = z.discriminatedUnion("kind", [
  dataDependencySchema,
  resultUseConditionSchema,
  authorityPrerequisiteSchema,
  resourcePrerequisiteSchema,
]);
export type QueryEdge = z.infer<typeof queryEdgeSchema>;

export const queryStepSchema = z.strictObject({
  id,
  operator: z.enum(SEMANTIC_OPERATORS),
  /** initial-slice = may later execute; reserved = types-only in this increment. */
  support: z.enum(["initial-slice", "reserved"]),
  questionPackRef: id.optional(),
  projectionRef: id.optional(),
  sourceScope: z.array(nonEmptyText.max(320)).max(64).default([]),
  notes: nonEmptyText.max(1000).optional(),
});
export type QueryStep = z.infer<typeof queryStepSchema>;

export const resultConsumptionPolicySchema = z.strictObject({
  schemaVersion: z.literal(1),
  thresholds: z
    .array(
      z.strictObject({
        questionId: id,
        metric: z.enum(["probability", "expectation", "selected-option"]),
        comparison: z.enum(["gte", "lte", "eq"]),
        value: z.union([z.number().finite(), z.string().trim().min(1).max(160)]),
      }),
    )
    .max(128)
    .default([]),
  onFailure: z.enum(["retain", "omit-branch", "require-observation"]).default("retain"),
});
export type ResultConsumptionPolicy = z.infer<typeof resultConsumptionPolicySchema>;

export const semanticQueryPlanSchema = z.strictObject({
  schemaVersion: z.literal(QUERY_IR_SCHEMA_VERSION),
  id,
  questionPackId: id,
  questionPackVersion: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/u)
    .max(32),
  questionPackDigest: sha256,
  projectionDigest: sha256,
  sourceRevisions: z
    .array(
      z.strictObject({
        sourceId: id,
        revision: nonEmptyText.max(320),
      }),
    )
    .min(1)
    .max(128),
  steps: z.array(queryStepSchema).min(1).max(256),
  edges: z.array(queryEdgeSchema).max(512).default([]),
  resultConsumption: resultConsumptionPolicySchema.optional(),
  canonicalizationVersion: z.literal(PLAN_IDENTITY_CANONICALIZATION_VERSION),
});
export type SemanticQueryPlan = z.infer<typeof semanticQueryPlanSchema>;

export class QueryIrValidationError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "QueryIrValidationError";
    this.code = code;
  }
}

export function parseSemanticQueryPlan(input: unknown): SemanticQueryPlan {
  return assertQueryPlanInvariants(semanticQueryPlanSchema.parse(input));
}

export function assertQueryPlanInvariants(plan: SemanticQueryPlan): SemanticQueryPlan {
  const stepIds = new Set<string>();
  for (const step of plan.steps) {
    if (stepIds.has(step.id)) throw new QueryIrValidationError("duplicate_step_id", `Duplicate step id ${step.id}`);
    stepIds.add(step.id);
    if (isInitialSliceOperator(step.operator) && step.support !== "initial-slice") {
      throw new QueryIrValidationError("support_mismatch", `Operator ${step.operator} is initial-slice but marked ${step.support}`);
    }
    if (isReservedOperator(step.operator) && step.support !== "reserved") {
      throw new QueryIrValidationError("support_mismatch", `Operator ${step.operator} is reserved and must not claim executable support`);
    }
  }
  for (const edge of plan.edges) {
    if (edge.kind === "data" || edge.kind === "result-use") {
      if (!stepIds.has(edge.fromStepId) || !stepIds.has(edge.toStepId)) {
        throw new QueryIrValidationError("invalid_edge_ref", "Edge references unknown step");
      }
    } else if (!stepIds.has(edge.stepId)) {
      throw new QueryIrValidationError("invalid_edge_ref", "Prerequisite references unknown step");
    }
  }
  return plan;
}

export function normalizePlanForIdentity(plan: SemanticQueryPlan): unknown {
  const steps = [...plan.steps]
    .map((step) => ({
      id: step.id,
      operator: step.operator,
      support: step.support,
      questionPackRef: step.questionPackRef ?? null,
      projectionRef: step.projectionRef ?? null,
      sourceScope: [...step.sourceScope].sort(),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
  const edges = [...plan.edges]
    .map((edge) => {
      if (edge.kind === "data") {
        return { kind: edge.kind, fromStepId: edge.fromStepId, toStepId: edge.toStepId, outputKey: edge.outputKey ?? null };
      }
      if (edge.kind === "result-use") {
        return { kind: edge.kind, fromStepId: edge.fromStepId, toStepId: edge.toStepId, predicate: edge.predicate };
      }
      return { kind: edge.kind, stepId: edge.stepId, requirement: edge.requirement };
    })
    .sort((a, b) => digestOf(a).localeCompare(digestOf(b)));
  const sourceRevisions = [...plan.sourceRevisions].sort((a, b) => a.sourceId.localeCompare(b.sourceId) || a.revision.localeCompare(b.revision));
  return {
    schemaVersion: plan.schemaVersion,
    canonicalizationVersion: plan.canonicalizationVersion,
    questionPackId: plan.questionPackId,
    questionPackVersion: plan.questionPackVersion,
    questionPackDigest: plan.questionPackDigest,
    projectionDigest: plan.projectionDigest,
    sourceRevisions,
    steps,
    edges,
  };
}

export function computePlanIdentity(plan: SemanticQueryPlan): string {
  return digestOf(normalizePlanForIdentity(parseSemanticQueryPlan(plan)));
}
