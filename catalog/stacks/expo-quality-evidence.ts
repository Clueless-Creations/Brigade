/**
 * Cross-platform quality evidence models (#88).
 *
 * Per-platform / per-level contracts. jest-expo mocks ≠ native. Web export ≠
 * Android/iOS. Accessibility/navigation ≠ screenshot parity. Shared source ≠
 * platform parity. Live simulator/device/browser rows remain holds unless
 * separately authorized.
 */
export const EXPO_QUALITY_EVIDENCE_PATH = "catalog/stacks/expo-quality-evidence.ts" as const;

export type ExpoQualityPlatform = "ios" | "android" | "web" | "host";

export type ExpoQualityLevel =
  "static-unit-contract" | "component-router" | "simulator-emulator-e2e" | "physical-device" | "browser-exported-web" | "authorized-cloud-readback";

export type ExpoQualityClaimKind =
  | "jest-expo-mock"
  | "web-export"
  | "ios-capture"
  | "android-capture"
  | "screenshot-count"
  | "a11y-navigation"
  | "release-like-offline"
  | "purchase-restore"
  | "stale-binary";

export interface ExpoQualityEvidenceIdentity {
  readonly platform: ExpoQualityPlatform;
  readonly level: ExpoQualityLevel;
  readonly sourceRevision?: string;
  readonly sdkPin?: string;
  readonly buildId?: string;
  readonly updateId?: string;
  readonly reviewCriteriaId?: string;
}

export interface ExpoQualityClaimInput {
  readonly claimedPlatform: ExpoQualityPlatform;
  readonly requiredPlatform: ExpoQualityPlatform;
  readonly claimKind: ExpoQualityClaimKind;
  readonly evidenceLevel: ExpoQualityLevel;
  readonly identity?: ExpoQualityEvidenceIdentity;
  readonly priorIdentity?: ExpoQualityEvidenceIdentity;
}

export interface ExpoQualityClaimResult {
  readonly accepted: boolean;
  readonly refuseReason:
    | "mock-not-native"
    | "web-not-android"
    | "web-not-ios"
    | "ios-not-android"
    | "android-not-ios"
    | "screenshot-not-a11y"
    | "level-insufficient"
    | "stale-proof-invalidated"
    | "release-like-held"
    | "cross-platform-mismatch"
    | null;
  readonly notes: string;
  readonly liveHeld: boolean;
}

export const EXPO_QUALITY_LEVEL_CAN_PROVE: Readonly<Record<ExpoQualityLevel, string>> = {
  "static-unit-contract": "Synthetic and builder-offline behavior",
  "component-router": "In-process UI contracts",
  "simulator-emulator-e2e": "Installed custom-dev or release-like build on that OS",
  "physical-device": "Hardware, permission, background, store-sandbox claims",
  "browser-exported-web": "Production web output",
  "authorized-cloud-readback": "Named job or account observation",
};

export const EXPO_QUALITY_LEVEL_CANNOT_PROVE: Readonly<Record<ExpoQualityLevel, string>> = {
  "static-unit-contract": "Native execution, store, or OTA",
  "component-router": "Release-like binary without Metro",
  "simulator-emulator-e2e": "Physical hardware, store, or production crash",
  "physical-device": "Publication or production users",
  "browser-exported-web": "iOS or Android requirements",
  "authorized-cloud-readback": "A configured SDK with no arrived events",
};

const NATIVE_LEVELS: readonly ExpoQualityLevel[] = ["simulator-emulator-e2e", "physical-device"];

function identitiesDiffer(a: ExpoQualityEvidenceIdentity, b: ExpoQualityEvidenceIdentity): boolean {
  return (
    a.sourceRevision !== b.sourceRevision ||
    a.sdkPin !== b.sdkPin ||
    a.buildId !== b.buildId ||
    a.updateId !== b.updateId ||
    a.reviewCriteriaId !== b.reviewCriteriaId ||
    a.platform !== b.platform ||
    a.level !== b.level
  );
}

