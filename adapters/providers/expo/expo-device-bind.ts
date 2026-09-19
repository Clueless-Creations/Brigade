/**
 * Expo device-proof binding fixtures (#87).
 *
 * Consumes adapters/device-proof.ts + contracts/mobile-operation.ts — no second device router,
 * no Expo MobileOperationTransport as default. Deterministic bind/refuse only; live device held.
 *
 * Bind captures to expected: dev server, app/project, installed binary, SDK, platform/host,
 * connection state. Refuse wrong-app / concurrent ownership / stale capture.
 * Screenshot ≠ purchase / release / review proof.
 */
export const EXPO_DEVICE_BIND_PATH = "adapters/providers/expo/expo-device-bind.ts" as const;

export type ExpoDeviceBindRefuseReason =
  | "wrong-app"
  | "wrong-project"
  | "wrong-dev-server"
  | "wrong-binary"
  | "stale-capture"
  | "concurrent-ownership"
  | "sdk-mismatch"
  | "platform-unsupported"
  | "connection-mismatch"
  | "screenshot-not-purchase-proof"
  | "screenshot-not-release-proof"
  | "screenshot-not-review-proof"
  | "live-device-held"
  | "unmet-alternate-provider";

export type ExpoDevicePlatformClaim = "ios-simulator-macos" | "ios-physical" | "android-emulator" | "android-physical" | "non-macos-ios-simulator";

export interface ExpoDeviceBindExpectation {
  readonly projectId: string;
  readonly appId: string;
  readonly binaryFingerprint: string;
  readonly sdkVersion: string;
  readonly platform: ExpoDevicePlatformClaim;
  readonly hostOs: "macos" | "linux" | "windows" | "other";
  readonly devServerUrl: string;
  readonly connectionState: "connected" | "disconnected" | "busy";
  readonly sourceRevision: string;
  readonly buildId: string;
  readonly screenId?: string;
}

export interface ExpoDeviceBindObservation {
  readonly projectId: string;
  readonly appId: string;
  readonly binaryFingerprint: string;
  readonly sdkVersion: string;
  readonly platform: ExpoDevicePlatformClaim;
  readonly hostOs: "macos" | "linux" | "windows" | "other";
  readonly devServerUrl: string;
  readonly connectionState: "connected" | "disconnected" | "busy";
  readonly sourceRevision: string;
  readonly buildId: string;
  readonly screenId?: string;
  readonly captureRevision?: string;
  readonly captureBinaryFingerprint?: string;
  /** Another session already owns the single development-server connection. */
  readonly concurrentOwner?: boolean;
  readonly requestLiveDevice?: boolean;
  /** Claim screenshot proves purchase / release / App Review. */
  readonly claimPurchaseProof?: boolean;
  readonly claimReleaseProof?: boolean;
  readonly claimReviewProof?: boolean;
  /** Alternate provider (MobAI / agent-device) requested when host-native covers the task. */
  readonly requestAlternateProvider?: boolean;
  readonly hostNativeCoversTask?: boolean;
}

export type ExpoDeviceBindResult =
  | {
      readonly status: "bound";
      readonly liveDevice: false;
      readonly consumesDeviceProof: true;
      readonly addsMobileOperationTransport: false;
      readonly expectation: ExpoDeviceBindExpectation;
      readonly notes: string;
    }
  | {
      readonly status: "refuse";
      readonly reason: ExpoDeviceBindRefuseReason;
      readonly liveDevice: false;
      readonly consumesDeviceProof: true;
      readonly addsMobileOperationTransport: false;
      readonly notes: string;
    };

export const EXPO_DEVICE_BIND_NOTES = {
  consume: "Consumes adapters/device-proof.ts + contracts/mobile-operation.ts. Do not invent a parallel device router.",
  noTransport: "Do not add an Expo MobileOperationTransport as default. Host-native stays preferred.",
  liveHeld: "Live device install / running-app capture remain held without HoE authority.",
  screenshotNotProof: "A screenshot is not purchase success, release readiness, or independent App Review proof.",
  singleServer: "Expo MCP documents one development-server connection at a time — concurrent ownership refuses before capture.",
  platformHonesty:
    "iOS physical-device and non-macOS local iOS simulator routes are unsupported by the documented simulator path — record hold, do not fake supported.",
  alternateHold: "MobAI / agent-device remain unmet-op holds only when host-native already covers the task. No silent fallback.",
} as const;

