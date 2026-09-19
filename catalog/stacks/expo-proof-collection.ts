/**
 * Expo #88 proof-matrix collection map.
 *
 * Collects pointers to #81–#87 fixture evidence vs live holds. Does not invent
 * live green, rewrite the frozen matrix to weaker tests, or create a second
 * acceptance store. Fixture success is never native, OTA, store, or hosted proof.
 */
export const EXPO_PROOF_COLLECTION_PATH = "catalog/stacks/expo-proof-collection.ts" as const;
export const EXPO_PROOF_MATRIX_PATH = "checks/verification/rehearsal/expo-proof-matrix.md" as const;

export type ExpoProofChildIssue = 81 | 82 | 83 | 84 | 85 | 86 | 87 | 88;

export type ExpoProofEvidenceKind = "fixture-tier" | "live-hold" | "protocol";

export type ExpoProofMatrixRowStatus = "not-run" | "blocked" | "fixture-collected" | "live-held";

export interface ExpoProofChildPointer {
  readonly issue: ExpoProofChildIssue;
  readonly title: string;
  readonly fixtureSuites: readonly string[];
  readonly catalogOrAdapterSeams: readonly string[];
  readonly evidenceKind: ExpoProofEvidenceKind;
  readonly liveHold: string | null;
  readonly notes: string;
}

export interface ExpoProofMatrixCollectionRow {
  readonly requirement: string;
  readonly platforms: readonly ("ios" | "android" | "web" | "host" | "selected")[];
  readonly status: ExpoProofMatrixRowStatus;
  readonly collectedFrom: readonly ExpoProofChildIssue[];
  readonly liveAuthorityRequired: string | null;
  readonly notes: string;
}

export type ExpoDeliveryDisposition = "delivery-accepted" | "submission-ready" | "submitted" | "released" | "observed";

export interface ExpoCompleteBusinessDispositionInput {
  readonly hasMatching72Authority: boolean;
  readonly claimedDisposition: ExpoDeliveryDisposition;
  readonly inventMandateOrWorkspace?: boolean;
  readonly collapseStates?: boolean;
}

export interface ExpoCompleteBusinessDispositionResult {
  readonly disposition: ExpoDeliveryDisposition | null;
  readonly accepted: boolean;
  readonly held: boolean;
  readonly holdReason: "missing-72-authority" | "invented-mandate" | "collapsed-states" | null;
  readonly notes: string;
  readonly distinctStatesRequired: readonly ExpoDeliveryDisposition[];
}

