/**
 * Expo #83 selected-capability matrix from product decisions.
 *
 * Rows record library/version, native rebuild, platforms, credentials, data owner,
 * error recovery, and proof honesty. Nonselected integrations stay absent or
 * selected:false. This module does not install native SDKs or claim live proof.
 *
 * Consumed by `expo-capability-protocol.ts`. Extends #152/#170/#177/#190/#219/#226
 * protocol landings — does not rebuild them.
 */

import type { ShippingPlatform } from "./expo-selection.js";

export const EXPO_CAPABILITY_MATRIX_PATH = "catalog/stacks/expo-capability-matrix.ts" as const;

export type ExpoMatrixCapabilityId =
  "authentication" | "offline-data" | "secure-store" | "device-camera-media" | "push-notifications" | "native-purchases" | "expo-public-secrets";

export type ExpoMatrixProofTier = "fixture-tested" | "blocked" | "held";

export type ExpoMatrixLibrary =
  | { kind: "none"; note: string }
  | { kind: "fixture-seam"; name: string; version: "fixture" | "n/a"; note: string }
  | { kind: "documented"; name: string; version: string; installedInStarter: false; note: string };

export interface ExpoCapabilityMatrixRow {
  id: ExpoMatrixCapabilityId;
  /** Maps to expo-selection / protocol op when applicable. */
  operationId: "authentication" | "offline-data" | "device-capabilities" | "native-purchases" | null;
  selected: boolean;
  library: ExpoMatrixLibrary;
  nativePlugin: boolean;
  rebuildRequired: boolean;
  platforms: readonly ShippingPlatform[];
  credentialsOrPermissions: string;
  dataOwner: string;
  errorRecovery: string;
  proofTier: ExpoMatrixProofTier;
  proofScopeNotes: string;
  nativeStoreProof: false;
  liveMutation: false;
}

/** Selected IdP live journey is held; local-session remains the deterministic bar. */
export const EXPO_SELECTED_IDP_LIVE_JOURNEY_HOLD =
  "Selected identity-provider live journey is held. Local-session fixtures are the deterministic auth bar; they are not an IdP." as const;

/**
 * Adapter boundary: local-session must not be treated as a selected IdP journey.
 * Callers that claim IdP live proof against local-session are refused.
 */
export type ExpoAuthAdapterKind = "local-session" | "selected-idp";

export function classifyAuthAdapterClaim(input: { adapter: ExpoAuthAdapterKind; claimIdpLiveJourney: boolean }): {
  action: "accept-local-session" | "refuse";
  code?: "local-session-is-not-idp";
  reason: string;
  idpLiveJourneyHeld: true;
} {
  if (input.adapter === "local-session" && input.claimIdpLiveJourney) {
    return {
      action: "refuse",
      code: "local-session-is-not-idp",
      reason: EXPO_SELECTED_IDP_LIVE_JOURNEY_HOLD,
      idpLiveJourneyHeld: true,
    };
  }
  if (input.adapter === "selected-idp") {
    return {
      action: "refuse",
      code: "local-session-is-not-idp",
      reason: `${EXPO_SELECTED_IDP_LIVE_JOURNEY_HOLD} No live IdP adapter is authorized in this slice.`,
      idpLiveJourneyHeld: true,
    };
  }
  return {
    action: "accept-local-session",
    reason: "Local-session classification only. Not an identity provider. Selected IdP live journey stays held.",
    idpLiveJourneyHeld: true,
  };
}

