/**
 * Superwall → canonical-operation inventory + classification (#114).
 *
 * Proving-provider map for ADR-0013 on paywall presentation / configuration /
 * observation where semantics match. Superwall-native SDK concepts terminate at
 * the adapter/extension boundary. Generic onboarding/paywall workflows depend
 * on canonical monetization operations and selected bindings (#107), not
 * Superwall placement names, campaign lifecycle types, or SDK envelopes.
 *
 * Presentation ≠ purchase ≠ entitlement. Superwall may present/assign when
 * selected. Purchase execution and entitlement truth stay with RevenueCat /
 * native store owners (#79 / #101–#104). A Superwall purchase callback never
 * grants access. Restore ≠ entitlement.
 *
 * Independent contract pin: Superwall-iOS **4.16.3**
 * (`a9990308209c27de2f3c74e666774f121149678e`). Fake/local SDK responses are
 * wiring only — never the contract source.
 *
 * Consumes landed surfaces: firstparty present-only impl, examples/extensions/
 * superwall-ios, adapters/providers/superwall/measurement.ts,
 * superwall-sdk-conformance fixtures. Does not replace #67/#107 or RC owners.
 * Does not start #115–#116. Does not merge Superwall+RevenueCat into a generic
 * billing provider. Unselected Superwall must not impose.
 *
 * Catalog/upstream declare-or-hold: declarative `catalog/providers/superwall.yaml`
 * and `catalog/upstreams/superwall*` are **held** this slice (see inventory).
 * Kind `billing` would conflate presentation with RC entitlement/purchase;
 * there is no managed CLI/API transport to pin like RC CLI / ASC.
 */

export const SUPERWALL_IOS_REVIEWED_VERSION = "4.16.3" as const;
export const SUPERWALL_IOS_REVIEWED_REVISION = "a9990308209c27de2f3c74e666774f121149678e" as const;
export const SUPERWALL_CANONICAL_MAP_PATH = "catalog/providers/superwall-canonical-map.ts" as const;
export const SUPERWALL_CANONICAL_INVENTORY_DOC = "checks/verification/rehearsal/superwall-canonical-inventory.md" as const;

/** Independent conformance fixture suite (already on main; consume). */
export const SUPERWALL_SDK_CONFORMANCE_FIXTURE = "checks/verification/fixtures/superwall-sdk-conformance.fixtures.ts" as const;

export const SUPERWALL_EVIDENCE_CLASSES = ["fixture", "fake-local-wiring", "sandbox-held", "native-device-held", "production-campaign-held"] as const;
export type SuperwallEvidenceClass = (typeof SUPERWALL_EVIDENCE_CLASSES)[number];

export const SUPERWALL_EFFECT_CLASSES = ["read", "present", "observe", "delegate", "publish", "credential", "analytics"] as const;
export type SuperwallEffectClass = (typeof SUPERWALL_EFFECT_CLASSES)[number];

/**
 * Authority posture. `--yes` / noninteractive never promote a row out of
 * founder-protected or rejected.
 */
export const SUPERWALL_AUTHORITY_CLASSES = ["observe", "selected-binding", "founder-protected", "rejected", "unselected-idle"] as const;
export type SuperwallAuthorityClass = (typeof SUPERWALL_AUTHORITY_CLASSES)[number];

export const SUPERWALL_OP_CLASSES = [
  "present-paywall",
  "config-campaign-fetch",
  "triggers-events",
  "experimentation",
  "purchase-delegation",
  "entitlement-observe",
  "campaign-publish",
  "placement-catalog",
  "sw-native-analytics",
  "account-connect",
] as const;
export type SuperwallOpClass = (typeof SUPERWALL_OP_CLASSES)[number];

export const SUPERWALL_SEAM_ROLES = ["definition", "encoder", "transport", "decoder", "reconciler"] as const;
export type SuperwallSeamRole = (typeof SUPERWALL_SEAM_ROLES)[number];

export type SuperwallMappingDisposition = "implement" | "extension" | "defer" | "reject" | "held";

export interface SuperwallCanonicalMapRow {
  readonly id: string;
  readonly opClass: SuperwallOpClass;
  readonly nativeCapability: string;
  readonly canonicalOperation: string | "none";
  readonly implementationPointer: string;
  readonly evidenceClass: SuperwallEvidenceClass;
  readonly effectClass: SuperwallEffectClass;
  readonly authorityClass: SuperwallAuthorityClass;
  readonly disposition: SuperwallMappingDisposition;
  readonly ownerIssue: string;
  readonly residual: boolean;
  readonly notes: string;
}

