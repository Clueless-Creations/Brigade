/**
 * Production observability contracts (#88).
 *
 * Observe / product analytics / native crash reporting are distinct owners.
 * Configured SDK ≠ arrived events. Missing data, preview limits, and absent
 * native crash coverage stay visible. Monitoring must not leak secrets/PII or
 * double-count canonical business events without explicit mapping.
 * Live Observe / crash readback remains held (HoE: contract + fake fixtures).
 */
export const EXPO_OBSERVABILITY_PATH = "catalog/stacks/expo-observability.ts" as const;

export type ExpoObservabilityOwner = "eas-observe" | "product-analytics" | "native-crash-reporter";

export type ExpoObservabilityVisibility =
  "events-arrived" | "configured-no-events" | "missing-data" | "preview-limits" | "absent-native-crash-coverage" | "delivery-failure";

export interface ExpoObservabilityMappingInput {
  readonly owner: ExpoObservabilityOwner;
  readonly claimedReplaces?: ExpoObservabilityOwner;
  readonly sdkConfigured: boolean;
  readonly eventsArrived: boolean;
  readonly visibility: ExpoObservabilityVisibility;
  readonly containsSecretOrPii?: boolean;
  readonly doubleCountsBusinessEventWithoutMapping?: boolean;
  readonly claimLiveObserveProof?: boolean;
}

export interface ExpoObservabilityAssessment {
  readonly accepted: boolean;
  readonly refuseReason:
    | "observe-not-crash-replacement"
    | "analytics-not-crash-replacement"
    | "configured-not-arrived"
    | "secret-or-pii-leak"
    | "unmapped-double-count"
    | "live-observe-held"
    | "missing-data-must-stay-visible"
    | null;
  readonly owner: ExpoObservabilityOwner;
  readonly distinctOwners: readonly ExpoObservabilityOwner[];
  readonly missingDataVisible: boolean;
  readonly notes: string;
  readonly liveHeld: true;
}

export const EXPO_OBSERVABILITY_OWNERS: readonly ExpoObservabilityOwner[] = ["eas-observe", "product-analytics", "native-crash-reporter"];

export const EXPO_OBSERVABILITY_NOTES = {
  distinct: "EAS Observe, product analytics, and native crash reporting are distinct owners — none silently replaces another.",
  configuredNotArrived: "A configured SDK is not proof events arrived; a dashboard with no events is not proof health.",
  missingVisible: "Missing data, preview limits, and absent native crash coverage remain visible — never fake green.",
  privacy: "Monitoring config must not leak secrets/PII or duplicate canonical business events without explicit mapping.",
  liveHeld: "Live Observe / crash-reporter event-delivery readback is held unless HoE authorizes a named journey.",
} as const;

export function assessExpoObservability(input: ExpoObservabilityMappingInput): ExpoObservabilityAssessment {
  const base = {
    owner: input.owner,
    distinctOwners: EXPO_OBSERVABILITY_OWNERS,
    liveHeld: true as const,
  };

  if (input.claimLiveObserveProof) {
    return {
      ...base,
      accepted: false,
      refuseReason: "live-observe-held",
      missingDataVisible: true,
      notes: EXPO_OBSERVABILITY_NOTES.liveHeld,
    };
  }
  if (input.containsSecretOrPii) {
    return {
      ...base,
      accepted: false,
      refuseReason: "secret-or-pii-leak",
      missingDataVisible: true,
      notes: EXPO_OBSERVABILITY_NOTES.privacy,
    };
  }
  if (input.doubleCountsBusinessEventWithoutMapping) {
    return {
      ...base,
      accepted: false,
      refuseReason: "unmapped-double-count",
      missingDataVisible: true,
      notes: EXPO_OBSERVABILITY_NOTES.privacy,
    };
  }
  if (input.claimedReplaces === "native-crash-reporter" && input.owner !== "native-crash-reporter") {
    return {
      ...base,
      accepted: false,
      refuseReason: input.owner === "eas-observe" ? "observe-not-crash-replacement" : "analytics-not-crash-replacement",
      missingDataVisible: true,
      notes: `${EXPO_OBSERVABILITY_NOTES.distinct} Observe ≠ native crash reporter.`,
    };
  }
  if (input.sdkConfigured && !input.eventsArrived) {
    return {
      ...base,
      accepted: false,
      refuseReason: "configured-not-arrived",
      missingDataVisible: true,
      notes: EXPO_OBSERVABILITY_NOTES.configuredNotArrived,
    };
  }
  if (
    input.visibility === "missing-data" ||
    input.visibility === "preview-limits" ||
    input.visibility === "absent-native-crash-coverage" ||
    input.visibility === "delivery-failure"
  ) {
    return {
      ...base,
      accepted: true,
      refuseReason: null,
      missingDataVisible: true,
      notes: `${EXPO_OBSERVABILITY_NOTES.missingVisible} Visibility=${input.visibility}.`,
    };
  }
  if (input.visibility === "configured-no-events") {
    return {
      ...base,
      accepted: false,
      refuseReason: "configured-not-arrived",
      missingDataVisible: true,
      notes: EXPO_OBSERVABILITY_NOTES.configuredNotArrived,
    };
  }
  return {
    ...base,
    accepted: input.sdkConfigured && input.eventsArrived,
    refuseReason: null,
    missingDataVisible: true,
    notes: `${EXPO_OBSERVABILITY_NOTES.distinct} Fake/provider-mapping fixture only; live held.`,
  };
}

export function observeDoesNotReplaceNativeCrash(): { readonly replaces: false; readonly notes: string } {
  return { replaces: false, notes: EXPO_OBSERVABILITY_NOTES.distinct };
}
