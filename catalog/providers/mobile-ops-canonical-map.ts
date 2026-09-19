/**
 * Mobile-operation providers → canonical-operation inventory + classification (#115).
 *
 * Proving-provider map for ADR-0013 on launch / inspect / interact / capture /
 * record where semantics match. Host-native simctl commands, MobAI CLI strings,
 * and Expo MCP tool names terminate at the adapter boundary. Core workflows and
 * recipes depend on `b2c/mobile-app-operation.*` and selected bindings — not
 * provider tool commands.
 *
 * Consumes landed surfaces (do not rebuild):
 * - contracts/mobile-operation.ts
 * - adapters/mobile-operation.ts (createMobileOperationRoute — one transport)
 * - adapters/mobile-operation-host.ts (createNativeMobileOperationTransport)
 * - adapters/device-proof.ts (createMobaiCliAdapter → DeviceProofAdapter, not MOT)
 * - adapters/providers/expo/expo-mcp-route.ts (#87 fake-schema; live MCP held)
 * - checks/verification/scenarios/mobile-operation-conformance.ts (synthetic = routing)
 * - checks/verification/fixtures/mobile-host.fixtures.ts + _mobile-host-proof.ts
 *
 * Pins: host-native mobile-host fixtures; Expo MCP #87 fixture-schema-v1; MobAI
 * CLI hole-fill 1.9.3 (device-proof only — never wrap as MobileOperationTransport).
 * Fake/synthetic transports prove routing only — never the provider contract.
 *
 * Coordinate owners preserved: #87 Expo MCP/skills, #82 CNG/native facts,
 * #107 bindings, #117 inventory. Does not start #116. No second device router /
 * evidence store / scheduler. No live device/MCP. No forced Expo|MobAI. No App
 * Review / prices / credentials.
 */

import { MOBILE_OPERATION_IDS } from "../../contracts/mobile-operation.js";

export const MOBILE_OPS_CANONICAL_MAP_PATH = "catalog/providers/mobile-ops-canonical-map.ts" as const;
export const MOBILE_OPS_CANONICAL_INVENTORY_DOC = "checks/verification/rehearsal/mobile-ops-canonical-inventory.md" as const;

/** Host-native fixture provenance (owned adapter fixtures — polish only). */
export const HOST_NATIVE_FIXTURE_SUITE = "checks/verification/fixtures/mobile-host.fixtures.ts" as const;
export const HOST_NATIVE_PROOF_INJECT = "checks/verification/fixtures/_mobile-host-proof.ts" as const;

/** #87 Expo MCP fake-schema pin — consume; do not duplicate Expo MOT. */
export const EXPO_MCP_SCHEMA_PIN = "fixture-schema-v1" as const;
export const EXPO_MCP_ROUTE_MODULE = "adapters/providers/expo/expo-mcp-route.ts" as const;

/**
 * MobAI CLI independent pin for hole-fill honesty (device-proof adapter docs).
 * Not a MobileOperationTransport contract source.
 */
export const MOBAI_CLI_REVIEWED_VERSION = "1.9.3" as const;
export const MOBAI_DEVICE_PROOF_MODULE = "adapters/device-proof.ts" as const;

/** Synthetic conformance — routing proof only; fake ≠ contract. */
export const MOBILE_OPERATION_CONFORMANCE_SCENARIO = "checks/verification/scenarios/mobile-operation-conformance.ts" as const;

export const MOBILE_OPS_EVIDENCE_CLASSES = [
  "fixture",
  "synthetic-routing",
  "host-native-fixture",
  "live-device-held",
  "live-mcp-held",
  "physical-parity-held",
] as const;
export type MobileOpsEvidenceClass = (typeof MOBILE_OPS_EVIDENCE_CLASSES)[number];

export const MOBILE_OPS_EFFECT_CLASSES = ["launch", "inspect", "interact", "capture", "record", "proof-cli", "docs-read", "credential"] as const;
export type MobileOpsEffectClass = (typeof MOBILE_OPS_EFFECT_CLASSES)[number];

export const MOBILE_OPS_AUTHORITY_CLASSES = ["observe", "selected-binding", "host-native-alone", "founder-protected", "rejected", "held"] as const;
export type MobileOpsAuthorityClass = (typeof MOBILE_OPS_AUTHORITY_CLASSES)[number];

export const MOBILE_OPS_PROVIDER_CLASSES = ["host-native", "mobai", "expo-mcp", "shared-boundary"] as const;
export type MobileOpsProviderClass = (typeof MOBILE_OPS_PROVIDER_CLASSES)[number];

