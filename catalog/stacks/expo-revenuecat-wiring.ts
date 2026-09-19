/**
 * RevenueCat / react-native-purchases wiring-only notes for Expo #83.
 *
 * Documents the custom development/release-build path. Does not install the
 * native module, mutate stores, authorize spend, or upgrade native-purchases
 * evidence beyond blocked. Extends purchase classifiers from
 * expo-capability-protocol — does not replace them.
 *
 * #79 RevenueCat CLI is catalog management, not this native IAP operation.
 */

export const EXPO_REVENUECAT_WIRING_PATH = "catalog/stacks/expo-revenuecat-wiring.ts" as const;

export const EXPO_REVENUECAT_WIRING_SOURCES = {
  inAppPurchases: "https://docs.expo.dev/guides/in-app-purchases/",
  developmentBuilds: "https://docs.expo.dev/develop/development-builds/introduction/",
  reactNativePurchases: "https://www.revenuecat.com/docs/getting-started/installation/reactnative",
} as const;

/** Distinct identity kinds — never collapse these. */
export type ExpoRevenueCatIdentityKind = "app-auth" | "revenuecat-app-user" | "entitlement";

export type ExpoRevenueCatClientPath = "expo-go" | "web" | "custom-development-build" | "release-build";

/** Proof scopes kept distinct from browser-mock fixtures (mirrors protocol scopes). */
export type ExpoRevenueCatProofScope = "test-store" | "apple-sandbox" | "play-sandbox" | "production" | "browser-mock" | "web-checkout";

export type ExpoRevenueCatWiringRefusalCode =
  | "expo-go-native-library"
  | "web-fakes-native-purchase"
  | "cli-is-not-native-purchase"
  | "live-store-mutation"
  | "identity-kinds-collapsed"
  | "wiring-is-not-native-proof"
  | "spend-not-authorized";

export interface ExpoRevenueCatWiringPlan {
  packageName: "react-native-purchases";
  installedInStarter: false;
  requiresCustomNativeBuild: true;
  allowedClients: readonly ("custom-development-build" | "release-build")[];
  refusedClients: readonly ("expo-go" | "web")[];
  proofScopes: {
    browserMock: "browser-mock";
    testStore: "test-store";
    appleSandbox: "apple-sandbox";
    playSandbox: "play-sandbox";
    production: "production";
    webCheckout: "web-checkout";
  };
  identityKinds: readonly ExpoRevenueCatIdentityKind[];
  evidenceTier: "blocked";
  nativeStoreProof: false;
  liveMutation: false;
  spendAuthorized: false;
  deviceSandboxReadback: "held";
  cliIssue79IsNotThisOp: true;
  notes: string;
}

export const EXPO_REVENUECAT_WIRING_PLAN = {
  packageName: "react-native-purchases",
  installedInStarter: false,
  requiresCustomNativeBuild: true,
  allowedClients: ["custom-development-build", "release-build"] as const,
  refusedClients: ["expo-go", "web"] as const,
  proofScopes: {
    browserMock: "browser-mock",
    testStore: "test-store",
    appleSandbox: "apple-sandbox",
    playSandbox: "play-sandbox",
    production: "production",
    webCheckout: "web-checkout",
  },
  identityKinds: ["app-auth", "revenuecat-app-user", "entitlement"] as const,
  evidenceTier: "blocked",
  nativeStoreProof: false,
  liveMutation: false,
  spendAuthorized: false,
  deviceSandboxReadback: "held",
  cliIssue79IsNotThisOp: true,
  notes:
    "Catalog wiring for react-native-purchases on a custom development or release build. Starter does not install the package. Device + Apple/Play sandbox or Test Store in-app readback remains held. Browser-mock fake transport is fixture-only. #79 CLI is not native IAP. Spend is not authorized.",
} as const satisfies ExpoRevenueCatWiringPlan;

export function expoRevenueCatWiringPlan(): ExpoRevenueCatWiringPlan {
  return EXPO_REVENUECAT_WIRING_PLAN;
}

export function classifyRevenueCatWiringRequest(input: {
  client: ExpoRevenueCatClientPath;
  claimNativeStoreProof: boolean;
  claimLiveMutation: boolean;
  claimCliIsNativePurchase: boolean;
  collapseIdentityKinds: boolean;
  proofScope: ExpoRevenueCatProofScope;
}): {
  action: "document-wiring" | "refuse";
  code?: ExpoRevenueCatWiringRefusalCode;
  nativeStoreProof: false;
  liveMutation: false;
  evidenceTier: "blocked";
  reason: string;
} {
  const base = {
    nativeStoreProof: false as const,
    liveMutation: false as const,
    evidenceTier: "blocked" as const,
  };

  if (input.claimLiveMutation || input.proofScope === "production") {
    return {
      ...base,
      action: "refuse",
      code: "live-store-mutation",
      reason: "Spend and live store mutation are not authorized in this #83 slice.",
    };
  }
  if (input.claimCliIsNativePurchase) {
    return {
      ...base,
      action: "refuse",
      code: "cli-is-not-native-purchase",
      reason: "RevenueCat CLI (#79) is catalog management. It is not react-native-purchases purchase or restore.",
    };
  }
  if (input.collapseIdentityKinds) {
    return {
      ...base,
      action: "refuse",
      code: "identity-kinds-collapsed",
      reason: "App auth, RevenueCat app-user identity, and entitlements stay independent.",
    };
  }
  if (input.client === "expo-go") {
    return {
      ...base,
      action: "refuse",
      code: "expo-go-native-library",
      reason: "react-native-purchases requires a custom development or release build. Expo Go cannot load it.",
    };
  }
  if (input.client === "web") {
    return {
      ...base,
      action: "refuse",
      code: "web-fakes-native-purchase",
      reason: "Web must not fake native purchase success. Web checkout is a separate surface.",
    };
  }
  if (input.claimNativeStoreProof) {
    return {
      ...base,
      action: "refuse",
      code: "wiring-is-not-native-proof",
      reason:
        "Wiring documentation is not device + sandbox/Test Store native-store proof. native-purchases evidenceTier stays blocked; device readback is held.",
    };
  }
  return {
    ...base,
    action: "document-wiring",
    reason: "Custom development/release build wiring is documented. Native-store proof stays blocked; device+sandbox readback held; spend not authorized.",
  };
}

export const EXPO_NATIVE_PURCHASES_SELECTION_NOTES =
  "react-native-purchases wiring documented for custom development/release builds (catalog/stacks/expo-revenuecat-wiring.ts). Starter does not install the package. Device + sandbox/Test Store in-app readback held. #79 CLI is not this operation. Spend not authorized. Web billing stays separate. Fake in-app transport remains browser-mock only." as const;
