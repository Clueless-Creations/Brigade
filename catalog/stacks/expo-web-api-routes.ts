/**
 * Expo production API route contracts (#86).
 *
 * Client protected routes are not a server security boundary. Production API
 * routes need typed validation, server authorization, rate/size limits, and
 * safe errors. Browser cookie/session/CSRF/CORS vs native bearer are distinct.
 * Reuses #83 identity/session seams — no second login service.
 * Static+API remains incompatible. Synthetic server fixtures only; no live preview.
 */

import { classifyProtectedRoute } from "./expo-capability-protocol.js";
import type { ExpoWebSurfaceMode } from "./expo-web-static.js";

export const EXPO_WEB_API_ROUTES_PATH = "catalog/stacks/expo-web-api-routes.ts" as const;

export type ExpoWebApiClientKind = "browser-cookie-session" | "native-bearer";

export type ExpoWebApiRefuseReason =
  | "static-plus-api-routes"
  | "spa-plus-api-routes"
  | "client-route-is-not-server-boundary"
  | "missing-typed-validation"
  | "missing-server-auth"
  | "forged-token"
  | "expired-session"
  | "cross-account"
  | "shared-cache-leak"
  | "rate-or-size-exceeded"
  | "unsafe-error-leak"
  | "csrf-required-for-browser"
  | "cors-misconfigured"
  | "bearer-required-for-native"
  | "second-login-refused"
  | "unselected-api-routes";

export interface ExpoWebApiRouteContract {
  readonly routeId: string;
  readonly method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  readonly requiresAuth: boolean;
  readonly clientKind: ExpoWebApiClientKind;
  readonly typedValidation: boolean;
  readonly serverAuthorization: boolean;
  readonly rateLimitPerMinute: number;
  readonly maxBodyBytes: number;
  readonly safeErrors: boolean;
  readonly csrfProtection?: boolean;
  readonly corsAllowCredentials?: boolean;
  readonly corsAllowedOrigins?: readonly string[];
}

export type ExpoWebApiValidationResult =
  | {
      readonly status: "accept-contract";
      readonly livePreview: false;
      readonly secondLoginService: false;
      readonly notes: string;
    }
  | {
      readonly status: "refuse";
      readonly reason: ExpoWebApiRefuseReason;
      readonly livePreview: false;
      readonly secondLoginService: false;
      readonly notes: string;
    };

export function validateExpoWebApiSurface(input: {
  readonly mode: ExpoWebSurfaceMode;
  readonly apiRoutesSelected: boolean;
  readonly apiRoutesRequired?: boolean;
}): ExpoWebApiValidationResult {
  const denied = (reason: ExpoWebApiRefuseReason, notes: string): ExpoWebApiValidationResult => ({
    status: "refuse",
    reason,
    livePreview: false,
    secondLoginService: false,
    notes,
  });

  if (!input.apiRoutesSelected && input.apiRoutesRequired) {
    return denied("unselected-api-routes", "Required API routes were not selected. Do not invent a silent server.");
  }
  if (!input.apiRoutesSelected) {
    return {
      status: "accept-contract",
      livePreview: false,
      secondLoginService: false,
      notes: "API routes unselected. Static/local web may proceed without a server boundary.",
    };
  }
  if (input.mode === "static") {
    return denied("static-plus-api-routes", "Static hosting cannot execute Expo Router API routes.");
  }
  if (input.mode === "spa") {
    return denied("spa-plus-api-routes", "A single-page export cannot execute API routes.");
  }
  return {
    status: "accept-contract",
    livePreview: false,
    secondLoginService: false,
    notes: "Server/API mode selected. Contracts must still pass typed validation and server auth fixtures.",
  };
}

export function validateExpoWebApiRouteContract(contract: ExpoWebApiRouteContract): ExpoWebApiValidationResult {
  const denied = (reason: ExpoWebApiRefuseReason, notes: string): ExpoWebApiValidationResult => ({
    status: "refuse",
    reason,
    livePreview: false,
    secondLoginService: false,
    notes,
  });

  if (!contract.typedValidation) {
    return denied("missing-typed-validation", "Production API routes require typed input validation.");
  }
  if (contract.requiresAuth && !contract.serverAuthorization) {
    return denied("missing-server-auth", "Authenticated routes require server authorization, not a client gate.");
  }
  if (!contract.safeErrors) {
    return denied("unsafe-error-leak", "API errors must be safe; do not leak secrets or cross-user details.");
  }
  if (contract.rateLimitPerMinute <= 0 || contract.maxBodyBytes <= 0) {
    return denied("rate-or-size-exceeded", "Rate and size limits must be positive finite bounds.");
  }
  if (contract.clientKind === "browser-cookie-session") {
    if (contract.requiresAuth && contract.csrfProtection !== true) {
      return denied("csrf-required-for-browser", "Browser cookie/session mutating routes require CSRF protection.");
    }
    if (contract.corsAllowCredentials && (!contract.corsAllowedOrigins || contract.corsAllowedOrigins.length === 0)) {
      return denied("cors-misconfigured", "Credentialed CORS requires an explicit allowlist. Never reflect Origin.");
    }
  }
  if (contract.clientKind === "native-bearer" && contract.requiresAuth) {
    // bearer contract is distinct; csrf is not a substitute
    if (contract.csrfProtection === true && !contract.serverAuthorization) {
      return denied("bearer-required-for-native", "Native clients use bearer auth at the server; CSRF alone is not the boundary.");
    }
  }

  return {
    status: "accept-contract",
    livePreview: false,
    secondLoginService: false,
    notes: "API route contract accepted as a synthetic model. Not live preview proof. No second login service.",
  };
}

