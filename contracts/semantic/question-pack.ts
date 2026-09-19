import { z } from "zod";
import { digestOf } from "./canonicalize.js";
import { SEMANTIC_QUESTION_KINDS } from "./questions.js";

/**
 * Versioned question-pack resource: instructions, answer vocabulary, state-path refs,
 * projection requirements, content digest. Rejects unknown fields, duplicate IDs,
 * invalid field refs, and unsupported versions.
 */

export const QUESTION_PACK_SCHEMA_VERSION = 1 as const;
export const SUPPORTED_QUESTION_PACK_SCHEMA_VERSIONS = [QUESTION_PACK_SCHEMA_VERSION] as const;

const id = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-z][a-z0-9._:-]*$/u);
const statePath = z
  .string()
  .trim()
  .min(1)
  .max(320)
  .regex(/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)*$/u);
const nonEmptyText = z.string().trim().min(1).max(4000);
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u);

export const choiceVocabularySchema = z.strictObject({
  kind: z.literal("choice"),
  options: z
    .array(
      z.strictObject({
        id,
        label: nonEmptyText.max(400),
      }),
    )
    .min(2)
    .max(64),
});

export const scoreVocabularySchema = z.strictObject({
  kind: z.literal("score"),
  levels: z
    .array(
      z.strictObject({
        level: z.number().int(),
        label: nonEmptyText.max(400).optional(),
      }),
    )
    .min(2)
    .max(64),
});

export const noulVocabularySchema = z.strictObject({
  kind: z.literal("noul"),
  proposition: nonEmptyText.max(1000),
});

export const answerVocabularySchema = z.discriminatedUnion("kind", [choiceVocabularySchema, scoreVocabularySchema, noulVocabularySchema]);

export const questionDefinitionSchema = z.strictObject({
  id,
  kind: z.enum(SEMANTIC_QUESTION_KINDS),
  instruction: nonEmptyText,
  statePaths: z.array(statePath).min(1).max(64),
  vocabulary: answerVocabularySchema,
});
export type QuestionDefinition = z.infer<typeof questionDefinitionSchema>;

export const projectionRequirementSchema = z.strictObject({
  id,
  statePaths: z.array(statePath).min(1).max(128),
  required: z.boolean().default(true),
});

export const questionPackSchema = z.strictObject({
  schemaVersion: z.literal(QUESTION_PACK_SCHEMA_VERSION),
  id,
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/u)
    .max(32),
  title: nonEmptyText.max(200),
  instructions: nonEmptyText,
  questions: z.array(questionDefinitionSchema).min(1).max(128),
  projections: z.array(projectionRequirementSchema).min(1).max(64),
  contentDigest: sha256.optional(),
});
export type QuestionPack = z.infer<typeof questionPackSchema>;

export class QuestionPackValidationError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "QuestionPackValidationError";
    this.code = code;
  }
}

export function parseQuestionPack(input: unknown): QuestionPack {
  return assertQuestionPackInvariants(questionPackSchema.parse(input));
}

export function tryParseQuestionPack(input: unknown): { ok: true; pack: QuestionPack } | { ok: false; error: unknown } {
  try {
    return { ok: true, pack: parseQuestionPack(input) };
  } catch (error) {
    return { ok: false, error };
  }
}

export function assertQuestionPackInvariants(pack: QuestionPack): QuestionPack {
  if (!(SUPPORTED_QUESTION_PACK_SCHEMA_VERSIONS as readonly number[]).includes(pack.schemaVersion)) {
    throw new QuestionPackValidationError("unsupported_version", `Unsupported question-pack schemaVersion ${pack.schemaVersion}`);
  }
  const questionIds = new Set<string>();
  for (const question of pack.questions) {
    if (questionIds.has(question.id)) {
      throw new QuestionPackValidationError("duplicate_question_id", `Duplicate question id ${question.id}`);
    }
    questionIds.add(question.id);
    if (question.vocabulary.kind !== question.kind) {
      throw new QuestionPackValidationError("vocabulary_kind_mismatch", `Question ${question.id} vocabulary kind must match question kind`);
    }
    if (question.kind === "choice" && question.vocabulary.kind === "choice") {
      const optionIds = question.vocabulary.options.map((option) => option.id);
      if (new Set(optionIds).size !== optionIds.length) {
        throw new QuestionPackValidationError("duplicate_option_id", `Duplicate option id in ${question.id}`);
      }
    }
    if (question.kind === "score" && question.vocabulary.kind === "score") {
      const levels = question.vocabulary.levels.map((level) => level.level);
      if (new Set(levels).size !== levels.length) {
        throw new QuestionPackValidationError("duplicate_score_level", `Duplicate score level in ${question.id}`);
      }
      const ordered = [...levels].sort((a, b) => a - b);
      if (ordered.some((level, index) => level !== levels[index])) {
        throw new QuestionPackValidationError("score_levels_unordered", `Score levels must be ascending in ${question.id}`);
      }
    }
  }
  const projectionIds = new Set<string>();
  const declaredPaths = new Set(pack.projections.flatMap((projection) => projection.statePaths));
  for (const projection of pack.projections) {
    if (projectionIds.has(projection.id)) {
      throw new QuestionPackValidationError("duplicate_projection_id", `Duplicate projection id ${projection.id}`);
    }
    projectionIds.add(projection.id);
  }
  for (const question of pack.questions) {
    for (const path of question.statePaths) {
      if (!declaredPaths.has(path)) {
        throw new QuestionPackValidationError("invalid_field_ref", `Question ${question.id} references undeclared state path ${path}`);
      }
    }
  }
  if (pack.contentDigest !== undefined) {
    const expected = computeQuestionPackContentDigest(pack);
    if (pack.contentDigest !== expected) {
      throw new QuestionPackValidationError("content_digest_mismatch", "Question-pack contentDigest does not match canonical content");
    }
  }
  return pack;
}

export function computeQuestionPackContentDigest(pack: QuestionPack): string {
  const { contentDigest: _ignored, ...rest } = pack;
  return digestOf(rest);
}

export function withQuestionPackContentDigest(pack: QuestionPack): QuestionPack {
  const without = { ...pack };
  delete (without as { contentDigest?: string }).contentDigest;
  return parseQuestionPack({ ...without, contentDigest: computeQuestionPackContentDigest(without as QuestionPack) });
}