function platformSupported(platform: ExpoDevicePlatformClaim, hostOs: ExpoDeviceBindExpectation["hostOs"]): boolean {
  if (platform === "ios-physical") return false;
  if (platform === "non-macos-ios-simulator") return false;
  if (platform === "ios-simulator-macos") return hostOs === "macos";
  return true;
}

export function bindExpoDeviceProof(expectation: ExpoDeviceBindExpectation, observation: ExpoDeviceBindObservation): ExpoDeviceBindResult {
  const denied = (reason: ExpoDeviceBindRefuseReason, notes: string): ExpoDeviceBindResult => ({
    status: "refuse",
    reason,
    liveDevice: false,
    consumesDeviceProof: true,
    addsMobileOperationTransport: false,
    notes,
  });

  if (observation.requestLiveDevice) {
    return denied("live-device-held", EXPO_DEVICE_BIND_NOTES.liveHeld);
  }

  if (observation.requestAlternateProvider && observation.hostNativeCoversTask !== false) {
    return denied("unmet-alternate-provider", EXPO_DEVICE_BIND_NOTES.alternateHold);
  }

  if (observation.claimPurchaseProof) {
    return denied("screenshot-not-purchase-proof", EXPO_DEVICE_BIND_NOTES.screenshotNotProof);
  }
  if (observation.claimReleaseProof) {
    return denied("screenshot-not-release-proof", EXPO_DEVICE_BIND_NOTES.screenshotNotProof);
  }
  if (observation.claimReviewProof) {
    return denied("screenshot-not-review-proof", EXPO_DEVICE_BIND_NOTES.screenshotNotProof);
  }

  if (!platformSupported(observation.platform, observation.hostOs) || !platformSupported(expectation.platform, expectation.hostOs)) {
    return denied("platform-unsupported", EXPO_DEVICE_BIND_NOTES.platformHonesty);
  }

  if (observation.concurrentOwner || observation.connectionState === "busy" || expectation.connectionState === "busy") {
    return denied("concurrent-ownership", EXPO_DEVICE_BIND_NOTES.singleServer);
  }

  if (observation.devServerUrl !== expectation.devServerUrl) {
    return denied("wrong-dev-server", "Observed dev server does not match the expected binding. Refuse before capture/interaction changes state.");
  }
  if (observation.projectId !== expectation.projectId) {
    return denied("wrong-project", "Observed project does not match the expected binding.");
  }
  if (observation.appId !== expectation.appId) {
    return denied("wrong-app", "Observed app does not match the expected binding. Wrong-app refuse before capture.");
  }
  if (observation.binaryFingerprint !== expectation.binaryFingerprint) {
    return denied("wrong-binary", "Installed binary fingerprint does not match the expected binding.");
  }
  if (observation.sdkVersion !== expectation.sdkVersion) {
    return denied("sdk-mismatch", "SDK version does not match the expected binding.");
  }
  if (observation.connectionState !== expectation.connectionState) {
    return denied("connection-mismatch", "Connection state does not match the expected binding.");
  }

  const captureBinary = observation.captureBinaryFingerprint ?? observation.binaryFingerprint;
  const captureRevision = observation.captureRevision ?? observation.sourceRevision;
  if (captureBinary !== expectation.binaryFingerprint || captureRevision !== expectation.sourceRevision) {
    return denied("stale-capture", "Stale screenshot or capture from another binary/revision cannot satisfy current app evidence.");
  }

  return {
    status: "bound",
    liveDevice: false,
    consumesDeviceProof: true,
    addsMobileOperationTransport: false,
    expectation,
    notes: `${EXPO_DEVICE_BIND_NOTES.consume} Bound to project=${expectation.projectId} app=${expectation.appId} build=${expectation.buildId} revision=${expectation.sourceRevision}. ${EXPO_DEVICE_BIND_NOTES.liveHeld}`,
  };
}