/**
 * Logical ADR-0013 seams for the Superwall path. Responsibilities — not a
 * mandatory five-class framework and not a generic billing-provider framework.
 */
export const SUPERWALL_LOGICAL_SEAMS: readonly {
  readonly role: SuperwallSeamRole;
  readonly owner: string;
  readonly responsibility: string;
}[] = [
  {
    role: "definition",
    owner: "catalog/firstparty-declarations.ts + superwall-canonical-map.ts + examples/extensions/superwall-ios/",
    responsibility: "Present-only first-party impl; native→canonical map; evidence/authority tags; extension composition",
  },
  {
    role: "encoder",
    owner: "examples/extensions/superwall-ios/native (register placement; PurchaseController host config)",
    responsibility: "Canonical present-paywall → Superwall.shared.register(placement:); never encodes purchase as Superwall.shared.purchase",
  },
  {
    role: "transport",
    owner: "Superwall-iOS SDK 4.16.3 (host-configured; no auto-execution in extension)",
    responsibility: "Host-controlled SDK boundary; local Swift state tests ≠ live transport proof",
  },
  {
    role: "decoder",
    owner: "adapters/providers/superwall/measurement.ts + MonetizationCore/EntitlementState.swift",
    responsibility: "SW exposure + RC amounts → canonical observation; refuses competing authority / bad identity join",
  },
  {
    role: "reconciler",
    owner: "canonical monetization ops + selected bindings (#107); RC entitlement owners (#79/#101–#104)",
    responsibility: "Canonical observations → next canonical ops; no second entitlement store from Superwall callbacks",
  },
] as const;

/**
 * Full inventory: native capability → canonical operation → impl → evidence.
 * Held rows stay held (no live campaign publish / production paywall / account connect).
 */
