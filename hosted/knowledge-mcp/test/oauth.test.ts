import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

// The provider imports this runtime base class; all OAuth and KV behavior stays real.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "cloudflare:workers") return { url: "data:text/javascript,export class WorkerEntrypoint {}", shortCircuit: true };
    return nextResolve(specifier, context);
  },
});
const { default: worker } = await import("../worker.js");
const origin = "https://b2c.test";
const authorizationUrl = `${origin}/oauth/authorize?${new URLSearchParams({
  client_id: "registered-client",
  redirect_uri: "http://127.0.0.1:43121/callback",
  response_type: "code",
  scope: "b2c:read",
  state: "private-state",
  code_challenge: "a".repeat(43),
  code_challenge_method: "S256",
  resource: `${origin}/mcp`,
})}`;

async function environment(get: (key: string) => Promise<unknown>) {
  const limiter = { limit: async () => ({ success: true }) };
  return {
    B2C_APP_BUILDER_PUBLIC_ORIGIN: origin,
    B2C_APP_BUILDER_TRUSTED_REDIRECTS: [],
    B2C_APP_BUILDER_ALLOWED_ORIGINS: [],
    B2C_APP_BUILDER_AUTH_SECRET: "c".repeat(43),
    OAUTH_KV: { get },
    INGRESS_LIMITER: limiter,
    AUTH_LIMITER: limiter,
    API_LIMITER: limiter,
  } as unknown as Env;
}
const context = { waitUntil() {}, passThroughOnException() {} } as unknown as ExecutionContext;

test("OAuth KV failures retain sanitized service recovery for browsers and machines", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Unexpected external request");
  });
  const env = await environment(async () => {
    throw new Error("private-provider-detail");
  });
  for (const accept of ["text/html", "application/json"]) {
    const response = await worker.fetch(new Request(authorizationUrl, { headers: { Accept: accept } }), env, context);
    assert.equal(response.status, 500);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const body = await response.text();
    for (const privateValue of ["private-provider-detail", "private-state", "registered-client"]) assert.ok(!body.includes(privateValue));
    if (accept === "text/html") {
      assert.ok(response.headers.get("content-type")?.startsWith("text/html"));
      assert.ok(body.includes("Hosted access is unavailable."));
      assert.ok(body.includes("Clueless Creations"));
      assert.ok(!body.includes("B2C App Builder is unavailable."));
    } else assert.deepEqual(JSON.parse(body), { error: "internal_error" });
  }
});

test("OAuth invalid clients and malformed requests remain sanitized client errors", async () => {
  const env = await environment(async () => null);
  for (const url of [authorizationUrl, `${origin}/oauth/authorize?client_id=private-client`]) {
    const response = await worker.fetch(new Request(url, { headers: { Accept: "text/html" } }), env, context);
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "invalid_request" });
  }
});

async function registeredEnvironment() {
  return environment(async (key) => {
    assert.equal(key, "client:registered-client");
    return {
      clientId: "registered-client",
      clientName: "Synthetic OAuth client",
      redirectUris: ["http://127.0.0.1:43121/callback"],
      tokenEndpointAuthMethod: "none",
      grantTypes: ["authorization_code", "refresh_token"],
      responseTypes: ["code"],
    };
  });
}

test("OAuth ignores unknown authorization fields without reflecting their values", async () => {
  const env = await registeredEnvironment();
  for (const [name, value] of [
    ["ui_locales", "en-US"],
    ["ui_locales", "fr-CA fr en"],
    ["future_extension", "<script>untrusted-extension</script>"],
    ["__proto__", "untrusted-prototype-value"],
  ] as const) {
    const url = new URL(authorizationUrl);
    url.searchParams.set(name, value);
    const response = await worker.fetch(new Request(url), env, context);
    assert.equal(response.status, 200, name);
    assert.ok(response.headers.get("content-type")?.startsWith("text/html"));
    const body = await response.text();
    assert.ok(body.includes("Synthetic OAuth client"));
    assert.ok(!body.includes(value), name);
    assert.ok(!body.includes("untrusted-extension"));
    assert.ok(!body.includes("untrusted-prototype-value"));
  }
});

