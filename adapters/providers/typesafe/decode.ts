/**
 * #515 SQ-04 TypeSafe decoder — entire native response → SQ-01 answers + sanitized observation.
 * Fail closed. Choice/Score confidence → observation (not answer). Never fabricate Noul confidence.
 * Never place API keys in observations/receipts.
 */
import {
  parseSemanticAnswer,
  type SemanticAnswer,
  type SemanticQuestionResult,
  type ChoiceAnswer,
  type ScoreAnswer,
  type NoulAnswer,
} from "../../../contracts/semantic/questions.js";
import type { QuestionDefinition, QuestionPack } from "../../../contracts/semantic/question-pack.js";
import type { UsageCost } from "../../../contracts/semantic/receipts.js";

export interface TypesafeNativeUsage {
  readonly input_tokens?: number;
  readonly output_tokens?: number;
}

export interface TypesafeNativeChoiceAnswer {
  readonly type: "choice";
  readonly choice: string;
  readonly probabilities: Readonly<Record<string, number>>;
  readonly confidence?: number;
}

export interface TypesafeNativeScoreAnswer {
  readonly type: "score";
  readonly score: number;
  readonly legend: Readonly<Record<string, string>>;
  readonly probabilities: Readonly<Record<string, number>>;
  readonly confidence?: number;
}

export interface TypesafeNativeNoulAnswer {
  readonly type: "noul";
  readonly noul: number;
}

export type TypesafeNativeAnswer = TypesafeNativeChoiceAnswer | TypesafeNativeScoreAnswer | TypesafeNativeNoulAnswer;

export interface TypesafeNativeResponse {
  readonly model?: string;
  readonly answers?: Readonly<Record<string, unknown>>;
  readonly usage?: TypesafeNativeUsage;
  readonly version?: string | number;
}

export interface TypesafeAnswerObservation {
  readonly questionId: string;
  /** Native Choice/Score confidence — not an SQ-01 answer field. */
  readonly confidence?: number;
}

export interface TypesafeDecodeSuccess {
  readonly ok: true;
  readonly results: readonly SemanticQuestionResult[];
  readonly answers: readonly SemanticAnswer[];
  readonly observations: readonly TypesafeAnswerObservation[];
  readonly requestedModel: string;
  readonly returnedModel: string | undefined;
  readonly usageCost: UsageCost;
}

export interface TypesafeDecodeFailure {
  readonly ok: false;
  readonly status: "invalid-response" | "unsupported";
  readonly detail: string;
  readonly code: string;
}

export type TypesafeDecodeResult = TypesafeDecodeSuccess | TypesafeDecodeFailure;

const SUPPORTED_RESPONSE_VERSIONS = new Set<string | number>(["1", "1.0", 1]);

function fail(code: string, detail: string, status: TypesafeDecodeFailure["status"] = "invalid-response"): TypesafeDecodeFailure {
  return { ok: false, status, detail, code };
}

function isUnitInterval(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && !Number.isNaN(value) && value >= 0 && value <= 1;
}

function decodeChoice(
  questionId: string,
  native: TypesafeNativeChoiceAnswer,
  definition: QuestionDefinition,
): { answer: ChoiceAnswer; observation: TypesafeAnswerObservation } | TypesafeDecodeFailure {
  if (definition.vocabulary.kind !== "choice") {
    return fail("kind_mismatch", `Expected choice vocabulary for ${questionId}`);
  }
  const optionIds = definition.vocabulary.options.map((option) => option.id);
  const labelById = new Map(definition.vocabulary.options.map((option) => [option.id, option.label] as const));
  const probabilityKeys = Object.keys(native.probabilities ?? {});
  if (probabilityKeys.length === 0) return fail("choice_empty_distribution", `Empty probabilities for ${questionId}`);

  for (const key of probabilityKeys) {
    if (!optionIds.includes(key)) return fail("choice_extra_option", `Unknown option ${key} on ${questionId}`);
    const probability = native.probabilities[key];
    if (!isUnitInterval(probability)) return fail("choice_nan_or_oob", `Invalid probability for ${questionId}/${key}`);
  }
  for (const id of optionIds) {
    if (!(id in native.probabilities)) return fail("choice_missing_option", `Missing option ${id} on ${questionId}`);
  }
  if (typeof native.choice !== "string" || !optionIds.includes(native.choice)) {
    return fail("choice_invalid_label", `Selected choice not in vocabulary for ${questionId}`);
  }

  const answer: ChoiceAnswer = {
    kind: "choice",
    questionId,
    options: optionIds.map((id) => ({
      id,
      label: labelById.get(id)!,
      probability: native.probabilities[id]!,
    })),
    selectedOptionId: native.choice,
  };
  try {
    parseSemanticAnswer(answer);
  } catch (error) {
    return fail("choice_consistency", error instanceof Error ? error.message : "choice consistency failed");
  }
  return {
    answer,
    observation: {
      questionId,
      ...(isUnitInterval(native.confidence) ? { confidence: native.confidence } : {}),
    },
  };
}

