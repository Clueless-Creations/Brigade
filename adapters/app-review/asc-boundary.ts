/**
 * ASC adapter-boundary guards (#113 / ADR-0013).
 *
 * Core workflows, recipes, kernel, and evidence semantics depend on canonical
 * store operations. ASC command names, flags, REST/CLI envelopes, pagination
 * tokens, and provider-native lifecycle states terminate at this adapter.
 *
 * Instruction prose in catalog workflows may cite ASC cookbook forms for
 * founder-facing clarity (already authorized). Typed contracts and executable
 * branching must not import ASC-native response shapes outside adapters/app-review.
 *
 * Logical seams (definition/encoder/transport/decoder/reconciler) live in
 * catalog/providers/apple-asc-canonical-map.ts — not a generic multi-store CLI
 * framework.
 */

import {
  ASC_LOGICAL_SEAMS,
  APPLE_ASC_CANONICAL_MAP_PATH,
  ASC_CLI_REVIEWED_VERSION,
  type AscSeamRole,
} from "../../catalog/providers/apple-asc-canonical-map.js";

/** Module path prefixes that may own ASC-native argv/envelope types. */
export const ASC_NATIVE_TYPE_OWNERS = [
  "adapters/app-review/",
  "checks/verification/fixtures/",
  "checks/verification/test/data/asc-cli/",
  "checks/validation/business/store/",
  "catalog/providers/",
] as const;

/**
 * Consumer surfaces that must not import ASC-native request/response types.
 * Selected-provider instruction strings remain allowed in workflow prose.
 */
export const ASC_TYPED_CONTRACT_CONSUMERS = ["catalog/workflows/", "kernel/", "contracts/", "entrypoints/"] as const;

export function ascSeamOwner(role: AscSeamRole): string {
  const seam = ASC_LOGICAL_SEAMS.find((entry) => entry.role === role);
  if (!seam) throw new Error(`unknown ASC seam role: ${role}`);
  return seam.owner;
}

export function pathMayOwnAscNativeTypes(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/");
  return ASC_NATIVE_TYPE_OWNERS.some((prefix) => normalized.startsWith(prefix));
}

export function pathIsTypedAscConsumer(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/");
  return ASC_TYPED_CONTRACT_CONSUMERS.some((prefix) => normalized.startsWith(prefix));
}

/**
 * Symbols that indicate ASC-native envelope leakage into consumer TypeScript.
 * Adapter-local use is fine; workflow/kernel imports of these are boundary smells.
 */
export const ASC_NATIVE_LEAK_SYMBOLS = [
  "reviewStatusResult",
  "reviewSubmitResult",
  "PushPlanResult",
  "ValidateResult",
  "ScreenshotSizesResult",
  "AppScreenshotUploadResult",
  "screenshotValidateResult",
  "screenshotDownloadResult",
  "AscCommandRunner",
  "spawnAscCommand",
] as const;

export function sourceImportsAscNativeLeak(source: string): readonly string[] {
  return ASC_NATIVE_LEAK_SYMBOLS.filter((symbol) => {
    const importPattern = new RegExp(`\\b${symbol}\\b`);
    return importPattern.test(source);
  });
}

export function reviewedAscCliVersion(): typeof ASC_CLI_REVIEWED_VERSION {
  return ASC_CLI_REVIEWED_VERSION;
}

export function canonicalMapModulePath(): typeof APPLE_ASC_CANONICAL_MAP_PATH {
  return APPLE_ASC_CANONICAL_MAP_PATH;
}
