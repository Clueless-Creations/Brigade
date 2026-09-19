/**
 * Expo/EAS signing readiness models (#84).
 *
 * Classify readiness and refuse silent credential writes. Does not spawn eas credentials,
 * eas init, or device registration. Secrets must never appear in argv, logs, or the JS bundle.
 */

export const EXPO_EAS_SIGNING_READINESS_PATH = "adapters/providers/expo/signing-readiness.ts" as const;

export type ExpoSigningReadinessCode =
  | "ready-to-plan"
  | "missing-profile"
  | "preview-production-collapse"
  | "silent-write-refused"
  | "auto-create-refused"
  | "auto-revoke-refused"
  | "secret-in-argv-refused"
  | "secret-in-log-refused"
  | "secret-in-bundle-refused"
  | "freeze-credentials-required"
  | "live-signing-held";

export type ExpoSigningProfileKind = "development" | "preview" | "production";

export interface ExpoSigningProfileModel {
  readonly name: string;
  readonly kind: ExpoSigningProfileKind;
  readonly distribution: "internal" | "store" | "simulator";
  readonly targetsProductionBackends: boolean;
  readonly targetsProductionUpdates: boolean;
}

export interface ExpoSigningReadinessInput {
  readonly profile?: ExpoSigningProfileModel;
  readonly requestSilentCredentialWrite?: boolean;
  readonly requestAutoCreateCertificate?: boolean;
  readonly requestAutoRevokeCertificate?: boolean;
  readonly argvContainsSecret?: boolean;
  readonly logContainsSecret?: boolean;
  readonly jsBundleContainsSecret?: boolean;
  readonly freezeCredentialsOnDispatch?: boolean;
  readonly claimLiveSigningProof?: boolean;
}

export interface ExpoSigningReadinessResult {
  readonly action: "accept-plan" | "refuse";
  readonly code: ExpoSigningReadinessCode;
  readonly reason: string;
  readonly liveSigningHeld: true;
  readonly silentWriteAllowed: false;
}

export const EXPO_EAS_FREEZE_CREDENTIALS_NOTE =
  "Non-interactive EAS build dispatch passes --freeze-credentials. --non-interactive is not permission to update signing material." as const;

export const EXPO_EAS_NO_SILENT_CREDENTIAL_WRITE =
  "Signing readiness refuses silent credential write, auto-create, and auto-revoke. eas.init / credentials* / device.create stay deliberately-excluded." as const;

export function assessExpoSigningReadiness(input: ExpoSigningReadinessInput): ExpoSigningReadinessResult {
  if (input.requestSilentCredentialWrite) {
    return {
      action: "refuse",
      code: "silent-write-refused",
      reason: EXPO_EAS_NO_SILENT_CREDENTIAL_WRITE,
      liveSigningHeld: true,
      silentWriteAllowed: false,
    };
  }
  if (input.requestAutoCreateCertificate) {
    return {
      action: "refuse",
      code: "auto-create-refused",
      reason: "Auto-creating store certificates is refused. Signing material changes require explicit human-gated authority.",
      liveSigningHeld: true,
      silentWriteAllowed: false,
    };
  }
  if (input.requestAutoRevokeCertificate) {
    return {
      action: "refuse",
      code: "auto-revoke-refused",
      reason: "Auto-revoking store certificates is refused.",
      liveSigningHeld: true,
      silentWriteAllowed: false,
    };
  }
  if (input.argvContainsSecret) {
    return {
      action: "refuse",
      code: "secret-in-argv-refused",
      reason: "Signing secrets, store tokens, and build-only keys must never appear in argv.",
      liveSigningHeld: true,
      silentWriteAllowed: false,
    };
  }
  if (input.logContainsSecret) {
    return {
      action: "refuse",
      code: "secret-in-log-refused",
      reason: "Signing secrets must never appear in logs, issues, or public artifacts.",
      liveSigningHeld: true,
      silentWriteAllowed: false,
    };
  }
  if (input.jsBundleContainsSecret) {
    return {
      action: "refuse",
      code: "secret-in-bundle-refused",
      reason: "Signing secrets must never enter the JS bundle. EXPO_PUBLIC_* is client-readable and is not a home for build-only keys.",
      liveSigningHeld: true,
      silentWriteAllowed: false,
    };
  }
  if (!input.profile) {
    return {
      action: "refuse",
      code: "missing-profile",
      reason: "A named build profile is required before signing readiness can be planned.",
      liveSigningHeld: true,
      silentWriteAllowed: false,
    };
  }
  if (input.profile.kind === "preview" && (input.profile.targetsProductionBackends || input.profile.targetsProductionUpdates)) {
    return {
      action: "refuse",
      code: "preview-production-collapse",
      reason: "Preview profiles must not silently target production backends or production updates.",
      liveSigningHeld: true,
      silentWriteAllowed: false,
    };
  }
  if (input.freezeCredentialsOnDispatch === false) {
    return {
      action: "refuse",
      code: "freeze-credentials-required",
      reason: EXPO_EAS_FREEZE_CREDENTIALS_NOTE,
      liveSigningHeld: true,
      silentWriteAllowed: false,
    };
  }
  if (input.claimLiveSigningProof) {
    return {
      action: "refuse",
      code: "live-signing-held",
      reason: "Live signing remains held. Fixture-tested readiness is not runtime-verified signing proof.",
      liveSigningHeld: true,
      silentWriteAllowed: false,
    };
  }
  return {
    action: "accept-plan",
    code: "ready-to-plan",
    reason: `${EXPO_EAS_FREEZE_CREDENTIALS_NOTE} ${EXPO_EAS_NO_SILENT_CREDENTIAL_WRITE} Live signing remains held.`,
    liveSigningHeld: true,
    silentWriteAllowed: false,
  };
}
