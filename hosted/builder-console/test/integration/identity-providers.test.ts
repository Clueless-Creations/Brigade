/**
 * Provider-neutral identity + GitHub adapter security/regression matrix for #6 / ADR-0020.
 * Deterministic fixtures only — no live OAuth app, secrets, or real accounts.
 */

import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { SignJWT, exportJWK, generateKeyPair } from "jose";
import { tenantDb, type TenantDb } from "../../../knowledge-mcp/db/tenant.js";
import worker from "../../worker.js";
import { createTestDatabase, readUserGoogleSub, type TestDatabase } from "../support/d1.js";
import { readOAuthState } from "../../auth/session.js";

const ORIGIN = "https://app.clueless-creations.com";
const GOOGLE_CLIENT_ID = "identity-providers-test.apps.googleusercontent.com";
const GITHUB_CLIENT_ID = "Iv1.identity-providers-test";
const GITHUB_CLIENT_SECRET = "ghs_test_identity_providers";
const KID = "identity-providers-test-key";

type WorkerEnv = Parameters<typeof worker.fetch>[1];
type WorkerCtx = Parameters<typeof worker.fetch>[2];

let harness: TestDatabase;
let repository: TenantDb;
let privateKey: CryptoKey;
let jwks: { keys: unknown[] };
let restoreFetch: () => void;
let nextIdToken: string | undefined;
let nextGitHubUser: { id: number; login: string; name?: string; email: string } | undefined;

