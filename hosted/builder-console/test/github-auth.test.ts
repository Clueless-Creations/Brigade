import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildGitHubAuthorizeUrl,
  exchangeGitHubCode,
  fetchGitHubIdentity,
  GitHubAuthError,
} from "../auth/github.js";

const CLIENT_ID = "Iv1.test-client-id";
const CLIENT_SECRET = "ghs_test_secret";

test("buildGitHubAuthorizeUrl points at GitHub authorize with required params", () => {
  const url = new URL(
    buildGitHubAuthorizeUrl({
      clientId: CLIENT_ID,
      redirectUri: "https://app.clueless-creations.com/auth/github/callback",
      state: "s1",
    }),
  );
  assert.equal(url.origin + url.pathname, "https://github.com/login/oauth/authorize");
  assert.equal(url.searchParams.get("client_id"), CLIENT_ID);
  assert.equal(url.searchParams.get("redirect_uri"), "https://app.clueless-creations.com/auth/github/callback");
  assert.equal(url.searchParams.get("state"), "s1");
  assert.equal(url.searchParams.get("scope"), "read:user user:email");
});

test("exchangeGitHubCode maps bad_verification_code to expired_code", async () => {
  await assert.rejects(
    () =>
      exchangeGitHubCode({
        code: "stale",
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        redirectUri: "https://app.clueless-creations.com/auth/github/callback",
        fetchImpl: async () =>
          new Response(JSON.stringify({ error: "bad_verification_code" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      }),
    (error: unknown) => error instanceof GitHubAuthError && error.reason === "expired_code",
  );
});

test("fetchGitHubIdentity uses numeric id as subject and requires primary verified email", async () => {
  const identity = await fetchGitHubIdentity({
    accessToken: "token",
    fetchImpl: async (input) => {
      const url = String(input);
      if (url.endsWith("/user")) {
        return new Response(JSON.stringify({ id: 4242, login: "octo", name: "Octo Cat", email: null }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url.endsWith("/user/emails")) {
        return new Response(
          JSON.stringify([
            { email: "hidden@users.noreply.github.com", primary: false, verified: true },
            { email: "octo@example.com", primary: true, verified: true },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response("not found", { status: 404 });
    },
  });
  assert.equal(identity.subject, "4242");
  assert.equal(identity.email, "octo@example.com");
  assert.equal(identity.emailVerified, true);
});

test("fetchGitHubIdentity fails closed without a verified primary email", async () => {
  await assert.rejects(
    () =>
      fetchGitHubIdentity({
        accessToken: "token",
        fetchImpl: async (input) => {
          const url = String(input);
          if (url.endsWith("/user")) {
            return new Response(JSON.stringify({ id: 7, login: "x" }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }
          return new Response(JSON.stringify([{ email: "x@example.com", primary: true, verified: false }]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        },
      }),
    (error: unknown) => error instanceof GitHubAuthError && error.reason === "email_unverified",
  );
});
