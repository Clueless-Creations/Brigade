/**
 * Expo MCP optional provider-route models (#87).
 *
 * Fake schema / transport fixtures only. Does not connect live Expo MCP, install skills,
 * or add a MobileOperationTransport. Host-native device tools stay preferred.
 * Consumes contracts/mobile-operation.ts at the operation boundary — no second router.
 *
 * Separates: availability / binding / account access / execute permission / observed result.
 * Docs/learn tools cannot grant deploy, account, or file access, or write builder truth.
 * Schema refresh must not quietly expand allowed effects.
 */
export const EXPO_MCP_ROUTE_PATH = "adapters/providers/expo/expo-mcp-route.ts" as const;

export const EXPO_MCP_SCHEMA_VERSION_REVIEWED = "fixture-schema-v1" as const;

export type ExpoMcpToolKind = "docs-read" | "docs-search" | "learn" | "inspect" | "interact" | "capture" | "eas-job" | "unknown";

export type ExpoMcpAvailability = "available" | "missing-connection" | "plan-restricted" | "missing-local-package" | "unsupported-host" | "unselected";

export type ExpoMcpBindingState = "unbound" | "bound" | "wrong-binding" | "concurrent-ownership";

export type ExpoMcpAccountAccess = "none" | "read-docs" | "execute-authorized" | "lost-auth";

export type ExpoMcpExecutePermission = "denied" | "docs-only" | "authorized-dry-run" | "live-held";

export type ExpoMcpObservedResult = "not-run" | "fixture-observed" | "partial-output" | "live-held" | "refused";

export type ExpoMcpRefuseReason =
  | "unselected"
  | "missing-connection"
  | "plan-restriction"
  | "missing-local-package"
  | "unsupported-host"
  | "docs-cannot-grant-effect"
  | "schema-drift-requires-review"
  | "new-tool-not-auto-granted"
  | "lost-auth"
  | "partial-output"
  | "live-mcp-held"
  | "host-native-preferred"
  | "builders-agents-authoritative"
  | "no-mobile-operation-transport";

export interface ExpoMcpReviewedTool {
  readonly name: string;
  readonly kind: ExpoMcpToolKind;
  readonly reviewedSchemaVersion: typeof EXPO_MCP_SCHEMA_VERSION_REVIEWED;
  /** Effects this tool may never grant even when listed by upstream. */
  readonly cannotGrant: readonly ("deploy" | "account-access" | "file-access" | "builder-truth" | "install" | "approval")[];
}

/** Reviewed fake-schema inventory — disposable observations, not live MCP discovery. */
export const EXPO_MCP_REVIEWED_TOOLS: readonly ExpoMcpReviewedTool[] = [
  {
    name: "expo_docs_read",
    kind: "docs-read",
    reviewedSchemaVersion: EXPO_MCP_SCHEMA_VERSION_REVIEWED,
    cannotGrant: ["deploy", "account-access", "file-access", "builder-truth", "install", "approval"],
  },
  {
    name: "expo_docs_search",
    kind: "docs-search",
    reviewedSchemaVersion: EXPO_MCP_SCHEMA_VERSION_REVIEWED,
    cannotGrant: ["deploy", "account-access", "file-access", "builder-truth", "install", "approval"],
  },
  {
    name: "expo_learn",
    kind: "learn",
    reviewedSchemaVersion: EXPO_MCP_SCHEMA_VERSION_REVIEWED,
    cannotGrant: ["deploy", "account-access", "file-access", "builder-truth", "install", "approval"],
  },
  {
    name: "expo_app_inspect",
    kind: "inspect",
    reviewedSchemaVersion: EXPO_MCP_SCHEMA_VERSION_REVIEWED,
    cannotGrant: ["deploy", "account-access", "builder-truth", "install", "approval"],
  },
  {
    name: "expo_app_capture",
    kind: "capture",
    reviewedSchemaVersion: EXPO_MCP_SCHEMA_VERSION_REVIEWED,
    cannotGrant: ["deploy", "account-access", "builder-truth", "install", "approval"],
  },
];

export interface ExpoMcpRouteRequest {
  readonly selected: boolean;
  readonly connected: boolean;
  readonly toolName: string;
  readonly observedSchemaVersion?: string;
  /** Upstream listed a tool not in the reviewed inventory. */
  readonly newlyExposedUpstreamTool?: boolean;
  readonly planAllowsTool?: boolean;
  readonly localPackagePresent?: boolean;
  readonly hostSupported?: boolean;
  readonly accountAccess?: ExpoMcpAccountAccess;
  readonly executeAuthorized?: boolean;
  readonly requestLiveConnect?: boolean;
  readonly preferHostNative?: boolean;
  readonly hostNativeCoversTask?: boolean;
  readonly partialToolOutput?: boolean;
  /** Malicious/unreviewed instruction trying to alter approvals or install. */
  readonly instructionTriesToAlterApprovals?: boolean;
  readonly instructionTriesToInstall?: boolean;
  readonly instructionTriesToWriteBuilderTruth?: boolean;
}

