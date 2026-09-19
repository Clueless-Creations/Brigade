/**
 * #114 Superwall canonical-operation boundary fixtures.
 *
 * Deterministic only. No live Superwall account, campaign publish, production
 * paywall, or account connect. Fake/local state is wiring — never independent
 * contract source. Fixture pin: Superwall-iOS 4.16.3.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  SUPERWALL_CANONICAL_MAP,
  SUPERWALL_CANONICAL_INVENTORY_DOC,
  SUPERWALL_CANONICAL_MAP_PATH,
  SUPERWALL_CANONICAL_MAP_REQUIRED_OP_CLASSES,
  SUPERWALL_CATALOG_PROVIDER_YAML_HOLD,
  SUPERWALL_DISTINCT_EVIDENCE_NOTE,
  SUPERWALL_EVIDENCE_CLASSES,
  SUPERWALL_FIRSTPARTY_PRESENT_ONLY,
  SUPERWALL_FORBIDDEN_FIRSTPARTY_IDS,
  SUPERWALL_IOS_REVIEWED_REVISION,
  SUPERWALL_IOS_REVIEWED_VERSION,
  SUPERWALL_LOGICAL_SEAMS,
  SUPERWALL_NON_AUTHORITY_FLAGS,
  SUPERWALL_OP_CLASSES,
  SUPERWALL_PROTECTED_EFFECTS,
  SUPERWALL_SDK_CONFORMANCE_FIXTURE,
  SUPERWALL_UPSTREAM_YAML_HOLD,
  getSuperwallCanonicalMap,
  superwallCanonicalMapRow,
  superwallEvidenceClassesRemainDistinct,
  superwallFlagLooksNoninteractive,
  superwallMergesIntoGenericBilling,
  superwallNoninteractiveGrantsAuthority,
  superwallProtectedRows,
  superwallRowsForOpClass,
} from "../../../catalog/providers/superwall-canonical-map.js";
import {
  SUPERWALL_NATIVE_LEAK_SYMBOLS,
  SUPERWALL_TYPED_CONTRACT_CONSUMERS,
  pathIsTypedSuperwallConsumer,
  pathMayOwnSuperwallNativeTypes,
  reviewedSuperwallIosVersion,
  sourceImportsSuperwallNativeLeak,
  superwallCanonicalMapModulePath,
  superwallSeamOwner,
  unselectedSuperwallImposes,
} from "../../../adapters/providers/superwall/boundary.js";
import {
  campaignPublishAllowedByYesFlag,
  classifyCompetingEntitlementAuthority,
  classifyPurchaseDelegationFailure,
  classifySuperwallFailSafe,
  classifyWrongSuperwallTarget,
  restoreImpliesEntitlement,
  targetsMatch,
} from "../../../adapters/providers/superwall/fail-safe.js";
import {
  normalizeSuperwallRevenueCatObservation,
  refuseEntitlementFromSuperwallCallback,
  SUPERWALL_ALLOWED_ENTITLEMENT_AUTHORITY,
} from "../../../adapters/providers/superwall/measurement.js";
import { firstpartyImplementations } from "../../../catalog/firstparty-declarations.js";
import assertStrict from "node:assert/strict";
import { assert, skillRoot, type Harness } from "./_harness.js";

const INVENTORY_DOC = path.join(skillRoot, SUPERWALL_CANONICAL_INVENTORY_DOC);
const CONFORMANCE = path.join(skillRoot, SUPERWALL_SDK_CONFORMANCE_FIXTURE);
const PROVIDERS_DIR = path.join(skillRoot, "catalog/providers");
const UPSTREAMS_DIR = path.join(skillRoot, "catalog/upstreams");

export function register(harness: Harness): void {
  harness.check("superwall-canonical: map covers every required op class with evidence + authority tags", () => {
    assert(getSuperwallCanonicalMap() === SUPERWALL_CANONICAL_MAP, "getter returns authored map");
    assert(superwallCanonicalMapModulePath() === SUPERWALL_CANONICAL_MAP_PATH, "stable map path");
    assert(reviewedSuperwallIosVersion() === "4.16.3", "fixture pin is 4.16.3");
    assert(SUPERWALL_IOS_REVIEWED_VERSION === "4.16.3", "version const");
    assert(SUPERWALL_IOS_REVIEWED_REVISION === "a9990308209c27de2f3c74e666774f121149678e", "revision pin");
    for (const opClass of SUPERWALL_CANONICAL_MAP_REQUIRED_OP_CLASSES) {
      const rows = superwallRowsForOpClass(opClass);
      assert(rows.length >= 1, `op class ${opClass} has at least one row`);
    }
    assert(SUPERWALL_OP_CLASSES.length === 10, "ten op classes");
    for (const row of SUPERWALL_CANONICAL_MAP) {
      assert(row.nativeCapability.length > 0, `${row.id} names a native capability`);
      assert(row.implementationPointer.length > 0, `${row.id} has an implementation pointer`);
      assert(SUPERWALL_EVIDENCE_CLASSES.includes(row.evidenceClass), `${row.id} evidence class`);
      assert(row.authorityClass.length > 0, `${row.id} authority`);
    }
  });

  harness.check("superwall-canonical: campaign publish / credentials / SW entitlement stay protected or rejected", () => {
    const publish = superwallCanonicalMapRow("campaign-publish-edit");
    assert(publish.authorityClass === "founder-protected", "campaign publish founder-protected");
    assert(publish.evidenceClass === "production-campaign-held", "publish not fixture-greenwashed");
    assert(publish.disposition === "held", "publish held");
    const account = superwallCanonicalMapRow("account-connect-credentials");
    assert(account.effectClass === "credential", "credential effect");
    assert(account.authorityClass === "founder-protected", "account founder-protected");
    const entitlementLeak = superwallCanonicalMapRow("entitlement-from-superwall-callback");
    assert(entitlementLeak.disposition === "reject", "SW entitlement callback rejected");
    assert(entitlementLeak.authorityClass === "rejected", "rejected authority");
    const protectedRows = superwallProtectedRows();
    assert(protectedRows.length >= 3, "protected set is non-empty");
    for (const effect of SUPERWALL_PROTECTED_EFFECTS) {
      assert(
        SUPERWALL_CANONICAL_MAP.some((row) => row.effectClass === effect),
        `protected effect ${effect} appears in map`,
      );
    }
  });

  harness.check("superwall-canonical: --yes and noninteractive never grant authority", () => {
    assert(superwallNoninteractiveGrantsAuthority(["--yes"]) === false, "--yes is not authority");
    assert(superwallNoninteractiveGrantsAuthority(["--non-interactive", "--yes"]) === false, "noninteractive is not authority");
    assert(campaignPublishAllowedByYesFlag(["--yes"]) === false, "yes never publishes campaign");
    for (const flag of SUPERWALL_NON_AUTHORITY_FLAGS) {
      assert(superwallFlagLooksNoninteractive(flag), `${flag} recognized`);
    }
    const decision = classifySuperwallFailSafe({
      opClass: "campaign-publish",
      versionDrift: false,
      schemaDrift: false,
      missingPlacementOrConfig: false,
      staleCampaign: false,
      targetMatchesMandate: true,
      offlineOrCacheOnly: false,
      purchaseDelegationFailed: false,
      competingEntitlementAuthority: false,
      partialAnalytics: false,
      superwallSelected: true,
      authorityGranted: false,
      noninteractiveFlags: ["--yes", "--non-interactive"],
    });
    assert(decision.action === "fail-closed", "yes without authority fails closed");
    assert(decision.allowAccessGrant === false, "no access from flags");
    assert(decision.allowCampaignInvent === false, "no campaign invent from flags");
  });

  harness.check("superwall-canonical: evidence classes stay distinct; inventory doc present", () => {
    assert(superwallEvidenceClassesRemainDistinct([...SUPERWALL_EVIDENCE_CLASSES]), "five evidence classes");
    assert(SUPERWALL_DISTINCT_EVIDENCE_NOTE.includes("fixture"), "honesty note names fixture");
    const doc = readFileSync(INVENTORY_DOC, "utf8");
    assert(doc.includes("#114"), "inventory names #114");
    assert(doc.includes("4.16.3"), "inventory pins 4.16.3");
    assert(doc.includes("#115"), "inventory names next sibling without implementing it");
    assert(doc.includes("held"), "inventory documents catalog/upstream holds");
    assert(!doc.includes("live sandbox: yes"), "inventory does not authorize live sandbox");
    assert(doc.includes("Presentation ≠ purchase ≠ entitlement") || doc.includes("presentation ≠ purchase ≠ entitlement"), "split named");
  });

  harness.check("superwall-canonical: independent 4.16.3 provenance; fake ≠ contract", () => {
    const conformance = readFileSync(CONFORMANCE, "utf8");
    assert(conformance.includes("4.16.3"), "conformance pins 4.16.3");
    assert(conformance.includes(SUPERWALL_IOS_REVIEWED_REVISION), "conformance names revision");
    assert(conformance.includes("No live") || conformance.includes("no live"), "conformance denies live purchase/campaign");
    const resolved = JSON.parse(readFileSync(path.join(skillRoot, "examples/extensions/superwall-ios/native/Package.resolved"), "utf8")) as {
      pins: Array<{ identity: string; state: { revision: string; version: string } }>;
    };
    const pin = resolved.pins.find((item) => item.identity === "superwall-ios");
    assert(pin?.state.version === SUPERWALL_IOS_REVIEWED_VERSION, JSON.stringify(pin));
    assert(pin?.state.revision === SUPERWALL_IOS_REVIEWED_REVISION, pin?.state.revision);
  });

  harness.check("superwall-canonical: ADR-0013 logical seams named without a billing framework", () => {
    assert(SUPERWALL_LOGICAL_SEAMS.length === 5, "five logical seams");
    for (const role of ["definition", "encoder", "transport", "decoder", "reconciler"] as const) {
      const owner = superwallSeamOwner(role);
      const lowered = owner.toLowerCase();
      assert(
        lowered.includes("superwall") ||
          lowered.includes("firstparty") ||
          lowered.includes("monetization") ||
          lowered.includes("bindings") ||
          lowered.includes("revenuecat"),
        owner,
      );
    }
    assert(pathMayOwnSuperwallNativeTypes("adapters/providers/superwall/measurement.ts"), "adapter may own native types");
    assert(
      pathMayOwnSuperwallNativeTypes("examples/extensions/superwall-ios/native/Sources/MonetizationNative/RevenueCatController.swift"),
      "extension may own",
    );
    assert(pathIsTypedSuperwallConsumer("catalog/workflows/build-release.ts"), "workflows are typed consumers");
    assert(pathIsTypedSuperwallConsumer("kernel/session/run.ts"), "kernel is typed consumer");
    assert(superwallMergesIntoGenericBilling() === false, "never merge SW+RC into generic billing");
  });

  harness.check("superwall-canonical: typed consumers do not import Superwall-native leak symbols", () => {
    const roots = SUPERWALL_TYPED_CONTRACT_CONSUMERS.map((prefix) => path.join(skillRoot, prefix));
    const offenders: string[] = [];
    for (const root of roots) {
      const walk = (dir: string): void => {
        let dirents;
        try {
          dirents = readdirSync(dir, { withFileTypes: true });
        } catch {
          return;
        }
        for (const name of dirents) {
          const full = path.join(dir, name.name);
          if (name.isDirectory()) {
            if (name.name === "node_modules" || name.name === "generated") continue;
            walk(full);
            continue;
          }
          if (!name.name.endsWith(".ts") && !name.name.endsWith(".js")) continue;
          const rel = path.relative(skillRoot, full).replace(/\\/g, "/");
          if (!pathIsTypedSuperwallConsumer(rel)) continue;
          if (pathMayOwnSuperwallNativeTypes(rel)) continue;
          const source = readFileSync(full, "utf8");
          const leaks = sourceImportsSuperwallNativeLeak(source);
          if (leaks.length > 0) {
            offenders.push(`${rel}: ${leaks.join(",")}`);
          }
        }
      };
      walk(root);
    }
    assert(offenders.length === 0, `Superwall-native leakage: ${offenders.join("; ")}`);
    assert(SUPERWALL_NATIVE_LEAK_SYMBOLS.includes("PurchaseController"), "leak symbol list includes PurchaseController");
  });

  harness.check("superwall-canonical: present-only first-party; no SW purchase/entitlement impl", () => {
    const superwallImpls = firstpartyImplementations.filter((item) => item.provider === "b2c/superwall");
    assert(superwallImpls.length === 1, JSON.stringify(superwallImpls));
    assert(superwallImpls[0]?.id === SUPERWALL_FIRSTPARTY_PRESENT_ONLY, superwallImpls[0]?.id ?? "missing");
    assert(superwallImpls[0]?.operation === "b2c/monetization.present-paywall", superwallImpls[0]?.operation ?? "missing");
    for (const forbidden of SUPERWALL_FORBIDDEN_FIRSTPARTY_IDS) {
      assert(
        firstpartyImplementations.every((item) => item.id !== forbidden),
        `forbidden first-party ${forbidden}`,
      );
    }
    const present = superwallCanonicalMapRow("present-register-placement");
    assert(present.canonicalOperation === "b2c/monetization.present-paywall", "present maps to canonical");
    const purchaseNative = superwallCanonicalMapRow("purchase-delegation-controller");
    assert(purchaseNative.canonicalOperation === "none", "SW PurchaseController → none on SW");
    const purchaseRc = superwallCanonicalMapRow("purchase-canonical-rc");
    assert(purchaseRc.canonicalOperation === "b2c/monetization.purchase", "RC owns purchase");
    assert(purchaseRc.ownerIssue === "#79", "RC purchase owner preserved");
    const entitlement = superwallCanonicalMapRow("entitlement-observe-rc");
    assert(entitlement.canonicalOperation === "b2c/monetization.read-entitlement", "RC owns entitlement");
    assert(entitlement.ownerIssue.includes("#101"), "RC entitlement owner");
  });

  harness.check("superwall-canonical E3: catalog provider yaml + upstream yaml explicitly held", () => {
    assert(SUPERWALL_CATALOG_PROVIDER_YAML_HOLD.disposition === "held", "provider yaml held");
    assert(SUPERWALL_CATALOG_PROVIDER_YAML_HOLD.reason.includes("billing"), "hold explains billing conflation");
    assert(!existsSync(path.join(PROVIDERS_DIR, "superwall.yaml")), "no invented superwall.yaml");
    assert(SUPERWALL_UPSTREAM_YAML_HOLD.disposition === "held", "upstream held");
    const upstreamNames = readdirSync(UPSTREAMS_DIR).filter((name) => name.startsWith("superwall"));
    assert(upstreamNames.length === 0, `no invented upstream: ${upstreamNames.join(",")}`);
    const doc = readFileSync(INVENTORY_DOC, "utf8");
    assert(doc.includes("catalog/providers/superwall.yaml"), "inventory documents provider yaml hold");
    assert(doc.includes("catalog/upstreams/superwall"), "inventory documents upstream hold");
  });

  harness.check("superwall-fail-safe: version/schema drift fail-closed", () => {
    const version = classifySuperwallFailSafe({
      opClass: "present-paywall",
      versionDrift: true,
      schemaDrift: false,
      missingPlacementOrConfig: false,
      staleCampaign: false,
      targetMatchesMandate: true,
      offlineOrCacheOnly: false,
      purchaseDelegationFailed: false,
      competingEntitlementAuthority: false,
      partialAnalytics: false,
      superwallSelected: true,
      authorityGranted: true,
    });
    assert(version.action === "fail-closed", "version drift fail-closed");
    assert(version.allowAccessGrant === false, "no access on drift");
    const schema = classifySuperwallFailSafe({
      opClass: "config-campaign-fetch",
      versionDrift: false,
      schemaDrift: true,
      missingPlacementOrConfig: false,
      staleCampaign: false,
      targetMatchesMandate: true,
      offlineOrCacheOnly: false,
      purchaseDelegationFailed: false,
      competingEntitlementAuthority: false,
      partialAnalytics: false,
      superwallSelected: true,
      authorityGranted: true,
    });
    assert(schema.action === "fail-closed", "schema drift fail-closed");
  });

  harness.check("superwall-fail-safe: missing placement/config and stale campaign", () => {
    const missing = classifySuperwallFailSafe({
      opClass: "present-paywall",
      versionDrift: false,
      schemaDrift: false,
      missingPlacementOrConfig: true,
      staleCampaign: false,
      targetMatchesMandate: true,
      offlineOrCacheOnly: false,
      purchaseDelegationFailed: false,
      competingEntitlementAuthority: false,
      partialAnalytics: false,
      superwallSelected: true,
      authorityGranted: true,
    });
    assert(missing.action === "fail-closed", "missing placement fail-closed");
    assert(missing.allowCampaignInvent === false, "missing does not invent campaign");
    const stale = classifySuperwallFailSafe({
      opClass: "config-campaign-fetch",
      versionDrift: false,
      schemaDrift: false,
      missingPlacementOrConfig: false,
      staleCampaign: true,
      targetMatchesMandate: true,
      offlineOrCacheOnly: false,
      purchaseDelegationFailed: false,
      competingEntitlementAuthority: false,
      partialAnalytics: false,
      superwallSelected: true,
      authorityGranted: true,
    });
    assert(stale.action === "hold-stale", "stale campaign holds");
    assert(stale.allowCampaignInvent === false, "stale does not invent");
  });

  harness.check("superwall-fail-safe: account/project mismatch fail-closed", () => {
    const mandate = { appId: "app-1", superwallProjectId: "proj-1", environment: "sandbox", accountId: "acct-1" };
    assert(targetsMatch(mandate, { ...mandate }) === true, "identical targets match");
    const wrongProject = classifyWrongSuperwallTarget("present-paywall", mandate, { ...mandate, superwallProjectId: "proj-other" });
    assert(wrongProject.action === "fail-closed", "wrong project fails closed");
    assert(wrongProject.allowAccessGrant === false, "wrong project no access");
    const wrongApp = classifyWrongSuperwallTarget("purchase-delegation", mandate, { ...mandate, appId: "app-other" });
    assert(wrongApp.action === "fail-closed", "wrong app fails closed");
    const wrongEnv = classifyWrongSuperwallTarget("entitlement-observe", mandate, { ...mandate, environment: "production" });
    assert(wrongEnv.action === "fail-closed", "wrong env fails closed");
    const wrongAccount = classifyWrongSuperwallTarget("campaign-publish", mandate, { ...mandate, accountId: "acct-other" });
    assert(wrongAccount.action === "fail-closed", "wrong account fails closed");
  });

  harness.check("superwall-fail-safe: offline/cache, delegation failure, partial analytics", () => {
    const offline = classifySuperwallFailSafe({
      opClass: "present-paywall",
      versionDrift: false,
      schemaDrift: false,
      missingPlacementOrConfig: false,
      staleCampaign: false,
      targetMatchesMandate: true,
      offlineOrCacheOnly: true,
      purchaseDelegationFailed: false,
      competingEntitlementAuthority: false,
      partialAnalytics: false,
      superwallSelected: true,
      authorityGranted: true,
    });
    assert(offline.action === "hold-offline", "offline holds");
    assert(offline.allowAccessGrant === false, "offline no access");
    const delegation = classifyPurchaseDelegationFailure();
    assert(delegation.action === "refuse-delegation-failure", "delegation failure refused");
    assert(delegation.allowAccessGrant === false, "delegation failure never grants access");
    const partial = classifySuperwallFailSafe({
      opClass: "sw-native-analytics",
      versionDrift: false,
      schemaDrift: false,
      missingPlacementOrConfig: false,
      staleCampaign: false,
      targetMatchesMandate: true,
      offlineOrCacheOnly: false,
      purchaseDelegationFailed: false,
      competingEntitlementAuthority: false,
      partialAnalytics: true,
      superwallSelected: true,
      authorityGranted: true,
    });
    assert(partial.action === "hold-partial-analytics", "partial analytics holds");
    assert(partial.allowCampaignInvent === false, "partial does not invent campaign");
  });

  harness.check("superwall-fail-safe: competing entitlement authority refused; restore ≠ entitlement", () => {
    const competing = classifyCompetingEntitlementAuthority();
    assert(competing.action === "refuse-competing-authority", "competing authority refused");
    assert(competing.allowAccessGrant === false, "no access from competing authority");
    assert(restoreImpliesEntitlement() === false, "restore does not imply entitlement");
    assert(SUPERWALL_ALLOWED_ENTITLEMENT_AUTHORITY === "revenuecat", "only RC entitlement authority");
    let threw = false;
    try {
      refuseEntitlementFromSuperwallCallback({ source: "superwall-purchase-callback", claimedAccess: true });
    } catch (error) {
      threw = error instanceof Error && error.message === "monetization.competing_authority";
    }
    assert(threw, "callback entitlement refused");
    const from = { appId: "fixture-app", environment: "sandbox", opaqueRef: "anon" };
    const to = { ...from, opaqueRef: "account" };
    assertStrict.throws(
      () =>
        normalizeSuperwallRevenueCatObservation({
          assignmentOwner: "revenuecat" as never,
          entitlementAuthority: "revenuecat",
          exposure: { assignmentId: "a1", subject: from, observedAt: "2026-09-05T00:00:00Z" },
          identifiedSubject: to,
          identityJoin: { from, to, lifecycle: "identified", recordedAt: "2026-09-05T00:00:01Z" },
          amountEvents: [],
        }),
      /competing_authority/,
    );
  });

  harness.check("superwall-canonical E6: unselected Superwall does not impose on RC/native-only path", () => {
    const idle = unselectedSuperwallImposes({
      presentPaywallProviderId: "b2c/revenuecat",
      packageMentionsSuperwall: false,
      applySuperwallKnowledge: false,
      applySuperwallValidators: false,
      requireSuperwallPlacement: false,
    });
    assert(idle.imposes === false, "RC-only idle");
    assert(idle.reason === "unselected-idle", idle.reason);
    const packageOnly = unselectedSuperwallImposes({
      presentPaywallProviderId: "b2c/revenuecat",
      packageMentionsSuperwall: true,
      applySuperwallKnowledge: true,
      applySuperwallValidators: false,
      requireSuperwallPlacement: false,
    });
    assert(packageOnly.imposes === true, "package presence must not select");
    assert(packageOnly.reason.includes("package-presence"), packageOnly.reason);
    const selected = unselectedSuperwallImposes({
      presentPaywallProviderId: "b2c/superwall",
      packageMentionsSuperwall: true,
      applySuperwallKnowledge: true,
      applySuperwallValidators: true,
      requireSuperwallPlacement: true,
    });
    assert(selected.imposes === false, "selected binding may apply SW knowledge");
    const failSafeIdle = classifySuperwallFailSafe({
      opClass: "present-paywall",
      versionDrift: false,
      schemaDrift: false,
      missingPlacementOrConfig: false,
      staleCampaign: false,
      targetMatchesMandate: true,
      offlineOrCacheOnly: false,
      purchaseDelegationFailed: false,
      competingEntitlementAuthority: false,
      partialAnalytics: false,
      superwallSelected: false,
      authorityGranted: false,
    });
    assert(failSafeIdle.action === "idle-unselected", "fail-safe idles when unselected");
    const unselectedRow = superwallCanonicalMapRow("unselected-superwall-idle");
    assert(unselectedRow.authorityClass === "unselected-idle", "map row marks unselected-idle");
    assert(unselectedRow.ownerIssue === "#107", "#107 remains binding owner");
    const controller = readFileSync(
      path.join(skillRoot, "examples/extensions/superwall-ios/native/Sources/MonetizationNative/RevenueCatController.swift"),
      "utf8",
    );
    assert(controller.includes("Purchases.shared.purchase"), "PurchaseController→RC preserved");
    assert(!controller.includes("Superwall.shared.purchase"), "no second StoreKit path");
    const entitlement = readFileSync(path.join(skillRoot, "examples/extensions/superwall-ios/native/Sources/MonetizationCore/EntitlementState.swift"), "utf8");
    assert(entitlement.includes("never grants access"), "restore/callback ≠ entitlement");
  });

  harness.check("superwall-canonical: experimentation/placement/campaign classified extension/defer/held", () => {
    const experiment = superwallCanonicalMapRow("experimentation-assignment");
    assert(experiment.disposition === "extension", "experimentation is extension");
    assert(experiment.canonicalOperation === "none", "no silent canonical experiment op");
    const placement = superwallCanonicalMapRow("placement-catalog");
    assert(placement.disposition === "defer", "placement catalog deferred");
    const analytics = superwallCanonicalMapRow("sw-native-analytics");
    assert(analytics.disposition === "defer", "SW analytics deferred");
    const config = superwallCanonicalMapRow("config-campaign-fetch");
    assert(config.disposition === "held", "config fetch held");
    const publish = superwallCanonicalMapRow("campaign-publish-edit");
    assert(publish.disposition === "held", "campaign publish held");
  });
}
