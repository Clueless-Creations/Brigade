/**
 * #515 SQ-04 TypeSafe adapter — support declaration (paper; no live).
 *
 * Honors #513 implement/defer/reject dispositions. Declares unavailable
 * capabilities rather than silently emulating them. Unselected / unconfigured /
 * unavailable remain distinct.
 */
import {
  TYPESAFE_MAPPINGS,
  TYPESAFE_TRANSPORT_RECOMMENDATION,
  TYPESAFE_LIVE_NOT_PERFORMED,
  TYPESAFE_HOSTED_KEY_OWNER,
  TYPESAFE_ENV_REQUIRED,
  TYPESAFE_ENV_OPTIONAL,
  TYPESAFE_API_BASE_DEFAULT,
  TYPESAFE_MODEL_DEFAULT,
  type TypesafeDisposition,
} from "../../../catalog/providers/typesafe-qualify-map.js";

export const TYPESAFE_ADAPTER_ISSUE = "#515" as const;
export const TYPESAFE_ADAPTER_EPIC = "#511" as const;
export const TYPESAFE_ADAPTER_CONSUMES = ["#512", "#513"] as const;
export const TYPESAFE_ADAPTER_PROVIDER_ID = "typesafe-ai" as const;
export const TYPESAFE_ADAPTER_BINDING_ID = "typesafe-ai/systemone-assessment" as const;
export const TYPESAFE_ADAPTER_STAMP = "0.221.34" as const;
export const TYPESAFE_SYSTEMONE_PATH = "/v1/systemone" as const;

export const TYPESAFE_AVAILABILITY_STATES = ["unselected", "unconfigured", "unavailable", "ready"] as const;
export type TypesafeAvailability = (typeof TYPESAFE_AVAILABILITY_STATES)[number];

export const TYPESAFE_IMPLEMENTED_CAPABILITIES = [
  "choice-encode-decode",
  "score-encode-decode",
  "noul-encode-decode",
  "batch-fan-out",
  "http-error-map",
] as const;

export const TYPESAFE_DEFERRED_CAPABILITIES = ["model-alias-pin", "credential-binding-live", "sdk-dependency-install"] as const;

export const TYPESAFE_REJECTED_CAPABILITIES = ["live-customer-payload", "marketing-latency-cost-sla", "interactive-ultrafast-productize"] as const;

export interface TypesafeSupportDeclaration {
  readonly providerId: typeof TYPESAFE_ADAPTER_PROVIDER_ID;
  readonly bindingId: typeof TYPESAFE_ADAPTER_BINDING_ID;
  readonly issue: typeof TYPESAFE_ADAPTER_ISSUE;
  readonly transport: typeof TYPESAFE_TRANSPORT_RECOMMENDATION;
  readonly implemented: readonly string[];
  readonly deferred: readonly string[];
  readonly rejected: readonly string[];
  readonly liveNotPerformed: true;
  readonly hostedKeyOwner: typeof TYPESAFE_HOSTED_KEY_OWNER;
  readonly envRequiredNames: readonly string[];
  readonly envOptionalNames: readonly string[];
  readonly defaultBaseUrl: typeof TYPESAFE_API_BASE_DEFAULT;
  readonly defaultModel: typeof TYPESAFE_MODEL_DEFAULT;
  readonly dispositions: Readonly<Record<TypesafeDisposition, number>>;
}

export function typesafeDispositionCountsFromMap(): Readonly<Record<TypesafeDisposition, number>> {
  const counts: Record<TypesafeDisposition, number> = { implement: 0, defer: 0, reject: 0 };
  for (const row of TYPESAFE_MAPPINGS) counts[row.disposition] += 1;
  return counts;
}

export function typesafeSupportDeclaration(): TypesafeSupportDeclaration {
  return {
    providerId: TYPESAFE_ADAPTER_PROVIDER_ID,
    bindingId: TYPESAFE_ADAPTER_BINDING_ID,
    issue: TYPESAFE_ADAPTER_ISSUE,
    transport: TYPESAFE_TRANSPORT_RECOMMENDATION,
    implemented: TYPESAFE_IMPLEMENTED_CAPABILITIES,
    deferred: TYPESAFE_DEFERRED_CAPABILITIES,
    rejected: TYPESAFE_REJECTED_CAPABILITIES,
    liveNotPerformed: TYPESAFE_LIVE_NOT_PERFORMED,
    hostedKeyOwner: TYPESAFE_HOSTED_KEY_OWNER,
    envRequiredNames: TYPESAFE_ENV_REQUIRED,
    envOptionalNames: TYPESAFE_ENV_OPTIONAL,
    defaultBaseUrl: TYPESAFE_API_BASE_DEFAULT,
    defaultModel: TYPESAFE_MODEL_DEFAULT,
    dispositions: typesafeDispositionCountsFromMap(),
  };
}

export interface TypesafeSelectionInput {
  /** Host explicitly selected this provider binding. */
  readonly selected: boolean;
  /** True when required credential env name resolves to a non-empty value (never log the value). */
  readonly configured: boolean;
  /** False when host marks the provider unavailable (outage, policy hold, terms block). */
  readonly available: boolean;
}

/**
 * Distinct availability — never collapses unselected→unconfigured→unavailable,
 * and never silently falls back to another model/provider.
 */
export function resolveTypesafeAvailability(input: TypesafeSelectionInput): TypesafeAvailability {
  if (!input.selected) return "unselected";
  if (!input.configured) return "unconfigured";
  if (!input.available) return "unavailable";
  return "ready";
}

export function typesafeCapabilityEmulationForbidden(capability: string): boolean {
  return (
    (TYPESAFE_DEFERRED_CAPABILITIES as readonly string[]).includes(capability) || (TYPESAFE_REJECTED_CAPABILITIES as readonly string[]).includes(capability)
  );
}