test("CIMD authorization accepts the ChatGPT language hint using fixture metadata only", async (t) => {
  // This flag models the Worker runtime; no metadata request leaves the test.
  const previous = Object.getOwnPropertyDescriptor(globalThis, "Cloudflare");
  Object.defineProperty(globalThis, "Cloudflare", { configurable: true, value: { compatibilityFlags: { global_fetch_strictly_public: true } } });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, "Cloudflare", previous);
    else Reflect.deleteProperty(globalThis, "Cloudflare");
  });
  const clientId = "https://client.example.org/oauth/client.json";
  const redirectUri = "https://chatgpt.com/connector_platform_oauth_redirect";
  const metadataFetch = t.mock.method(globalThis, "fetch", async (input: Parameters<typeof fetch>[0]) => {
    assert.equal(String(input), clientId);
    return Response.json(
      {
        client_id: clientId,
        client_name: "Synthetic CIMD client",
        redirect_uris: [redirectUri],
        token_endpoint_auth_method: "none",
        grant_types: ["authorization_code"],
        response_types: ["code"],
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
  const env = await environment(async () => assert.fail("CIMD must not read a registered client"));
  env.B2C_APP_BUILDER_TRUSTED_REDIRECTS = [redirectUri, "https://claude.ai/api/mcp/auth_callback"];
  const url = new URL(authorizationUrl);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("ui_locales", "en-US");
  const response = await worker.fetch(new Request(url), env, context);
  assert.equal(response.status, 200);
  assert.ok((await response.text()).includes("Synthetic CIMD client"));
  assert.equal(metadataFetch.mock.callCount(), 2, "parse and consent resolve the same fixture document");
});

test("unknown authorization fields retain duplicate and canonical resource checks", async () => {
  const env = await registeredEnvironment();
  const url = new URL(authorizationUrl);
  url.searchParams.set("ui_locales", "en-US");
  for (const name of [
    "client_id",
    "redirect_uri",
    "response_type",
    "scope",
    "state",
    "code_challenge",
    "code_challenge_method",
    "ui_locales",
    "future_extension",
  ]) {
    const duplicate = new URL(url);
    if (!duplicate.searchParams.has(name)) duplicate.searchParams.set(name, "first");
    duplicate.searchParams.append(name, "second");
    const response = await worker.fetch(new Request(duplicate), env, context);
    assert.equal(response.status, 400, name);
    assert.deepEqual(await response.json(), { error: "invalid_request" });
  }
  const identicalResource = new URL(url);
  identicalResource.searchParams.append("resource", `${origin}/mcp`);
  assert.equal((await worker.fetch(new Request(identicalResource), env, context)).status, 200);
  identicalResource.searchParams.append("resource", "https://other.example.org/mcp");
  assert.equal((await worker.fetch(new Request(identicalResource), env, context)).status, 400);
});

test("unknown authorization fields preserve explicit security validation", async () => {
  const env = await registeredEnvironment();
  for (const [name, value] of [
    ["client_id", ""],
    ["client_id", "x".repeat(257)],
    ["redirect_uri", "https://untrusted.example.org/callback"],
    ["response_type", "token"],
    ["scope", ""],
    ["scope", "b2c:read openid"],
    ["state", ""],
    ["state", "x".repeat(513)],
    ["code_challenge", ""],
    ["code_challenge", "short"],
    ["code_challenge", "!".repeat(43)],
    ["code_challenge_method", "plain"],
    ["resource", "https://other.example.org/mcp"],
    ["access_token", "untrusted-query-credential"],
    ["api_key", "untrusted-query-credential"],
    ["token", "untrusted-query-credential"],
    ["Authorization", "untrusted-query-credential"],
  ] as const) {
    const url = new URL(authorizationUrl);
    url.searchParams.set("ui_locales", "en-US");
    url.searchParams.set(name, value);
    const response = await worker.fetch(new Request(url), env, context);
    assert.equal(response.status, 400, name);
    assert.deepEqual(await response.json(), { error: "invalid_request" });
  }
});

test("consent binds ignored query fields while retaining strict form validation", async () => {
  const env = await registeredEnvironment();
  const url = new URL(authorizationUrl);
  url.searchParams.set("ui_locales", "en-US");
  url.searchParams.set("future_extension", "untrusted-extension-value");
  const page = await worker.fetch(new Request(url), env, context);
  assert.equal(page.status, 200);
  const token = (await page.text()).match(/name="csrf" value="([A-Za-z0-9_.-]+)"/)?.[1];
  const cookie = page.headers.get("set-cookie")?.split(";")[0];
  assert.ok(token && cookie);
  const headers = { "Content-Type": "application/x-www-form-urlencoded", Origin: origin, Cookie: cookie };
  const body = new URLSearchParams({ csrf: token, decision: "deny" }).toString();
  const post = (target = url, form = body, requestHeaders = headers) =>
    worker.fetch(new Request(target, { method: "POST", headers: requestHeaders, body: form }), env, context);
  assert.equal((await post(url, body, { ...headers, Cookie: "" })).status, 403);
  for (const name of ["ui_locales", "future_extension"]) {
    const changed = new URL(url);
    changed.searchParams.set(name, "changed-extension-value");
    const rejected = await post(changed);
    assert.equal(rejected.status, 403, name);
    assert.ok(!(await rejected.text()).includes("changed-extension-value"));
  }
  assert.equal((await post(url, `${body}&csrf=duplicate`)).status, 400);
  assert.equal((await post(url, `${body}&ui_locales=en-US`)).status, 400);
  const denied = await post();
  assert.equal(denied.status, 303);
  const redirect = new URL(denied.headers.get("location")!);
  assert.equal(redirect.searchParams.get("error"), "access_denied");
  assert.equal(redirect.searchParams.get("state"), "private-state");
  assert.equal(redirect.searchParams.get("iss"), origin);
  for (const name of ["ui_locales", "future_extension", "code"]) assert.ok(!redirect.searchParams.has(name));
});
