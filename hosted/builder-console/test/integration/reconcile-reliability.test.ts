import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { reconcileStaleEntitlements } from "../../billing/reconcile.js";
import { AccessError } from "../../../knowledge-mcp/auth.js";
import { ENTITLEMENT_STALENESS_CEILING_MS, tenantDb, type AccountId } from "../../../knowledge-mcp/db/tenant.js";
import { createTestDatabase, type TestDatabase } from "../support/d1.js";

const HOUR = 60 * 60 * 1000;
const KEY = "b2c:read";

async function seed(harness: TestDatabase, name: string, syncedAt: Date) {
  await harness.seedAccount({
    accountId: `account-${name}`,
    userId: `user-${name}`,
    googleSub: `google-${name}`,
    email: `${name}@example.com`,
    stripeCustomerId: `cus_${name}`,
    keyId: `key-${name}`,
    keyDigest: createHash("sha256").update(name).digest("hex"),
    entitled: true,
    entitlementSyncedAt: syncedAt.toISOString(),
  });
  return `account-${name}` as AccountId;
}

function stripe(prices: unknown, subscriptions: unknown): typeof fetch {
  return (async (input) => new Response(JSON.stringify(String(input).includes("/prices?") ? prices : subscriptions))) as typeof fetch;
}

test("refresh begins before expiry, leaving time to retry without changing the access ceiling", async () => {
  const harness = await createTestDatabase();
  try {
    const now = new Date();
    const refreshed = await seed(harness, "early", new Date(now.getTime() - 13 * HOUR));
    const fresh = await seed(harness, "fresh", new Date(now.getTime() - HOUR));
    const tenant = tenantDb(harness.db);
    const failed = await reconcileStaleEntitlements(tenant, {
      secretKey: "rk_test_reliability",
      now,
      fetchImpl: (async () => new Response("unavailable", { status: 503 })) as typeof fetch,
    });
    assert.equal(failed.staleness.failed, 1);
    await tenant.assertEntitled(refreshed, KEY, now.getTime());
    const summary = await reconcileStaleEntitlements(tenant, {
      secretKey: "rk_test_reliability",
      now,
      fetchImpl: stripe({ has_more: false, data: [{ id: "price_fixture" }] }, { has_more: false, data: [{ id: "sub_fixture", status: "active" }] }),
    });
    assert.equal(summary.staleness.scanned, 1);
    assert.equal(summary.staleness.updated, 1);
    assert.equal((await harness.readEntitlement(refreshed, KEY))?.source, "stripe_reconciliation");
    assert.notEqual((await harness.readEntitlement(fresh, KEY))?.source, "stripe_reconciliation");
    await tenant.assertEntitled(refreshed, KEY, now.getTime() + ENTITLEMENT_STALENESS_CEILING_MS);
    await assert.rejects(
      tenant.assertEntitled(refreshed, KEY, now.getTime() + ENTITLEMENT_STALENESS_CEILING_MS + 1),
      (error) => error instanceof AccessError && error.status === 503,
    );
  } finally {
    await harness.dispose();
  }
});

for (const [name, prices, subscriptions] of [
  ["price", { wrong: [] }, { has_more: false, data: [] }],
  ["emptyprice", { has_more: false, data: [{ id: "" }] }, { has_more: false, data: [{ id: "sub_fixture", status: "active" }] }],
  ["subscription", { has_more: false, data: [{ id: "price_fixture" }] }, { has_more: false, data: [{ id: "sub_fixture" }] }],
  ["emptysubscription", { has_more: false, data: [{ id: "price_fixture" }] }, { has_more: false, data: [{ id: "", status: "active" }] }],
  ["status", { has_more: false, data: [{ id: "price_fixture" }] }, { has_more: false, data: [{ id: "sub_fixture", status: "unexpected" }] }],
] as const) {
  test(`invalid ${name} evidence preserves the row without extending access`, async () => {
    const harness = await createTestDatabase();
    try {
      const now = new Date();
      const account = await seed(harness, name, new Date(now.getTime() - 25 * HOUR));
      const before = await harness.readEntitlement(account, KEY);
      const tenant = tenantDb(harness.db);
      const summary = await reconcileStaleEntitlements(tenant, { secretKey: "rk_test_reliability", now, fetchImpl: stripe(prices, subscriptions) });
      assert.equal(summary.staleness.failed, 1);
      assert.equal(summary.staleness.updated, 0);
      assert.deepEqual(summary.staleness.failureReasons, { stripe_invalid_response: 1 });
      assert.deepEqual(await harness.readEntitlement(account, KEY), before);
      await assert.rejects(tenant.assertEntitled(account, KEY, now.getTime()), (error) => error instanceof AccessError && error.status === 503);
    } finally {
      await harness.dispose();
    }
  });
}

test("a valid empty price or subscription list still revokes access", async () => {
  for (const prices of [
    { has_more: false, data: [] },
    { has_more: false, data: [{ id: "price_fixture" }] },
  ]) {
    const harness = await createTestDatabase();
    try {
      const now = new Date();
      const account = await seed(harness, "empty", new Date(now.getTime() - 25 * HOUR));
      const summary = await reconcileStaleEntitlements(tenantDb(harness.db), {
        secretKey: "rk_test_reliability",
        now,
        fetchImpl: stripe(prices, { has_more: false, data: [] }),
      });
      assert.equal(summary.staleness.updated, 1);
      assert.equal((await harness.readEntitlement(account, KEY))?.active, 0);
    } finally {
      await harness.dispose();
    }
  }
});

