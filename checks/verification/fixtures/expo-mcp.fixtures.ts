/**
 * #87 Expo MCP route models + device-proof binding. Deterministic fake schema only.
 * No live MCP connect / device install. Consumes mobile-operation + device-proof.
 */
import { EXPO_DEVICE_BIND_NOTES, bindExpoDeviceProof, type ExpoDeviceBindExpectation } from "../../../adapters/providers/expo/expo-device-bind.js";
import {
  EXPO_MCP_ROUTE_NOTES,
  EXPO_MCP_SCHEMA_VERSION_REVIEWED,
  assertExpoMcpDoesNotAddTransport,
  assessExpoMcpRoute,
  createFakeExpoMcpSchemaObservation,
  expoMcpDocsCannotGrant,
} from "../../../adapters/providers/expo/expo-mcp-route.js";
import { EXPO_APP_RUNTIME, operationFor, resolveExpoSelection } from "../../../catalog/stacks/expo-selection.js";
import { assert, type Harness } from "./_harness.js";

const expectation: ExpoDeviceBindExpectation = {
  projectId: "proj_expo_87",
  appId: "com.example.brigade",
  binaryFingerprint: "bin-aaa",
  sdkVersion: "57.0.0",
  platform: "ios-simulator-macos",
  hostOs: "macos",
  devServerUrl: "http://127.0.0.1:8081",
  connectionState: "connected",
  sourceRevision: "rev-1",
  buildId: "build-1",
  screenId: "home",
};