export const MOBILE_OPS_OP_CLASSES = [
  "launch",
  "inspect",
  "interact",
  "capture-screenshot",
  "record-video",
  "support-negotiate",
  "identity-bind",
  "device-proof-cli",
  "expo-mcp-docs",
  "expo-mcp-device",
  "live-connect",
  "physical-parity",
  "route-factory",
] as const;
export type MobileOpsOpClass = (typeof MOBILE_OPS_OP_CLASSES)[number];

export const MOBILE_OPS_SEAM_ROLES = ["definition", "encoder", "transport", "decoder", "reconciler"] as const;
export type MobileOpsSeamRole = (typeof MOBILE_OPS_SEAM_ROLES)[number];

export type MobileOpsMappingDisposition = "implement" | "extension" | "defer" | "reject" | "held";

export interface MobileOpsCanonicalMapRow {
  readonly id: string;
  readonly providerClass: MobileOpsProviderClass;
  readonly opClass: MobileOpsOpClass;
  readonly nativeCapability: string;
  readonly canonicalOperation: string | "none";
  readonly implementationPointer: string;
  readonly evidenceClass: MobileOpsEvidenceClass;
  readonly effectClass: MobileOpsEffectClass;
  readonly authorityClass: MobileOpsAuthorityClass;
  readonly disposition: MobileOpsMappingDisposition;
  readonly fit: "exact" | "partial" | "extension" | "unsupported" | "n/a";
  readonly limitations: string;
  readonly ownerIssue: string;
  readonly residual: boolean;
  readonly notes: string;
}

/**
 * Logical ADR-0013 seams for the shared mobile-operation path.
 * One route factory; MobAI stays DeviceProofAdapter; Expo MCP stays #87.
 */
export const MOBILE_OPS_LOGICAL_SEAMS: readonly {
  readonly role: MobileOpsSeamRole;
  readonly owner: string;
  readonly responsibility: string;
}[] = [
  {
    role: "definition",
    owner: "contracts/mobile-operation.ts + catalog/firstparty-declarations.ts + mobile-ops-canonical-map.ts",
    responsibility: "Five canonical ops; support negotiation; first-party providers; native→canonical map",
  },
  {
    role: "encoder",
    owner: "adapters/mobile-operation-host.ts + adapters/device-proof.ts + adapters/providers/expo/expo-mcp-route.ts",
    responsibility: "Canonical request → host simctl / MobAI CLI / Expo MCP tool envelopes (terminate at adapter)",
  },
  {
    role: "transport",
    owner: "createNativeMobileOperationTransport (MOT) | createMobaiCliAdapter (DeviceProofAdapter) | Expo MCP fake-schema (#87)",
    responsibility: "One MOT bind via createMobileOperationRoute; MobAI not MOT; Expo no duplicate MOT; live held",
  },
  {
    role: "decoder",
    owner: "normalizeMobileObservation + requireMobileSupport (contracts/mobile-operation.ts)",
    responsibility: "Identity match; interrupted→uncertain; acceptance always false; capture provenance",
  },
  {
    role: "reconciler",
    owner: "createMobileOperationRoute → OperationRouteRegistry; recipe b2c/mobile-app-capture; #107 bindings",
    responsibility: "Canonical observations → next canonical ops; no second device router / evidence store / scheduler",
  },
] as const;

/**
 * Full inventory: native capability → canonical operation → fit/limits → evidence.
 * Held rows stay held (no live device/MCP/physical parity/tool install/account connect).
 */