export function refuseClientRouteAsServerBoundary(): ExpoWebApiValidationResult {
  const classified = classifyProtectedRoute({ surface: "client-router", claim: "server-authorization" });
  return {
    status: "refuse",
    reason: "client-route-is-not-server-boundary",
    livePreview: false,
    secondLoginService: false,
    notes: classified.reason,
  };
}

export function refuseSecondLoginService(): ExpoWebApiValidationResult {
  return {
    status: "refuse",
    reason: "second-login-refused",
    livePreview: false,
    secondLoginService: false,
    notes: "Reuse #83 identity/session owners. Do not invent a second login service for web API routes.",
  };
}

export type ExpoWebApiRequestFixture = {
  readonly contract: ExpoWebApiRouteContract;
  readonly authToken?: string;
  readonly sessionExpired?: boolean;
  readonly forgedToken?: boolean;
  readonly requestAccountId?: string;
  readonly resourceAccountId?: string;
  readonly bodyBytes?: number;
  readonly requestsInWindow?: number;
  readonly cacheVisibility?: "private" | "public-shared";
  readonly errorIncludesSecret?: boolean;
};

export type ExpoWebApiSyntheticResponse =
  | {
      readonly status: "ok";
      readonly livePreview: false;
      readonly notes: string;
    }
  | {
      readonly status: "reject";
      readonly reason: ExpoWebApiRefuseReason;
      readonly livePreview: false;
      readonly notes: string;
    };

export function evaluateSyntheticApiRequest(input: ExpoWebApiRequestFixture): ExpoWebApiSyntheticResponse {
  const contractCheck = validateExpoWebApiRouteContract(input.contract);
  if (contractCheck.status === "refuse") {
    return { status: "reject", reason: contractCheck.reason, livePreview: false, notes: contractCheck.notes };
  }
  if (input.forgedToken) {
    return { status: "reject", reason: "forged-token", livePreview: false, notes: "Server rejects forged tokens." };
  }
  if (input.sessionExpired) {
    return { status: "reject", reason: "expired-session", livePreview: false, notes: "Server rejects expired sessions." };
  }
  if (input.contract.requiresAuth && input.requestAccountId && input.resourceAccountId && input.requestAccountId !== input.resourceAccountId) {
    return { status: "reject", reason: "cross-account", livePreview: false, notes: "Server rejects cross-account access." };
  }
  if (input.cacheVisibility === "public-shared" && input.contract.requiresAuth) {
    return {
      status: "reject",
      reason: "shared-cache-leak",
      livePreview: false,
      notes: "Authenticated responses must not enter a public shared cache.",
    };
  }
  if (input.bodyBytes !== undefined && input.bodyBytes > input.contract.maxBodyBytes) {
    return { status: "reject", reason: "rate-or-size-exceeded", livePreview: false, notes: "Request body exceeds size limit." };
  }
  if (input.requestsInWindow !== undefined && input.requestsInWindow > input.contract.rateLimitPerMinute) {
    return { status: "reject", reason: "rate-or-size-exceeded", livePreview: false, notes: "Rate limit exceeded." };
  }
  if (input.errorIncludesSecret) {
    return { status: "reject", reason: "unsafe-error-leak", livePreview: false, notes: "Error payloads must not include secrets." };
  }
  if (input.contract.clientKind === "native-bearer" && input.contract.requiresAuth && !input.authToken) {
    return { status: "reject", reason: "bearer-required-for-native", livePreview: false, notes: "Native bearer required." };
  }
  return { status: "ok", livePreview: false, notes: "Synthetic server fixture accepted. Not a live preview." };
}

export const EXPO_WEB_API_NOTES = {
  clientRouteNotBoundary: "Client protected routes ≠ server security boundary.",
  browserVsNative: "Browser CSRF/CORS/cookies and native bearer are distinct contracts.",
  noSecondLogin: "Reuse #83 identity/session seams — no second login service.",
  staticIncompatible: "Static+API and SPA+API remain refuse.",
} as const;