/** Child → evidence pointers. Fixture suites never promote to native/runtime. */
export const EXPO_PROOF_CHILD_POINTERS: readonly ExpoProofChildPointer[] = [
  {
    issue: 81,
    title: "Selection / knowledge honesty",
    fixtureSuites: ["expo-selection"],
    catalogOrAdapterSeams: ["catalog/stacks/expo-selection.ts"],
    evidenceKind: "fixture-tier",
    liveHold: "Live Expo CLI / SDK install not-run",
    notes: "Evidence tiers + SDK researched baselines. autoUpgradeAttempted stays false.",
  },
  {
    issue: 82,
    title: "Foundation / CNG / web-export",
    fixtureSuites: ["expo-foundation"],
    catalogOrAdapterSeams: ["catalog/stacks/expo-starter.ts", "catalog/stacks/expo-native-ownership.ts", "catalog/stacks/expo-local-boot.ts"],
    evidenceKind: "fixture-tier",
    liveHold: "Native compile + iOS/Android device install held (transferred to #88 matrix)",
    notes: "CNG/prebuild fixtures are not device or compile proof.",
  },
  {
    issue: 83,
    title: "Capability matrix + RC wiring",
    fixtureSuites: ["expo-capabilities"],
    catalogOrAdapterSeams: ["catalog/stacks/expo-capability-matrix.ts", "catalog/stacks/expo-revenuecat-wiring.ts"],
    evidenceKind: "fixture-tier",
    liveHold: "IdP / native-IAP sandbox / spend held",
    notes: "Capability models only; purchase/restore live not-run.",
  },
  {
    issue: 84,
    title: "EAS operation matrix + dry-run",
    fixtureSuites: ["expo-eas-execution", "expo-eas-doctor", "expo-eas-decode", "expo-eas-durability"],
    catalogOrAdapterSeams: ["catalog/stacks/expo-eas-operation-matrix.ts", "adapters/providers/expo/execute.ts"],
    evidenceKind: "fixture-tier",
    liveHold: "Paid EAS cloud / live submit / credential write held",
    notes: "Consume executor — no second runner. Fake transport ≠ cloud proof.",
  },
  {
    issue: 85,
    title: "Update lifecycle dry-run",
    fixtureSuites: ["expo-eas-update-lifecycle", "expo-eas-update-policy"],
    catalogOrAdapterSeams: ["adapters/providers/expo/update-prepare.ts", "adapters/providers/expo/update-recovery.ts"],
    evidenceKind: "fixture-tier",
    liveHold: "Live OTA publish / production channel hard-held",
    notes: "autoPublish false. Collect coexistence evidence; do not rebuild.",
  },
  {
    issue: 86,
    title: "Web / API / hosting dry-run",
    fixtureSuites: ["expo-web-api", "expo-web-hosting"],
    catalogOrAdapterSeams: ["catalog/stacks/expo-web-surface-table.ts", "catalog/stacks/expo-eas-hosting.ts", "adapters/providers/expo/web-api-contract.ts"],
    evidenceKind: "fixture-tier",
    liveHold: "Live EAS Hosting deploy / browser E2E held",
    notes: "Web export cannot satisfy Android/iOS rows.",
  },
  {
    issue: 87,
    title: "Skills / MCP dry-run",
    fixtureSuites: ["expo-agent-tools", "expo-mcp"],
    catalogOrAdapterSeams: ["catalog/stacks/expo-agent-tools.ts", "adapters/providers/expo/expo-mcp-route.ts", "adapters/providers/expo/expo-device-bind.ts"],
    evidenceKind: "fixture-tier",
    liveHold: "Live MCP connect / device bind held",
    notes: "Host-native preferred. No second router. Fake schema ≠ live MCP.",
  },
  {
    issue: 88,
    title: "Proof matrix / quality / observability / upgrade / collection",
    fixtureSuites: ["expo-quality", "expo-observability", "expo-sdk-upgrade", "expo-proof-collection"],
    catalogOrAdapterSeams: [
      "checks/verification/rehearsal/expo-proof-matrix.md",
      "catalog/stacks/expo-proof-collection.ts",
      "catalog/stacks/expo-quality-evidence.ts",
      "catalog/stacks/expo-observability.ts",
      "catalog/stacks/expo-sdk-upgrade.ts",
    ],
    evidenceKind: "protocol",
    liveHold: "Live full matrix / device E2E / Observe account / upgrade workspace / #72 greenfield held",
    notes: "Deterministic models + honest holds. Never closes #80.",
  },
];

/** Frozen-matrix rows with collection honesty — holds stay holds. */
export const EXPO_PROOF_MATRIX_COLLECTION_ROWS: readonly ExpoProofMatrixCollectionRow[] = [
  {
    requirement: "Unit/native mocks cannot satisfy simulator/device/store acceptance",
    platforms: ["ios", "android"],
    status: "fixture-collected",
    collectedFrom: [88],
    liveAuthorityRequired: "Simulator/device E2E against installed custom-dev or release-like binary",
    notes: "Deterministic mock≠native refuse models collected; live native E2E remains not-run.",
  },
  {
    requirement: "Web export cannot satisfy an Android requirement",
    platforms: ["android", "web"],
    status: "fixture-collected",
    collectedFrom: [86, 88],
    liveAuthorityRequired: null,
    notes: "Separate-platform rows + web≠android fixtures. Live browser vs device parity still not-run.",
  },
  {
    requirement: "Release-like binary starts offline without Metro",
    platforms: ["ios", "android"],
    status: "live-held",
    collectedFrom: [82, 88],
    liveAuthorityRequired: "Selected Expo app + device/simulator with release-like binary",
    notes: "Model + hold. No device/app on this checkout.",
  },
  {
    requirement: "Accessibility and platform navigation",
    platforms: ["selected"],
    status: "fixture-collected",
    collectedFrom: [88],
    liveAuthorityRequired: "Per-platform a11y/navigation on capable target",
    notes: "a11y≠screenshot parity fixtures. Live a11y audit not-run.",
  },
  {
    requirement: "Account isolation / selected purchase / permission failure",
    platforms: ["ios", "android"],
    status: "live-held",
    collectedFrom: [83],
    liveAuthorityRequired: "Sandbox / IdP / hardware-permission authority",
    notes: "Collect #83 capability models; sandbox authority still held.",
  },
  {
    requirement: "Source/SDK/build/update/review change invalidates old proof",
    platforms: ["selected"],
    status: "fixture-collected",
    collectedFrom: [85, 88],
    liveAuthorityRequired: null,
    notes: "Invalidation refuse fixtures encode the path. Live retest after change not-run.",
  },
  {
    requirement: "Observe missing data and absent native crash coverage stay visible",
    platforms: ["ios", "android", "web"],
    status: "live-held",
    collectedFrom: [88],
    liveAuthorityRequired: "Paid Observe / crash-reporter account + event-delivery readback",
    notes: "Contract + fake fixtures only. Observe ≠ native crash. Configured ≠ arrived.",
  },
  {
    requirement: "Upgrade failure preserves native customizations",
    platforms: ["selected"],
    status: "live-held",
    collectedFrom: [88],
    liveAuthorityRequired: "Approved isolated upgrade workspace",
    notes: "Dry-run freeze/rebuild/invalidate/recovery models. No auto-upgrade / workspace repin.",
  },
  {
    requirement: "Complete-business closeout distinguishes delivery / submission / live",
    platforms: ["selected"],
    status: "live-held",
    collectedFrom: [88],
    liveAuthorityRequired: "Matching #72 mandate / workspace / budget authority",
    notes: "Disposition read-model only. Missing #72 authority = hold, not invent.",
  },
];

