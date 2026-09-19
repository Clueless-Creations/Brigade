/**
 * #515 thin-direct-http transport for TypeSafe System One.
 * Host owns fetch, AbortSignal, timeouts, secret injection, size limits, bounded retry.
 * Fake transport is for wiring tests only — never proof of live support.
 */
import { TYPESAFE_SYSTEMONE_PATH } from "./support.js";
import {
  TYPESAFE_DEFAULT_EFFECTS,
  assertEndpointAllowed,
  assertRequestSize,
  assertResponseSize,
  cancelledViolation,
  deadlineExceededViolation,
  uncertainDispatchViolation,
  type TypesafeEffectsPolicy,
  type TypesafeEffectsViolation,
} from "./effects.js";
import { mapTypesafeHttpStatus } from "./decode.js";
import { redactSecrets } from "./connection.js";
import type { TypesafeNativeRequest } from "./encode.js";

export type TypesafeTransportKind = "fake" | "live-http";

export interface TypesafeTransportRequest {
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly body: TypesafeNativeRequest;
  readonly signal?: AbortSignal;
  readonly effects?: TypesafeEffectsPolicy;
}

export interface TypesafeTransportSuccess {
  readonly ok: true;
  readonly status: number;
  readonly body: unknown;
  readonly rawText: string;
  readonly attemptCount: number;
}

export interface TypesafeTransportFailure {
  readonly ok: false;
  readonly kind: "effects" | "http" | "network" | "abort" | "uncertain";
  readonly status?: number;
  readonly failureStatus?: "invalid-response" | "unsupported" | "unknown" | "timeout" | "cancelled";
  readonly code: string;
  readonly detail: string;
  readonly retryable?: boolean;
  readonly violation?: TypesafeEffectsViolation;
  readonly attemptCount: number;
}

export type TypesafeTransportResult = TypesafeTransportSuccess | TypesafeTransportFailure;

export interface TypesafeTransport {
  readonly kind: TypesafeTransportKind;
  execute(request: TypesafeTransportRequest): Promise<TypesafeTransportResult>;
}

export interface FakeTypesafeScript {
  /** Scripted HTTP responses in call order; last repeats. */
  readonly responses?: readonly (
    { readonly status: number; readonly body: unknown } | { readonly error: "timeout" | "abort" | "network" | "uncertain"; readonly afterDispatch?: boolean }
  )[];
  /** Capture of requests for wiring assertions. */
  readonly onRequest?: (request: TypesafeTransportRequest) => void;
}

export interface FakeTypesafeTransport extends TypesafeTransport {
  readonly kind: "fake";
  readonly calls: readonly TypesafeNativeRequest[];
  readonly inferenceCallCount: number;
}

