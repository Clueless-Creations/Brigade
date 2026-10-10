/**
 * Organization calls require a pinned Stripe version and an explicit account context.
 * Account restricted keys keep their existing optional-context contract.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { STRIPE_API_VERSION, stripeApiRequest } from "../billing/stripe.js";

function capturingFetch(seen: Headers[]): typeof fetch {
  return (async (_input: string | URL | Request, init?: RequestInit) => {
    seen.push(new Headers(init?.headers));
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
}

test("every Stripe request pins the API version and names the account when one is configured", async () => {
  const seen: Headers[] = [];
  await stripeApiRequest("/v1/prices?limit=1", { method: "GET", secretKey: "rk_test_headers", accountId: "acct_123", fetchImpl: capturingFetch(seen) });
  assert.equal(seen[0]?.get("Stripe-Version"), STRIPE_API_VERSION);
  assert.equal(seen[0]?.get("Stripe-Context"), "acct_123");
});

test("without a configured account the context header is absent and the version is still pinned", async () => {
  const seen: Headers[] = [];
  await stripeApiRequest("/v1/prices?limit=1", { method: "GET", secretKey: "rk_test_headers", fetchImpl: capturingFetch(seen) });
  assert.equal(seen[0]?.get("Stripe-Version"), STRIPE_API_VERSION);
  assert.equal(seen[0]?.get("Stripe-Context"), null);
});

test("organization keys use the explicitly configured account context and pinned API version", async () => {
  const seen: Headers[] = [];
  await stripeApiRequest("/v1/prices?limit=1", { method: "GET", secretKey: "sk_org_fixture", accountId: "acct_fixture", fetchImpl: capturingFetch(seen) });
  assert.equal(seen[0]?.get("Stripe-Version"), STRIPE_API_VERSION);
  assert.equal(seen[0]?.get("Stripe-Context"), "acct_fixture");
  assert.equal(seen.length, 1);
});

test("organization keys without a valid explicit account context never reach the provider", async () => {
  for (const accountId of [undefined, "", " ", "org_fixture", "acct_fixture\nInjected: true"]) {
    const seen: Headers[] = [];
    await assert.rejects(
      stripeApiRequest("/v1/prices?limit=1", { method: "GET", secretKey: "sk_org_fixture", accountId, fetchImpl: capturingFetch(seen) }),
      /account context/,
    );
    assert.equal(seen.length, 0);
  }
});

test("standard account secret keys remain refused even with account context", async () => {
  for (const secretKey of ["sk_live_fixture", "sk_test_fixture", "pk_test_fixture", "invalid_fixture"]) {
    const seen: Headers[] = [];
    await assert.rejects(stripeApiRequest("/v1/prices?limit=1", { method: "GET", secretKey, accountId: "acct_fixture", fetchImpl: capturingFetch(seen) }));
    assert.equal(seen.length, 0);
  }
});
