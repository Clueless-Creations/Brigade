/**
 * #88 observability contracts. Deterministic fake/provider-mapping only.
 * Observe ≠ crash; configured ≠ arrived; no PII leak; missing data visible.
 */
import {
  EXPO_OBSERVABILITY_OWNERS,
  assessExpoObservability,
  observeDoesNotReplaceNativeCrash,
} from "../../../catalog/stacks/expo-observability.js";
import { assert, type Harness } from "./_harness.js";

export function register(harness: Harness): void {
  harness.check("expo-observability: distinct owners; Observe ≠ native crash replacement", () => {
    assert(EXPO_OBSERVABILITY_OWNERS.length === 3, "three owners");
    assert(observeDoesNotReplaceNativeCrash().replaces === false, "Observe does not replace crash");

    const observeAsCrash = assessExpoObservability({
      owner: "eas-observe",
      claimedReplaces: "native-crash-reporter",
      sdkConfigured: true,
      eventsArrived: true,
      visibility: "events-arrived",
    });
    assert(observeAsCrash.refuseReason === "observe-not-crash-replacement", observeAsCrash.notes);

    const analyticsAsCrash = assessExpoObservability({
      owner: "product-analytics",
      claimedReplaces: "native-crash-reporter",
      sdkConfigured: true,
      eventsArrived: true,
      visibility: "events-arrived",
    });
    assert(analyticsAsCrash.refuseReason === "analytics-not-crash-replacement", analyticsAsCrash.notes);
  });

  harness.check("expo-observability: configured≠arrived; missing data stays visible; privacy refuse", () => {
    const configured = assessExpoObservability({
      owner: "eas-observe",
      sdkConfigured: true,
      eventsArrived: false,
      visibility: "configured-no-events",
    });
    assert(configured.refuseReason === "configured-not-arrived", configured.notes);
    assert(configured.missingDataVisible === true, "missing data visible");

    const missing = assessExpoObservability({
      owner: "native-crash-reporter",
      sdkConfigured: false,
      eventsArrived: false,
      visibility: "absent-native-crash-coverage",
    });
    assert(missing.accepted === true && missing.missingDataVisible === true, missing.notes);

    const pii = assessExpoObservability({
      owner: "product-analytics",
      sdkConfigured: true,
      eventsArrived: true,
      visibility: "events-arrived",
      containsSecretOrPii: true,
    });
    assert(pii.refuseReason === "secret-or-pii-leak", pii.notes);

    const double = assessExpoObservability({
      owner: "product-analytics",
      sdkConfigured: true,
      eventsArrived: true,
      visibility: "events-arrived",
      doubleCountsBusinessEventWithoutMapping: true,
    });
    assert(double.refuseReason === "unmapped-double-count", double.notes);
  });

  harness.check("expo-observability: live Observe claim held", () => {
    const live = assessExpoObservability({
      owner: "eas-observe",
      sdkConfigured: true,
      eventsArrived: true,
      visibility: "events-arrived",
      claimLiveObserveProof: true,
    });
    assert(live.refuseReason === "live-observe-held" && live.liveHeld === true, live.notes);
  });
}
