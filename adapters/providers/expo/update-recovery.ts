/**
 * EAS Update rollback / recovery models (#85).
 *
 * Labeled semantics only. Synthetic fixtures for offline / failed-download /
 * interrupted-apply / failed-startup — not device proof. Rollback does not
 * instantly reach offline devices, undo DB migrations, or recover arbitrary side effects.
 */

export const EXPO_UPDATE_RECOVERY_PATH = "adapters/providers/expo/update-recovery.ts" as const;

export type ExpoUpdateRecoveryAction = "stop-rollout" | "republish-previous-compatible" | "rollback-to-embedded";

export type ExpoUpdateClientFailureMode = "offline" | "failed-download" | "interrupted-apply" | "failed-startup";

export type ExpoUpdateRecoveryHoldReason =
  | "device-proof-held"
  | "unsafe-persistent-data"
  | "previous-update-incompatible"
  | "production-channel-hard-held"
  | "live-recovery-held"
  | "schema-change-unproven";

export interface ExpoUpdateRecoveryPlanInput {
  readonly action: ExpoUpdateRecoveryAction;
  readonly channel: string;
  readonly environment: string;
  readonly previousUpdateCompatible?: boolean;
  readonly localSchemaChanged?: boolean;
  readonly persistentDataCompatibilityProven?: boolean;
  readonly claimDeviceProof?: boolean;
  readonly claimLiveRecovery?: boolean;
}

export interface ExpoUpdateRecoveryPlan {
  readonly action: ExpoUpdateRecoveryAction;
  readonly accepted: boolean;
  readonly holdReason?: ExpoUpdateRecoveryHoldReason;
  readonly notes: string;
  readonly deviceProofHeld: true;
  readonly liveRecoveryHeld: true;
}

export interface ExpoUpdateClientRecoveryInput {
  readonly failureMode: ExpoUpdateClientFailureMode;
  readonly claimDeviceProof?: boolean;
}

export interface ExpoUpdateClientRecoveryResult {
  readonly failureMode: ExpoUpdateClientFailureMode;
  readonly documented: true;
  readonly deviceProofHeld: true;
  readonly holdReason: "device-proof-held";
  readonly notes: string;
}

export const EXPO_UPDATE_RECOVERY_NOTES = {
  stopRollout: "stop-rollout halts further percentage widening; it does not uninstall already-applied updates.",
  republishPrevious: "republish-previous-compatible requires a known compatible prior update; incompatible prior → hold.",
  rollbackEmbedded: "rollback-to-embedded restores the binary-embedded bundle where the client supports it.",
  offlineLimit: "Rollback does not instantly reach offline devices.",
  schemaLimit: "Rollback does not undo local DB migrations or arbitrary side effects.",
  syntheticOnly: "Client failure recovery rows are synthetic fixtures — not device/simulator proof.",
  productionHardHeld: "Production channel recovery mutation is hard-held.",
} as const;

function isProductionScope(channel: string, environment: string): boolean {
  const c = channel.trim().toLowerCase();
  const e = environment.trim().toLowerCase();
  return c === "production" || c === "prod" || e === "production" || e === "prod";
}

export function planExpoUpdateRecovery(input: ExpoUpdateRecoveryPlanInput): ExpoUpdateRecoveryPlan {
  const held = { deviceProofHeld: true as const, liveRecoveryHeld: true as const };

  if (input.claimLiveRecovery || input.claimDeviceProof) {
    return {
      action: input.action,
      accepted: false,
      holdReason: input.claimDeviceProof ? "device-proof-held" : "live-recovery-held",
      notes: EXPO_UPDATE_RECOVERY_NOTES.syntheticOnly,
      ...held,
    };
  }
  if (isProductionScope(input.channel, input.environment)) {
    return {
      action: input.action,
      accepted: false,
      holdReason: "production-channel-hard-held",
      notes: EXPO_UPDATE_RECOVERY_NOTES.productionHardHeld,
      ...held,
    };
  }
  if (input.localSchemaChanged && input.persistentDataCompatibilityProven !== true) {
    return {
      action: input.action,
      accepted: false,
      holdReason: "schema-change-unproven",
      notes: `${EXPO_UPDATE_RECOVERY_NOTES.schemaLimit} Explicit unsafe-recovery hold until compatibility is proven.`,
      ...held,
    };
  }
  if (input.persistentDataCompatibilityProven === false) {
    return {
      action: input.action,
      accepted: false,
      holdReason: "unsafe-persistent-data",
      notes: EXPO_UPDATE_RECOVERY_NOTES.schemaLimit,
      ...held,
    };
  }
  if (input.action === "republish-previous-compatible" && input.previousUpdateCompatible === false) {
    return {
      action: input.action,
      accepted: false,
      holdReason: "previous-update-incompatible",
      notes: EXPO_UPDATE_RECOVERY_NOTES.republishPrevious,
      ...held,
    };
  }

  const actionNotes: Record<ExpoUpdateRecoveryAction, string> = {
    "stop-rollout": EXPO_UPDATE_RECOVERY_NOTES.stopRollout,
    "republish-previous-compatible": EXPO_UPDATE_RECOVERY_NOTES.republishPrevious,
    "rollback-to-embedded": EXPO_UPDATE_RECOVERY_NOTES.rollbackEmbedded,
  };

  return {
    action: input.action,
    accepted: true,
    notes: `${actionNotes[input.action]} ${EXPO_UPDATE_RECOVERY_NOTES.offlineLimit} ${EXPO_UPDATE_RECOVERY_NOTES.syntheticOnly}`,
    ...held,
  };
}

export function assessExpoUpdateClientRecovery(input: ExpoUpdateClientRecoveryInput): ExpoUpdateClientRecoveryResult {
  const modeNotes: Record<ExpoUpdateClientFailureMode, string> = {
    offline: "Offline launch: client continues on last successfully applied or embedded bundle until network returns.",
    "failed-download": "Failed download: retain prior applied update; do not partial-apply corrupt assets.",
    "interrupted-apply": "Interrupted apply: fail closed to prior good update or embedded; do not claim success.",
    "failed-startup": "Failed startup after apply: roll back to embedded/prior when supported; record evidence failure.",
  };

  return {
    failureMode: input.failureMode,
    documented: true,
    deviceProofHeld: true,
    holdReason: "device-proof-held",
    notes: `${modeNotes[input.failureMode]} ${EXPO_UPDATE_RECOVERY_NOTES.syntheticOnly}${
      input.claimDeviceProof ? " Claiming device proof without authority is refused." : ""
    }`,
  };
}
