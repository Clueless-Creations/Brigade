/**
 * EAS Hosting prepare / dry-run deploy contracts (#86).
 *
 * Preparing a command is not authority to execute. Preview ≠ production promote.
 * Fake-transport simulation never proves live hosting. Live spawn stays refused
 * in argv (`eas.deploy` / `eas.deploy.promote` labeled-unavailable).
 * Consumes #84 executor — no second runner.
 */

import { buildExpoEasArgv, ExpoArgvRefusal } from "./argv.js";

export const EXPO_HOSTING_PREPARE_PATH = "adapters/providers/expo/hosting-prepare.ts" as const;

export type ExpoHostingPrepareRefuseReason =
  | "dry-run-required"
  | "missing-target"
  | "production-promote-hard-held"
  | "domain-mutation-hard-held"
  | "live-spawn-refused"
  | "auto-deploy-refused"
  | "stale-source"
  | "stale-alias"
  | "authority-not-granted"
  | "reconcile-before-retry";

export type ExpoHostingOperation = "preview-deploy" | "status-readback" | "promote" | "alias" | "domain";

export interface ExpoHostingPrepareTarget {
  readonly easProjectId: string;
  readonly environment: string;
  readonly alias?: string;
  readonly deploymentId?: string;
}

export interface ExpoHostingPrepareRequest {
  readonly dryRun: boolean;
  readonly operation: ExpoHostingOperation;
  readonly sourceFingerprint: string;
  readonly approvedSourceFingerprint?: string;
  readonly target: ExpoHostingPrepareTarget;
  readonly approvedAlias?: string;
  readonly requestLiveSpawn?: boolean;
  readonly autoDeploy?: boolean;
  readonly authorityGranted?: boolean;
  readonly priorRemoteAccepted?: boolean;
  readonly localTimedOutAfterRemoteSuccess?: boolean;
}

export type ExpoHostingPrepareResult =
  | {
      readonly status: "prepared-dry-run";
      readonly operation: ExpoHostingOperation;
      readonly authorityToExecute: false;
      readonly deployed: false;
      readonly promoted: false;
      readonly previewOnly: true;
      readonly autoDeploy: false;
      readonly target: ExpoHostingPrepareTarget;
      readonly sourceFingerprint: string;
      readonly notes: string;
    }
  | {
      readonly status: "refuse";
      readonly reason: ExpoHostingPrepareRefuseReason;
      readonly authorityToExecute: false;
      readonly deployed: false;
      readonly promoted: false;
      readonly autoDeploy: false;
      readonly notes: string;
    };

export const EXPO_HOSTING_PREPARE_NOTES = {
  preparingIsNotAuthority: "Preparing a hosting command does not grant authority to deploy, promote, or mutate domains.",
  previewIsNotProduction: "A preview dry-run envelope is not a production promote or live hosting proof.",
  productionHardHeld: "Production promote, alias cutover, and domain mutation are hard-held without HoE authority.",
  liveSpawnHeld: "Live eas.deploy / eas.deploy.promote spawn remains labeled-unavailable without separate HoE authority.",
  reconcileBeforeRetry: "If local timeout follows remote success, reconcile identity before retry or alias promotion.",
  consumeExecutor: "Hosting dry-run consumes the #84 Expo/EAS executor. Do not invent a second runner.",
} as const;

function isProductionEnvironment(environment: string): boolean {
  const e = environment.trim().toLowerCase();
  return e === "production" || e === "prod";
}

