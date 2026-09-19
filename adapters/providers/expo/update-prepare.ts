/**
 * EAS Update prepare / dry-run publish contracts (#85).
 *
 * Preparing a command is not authority to execute. A preview artifact is not a
 * published update. Fake-transport simulation never proves live OTA. Live spawn
 * stays refused in argv (`eas.update` labeled-unavailable) unless separate authority.
 */

import { buildExpoEasArgv, ExpoArgvRefusal } from "./argv.js";

export const EXPO_UPDATE_PREPARE_PATH = "adapters/providers/expo/update-prepare.ts" as const;

export type ExpoUpdatePrepareRefuseReason =
  | "dry-run-required"
  | "missing-target"
  | "production-channel-hard-held"
  | "stale-source"
  | "stale-channel"
  | "stale-environment"
  | "live-spawn-refused"
  | "auto-publish-refused";

export interface ExpoUpdatePrepareTarget {
  readonly easProjectId: string;
  readonly platform: "ios" | "android";
  readonly runtimeVersion: string;
  readonly channel: string;
  readonly environment: string;
  readonly updateBranch: string;
}

export interface ExpoUpdatePrepareRequest {
  readonly dryRun: boolean;
  readonly sourceFingerprint: string;
  readonly approvedSourceFingerprint?: string;
  readonly bundleAssetFingerprint: string;
  readonly target: ExpoUpdatePrepareTarget;
  readonly approvedChannel?: string;
  readonly approvedEnvironment?: string;
  readonly requestLiveSpawn?: boolean;
  readonly autoPublish?: boolean;
}

export type ExpoUpdatePrepareResult =
  | {
      readonly status: "prepared-dry-run";
      readonly authorityToExecute: false;
      readonly published: false;
      readonly previewArtifactOnly: true;
      readonly autoPublish: false;
      readonly target: ExpoUpdatePrepareTarget;
      readonly sourceFingerprint: string;
      readonly bundleAssetFingerprint: string;
      readonly notes: string;
    }
  | {
      readonly status: "refuse";
      readonly reason: ExpoUpdatePrepareRefuseReason;
      readonly authorityToExecute: false;
      readonly published: false;
      readonly autoPublish: false;
      readonly notes: string;
    };

export const EXPO_UPDATE_PREPARE_NOTES = {
  preparingIsNotAuthority: "Preparing an update command does not grant authority to execute or publish.",
  previewIsNotPublished: "A preview artifact / dry-run envelope is not a published update.",
  productionHardHeld: "Production channel and production environment update ops are hard-held in #85.",
  liveSpawnHeld: "Live eas.update spawn remains labeled-unavailable without separate HoE authority.",
} as const;

function isProductionScope(channel: string, environment: string): boolean {
  const c = channel.trim().toLowerCase();
  const e = environment.trim().toLowerCase();
  return c === "production" || c === "prod" || e === "production" || e === "prod";
}

export function prepareExpoUpdateDryRun(input: ExpoUpdatePrepareRequest): ExpoUpdatePrepareResult {
  const denied = (reason: ExpoUpdatePrepareRefuseReason, notes: string): ExpoUpdatePrepareResult => ({
    status: "refuse",
    reason,
    authorityToExecute: false,
    published: false,
    autoPublish: false,
    notes,
  });

  if (input.autoPublish === true) {
    return denied("auto-publish-refused", "autoPublish must remain false. Eligible ≠ authorized ≠ published.");
  }
  if (!input.dryRun) {
    return denied("dry-run-required", `${EXPO_UPDATE_PREPARE_NOTES.preparingIsNotAuthority} dryRun:true is required.`);
  }
  if (input.requestLiveSpawn) {
    return denied("live-spawn-refused", EXPO_UPDATE_PREPARE_NOTES.liveSpawnHeld);
  }
  const t = input.target;
  if (!t?.easProjectId || !t.platform || !t.runtimeVersion || !t.channel || !t.environment || !t.updateBranch) {
    return denied("missing-target", "Prepare requires exact project, platform, runtimeVersion, channel, environment, and updateBranch.");
  }
  if (isProductionScope(t.channel, t.environment)) {
    return denied("production-channel-hard-held", EXPO_UPDATE_PREPARE_NOTES.productionHardHeld);
  }
  if (input.approvedChannel && input.approvedChannel !== t.channel) {
    return denied("stale-channel", "Approved channel no longer matches prepare target channel.");
  }
  if (input.approvedEnvironment && input.approvedEnvironment !== t.environment) {
    return denied("stale-environment", "Approved environment no longer matches prepare target environment.");
  }
  if (input.approvedSourceFingerprint && input.approvedSourceFingerprint !== input.sourceFingerprint) {
    return denied("stale-source", "Approved source fingerprint no longer matches prepare source. Re-approve.");
  }

  return {
    status: "prepared-dry-run",
    authorityToExecute: false,
    published: false,
    previewArtifactOnly: true,
    autoPublish: false,
    target: t,
    sourceFingerprint: input.sourceFingerprint,
    bundleAssetFingerprint: input.bundleAssetFingerprint,
    notes: `${EXPO_UPDATE_PREPARE_NOTES.preparingIsNotAuthority} ${EXPO_UPDATE_PREPARE_NOTES.previewIsNotPublished}`,
  };
}

export interface FakeUpdatePublishSimulation {
  readonly prepared: true;
  readonly published: false;
  readonly liveOta: false;
  readonly remoteIdentity?: string;
  readonly notes: string;
}

export function simulateFakeUpdatePublish(input: {
  readonly prepare: ExpoUpdatePrepareResult;
  readonly remoteAcceptedId?: string;
  readonly priorRemoteIdentity?: string;
}): FakeUpdatePublishSimulation {
  if (input.prepare.status !== "prepared-dry-run") {
    return {
      prepared: true,
      published: false,
      liveOta: false,
      notes: `Prepare refused (${input.prepare.status === "refuse" ? input.prepare.reason : "unknown"}); no publish simulation.`,
    };
  }
  if (input.priorRemoteIdentity && input.remoteAcceptedId && input.priorRemoteIdentity === input.remoteAcceptedId) {
    return {
      prepared: true,
      published: false,
      liveOta: false,
      remoteIdentity: input.remoteAcceptedId,
      notes: "Resume from remote identity; do not duplicate blind publish on uncertain acceptance.",
    };
  }
  return {
    prepared: true,
    published: false,
    liveOta: false,
    remoteIdentity: input.remoteAcceptedId,
    notes: `${EXPO_UPDATE_PREPARE_NOTES.previewIsNotPublished} Fake transport is not live OTA proof.`,
  };
}

export function assertExpoUpdateLiveSpawnRefused(): { refused: true; code: "unsupported-operation" } | { refused: false } {
  try {
    buildExpoEasArgv({ operationId: "eas.update", hostAuthorityGranted: true });
    return { refused: false };
  } catch (error) {
    if (error instanceof ExpoArgvRefusal && error.code === "unsupported-operation") {
      return { refused: true, code: "unsupported-operation" };
    }
    return { refused: false };
  }
}