export const SUPERWALL_CANONICAL_MAP: readonly SuperwallCanonicalMapRow[] = [
  {
    id: "present-register-placement",
    opClass: "present-paywall",
    nativeCapability: "Superwall.shared.register(placement:)",
    canonicalOperation: "b2c/monetization.present-paywall",
    implementationPointer: "catalog/firstparty-declarations.ts (b2c/superwall.present-paywall) + examples/extensions/superwall-ios/",
    evidenceClass: "fixture",
    effectClass: "present",
    authorityClass: "selected-binding",
    disposition: "implement",
    ownerIssue: "#114",
    residual: false,
    notes: "Independent 4.16.3 register docs + conformance fixtures; no live campaign",
  },
  {
    id: "config-campaign-fetch",
    opClass: "config-campaign-fetch",
    nativeCapability: "Superwall config / campaign fetch (SDK dashboard sync)",
    canonicalOperation: "none",
    implementationPointer: "examples/extensions/superwall-ios/ (extension surface only)",
    evidenceClass: "sandbox-held",
    effectClass: "read",
    authorityClass: "observe",
    disposition: "held",
    ownerIssue: "#114",
    residual: true,
    notes: "No reusable canonical config op; hold live fetch; extension may cite for maintainer clarity",
  },
  {
    id: "triggers-events-observe",
    opClass: "triggers-events",
    nativeCapability: "Superwall placement triggers / paywall events",
    canonicalOperation: "none",
    implementationPointer: "adapters/providers/superwall/measurement.ts (exposure assignment only)",
    evidenceClass: "fixture",
    effectClass: "observe",
    authorityClass: "observe",
    disposition: "extension",
    ownerIssue: "#114",
    residual: false,
    notes: "Exposure/assignment observation via measurement; SW-native event catalogs stay extension",
  },
  {
    id: "experimentation-assignment",
    opClass: "experimentation",
    nativeCapability: "Superwall treatment / experiment assignment",
    canonicalOperation: "none",
    implementationPointer: "adapters/providers/superwall/measurement.ts (assignmentOwner=superwall)",
    evidenceClass: "fixture",
    effectClass: "observe",
    authorityClass: "selected-binding",
    disposition: "extension",
    ownerIssue: "#114",
    residual: false,
    notes: "Assignment owner when selected; do not silently expand canonical experiment contracts",
  },
  {
    id: "purchase-delegation-controller",
    opClass: "purchase-delegation",
    nativeCapability: "PurchaseController.purchase(product:) / restorePurchases()",
    canonicalOperation: "none",
    implementationPointer: "examples/extensions/superwall-ios/native/.../RevenueCatController.swift → Purchases.shared",
    evidenceClass: "fixture",
    effectClass: "delegate",
    authorityClass: "selected-binding",
    disposition: "implement",
    ownerIssue: "#114",
    residual: false,
    notes: "Canonical purchase is b2c/monetization.purchase on RC — SW native maps to none on SW first-party; restore ≠ entitlement",
  },
  {
    id: "purchase-canonical-rc",
    opClass: "purchase-delegation",
    nativeCapability: "RevenueCat Purchases.shared.purchase (via PurchaseController)",
    canonicalOperation: "b2c/monetization.purchase",
    implementationPointer: "b2c/revenuecat implementations + RC #79/#101–#104 owners",
    evidenceClass: "fixture",
    effectClass: "delegate",
    authorityClass: "selected-binding",
    disposition: "implement",
    ownerIssue: "#79",
    residual: false,
    notes: "RC remains purchase owner; no Superwall.shared.purchase second path",
  },
  {
    id: "entitlement-observe-rc",
    opClass: "entitlement-observe",
    nativeCapability: "RevenueCat CustomerInfo / entitlements (not Superwall callback)",
    canonicalOperation: "b2c/monetization.read-entitlement",
    implementationPointer: "MonetizationCore/EntitlementState.swift + b2c/revenuecat; measurement refuses competing authority",
    evidenceClass: "fixture",
    effectClass: "observe",
    authorityClass: "selected-binding",
    disposition: "implement",
    ownerIssue: "#101",
    residual: false,
    notes: "Entitlement truth is RC; Superwall callbacks never grant access",
  },
  {
    id: "entitlement-from-superwall-callback",
    opClass: "entitlement-observe",
    nativeCapability: "Copy entitlement from Superwall purchase/restore callback",
    canonicalOperation: "none",
    implementationPointer: "adapters/providers/superwall/fail-safe.ts + measurement.ts",
    evidenceClass: "fixture",
    effectClass: "observe",
    authorityClass: "rejected",
    disposition: "reject",
    ownerIssue: "#114",
    residual: false,
    notes: "Competing authority refused; presentation ≠ purchase ≠ entitlement",
  },
  {
    id: "campaign-publish-edit",
    opClass: "campaign-publish",
    nativeCapability: "Superwall campaign publish / dashboard edit",
    canonicalOperation: "none",
    implementationPointer: "adapters/providers/superwall/fail-safe.ts (founder-protected hold)",
    evidenceClass: "production-campaign-held",
    effectClass: "publish",
    authorityClass: "founder-protected",
    disposition: "held",
    ownerIssue: "#114",
    residual: false,
    notes: "HoE settle: no live campaign publish this slice",
  },
  {
    id: "placement-catalog",
    opClass: "placement-catalog",
    nativeCapability: "Superwall placement name catalogs / dashboard placement list",
    canonicalOperation: "none",
    implementationPointer: "examples/extensions/superwall-ios/ (maintainer prose only)",
    evidenceClass: "sandbox-held",
    effectClass: "read",
    authorityClass: "observe",
    disposition: "defer",
    ownerIssue: "#114",
    residual: true,
    notes: "Provider-specific catalog; do not expand canonical contracts",
  },
  {
    id: "sw-native-analytics",
    opClass: "sw-native-analytics",
    nativeCapability: "Superwall-native analytics / dashboard metrics",
    canonicalOperation: "none",
    implementationPointer: "adapters/providers/superwall/fail-safe.ts (partial analytics hold)",
    evidenceClass: "sandbox-held",
    effectClass: "analytics",
    authorityClass: "observe",
    disposition: "defer",
    ownerIssue: "#114",
    residual: true,
    notes: "Partial analytics fail-safe; no silent canonical expansion",
  },
  {
    id: "account-connect-credentials",
    opClass: "account-connect",
    nativeCapability: "Superwall account connect / API key / production paywall change",
    canonicalOperation: "none",
    implementationPointer: "adapters/providers/superwall/fail-safe.ts",
    evidenceClass: "production-campaign-held",
    effectClass: "credential",
    authorityClass: "founder-protected",
    disposition: "held",
    ownerIssue: "#114",
    residual: false,
    notes: "Hard hold: no account connect / credentials / production paywall",
  },
  {
    id: "unselected-superwall-idle",
    opClass: "present-paywall",
    nativeCapability: "Unselected Superwall requirements / knowledge / validators",
    canonicalOperation: "b2c/monetization.present-paywall",
    implementationPointer: "#107 selected bindings + adapters/providers/superwall/boundary.ts",
    evidenceClass: "fixture",
    effectClass: "present",
    authorityClass: "unselected-idle",
    disposition: "implement",
    ownerIssue: "#107",
    residual: false,
    notes: "When SW unbound, RC/native-only path must not inherit SW placement/campaign assumptions",
  },
] as const satisfies readonly SuperwallCanonicalMapRow[];

