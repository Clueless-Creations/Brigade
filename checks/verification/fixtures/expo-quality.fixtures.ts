/**
 * #88 cross-platform quality evidence. Deterministic only.
 * mock≠native; web≠android/ios; a11y≠screenshot; invalidation on identity change.
 */
import {
  EXPO_QUALITY_LEVEL_CANNOT_PROVE,
  EXPO_QUALITY_LEVEL_CAN_PROVE,
  assessExpoQualityClaim,
  invalidateExpoQualityProof,
} from "../../../catalog/stacks/expo-quality-evidence.js";
import { EXPO_APP_RUNTIME, operationFor, resolveExpoSelection } from "../../../catalog/stacks/expo-selection.js";
import { assert, type Harness } from "./_harness.js";

export function register(harness: Harness): void {
  harness.check("expo-quality: jest-expo mocks cannot satisfy native; web≠android/ios", () => {
    const mock = assessExpoQualityClaim({
      claimedPlatform: "ios",
      requiredPlatform: "ios",
      claimKind: "jest-expo-mock",
      evidenceLevel: "simulator-emulator-e2e",
    });
    assert(mock.accepted === false && mock.refuseReason === "mock-not-native", mock.notes);

    const webAndroid = assessExpoQualityClaim({
      claimedPlatform: "web",
      requiredPlatform: "android",
      claimKind: "web-export",
      evidenceLevel: "browser-exported-web",
    });
    assert(webAndroid.refuseReason === "web-not-android", webAndroid.notes);

    const webIos = assessExpoQualityClaim({
      claimedPlatform: "web",
      requiredPlatform: "ios",
      claimKind: "web-export",
      evidenceLevel: "browser-exported-web",
    });
    assert(webIos.refuseReason === "web-not-ios", webIos.notes);

    const iosAndroid = assessExpoQualityClaim({
      claimedPlatform: "ios",
      requiredPlatform: "android",
      claimKind: "ios-capture",
      evidenceLevel: "simulator-emulator-e2e",
    });
    assert(iosAndroid.refuseReason === "ios-not-android", iosAndroid.notes);
  });

  harness.check("expo-quality: a11y≠screenshot; release-like offline held; levels documented", () => {
    const shot = assessExpoQualityClaim({
      claimedPlatform: "ios",
      requiredPlatform: "ios",
      claimKind: "screenshot-count",
      evidenceLevel: "component-router",
    });
    assert(shot.refuseReason === "screenshot-not-a11y", shot.notes);

    const release = assessExpoQualityClaim({
      claimedPlatform: "android",
      requiredPlatform: "android",
      claimKind: "release-like-offline",
      evidenceLevel: "simulator-emulator-e2e",
    });
    assert(release.refuseReason === "release-like-held" && release.liveHeld === true, release.notes);

    assert(EXPO_QUALITY_LEVEL_CAN_PROVE["browser-exported-web"].includes("web"), "web level");
    assert(EXPO_QUALITY_LEVEL_CANNOT_PROVE["browser-exported-web"].includes("Android"), "web cannot prove native");
  });

  harness.check("expo-quality: identity change invalidates old proof; selection fixture-tested", () => {
    const prior = {
      platform: "ios" as const,
      level: "simulator-emulator-e2e" as const,
      sourceRevision: "aaa",
      sdkPin: "57",
      buildId: "build-1",
    };
    const next = { ...prior, sdkPin: "58", buildId: "build-2" };
    const inv = invalidateExpoQualityProof(prior, next);
    assert(inv.invalidated === true, inv.notes);

    const stale = assessExpoQualityClaim({
      claimedPlatform: "ios",
      requiredPlatform: "ios",
      claimKind: "stale-binary",
      evidenceLevel: "simulator-emulator-e2e",
      identity: next,
      priorIdentity: prior,
    });
    assert(stale.refuseReason === "stale-proof-invalidated", stale.notes);

    const selected = resolveExpoSelection({ compositionTarget: { platform: "ios", runtime: EXPO_APP_RUNTIME } });
    const op = operationFor(selected, "quality-observability");
    assert(op.evidenceTier === "fixture-tested", "quality-observability advanced");
    assert(op.queuedIssue === 88, "stays #88");
    assert(op.notes.includes("Live full matrix"), op.notes);
    assert(op.notes.includes("Never closes #80"), op.notes);
  });
}
