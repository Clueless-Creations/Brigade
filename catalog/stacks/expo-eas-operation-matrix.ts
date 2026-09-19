/**
 * Expo #84 EAS operation/effect matrix.
 *
 * Rows record selected tool/version, typed argv/results, host/project/profile/platform,
 * local execution, uploads, cost, credentials, approval, remote job ID, readback/retry,
 * and proof honesty. Live cloud/device/store rows stay held. Credential-mutating commands
 * stay deliberately-excluded. This module does not spawn processes or claim live proof.
 *
 * Consumed alongside `expo-eas-commands.ts`. Extends the #84 executor landings — does not
 * rebuild argv/process/preflight/decode/jobs/effects/store-handoff.
 */

import type { ExpoEasCommandId, ExpoEasTool } from "./expo-eas-commands.js";
import type { ExpoOperationId } from "./expo-selection.js";

/** Mirrors EAS_CLI_DOCUMENTED_VERSION without importing the commands module value (avoids a cycle). */
const EAS_CLI_DOCUMENTED_VERSION = "23.2.0" as const;

export const EXPO_EAS_OPERATION_MATRIX_PATH = "catalog/stacks/expo-eas-operation-matrix.ts" as const;

export type ExpoEasOperationMatrixId =
  | "eas-local-build"
  | "eas-cloud-build"
  | "eas-workflows"
  | "store-handoff"
  | "credential-mutating"
  | "doctor-intake"
  | "direct-local-compile"
  | "device-install";

export type ExpoEasOperationProofTier = "fixture-tested" | "held" | "deliberately-excluded";

/**
 * Identities stay distinct. Collapsing any pair is a classification error.
 */
export const EXPO_EAS_DISTINCT_IDENTITIES = ["Expo CLI", "EAS CLI", "Expo account", "store account", "signing material", "app runtime"] as const;

export interface ExpoEasOperationMatrixRow {
  readonly id: ExpoEasOperationMatrixId;
  /** Selection op when one maps cleanly; null for aggregate/doctor/device rows. */
  readonly operationId: ExpoOperationId | null;
  /** Primary command ids this row summarizes. */
  readonly commandIds: readonly ExpoEasCommandId[];
  readonly tool: ExpoEasTool | "host-toolchain" | "none";
  readonly toolVersion: string;
  readonly typedArgvAndResults: string;
  readonly hostProjectProfilePlatform: string;
  readonly localExecution: string;
  readonly uploads: string;
  readonly cost: string;
  readonly credentials: string;
  readonly approval: string;
  readonly remoteJobId: string;
  readonly readbackRetry: string;
  readonly proofTier: ExpoEasOperationProofTier;
  readonly proofScopeNotes: string;
  readonly liveMutation: false;
}

