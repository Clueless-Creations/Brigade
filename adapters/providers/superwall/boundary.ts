/**
 * Superwall adapter-boundary guards (#114 / ADR-0013).
 *
 * Core workflows, recipes, kernel, and evidence semantics depend on canonical
 * monetization operations and selected bindings (#107). Superwall SDK types,
 * placement/event names, campaign lifecycle states, and native envelopes
 * terminate at adapters/providers/superwall + examples/extensions/superwall-ios.
 *
 * Instruction prose may cite Superwall for founder-facing clarity where already
 * authorized. Typed contracts and executable branching must not import
 * Superwall-native response shapes outside adapter/extension owners.
 *
 * Unselected Superwall must not impose requirements or knowledge on a
 * RevenueCat/native-only business. Does not merge SW+RC into a generic billing
 * provider. Does not start #115–#116.
 */

import {
  SUPERWALL_LOGICAL_SEAMS,
  SUPERWALL_CANONICAL_MAP_PATH,
  SUPERWALL_IOS_REVIEWED_VERSION,
  type SuperwallSeamRole,
} from "../../../catalog/providers/superwall-canonical-map.js";

/** Module path prefixes that may own Superwall-native SDK/types. */
export const SUPERWALL_NATIVE_TYPE_OWNERS = [
  "adapters/providers/superwall/",
  "examples/extensions/superwall-ios/",
  "checks/verification/fixtures/",
  "checks/verification/rehearsal/",
  "catalog/providers/",
  "catalog/firstparty-declarations.ts",
] as const;

/**
 * Consumer surfaces that must not import Superwall-native request/response types.
 * Selected-provider instruction strings remain allowed in workflow prose.
 */
export const SUPERWALL_TYPED_CONTRACT_CONSUMERS = ["catalog/workflows/", "kernel/", "contracts/", "entrypoints/"] as const;

export function superwallSeamOwner(role: SuperwallSeamRole): string {
  const seam = SUPERWALL_LOGICAL_SEAMS.find((entry) => entry.role === role);
  if (!seam) throw new Error(`unknown Superwall seam role: ${role}`);
  return seam.owner;
}

export function pathMayOwnSuperwallNativeTypes(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/");
  return SUPERWALL_NATIVE_TYPE_OWNERS.some((prefix) => normalized === prefix || normalized.startsWith(prefix));
}

export function pathIsTypedSuperwallConsumer(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/");
  return SUPERWALL_TYPED_CONTRACT_CONSUMERS.some((prefix) => normalized.startsWith(prefix));
}

/**
 * Symbols that indicate Superwall-native leakage into consumer TypeScript.
 * Adapter/extension-local use is fine; workflow/kernel imports are boundary smells.
 */
export const SUPERWALL_NATIVE_LEAK_SYMBOLS = [
  "PurchaseController",
  "PurchaseResult",
  "RestorationResult",
  "Superwall.shared",
  "register(placement",
  "SuperwallOptions",
  "PaywallInfo",
  "PaywallPresentationHandler",
] as const;

export function sourceImportsSuperwallNativeLeak(source: string): readonly string[] {
  return SUPERWALL_NATIVE_LEAK_SYMBOLS.filter((symbol) => source.includes(symbol));
}

export function reviewedSuperwallIosVersion(): typeof SUPERWALL_IOS_REVIEWED_VERSION {
  return SUPERWALL_IOS_REVIEWED_VERSION;
}

export function superwallCanonicalMapModulePath(): typeof SUPERWALL_CANONICAL_MAP_PATH {
  return SUPERWALL_CANONICAL_MAP_PATH;
}

/**
 * Unselected Superwall must not impose: when present-paywall binding is not
 * b2c/superwall, Superwall knowledge paths / validators / campaign assumptions
 * do not apply. Package presence alone never selects Superwall (#107).
 */
export function unselectedSuperwallImposes(input: {
  readonly presentPaywallProviderId: string | undefined;
  readonly packageMentionsSuperwall: boolean;
  readonly applySuperwallKnowledge: boolean;
  readonly applySuperwallValidators: boolean;
  readonly requireSuperwallPlacement: boolean;
}): { readonly imposes: boolean; readonly reason: string } {
  const selected = input.presentPaywallProviderId === "b2c/superwall";
  if (selected) {
    return { imposes: false, reason: "superwall-selected-binding" };
  }
  if (input.applySuperwallKnowledge || input.applySuperwallValidators || input.requireSuperwallPlacement) {
    return {
      imposes: true,
      reason: input.packageMentionsSuperwall ? "package-presence-must-not-select-superwall" : "unselected-superwall-must-not-impose",
    };
  }
  return { imposes: false, reason: "unselected-idle" };
}
