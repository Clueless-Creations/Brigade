/**
 * #515 SQ-04 TypeSafe encoder — SQ-01 canonical → native System One request fields only.
 * No SDK types in policy; map only fields the canonical operation needs (M1–M4).
 */
import type { QuestionDefinition, QuestionPack } from "../../../contracts/semantic/question-pack.js";
import { TYPESAFE_MODEL_DEFAULT } from "../../../catalog/providers/typesafe-qualify-map.js";

export interface TypesafeNativeChoiceQuestion {
  readonly type: "choice";
  readonly instructions: string;
  readonly criteria: Readonly<Record<string, string>>;
}

export interface TypesafeNativeScoreQuestion {
  readonly type: "score";
  readonly instructions: string;
  /** Legend labels in ascending vocabulary level order (0-based indices on decode). */
  readonly criteria: readonly string[];
}

export interface TypesafeNativeNoulQuestion {
  readonly type: "noul";
  readonly instructions: string;
  readonly criteria: { readonly true: string; readonly false: string };
}

export type TypesafeNativeQuestion = TypesafeNativeChoiceQuestion | TypesafeNativeScoreQuestion | TypesafeNativeNoulQuestion;

export interface TypesafeNativeRequest {
  readonly state: string;
  readonly model: string;
  readonly questions: Readonly<Record<string, TypesafeNativeQuestion>>;
}

export class TypesafeEncodeError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "TypesafeEncodeError";
    this.code = code;
  }
}

function encodeOne(question: QuestionDefinition): TypesafeNativeQuestion {
  if (question.kind !== question.vocabulary.kind) {
    throw new TypesafeEncodeError("vocabulary_kind_mismatch", `Question ${question.id} kind ${question.kind} != vocabulary ${question.vocabulary.kind}`);
  }
  if (question.kind === "choice" && question.vocabulary.kind === "choice") {
    const criteria: Record<string, string> = {};
    for (const option of question.vocabulary.options) {
      criteria[option.id] = option.label;
    }
    return { type: "choice", instructions: question.instruction, criteria };
  }
  if (question.kind === "score" && question.vocabulary.kind === "score") {
    const ordered = [...question.vocabulary.levels].sort((a, b) => a.level - b.level);
    const criteria = ordered.map((level) => level.label ?? `level_${level.level}`);
    return { type: "score", instructions: question.instruction, criteria };
  }
  if (question.kind === "noul" && question.vocabulary.kind === "noul") {
    return {
      type: "noul",
      instructions: question.instruction,
      criteria: {
        true: question.vocabulary.proposition,
        false: `Not the case that: ${question.vocabulary.proposition}`,
      },
    };
  }
  throw new TypesafeEncodeError("unsupported_kind", `Cannot encode question kind for ${question.id}`);
}

/** Encode a question pack + state into a native System One request (needed fields only). */
export function encodeTypesafeRequest(input: { readonly pack: QuestionPack; readonly state: string; readonly model?: string }): TypesafeNativeRequest {
  if (typeof input.state !== "string" || input.state.trim().length === 0) {
    throw new TypesafeEncodeError("empty_state", "Assessment state must be non-empty text");
  }
  if (input.pack.questions.length === 0) {
    throw new TypesafeEncodeError("empty_pack", "Question pack has no questions");
  }
  const questions: Record<string, TypesafeNativeQuestion> = {};
  for (const question of input.pack.questions) {
    if (questions[question.id]) {
      throw new TypesafeEncodeError("duplicate_question", `Duplicate question id ${question.id}`);
    }
    questions[question.id] = encodeOne(question);
  }
  return {
    state: input.state,
    model: input.model?.trim() || TYPESAFE_MODEL_DEFAULT,
    questions,
  };
}

export function encodedQuestionIds(request: TypesafeNativeRequest): readonly string[] {
  return Object.keys(request.questions).sort();
}