export const EXPO_EAS_OPERATION_MATRIX: readonly ExpoEasOperationMatrixRow[] = [
  {
    id: "eas-local-build",
    operationId: "eas-local-build",
    commandIds: ["eas.build.local"],
    tool: "eas-cli",
    toolVersion: EAS_CLI_DOCUMENTED_VERSION,
    typedArgvAndResults: "Typed argv via buildExpoEasArgv; decode envelopes for local build JSON. Non-interactive dispatch passes --freeze-credentials.",
    hostProjectProfilePlatform: "Requires linked project + profile + platform. Host toolchain still needed for native compile (Xcode / Android SDK).",
    localExecution: "EAS --local may still auth and project-check; not fully offline; not identical to expo run:* / direct local compile.",
    uploads: "May download managed credentials; not a cloud source upload for remote builders.",
    cost: "No paid cloud build credits; host CPU/time only. Live local compile remains held.",
    credentials: "Dispatch freezes credentials. Silent credential write refused. Secrets never in argv/logs/JS bundle.",
    approval: "Requires compile authority. --non-interactive / --yes are not permission.",
    remoteJobId: "Local path does not establish a paid remote job id.",
    readbackRetry: "Fixture-tested classification only. Live host toolchain readback not-run.",
    proofTier: "fixture-tested",
    proofScopeNotes: "Fixture-tested argv/effects/preflight. Live EAS local compile held (U2 transfer). Direct local ≠ EAS --local ≠ EAS cloud. Linux ≠ Xcode.",
    liveMutation: false,
  },
  {
    id: "eas-cloud-build",
    operationId: "eas-cloud-build",
    commandIds: ["eas.build.cloud"],
    tool: "eas-cli",
    toolVersion: EAS_CLI_DOCUMENTED_VERSION,
    typedArgvAndResults: "Typed argv; fake-transport decode for build / build:view. Persist remote job id before spawn.",
    hostProjectProfilePlatform: "Host/project/profile/platform bound into job identity. Wrong project/profile refuses before remote effect.",
    localExecution: "Remote builders execute; local hooks may still run. Not a direct local compile proof.",
    uploads: "Source upload + .easignore inspection before remote work (fixture-level).",
    cost: "May consume EAS credits. Paid live cloud held unless HoE authorizes a named journey.",
    credentials: "--freeze-credentials on dispatch. No silent credential sync/write.",
    approval: "Requires spend authority. Nested auto-submit cannot ride a build grant.",
    remoteJobId: "Immutable binding + ledger; reconcile-before-retry; no duplicate paid spawn.",
    readbackRetry: "Fixture-tested with fake jobs. Live paid job/artifact not-run.",
    proofTier: "fixture-tested",
    proofScopeNotes: "Fixture-tested upload/credits/reconcile. Live paid EAS cloud build held. Fake transport success ≠ cloud proof.",
    liveMutation: false,
  },
  {
    id: "eas-workflows",
    operationId: "eas-workflows",
    commandIds: ["eas.workflow.validate", "eas.workflow.run", "eas.workflow.status", "eas.workflow.runs"],
    tool: "eas-cli",
    toolVersion: EAS_CLI_DOCUMENTED_VERSION,
    typedArgvAndResults: "Reviewed `.eas/workflows/` templates only. Unknown job types hold.",
    hostProjectProfilePlatform: "Workflow relative path must stay under selected app `.eas/workflows/`.",
    localExecution: "Job runner only — not a second business orchestrator.",
    uploads: "Workflow runs may upload/build like cloud jobs.",
    cost: "Nested cloud credits possible. Live workflow spend held.",
    credentials: "Credential mutation still excluded; nested submit/update/deploy gated separately.",
    approval: "Aggregate nested-effect gate before launch. Default push/PR/schedule triggers refused without allowTriggers.",
    remoteJobId: "Workflow run ids persist like build jobs when spawned.",
    readbackRetry: "Fixture-tested nested closure. Live workflow run not-run.",
    proofTier: "fixture-tested",
    proofScopeNotes:
      "Nested submit/update/deploy/trigger effects fixture-tested. Auto-submit/OTA/deploy exceeding build grant held. #85/#86 stay labeled-unavailable.",
    liveMutation: false,
  },
  {
    id: "store-handoff",
    operationId: "store-handoff",
    commandIds: ["eas.submit", "eas.submit.list", "eas.submit.view"],
    tool: "eas-cli",
    toolVersion: EAS_CLI_DOCUMENTED_VERSION,
    typedArgvAndResults: "Dry-run stage interpreter: compiled-artifact → uploaded-binary → testing-track → submitted-for-review → approved → released.",
    hostProjectProfilePlatform: "Platform-specific: Apple ≠ Google. Track settings stay distinct.",
    localExecution: "None for submit itself beyond CLI spawn classification.",
    uploads: "Binary upload to store is a submit effect — live held.",
    cost: "Store submit is authority-gated; not covered by build spend alone.",
    credentials: "Store account ≠ Expo account ≠ signing material. Secrets never in argv/logs.",
    approval: "Requires submit authority. EAS submit finished ≠ TestFlight ≠ approved ≠ released.",
    remoteJobId: "Submit job ids when live; dry-run fixtures do not claim release.",
    readbackRetry: "Fixture-tested stage honesty. Live App Store / Play submit held.",
    proofTier: "fixture-tested",
    proofScopeNotes:
      "Dry-run stage contracts fixture-tested. Live store submit held. Existing ASC/Play owners remain authoritative. Metadata/privacy/pricing stay with those owners.",
    liveMutation: false,
  },
  {
    id: "credential-mutating",
    operationId: null,
    commandIds: ["eas.init", "eas.credentials", "eas.credentials.configure-build", "eas.device.create", "eas.env.exec"],
    tool: "eas-cli",
    toolVersion: EAS_CLI_DOCUMENTED_VERSION,
    typedArgvAndResults: "Commands classified only. Executor does not spawn them.",
    hostProjectProfilePlatform: "N/A — deliberately excluded from dispatch.",
    localExecution: "eas.env.exec is arbitrary shell — refused.",
    uploads: "None from this catalog path.",
    cost: "Excluded rather than spent.",
    credentials:
      "Write-excluded. Signing readiness models refuse silent write, auto-create, and auto-revoke. --freeze-credentials remains the build dispatch posture.",
    approval: "Would require mutate authority if ever enabled; currently deliberately-excluded.",
    remoteJobId: "None.",
    readbackRetry: "Inspect/signing-readiness only — no credential sync side effects.",
    proofTier: "deliberately-excluded",
    proofScopeNotes:
      "eas.init / credentials* / device.create / env.exec stay deliberately-excluded. Passive doctor must not log in, register devices, or sync credentials.",
    liveMutation: false,
  },
  {
    id: "doctor-intake",
    operationId: null,
    commandIds: ["expo.version", "eas.whoami"],
    tool: "eas-cli",
    toolVersion: EAS_CLI_DOCUMENTED_VERSION,
    typedArgvAndResults: "Version-only / selected-target passive probes. No dynamic config evaluation.",
    hostProjectProfilePlatform: "Reports missing CLI, wrong version, missing auth as holds — does not install or log in.",
    localExecution: "None beyond --version style probes.",
    uploads: "None.",
    cost: "None.",
    credentials: "Missing auth → truthful hold. Credential files are not read to prove login.",
    approval: "Observe/none only.",
    remoteJobId: "None.",
    readbackRetry: "Doctor missing-CLI warn path fixture-tested. CI greens without EXPO_TOKEN / host eas.",
    proofTier: "fixture-tested",
    proofScopeNotes:
      "Passive intake. No eas init, no login, no credential sync, no plugin evaluation. Green CI must not require Expo account or host eas binary.",
    liveMutation: false,
  },
  {
    id: "direct-local-compile",
    operationId: "direct-local-compile",
    commandIds: ["expo.run.ios", "expo.run.android"],
    tool: "expo-cli",
    toolVersion: "docs-retrieved",
    typedArgvAndResults: "Host OS / Xcode / Android SDK requirements classified. Not EAS --local.",
    hostProjectProfilePlatform: "iOS local needs macOS+Xcode. Linux cannot claim Xcode ran.",
    localExecution: "Direct native compile on developer host — distinct from EAS local and EAS cloud.",
    uploads: "None for the compile itself.",
    cost: "Host resources only.",
    credentials: "Signing identity may be required for device; never silently created here.",
    approval: "Compile authority when enabled; live path held.",
    remoteJobId: "None.",
    readbackRetry: "Fixture-tested host-mode classification. Live Xcode/Gradle compile held (U2 transfer).",
    proofTier: "held",
    proofScopeNotes: "Direct local ≠ EAS --local ≠ EAS cloud. Live compile held on #84/#88. Linux ≠ Xcode.",
    liveMutation: false,
  },
  {
    id: "device-install",
    operationId: null,
    commandIds: ["expo.run.ios", "expo.run.android"],
    tool: "host-toolchain",
    toolVersion: "n/a",
    typedArgvAndResults: "Install/run on simulator or device is a separate proof from compile classification.",
    hostProjectProfilePlatform: "Physical device needs signing identity; simulator needs host toolchain.",
    localExecution: "Device/simulator install held — not proven by fixture argv.",
    uploads: "None.",
    cost: "None in fixtures.",
    credentials: "Device registration (eas.device.create) deliberately-excluded.",
    approval: "Explicit hold — U2 transfer to #84/#88.",
    remoteJobId: "None.",
    readbackRetry: "Not-run. Do not fake green.",
    proofTier: "held",
    proofScopeNotes: "Device/simulator install held. Expo Go is not the acceptance path for this boundary.",
    liveMutation: false,
  },
] as const satisfies readonly ExpoEasOperationMatrixRow[];

export const EXPO_EAS_OPERATION_MATRIX_REQUIRED_IDS = [
  "eas-local-build",
  "eas-cloud-build",
  "eas-workflows",
  "store-handoff",
  "credential-mutating",
  "doctor-intake",
  "direct-local-compile",
  "device-install",
] as const satisfies readonly ExpoEasOperationMatrixId[];

export function expoEasOperationMatrixRows(): readonly ExpoEasOperationMatrixRow[] {
  return EXPO_EAS_OPERATION_MATRIX;
}

export function expoEasOperationMatrixRow(id: ExpoEasOperationMatrixId): ExpoEasOperationMatrixRow {
  const row = EXPO_EAS_OPERATION_MATRIX.find((entry) => entry.id === id);
  if (!row) throw new Error(`unknown EAS operation matrix id: ${id}`);
  return row;
}

export function getExpoEasOperationMatrix(): readonly ExpoEasOperationMatrixRow[] {
  return expoEasOperationMatrixRows();
}