export const EXPO_CAPABILITY_MATRIX: readonly ExpoCapabilityMatrixRow[] = [
  {
    id: "authentication",
    operationId: "authentication",
    selected: true,
    library: {
      kind: "fixture-seam",
      name: "local-session",
      version: "fixture",
      note: "Disposable file-backed local session. Not SecureStore. Not an IdP SDK.",
    },
    nativePlugin: false,
    rebuildRequired: false,
    platforms: ["ios", "android", "web"],
    credentialsOrPermissions: "No IdP client secrets in the starter. Session is local fixture state only.",
    dataOwner: "App-local session seam; user-scoped cache cleared on switch/revoke.",
    errorRecovery: "Cancel, expire, revoke, malicious-callback, and account-switch clear prior-user data without leaking paid access.",
    proofTier: "fixture-tested",
    proofScopeNotes: `${EXPO_SELECTED_IDP_LIVE_JOURNEY_HOLD} Client protected routes are navigation only.`,
    nativeStoreProof: false,
    liveMutation: false,
  },
  {
    id: "offline-data",
    operationId: "offline-data",
    selected: true,
    library: {
      kind: "fixture-seam",
      name: "local-cache",
      version: "fixture",
      note: "Node SQLite disposable runtime + starter local-cache seam. expo-sqlite is not a starter dependency.",
    },
    nativePlugin: false,
    rebuildRequired: false,
    platforms: ["ios", "android", "web"],
    credentialsOrPermissions: "None for local cache fixtures.",
    dataOwner: "Device-local cache only. Not cross-device sync. Not backend-of-record.",
    errorRecovery: "Restart, reconnect, duplicate, migration-failure, and interrupted-write keep cache semantics without claiming backend success.",
    proofTier: "fixture-tested",
    proofScopeNotes: "Not SecureStore-as-web. Not a backend of record. SQLite ≠ sync.",
    nativeStoreProof: false,
    liveMutation: false,
  },
  {
    id: "secure-store",
    operationId: null,
    selected: false,
    library: {
      kind: "documented",
      name: "expo-secure-store",
      version: "docs-latest",
      installedInStarter: false,
      note: "SecureStore native semantics are documented in protocol classifiers. Not claimed as a starter dependency.",
    },
    nativePlugin: true,
    rebuildRequired: true,
    platforms: ["ios", "android"],
    credentialsOrPermissions: "Platform keychain/keystore access when installed; not present in starter package.json.",
    dataOwner: "Native encrypted storage when wired. Not web storage. Not home of irreplaceable user data.",
    errorRecovery: "Protocol refuses SecureStore-as-web-storage and web native-encrypted claims.",
    proofTier: "held",
    proofScopeNotes: "Wiring note only. Starter does not ship expo-secure-store. Held until a selected native session persistence path is authorized.",
    nativeStoreProof: false,
    liveMutation: false,
  },
  {
    id: "device-camera-media",
    operationId: "device-capabilities",
    selected: true,
    library: {
      kind: "fixture-seam",
      name: "permissions/safe-state",
      version: "fixture",
      note: "Denied/revoked/unavailable stay unavailable-safe. No camera SDK forced into starter.",
    },
    nativePlugin: false,
    rebuildRequired: false,
    platforms: ["ios", "android", "web"],
    credentialsOrPermissions: "Camera/media-library permission outcomes classified; web must not fake native success.",
    dataOwner: "Device permission state; media bytes stay on-device unless a separately selected upload path exists.",
    errorRecovery: "Denied, revoked, and unavailable map to unavailable-safe without permission loops.",
    proofTier: "fixture-tested",
    proofScopeNotes: "Fixture-tested safe-state classifiers. Live device camera/media runtime stays not-run unless authorized elsewhere.",
    nativeStoreProof: false,
    liveMutation: false,
  },
  {
    id: "push-notifications",
    operationId: "device-capabilities",
    selected: true,
    library: {
      kind: "fixture-seam",
      name: "notifications/handoff",
      version: "fixture",
      note: "Token/project/env ownership + deep-link restore fixtures. Live push delivery held.",
    },
    nativePlugin: false,
    rebuildRequired: false,
    platforms: ["ios", "android", "web"],
    credentialsOrPermissions: "Push project/token/env ownership documented; no live Expo push credentials in fixtures.",
    dataOwner: "App owns token lifecycle; OS owns delivery; provider receipt is not person-seen.",
    errorRecovery: "Token and receipt errors are not delivery success; deep-link route mismatch is refused.",
    proofTier: "fixture-tested",
    proofScopeNotes: "Handoff fixtures are fixture-tested. Live device push delivery is held. Receipt ≠ person-seen.",
    nativeStoreProof: false,
    liveMutation: false,
  },
  {
    id: "native-purchases",
    operationId: "native-purchases",
    selected: true,
    library: {
      kind: "documented",
      name: "react-native-purchases",
      version: "wiring-only",
      installedInStarter: false,
      note: "Custom development/release build wiring documented in expo-revenuecat-wiring.ts. Not installed in starter. Not Expo Go.",
    },
    nativePlugin: true,
    rebuildRequired: true,
    platforms: ["ios", "android"],
    credentialsOrPermissions: "RevenueCat public SDK key may be EXPO_PUBLIC_*; management/secret keys must not enter the JS bundle. Spend not authorized.",
    dataOwner: "App auth ≠ RC app-user identity ≠ entitlement. Store/provider evidence owns paid access for the claimed proof scope.",
    errorRecovery: "Refuse live-store, Expo Go IAP, web-as-native, CLI-as-native, and identity collapse. Fake transport stays browser-mock only.",
    proofTier: "blocked",
    proofScopeNotes:
      "Wiring present in catalog. Device + sandbox/Test Store in-app readback held. #79 CLI is not this operation. Spend not authorized. nativeStoreProof stays false.",
    nativeStoreProof: false,
    liveMutation: false,
  },
  {
    id: "expo-public-secrets",
    operationId: null,
    selected: true,
    library: {
      kind: "fixture-seam",
      name: "scanClientArtifacts / classifyEnvName",
      version: "fixture",
      note: "EXPO_PUBLIC_* is client-readable; management/signing/refresh/AI keys must not appear in client artifacts.",
    },
    nativePlugin: false,
    rebuildRequired: false,
    platforms: ["ios", "android", "web"],
    credentialsOrPermissions: "Public SDK keys may be EXPO_PUBLIC_*. Management, signing, refresh, and AI keys stay out of the bundle.",
    dataOwner: "Build/config owners; client bundle must not carry secrets.",
    errorRecovery: "Canary scan refuses prohibited inclusion; public-only canaries pass.",
    proofTier: "fixture-tested",
    proofScopeNotes: "Fixture canaries cover EXPO_PUBLIC vs management/signing/refresh/AI keys. No secrets committed.",
    nativeStoreProof: false,
    liveMutation: false,
  },
] as const satisfies readonly ExpoCapabilityMatrixRow[];

export function expoCapabilityMatrixRows(): readonly ExpoCapabilityMatrixRow[] {
  return EXPO_CAPABILITY_MATRIX;
}

export function expoCapabilityMatrixRow(id: ExpoMatrixCapabilityId): ExpoCapabilityMatrixRow {
  const row = EXPO_CAPABILITY_MATRIX.find((entry) => entry.id === id);
  if (!row) {
    throw new Error(`unknown capability matrix id: ${id}`);
  }
  return row;
}

export function selectedExpoCapabilityMatrixRows(): readonly ExpoCapabilityMatrixRow[] {
  return EXPO_CAPABILITY_MATRIX.filter((row) => row.selected);
}

export const EXPO_CAPABILITY_MATRIX_REQUIRED_IDS = [
  "authentication",
  "offline-data",
  "secure-store",
  "device-camera-media",
  "push-notifications",
  "native-purchases",
  "expo-public-secrets",
] as const satisfies readonly ExpoMatrixCapabilityId[];