export interface ExpoMcpRouteAssessment {
  readonly availability: ExpoMcpAvailability;
  readonly binding: ExpoMcpBindingState;
  readonly accountAccess: ExpoMcpAccountAccess;
  readonly executePermission: ExpoMcpExecutePermission;
  readonly observedResult: ExpoMcpObservedResult;
  readonly addsMobileOperationTransport: false;
  readonly hostNativePreferred: true;
  readonly liveMcp: false;
  readonly refuseReason?: ExpoMcpRefuseReason;
  readonly reviewedTool?: ExpoMcpReviewedTool;
  readonly notes: string;
}

export const EXPO_MCP_ROUTE_NOTES = {
  optional: "Expo MCP is optional — not required because the app selected Expo.",
  discoveryNotAuth: "Listing MCP tools is not authorization to connect, install, or execute.",
  fakeNotLive: "Fake schema/transport green is not live MCP or live device proof.",
  docsNotEffect: "Docs/learn tools are knowledge assistance only — they cannot grant deploy, account, or file access or write builder truth.",
  schemaDrift: "Remote schema or newly exposed upstream tools must not quietly expand allowed effects. Re-review before grant.",
  hostNative: "Host-native device tools stay preferred when they already cover the task.",
  noTransport: "Do not add an Expo MobileOperationTransport. Consume contracts/mobile-operation.ts + adapters/device-proof.ts.",
  liveHeld: "Live Expo MCP connect / device install remain held without HoE authority.",
  agentsAuthoritative: "Builder AGENTS.md and acceptance remain authoritative over upstream skill or MCP instruction text.",
} as const;

function isDocsOrLearn(kind: ExpoMcpToolKind): boolean {
  return kind === "docs-read" || kind === "docs-search" || kind === "learn";
}

