/**
 * #85 EAS Update lifecycle models: identity, prepare/dry-run, channel isolation,
 * rollout health-hold, rollback/recovery, code-signing.
 * Deterministic only. No live OTA. No device proof.
 */
import {
  EXPO_UPDATE_IDENTITY_NOTES,
  assertExpoUpdateIdentitiesDistinct,
  claimsClientApplyFromPublishOnly,
  type ExpoUpdateIdentityMap,
} from "../../../adapters/providers/expo/update-identity.js";
import {
  assertExpoUpdateLiveSpawnRefused,
  prepareExpoUpdateDryRun,
  simulateFakeUpdatePublish,
} from "../../../adapters/providers/expo/update-prepare.js";
import { assessExpoUpdateRollout } from "../../../adapters/providers/expo/update-rollout.js";
import {
  assessExpoUpdateClientRecovery,
  planExpoUpdateRecovery,
} from "../../../adapters/providers/expo/update-recovery.js";
import { assessExpoUpdateCodeSigning } from "../../../adapters/providers/expo/update-signing.js";
import { assert, type Harness } from "./_harness.js";

function previewIdentity(overrides: Partial<ExpoUpdateIdentityMap> = {}): ExpoUpdateIdentityMap {
  return {
    expoAppId: "app.clueless.preview",
    easProjectId: "proj_preview_001",
    platform: "ios",
    buildProfile: "preview-internal",
    environment: "preview",
    nativeRuntimeFingerprint: "native-fp-aaa",
    appVersion: "1.2.0",
    runtimeVersion: "exposdk:54.0.0",
    binaryId: "build-bin-111",
    updateBranch: "preview-branch",
    updateChannel: "preview",
    updateGroupId: "group-222",
    publishedUpdateId: "update-pub-333",
    clientObservedUpdateId: "update-client-444",
    ...overrides,
  };
}

const previewTarget = {
  easProjectId: "proj_preview_001",
  platform: "ios" as const,
  runtimeVersion: "exposdk:54.0.0",
  channel: "preview",
  environment: "preview",
  updateBranch: "preview-branch",
};

