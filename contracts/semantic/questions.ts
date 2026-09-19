import { z } from "zod";

/**
 * Provider-independent semantic question results (SQ-01 / #512).
 *
 * Choice / Score / Noul are assessment answers. Failure outcomes are first-class and distinct
 * from valid negative answers (Choice "no", low Score, Noul near 0). Absent Noul confidence is
 * never fabricated. Polarized Score distributions stay distinguishable from a concentrated
 * midpoint even when expectation coincides.
 */

const id = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-z][a-z0-9._:-]*$/u);
const probability = z.number().finite().min(0).max(1);
const nonEmptyText = z.string().trim().min(1).max(2000);

export const SEMANTIC_QUESTION_KINDS = ["choice", "score", "noul"] as const;
export type SemanticQuestionKind = (typeof SEMANTIC_QUESTION_KINDS)[number];

export const SEMANTIC_FAILURE_STATUSES = ["unknown", "insufficient-context", "unsupported", "cancelled", "timeout", "invalid-response"] as const;
export type SemanticFailureStatus = (typeof SEMANTIC_FAILURE_STATUSES)[number];

export const choiceOptionSchema = z.strictObject({
  id,
  label: nonEmptyText.max(400),
  probability,
});
export type ChoiceOption = z.infer<typeof choiceOptionSchema>;

export const choiceAnswerSchema = z.strictObject({
  kind: z.literal("choice"),
  questionId: id,
  options: z.array(choiceOptionSchema).min(2).max(64),
  selectedOptionId: id.optional(),
});
export type ChoiceAnswer = z.infer<typeof choiceAnswerSchema>;

export const scoreLevelSchema = z.strictObject({
  level: z.number().int(),
  label: nonEmptyText.max(400).optional(),
  probability,
});
export type ScoreLevel = z.infer<typeof scoreLevelSchema>;

export const scoreAnswerSchema = z.strictObject({
  kind: z.literal("score"),
  questionId: id,
  levels: z.array(scoreLevelSchema).min(2).max(64),
  expectation: z.number().finite().optional(),
});
export type ScoreAnswer = z.infer<typeof scoreAnswerSchema>;

export const noulAnswerSchema = z.strictObject({
  kind: z.literal("noul"),
  questionId: id,
  probability,
  confidence: probability.optional(),
});
export type NoulAnswer = z.infer<typeof noulAnswerSchema>;

export const semanticAnswerSchema = z.discriminatedUnion("kind", [choiceAnswerSchema, scoreAnswerSchema, noulAnswerSchema]);
export type SemanticAnswer = z.infer<typeof semanticAnswerSchema>;

export const semanticFailureSchema = z.strictObject({
  status: z.enum(SEMANTIC_FAILURE_STATUSES),
  questionId: id,
  detail: nonEmptyText.max(1000).optional(),
});
export type SemanticFailure = z.infer<typeof semanticFailureSchema>;

export const semanticQuestionResultSchema = z.discriminatedUnion("status", [
  z.strictObject({
    status: z.literal("answered"),
    answer: semanticAnswerSchema,
  }),
  z.strictObject({
    status: z.enum(SEMANTIC_FAILURE_STATUSES),
    questionId: id,
    detail: nonEmptyText.max(1000).optional(),
  }),
]);
export type SemanticQuestionResult = z.infer<typeof semanticQuestionResultSchema>;

const DISTRIBUTION_TOLERANCE = 1e-6;

export function parseSemanticAnswer(input: unknown): SemanticAnswer {
  const answer = semanticAnswerSchema.parse(input);
  assertAnswerConsistency(answer);
  return answer;
}

export function parseSemanticQuestionResult(input: unknown): SemanticQuestionResult {
  const result = semanticQuestionResultSchema.parse(input);
  if (result.status === "answered") assertAnswerConsistency(result.answer);
  return result;
}

export function assertAnswerConsistency(answer: SemanticAnswer): void {
  if (answer.kind === "choice") {
    const sum = answer.options.reduce((total, option) => total + option.probability, 0);
    if (Math.abs(sum - 1) > DISTRIBUTION_TOLERANCE) {
      throw new Error(`choice_distribution_unnormalized:${answer.questionId}:${sum}`);
    }
    const ids = answer.options.map((option) => option.id);
    if (new Set(ids).size !== ids.length) throw new Error(`choice_duplicate_option:${answer.questionId}`);
    if (answer.selectedOptionId !== undefined && !ids.includes(answer.selectedOptionId)) {
      throw new Error(`choice_selected_missing:${answer.questionId}`);
    }
    return;
  }
  if (answer.kind === "score") {
    const sum = answer.levels.reduce((total, level) => total + level.probability, 0);
    if (Math.abs(sum - 1) > DISTRIBUTION_TOLERANCE) {
      throw new Error(`score_distribution_unnormalized:${answer.questionId}:${sum}`);
    }
    const levels = answer.levels.map((level) => level.level);
    if (new Set(levels).size !== levels.length) throw new Error(`score_duplicate_level:${answer.questionId}`);
    const ordered = [...levels].sort((a, b) => a - b);
    if (ordered.some((level, index) => level !== levels[index])) {
      throw new Error(`score_levels_unordered:${answer.questionId}`);
    }
    if (answer.expectation !== undefined) {
      const computed = scoreExpectation(answer);
      if (Math.abs(computed - answer.expectation) > 1e-9) {
        throw new Error(`score_expectation_mismatch:${answer.questionId}`);
      }
    }
  }
}

export function scoreExpectation(answer: ScoreAnswer): number {
  return answer.levels.reduce((total, level) => total + level.level * level.probability, 0);
}

/** True when mass sits at opposite poles rather than concentrating near the midpoint. */
export function isPolarizedScore(answer: ScoreAnswer, poleMass = 0.4): boolean {
  if (answer.levels.length < 2) return false;
  const min = answer.levels[0]!;
  const max = answer.levels[answer.levels.length - 1]!;
  return min.probability >= poleMass && max.probability >= poleMass;
}

export function noulConfidencePresent(answer: NoulAnswer): boolean {
  return typeof answer.confidence === "number";
}
