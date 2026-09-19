/**
 * #88 safe SDK upgrade dry-run models. Deterministic only.
 * Refuse auto-upgrade / workspace repin / package.json-as-proof; invalidate old proof.
 */
import { planExpoSdkUpgrade, refuseAutoExpoSdkUpgrade } from "../../../catalog/stacks/expo-sdk-upgrade.js";
import { evaluateExpoCompatibility } from "../../../catalog/stacks/expo-selection.js";
import { assert, type Harness } from "./_harness.js";

const before = {
  expoSdk: "57",
  reactNative: "0.86.3",
  react: "19.2",
  lockfileFingerprint: "lock-a",
  nativeDirectoryOwnership: "cng-generated" as const,
};

export function register(harness: Harness): void {
  harness.check("expo-sdk-upgrade: refuse auto-upgrade, repin, release, non-isolated, package.json-only", () => {
    const auto = refuseAutoExpoSdkUpgrade();
    assert(auto.autoUpgradeAttempted === false && auto.refused === true, auto.notes);

    assert(
      planExpoSdkUpgrade({
        phase: "isolated-apply",
        before,
        isolatedWorkspace: true,
        autoUpgradeAttempted: true,
      }).refuseReason === "auto-upgrade-refused",
      "auto upgrade",
    );
    assert(
      planExpoSdkUpgrade({
        phase: "isolated-apply",
        before,
        isolatedWorkspace: true,
        workspaceRepinAttempted: true,
      }).refuseReason === "workspace-repin-refused",
      "repin",
    );
    assert(
      planExpoSdkUpgrade({
        phase: "isolated-apply",
        before,
        isolatedWorkspace: true,
        releaseAttempted: true,
      }).refuseReason === "release-refused",
      "release",
    );
    assert(
      planExpoSdkUpgrade({
        phase: "isolated-apply",
        before,
        isolatedWorkspace: false,
      }).refuseReason === "not-isolated",
      "not isolated",
    );
    assert(
      planExpoSdkUpgrade({
        phase: "isolated-apply",
        before,
        isolatedWorkspace: true,
        packageJsonBumpOnly: true,
      }).refuseReason === "package-json-not-proof",
      "package.json",
    );
  });

  harness.check("expo-sdk-upgrade: failure preserves customizations; invalidate old proof; live held", () => {
    const fail = planExpoSdkUpgrade({
      phase: "recover",
      before,
      after: { ...before, expoSdk: "58" },
      isolatedWorkspace: true,
      upgradeFailed: true,
      customizationsPreserved: true,
    });
    assert(fail.refuseReason === "failure-recovery-required", fail.notes);
    assert(fail.recoveryPath !== null && fail.recoveryPath.includes("Restore"), fail.recoveryPath ?? "");

    const lost = planExpoSdkUpgrade({
      phase: "recover",
      before,
      after: { ...before, expoSdk: "58" },
      isolatedWorkspace: true,
      upgradeFailed: true,
      customizationsPreserved: false,
    });
    assert(lost.recoveryPath?.includes("customizations"), lost.recoveryPath ?? "");

    const stale = planExpoSdkUpgrade({
      phase: "invalidate-old",
      before,
      after: { ...before, expoSdk: "58", reactNative: "0.87.0" },
      isolatedWorkspace: true,
      priorProofStillClaimedValid: true,
    });
    assert(stale.refuseReason === "old-proof-must-invalidate", stale.notes);

    const live = planExpoSdkUpgrade({
      phase: "isolated-apply",
      before,
      after: { ...before },
      isolatedWorkspace: true,
      claimLiveUpgradeProof: true,
    });
    assert(live.refuseReason === "live-upgrade-held" && live.liveHeld === true, live.notes);
  });

  harness.check("expo-sdk-upgrade: dry-run rebuild accepted; compatibility still refuses auto", () => {
    const ok = planExpoSdkUpgrade({
      phase: "rebuild",
      before,
      after: { ...before, lockfileFingerprint: "lock-b" },
      isolatedWorkspace: true,
    });
    assert(ok.accepted === true && ok.autoUpgradeAttempted === false, ok.notes);
    assert(ok.liveHeld === true, "live still held");

    const compat = evaluateExpoCompatibility({ expoSdk: "56", reactNative: "0.86.3", react: "19.2" });
    assert(compat.autoUpgradeAttempted === false, "compat never auto-upgrades");
    assert(compat.actionable.includes("Do not run an automatic upgrade"), compat.actionable);
  });
}
