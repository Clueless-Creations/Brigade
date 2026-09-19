/**
 * #515 TypeSafe connection resolution — env *names* only; never invent/print secrets.
 * Credentials resolve through the selected connection at execution time.
 */
import {
  TYPESAFE_ENV_REQUIRED,
  TYPESAFE_ENV_OPTIONAL,
  TYPESAFE_API_BASE_DEFAULT,
  TYPESAFE_MODEL_DEFAULT,
  TYPESAFE_CONFIRM_WITHOUT_PRINT,
} from "../../../catalog/providers/typesafe-qualify-map.js";
import { resolveTypesafeAvailability, type TypesafeAvailability } from "./support.js";

export interface TypesafeConnectionEnv {
  readonly get: (name: string) => string | undefined;
}

export interface TypesafeResolvedConnection {
  readonly availability: TypesafeAvailability;
  /** Present only when configured — callers must not log this value. */
  readonly apiKeyPresent: boolean;
  readonly baseUrl: string;
  readonly defaultModel: string;
  readonly logLevel: string | undefined;
  readonly confirmWithoutPrint: typeof TYPESAFE_CONFIRM_WITHOUT_PRINT;
  readonly requiredEnvNames: readonly string[];
  readonly optionalEnvNames: readonly string[];
}

function readNonEmpty(env: TypesafeConnectionEnv, name: string): string | undefined {
  const value = env.get(name);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Resolve connection configuration from host env. Never returns secret values to
 * callers except via {@link readTypesafeApiKey} which is transport-only.
 */
export function resolveTypesafeConnection(input: {
  readonly selected: boolean;
  readonly available?: boolean;
  readonly env?: TypesafeConnectionEnv;
  readonly baseUrlOverride?: string;
  readonly modelOverride?: string;
}): TypesafeResolvedConnection {
  const env = input.env ?? { get: (name) => process.env[name] };
  const apiKey = readNonEmpty(env, TYPESAFE_ENV_REQUIRED[0]!) ?? readNonEmpty(env, TYPESAFE_ENV_OPTIONAL[0]!);
  const configured = apiKey !== undefined;
  const availability = resolveTypesafeAvailability({
    selected: input.selected,
    configured,
    available: input.available !== false,
  });
  const baseUrl = input.baseUrlOverride?.trim() || readNonEmpty(env, "TYPESAFE_BASE_URL") || TYPESAFE_API_BASE_DEFAULT;
  const defaultModel = input.modelOverride?.trim() || readNonEmpty(env, "TYPESAFE_DEFAULT_MODEL") || TYPESAFE_MODEL_DEFAULT;
  const logLevel = readNonEmpty(env, "TYPESAFE_LOG_LEVEL");
  return {
    availability,
    apiKeyPresent: configured,
    baseUrl: baseUrl.replace(/\/+$/u, ""),
    defaultModel,
    logLevel,
    confirmWithoutPrint: TYPESAFE_CONFIRM_WITHOUT_PRINT,
    requiredEnvNames: TYPESAFE_ENV_REQUIRED,
    optionalEnvNames: TYPESAFE_ENV_OPTIONAL,
  };
}

/**
 * Transport-only credential read. Returns undefined when unset.
 * Callers must never log, persist, or place the return value in receipts.
 */
export function readTypesafeApiKey(env: TypesafeConnectionEnv = { get: (name) => process.env[name] }): string | undefined {
  return readNonEmpty(env, TYPESAFE_ENV_REQUIRED[0]!) ?? readNonEmpty(env, TYPESAFE_ENV_OPTIONAL[0]!);
}

/** Redact anything that looks like a bearer secret from error/detail strings. */
export function redactSecrets(text: string, apiKey?: string): string {
  let out = text;
  if (apiKey && apiKey.length > 0) {
    out = out.split(apiKey).join("[REDACTED]");
  }
  out = out.replace(/Bearer\s+[A-Za-z0-9._\-]+/giu, "Bearer [REDACTED]");
  out = out.replace(/TYPESAFE_API_KEY\s*=\s*\S+/giu, "TYPESAFE_API_KEY=[REDACTED]");
  out = out.replace(/JEV_API_KEY\s*=\s*\S+/giu, "JEV_API_KEY=[REDACTED]");
  return out;
}