export const SUPERWALL_CANONICAL_MAP_REQUIRED_OP_CLASSES = SUPERWALL_OP_CLASSES;

export const SUPERWALL_PROTECTED_EFFECTS: readonly SuperwallEffectClass[] = ["publish", "credential"] as const;

export const SUPERWALL_DISTINCT_EVIDENCE_NOTE = "fixture ≠ fake-local-wiring ≠ sandbox-held ≠ native-device-held ≠ production-campaign-held" as const;

/** Flags that never grant authority (ADR-0013 / KTD-114). */
export const SUPERWALL_NON_AUTHORITY_FLAGS = ["--yes", "--non-interactive", "--noninteractive", "-y"] as const;

/** Explicit holds for declarative catalog seams (E3 declare-or-hold). */
export const SUPERWALL_CATALOG_PROVIDER_YAML_HOLD = {
  path: "catalog/providers/superwall.yaml",
  disposition: "held" as const,
  reason:
    "Honest hold: Superwall is presentation/assignment when selected, not a full billing contract. PROVIDER_CONTRACT_KINDS only offers billing|agent_runtime|store_cli; declaring kind:billing would conflate SW with RevenueCat and violate never-merge-SW+RC. Present-only first-party + extension + 4.16.3 pin already declare the truthful surface without inventing live campaign/API capabilities.",
} as const;

export const SUPERWALL_UPSTREAM_YAML_HOLD = {
  pathPattern: "catalog/upstreams/superwall*",
  disposition: "held" as const,
  reason:
    "Honest hold: no managed CLI/API transport to pin like revenuecat-cli or ASC/rork. SDK pin lives in examples/extensions/superwall-ios/native/Package.resolved + source-registry superwall-purchase-controller-4-16-3. Adding an upstream yaml without a reviewed managed consumption path would invent live capabilities.",
} as const;

export function getSuperwallCanonicalMap(): readonly SuperwallCanonicalMapRow[] {
  return SUPERWALL_CANONICAL_MAP;
}

export function superwallCanonicalMapRow(id: string): SuperwallCanonicalMapRow {
  const row = SUPERWALL_CANONICAL_MAP.find((entry) => entry.id === id);
  if (!row) throw new Error(`unknown Superwall canonical map id: ${id}`);
  return row;
}

export function superwallRowsForOpClass(opClass: SuperwallOpClass): readonly SuperwallCanonicalMapRow[] {
  return SUPERWALL_CANONICAL_MAP.filter((row) => row.opClass === opClass);
}

export function superwallRowsForEvidenceClass(evidenceClass: SuperwallEvidenceClass): readonly SuperwallCanonicalMapRow[] {
  return SUPERWALL_CANONICAL_MAP.filter((row) => row.evidenceClass === evidenceClass);
}

export function superwallProtectedRows(): readonly SuperwallCanonicalMapRow[] {
  return SUPERWALL_CANONICAL_MAP.filter(
    (row) => row.authorityClass === "founder-protected" || row.authorityClass === "rejected" || SUPERWALL_PROTECTED_EFFECTS.includes(row.effectClass),
  );
}

export function superwallNoninteractiveGrantsAuthority(_flags: readonly string[]): false {
  return false;
}

export function superwallFlagLooksNoninteractive(flag: string): boolean {
  const normalized = flag.trim().toLowerCase();
  return (SUPERWALL_NON_AUTHORITY_FLAGS as readonly string[]).includes(normalized);
}

export function superwallEvidenceClassesRemainDistinct(classes: readonly SuperwallEvidenceClass[]): boolean {
  const unique = new Set(classes);
  return unique.size === classes.length && SUPERWALL_EVIDENCE_CLASSES.every((c) => unique.has(c));
}

/** Present-only first-party: purchase/entitlement must not appear as Superwall impls. */
export const SUPERWALL_FIRSTPARTY_PRESENT_ONLY = "b2c/superwall.present-paywall" as const;
export const SUPERWALL_FORBIDDEN_FIRSTPARTY_IDS = ["b2c/superwall.purchase", "b2c/superwall.read-entitlement"] as const;

export function superwallMergesIntoGenericBilling(): false {
  return false;
}
