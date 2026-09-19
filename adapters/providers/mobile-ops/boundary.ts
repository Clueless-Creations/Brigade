/**
 * Mobile-ops adapter-boundary guards (#115 / ADR-0013).
 *
 * Core workflows, recipes, kernel, and evidence semantics depend on
 * `b2c/mobile-app-operation.*` and selected bindings. Host-native simctl
 * command construction, MobAI CLI argv envelopes, and Expo MCP tool names
 * terminate at adapters/mobile-operation-host.ts, adapters/device-proof.ts,
 * and adapters/providers/expo/ — not in typed workflow/kernel contracts.
 *
 * Instruction prose may cite providers for founder-facing clarity where
 * already authorized. Typed contracts and executable branching must not
 * import provider-native command construction outside adapter owners.
 *
 * Host-native remains usable alone. MobAI stays DeviceProofAdapter. Expo MCP
 * (#87) stays fake-schema / live-held — no duplicate MOT. No second device
 * router. Does not start #116.
 */

import {
  MOBILE_OPS_LOGICAL_SEAMS,
  MOBILE_OPS_CANONICAL_MAP_PATH,
  MOBAI_CLI_REVIEWED_VERSION,
  EXPO_MCP_SCHEMA_PIN,
  type MobileOpsSeamRole,
} from "../../../catalog/providers/mobile-ops-canonical-map.js";

/** Module path prefixes that may own provider-native mobile tool types/commands. */
export const MOBILE_OPS_NATIVE_TYPE_OWNERS = [
  "adapters/mobile-operation.ts",
  "adapters/mobile-operation-host.ts",
  "adapters/device-proof.ts",
  "adapters/ios-app-evidence.ts",
  "adapters/providers/expo/",
  "adapters/providers/mobile-ops/",
  "checks/verification/fixtures/",
  "checks/verification/scenarios/",
  "checks/verification/rehearsal/",
  "checks/verification/test/",
  "catalog/providers/",
  "catalog/firstparty-declarations.ts",
  "catalog/stacks/expo-",
  "kernel/engine/proof-rung.ts",
  "kernel/session/proof.ts",
] as const;

/**
 * Consumer surfaces that must not import provider-native command construction
 * as typed branching. Selected-provider instruction strings remain allowed in
 * workflow prose.
 */
export const MOBILE_OPS_TYPED_CONTRACT_CONSUMERS = ["catalog/workflows/", "contracts/", "entrypoints/"] as const;

export function mobileOpsSeamOwner(role: MobileOpsSeamRole): string {
  const seam = MOBILE_OPS_LOGICAL_SEAMS.find((entry) => entry.role === role);
  if (!seam) throw new Error(`unknown mobile-ops seam role: ${role}`);
  return seam.owner;
}

export function pathMayOwnMobileOpsNativeTypes(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/");
  return MOBILE_OPS_NATIVE_TYPE_OWNERS.some(
    (prefix) => normalized === prefix || normalized.startsWith(prefix) || (prefix.endsWith(".ts") && normalized === prefix),
  );
}

export function pathIsTypedMobileOpsConsumer(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/");
  return MOBILE_OPS_TYPED_CONTRACT_CONSUMERS.some((prefix) => normalized.startsWith(prefix));
}

/**
 * Symbols that indicate provider-native tool-command leakage into consumer
 * TypeScript (typed branching / argv construction). Adapter-local use is fine;
 * workflow/contract/entrypoint imports are boundary smells.
 *
 * Note: instruction *string* prose citing "MobAI" or "simctl" is allowed;
 * this list targets executable code patterns (spawn argv, CLI enums).
 */
export const MOBILE_OPS_NATIVE_LEAK_SYMBOLS = [
  '["simctl"',
  '["simctl",',
  '"simctl", "launch"',
  '"simctl", "io"',
  'spawn("mobai"',
  'spawn("xcrun"',
  "mobai bridge start",
  "createMobaiCliAdapter as MobileOperationTransport",
  "MobileOperationTransport = createMobai",
] as const;

export function sourceImportsMobileOpsNativeLeak(source: string): readonly string[] {
  return MOBILE_OPS_NATIVE_LEAK_SYMBOLS.filter((symbol) => source.includes(symbol));
}

export function reviewedMobaiCliVersion(): typeof MOBAI_CLI_REVIEWED_VERSION {
  return MOBAI_CLI_REVIEWED_VERSION;
}

export function reviewedExpoMcpSchemaPin(): typeof EXPO_MCP_SCHEMA_PIN {
  return EXPO_MCP_SCHEMA_PIN;
}

export function mobileOpsCanonicalMapModulePath(): typeof MOBILE_OPS_CANONICAL_MAP_PATH {
  return MOBILE_OPS_CANONICAL_MAP_PATH;
}

/**
 * Host-native alone: when host covers the request, Expo/MobAI must not be
 * required. Package presence / optional MCP selection alone never disables
 * host-native.
 */
export function hostNativeAloneBlocked(input: { readonly hostNativeCoversRequest: boolean; readonly requireExpo: boolean; readonly requireMobai: boolean }): {
  readonly blocked: boolean;
  readonly reason: string;
} {
  if (!input.hostNativeCoversRequest) {
    return { blocked: false, reason: "host-native-insufficient-ok-to-select-other" };
  }
  if (input.requireExpo || input.requireMobai) {
    return {
      blocked: true,
      reason: input.requireExpo ? "must-not-require-expo-when-host-covers" : "must-not-require-mobai-when-host-covers",
    };
  }
  return { blocked: false, reason: "host-native-alone-ok" };
}

/**
 * Count createMobileOperationRoute transport bind sites that look like a
 * second device router factory. Allowed: adapters/mobile-operation.ts definition
 * + re-export + conformance/scenario/fixture consumers. Forbidden: a second
 * factory that binds multiple transports into a parallel registry.
 */
export function looksLikeSecondDeviceRouterFactory(source: string): boolean {
  const definesParallel = /createSecondDeviceRouter|createMobileDeviceRouter|new DeviceOperationRouter|createParallelMobileRoute/.test(source);
  return definesParallel;
}