export function prepareExpoHostingDryRun(input: ExpoHostingPrepareRequest): ExpoHostingPrepareResult {
  const denied = (reason: ExpoHostingPrepareRefuseReason, notes: string): ExpoHostingPrepareResult => ({
    status: "refuse",
    reason,
    authorityToExecute: false,
    deployed: false,
    promoted: false,
    autoDeploy: false,
    notes,
  });

  if (input.autoDeploy === true) {
    return denied("auto-deploy-refused", "autoDeploy must remain false. Selecting hosting ≠ authorized deploy.");
  }
  if (!input.dryRun) {
    return denied("dry-run-required", `${EXPO_HOSTING_PREPARE_NOTES.preparingIsNotAuthority} dryRun:true is required.`);
  }
  if (input.requestLiveSpawn) {
    return denied("live-spawn-refused", EXPO_HOSTING_PREPARE_NOTES.liveSpawnHeld);
  }
  const t = input.target;
  if (!t?.easProjectId || !t.environment) {
    return denied("missing-target", "Prepare requires exact easProjectId and environment.");
  }
  if (input.localTimedOutAfterRemoteSuccess) {
    return denied("reconcile-before-retry", EXPO_HOSTING_PREPARE_NOTES.reconcileBeforeRetry);
  }
  if (input.operation === "promote" || input.operation === "alias" || input.operation === "domain") {
    if (!input.authorityGranted) {
      return denied("authority-not-granted", EXPO_HOSTING_PREPARE_NOTES.productionHardHeld);
    }
    if (isProductionEnvironment(t.environment) || input.operation === "domain") {
      return denied(input.operation === "domain" ? "domain-mutation-hard-held" : "production-promote-hard-held", EXPO_HOSTING_PREPARE_NOTES.productionHardHeld);
    }
  }
  if (input.approvedSourceFingerprint && input.approvedSourceFingerprint !== input.sourceFingerprint) {
    return denied("stale-source", "Approved source fingerprint no longer matches prepare source. Re-approve.");
  }
  if (input.approvedAlias && t.alias && input.approvedAlias !== t.alias) {
    return denied("stale-alias", "Approved alias no longer matches prepare target alias.");
  }

  return {
    status: "prepared-dry-run",
    operation: input.operation,
    authorityToExecute: false,
    deployed: false,
    promoted: false,
    previewOnly: true,
    autoDeploy: false,
    target: t,
    sourceFingerprint: input.sourceFingerprint,
    notes: `${EXPO_HOSTING_PREPARE_NOTES.preparingIsNotAuthority} ${EXPO_HOSTING_PREPARE_NOTES.previewIsNotProduction} ${EXPO_HOSTING_PREPARE_NOTES.consumeExecutor}`,
  };
}

export interface FakeHostingDeploySimulation {
  readonly prepared: true;
  readonly deployed: false;
  readonly liveHosting: false;
  readonly remoteIdentity?: string;
  readonly notes: string;
}

export function simulateFakeHostingDeploy(input: {
  readonly prepare: ExpoHostingPrepareResult;
  readonly remoteAcceptedId?: string;
  readonly priorRemoteIdentity?: string;
}): FakeHostingDeploySimulation {
  if (input.prepare.status !== "prepared-dry-run") {
    return {
      prepared: true,
      deployed: false,
      liveHosting: false,
      notes: `Prepare refused (${input.prepare.status === "refuse" ? input.prepare.reason : "unknown"}); no deploy simulation.`,
    };
  }
  if (input.priorRemoteIdentity && input.remoteAcceptedId && input.priorRemoteIdentity === input.remoteAcceptedId) {
    return {
      prepared: true,
      deployed: false,
      liveHosting: false,
      remoteIdentity: input.remoteAcceptedId,
      notes: "Resume from remote identity; do not duplicate blind deploy on uncertain acceptance.",
    };
  }
  return {
    prepared: true,
    deployed: false,
    liveHosting: false,
    remoteIdentity: input.remoteAcceptedId,
    notes: `${EXPO_HOSTING_PREPARE_NOTES.previewIsNotProduction} Fake transport is not live hosting proof.`,
  };
}

export function assertExpoHostingLiveSpawnRefused():
  { refused: true; code: "unsupported-operation"; operations: readonly ("eas.deploy" | "eas.deploy.promote")[] } | { refused: false } {
  const operations = ["eas.deploy", "eas.deploy.promote"] as const;
  for (const operationId of operations) {
    try {
      buildExpoEasArgv({ operationId, hostAuthorityGranted: true });
      return { refused: false };
    } catch (error) {
      if (!(error instanceof ExpoArgvRefusal) || error.code !== "unsupported-operation") {
        return { refused: false };
      }
    }
  }
  return { refused: true, code: "unsupported-operation", operations };
}