test("one failed row does not stop other tenants, and failure reasons have bounded categories", async () => {
  const harness = await createTestDatabase();
  try {
    const now = new Date();
    for (const name of ["auth", "limit", "server", "invalid", "transport", "healthy"]) {
      await seed(harness, name, new Date(now.getTime() - 25 * HOUR));
    }
    const fetchImpl = (async (input) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("/prices")) return Response.json({ has_more: false, data: [{ id: "price_fixture" }] });
      const customer = url.searchParams.get("customer");
      if (customer === "cus_transport") throw new Error("private transport detail");
      if (customer === "cus_invalid") return new Response("private malformed JSON");
      const status = customer === "cus_auth" ? 403 : customer === "cus_limit" ? 429 : customer === "cus_server" ? 503 : 200;
      return Response.json({ has_more: false, data: [{ id: "sub_fixture", status: "trialing" }], private: "provider detail" }, { status });
    }) as typeof fetch;
    const summary = await reconcileStaleEntitlements(tenantDb(harness.db), { secretKey: "rk_test_reliability", now, fetchImpl });
    assert.deepEqual(summary.staleness, {
      scanned: 6,
      updated: 1,
      failed: 5,
      failureReasons: { stripe_authentication: 1, stripe_rate_limit: 1, stripe_unavailable: 1, stripe_invalid_response: 1, operation_failed: 1 },
    });
    assert.equal((await harness.readEntitlement("account-healthy", KEY))?.active, 1);
    assert.doesNotMatch(JSON.stringify(summary), /private|provider detail|cus_|account-/);
  } finally {
    await harness.dispose();
  }
});

test("the existing restricted-key refusal is distinguishable without disclosing the key", async () => {
  const harness = await createTestDatabase();
  try {
    const now = new Date();
    const account = await seed(harness, "configuration", new Date(now.getTime() - 25 * HOUR));
    const before = await harness.readEntitlement(account, KEY);
    let fetched = false;
    const summary = await reconcileStaleEntitlements(tenantDb(harness.db), {
      secretKey: "wrong-key-kind-fixture",
      now,
      fetchImpl: (async () => {
        fetched = true;
        throw new Error("must not reach provider");
      }) as typeof fetch,
    });
    assert.equal(fetched, false);
    assert.deepEqual(summary.staleness.failureReasons, { stripe_configuration: 1 });
    assert.equal(summary.staleness.failed, 1);
    assert.deepEqual(await harness.readEntitlement(account, KEY), before);
    assert.doesNotMatch(JSON.stringify(summary), /wrong-key-kind-fixture/);
  } finally {
    await harness.dispose();
  }
});

for (const [name, prices, subscriptions, reason] of [
  ["price-absent", { data: [] }, { data: [], has_more: false }, "stripe_invalid_response"],
  ["price-wrong", { data: [], has_more: "false" }, { data: [], has_more: false }, "stripe_invalid_response"],
  ["price-incomplete", { data: [], has_more: true }, { data: [], has_more: false }, "stripe_incomplete_response"],
  ["price-partial", { data: [{ id: "price_fixture" }], has_more: true }, { data: [], has_more: false }, "stripe_incomplete_response"],
  ["subscription-absent", { data: [{ id: "price_fixture" }], has_more: false }, { data: [] }, "stripe_invalid_response"],
  [
    "subscription-canceled",
    { data: [{ id: "price_fixture" }], has_more: false },
    { data: [{ id: "sub_fixture", status: "canceled" }] },
    "stripe_invalid_response",
  ],
  ["subscription-wrong", { data: [{ id: "price_fixture" }], has_more: false }, { data: [], has_more: "false" }, "stripe_invalid_response"],
  ["subscription-incomplete", { data: [{ id: "price_fixture" }], has_more: false }, { data: [], has_more: true }, "stripe_incomplete_response"],
] as const) {
  test(`uncertain list completeness (${name}) cannot revoke or refresh an entitlement`, async () => {
    const harness = await createTestDatabase();
    try {
      const now = new Date();
      const account = await seed(harness, name.replaceAll("-", ""), new Date(now.getTime() - 25 * HOUR));
      const before = await harness.readEntitlement(account, KEY);
      const tenant = tenantDb(harness.db);
      const summary = await reconcileStaleEntitlements(tenant, { secretKey: "rk_test_reliability", now, fetchImpl: stripe(prices, subscriptions) });
      assert.equal(summary.staleness.failed, 1);
      assert.equal(summary.staleness.updated, 0);
      assert.deepEqual(summary.staleness.failureReasons, { [reason]: 1 });
      assert.deepEqual(await harness.readEntitlement(account, KEY), before);
      await assert.rejects(tenant.assertEntitled(account, KEY, now.getTime()), (error) => error instanceof AccessError && error.status === 503);
    } finally {
      await harness.dispose();
    }
  });
}

test("complete subscription pagination retains an active plan on a later page", async () => {
  const harness = await createTestDatabase();
  try {
    const now = new Date();
    const account = await seed(harness, "paged", new Date(now.getTime() - 25 * HOUR));
    const cursors: (string | null)[] = [];
    const fetchImpl = (async (input) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("/prices")) return Response.json({ data: [{ id: "price_fixture" }], has_more: false });
      const cursor = url.searchParams.get("starting_after");
      cursors.push(cursor);
      return cursor === null
        ? Response.json({ data: [{ id: "sub_canceled", status: "canceled" }], has_more: true })
        : Response.json({ data: [{ id: "sub_active", status: "active" }], has_more: false });
    }) as typeof fetch;
    const summary = await reconcileStaleEntitlements(tenantDb(harness.db), { secretKey: "rk_test_reliability", now, fetchImpl });
    assert.deepEqual(cursors, [null, "sub_canceled"]);
    assert.deepEqual(summary.staleness, { scanned: 1, updated: 1, failed: 0, failureReasons: {} });
    assert.equal((await harness.readEntitlement(account, KEY))?.active, 1);
  } finally {
    await harness.dispose();
  }
});