export function register(harness: Harness): void {
  harness.check("expo-eas-update-lifecycle: identity map keeps build ≠ update and published ≠ applied", () => {
    const map = previewIdentity();
    const distinct = assertExpoUpdateIdentitiesDistinct(map);
    assert(distinct.distinct, `identities must stay distinct, collisions=${distinct.collisions.join("; ")}`);
    assert(distinct.notes.includes(EXPO_UPDATE_IDENTITY_NOTES.buildIsNotUpdate), "must document build ≠ update");
    assert(distinct.notes.includes(EXPO_UPDATE_IDENTITY_NOTES.publishedIsNotApplied), "must document published ≠ applied");
    assert(claimsClientApplyFromPublishOnly(map) === false, "populated client id is not publish-only claim");
    assert(
      claimsClientApplyFromPublishOnly({ publishedUpdateId: "update-pub-333", clientObservedUpdateId: "" }) === true,
      "publish without client observe is a publish-only claim",
    );
    const collided = assertExpoUpdateIdentitiesDistinct(previewIdentity({ binaryId: "same", publishedUpdateId: "same" }));
    assert(collided.distinct === false, "binaryId === publishedUpdateId must collide");
  });

  harness.check("expo-eas-update-lifecycle: prepare dry-run is not execute authority; preview ≠ published", () => {
    const prepared = prepareExpoUpdateDryRun({
      dryRun: true,
      sourceFingerprint: "src-1",
      bundleAssetFingerprint: "bundle-1",
      target: previewTarget,
      approvedChannel: "preview",
      approvedEnvironment: "preview",
      approvedSourceFingerprint: "src-1",
    });
    assert(prepared.status === "prepared-dry-run", `expected prepared-dry-run, got ${JSON.stringify(prepared)}`);
    if (prepared.status === "prepared-dry-run") {
      assert(prepared.authorityToExecute === false, "prepare must not grant execute authority");
      assert(prepared.published === false, "prepare must not claim published");
      assert(prepared.previewArtifactOnly === true, "prepare yields preview artifact only");
      assert(prepared.autoPublish === false, "autoPublish must stay false");
    }

    const notDryRun = prepareExpoUpdateDryRun({
      dryRun: false,
      sourceFingerprint: "src-1",
      bundleAssetFingerprint: "bundle-1",
      target: previewTarget,
    });
    assert(notDryRun.status === "refuse" && notDryRun.reason === "dry-run-required", `expected dry-run-required, got ${JSON.stringify(notDryRun)}`);

    const live = prepareExpoUpdateDryRun({
      dryRun: true,
      sourceFingerprint: "src-1",
      bundleAssetFingerprint: "bundle-1",
      requestLiveSpawn: true,
      target: previewTarget,
    });
    assert(live.status === "refuse" && live.reason === "live-spawn-refused", `expected live-spawn-refused, got ${JSON.stringify(live)}`);

    const production = prepareExpoUpdateDryRun({
      dryRun: true,
      sourceFingerprint: "src-1",
      bundleAssetFingerprint: "bundle-1",
      target: {
        ...previewTarget,
        channel: "production",
        environment: "production",
        updateBranch: "production-branch",
      },
    });
    assert(
      production.status === "refuse" && production.reason === "production-channel-hard-held",
      `expected production hard-hold, got ${JSON.stringify(production)}`,
    );

    const stale = prepareExpoUpdateDryRun({
      dryRun: true,
      sourceFingerprint: "src-2",
      approvedSourceFingerprint: "src-1",
      bundleAssetFingerprint: "bundle-1",
      approvedChannel: "preview",
      approvedEnvironment: "preview",
      target: previewTarget,
    });
    assert(stale.status === "refuse" && stale.reason === "stale-source", `expected stale-source, got ${JSON.stringify(stale)}`);

    const sim = simulateFakeUpdatePublish({
      prepare: prepared,
      remoteAcceptedId: "remote-1",
    });
    assert(sim.published === false && sim.liveOta === false, "fake transport must not claim publish or live OTA");

    const resume = simulateFakeUpdatePublish({
      prepare: prepared,
      remoteAcceptedId: "remote-1",
      priorRemoteIdentity: "remote-1",
    });
    assert(resume.published === false, "resume from remote identity must not blind-republish");
    assert(resume.notes.toLowerCase().includes("remote identity"), "resume notes must mention remote identity");

    const spawn = assertExpoUpdateLiveSpawnRefused();
    assert(spawn.refused === true && spawn.code === "unsupported-operation", "eas.update argv must stay refused");
  });

  harness.check("expo-eas-update-lifecycle: rollout holds on unknown/missing health; no invented metrics", () => {
    const unknown = assessExpoUpdateRollout({
      channel: "preview",
      environment: "preview",
      currentPercent: 10,
      requestedPercent: 50,
      health: { adoption: "unknown", launchErrors: "healthy", applicationHealth: "healthy" },
    });
    assert(unknown.action === "hold" && unknown.reason === "health-unknown", `expected health-unknown hold, got ${JSON.stringify(unknown)}`);
    assert(unknown.liveRolloutHeld === true, "live rollout must stay held");

    const missing = assessExpoUpdateRollout({
      channel: "preview",
      environment: "preview",
      currentPercent: 10,
      requestedPercent: 50,
      health: { adoption: "missing", launchErrors: "healthy", applicationHealth: "healthy" },
    });
    assert(missing.action === "hold" && missing.reason === "health-missing", `expected health-missing hold, got ${JSON.stringify(missing)}`);

    const unhealthy = assessExpoUpdateRollout({
      channel: "preview",
      environment: "preview",
      currentPercent: 50,
      requestedPercent: 80,
      health: { adoption: "healthy", launchErrors: "unhealthy", applicationHealth: "healthy" },
    });
    assert(unhealthy.action === "stop-rollout" && unhealthy.reason === "health-unhealthy", `expected stop on unhealthy, got ${JSON.stringify(unhealthy)}`);

    const invented = assessExpoUpdateRollout({
      channel: "preview",
      environment: "preview",
      currentPercent: 10,
      requestedPercent: 50,
      health: { adoption: "healthy", launchErrors: "healthy", applicationHealth: "healthy" },
      inventedUserMetrics: true,
    });
    assert(invented.action === "hold" && invented.reason === "metrics-not-authoritative", `expected metrics hold, got ${JSON.stringify(invented)}`);

    const production = assessExpoUpdateRollout({
      channel: "production",
      environment: "production",
      currentPercent: 0,
      requestedPercent: 10,
      health: { adoption: "healthy", launchErrors: "healthy", applicationHealth: "healthy" },
    });
    assert(production.action === "hold" && production.reason === "production-channel-hard-held", `expected production hold, got ${JSON.stringify(production)}`);
  });

  harness.check("expo-eas-update-lifecycle: recovery models + synthetic client failure holds", () => {
    for (const action of ["stop-rollout", "republish-previous-compatible", "rollback-to-embedded"] as const) {
      const plan = planExpoUpdateRecovery({
        action,
        channel: "preview",
        environment: "preview",
        previousUpdateCompatible: true,
      });
      assert(plan.accepted === true, `${action} should be accepted on preview with compatible prior`);
      assert(plan.deviceProofHeld === true && plan.liveRecoveryHeld === true, `${action} must hold device/live proof`);
    }

    const incompatible = planExpoUpdateRecovery({
      action: "republish-previous-compatible",
      channel: "preview",
      environment: "preview",
      previousUpdateCompatible: false,
    });
    assert(
      incompatible.accepted === false && incompatible.holdReason === "previous-update-incompatible",
      `expected incompatible hold, got ${JSON.stringify(incompatible)}`,
    );

    const schema = planExpoUpdateRecovery({
      action: "rollback-to-embedded",
      channel: "preview",
      environment: "preview",
      localSchemaChanged: true,
      persistentDataCompatibilityProven: false,
    });
    assert(schema.accepted === false && schema.holdReason === "schema-change-unproven", `expected schema hold, got ${JSON.stringify(schema)}`);

    const production = planExpoUpdateRecovery({
      action: "stop-rollout",
      channel: "production",
      environment: "production",
    });
    assert(
      production.accepted === false && production.holdReason === "production-channel-hard-held",
      `expected production recovery hold, got ${JSON.stringify(production)}`,
    );

    for (const failureMode of ["offline", "failed-download", "interrupted-apply", "failed-startup"] as const) {
      const recovery = assessExpoUpdateClientRecovery({ failureMode });
      assert(recovery.documented === true, `${failureMode} must be documented`);
      assert(recovery.deviceProofHeld === true && recovery.holdReason === "device-proof-held", `${failureMode} is synthetic hold, not device proof`);
    }
  });

  harness.check("expo-eas-update-lifecycle: code-signing missing plan/keys are blockers; no private keys in source", () => {
    const missingPlan = assessExpoUpdateCodeSigning({ signingRequired: true, planPresent: false });
    assert(
      missingPlan.action === "refuse" && missingPlan.code === "missing-plan" && missingPlan.blocker === true,
      `expected missing-plan, got ${JSON.stringify(missingPlan)}`,
    );

    const missingKeys = assessExpoUpdateCodeSigning({
      signingRequired: true,
      planPresent: true,
      publicKeyPresent: false,
      privateKeyAccessible: false,
    });
    assert(
      missingKeys.action === "refuse" && missingKeys.code === "missing-keys" && missingKeys.blocker === true,
      `expected missing-keys, got ${JSON.stringify(missingKeys)}`,
    );

    const inSource = assessExpoUpdateCodeSigning({
      signingRequired: true,
      planPresent: true,
      publicKeyPresent: true,
      privateKeyAccessible: true,
      privateKeyInAppSource: true,
    });
    assert(
      inSource.action === "refuse" && inSource.code === "private-key-in-source-refused",
      `expected private-key refuse, got ${JSON.stringify(inSource)}`,
    );
    assert(inSource.privateKeysInSourceAllowed === false, "private keys in source never allowed");

    const liveClaim = assessExpoUpdateCodeSigning({
      signingRequired: true,
      planPresent: true,
      publicKeyPresent: true,
      privateKeyAccessible: true,
      claimLiveSigningProof: true,
    });
    assert(liveClaim.action === "refuse" && liveClaim.code === "live-signing-held", `expected live-signing-held, got ${JSON.stringify(liveClaim)}`);

    const ready = assessExpoUpdateCodeSigning({
      signingRequired: true,
      planPresent: true,
      publicKeyPresent: true,
      privateKeyAccessible: true,
    });
    assert(ready.action === "accept-plan" && ready.code === "ready-to-plan" && ready.blocker === false, `expected ready-to-plan, got ${JSON.stringify(ready)}`);
    assert(ready.liveSigningHeld === true, "accept-plan still holds live signing");

    const notRequired = assessExpoUpdateCodeSigning({ signingRequired: false });
    assert(notRequired.action === "not-required" && notRequired.blocker === false, `expected not-required, got ${JSON.stringify(notRequired)}`);
  });
}
