/**
 * #115 mobile-ops canonical-operation boundary fixtures.
 *
 * Deterministic only. No live device, live MCP, tool install, account connect,
 * or private user data capture. Fake/synthetic transports are wiring — never
 * independent contract source. Pins: host-native fixtures; Expo #87
 * fixture-schema-v1; MobAI CLI 1.9.3 hole-fill (DeviceProofAdapter, not MOT).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  MOBILE_OPS_CANONICAL_MAP,
  MOBILE_OPS_CANONICAL_INVENTORY_DOC,
  MOBILE_OPS_CANONICAL_MAP_PATH,
  MOBILE_OPS_CANONICAL_MAP_REQUIRED_OP_CLASSES,
  MOBILE_OPS_CANONICAL_OPERATION_IDS,
  MOBILE_OPS_CAPTURE_RECIPE_ID,
  MOBILE_OPS_CORE_WORKFLOW_ID,
  MOBILE_OPS_DISTINCT_EVIDENCE_NOTE,
  MOBILE_OPS_EVIDENCE_CLASSES,
  MOBILE_OPS_EXPO_MOT_DUPLICATE_HOLD,
  MOBILE_OPS_HOST_NATIVE_PROVIDER_ID,
  MOBILE_OPS_LOGICAL_SEAMS,
  MOBILE_OPS_MOBAI_MOT_WRAP_HOLD,
  MOBILE_OPS_MOBAI_PROVIDER_ID,
  MOBILE_OPS_NON_AUTHORITY_FLAGS,
  MOBILE_OPS_OP_CLASSES,
  MOBILE_OPS_PROTECTED_EFFECTS,
  EXPO_MCP_ROUTE_MODULE,
  EXPO_MCP_SCHEMA_PIN,
  HOST_NATIVE_FIXTURE_SUITE,
  HOST_NATIVE_PROOF_INJECT,
  MOBAI_CLI_REVIEWED_VERSION,
  MOBAI_DEVICE_PROOF_MODULE,
  MOBILE_OPERATION_CONFORMANCE_SCENARIO,
  getMobileOpsCanonicalMap,
  mobileOpsCanonicalMapRow,
  mobileOpsDuplicatesExpoMot,
  mobileOpsEvidenceClassesRemainDistinct,
  mobileOpsFlagLooksNoninteractive,
  mobileOpsNoninteractiveGrantsAuthority,
  mobileOpsProtectedRows,
  mobileOpsRowsForOpClass,
  mobileOpsRowsForProvider,
  mobileOpsWrapsMobaiAsMot,
} from "../../../catalog/providers/mobile-ops-canonical-map.js";
import {
  MOBILE_OPS_NATIVE_LEAK_SYMBOLS,
  MOBILE_OPS_TYPED_CONTRACT_CONSUMERS,
  hostNativeAloneBlocked,
  looksLikeSecondDeviceRouterFactory,
  mobileOpsCanonicalMapModulePath,
  mobileOpsSeamOwner,
  pathIsTypedMobileOpsConsumer,
  pathMayOwnMobileOpsNativeTypes,
  reviewedExpoMcpSchemaPin,
  reviewedMobaiCliVersion,
  sourceImportsMobileOpsNativeLeak,
} from "../../../adapters/providers/mobile-ops/boundary.js";
import {
  classifyCaptureAsAcceptanceRefuse,
  classifyExplicitReplanAfterKnownSafeFailure,
  classifyMobileOpsFailSafe,
  classifyNewToolAutoExpandRefuse,
  classifySchemaDriftRefuse,
  classifyUncertainInteractionNoSilentFallback,
  classifyWrongMobileTarget,
  liveDeviceAllowedByYesFlag,
  targetsMatch,
} from "../../../adapters/providers/mobile-ops/fail-safe.js";
import { EXPO_MCP_SCHEMA_VERSION_REVIEWED, EXPO_MCP_ROUTE_NOTES, assessExpoMcpRoute } from "../../../adapters/providers/expo/expo-mcp-route.js";
import {
  MOBILE_OPERATION_IDS,
  normalizeMobileObservation,
  requireMobileSupport,
  type MobileRequest,
  type MobileSupport,
  type MobileTarget,
} from "../../../contracts/mobile-operation.js";
import { firstpartyRecipes, firstpartyImplementations } from "../../../catalog/firstparty-declarations.js";
import { workflows as buildReleaseWorkflows } from "../../../catalog/workflows/build-release.js";
import { assert, skillRoot, type Harness } from "./_harness.js";

const INVENTORY_DOC = path.join(skillRoot, MOBILE_OPS_CANONICAL_INVENTORY_DOC);
const HOST_FIXTURE = path.join(skillRoot, HOST_NATIVE_FIXTURE_SUITE);
const HOST_PROOF = path.join(skillRoot, HOST_NATIVE_PROOF_INJECT);
const CONFORMANCE = path.join(skillRoot, MOBILE_OPERATION_CONFORMANCE_SCENARIO);
const DEVICE_PROOF = path.join(skillRoot, MOBAI_DEVICE_PROOF_MODULE);
const EXPO_ROUTE = path.join(skillRoot, EXPO_MCP_ROUTE_MODULE);
const MOT_ADAPTER = path.join(skillRoot, "adapters/mobile-operation.ts");
const HOST_TRANSPORT = path.join(skillRoot, "adapters/mobile-operation-host.ts");

function workflowById(id: string) {
  const row = buildReleaseWorkflows.find((workflow) => workflow.id === id);
  assert(row !== undefined, `missing workflow ${id}`);
  return row!;
}

function fixtureTarget(overrides: Partial<MobileTarget> = {}): MobileTarget {
  return {
    platform: "ios",
    deviceKind: "simulator",
    deviceId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    osVersion: "18.0",
    locale: "en_US",
    appId: "com.example.app",
    buildId: "42",
    artifactSha256: "a".repeat(64),
    ...overrides,
  };
}

export function register(harness: Harness): void {
  harness.check("mobile-ops-canonical: map covers every required op class with evidence + authority tags", () => {
    assert(getMobileOpsCanonicalMap() === MOBILE_OPS_CANONICAL_MAP, "getter returns authored map");
    assert(mobileOpsCanonicalMapModulePath() === MOBILE_OPS_CANONICAL_MAP_PATH, "stable map path");
    assert(reviewedMobaiCliVersion() === "1.9.3", "MobAI CLI pin");
    assert(MOBAI_CLI_REVIEWED_VERSION === "1.9.3", "version const");
    assert(reviewedExpoMcpSchemaPin() === "fixture-schema-v1", "Expo schema pin");
    assert(EXPO_MCP_SCHEMA_PIN === EXPO_MCP_SCHEMA_VERSION_REVIEWED, "pin matches #87");
    for (const opClass of MOBILE_OPS_CANONICAL_MAP_REQUIRED_OP_CLASSES) {
      const rows = mobileOpsRowsForOpClass(opClass);
      assert(rows.length >= 1, `op class ${opClass} has at least one row`);
    }
    assert(MOBILE_OPS_OP_CLASSES.length === 13, "thirteen op classes");
    for (const row of MOBILE_OPS_CANONICAL_MAP) {
      assert(row.nativeCapability.length > 0, `${row.id} names a native capability`);
      assert(row.implementationPointer.length > 0, `${row.id} has an implementation pointer`);
      assert(MOBILE_OPS_EVIDENCE_CLASSES.includes(row.evidenceClass), `${row.id} evidence class`);
      assert(row.authorityClass.length > 0, `${row.id} authority`);
      assert(row.fit.length > 0, `${row.id} fit`);
      assert(row.limitations.length > 0, `${row.id} limitations`);
    }
    assert(mobileOpsRowsForProvider("host-native").length >= 5, "host-native rows");
    assert(mobileOpsRowsForProvider("mobai").length >= 3, "mobai rows");
    assert(mobileOpsRowsForProvider("expo-mcp").length >= 3, "expo-mcp rows");
  });

  harness.check("mobile-ops-canonical: interact/video unsupported on host-native; live MCP/device held", () => {
    const interact = mobileOpsCanonicalMapRow("host-native-interact");
    assert(interact.fit === "unsupported", "interact unsupported");
    assert(interact.disposition === "held", "interact held");
    const video = mobileOpsCanonicalMapRow("host-native-video");
    assert(video.fit === "unsupported", "video unsupported");
    assert(video.disposition === "held", "video held");
    const liveMcp = mobileOpsCanonicalMapRow("expo-mcp-live-connect");
    assert(liveMcp.evidenceClass === "live-mcp-held", "live MCP held");
    assert(liveMcp.authorityClass === "founder-protected", "founder-protected");
    const physical = mobileOpsCanonicalMapRow("live-device-physical");
    assert(physical.evidenceClass === "physical-parity-held", "physical parity held");
    const protectedRows = mobileOpsProtectedRows();
    assert(protectedRows.length >= 4, "protected set is non-empty");
    for (const effect of MOBILE_OPS_PROTECTED_EFFECTS) {
      assert(
        MOBILE_OPS_CANONICAL_MAP.some((row) => row.effectClass === effect),
        `protected effect ${effect} appears in map`,
      );
    }
  });

  harness.check("mobile-ops-canonical: --yes and noninteractive never grant live-device authority", () => {
    assert(mobileOpsNoninteractiveGrantsAuthority(["--yes"]) === false, "--yes is not authority");
    assert(liveDeviceAllowedByYesFlag(["--yes", "--non-interactive"]) === false, "yes never authorizes live device");
    for (const flag of MOBILE_OPS_NON_AUTHORITY_FLAGS) {
      assert(mobileOpsFlagLooksNoninteractive(flag), `${flag} recognized`);
    }
    const decision = classifyMobileOpsFailSafe({
      opClass: "live-connect",
      targetMatchesMandate: true,
      staleCaptureOrProof: false,
      unsupportedHostOrPlatform: false,
      schemaDrift: false,
      newlyExposedUpstreamTool: false,
      interactionUncertainOrPartial: false,
      interactionInterrupted: false,
      concurrentOwnership: false,
      knownSafeFailure: false,
      explicitReplanRequested: false,
      silentProviderFallbackAttempted: false,
      captureUsedAsAcceptance: false,
      authorityGranted: false,
      noninteractiveFlags: ["--yes"],
    });
    assert(decision.action === "fail-closed", "yes without authority fails closed");
    assert(decision.allowSilentFallback === false, "no silent fallback from flags");
  });

  harness.check("mobile-ops-canonical: evidence classes stay distinct; inventory doc present", () => {
    assert(mobileOpsEvidenceClassesRemainDistinct([...MOBILE_OPS_EVIDENCE_CLASSES]), "six evidence classes");
    assert(MOBILE_OPS_DISTINCT_EVIDENCE_NOTE.includes("fixture"), "honesty note names fixture");
    const doc = readFileSync(INVENTORY_DOC, "utf8");
    assert(doc.includes("#115"), "inventory names #115");
    assert(doc.includes("1.9.3"), "inventory pins MobAI 1.9.3");
    assert(doc.includes("fixture-schema-v1") || doc.includes("#87"), "inventory names Expo pin");
    assert(doc.includes("#116"), "inventory names next sibling without implementing it");
    assert(doc.includes("held"), "inventory documents holds");
    assert(!doc.includes("live device: yes"), "inventory does not authorize live device");
    assert(doc.includes("Host-native") || doc.includes("host-native"), "host-native named");
    assert(doc.includes("DeviceProofAdapter") || doc.includes("not MOT"), "MobAI not MOT");
  });

  harness.check("mobile-ops-canonical: independent provenance; fake ≠ contract", () => {
    assert(existsSync(HOST_FIXTURE), "host-native fixture suite present");
    assert(existsSync(HOST_PROOF), "host-native proof inject present");
    assert(existsSync(CONFORMANCE), "synthetic conformance present");
    assert(existsSync(DEVICE_PROOF), "device-proof module present");
    assert(existsSync(EXPO_ROUTE), "expo-mcp-route present");
    const deviceProof = readFileSync(DEVICE_PROOF, "utf8");
    assert(deviceProof.includes("1.9.3"), "device-proof pins MobAI 1.9.3");
    assert(deviceProof.includes("createMobaiCliAdapter"), "MobAI adapter named");
    assert(deviceProof.includes("DeviceProofAdapter"), "MobAI is DeviceProofAdapter");
    const conformance = readFileSync(CONFORMANCE, "utf8");
    assert(conformance.includes("Synthetic") || conformance.includes("synthetic"), "conformance is synthetic");
    assert(conformance.includes("createMobileOperationRoute"), "conformance uses route factory");
    const expo = readFileSync(EXPO_ROUTE, "utf8");
    assert(expo.includes(EXPO_MCP_SCHEMA_VERSION_REVIEWED), "expo route pins schema");
    assert(expo.includes("addsMobileOperationTransport"), "expo refuses MOT add");
    assert(expo.includes("schema-drift") || expo.includes("Schema"), "expo drift refuse");
  });

  harness.check("mobile-ops-canonical: ADR-0013 logical seams; no second router; MobAI/Expo MOT holds", () => {
    assert(MOBILE_OPS_LOGICAL_SEAMS.length === 5, "five logical seams");
    for (const role of ["definition", "encoder", "transport", "decoder", "reconciler"] as const) {
      const owner = mobileOpsSeamOwner(role);
      assert(owner.length > 0, role);
    }
    assert(mobileOpsWrapsMobaiAsMot() === false, "never wrap MobAI as MOT");
    assert(mobileOpsDuplicatesExpoMot() === false, "never duplicate Expo MOT");
    assert(MOBILE_OPS_MOBAI_MOT_WRAP_HOLD.disposition === "held", "MobAI MOT wrap held");
    assert(MOBILE_OPS_EXPO_MOT_DUPLICATE_HOLD.disposition === "held", "Expo MOT duplicate held");
    assert(pathMayOwnMobileOpsNativeTypes("adapters/mobile-operation-host.ts"), "host transport may own native");
    assert(pathMayOwnMobileOpsNativeTypes("adapters/device-proof.ts"), "device-proof may own native");
    assert(pathMayOwnMobileOpsNativeTypes("adapters/providers/expo/expo-mcp-route.ts"), "expo may own");
    assert(pathIsTypedMobileOpsConsumer("catalog/workflows/build-release.ts"), "workflows are typed consumers");
    assert(pathIsTypedMobileOpsConsumer("contracts/other.ts"), "contracts prefix is typed consumer");
    assert(pathIsTypedMobileOpsConsumer("entrypoints/mcp/server.ts"), "entrypoints are typed consumers");
    const motSource = readFileSync(MOT_ADAPTER, "utf8");
    assert(motSource.includes("createMobileOperationRoute"), "one route factory defined");
    assert(!looksLikeSecondDeviceRouterFactory(motSource), "MOT adapter is not a second router");
    assert(!looksLikeSecondDeviceRouterFactory(readFileSync(HOST_TRANSPORT, "utf8")), "host transport is not a second router");
    assert(!looksLikeSecondDeviceRouterFactory(deviceProofSource()), "device-proof is not a second router");
  });

  harness.check("mobile-ops-canonical: typed consumers do not import provider-native leak symbols", () => {
    const roots = MOBILE_OPS_TYPED_CONTRACT_CONSUMERS.map((prefix) => path.join(skillRoot, prefix));
    const offenders: string[] = [];
    for (const root of roots) {
      const walk = (dir: string): void => {
        let dirents;
        try {
          dirents = readdirSync(dir, { withFileTypes: true });
        } catch {
          return;
        }
        for (const ent of dirents) {
          const full = path.join(dir, ent.name);
          if (ent.isDirectory()) {
            walk(full);
            continue;
          }
          if (!ent.name.endsWith(".ts")) continue;
          const rel = path.relative(skillRoot, full).replace(/\\/g, "/");
          if (!pathIsTypedMobileOpsConsumer(rel)) continue;
          if (pathMayOwnMobileOpsNativeTypes(rel)) continue;
          const source = readFileSync(full, "utf8");
          // Strip string-literal instruction prose heuristically: only flag
          // non-string-looking argv construction by checking for leak symbols
          // outside obvious quoted instruction blocks is hard; use symbol list
          // that targets code patterns (spawn("mobai", createMobai as MOT, etc.).
          const leaks = sourceImportsMobileOpsNativeLeak(source);
          if (leaks.length > 0) offenders.push(`${rel}: ${leaks.join(",")}`);
          if (looksLikeSecondDeviceRouterFactory(source)) offenders.push(`${rel}: second-router`);
        }
      };
      walk(root);
    }
    assert(offenders.length === 0, `mobile-ops native leakage: ${offenders.join("; ")}`);
    assert(MOBILE_OPS_NATIVE_LEAK_SYMBOLS.length >= 5, "leak symbol list non-empty");
  });

  harness.check("mobile-ops-canonical: core workflow names canonical ops; recipe host-native alone", () => {
    const ladder = workflowById(MOBILE_OPS_CORE_WORKFLOW_ID);
    assert(ladder.instructions.includes("b2c/mobile-app-operation"), "Route Ladder names canonical capability");
    for (const op of MOBILE_OPS_CANONICAL_OPERATION_IDS) {
      assert(
        ladder.instructions.includes(op) || ladder.instructions.includes("mobile app operation") || ladder.instructions.includes("mobile-app-operation"),
        `workflow mentions mobile ops surface for ${op}`,
      );
    }
    // Stronger: instructions must name the five op IDs or the shared prefix explicitly.
    assert(
      ladder.instructions.includes("b2c/mobile-app-operation.launch") ||
        ladder.instructions.includes("b2c/mobile-app-operation.{launch") ||
        ladder.instructions.includes("mobile-app-operation.{launch,inspect,interact,capture-screenshot,record-video}"),
      "workflow names canonical operation set",
    );
    const recipe = firstpartyRecipes.find((r) => r.id === MOBILE_OPS_CAPTURE_RECIPE_ID);
    assert(recipe !== undefined, "capture recipe present");
    assert(
      recipe!.operations.every((op) => op.implementation.startsWith("b2c/host-native-mobile.")),
      "recipe defaults to host-native alone",
    );
    assert(!recipe!.operations.some((op) => op.implementation.startsWith("b2c/mobai.")), "recipe does not require MobAI");
    const hostImpls = firstpartyImplementations.filter((impl) => impl.provider === MOBILE_OPS_HOST_NATIVE_PROVIDER_ID);
    const mobaiImpls = firstpartyImplementations.filter((impl) => impl.provider === MOBILE_OPS_MOBAI_PROVIDER_ID);
    assert(hostImpls.length === 5, "five host-native impls");
    assert(mobaiImpls.length === 5, "five mobai declaration impls");
  });

  harness.check("mobile-ops-canonical: host-native alone; Expo/MobAI not required when host covers", () => {
    const ok = hostNativeAloneBlocked({ hostNativeCoversRequest: true, requireExpo: false, requireMobai: false });
    assert(ok.blocked === false, "host alone ok");
    const badExpo = hostNativeAloneBlocked({ hostNativeCoversRequest: true, requireExpo: true, requireMobai: false });
    assert(badExpo.blocked === true, "must not require Expo");
    const badMobai = hostNativeAloneBlocked({ hostNativeCoversRequest: true, requireExpo: false, requireMobai: true });
    assert(badMobai.blocked === true, "must not require MobAI");
    const otherOk = hostNativeAloneBlocked({ hostNativeCoversRequest: false, requireExpo: false, requireMobai: true });
    assert(otherOk.blocked === false, "when host insufficient, selecting MobAI is ok");
    const hostRow = mobileOpsCanonicalMapRow("host-native-launch");
    assert(hostRow.authorityClass === "host-native-alone", "launch is host-native-alone authority");
  });

  harness.check("mobile-ops-canonical: Expo MCP non-auto-expand; no MOT; live held", () => {
    const drift = classifySchemaDriftRefuse();
    assert(drift.action === "refuse-schema-drift", drift.reason);
    assert(drift.allowAutoExpandOps === false, "no auto-expand");
    const neu = classifyNewToolAutoExpandRefuse();
    assert(neu.action === "refuse-schema-drift", neu.reason);
    assert(neu.allowAutoExpandOps === false, "new tool not auto-granted");
    const assessed = assessExpoMcpRoute({
      selected: true,
      connected: true,
      toolName: "expo_app_capture",
      observedSchemaVersion: "upstream-drift-v99",
      preferHostNative: true,
      hostNativeCoversTask: false,
    });
    assert(assessed.addsMobileOperationTransport === false, "no Expo MOT");
    assert(assessed.refuseReason === "schema-drift-requires-review" || assessed.executePermission === "denied", assessed.notes);
    const newTool = assessExpoMcpRoute({
      selected: true,
      connected: true,
      toolName: "expo_brand_new_effect",
      newlyExposedUpstreamTool: true,
      observedSchemaVersion: EXPO_MCP_SCHEMA_VERSION_REVIEWED,
    });
    assert(newTool.refuseReason === "new-tool-not-auto-granted" || newTool.executePermission === "denied", newTool.notes);
    assert(EXPO_MCP_ROUTE_NOTES.noTransport.includes("MobileOperationTransport"), "notes forbid MOT");
    const driftRow = mobileOpsCanonicalMapRow("expo-mcp-schema-drift");
    assert(driftRow.disposition === "reject", "schema drift rejected in map");
  });

  harness.check("mobile-ops-canonical: wrong/stale/unsupported identity fail-closed via shared contract", () => {
    const now = new Date();
    const target = fixtureTarget();
    const support: MobileSupport = {
      providerId: MOBILE_OPS_HOST_NATIVE_PROVIDER_ID,
      availability: "available",
      checkedAt: now.toISOString(),
      source: "fixture",
      tuples: [{ platform: "ios", deviceKind: "simulator", operations: [...MOBILE_OPERATION_IDS] }],
      limitations: ["fixture"],
    };
    const request: MobileRequest = {
      providerId: MOBILE_OPS_HOST_NATIVE_PROVIDER_ID,
      operation: "b2c/mobile-app-operation.launch",
      target,
      requestedAt: now.toISOString(),
      purpose: "exploration",
      stateId: "state-1",
    };
    requireMobileSupport(request, support, now);

    let mismatch = false;
    try {
      requireMobileSupport({ ...request, providerId: MOBILE_OPS_MOBAI_PROVIDER_ID }, support, now);
    } catch (error) {
      mismatch = String(error).includes("mobile.explicit_provider_mismatch");
    }
    assert(mismatch, "provider mismatch refuses (no silent fallback)");

    let unsupported = false;
    try {
      requireMobileSupport(
        { ...request, operation: "b2c/mobile-app-operation.interact" },
        {
          ...support,
          tuples: [{ platform: "ios", deviceKind: "simulator", operations: ["b2c/mobile-app-operation.launch"] }],
        },
        now,
      );
    } catch (error) {
      unsupported = String(error).includes("mobile.unsupported_target_operation");
    }
    assert(unsupported, "unsupported interact on host tuple refuses");

    const wrong = classifyWrongMobileTarget(
      "launch",
      { providerId: MOBILE_OPS_HOST_NATIVE_PROVIDER_ID, operation: request.operation, target, stateId: "state-1" },
      {
        providerId: MOBILE_OPS_HOST_NATIVE_PROVIDER_ID,
        operation: request.operation,
        target: fixtureTarget({ appId: "com.other.app" }),
        stateId: "state-1",
      },
    );
    assert(wrong.action === "fail-closed", "wrong app fails closed");
    assert(targetsMatch(target, target) === true, "identical targets match");

    const stale = classifyMobileOpsFailSafe({
      opClass: "capture-screenshot",
      targetMatchesMandate: true,
      staleCaptureOrProof: true,
      unsupportedHostOrPlatform: false,
      schemaDrift: false,
      newlyExposedUpstreamTool: false,
      interactionUncertainOrPartial: false,
      interactionInterrupted: false,
      concurrentOwnership: false,
      knownSafeFailure: false,
      explicitReplanRequested: false,
      silentProviderFallbackAttempted: false,
      captureUsedAsAcceptance: false,
      authorityGranted: true,
    });
    assert(stale.action === "hold-stale", "stale capture held");

    const concurrent = classifyMobileOpsFailSafe({
      opClass: "interact",
      targetMatchesMandate: true,
      staleCaptureOrProof: false,
      unsupportedHostOrPlatform: false,
      schemaDrift: false,
      newlyExposedUpstreamTool: false,
      interactionUncertainOrPartial: false,
      interactionInterrupted: false,
      concurrentOwnership: true,
      knownSafeFailure: false,
      explicitReplanRequested: false,
      silentProviderFallbackAttempted: false,
      captureUsedAsAcceptance: false,
      authorityGranted: true,
    });
    assert(concurrent.action === "hold-concurrent", "concurrent ownership held");
  });

  harness.check("mobile-ops-canonical: uncertain interaction ≠ silent fallback; explicit replan only", () => {
    const uncertain = classifyUncertainInteractionNoSilentFallback();
    assert(uncertain.action === "refuse-uncertain-fallback", uncertain.reason);
    assert(uncertain.allowSilentFallback === false, "no silent fallback");

    const replan = classifyExplicitReplanAfterKnownSafeFailure();
    assert(replan.action === "explicit-replan", replan.reason);
    assert(replan.allowSilentFallback === false, "replan is explicit, not silent");

    const knownSafeNoReplan = classifyMobileOpsFailSafe({
      opClass: "launch",
      targetMatchesMandate: true,
      staleCaptureOrProof: false,
      unsupportedHostOrPlatform: false,
      schemaDrift: false,
      newlyExposedUpstreamTool: false,
      interactionUncertainOrPartial: false,
      interactionInterrupted: false,
      concurrentOwnership: false,
      knownSafeFailure: true,
      explicitReplanRequested: false,
      silentProviderFallbackAttempted: false,
      captureUsedAsAcceptance: false,
      authorityGranted: true,
    });
    assert(knownSafeNoReplan.action === "fail-closed", "known-safe failure without explicit replan fails closed");

    const now = new Date();
    const target = fixtureTarget();
    const request: MobileRequest = {
      providerId: MOBILE_OPS_HOST_NATIVE_PROVIDER_ID,
      operation: "b2c/mobile-app-operation.launch",
      target,
      requestedAt: now.toISOString(),
      purpose: "exploration",
      stateId: "state-1",
    };
    let interrupted = false;
    try {
      normalizeMobileObservation(
        request,
        {
          providerId: request.providerId,
          operation: request.operation,
          target,
          executionId: "exec-1",
          observedAt: now.toISOString(),
          source: "fixture",
          completion: "interrupted",
          observations: ["partial"],
          actionsCompleted: 0,
        },
        now,
      );
    } catch (error) {
      interrupted = String(error).includes("mobile.interrupted_effect_uncertain");
    }
    assert(interrupted, "interrupted observation throws uncertain (no silent continue)");
  });

  harness.check("mobile-ops-canonical: captures ≠ acceptance; acceptance fields stay false", () => {
    const refuse = classifyCaptureAsAcceptanceRefuse();
    assert(refuse.action === "fail-closed", refuse.reason);
    assert(refuse.acceptanceFromCapture === false, "acceptance never from capture");

    const now = new Date();
    const target = fixtureTarget();
    const request: MobileRequest = {
      providerId: MOBILE_OPS_HOST_NATIVE_PROVIDER_ID,
      operation: "b2c/mobile-app-operation.capture-screenshot",
      target,
      requestedAt: now.toISOString(),
      purpose: "marketing-source",
      stateId: "screen-1",
    };
    const result = normalizeMobileObservation(
      request,
      {
        providerId: request.providerId,
        operation: request.operation,
        target,
        executionId: "exec-cap",
        observedAt: now.toISOString(),
        source: "fixture",
        completion: "completed",
        observations: ["captured"],
        actionsCompleted: 0,
        capture: {
          artifactId: "cap-1",
          sha256: "b".repeat(64),
          mimeType: "image/png",
          width: 100,
          height: 200,
          stateId: "screen-1",
          source: "app-pixels",
        },
      },
      now,
    );
    assert(result.acceptance.functional === false, "functional false");
    assert(result.acceptance.accessibility === false, "a11y false");
    assert(result.acceptance.design === false, "design false");
    assert(result.acceptance.backend === false, "backend false");
    assert(result.acceptance.release === false, "release false");
    assert(result.marketingStatus === "raw-source", "marketing raw-source only");
  });

  harness.check("mobile-ops-canonical: single createMobileOperationRoute bind pattern; MobAI remains DeviceProofAdapter", () => {
    const mot = readFileSync(MOT_ADAPTER, "utf8");
    assert(mot.includes("export function createMobileOperationRoute"), "single factory export");
    assert(mot.includes("Bind one transport"), "documents one transport bind");
    const proof = readFileSync(DEVICE_PROOF, "utf8");
    assert(proof.includes("createMobaiCliAdapter"), "MobAI adapter present");
    assert(proof.includes("DeviceProofAdapter"), "returns DeviceProofAdapter");
    assert(!/createMobileOperationRoute\s*\(\s*\{[^}]*createMobaiCliAdapter/.test(proof), "device-proof does not wrap MobAI as MOT route");
    // Re-export of createMobileOperationRoute from device-proof is helpers only.
    assert(proof.includes('from "./mobile-operation.js"'), "device-proof re-exports MOT helpers without wrapping MobAI");
  });
}

function deviceProofSource(): string {
  return readFileSync(path.join(skillRoot, MOBAI_DEVICE_PROOF_MODULE), "utf8");
}