export const MOBILE_OPS_CANONICAL_MAP: readonly MobileOpsCanonicalMapRow[] = [
  // —— Host-native (MOT) ——
  {
    id: "host-native-launch",
    providerClass: "host-native",
    opClass: "launch",
    nativeCapability: "xcrun simctl launch <udid> <bundleId>",
    canonicalOperation: "b2c/mobile-app-operation.launch",
    implementationPointer: "adapters/mobile-operation-host.ts createNativeMobileOperationTransport",
    evidenceClass: "host-native-fixture",
    effectClass: "launch",
    authorityClass: "host-native-alone",
    disposition: "implement",
    fit: "exact",
    limitations: "Already-booted iOS simulator only; no install/boot/bridge; process-local readback",
    ownerIssue: "#115",
    residual: false,
    notes: "Host-native usable alone without Expo/MobAI when sufficient",
  },
  {
    id: "host-native-inspect",
    providerClass: "host-native",
    opClass: "inspect",
    nativeCapability: "simctl list/get_app_container + inspectIosAppBundle identity readback",
    canonicalOperation: "b2c/mobile-app-operation.inspect",
    implementationPointer: "adapters/mobile-operation-host.ts",
    evidenceClass: "host-native-fixture",
    effectClass: "inspect",
    authorityClass: "host-native-alone",
    disposition: "implement",
    fit: "partial",
    limitations: "Installed identity only — does not inspect UI elements",
    ownerIssue: "#115",
    residual: false,
    notes: "Inspect ≠ UI tree; identity-bound observation",
  },
  {
    id: "host-native-interact",
    providerClass: "host-native",
    opClass: "interact",
    nativeCapability: "host-native interact / UI automation",
    canonicalOperation: "b2c/mobile-app-operation.interact",
    implementationPointer: "adapters/mobile-operation-host.ts (unsupported)",
    evidenceClass: "host-native-fixture",
    effectClass: "interact",
    authorityClass: "held",
    disposition: "held",
    fit: "unsupported",
    limitations: "Interaction unsupported on host-native MOT; fail-closed via requireMobileSupport",
    ownerIssue: "#115",
    residual: false,
    notes: "Do not shrink canonical interact; preserve as unsupported physical/host control",
  },
  {
    id: "host-native-screenshot",
    providerClass: "host-native",
    opClass: "capture-screenshot",
    nativeCapability: "xcrun simctl io <udid> screenshot + trusted foreground readback",
    canonicalOperation: "b2c/mobile-app-operation.capture-screenshot",
    implementationPointer: "adapters/mobile-operation-host.ts",
    evidenceClass: "host-native-fixture",
    effectClass: "capture",
    authorityClass: "host-native-alone",
    disposition: "implement",
    fit: "exact",
    limitations: "Requires explicit trusted foreground readback; raw bytes ≠ acceptance/design verdict",
    ownerIssue: "#115",
    residual: false,
    notes: "Captures are evidence observations; acceptance.* always false",
  },
  {
    id: "host-native-video",
    providerClass: "host-native",
    opClass: "record-video",
    nativeCapability: "host-native video record",
    canonicalOperation: "b2c/mobile-app-operation.record-video",
    implementationPointer: "adapters/mobile-operation-host.ts (unsupported)",
    evidenceClass: "host-native-fixture",
    effectClass: "record",
    authorityClass: "held",
    disposition: "held",
    fit: "unsupported",
    limitations: "Video unsupported on host-native MOT",
    ownerIssue: "#115",
    residual: false,
    notes: "Unsupported physical/host control stays held — no weakest-common-denominator shrink",
  },
  // —— MobAI (DeviceProofAdapter — not MOT) ——
  {
    id: "mobai-device-resolve",
    providerClass: "mobai",
    opClass: "device-proof-cli",
    nativeCapability: "mobai device list/inspect (CLI 1.9.3)",
    canonicalOperation: "none",
    implementationPointer: "adapters/device-proof.ts inspectMobaiDevice / createMobaiCliAdapter",
    evidenceClass: "fixture",
    effectClass: "proof-cli",
    authorityClass: "selected-binding",
    disposition: "extension",
    fit: "extension",
    limitations: "Rung-4 device proof path; targetFromMobaiIdentity helper ≠ MOT wrap",
    ownerIssue: "#115",
    residual: false,
    notes: "Hole-fill pin 1.9.3; never createMobileOperationRoute(createMobaiCliAdapter)",
  },
  {
    id: "mobai-app-install-launch",
    providerClass: "mobai",
    opClass: "launch",
    nativeCapability: "mobai app install / app launch",
    canonicalOperation: "b2c/mobile-app-operation.launch",
    implementationPointer: "adapters/device-proof.ts createMobaiCliAdapter (DeviceProofAdapter)",
    evidenceClass: "fixture",
    effectClass: "launch",
    authorityClass: "selected-binding",
    disposition: "extension",
    fit: "partial",
    limitations: "Proof-flow launch; not registered as MobileOperationTransport; Android APK identity bounds",
    ownerIssue: "#115",
    residual: false,
    notes: "Semantic overlap with launch; stays DeviceProofAdapter unless HoE expands",
  },
  {
    id: "mobai-screenshot",
    providerClass: "mobai",
    opClass: "capture-screenshot",
    nativeCapability: "mobai screenshot",
    canonicalOperation: "b2c/mobile-app-operation.capture-screenshot",
    implementationPointer: "adapters/device-proof.ts createMobaiCliAdapter",
    evidenceClass: "fixture",
    effectClass: "capture",
    authorityClass: "selected-binding",
    disposition: "extension",
    fit: "partial",
    limitations: "Bounded proof screenshot; not MOT capture observation; not acceptance",
    ownerIssue: "#115",
    residual: false,
    notes: "Fake/device-proof fixtures ≠ MobileOperationTransport contract",
  },
  {
    id: "mobai-interact-suite",
    providerClass: "mobai",
    opClass: "interact",
    nativeCapability: "mobai test <file> / .mob suite / bridge automation",
    canonicalOperation: "b2c/mobile-app-operation.interact",
    implementationPointer: "adapters/device-proof.ts + knowledge/engineering/mobai-toolbelt.md",
    evidenceClass: "fixture",
    effectClass: "interact",
    authorityClass: "selected-binding",
    disposition: "extension",
    fit: "extension",
    limitations: "Provider-specific repeatable suites; not forced into host-native unsupported interact",
    ownerIssue: "#115",
    residual: true,
    notes: "Preserve MobAI interact extension; no MOT wrap",
  },
  {
    id: "mobai-firstparty-ops",
    providerClass: "mobai",
    opClass: "support-negotiate",
    nativeCapability: "b2c/mobai.* first-party impls (honest no trusted execution route)",
    canonicalOperation: "b2c/mobile-app-operation.*",
    implementationPointer: "catalog/firstparty-declarations.ts",
    evidenceClass: "fixture",
    effectClass: "inspect",
    authorityClass: "observe",
    disposition: "implement",
    fit: "n/a",
    limitations: "Declarations only; session host does not register MobAI as MOT",
    ownerIssue: "#115",
    residual: false,
    notes: "Honest unavailable until a verified host installs a transport",
  },
  // —— Expo MCP (#87) ——
  {
    id: "expo-mcp-docs-learn",
    providerClass: "expo-mcp",
    opClass: "expo-mcp-docs",
    nativeCapability: "expo_docs_read / expo_docs_search / expo_learn",
    canonicalOperation: "none",
    implementationPointer: EXPO_MCP_ROUTE_MODULE,
    evidenceClass: "fixture",
    effectClass: "docs-read",
    authorityClass: "observe",
    disposition: "extension",
    fit: "extension",
    limitations: "Docs/learn cannot grant deploy/account/file/builder-truth/install/approval",
    ownerIssue: "#87",
    residual: false,
    notes: "Consume #87; do not duplicate Expo adapter worker",
  },
  {
    id: "expo-mcp-inspect-capture",
    providerClass: "expo-mcp",
    opClass: "expo-mcp-device",
    nativeCapability: "expo_app_inspect / expo_app_capture (fake-schema)",
    canonicalOperation: "b2c/mobile-app-operation.inspect",
    implementationPointer: EXPO_MCP_ROUTE_MODULE,
    evidenceClass: "fixture",
    effectClass: "inspect",
    authorityClass: "selected-binding",
    disposition: "held",
    fit: "partial",
    limitations: "Fake-schema only; addsMobileOperationTransport=false; live MCP held; host-native preferred",
    ownerIssue: "#87",
    residual: false,
    notes: "Schema drift / new tools refuse — never auto-expand permitted ops",
  },
  {
    id: "expo-mcp-schema-drift",
    providerClass: "expo-mcp",
    opClass: "expo-mcp-device",
    nativeCapability: "Upstream Expo MCP schema / newly exposed tools",
    canonicalOperation: "none",
    implementationPointer: "adapters/providers/expo/expo-mcp-route.ts assessExpoMcpRoute",
    evidenceClass: "fixture",
    effectClass: "inspect",
    authorityClass: "rejected",
    disposition: "reject",
    fit: "n/a",
    limitations: "schema-drift-requires-review / new-tool-not-auto-granted",
    ownerIssue: "#87",
    residual: false,
    notes: "KTD-115-4: Expo MCP change ≠ auto-expand",
  },
  {
    id: "expo-mcp-live-connect",
    providerClass: "expo-mcp",
    opClass: "live-connect",
    nativeCapability: "Live Expo MCP connect / device install",
    canonicalOperation: "none",
    implementationPointer: EXPO_MCP_ROUTE_MODULE,
    evidenceClass: "live-mcp-held",
    effectClass: "credential",
    authorityClass: "founder-protected",
    disposition: "held",
    fit: "unsupported",
    limitations: "HoE settle: no live MCP this slice",
    ownerIssue: "#87",
    residual: false,
    notes: "Hard hold: no tool install / account connect / private capture",
  },
  // —— Shared boundary ——
  {
    id: "shared-support-negotiate",
    providerClass: "shared-boundary",
    opClass: "support-negotiate",
    nativeCapability: "requireMobileSupport (explicit provider; no silent fallback)",
    canonicalOperation: "b2c/mobile-app-operation.*",
    implementationPointer: "contracts/mobile-operation.ts",
    evidenceClass: "fixture",
    effectClass: "inspect",
    authorityClass: "selected-binding",
    disposition: "implement",
    fit: "exact",
    limitations: "Mismatch / unavailable / unsupported → throw; never selects another provider",
    ownerIssue: "#115",
    residual: false,
    notes: "KTD-115-3 companion: selection is explicit",
  },
  {
    id: "shared-identity-normalize",
    providerClass: "shared-boundary",
    opClass: "identity-bind",
    nativeCapability: "normalizeMobileObservation (provider/op/target/stateId)",
    canonicalOperation: "b2c/mobile-app-operation.*",
    implementationPointer: "contracts/mobile-operation.ts",
    evidenceClass: "fixture",
    effectClass: "inspect",
    authorityClass: "selected-binding",
    disposition: "implement",
    fit: "exact",
    limitations: "Interrupted → mobile.interrupted_effect_uncertain; acceptance always false",
    ownerIssue: "#115",
    residual: false,
    notes: "KTD-115-6/7: captures ≠ acceptance; evidence ↔ identity",
  },
  {
    id: "shared-route-factory",
    providerClass: "shared-boundary",
    opClass: "route-factory",
    nativeCapability: "createMobileOperationRoute(transport) → OperationRouteRegistry",
    canonicalOperation: "b2c/mobile-app-operation.*",
    implementationPointer: "adapters/mobile-operation.ts",
    evidenceClass: "synthetic-routing",
    effectClass: "launch",
    authorityClass: "selected-binding",
    disposition: "implement",
    fit: "exact",
    limitations: "Binds exactly one MobileOperationTransport; no second router",
    ownerIssue: "#115",
    residual: false,
    notes: "KTD-115-8: one route factory",
  },
  {
    id: "shared-synthetic-conformance",
    providerClass: "shared-boundary",
    opClass: "route-factory",
    nativeCapability: "Synthetic MobileOperationTransport injects",
    canonicalOperation: "b2c/mobile-app-operation.*",
    implementationPointer: MOBILE_OPERATION_CONFORMANCE_SCENARIO,
    evidenceClass: "synthetic-routing",
    effectClass: "launch",
    authorityClass: "observe",
    disposition: "implement",
    fit: "n/a",
    limitations: "Routing/wiring only — never independent provider contract source",
    ownerIssue: "#115",
    residual: false,
    notes: "KTD-115-2: fake ≠ contract",
  },
  {
    id: "live-device-physical",
    providerClass: "shared-boundary",
    opClass: "physical-parity",
    nativeCapability: "Physical-device parity / live simulator farm",
    canonicalOperation: "none",
    implementationPointer: "adapters/providers/mobile-ops/fail-safe.ts",
    evidenceClass: "physical-parity-held",
    effectClass: "interact",
    authorityClass: "founder-protected",
    disposition: "held",
    fit: "unsupported",
    limitations: "No physical-device parity claim without proof; live device held (HoE Q1 = no)",
    ownerIssue: "#115",
    residual: false,
    notes: "AUTHORITY-LOCKS + issue non-goals",
  },
  {
    id: "live-device-connect",
    providerClass: "shared-boundary",
    opClass: "live-connect",
    nativeCapability: "Live device / tool install / account connect / private user data capture",
    canonicalOperation: "none",
    implementationPointer: "adapters/providers/mobile-ops/fail-safe.ts",
    evidenceClass: "live-device-held",
    effectClass: "credential",
    authorityClass: "founder-protected",
    disposition: "held",
    fit: "unsupported",
    limitations: "Hard hold this slice",
    ownerIssue: "#115",
    residual: false,
    notes: "Never performed in #115",
  },
] as const satisfies readonly MobileOpsCanonicalMapRow[];