export const EXPO_DELIVERY_DISPOSITIONS: readonly ExpoDeliveryDisposition[] = ["delivery-accepted", "submission-ready", "submitted", "released", "observed"];

export function collectExpoProofChild(issue: ExpoProofChildIssue): ExpoProofChildPointer {
  const match = EXPO_PROOF_CHILD_POINTERS.find((row) => row.issue === issue);
  if (!match) throw new Error(`unknown Expo proof child: ${issue}`);
  return match;
}

export function listExpoProofHolds(): readonly ExpoProofMatrixCollectionRow[] {
  return EXPO_PROOF_MATRIX_COLLECTION_ROWS.filter((row) => row.status === "live-held" || row.status === "blocked" || row.status === "not-run");
}

export function assertFixtureTierNotPromoted(
  kind: ExpoProofEvidenceKind,
  claimedLive: boolean,
): {
  readonly refused: boolean;
  readonly notes: string;
} {
  if (kind === "fixture-tier" && claimedLive) {
    return {
      refused: true,
      notes: "Fixture success is never native, OTA, store, or hosted proof. Refuse promotion.",
    };
  }
  if (kind === "protocol" && claimedLive) {
    return {
      refused: true,
      notes: "Protocol/matrix maintenance is not live matrix proof. Refuse promotion.",
    };
  }
  return { refused: false, notes: "No illegal promotion claimed." };
}

export function assessCompleteBusinessDisposition(input: ExpoCompleteBusinessDispositionInput): ExpoCompleteBusinessDispositionResult {
  const distinct = EXPO_DELIVERY_DISPOSITIONS;
  if (input.inventMandateOrWorkspace) {
    return {
      disposition: null,
      accepted: false,
      held: true,
      holdReason: "invented-mandate",
      notes: "Do not invent #72 mandate/workspace/backend. Hold.",
      distinctStatesRequired: distinct,
    };
  }
  if (input.collapseStates) {
    return {
      disposition: null,
      accepted: false,
      held: true,
      holdReason: "collapsed-states",
      notes: "Delivery accepted / submission-ready / submitted / released / observed must stay distinct.",
      distinctStatesRequired: distinct,
    };
  }
  if (!input.hasMatching72Authority) {
    return {
      disposition: null,
      accepted: false,
      held: true,
      holdReason: "missing-72-authority",
      notes: "Missing #72 authority → hold. Disposition read-model only; do not invent product work.",
      distinctStatesRequired: distinct,
    };
  }
  return {
    disposition: input.claimedDisposition,
    accepted: true,
    held: false,
    holdReason: null,
    notes: `Disposition ${input.claimedDisposition} recorded as read-model under matching #72 authority. Live greenfield remains a separate program bucket.`,
    distinctStatesRequired: distinct,
  };
}