function decodeScore(
  questionId: string,
  native: TypesafeNativeScoreAnswer,
  definition: QuestionDefinition,
): { answer: ScoreAnswer; observation: TypesafeAnswerObservation } | TypesafeDecodeFailure {
  if (definition.vocabulary.kind !== "score") {
    return fail("kind_mismatch", `Expected score vocabulary for ${questionId}`);
  }
  if (typeof native.score !== "number" || !Number.isFinite(native.score) || Number.isNaN(native.score)) {
    return fail("score_nan", `Non-finite score for ${questionId}`);
  }
  const vocabLevels = [...definition.vocabulary.levels].sort((a, b) => a.level - b.level);
  const legend = native.legend ?? {};
  const probabilities = native.probabilities ?? {};
  const legendKeys = Object.keys(legend);
  const probabilityKeys = Object.keys(probabilities);
  if (legendKeys.length < 2) return fail("score_malformed_legend", `Legend too small for ${questionId}`);
  if (probabilityKeys.length < 2) return fail("score_malformed_distribution", `Distribution too small for ${questionId}`);
  if (legendKeys.length !== vocabLevels.length) {
    return fail("score_legend_mismatch", `Legend size != vocabulary levels for ${questionId}`);
  }

  const levels: ScoreAnswer["levels"] = [];
  for (let index = 0; index < vocabLevels.length; index += 1) {
    const indexKey = String(index);
    const levelKey = String(vocabLevels[index]!.level);
    const probKey = indexKey in probabilities ? indexKey : levelKey in probabilities ? levelKey : undefined;
    if (probKey === undefined) {
      return fail("score_missing_level", `Missing probability for level index ${index} on ${questionId}`);
    }
    const probability = probabilities[probKey];
    if (!isUnitInterval(probability)) return fail("score_nan_or_oob", `Invalid probability for ${questionId}/${probKey}`);
    const labelFromLegend = legend[probKey] ?? legend[indexKey] ?? legend[levelKey];
    const label = vocabLevels[index]!.label ?? labelFromLegend;
    levels.push({
      level: vocabLevels[index]!.level,
      ...(label ? { label } : {}),
      probability,
    });
  }

  for (const key of probabilityKeys) {
    const asIndex = Number(key);
    const matchesIndex = Number.isInteger(asIndex) && asIndex >= 0 && asIndex < vocabLevels.length;
    const matchesLevel = vocabLevels.some((level) => String(level.level) === key);
    if (!matchesIndex && !matchesLevel) {
      return fail("score_extra_level", `Extra probability key ${key} on ${questionId}`);
    }
  }

  const answer: ScoreAnswer = {
    kind: "score",
    questionId,
    levels,
    expectation: native.score,
  };
  try {
    parseSemanticAnswer(answer);
  } catch (error) {
    return fail("score_consistency", error instanceof Error ? error.message : "score consistency failed");
  }
  return {
    answer,
    observation: {
      questionId,
      ...(isUnitInterval(native.confidence) ? { confidence: native.confidence } : {}),
    },
  };
}

function decodeNoul(
  questionId: string,
  native: TypesafeNativeNoulAnswer,
  definition: QuestionDefinition,
): { answer: NoulAnswer; observation: TypesafeAnswerObservation } | TypesafeDecodeFailure {
  if (definition.vocabulary.kind !== "noul") {
    return fail("kind_mismatch", `Expected noul vocabulary for ${questionId}`);
  }
  if (!isUnitInterval(native.noul)) {
    return fail("noul_nan_or_oob", `Invalid noul for ${questionId}`);
  }
  // Never fabricate confidence — native Noul has none (M3).
  const answer: NoulAnswer = {
    kind: "noul",
    questionId,
    probability: native.noul,
  };
  try {
    parseSemanticAnswer(answer);
  } catch (error) {
    return fail("noul_consistency", error instanceof Error ? error.message : "noul consistency failed");
  }
  return { answer, observation: { questionId } };
}

function sanitizeUsage(usage: TypesafeNativeUsage | undefined): UsageCost {
  if (!usage) return { status: "unknown", reason: "usage-absent" };
  const measured: { status: "measured"; inputTokens?: number; outputTokens?: number } = { status: "measured" };
  if (typeof usage.input_tokens === "number" && Number.isFinite(usage.input_tokens) && usage.input_tokens >= 0 && Number.isInteger(usage.input_tokens)) {
    measured.inputTokens = usage.input_tokens;
  }
  if (typeof usage.output_tokens === "number" && Number.isFinite(usage.output_tokens) && usage.output_tokens >= 0 && Number.isInteger(usage.output_tokens)) {
    measured.outputTokens = usage.output_tokens;
  }
  if (measured.inputTokens === undefined && measured.outputTokens === undefined) {
    return { status: "unknown", reason: "usage-unparseable" };
  }
  return measured;
}