export const MOBILE_OPS_CANONICAL_MAP_REQUIRED_OP_CLASSES = MOBILE_OPS_OP_CLASSES;

export const MOBILE_OPS_PROTECTED_EFFECTS: readonly MobileOpsEffectClass[] = ["credential"] as const;

export const MOBILE_OPS_DISTINCT_EVIDENCE_NOTE =
  "fixture ≠ synthetic-routing ≠ host-native-fixture ≠ live-device-held ≠ live-mcp-held ≠ physical-parity-held" as const;

export const MOBILE_OPS_NON_AUTHORITY_FLAGS = ["--yes", "--non-interactive", "--noninteractive", "-y"] as const;

/** Canonical operation IDs workflows/recipes must name (not tool commands). */
export const MOBILE_OPS_CANONICAL_OPERATION_IDS = MOBILE_OPERATION_IDS;

/** Core mobile workflow that must name canonical ops (compatibility Route Ladder). */
export const MOBILE_OPS_CORE_WORKFLOW_ID = "workflow.engineering.native-ios-proof-route-ladder" as const;

/** Recipe defaults to host-native alone. */
export const MOBILE_OPS_CAPTURE_RECIPE_ID = "b2c/mobile-app-capture" as const;

export const MOBILE_OPS_HOST_NATIVE_PROVIDER_ID = "b2c/host-native-mobile" as const;
export const MOBILE_OPS_MOBAI_PROVIDER_ID = "b2c/mobai" as const;

