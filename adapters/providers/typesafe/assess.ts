/**
 * #515 SQ-04 TypeSafe assess orchestration — support → encode → transport → decode.
 * Passive status/plan/knowledge paths make zero inference calls.
 * Default close path: fake transport; live HTTP held unless allowLiveHttp.
 */
import type { QuestionPack } from "../../../contracts/semantic/question-pack.js";
import type { SemanticQuestionResult } from "../../../contracts/semantic/questions.js";
import type { UsageCost } from "../../../contracts/semantic/receipts.js";
import { encodeTypesafeRequest, TypesafeEncodeError, type TypesafeNativeRequest } from "./encode.js";
import { decodeTypesafeResponse, mapTypesafeHttpStatus } from "./decode.js";
import type { TypesafeDecodeFailure, TypesafeAnswerObservation } from "./decode.js";
import { resolveTypesafeConnection, readTypesafeApiKey, redactSecrets, type TypesafeConnectionEnv, type TypesafeResolvedConnection } from "./connection.js";
import { TYPESAFE_DEFAULT_EFFECTS, type TypesafeEffectsPolicy, type TypesafeEffectsViolation } from "./effects.js";
import { createFakeTypesafeTransport, type TypesafeTransport, type FakeTypesafeTransport } from "./transport.js";
import {
  typesafeSupportDeclaration,
  resolveTypesafeAvailability,
  TYPESAFE_ADAPTER_BINDING_ID,
  TYPESAFE_ADAPTER_PROVIDER_ID,
  TYPESAFE_ADAPTER_STAMP,
  type TypesafeAvailability,
} from "./support.js";

export const TYPESAFE_LIVE_NOT_PERFORMED = true as const;

export interface TypesafePassiveCall {
  readonly kind: "status" | "plan" | "knowledge";
}

export interface TypesafePassiveResult {
  readonly kind: TypesafePassiveCall["kind"];
  readonly inferenceRequests: 0;
  readonly support: ReturnType<typeof typesafeSupportDeclaration>;
  readonly availability: TypesafeAvailability;
  readonly liveNotPerformed: true;
}

export interface TypesafeAssessInput {
  readonly pack: QuestionPack;
  readonly state: string;
  readonly selected: boolean;
  readonly available?: boolean;
  readonly model?: string;
  readonly env?: TypesafeConnectionEnv;
  readonly transport?: TypesafeTransport;
  readonly effects?: TypesafeEffectsPolicy;
  readonly signal?: AbortSignal;
  /** Live HTTP requires explicit allow; default close path is fake-only. */
  readonly allowLiveHttp?: boolean;
}

export interface TypesafeAssessObservation {
  readonly providerId: typeof TYPESAFE_ADAPTER_PROVIDER_ID;
  readonly bindingId: typeof TYPESAFE_ADAPTER_BINDING_ID;
  readonly adapterStamp: typeof TYPESAFE_ADAPTER_STAMP;
  readonly requestedModel: string;
  readonly returnedModel: string | undefined;
  readonly answerObservations: readonly TypesafeAnswerObservation[];
  readonly usageCost: UsageCost;
  readonly liveNotPerformed: true;
  readonly transportKind: "fake" | "live-http";
}

export type TypesafeAssessResult =
  | {
      readonly ok: true;
      readonly availability: "ready";
      readonly results: readonly SemanticQuestionResult[];
      readonly observation: TypesafeAssessObservation;
      readonly nativeRequest: TypesafeNativeRequest;
    }
  | {
      readonly ok: false;
      readonly availability: TypesafeAvailability;
      readonly reason: "unselected" | "unconfigured" | "unavailable" | "encode-failed" | "transport-failed" | "decode-failed" | "live-http-held";
      readonly detail: string;
      readonly code?: string;
      readonly failureStatus?: string;
      readonly violation?: TypesafeEffectsViolation;
      readonly decodeFailure?: TypesafeDecodeFailure;
      readonly liveNotPerformed: true;
      readonly exactlyOnceBillingClaimed: false;
    };

function held(result: Omit<Extract<TypesafeAssessResult, { ok: false }>, "ok" | "liveNotPerformed" | "exactlyOnceBillingClaimed">): TypesafeAssessResult {
  return { ok: false, liveNotPerformed: true, exactlyOnceBillingClaimed: false, ...result };
}

/** Passive status/plan/knowledge — zero inference requests. */
export function typesafePassiveCall(
  call: TypesafePassiveCall,
  input: {
    readonly selected: boolean;
    readonly available?: boolean;
    readonly env?: TypesafeConnectionEnv;
  } = { selected: false },
): TypesafePassiveResult {
  const connection = resolveTypesafeConnection({
    selected: input.selected,
    available: input.available,
    env: input.env ?? { get: () => undefined },
  });
  return {
    kind: call.kind,
    inferenceRequests: 0,
    support: typesafeSupportDeclaration(),
    availability: connection.availability,
    liveNotPerformed: true,
  };
}