/** Deterministic in-memory transport. Never opens a socket. */
export function createFakeTypesafeTransport(script: FakeTypesafeScript = {}): FakeTypesafeTransport {
  const calls: TypesafeNativeRequest[] = [];
  const responses = script.responses ?? [];
  let inferenceCallCount = 0;
  return {
    kind: "fake",
    calls,
    get inferenceCallCount() {
      return inferenceCallCount;
    },
    async execute(request) {
      script.onRequest?.(request);
      const policy = request.effects ?? TYPESAFE_DEFAULT_EFFECTS;
      const endpointViolation = assertEndpointAllowed(request.baseUrl, {
        ...policy,
        allowedBaseUrl: policy.allowedBaseUrl,
      });
      // Fake allows whatever baseUrl the host configured when allowlist matches request intent;
      // for wiring tests, skip allowlist by setting allowedBaseUrl to the request baseUrl.
      const effectivePolicy = { ...policy, allowedBaseUrl: request.baseUrl };
      const sizeBody = JSON.stringify(request.body);
      const oversized = assertRequestSize(sizeBody, effectivePolicy);
      if (oversized) {
        return {
          ok: false,
          kind: "effects",
          code: oversized.code,
          detail: redactSecrets(oversized.detail, request.apiKey),
          violation: oversized,
          attemptCount: 0,
        };
      }
      calls.push(structuredClone(request.body));
      inferenceCallCount += 1;

      if (request.signal?.aborted) {
        const violation = cancelledViolation(false);
        return {
          ok: false,
          kind: "abort",
          failureStatus: "cancelled",
          code: violation.code,
          detail: violation.detail,
          violation,
          attemptCount: 1,
        };
      }

      const index = Math.min(Math.max(responses.length - 1, 0), calls.length - 1);
      const scripted = responses[index];
      if (!scripted) {
        return {
          ok: true,
          status: 200,
          body: { model: request.body.model, answers: {}, usage: { input_tokens: 0, output_tokens: 0 } },
          rawText: "{}",
          attemptCount: 1,
        };
      }
      if ("error" in scripted) {
        if (scripted.error === "timeout") {
          const violation = deadlineExceededViolation(scripted.afterDispatch !== false);
          return {
            ok: false,
            kind: "effects",
            failureStatus: "timeout",
            code: violation.code,
            detail: violation.detail,
            violation,
            attemptCount: 1,
          };
        }
        if (scripted.error === "abort") {
          const violation = cancelledViolation(scripted.afterDispatch !== false);
          return {
            ok: false,
            kind: "abort",
            failureStatus: "cancelled",
            code: violation.code,
            detail: violation.detail,
            violation,
            attemptCount: 1,
          };
        }
        if (scripted.error === "uncertain") {
          const violation = uncertainDispatchViolation(
            scripted.afterDispatch === false ? "Dispatch state unknown before send" : "Dispatch may have reached provider; spend uncertain",
          );
          return {
            ok: false,
            kind: "uncertain",
            failureStatus: "unknown",
            code: violation.code,
            detail: violation.detail,
            violation,
            attemptCount: 1,
          };
        }
        return {
          ok: false,
          kind: "network",
          failureStatus: "unknown",
          code: "network_error",
          detail: "Simulated network failure",
          attemptCount: 1,
        };
      }

      const rawText = JSON.stringify(scripted.body);
      const responseOversized = assertResponseSize(rawText, effectivePolicy);
      if (responseOversized) {
        return {
          ok: false,
          kind: "effects",
          status: scripted.status,
          code: responseOversized.code,
          detail: responseOversized.detail,
          violation: responseOversized,
          attemptCount: 1,
        };
      }

      if (scripted.status < 200 || scripted.status >= 300) {
        const mapped = mapTypesafeHttpStatus(scripted.status);
        return {
          ok: false,
          kind: "http",
          status: scripted.status,
          failureStatus: mapped.failureStatus,
          code: mapped.code,
          detail: redactSecrets(`HTTP ${scripted.status}`, request.apiKey),
          retryable: mapped.retryable,
          attemptCount: 1,
        };
      }

      // Silence unused endpoint check when allowlist equals request (wiring).
      void endpointViolation;
      return {
        ok: true,
        status: scripted.status,
        body: scripted.body,
        rawText,
        attemptCount: 1,
      };
    },
  };
}

export interface LiveTypesafeTransportOptions {
  readonly fetchImpl?: typeof fetch;
  readonly effects?: TypesafeEffectsPolicy;
}

/**
 * Thin live HTTP transport. Not invoked by fixtures. Requires host-provided key + allowlist.
 * Live smoke is out of scope for #515 default close path.
 */