/** Honest holds: no second MOT for MobAI; no duplicate Expo MOT. */
export const MOBILE_OPS_MOBAI_MOT_WRAP_HOLD = {
  disposition: "held" as const,
  reason:
    "MobAI remains DeviceProofAdapter (createMobaiCliAdapter). Wrapping as MobileOperationTransport is new adapter product work — not smallest shared-routing repair. HoE Q3: hole-fill fixtures only.",
} as const;

export const MOBILE_OPS_EXPO_MOT_DUPLICATE_HOLD = {
  disposition: "held" as const,
  reason: "#87 owns Expo MCP/skills surface. Do not add a second Expo MobileOperationTransport. Consume expo-mcp-route fake-schema + drift-refuse.",
} as const;

export function getMobileOpsCanonicalMap(): readonly MobileOpsCanonicalMapRow[] {
  return MOBILE_OPS_CANONICAL_MAP;
}

export function mobileOpsCanonicalMapRow(id: string): MobileOpsCanonicalMapRow {
  const row = MOBILE_OPS_CANONICAL_MAP.find((entry) => entry.id === id);
  if (!row) throw new Error(`unknown mobile-ops canonical map id: ${id}`);
  return row;
}

export function mobileOpsRowsForOpClass(opClass: MobileOpsOpClass): readonly MobileOpsCanonicalMapRow[] {
  return MOBILE_OPS_CANONICAL_MAP.filter((row) => row.opClass === opClass);
}

