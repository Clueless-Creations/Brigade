import { endpoint } from "./validate.mjs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const origin = new URL(endpoint).origin;
const routes = ["/health", "/.well-known/oauth-protected-resource", "/.well-known/oauth-authorization-server"];

export async function probe(fetcher = fetch) {
  const observations = {};
  for (const route of routes) {
    const response = await fetcher(origin + route, { method: "GET", redirect: "error", signal: AbortSignal.timeout(10000) });
    const body = await response.json();
    observations[route] = { status: response.status, body };
  }
  const response = await fetcher(endpoint, {
    method: "POST", redirect: "error", signal: AbortSignal.timeout(10000),
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "brigade-pilot-readonly-probe", version: "0.1.0" } } })
  });
  const resource = observations[routes[1]].body;
  const issuer = observations[routes[2]].body;
  // Keep only public protocol facts. Never call registration, authorization, or token routes.
  return {
    observedAt: new Date().toISOString(),
    scope: "unauthenticated_public_protocol_only",
    healthStatus: observations["/health"].status,
    engineVersion: observations["/health"].body.engineVersion ?? null,
    resourceMetadataStatus: observations[routes[1]].status,
    resourceMatchesEndpoint: resource.resource === endpoint,
    readScopeAdvertised: resource.scopes_supported?.includes("b2c:read") ?? false,
    authorizationServers: resource.authorization_servers ?? [],
    issuerMetadataStatus: observations[routes[2]].status,
    issuerMatchesOrigin: issuer.issuer === origin,
    pkceS256: issuer.code_challenge_methods_supported?.includes("S256") ?? false,
    dcrAdvertised: typeof issuer.registration_endpoint === "string",
    cimdAdvertised: issuer.client_id_metadata_document_supported === true,
    unauthenticatedInitializeStatus: response.status,
    bearerChallengePresent: (response.headers.get("www-authenticate") ?? "").startsWith("Bearer"),
    authenticatedTools: "not_tested",
    oauthConsentAndTokenExchange: "not_tested",
    accountChanges: false
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv.includes("--live")) {
    console.log(JSON.stringify({ status: "not_run", requests: routes.map((route) => "GET " + origin + route).concat("POST " + endpoint + " (unauthenticated initialize only)") }, null, 2));
  } else {
    try { console.log(JSON.stringify(await probe(), null, 2)); }
    catch (error) { console.error("Public endpoint probe failed: " + error.message); process.exitCode = 1; }
  }
}
