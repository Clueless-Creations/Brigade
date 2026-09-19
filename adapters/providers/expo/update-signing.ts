/**
 * EAS Update code-signing configuration model (#85).
 *
 * Aligns with signing-readiness (#84): missing plan/keys are blockers when signing
 * is required. Private keys never appear in app source, argv, logs, or fixtures as
 * real secrets. Live signing remains held.
 */

export const EXPO_UPDATE_SIGNING_PATH = "adapters/providers/expo/update-signing.ts" as const;

export type ExpoUpdateSigningCode =
  | "ready-to-plan"
  | "signing-not-required"
  | "missing-plan"
  | "missing-keys"
  | "private-key-in-source-refused"
  | "live-signing-held";

export interface ExpoUpdateSigningInput {
  readonly signingRequired: boolean;
  readonly planPresent?: boolean;
  readonly publicKeyPresent?: boolean;
  readonly privateKeyAccessible?: boolean;
  /** Synthetic marker only — never real private key material. */
  readonly privateKeyInAppSource?: boolean;
  readonly claimLiveSigningProof?: boolean;
}

export interface ExpoUpdateSigningResult {
  readonly action: "accept-plan" | "refuse" | "not-required";
  readonly code: ExpoUpdateSigningCode;
  readonly blocker: boolean;
  readonly liveSigningHeld: true;
  readonly privateKeysInSourceAllowed: false;
  readonly notes: string;
}

export const EXPO_UPDATE_SIGNING_NOTES = {
  missingIsBlocker: "When update signing is required, missing plan or keys are blockers — do not silently assume or downgrade.",
  noPrivateKeys: "Private signing keys must never appear in app source, argv, logs, or public fixtures.",
  liveHeld: "Live update code-signing remains held. Model + hold is the #85 bar.",
  notRequired: "Update signing was not selected/required for this journey.",
} as const;

export function assessExpoUpdateCodeSigning(input: ExpoUpdateSigningInput): ExpoUpdateSigningResult {
  const base = { liveSigningHeld: true as const, privateKeysInSourceAllowed: false as const };

  if (input.privateKeyInAppSource) {
    return {
      ...base,
      action: "refuse",
      code: "private-key-in-source-refused",
      blocker: true,
      notes: EXPO_UPDATE_SIGNING_NOTES.noPrivateKeys,
    };
  }
  if (!input.signingRequired) {
    return {
      ...base,
      action: "not-required",
      code: "signing-not-required",
      blocker: false,
      notes: EXPO_UPDATE_SIGNING_NOTES.notRequired,
    };
  }
  if (!input.planPresent) {
    return {
      ...base,
      action: "refuse",
      code: "missing-plan",
      blocker: true,
      notes: EXPO_UPDATE_SIGNING_NOTES.missingIsBlocker,
    };
  }
  if (!input.publicKeyPresent || input.privateKeyAccessible !== true) {
    return {
      ...base,
      action: "refuse",
      code: "missing-keys",
      blocker: true,
      notes: EXPO_UPDATE_SIGNING_NOTES.missingIsBlocker,
    };
  }
  if (input.claimLiveSigningProof) {
    return {
      ...base,
      action: "refuse",
      code: "live-signing-held",
      blocker: true,
      notes: EXPO_UPDATE_SIGNING_NOTES.liveHeld,
    };
  }
  return {
    ...base,
    action: "accept-plan",
    code: "ready-to-plan",
    blocker: false,
    notes: `${EXPO_UPDATE_SIGNING_NOTES.liveHeld} ${EXPO_UPDATE_SIGNING_NOTES.noPrivateKeys}`,
  };
}