/**
 * Execute one System One assessment through the selected TypeSafe binding.
 * Default path uses fake transport (paper). Live HTTP requires allowLiveHttp + ready connection.
 */
export async function assessWithTypesafe(input: TypesafeAssessInput): Promise<TypesafeAssessResult> {
  const emptyEnv: TypesafeConnectionEnv = { get: () => undefined };
  const connection = resolveTypesafeConnection({
    selected: input.selected,
    available: input.available,
    env: input.env ?? emptyEnv,
    modelOverride: input.model,
  });

  if (connection.availability === "unselected") {
    return held({
      availability: "unselected",
      reason: "unselected",
      detail: "TypeSafe provider binding is not selected",
    });
  }
  if (connection.availability === "unconfigured") {
    return held({
      availability: "unconfigured",
      reason: "unconfigured",
      detail: "TypeSafe credentials are not configured (TYPESAFE_API_KEY / JEV_API_KEY unset)",
    });
  }
  if (connection.availability === "unavailable") {
    return held({
      availability: "unavailable",
      reason: "unavailable",
      detail: "TypeSafe provider marked unavailable by host",
    });
  }

  let nativeRequest: TypesafeNativeRequest;
  try {
    nativeRequest = encodeTypesafeRequest({
      pack: input.pack,
      state: input.state,
      model: input.model ?? connection.defaultModel,
    });
  } catch (error) {
    const detail = error instanceof TypesafeEncodeError ? error.message : error instanceof Error ? error.message : "encode failed";
    return held({
      availability: "ready",
      reason: "encode-failed",
      detail: redactSecrets(detail),
      code: error instanceof TypesafeEncodeError ? error.code : "encode_failed",
    });
  }

  const transport = input.transport ?? createFakeTypesafeTransport();
  if (transport.kind === "live-http" && input.allowLiveHttp !== true) {
    return held({
      availability: "ready",
      reason: "live-http-held",
      detail: "Live HTTP held for #515 default close path (live-not-performed); fixtures use fake transport",
      code: "live_http_held",
    });
  }

  const apiKey = readTypesafeApiKey(input.env ?? emptyEnv) ?? (transport.kind === "fake" ? "fake-test-key-not-a-secret" : undefined);
  if (!apiKey) {
    return held({
      availability: "unconfigured",
      reason: "unconfigured",
      detail: "TypeSafe credentials are not configured for transport",
    });
  }

  const effects =
    input.effects ??
    ({
      ...TYPESAFE_DEFAULT_EFFECTS,
      allowedBaseUrl: connection.baseUrl,
    } as TypesafeEffectsPolicy);

  const transportResult = await transport.execute({
    baseUrl: connection.baseUrl,
    apiKey,
    body: nativeRequest,
    signal: input.signal,
    effects,
  });

  if (!transportResult.ok) {
    return held({
      availability: "ready",
      reason: "transport-failed",
      detail: redactSecrets(transportResult.detail, apiKey),
      code: transportResult.code,
      failureStatus: transportResult.failureStatus,
      violation: transportResult.violation,
    });
  }

  const decoded = decodeTypesafeResponse({
    pack: input.pack,
    response: transportResult.body,
    requestedModel: nativeRequest.model,
    maxResponseBytes: effects.maxResponseBytes,
  });

  if (!decoded.ok) {
    return held({
      availability: "ready",
      reason: "decode-failed",
      detail: redactSecrets(decoded.detail, apiKey),
      code: decoded.code,
      failureStatus: decoded.status,
      decodeFailure: decoded,
    });
  }

  return {
    ok: true,
    availability: "ready",
    results: decoded.results,
    nativeRequest,
    observation: {
      providerId: TYPESAFE_ADAPTER_PROVIDER_ID,
      bindingId: TYPESAFE_ADAPTER_BINDING_ID,
      adapterStamp: TYPESAFE_ADAPTER_STAMP,
      requestedModel: decoded.requestedModel,
      returnedModel: decoded.returnedModel,
      answerObservations: decoded.observations,
      usageCost: decoded.usageCost,
      liveNotPerformed: true,
      transportKind: transport.kind,
    },
  };
}

export function isFakeTypesafeTransport(transport: TypesafeTransport): transport is FakeTypesafeTransport {
  return transport.kind === "fake";
}

export function typesafeConnectionSnapshot(connection: TypesafeResolvedConnection): {
  readonly availability: TypesafeAvailability;
  readonly apiKeyPresent: boolean;
  readonly baseUrl: string;
  readonly defaultModel: string;
} {
  return {
    availability: connection.availability,
    apiKeyPresent: connection.apiKeyPresent,
    baseUrl: connection.baseUrl,
    defaultModel: connection.defaultModel,
  };
}

export { mapTypesafeHttpStatus, resolveTypesafeAvailability };