export function createLiveTypesafeTransport(options: LiveTypesafeTransportOptions = {}): TypesafeTransport {
  const fetchImpl = options.fetchImpl ?? fetch;
  return {
    kind: "live-http",
    async execute(request) {
      const policy = request.effects ?? options.effects ?? TYPESAFE_DEFAULT_EFFECTS;
      const endpointViolation = assertEndpointAllowed(request.baseUrl, policy);
      if (endpointViolation) {
        return {
          ok: false,
          kind: "effects",
          code: endpointViolation.code,
          detail: endpointViolation.detail,
          violation: endpointViolation,
          attemptCount: 0,
        };
      }
      const rawRequest = JSON.stringify(request.body);
      const oversized = assertRequestSize(rawRequest, policy);
      if (oversized) {
        return {
          ok: false,
          kind: "effects",
          code: oversized.code,
          detail: oversized.detail,
          violation: oversized,
          attemptCount: 0,
        };
      }

      const controller = new AbortController();
      const deadline = setTimeout(() => controller.abort(), policy.deadlineMs);
      const onAbort = () => controller.abort();
      request.signal?.addEventListener("abort", onAbort, { once: true });

      let attemptCount = 0;
      let dispatched = false;
      try {
        const maxAttempts = Math.max(1, policy.maxRetries + 1);
        let lastFailure: TypesafeTransportFailure | undefined;
        while (attemptCount < maxAttempts) {
          attemptCount += 1;
          if (request.signal?.aborted || controller.signal.aborted) {
            const violation = cancelledViolation(dispatched);
            return {
              ok: false,
              kind: "abort",
              failureStatus: "cancelled",
              code: violation.code,
              detail: violation.detail,
              violation,
              attemptCount,
            };
          }
          try {
            dispatched = true;
            const response = await fetchImpl(`${request.baseUrl}${TYPESAFE_SYSTEMONE_PATH}`, {
              method: "POST",
              headers: {
                authorization: `Bearer ${request.apiKey}`,
                "content-type": "application/json",
                accept: "application/json",
              },
              body: rawRequest,
              signal: controller.signal,
            });
            const rawText = await response.text();
            const responseOversized = assertResponseSize(rawText, policy);
            if (responseOversized) {
              return {
                ok: false,
                kind: "effects",
                status: response.status,
                code: responseOversized.code,
                detail: responseOversized.detail,
                violation: responseOversized,
                attemptCount,
              };
            }
            if (!response.ok) {
              const mapped = mapTypesafeHttpStatus(response.status);
              lastFailure = {
                ok: false,
                kind: "http",
                status: response.status,
                failureStatus: mapped.failureStatus,
                code: mapped.code,
                detail: redactSecrets(`HTTP ${response.status}`, request.apiKey),
                retryable: mapped.retryable,
                attemptCount,
              };
              if (!mapped.retryable || attemptCount >= maxAttempts) return lastFailure;
              await new Promise((resolve) => setTimeout(resolve, policy.retryBackoffMs * attemptCount));
              continue;
            }
            let body: unknown = rawText;
            try {
              body = JSON.parse(rawText) as unknown;
            } catch {
              return {
                ok: false,
                kind: "http",
                status: response.status,
                failureStatus: "invalid-response",
                code: "json_parse_failed",
                detail: "Response body was not JSON",
                attemptCount,
              };
            }
            return { ok: true, status: response.status, body, rawText, attemptCount };
          } catch (error) {
            if (controller.signal.aborted || request.signal?.aborted) {
              const violation = deadlineExceededViolation(dispatched);
              // Distinguish cancel vs deadline when the host abort signal fired.
              const cancelled = request.signal?.aborted === true;
              const v = cancelled ? cancelledViolation(dispatched) : violation;
              return {
                ok: false,
                kind: cancelled ? "abort" : "effects",
                failureStatus: cancelled ? "cancelled" : "timeout",
                code: v.code,
                detail: redactSecrets(v.detail, request.apiKey),
                violation: v,
                attemptCount,
              };
            }
            lastFailure = {
              ok: false,
              kind: "network",
              failureStatus: "unknown",
              code: "network_error",
              detail: redactSecrets(error instanceof Error ? error.message : "network error", request.apiKey),
              retryable: true,
              attemptCount,
            };
            if (attemptCount >= maxAttempts) {
              return {
                ...lastFailure,
                kind: "uncertain",
                violation: uncertainDispatchViolation("Network failure after dispatch; spend may have occurred"),
              };
            }
            await new Promise((resolve) => setTimeout(resolve, policy.retryBackoffMs * attemptCount));
          }
        }
        return (
          lastFailure ?? {
            ok: false,
            kind: "uncertain",
            failureStatus: "unknown",
            code: "retry_exhausted",
            detail: "Retries exhausted",
            attemptCount,
            violation: uncertainDispatchViolation("Retries exhausted after dispatch"),
          }
        );
      } finally {
        clearTimeout(deadline);
        request.signal?.removeEventListener("abort", onAbort);
      }
    },
  };
}