export function register(harness: Harness): void {
  harness.check("expo-mcp: fake schema separates availability/binding/access/execute/result", () => {
    const fake = createFakeExpoMcpSchemaObservation();
    assert(fake.live === false && fake.connected === false, "fake observation is not live");
    assert(fake.schemaVersion === EXPO_MCP_SCHEMA_VERSION_REVIEWED, "reviewed schema");
    assert(
      fake.tools.some((t) => t.kind === "docs-read"),
      "docs tools present",
    );

    const unselected = assessExpoMcpRoute({ selected: false, connected: false, toolName: "expo_docs_read" });
    assert(unselected.availability === "unselected" && unselected.refuseReason === "unselected", unselected.notes);
    assert(unselected.addsMobileOperationTransport === false, "no transport");

    const missing = assessExpoMcpRoute({ selected: true, connected: false, toolName: "expo_docs_read" });
    assert(missing.availability === "missing-connection" && missing.refuseReason === "missing-connection", missing.notes);

    const plan = assessExpoMcpRoute({
      selected: true,
      connected: true,
      toolName: "expo_docs_read",
      planAllowsTool: false,
    });
    assert(plan.availability === "plan-restricted" && plan.refuseReason === "plan-restriction", plan.notes);

    const localPkg = assessExpoMcpRoute({
      selected: true,
      connected: true,
      toolName: "expo_app_inspect",
      localPackagePresent: false,
    });
    assert(localPkg.availability === "missing-local-package" && localPkg.refuseReason === "missing-local-package", localPkg.notes);

    const host = assessExpoMcpRoute({
      selected: true,
      connected: true,
      toolName: "expo_app_inspect",
      hostSupported: false,
    });
    assert(host.availability === "unsupported-host" && host.refuseReason === "unsupported-host", host.notes);

    const codes = [missing.refuseReason, plan.refuseReason, localPkg.refuseReason, host.refuseReason];
    assert(new Set(codes).size === codes.length, `distinct condition codes; got ${codes.join(",")}`);
  });

  harness.check("expo-mcp: docs/learn ≠ effect; schema drift / new tool refuse; lost auth / partial", () => {
    const docs = assessExpoMcpRoute({
      selected: true,
      connected: true,
      toolName: "expo_docs_read",
      observedSchemaVersion: EXPO_MCP_SCHEMA_VERSION_REVIEWED,
    });
    assert(docs.executePermission === "docs-only", docs.notes);
    assert(docs.refuseReason === "docs-cannot-grant-effect", docs.notes);
    const grant = expoMcpDocsCannotGrant("deploy");
    assert(grant.granted === false, grant.notes);
    assert(expoMcpDocsCannotGrant("account-access").granted === false, "no account");
    assert(expoMcpDocsCannotGrant("file-access").granted === false, "no file");
    assert(expoMcpDocsCannotGrant("builder-truth").granted === false, "no builder truth");

    const drift = assessExpoMcpRoute({
      selected: true,
      connected: true,
      toolName: "expo_docs_read",
      observedSchemaVersion: "upstream-schema-v999",
    });
    assert(drift.refuseReason === "schema-drift-requires-review", drift.notes);

    const newly = assessExpoMcpRoute({
      selected: true,
      connected: true,
      toolName: "expo_brand_new_tool",
      newlyExposedUpstreamTool: true,
    });
    assert(newly.refuseReason === "new-tool-not-auto-granted", newly.notes);

    const lost = assessExpoMcpRoute({
      selected: true,
      connected: true,
      toolName: "expo_app_inspect",
      accountAccess: "lost-auth",
    });
    assert(lost.refuseReason === "lost-auth" && lost.observedResult === "refused", lost.notes);

    const partial = assessExpoMcpRoute({
      selected: true,
      connected: true,
      toolName: "expo_app_inspect",
      partialToolOutput: true,
    });
    assert(partial.refuseReason === "partial-output" && partial.observedResult === "partial-output", partial.notes);

    const live = assessExpoMcpRoute({
      selected: true,
      connected: true,
      toolName: "expo_app_inspect",
      requestLiveConnect: true,
    });
    assert(live.refuseReason === "live-mcp-held" && live.liveMcp === false, live.notes);

    const preferred = assessExpoMcpRoute({
      selected: true,
      connected: true,
      toolName: "expo_app_inspect",
      hostNativeCoversTask: true,
    });
    assert(preferred.refuseReason === "host-native-preferred", preferred.notes);

    const malicious = assessExpoMcpRoute({
      selected: true,
      connected: true,
      toolName: "expo_docs_read",
      instructionTriesToAlterApprovals: true,
    });
    assert(malicious.refuseReason === "builders-agents-authoritative", malicious.notes);

    const transport = assertExpoMcpDoesNotAddTransport();
    assert(transport.addsMobileOperationTransport === false, transport.notes);
    assert(transport.consume.includes("mobile-operation"), transport.consume);
  });

  harness.check("expo-mcp: device-proof bind refuse wrong-app/concurrent/stale; screenshot ≠ proof", () => {
    const bound = bindExpoDeviceProof(expectation, { ...expectation });
    assert(bound.status === "bound" && bound.liveDevice === false, bound.status === "bound" ? bound.notes : bound.notes);
    assert(bound.consumesDeviceProof === true && bound.addsMobileOperationTransport === false, EXPO_DEVICE_BIND_NOTES.consume);

    const wrongApp = bindExpoDeviceProof(expectation, { ...expectation, appId: "com.other.app" });
    assert(wrongApp.status === "refuse" && wrongApp.reason === "wrong-app", wrongApp.notes);

    const wrongServer = bindExpoDeviceProof(expectation, { ...expectation, devServerUrl: "http://127.0.0.1:9999" });
    assert(wrongServer.status === "refuse" && wrongServer.reason === "wrong-dev-server", wrongServer.notes);

    const concurrent = bindExpoDeviceProof(expectation, { ...expectation, concurrentOwner: true });
    assert(concurrent.status === "refuse" && concurrent.reason === "concurrent-ownership", concurrent.notes);

    const stale = bindExpoDeviceProof(expectation, {
      ...expectation,
      captureRevision: "rev-old",
      captureBinaryFingerprint: "bin-old",
    });
    assert(stale.status === "refuse" && stale.reason === "stale-capture", stale.notes);

    const physical = bindExpoDeviceProof({ ...expectation, platform: "ios-physical" }, { ...expectation, platform: "ios-physical" });
    assert(physical.status === "refuse" && physical.reason === "platform-unsupported", physical.notes);

    const nonMac = bindExpoDeviceProof(
      { ...expectation, platform: "non-macos-ios-simulator", hostOs: "linux" },
      { ...expectation, platform: "non-macos-ios-simulator", hostOs: "linux" },
    );
    assert(nonMac.status === "refuse" && nonMac.reason === "platform-unsupported", nonMac.notes);

    const purchase = bindExpoDeviceProof(expectation, { ...expectation, claimPurchaseProof: true });
    assert(purchase.status === "refuse" && purchase.reason === "screenshot-not-purchase-proof", purchase.notes);

    const release = bindExpoDeviceProof(expectation, { ...expectation, claimReleaseProof: true });
    assert(release.status === "refuse" && release.reason === "screenshot-not-release-proof", release.notes);

    const review = bindExpoDeviceProof(expectation, { ...expectation, claimReviewProof: true });
    assert(review.status === "refuse" && review.reason === "screenshot-not-review-proof", review.notes);

    const liveDevice = bindExpoDeviceProof(expectation, { ...expectation, requestLiveDevice: true });
    assert(liveDevice.status === "refuse" && liveDevice.reason === "live-device-held", liveDevice.notes);

    const alternate = bindExpoDeviceProof(expectation, {
      ...expectation,
      requestAlternateProvider: true,
      hostNativeCoversTask: true,
    });
    assert(alternate.status === "refuse" && alternate.reason === "unmet-alternate-provider", alternate.notes);
  });

  harness.check("expo-mcp: selection fixture-tested when selected; idle unselected; live not-run", () => {
    const idle = resolveExpoSelection({ compositionTarget: { platform: "ios", runtime: EXPO_APP_RUNTIME } });
    assert(idle.idleUnselectedServices.includes("expo-mcp"), "MCP stays optional/idle");
    assert(operationFor(idle, "expo-mcp").evidenceTier === "blocked", "unselected MCP stays blocked");

    const selected = resolveExpoSelection({
      compositionTarget: { platform: "ios", runtime: EXPO_APP_RUNTIME },
      selectedServices: ["expo-mcp"],
    });
    const op = operationFor(selected, "expo-mcp");
    assert(op.evidenceTier === "fixture-tested", "selected expo-mcp is fixture-tested");
    assert(op.queuedIssue === 87, "stays #87");
    assert(op.notes.includes("Live MCP connect not-run"), op.notes);
    assert(op.notes.includes("Fake transport is not live MCP proof"), op.notes);
    assert(op.notes.includes("Optional"), op.notes);
    assert(op.notes.includes("Host-native preferred"), op.notes);
    assert(EXPO_MCP_ROUTE_NOTES.noTransport.includes("MobileOperationTransport"), EXPO_MCP_ROUTE_NOTES.noTransport);
  });
}
