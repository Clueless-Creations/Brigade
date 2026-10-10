import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test, type TestContext } from "node:test";
import { tenantDb } from "../../../knowledge-mcp/db/tenant.js";
import worker from "../../worker.js";
import { createTestDatabase } from "../support/d1.js";

function memoryKv() {
  const map = new Map<string, string>();
  return {
    get: async (key: string) => map.get(key) ?? null,
    put: async (key: string, value: string) => {
      map.set(key, value);
    },
    map,
  };
}

function observe(t: TestContext) {
  const logs: unknown[][] = [];
  t.mock.method(console, "info", (...args: unknown[]) => {
    logs.push(args);
  });
  t.mock.method(console, "error", (...args: unknown[]) => {
    logs.push(args);
  });
  return logs;
}

async function scheduled(overrides: Record<string, unknown> = {}) {
  const pending: Promise<PromiseSettledResult<unknown>>[] = [];
  const kv = memoryKv();
  await worker.scheduled(
    {} as never,
    {
      CHECKOUT_ENABLED: "on",
      FLAGS_KV: kv,
      POSTHOG_PROJECT_TOKEN: "phc_fixture",
      POSTHOG_HOST: "https://flags.example.com",
      STRIPE_RESTRICTED_KEY: "rk_test_scheduled",
      // Flag-only tests need no tenants; billing tests below supply the migrated D1 fixture.
      DB: { prepare: () => ({ bind: () => ({ all: async () => ({ results: [] }) }) }) },
      ...overrides,
    } as never,
    {
      waitUntil(promise: Promise<unknown>) {
        pending.push(
          promise.then(
            (value) => ({ status: "fulfilled" as const, value }),
            (reason: unknown) => ({ status: "rejected" as const, reason }),
          ),
        );
      },
    } as never,
  );
  return { outcomes: await Promise.all(pending), kv };
}

test("operator-enabled Checkout skips an absent optional flag key explicitly", async (t) => {
  const logs = observe(t);
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("unexpected network call");
  });
  const { outcomes } = await scheduled();
  assert.ok(outcomes.every((outcome) => outcome.status === "fulfilled"));
  assert.match(JSON.stringify(logs), /skipped/);
  assert.match(JSON.stringify(logs), /operator_enabled/);
});

test("flag-controlled Checkout keeps missing configuration visible", async (t) => {
  observe(t);
  for (const mode of [undefined, "off", "ON", "true"]) {
    const { outcomes } = await scheduled({ CHECKOUT_ENABLED: mode });
    assert.equal(outcomes.filter((outcome) => outcome.status === "rejected").length, 1);
  }
});

test("a configured flag refresher still runs in operator mode and persists definitions", async (t) => {
  observe(t);
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls += 1;
    return new Response(JSON.stringify({ flags: [], group_type_mapping: {}, cohorts: {} }));
  });
  const { outcomes, kv } = await scheduled({ POSTHOG_FEATURE_FLAGS_SECURE_KEY: "fixture_flags_key" });
  assert.ok(outcomes.every((outcome) => outcome.status === "fulfilled"));
  assert.ok(calls > 0);
  assert.ok(kv.map.has("posthog:flags:platform"));
});

test("a failed configured refresh fails the scheduled job even when the SDK swallows HTTP errors", async (t) => {
  const logs = observe(t);
  t.mock.method(globalThis, "fetch", async () => new Response("provider-private-detail", { status: 503 }));
  const { outcomes } = await scheduled({ POSTHOG_FEATURE_FLAGS_SECURE_KEY: "fixture_flags_key" });
  assert.equal(outcomes.filter((outcome) => outcome.status === "rejected").length, 1);
  assert.doesNotMatch(JSON.stringify(logs), /provider-private-detail|fixture_flags_key/);
});

test("a swallowed KV write failure cannot report a successful flag refresh", async (t) => {
  const logs = observe(t);
  t.mock.method(globalThis, "fetch", async () => Response.json({ flags: [] }));
  const { outcomes } = await scheduled({
    POSTHOG_FEATURE_FLAGS_SECURE_KEY: "fixture_flags_key",
    FLAGS_KV: {
      get: async () => null,
      put: async () => {
        throw new Error("private storage detail");
      },
    },
  });
  assert.equal(outcomes.filter((outcome) => outcome.status === "rejected").length, 1);
  assert.doesNotMatch(JSON.stringify(logs), /private storage detail/);
});