export function assessExpoMcpRoute(input: ExpoMcpRouteRequest): ExpoMcpRouteAssessment {
  const base = {
    addsMobileOperationTransport: false as const,
    hostNativePreferred: true as const,
    liveMcp: false as const,
    binding: "unbound" as ExpoMcpBindingState,
  };

  if (input.instructionTriesToAlterApprovals || input.instructionTriesToInstall || input.instructionTriesToWriteBuilderTruth) {
    return {
      ...base,
      availability: input.selected ? "available" : "unselected",
      accountAccess: "none",
      executePermission: "denied",
      observedResult: "refused",
      refuseReason: "builders-agents-authoritative",
      notes: EXPO_MCP_ROUTE_NOTES.agentsAuthoritative,
    };
  }

  if (!input.selected) {
    return {
      ...base,
      availability: "unselected",
      accountAccess: "none",
      executePermission: "denied",
      observedResult: "not-run",
      refuseReason: "unselected",
      notes: `${EXPO_MCP_ROUTE_NOTES.optional} Unselected Expo MCP does not block host-native paths.`,
    };
  }

  if (input.preferHostNative !== false && input.hostNativeCoversTask) {
    return {
      ...base,
      availability: "available",
      accountAccess: input.accountAccess ?? "none",
      executePermission: "denied",
      observedResult: "not-run",
      refuseReason: "host-native-preferred",
      notes: EXPO_MCP_ROUTE_NOTES.hostNative,
    };
  }

  if (input.requestLiveConnect) {
    return {
      ...base,
      availability: input.connected ? "available" : "missing-connection",
      accountAccess: input.accountAccess ?? "none",
      executePermission: "live-held",
      observedResult: "live-held",
      refuseReason: "live-mcp-held",
      notes: EXPO_MCP_ROUTE_NOTES.liveHeld,
    };
  }

  if (!input.connected) {
    return {
      ...base,
      availability: "missing-connection",
      accountAccess: "none",
      executePermission: "denied",
      observedResult: "refused",
      refuseReason: "missing-connection",
      notes: "Missing MCP connection is distinct from plan restriction, missing local package, or unsupported host.",
    };
  }

  if (input.planAllowsTool === false) {
    return {
      ...base,
      availability: "plan-restricted",
      accountAccess: input.accountAccess ?? "none",
      executePermission: "denied",
      observedResult: "refused",
      refuseReason: "plan-restriction",
      notes: "Plan restriction is distinct from missing connection or unsupported host. Free availability ≠ every tool in account plan.",
    };
  }

  if (input.localPackagePresent === false) {
    return {
      ...base,
      availability: "missing-local-package",
      accountAccess: input.accountAccess ?? "none",
      executePermission: "denied",
      observedResult: "refused",
      refuseReason: "missing-local-package",
      notes: "Missing local package/dev server is distinct from missing MCP connection.",
    };
  }

  if (input.hostSupported === false) {
    return {
      ...base,
      availability: "unsupported-host",
      accountAccess: input.accountAccess ?? "none",
      executePermission: "denied",
      observedResult: "refused",
      refuseReason: "unsupported-host",
      notes: "Unsupported host/device is distinct from missing connection or plan restriction. Do not invent physical iOS or non-macOS simulator support.",
    };
  }

  if (input.accountAccess === "lost-auth") {
    return {
      ...base,
      availability: "available",
      binding: "bound",
      accountAccess: "lost-auth",
      executePermission: "denied",
      observedResult: "refused",
      refuseReason: "lost-auth",
      notes: "Lost auth preserves an explicit failure/reconciliation state — do not fake green.",
    };
  }

  if (input.partialToolOutput) {
    return {
      ...base,
      availability: "available",
      binding: "bound",
      accountAccess: input.accountAccess ?? "read-docs",
      executePermission: "denied",
      observedResult: "partial-output",
      refuseReason: "partial-output",
      notes: "Partial tool output preserves an explicit reconciliation state — do not treat as complete proof.",
    };
  }

  if (input.newlyExposedUpstreamTool) {
    return {
      ...base,
      availability: "available",
      binding: "bound",
      accountAccess: input.accountAccess ?? "none",
      executePermission: "denied",
      observedResult: "refused",
      refuseReason: "new-tool-not-auto-granted",
      notes: EXPO_MCP_ROUTE_NOTES.schemaDrift,
    };
  }

  const reviewed = EXPO_MCP_REVIEWED_TOOLS.find((tool) => tool.name === input.toolName);
  if (!reviewed) {
    return {
      ...base,
      availability: "available",
      binding: "bound",
      accountAccess: input.accountAccess ?? "none",
      executePermission: "denied",
      observedResult: "refused",
      refuseReason: "new-tool-not-auto-granted",
      notes: `${EXPO_MCP_ROUTE_NOTES.schemaDrift} Unknown tool ${input.toolName} is not in the reviewed inventory.`,
    };
  }

  if (input.observedSchemaVersion && input.observedSchemaVersion !== reviewed.reviewedSchemaVersion) {
    return {
      ...base,
      availability: "available",
      binding: "bound",
      accountAccess: input.accountAccess ?? "none",
      executePermission: "denied",
      observedResult: "refused",
      refuseReason: "schema-drift-requires-review",
      reviewedTool: reviewed,
      notes: EXPO_MCP_ROUTE_NOTES.schemaDrift,
    };
  }

  if (isDocsOrLearn(reviewed.kind)) {
    const effectAsk =
      reviewed.cannotGrant.includes("deploy") ||
      reviewed.cannotGrant.includes("account-access") ||
      reviewed.cannotGrant.includes("file-access") ||
      reviewed.cannotGrant.includes("builder-truth");
    return {
      ...base,
      availability: "available",
      binding: "bound",
      accountAccess: "read-docs",
      executePermission: "docs-only",
      observedResult: "fixture-observed",
      reviewedTool: reviewed,
      refuseReason: effectAsk ? "docs-cannot-grant-effect" : undefined,
      notes: EXPO_MCP_ROUTE_NOTES.docsNotEffect,
    };
  }

  if (!input.executeAuthorized) {
    return {
      ...base,
      availability: "available",
      binding: "bound",
      accountAccess: input.accountAccess ?? "none",
      executePermission: "denied",
      observedResult: "not-run",
      reviewedTool: reviewed,
      notes: `${EXPO_MCP_ROUTE_NOTES.discoveryNotAuth} ${EXPO_MCP_ROUTE_NOTES.fakeNotLive}`,
    };
  }

  return {
    ...base,
    availability: "available",
    binding: "bound",
    accountAccess: input.accountAccess ?? "execute-authorized",
    executePermission: "authorized-dry-run",
    observedResult: "fixture-observed",
    reviewedTool: reviewed,
    notes: `${EXPO_MCP_ROUTE_NOTES.fakeNotLive} ${EXPO_MCP_ROUTE_NOTES.noTransport}`,
  };
}

/** Docs/learn mapping: knowledge assistance only — never an effect grant. */
export function expoMcpDocsCannotGrant(effect: "deploy" | "account-access" | "file-access" | "builder-truth"): {
  readonly granted: false;
  readonly refuseReason: "docs-cannot-grant-effect";
  readonly notes: string;
} {
  void effect;
  return {
    granted: false,
    refuseReason: "docs-cannot-grant-effect",
    notes: EXPO_MCP_ROUTE_NOTES.docsNotEffect,
  };
}

export function assertExpoMcpDoesNotAddTransport(): {
  readonly addsMobileOperationTransport: false;
  readonly consume: "contracts/mobile-operation.ts + adapters/device-proof.ts";
  readonly notes: string;
} {
  return {
    addsMobileOperationTransport: false,
    consume: "contracts/mobile-operation.ts + adapters/device-proof.ts",
    notes: EXPO_MCP_ROUTE_NOTES.noTransport,
  };
}

export interface FakeExpoMcpTransportObservation {
  readonly schemaVersion: string;
  readonly tools: readonly { readonly name: string; readonly kind: ExpoMcpToolKind }[];
  readonly connected: false;
  readonly live: false;
}

/** Disposable fake schema observation for fixtures — never a live MCP connect. */
export function createFakeExpoMcpSchemaObservation(): FakeExpoMcpTransportObservation {
  return {
    schemaVersion: EXPO_MCP_SCHEMA_VERSION_REVIEWED,
    tools: EXPO_MCP_REVIEWED_TOOLS.map((tool) => ({ name: tool.name, kind: tool.kind })),
    connected: false,
    live: false,
  };
}