before(async () => {
  harness = await createTestDatabase();
  repository = tenantDb(harness.db);
  const pair = await generateKeyPair("RS256", { extractable: true });
  privateKey = pair.privateKey;
  const jwk = await exportJWK(pair.publicKey);
  jwks = { keys: [{ ...jwk, kid: KID, use: "sig", alg: "RS256" }] };

  const original = globalThis.fetch;
  restoreFetch = () => {
    globalThis.fetch = original;
  };
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (url === "https://oauth2.googleapis.com/token") {
      assert.ok(nextIdToken, `unexpected Google token exchange (${url})`);
      return new Response(JSON.stringify({ id_token: nextIdToken }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (url === "https://www.googleapis.com/oauth2/v3/certs") {
      return new Response(JSON.stringify(jwks), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (url === "https://github.com/login/oauth/access_token") {
      return new Response(JSON.stringify({ access_token: "gho_test", token_type: "bearer" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url === "https://api.github.com/user") {
      assert.ok(nextGitHubUser, "unexpected GitHub /user with no fixture queued");
      return new Response(
        JSON.stringify({ id: nextGitHubUser.id, login: nextGitHubUser.login, name: nextGitHubUser.name ?? null, email: null }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url === "https://api.github.com/user/emails") {
      assert.ok(nextGitHubUser, "unexpected GitHub /user/emails with no fixture queued");
      return new Response(
        JSON.stringify([{ email: nextGitHubUser.email, primary: true, verified: true }]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.startsWith("https://api.stripe.com/")) {
      throw new Error("identity-providers.test.ts: sign-in must not call Stripe");
    }
    throw new Error(`identity-providers.test.ts: unexpected fetch to ${url}`);
  }) as typeof fetch;
});

after(async () => {
  restoreFetch();
  await harness.dispose();
});

function memoryFlagsKv() {
  const map = new Map<string, string>();
  return { get: async (key: string) => map.get(key) ?? null, put: async (key: string, value: string) => void map.set(key, value) };
}

function makeEnv(overrides: Partial<{ GITHUB_CLIENT_ID: string; GITHUB_CLIENT_SECRET: string }> = {}): WorkerEnv {
  return {
    DB: harness.db,
    FLAGS_KV: memoryFlagsKv(),
    POSTHOG_HOST: "https://us.i.posthog.com",
    POSTHOG_PROJECT_TOKEN: "",
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: "test-google-client-secret",
    GITHUB_CLIENT_ID: overrides.GITHUB_CLIENT_ID ?? GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: overrides.GITHUB_CLIENT_SECRET ?? GITHUB_CLIENT_SECRET,
    B2C_APP_CONSOLE_AUTH_SECRET: "s".repeat(64),
    STRIPE_RESTRICTED_KEY: `rk_test_${"a".repeat(24)}`,
    STRIPE_WEBHOOK_SECRET: "whsec_test_unused",
  } as unknown as WorkerEnv;
}

function collectingCtx(): { ctx: WorkerCtx; settle: () => Promise<unknown> } {
  const pending: Promise<unknown>[] = [];
  return {
    ctx: { waitUntil: (promise: Promise<unknown>) => void pending.push(promise) } as unknown as WorkerCtx,
    settle: async () => {
      let processed = 0;
      while (processed < pending.length) {
        const batch = pending.slice(processed);
        processed = pending.length;
        await Promise.all(batch);
      }
    },
  };
}

async function dispatch(request: Request, env: WorkerEnv): Promise<Response> {
  const { ctx, settle } = collectingCtx();
  const response = await worker.fetch(request, env, ctx);
  await settle();
  return response;
}

function cookiePair(setCookieValue: string): string {
  return setCookieValue.split(";")[0]!;
}

function findSetCookie(response: Response, name: string): string | undefined {
  return response.headers.getSetCookie().find((entry) => entry.startsWith(`${name}=`));
}

async function signGoogleIdToken(opts: { readonly sub: string; readonly email: string; readonly nonce: string }): Promise<string> {
  return new SignJWT({ email: opts.email, email_verified: true, nonce: opts.nonce })
    .setProtectedHeader({ alg: "RS256", kid: KID })
    .setSubject(opts.sub)
    .setIssuer("https://accounts.google.com")
    .setAudience(GOOGLE_CLIENT_ID)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(privateKey);
}

async function startGoogle(env: WorkerEnv) {
  const response = await dispatch(new Request(`${ORIGIN}/auth/google/start`), env);
  assert.equal(response.status, 302);
  const location = new URL(response.headers.get("Location")!);
  const stateCookie = findSetCookie(response, "__Host-b2c-oauth-state")!;
  return {
    state: location.searchParams.get("state")!,
    nonce: location.searchParams.get("nonce")!,
    oauthStateCookie: cookiePair(stateCookie),
    cookieHeader: stateCookie,
  };
}

async function startGitHub(env: WorkerEnv) {
  const response = await dispatch(new Request(`${ORIGIN}/auth/github/start`), env);
  assert.equal(response.status, 302);
  const location = new URL(response.headers.get("Location")!);
  assert.equal(location.origin, "https://github.com");
  const stateCookie = findSetCookie(response, "__Host-b2c-oauth-state")!;
  return {
    state: location.searchParams.get("state")!,
    oauthStateCookie: cookiePair(stateCookie),
  };
}

test("Google sign-in still creates a google identity and survives lookup after migration", async () => {
  const env = makeEnv();
  const started = await startGoogle(env);
  nextIdToken = await signGoogleIdToken({ sub: "google-sub-survive-1", email: "g1@example.com", nonce: started.nonce });
  const callbackUrl = new URL(`${ORIGIN}/auth/google/callback`);
  callbackUrl.searchParams.set("code", "g-code");
  callbackUrl.searchParams.set("state", started.state);
  const response = await dispatch(new Request(callbackUrl, { headers: { Cookie: started.oauthStateCookie } }), env);
  assert.equal(response.status, 302);
  assert.equal(new URL(response.headers.get("Location")!, ORIGIN).pathname, "/console");

  const found = await repository.findUserByIdentity("google", "google-sub-survive-1");
  assert.ok(found);
  const viaCompat = await repository.findUserByGoogleSub("google-sub-survive-1");
  assert.equal(viaCompat?.userId, found!.userId);

  assert.equal(await readUserGoogleSub(harness.db, found!.userId), "google-sub-survive-1");
});

test("GitHub sign-in creates an account without inventing google_sub", async () => {
  const env = makeEnv();
  const started = await startGitHub(env);
  nextGitHubUser = { id: 424242, login: "brigade-bot", name: "Brigade Bot", email: "gh1@example.com" };
  const callbackUrl = new URL(`${ORIGIN}/auth/github/callback`);
  callbackUrl.searchParams.set("code", "gh-code");
  callbackUrl.searchParams.set("state", started.state);
  const response = await dispatch(new Request(callbackUrl, { headers: { Cookie: started.oauthStateCookie } }), env);
  assert.equal(response.status, 302);
  assert.equal(new URL(response.headers.get("Location")!, ORIGIN).pathname, "/console");

  const found = await repository.findUserByIdentity("github", "424242");
  assert.ok(found);
  assert.equal(await readUserGoogleSub(harness.db, found!.userId), null);
  assert.equal(await repository.findUserByGoogleSub("424242"), null);
});

test("same email from Google and GitHub does not silently merge accounts", async () => {
  const env = makeEnv();
  const email = "shared@example.com";

  const g = await startGoogle(env);
  nextIdToken = await signGoogleIdToken({ sub: "google-shared-email", email, nonce: g.nonce });
  const gUrl = new URL(`${ORIGIN}/auth/google/callback`);
  gUrl.searchParams.set("code", "g");
  gUrl.searchParams.set("state", g.state);
  assert.equal((await dispatch(new Request(gUrl, { headers: { Cookie: g.oauthStateCookie } }), env)).status, 302);

  const h = await startGitHub(env);
  nextGitHubUser = { id: 999001, login: "shared-gh", email };
  const hUrl = new URL(`${ORIGIN}/auth/github/callback`);
  hUrl.searchParams.set("code", "h");
  hUrl.searchParams.set("state", h.state);
  assert.equal((await dispatch(new Request(hUrl, { headers: { Cookie: h.oauthStateCookie } }), env)).status, 302);

  const googleUser = await repository.findUserByIdentity("google", "google-shared-email");
  const githubUser = await repository.findUserByIdentity("github", "999001");
  assert.ok(googleUser && githubUser);
  assert.notEqual(googleUser!.userId, githubUser!.userId);
  assert.notEqual(googleUser!.accountId, githubUser!.accountId);
});

test("wrong-provider callback fails closed (GitHub cookie on Google callback)", async () => {
  const env = makeEnv();
  const githubStart = await startGitHub(env);
  const cookie = githubStart.oauthStateCookie;
  const parsed = readOAuthState(new Request(ORIGIN, { headers: { Cookie: cookie } }));
  assert.equal(parsed?.provider, "github");

  const callbackUrl = new URL(`${ORIGIN}/auth/google/callback`);
  callbackUrl.searchParams.set("code", "whatever");
  callbackUrl.searchParams.set("state", githubStart.state);
  const response = await dispatch(new Request(callbackUrl, { headers: { Cookie: cookie } }), env);
  assert.equal(response.status, 400);
  const body = await response.text();
  assert.match(body, /couldn’t sign you in|could not sign you in|Try again/i);
});

test("GitHub start without secrets fails closed without breaking Google start", async () => {
  const envNoGh = makeEnv({ GITHUB_CLIENT_ID: "", GITHUB_CLIENT_SECRET: "" });
  const gh = await dispatch(new Request(`${ORIGIN}/auth/github/start`), envNoGh);
  assert.equal(gh.status, 503);

  const google = await dispatch(new Request(`${ORIGIN}/auth/google/start`), envNoGh);
  assert.equal(google.status, 302);
  assert.match(google.headers.get("Location") ?? "", /accounts\.google\.com/);
});

test("mismatched OAuth state fails closed for GitHub", async () => {
  const env = makeEnv();
  const started = await startGitHub(env);
  const callbackUrl = new URL(`${ORIGIN}/auth/github/callback`);
  callbackUrl.searchParams.set("code", "x");
  callbackUrl.searchParams.set("state", "totally-wrong-state-value-xxxxxxxxxxxxx");
  const response = await dispatch(new Request(callbackUrl, { headers: { Cookie: started.oauthStateCookie } }), env);
  assert.equal(response.status, 400);
});
