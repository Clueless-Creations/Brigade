/**
 * Safe SDK upgrade path models (#88).
 *
 * Isolated freeze / rebuild / invalidate / recovery. Changing package.json is
 * not upgrade proof. Refuse automatic upgrade, workspace repin, and release.
 * Live isolated upgrade workspace remains held (HoE: dry-run / fixture models).
 * Consumes evaluateExpoCompatibility from expo-selection — does not rebuild it.
 */
import { evaluateExpoCompatibility, type ExpoWorkspacePins } from "./expo-selection.js";

export const EXPO_SDK_UPGRADE_PATH = "catalog/stacks/expo-sdk-upgrade.ts" as const;

export type ExpoSdkUpgradePhase = "freeze-before" | "isolated-apply" | "rebuild" | "retest" | "invalidate-old" | "recover";

export interface ExpoSdkUpgradeFreeze {
  readonly expoSdk?: string;
  readonly reactNative?: string;
  readonly react?: string;
  readonly lockfileFingerprint?: string;
  readonly nativeDirectoryOwnership?: "cng-generated" | "maintained" | "dirty" | "unknown";
  readonly pluginModuleVersions?: readonly string[];
  readonly hostBuildImage?: string;
}

export interface ExpoSdkUpgradeInput {
  readonly phase: ExpoSdkUpgradePhase;
  readonly before: ExpoSdkUpgradeFreeze;
  readonly after?: ExpoSdkUpgradeFreeze;
  readonly isolatedWorkspace: boolean;
  readonly autoUpgradeAttempted?: boolean;
  readonly workspaceRepinAttempted?: boolean;
  readonly releaseAttempted?: boolean;
  readonly packageJsonBumpOnly?: boolean;
  readonly claimLiveUpgradeProof?: boolean;
  readonly upgradeFailed?: boolean;
  readonly customizationsPreserved?: boolean;
  readonly priorProofStillClaimedValid?: boolean;
}

export interface ExpoSdkUpgradeResult {
  readonly accepted: boolean;
  readonly autoUpgradeAttempted: false;
  readonly refuseReason:
    | "auto-upgrade-refused"
    | "workspace-repin-refused"
    | "release-refused"
    | "not-isolated"
    | "package-json-not-proof"
    | "live-upgrade-held"
    | "failure-recovery-required"
    | "old-proof-must-invalidate"
    | "freeze-incomplete"
    | null;
  readonly recoveryPath: string | null;
  readonly notes: string;
  readonly liveHeld: true;
  readonly compatibilityActionable?: string;
}

export const EXPO_SDK_UPGRADE_NOTES = {
  isolated: "Upgrades run only in an isolated / approved workspace copy — never auto on the product workspace.",
  packageJson: "Changing package.json alone is not upgrade proof.",
  auto: "Refuse automatic upgrade, workspace repin, and automatic release.",
  invalidate: "Incompatible prior captures/reviews/update acceptance must be invalidated after SDK/native change.",
  recovery: "Upgrade failure preserves original source/native customizations and gives a precise recovery path.",
  liveHeld: "Live isolated upgrade workspace exercise is held unless HoE authorizes a named journey.",
} as const;

function freezeComplete(freeze: ExpoSdkUpgradeFreeze): boolean {
  return Boolean(freeze.expoSdk && freeze.reactNative && freeze.react);
}

export function planExpoSdkUpgrade(input: ExpoSdkUpgradeInput): ExpoSdkUpgradeResult {
  const held = { autoUpgradeAttempted: false as const, liveHeld: true as const };

  if (input.autoUpgradeAttempted) {
    return {
      ...held,
      accepted: false,
      refuseReason: "auto-upgrade-refused",
      recoveryPath: "Restore before-freeze pins; do not apply automatic upgrade.",
      notes: EXPO_SDK_UPGRADE_NOTES.auto,
    };
  }
  if (input.workspaceRepinAttempted) {
    return {
      ...held,
      accepted: false,
      refuseReason: "workspace-repin-refused",
      recoveryPath: "Keep product workspace pins unchanged; use an isolated copy only.",
      notes: EXPO_SDK_UPGRADE_NOTES.auto,
    };
  }
  if (input.releaseAttempted) {
    return {
      ...held,
      accepted: false,
      refuseReason: "release-refused",
      recoveryPath: "No automatic release from upgrade models.",
      notes: EXPO_SDK_UPGRADE_NOTES.auto,
    };
  }
  if (input.claimLiveUpgradeProof) {
    return {
      ...held,
      accepted: false,
      refuseReason: "live-upgrade-held",
      recoveryPath: null,
      notes: EXPO_SDK_UPGRADE_NOTES.liveHeld,
    };
  }
  if (!input.isolatedWorkspace) {
    return {
      ...held,
      accepted: false,
      refuseReason: "not-isolated",
      recoveryPath: "Copy to an approved isolated workspace before any upgrade apply.",
      notes: EXPO_SDK_UPGRADE_NOTES.isolated,
    };
  }
  if (input.packageJsonBumpOnly) {
    return {
      ...held,
      accepted: false,
      refuseReason: "package-json-not-proof",
      recoveryPath: "Complete freeze → rebuild development client + native artifacts → retest → invalidate.",
      notes: EXPO_SDK_UPGRADE_NOTES.packageJson,
    };
  }
  if (!freezeComplete(input.before) || (input.after !== undefined && !freezeComplete(input.after))) {
    return {
      ...held,
      accepted: false,
      refuseReason: "freeze-incomplete",
      recoveryPath: "Record before/after locks for expo SDK, React Native, React, lockfile, native ownership.",
      notes: "Before/after freeze incomplete. Do not claim upgrade proof.",
    };
  }
  if (input.upgradeFailed) {
    return {
      ...held,
      accepted: false,
      refuseReason: "failure-recovery-required",
      recoveryPath:
        input.customizationsPreserved === false
          ? "FAILURE: customizations were not preserved — restore from before-freeze backup immediately."
          : "Restore before-freeze pins and native customizations; re-run freeze review before retry.",
      notes: EXPO_SDK_UPGRADE_NOTES.recovery,
    };
  }
  if (input.priorProofStillClaimedValid && (input.phase === "invalidate-old" || input.phase === "retest" || input.phase === "rebuild")) {
    return {
      ...held,
      accepted: false,
      refuseReason: "old-proof-must-invalidate",
      recoveryPath: "Invalidate incompatible prior captures, reviews, and update acceptance bound to the old SDK/runtime.",
      notes: EXPO_SDK_UPGRADE_NOTES.invalidate,
    };
  }

  const pins: ExpoWorkspacePins | undefined = input.after
    ? { expoSdk: input.after.expoSdk, reactNative: input.after.reactNative, react: input.after.react }
    : { expoSdk: input.before.expoSdk, reactNative: input.before.reactNative, react: input.before.react };
  const compatibility = evaluateExpoCompatibility(pins);

  return {
    ...held,
    accepted: true,
    refuseReason: null,
    recoveryPath: null,
    notes: `Dry-run ${input.phase} model accepted in isolated workspace. ${EXPO_SDK_UPGRADE_NOTES.liveHeld}`,
    compatibilityActionable: compatibility.actionable,
  };
}

export function refuseAutoExpoSdkUpgrade(): {
  readonly autoUpgradeAttempted: false;
  readonly refused: true;
  readonly notes: string;
} {
  return {
    autoUpgradeAttempted: false,
    refused: true,
    notes: EXPO_SDK_UPGRADE_NOTES.auto,
  };
}
