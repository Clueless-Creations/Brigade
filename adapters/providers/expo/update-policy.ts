/**
 * Pure EAS Update eligibility (#85).
 *
 * Classifies whether a source delta is JS/assets-only versus a native/SDK/plugin change.
 * Eligible updates are never auto-published. `eas.update` stays labeled-unavailable in argv;
 * this module does not spawn. Runtime string equality is not compatibility proof when the
 * native fingerprint moved. Matching appVersion alone never overrides a fingerprint refuse.
 * Channel/environment/source drift after approval is stale. Production channel ops are hard-held.
 *
 * Hosting (#86) is not owned here.
 */

import { fingerprintEasRoots } from "./identity.js";

export const EXPO_OTA_NATIVE_SOURCE_ROOTS = [
  "package.json",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lock",
  "bun.lockb",
  "app.json",
  "app.config.js",
  "app.config.ts",
  "app.config.mjs",
  "eas.json",
  "plugins",
  "native",
  "ios",
  "android",
  "metro.config.js",
  "babel.config.js",
] as const; // Already hashed as EAS upload inputs in identity.ts. A bundler-config delta is native, not js-assets-only.

export const EXPO_OTA_JS_SOURCE_ROOTS = [
  "app",
  "apps",
  "src",
  "lib",
  "App.tsx",
  "App.ts",
  "App.jsx",
  "App.js",
  "index.ts",
  "index.js",
  "assets",
] as const;

export type ExpoUpdateHoldReason =
  | "unselected"
  | "native-or-sdk-change"
  | "runtime-mismatch"
  | "stale-approval"
  | "publish-unavailable"
  | "production-channel-hard-held";

export type ExpoUpdateEligibility =
  | { readonly eligible: true; readonly reason: "js-assets-only"; readonly autoPublish: false }
  | { readonly eligible: false; readonly reason: ExpoUpdateHoldReason; readonly autoPublish: false };

export function fingerprintExpoNativeInputs(cwd: string): string {
  return fingerprintEasRoots(cwd, EXPO_OTA_NATIVE_SOURCE_ROOTS);
}

export function fingerprintExpoJsInputs(cwd: string): string {
  return fingerprintEasRoots(cwd, EXPO_OTA_JS_SOURCE_ROOTS);
}

function isProductionScope(channel?: string, environment?: string): boolean {
  const c = (channel ?? "").trim().toLowerCase();
  const e = (environment ?? "").trim().toLowerCase();
  return c === "production" || c === "prod" || e === "production" || e === "prod";
}

/**
 * Assess OTA eligibility. Optional appVersion fields are informational only —
 * matching appVersion never clears a native fingerprint refuse (E2 honesty).
 */
export function assessExpoUpdateEligibility(input: {
  readonly selected: boolean;
  readonly nativeFingerprintOnBinary: string;
  readonly currentNativeFingerprint: string;
  readonly runtimeOnBinary?: string;
  readonly currentRuntimeVersion?: string;
  /** User-visible app version on the binary — not a compatibility substitute. */
  readonly appVersionOnBinary?: string;
  readonly currentAppVersion?: string;
  readonly approvedChannel?: string;
  readonly requestChannel?: string;
  readonly approvedEnvironment?: string;
  readonly requestEnvironment?: string;
  readonly approvedSourceFingerprint?: string;
  readonly requestSourceFingerprint?: string;
}): ExpoUpdateEligibility {
  const denied = (reason: ExpoUpdateHoldReason): ExpoUpdateEligibility => ({ eligible: false, reason, autoPublish: false });
  if (!input.selected) return denied("unselected");
  if (isProductionScope(input.requestChannel, input.requestEnvironment)) {
    return denied("production-channel-hard-held");
  }
  if (input.approvedChannel && input.requestChannel && input.approvedChannel !== input.requestChannel) {
    return denied("stale-approval");
  }
  if (input.approvedEnvironment && input.requestEnvironment && input.approvedEnvironment !== input.requestEnvironment) {
    return denied("stale-approval");
  }
  if (
    input.approvedSourceFingerprint &&
    input.requestSourceFingerprint &&
    input.approvedSourceFingerprint !== input.requestSourceFingerprint
  ) {
    return denied("stale-approval");
  }
  // Fingerprint gate runs before runtime/appVersion. Matching runtime or appVersion
  // strings do not override a moved native fingerprint.
  if (input.nativeFingerprintOnBinary !== input.currentNativeFingerprint) {
    return denied("native-or-sdk-change");
  }
  if (
    input.runtimeOnBinary !== undefined &&
    input.currentRuntimeVersion !== undefined &&
    input.runtimeOnBinary !== input.currentRuntimeVersion
  ) {
    return denied("runtime-mismatch");
  }
  // appVersionOnBinary / currentAppVersion are intentionally unused for eligibility —
  // they must not create a false-compatible path when fingerprints already matched.
  void input.appVersionOnBinary;
  void input.currentAppVersion;
  return { eligible: true, reason: "js-assets-only", autoPublish: false };
}
