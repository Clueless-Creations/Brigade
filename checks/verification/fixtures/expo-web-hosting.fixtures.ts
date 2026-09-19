/**
 * #86 EAS Hosting dry-run models + alternate-host matrix. Deterministic only.
 * No live hosting deploy. Consumes #84 argv refuse. No second executor.
 */
import {
  EXPO_HOSTING_PREPARE_NOTES,
  assertExpoHostingLiveSpawnRefused,
  prepareExpoHostingDryRun,
  simulateFakeHostingDeploy,
} from "../../../adapters/providers/expo/hosting-prepare.js";
import { EXPO_EAS_HOSTING_NOTES, EXPO_HOSTING_HOST_MATRIX, decideExpoHostingHost } from "../../../catalog/stacks/expo-eas-hosting.js";
import { EXPO_APP_RUNTIME, operationFor, resolveExpoSelection } from "../../../catalog/stacks/expo-selection.js";
import { easHostingIsFixtureTested, easHostingLiveDeployRemainsHeld } from "../../../catalog/stacks/expo-web-static.js";
import { assert, type Harness } from "./_harness.js";

const previewTarget = {
  easProjectId: "proj_preview_web_001",
  environment: "preview",
  alias: "preview-alias",
  deploymentId: "dep_111",
};

export function register(harness: Harness): void {
  harness.check("expo-web-hosting: prepare dry-run is not execute; preview ≠ production; live spawn refused", () => {
    const prepared = prepareExpoHostingDryRun({
      dryRun: true,
      operation: "preview-deploy",
      sourceFingerprint: "src-web-1",
      approvedSourceFingerprint: "src-web-1",
      target: previewTarget,
    });
    assert(prepared.status === "prepared-dry-run", `expected prepared-dry-run, got ${JSON.stringify(prepared)}`);
    if (prepared.status === "prepared-dry-run") {
      assert(prepared.authorityToExecute === false, "preparing ≠ authority");
      assert(prepared.deployed === false && prepared.promoted === false, "not deployed");
      assert(prepared.previewOnly === true && prepared.autoDeploy === false, "preview only");
      assert(prepared.notes.includes(EXPO_HOSTING_PREPARE_NOTES.consumeExecutor), "consumes #84");
    }

    const noDryRun = prepareExpoHostingDryRun({
      dryRun: false,
      operation: "preview-deploy",
      sourceFingerprint: "src-web-1",
      target: previewTarget,
    });
    assert(noDryRun.status === "refuse" && noDryRun.reason === "dry-run-required", noDryRun.notes);

    const live = prepareExpoHostingDryRun({
      dryRun: true,
      operation: "preview-deploy",
      sourceFingerprint: "src-web-1",
      target: previewTarget,
      requestLiveSpawn: true,
    });
    assert(live.status === "refuse" && live.reason === "live-spawn-refused", live.notes);

    const auto = prepareExpoHostingDryRun({
      dryRun: true,
      operation: "preview-deploy",
      sourceFingerprint: "src-web-1",
      target: previewTarget,
      autoDeploy: true,
    });
    assert(auto.status === "refuse" && auto.reason === "auto-deploy-refused", auto.notes);

    const promote = prepareExpoHostingDryRun({
      dryRun: true,
      operation: "promote",
      sourceFingerprint: "src-web-1",
      target: { ...previewTarget, environment: "production" },
      authorityGranted: true,
    });
    assert(promote.status === "refuse" && promote.reason === "production-promote-hard-held", promote.notes);

    const domain = prepareExpoHostingDryRun({
      dryRun: true,
      operation: "domain",
      sourceFingerprint: "src-web-1",
      target: previewTarget,
      authorityGranted: true,
    });
    assert(domain.status === "refuse" && domain.reason === "domain-mutation-hard-held", domain.notes);

    const noAuth = prepareExpoHostingDryRun({
      dryRun: true,
      operation: "alias",
      sourceFingerprint: "src-web-1",
      target: previewTarget,
    });
    assert(noAuth.status === "refuse" && noAuth.reason === "authority-not-granted", noAuth.notes);

    const reconcile = prepareExpoHostingDryRun({
      dryRun: true,
      operation: "preview-deploy",
      sourceFingerprint: "src-web-1",
      target: previewTarget,
      localTimedOutAfterRemoteSuccess: true,
    });
    assert(reconcile.status === "refuse" && reconcile.reason === "reconcile-before-retry", reconcile.notes);

    const spawn = assertExpoHostingLiveSpawnRefused();
    assert(spawn.refused === true && spawn.code === "unsupported-operation", "eas.deploy argv must refuse");

    const sim = simulateFakeHostingDeploy({
      prepare: prepared,
      remoteAcceptedId: "dep_remote_1",
    });
    assert(sim.deployed === false && sim.liveHosting === false, sim.notes);
  });

  harness.check("expo-web-hosting: alternate-host matrix + no silent switch + optional hosting", () => {
    assert(EXPO_HOSTING_HOST_MATRIX.length >= 5, "matrix covers EAS + alternates");
    assert(EXPO_EAS_HOSTING_NOTES.optional.includes("optional"), "hosting remains optional");

    const unselected = decideExpoHostingHost({ adapter: "static-export" });
    assert(unselected.action === "unselected" && unselected.liveDeploy === false, unselected.notes);

    const eas = decideExpoHostingHost({ selectedHost: "eas-hosting", adapter: "static-export" });
    assert(eas.action === "accept-model" && eas.silentSwitch === false && eas.liveDeploy === false, eas.notes);

    const unsupported = decideExpoHostingHost({ selectedHost: "unsupported", adapter: "unknown" });
    assert(unsupported.action === "decision-request", unsupported.notes);

    const serverAlt = decideExpoHostingHost({ selectedHost: "vercel", adapter: "server-output" });
    assert(serverAlt.action === "decision-request", serverAlt.notes);

    const silent = decideExpoHostingHost({
      selectedHost: "eas-hosting",
      adapter: "static-export",
      attemptSilentSwitchTo: "vercel",
      uncertainDeploy: true,
    });
    assert(silent.action === "refuse-silent-switch" && silent.silentSwitch === false, silent.notes);
  });

  harness.check("expo-web-hosting: selection eas-hosting fixture-tested + live not-run", () => {
    const idle = resolveExpoSelection({
      compositionTarget: { platform: "web", runtime: EXPO_APP_RUNTIME },
    });
    assert(operationFor(idle, "eas-hosting").evidenceTier === "blocked", "unselected hosting stays idle");
    assert(idle.idleUnselectedServices.includes("eas-hosting"), "hosting remains optional");
    const selected = resolveExpoSelection({
      compositionTarget: { platform: "web", runtime: EXPO_APP_RUNTIME },
      selectedServices: ["eas-hosting"],
    });
    assert(easHostingIsFixtureTested(selected), "selected eas-hosting is fixture-tested");
    assert(easHostingLiveDeployRemainsHeld(selected), "live hosting deploy held");
    const op = operationFor(selected, "eas-hosting");
    assert(op.queuedIssue === 86, "stays #86");
    assert(op.notes.includes("Fake transport is not live hosting proof"), op.notes);
    assert(op.notes.includes("Optional"), "hosting stays optional");
    const webExport = operationFor(selected, "expo-web-export");
    assert(webExport.evidenceTier === "fixture-tested", "web export stays fixture-tested");
    assert(webExport.notes.includes("Alpha SSR remains held"), webExport.notes);
  });
}