export function decodeTypesafeResponse(input: {
  readonly pack: QuestionPack;
  readonly response: unknown;
  readonly requestedModel: string;
  readonly maxResponseBytes?: number;
}): TypesafeDecodeResult {
  if (input.maxResponseBytes !== undefined) {
    const serialized = typeof input.response === "string" ? input.response : JSON.stringify(input.response);
    if (serialized.length > input.maxResponseBytes) {
      return fail("oversized_response", `Response exceeds maxResponseBytes ${input.maxResponseBytes}`);
    }
  }

  if (input.response === null || typeof input.response !== "object" || Array.isArray(input.response)) {
    return fail("malformed_envelope", "Response is not an object");
  }

  const response = input.response as TypesafeNativeResponse;

  if (response.version !== undefined && !SUPPORTED_RESPONSE_VERSIONS.has(response.version)) {
    return fail("unsupported_version", `Unsupported response version ${String(response.version)}`, "unsupported");
  }

  if (!response.answers || typeof response.answers !== "object" || Array.isArray(response.answers)) {
    return fail("missing_answers", "Response missing answers object");
  }

  const expectedIds = input.pack.questions.map((question) => question.id);
  const observedIds = Object.keys(response.answers);
  if (observedIds.length !== new Set(observedIds).size) {
    return fail("duplicate_answers", "Duplicate answer keys in response");
  }

  const expectedSet = new Set(expectedIds);
  const observedSet = new Set(observedIds);
  for (const id of expectedIds) {
    if (!observedSet.has(id)) return fail("missing_answer", `Missing answer for ${id}`);
  }
  for (const id of observedIds) {
    if (!expectedSet.has(id)) return fail("extra_answer", `Unexpected answer for ${id}`);
  }

  const byId = new Map(input.pack.questions.map((question) => [question.id, question] as const));
  const answers: SemanticAnswer[] = [];
  const observations: TypesafeAnswerObservation[] = [];
  const results: SemanticQuestionResult[] = [];

  for (const id of expectedIds) {
    const definition = byId.get(id)!;
    const raw = response.answers[id];
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
      return fail("malformed_answer", `Answer for ${id} is not an object`);
    }
    const native = raw as TypesafeNativeAnswer;
    if (!("type" in native) || typeof native.type !== "string") {
      return fail("missing_type", `Answer for ${id} missing type`);
    }
    if (native.type !== definition.kind) {
      return fail("type_mismatch", `Answer type ${native.type} != question kind ${definition.kind} for ${id}`);
    }

    let decoded: { answer: SemanticAnswer; observation: TypesafeAnswerObservation } | TypesafeDecodeFailure;
    if (native.type === "choice") decoded = decodeChoice(id, native, definition);
    else if (native.type === "score") decoded = decodeScore(id, native, definition);
    else if (native.type === "noul") decoded = decodeNoul(id, native, definition);
    else return fail("unsupported_type", `Unsupported answer type on ${id}`, "unsupported");

    if ("ok" in decoded && decoded.ok === false) return decoded;

    const success = decoded as { answer: SemanticAnswer; observation: TypesafeAnswerObservation };
    answers.push(success.answer);
    observations.push(success.observation);
    results.push({ status: "answered", answer: success.answer });
  }

  const returnedModel = typeof response.model === "string" && response.model.trim().length > 0 ? response.model.trim() : undefined;

  return {
    ok: true,
    results,
    answers,
    observations,
    requestedModel: input.requestedModel,
    returnedModel,
    usageCost: sanitizeUsage(response.usage),
  };
}

/** Map HTTP status → SQ-01 failure status (M5). Host owns retry. */
export function mapTypesafeHttpStatus(status: number): {
  readonly failureStatus: "invalid-response" | "unsupported" | "unknown" | "timeout";
  readonly code: string;
  readonly retryable: boolean;
} {
  if (status === 401 || status === 403) return { failureStatus: "unsupported", code: "auth_rejected", retryable: false };
  if (status === 422) return { failureStatus: "invalid-response", code: "validation_rejected", retryable: false };
  if (status === 429) return { failureStatus: "unknown", code: "rate_limited", retryable: true };
  if (status === 408) return { failureStatus: "timeout", code: "http_timeout", retryable: true };
  if (status === 529 || status === 503 || status === 502) {
    return { failureStatus: "unknown", code: "upstream_unavailable", retryable: true };
  }
  if (status >= 500) return { failureStatus: "unknown", code: `upstream_5xx`, retryable: true };
  return { failureStatus: "invalid-response", code: `http_${status}`, retryable: false };
}