export function assessExpoQualityClaim(input: ExpoQualityClaimInput): ExpoQualityClaimResult {
  if (input.claimKind === "jest-expo-mock" && NATIVE_LEVELS.includes(input.evidenceLevel)) {
    return {
      accepted: false,
      refuseReason: "mock-not-native",
      notes: "jest-expo / unit mocks cannot satisfy simulator, device, or native-store acceptance.",
      liveHeld: true,
    };
  }
  if (input.claimKind === "jest-expo-mock" && (input.requiredPlatform === "ios" || input.requiredPlatform === "android")) {
    return {
      accepted: false,
      refuseReason: "mock-not-native",
      notes: "Mock suite success is not native proof for the required platform.",
      liveHeld: true,
    };
  }
  if (input.claimKind === "web-export" && input.requiredPlatform === "android") {
    return {
      accepted: false,
      refuseReason: "web-not-android",
      notes: "Web export cannot silently satisfy an Android requirement.",
      liveHeld: false,
    };
  }
  if (input.claimKind === "web-export" && input.requiredPlatform === "ios") {
    return {
      accepted: false,
      refuseReason: "web-not-ios",
      notes: "Web export cannot silently satisfy an iOS requirement.",
      liveHeld: false,
    };
  }
  if (input.claimKind === "ios-capture" && input.requiredPlatform === "android") {
    return {
      accepted: false,
      refuseReason: "ios-not-android",
      notes: "iOS capture cannot silently satisfy an Android requirement.",
      liveHeld: false,
    };
  }
  if (input.claimKind === "android-capture" && input.requiredPlatform === "ios") {
    return {
      accepted: false,
      refuseReason: "android-not-ios",
      notes: "Android capture cannot silently satisfy an iOS requirement.",
      liveHeld: false,
    };
  }
  if (input.claimedPlatform !== input.requiredPlatform) {
    return {
      accepted: false,
      refuseReason: "cross-platform-mismatch",
      notes: "Shared source does not establish iOS/Android/web parity. Each claimed platform needs relevant evidence.",
      liveHeld: false,
    };
  }
  if (input.claimKind === "screenshot-count" && input.requiredPlatform !== "host") {
    return {
      accepted: false,
      refuseReason: "screenshot-not-a11y",
      notes: "Screenshot-count parity cannot stand in for accessibility or platform navigation assertions.",
      liveHeld: false,
    };
  }
  if (input.claimKind === "a11y-navigation" && input.evidenceLevel === "static-unit-contract") {
    return {
      accepted: false,
      refuseReason: "level-insufficient",
      notes: "Accessibility/navigation needs per-platform assertions beyond static/unit contracts.",
      liveHeld: true,
    };
  }
  if (input.claimKind === "release-like-offline") {
    return {
      accepted: false,
      refuseReason: "release-like-held",
      notes: "Release-like offline-without-Metro requires an installed custom-dev or release-like binary. Live held unless authorized.",
      liveHeld: true,
    };
  }
  if (input.claimKind === "stale-binary" || (input.identity && input.priorIdentity && identitiesDiffer(input.identity, input.priorIdentity))) {
    return {
      accepted: false,
      refuseReason: "stale-proof-invalidated",
      notes: "Changing source, SDK/native runtime, build, update, or review criteria invalidates affected old proof.",
      liveHeld: false,
    };
  }
  if (input.claimKind === "purchase-restore") {
    return {
      accepted: false,
      refuseReason: "level-insufficient",
      notes: "Purchase/restore claims collect #83 models; sandbox authority remains held.",
      liveHeld: true,
    };
  }
  return {
    accepted: true,
    refuseReason: null,
    notes: `Deterministic quality model accepted for ${input.claimedPlatform} at ${input.evidenceLevel}. Live matrix rows remain holds.`,
    liveHeld: NATIVE_LEVELS.includes(input.evidenceLevel) || input.evidenceLevel === "browser-exported-web",
  };
}

export function invalidateExpoQualityProof(
  prior: ExpoQualityEvidenceIdentity,
  next: ExpoQualityEvidenceIdentity,
): { readonly invalidated: boolean; readonly notes: string } {
  if (identitiesDiffer(prior, next)) {
    return {
      invalidated: true,
      notes: "Affected old proof invalidated by source/SDK/build/update/review identity change.",
    };
  }
  return { invalidated: false, notes: "Identities match; prior proof remains bound." };
}