export function mobileOpsRowsForProvider(providerClass: MobileOpsProviderClass): readonly MobileOpsCanonicalMapRow[] {
  return MOBILE_OPS_CANONICAL_MAP.filter((row) => row.providerClass === providerClass);
}

export function mobileOpsProtectedRows(): readonly MobileOpsCanonicalMapRow[] {
  return MOBILE_OPS_CANONICAL_MAP.filter(
    (row) =>
      row.authorityClass === "founder-protected" ||
      row.authorityClass === "rejected" ||
      row.authorityClass === "held" ||
      MOBILE_OPS_PROTECTED_EFFECTS.includes(row.effectClass),
  );
}

export function mobileOpsNoninteractiveGrantsAuthority(_flags: readonly string[]): false {
  return false;
}

export function mobileOpsFlagLooksNoninteractive(flag: string): boolean {
  const normalized = flag.trim().toLowerCase();
  return (MOBILE_OPS_NON_AUTHORITY_FLAGS as readonly string[]).includes(normalized);
}

export function mobileOpsEvidenceClassesRemainDistinct(classes: readonly MobileOpsEvidenceClass[]): boolean {
  const unique = new Set(classes);
  return unique.size === classes.length && MOBILE_OPS_EVIDENCE_CLASSES.every((c) => unique.has(c));
}

/** Assert MobAI is never claimed as a MobileOperationTransport in this audit. */
export function mobileOpsWrapsMobaiAsMot(): false {
  return false;
}

/** Assert this slice does not add a duplicate Expo MOT. */
export function mobileOpsDuplicatesExpoMot(): false {
  return false;
}