test("a failed billing scan rejects with a sanitized diagnostic", async (t) => {
  const logs = observe(t);
  const { outcomes } = await scheduled({
    DB: {
      prepare() {
        throw new Error("private database detail");
      },
    },
  });
  assert.equal(outcomes.filter((outcome) => outcome.status === "rejected").length, 1);
  assert.match(JSON.stringify(logs), /sweep_failed/);
  assert.doesNotMatch(JSON.stringify(logs), /private database detail/);
});

test("a missing database binding fails billing without preventing a configured flag refresh", async (t) => {
  const logs = observe(t);
  t.mock.method(globalThis, "fetch", async () => Response.json({ flags: [] }));
  const { outcomes, kv } = await scheduled({ DB: undefined, POSTHOG_FEATURE_FLAGS_SECURE_KEY: "fixture_flags_key" });
  assert.equal(outcomes.filter((outcome) => outcome.status === "rejected").length, 1);
  assert.ok(kv.map.has("posthog:flags:platform"));
  assert.match(JSON.stringify(logs), /scheduled_entitlement_reconciliation.*missing_configuration/);
});

test("scheduled billing failures stay visible while healthy rows reconcile and raw provider details stay private", async (t) => {
  const logs = observe(t);
  const harness = await createTestDatabase();
  try {
    const old = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    for (const name of ["broken", "healthy"])
      await harness.seedAccount({
        accountId: `account-${name}`,
        userId: `user-${name}`,
        googleSub: `google-${name}`,
        email: `${name}@example.com`,
        stripeCustomerId: `cus_${name}`,
        keyId: `key-${name}`,
        keyDigest: createHash("sha256").update(name).digest("hex"),
        entitled: true,
        entitlementSyncedAt: old,
      });
    t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
      const url = new URL(String(input));
      if (url.pathname === "/flags/definitions") return Response.json({ flags: [] });
      if (url.pathname.endsWith("/prices")) return Response.json({ data: [{ id: "price_fixture" }] });
      if (url.searchParams.get("customer") === "cus_broken")
        return Response.json({ error: { message: "provider-private-detail", customer: "cus_broken" } }, { status: 403 });
      return Response.json({ data: [{ id: "sub_fixture", status: "active" }] });
    });
    const { outcomes } = await scheduled({ DB: harness.db, POSTHOG_FEATURE_FLAGS_SECURE_KEY: "fixture_flags_key" });
    assert.equal(outcomes.filter((outcome) => outcome.status === "rejected").length, 1);
    assert.equal((await harness.readEntitlement("account-healthy", "b2c:read"))?.source, "stripe_reconciliation");
    assert.equal((await tenantDb(harness.db).listStaleEntitlements(new Date())).find((row) => row.accountId === "account-broken")?.syncedAt, old);
    assert.match(JSON.stringify(logs), /stripe_authentication/);
    assert.doesNotMatch(JSON.stringify(logs), /provider-private-detail|cus_broken|account-broken|rk_test_scheduled/);
  } finally {
    await harness.dispose();
  }
});

test("scheduled reconciliation refreshes a stale entitlement through an organization key with explicit account context", async (t) => {
  const logs = observe(t);
  const harness = await createTestDatabase();
  try {
    const old = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    await harness.seedAccount({
      accountId: "account-org",
      userId: "user-org",
      googleSub: "google-org",
      email: "org@example.com",
      stripeCustomerId: "cus_orgfixture",
      keyId: "key-org",
      keyDigest: createHash("sha256").update("org").digest("hex"),
      entitled: true,
      entitlementSyncedAt: old,
    });
    const contexts: (string | null)[] = [];
    t.mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
      contexts.push(new Headers(init?.headers).get("Stripe-Context"));
      return new URL(String(input)).pathname.endsWith("/prices")
        ? Response.json({ data: [{ id: "price_fixture" }] })
        : Response.json({ data: [{ id: "sub_fixture", status: "active" }] });
    });
    const { outcomes } = await scheduled({ DB: harness.db, STRIPE_RESTRICTED_KEY: "sk_org_fixture", STRIPE_ACCOUNT_ID: "acct_fixture" });
    assert.ok(outcomes.every((outcome) => outcome.status === "fulfilled"));
    assert.deepEqual(contexts, ["acct_fixture", "acct_fixture"]);
    assert.equal((await harness.readEntitlement("account-org", "b2c:read"))?.source, "stripe_reconciliation");
    assert.match(JSON.stringify(logs), /completed/);
    assert.doesNotMatch(JSON.stringify(logs), /sk_org_fixture|acct_fixture|cus_orgfixture/);
  } finally {
    await harness.dispose();
  }
});
