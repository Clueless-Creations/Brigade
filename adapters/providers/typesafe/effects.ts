/**
 * #515 host-controlled effects policy for TypeSafe System One.
 * Deadline, cancel, max sizes, bounded retry — host owns all of these.
 * Timeout-after-dispatch may have spent money → record uncertainty; never claim exactly-once billing.
 */
export interface TypesafeEffectsPolicy {
  readonly allowedBaseUrl: string;
  readonly maxRequestBytes: number;
  readonly maxResponseBytes: number;
  /** End-to-end deadline in milliseconds. */
  readonly deadlineMs: number;
  /** Bounded retries for retryable HTTP failures (host-owned). */
  readonly maxRetries: number;
  readonly retryBackoffMs: number;
}

export const TYPESAFE_DEFAULT_EFFECTS: TypesafeEffectsPolicy = Object.freeze({
  allowedBaseUrl: "https://api.typesafe.ai",
  maxRequestBytes: 256_000,
  maxResponseBytes: 512_000,
  deadlineMs: 30_000,
  maxRetries: 2,
  retryBackoffMs: 250,
});

export type TypesafeDispatchCertainty = "certain" | "uncertain";

export interface TypesafeEffectsViolation {
  readonly code:
    "endpoint_not_allowed" | "request_oversized" | "response_oversized" | "deadline_exceeded" | "cancelled" | "retry_exhausted" | "uncertain_dispatch";
  readonly detail: string;
  /** When timeout/cancel occurs after bytes may have been sent. */
  readonly dispatchCertainty: TypesafeDispatchCertainty;
  /** Host must not claim exactly-once billing when uncertain. */
  readonly exactlyOnceBillingClaimed: false;
}

export function assertEndpointAllowed(baseUrl: string, policy: TypesafeEffectsPolicy): TypesafeEffectsViolation | undefined {
  const normalized = baseUrl.replace(/\/+$/u, "");
  const allowed = policy.allowedBaseUrl.replace(/\/+$/u, "");
  if (normalized !== allowed) {
    return {
      code: "endpoint_not_allowed",
      detail: `Base URL not in host allowlist`,
      dispatchCertainty: "certain",
      exactlyOnceBillingClaimed: false,
    };
  }
  return undefined;
}

export function assertRequestSize(body: string, policy: TypesafeEffectsPolicy): TypesafeEffectsViolation | undefined {
  if (body.length > policy.maxRequestBytes) {
    return {
      code: "request_oversized",
      detail: `Request body ${body.length} exceeds maxRequestBytes ${policy.maxRequestBytes}`,
      dispatchCertainty: "certain",
      exactlyOnceBillingClaimed: false,
    };
  }
  return undefined;
}

export function assertResponseSize(body: string, policy: TypesafeEffectsPolicy): TypesafeEffectsViolation | undefined {
  if (body.length > policy.maxResponseBytes) {
    return {
      code: "response_oversized",
      detail: `Response body ${body.length} exceeds maxResponseBytes ${policy.maxResponseBytes}`,
      dispatchCertainty: "certain",
      exactlyOnceBillingClaimed: false,
    };
  }
  return undefined;
}

export function deadlineExceededViolation(dispatched: boolean): TypesafeEffectsViolation {
  return {
    code: "deadline_exceeded",
    detail: dispatched ? "Deadline exceeded after dispatch; spend may have occurred; reconciliation limits apply" : "Deadline exceeded before dispatch",
    dispatchCertainty: dispatched ? "uncertain" : "certain",
    exactlyOnceBillingClaimed: false,
  };
}

export function cancelledViolation(dispatched: boolean): TypesafeEffectsViolation {
  return {
    code: "cancelled",
    detail: dispatched ? "Cancelled after dispatch; spend may have occurred; do not claim exactly-once billing" : "Cancelled before dispatch",
    dispatchCertainty: dispatched ? "uncertain" : "certain",
    exactlyOnceBillingClaimed: false,
  };
}

export function uncertainDispatchViolation(detail: string): TypesafeEffectsViolation {
  return {
    code: "uncertain_dispatch",
    detail,
    dispatchCertainty: "uncertain",
    exactlyOnceBillingClaimed: false,
  };
}
