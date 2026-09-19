/**
 * Growth-agent fail-safe / discovery / effect classification (#116 / ADR-0013).
 *
 * Deterministic rules for: schema/tool discovery refuse, wrong project,
 * stale analytics window, uncertain schedule/publish, connection loss,
 * effect-class separation, and noninteractive flags that never grant
 * live publish / experiment / customer-data / sign-in authority.
 *
 * KTD-116-4: discovery ≠ auto-expand.
 * KTD-116-5: effect classes remain distinct.
 * KTD-116-3: fake ≠ contract.
 * KTD-116-6: #24 fake ≠ live support.
 */
import {
  GROWTH_AGENT_NON_AUTHORITY_FLAGS,
  growthAgentFlagLooksNoninteractive,
  growthAgentNoninteractiveGrantsAuthority,
  type GrowthAgentEffectClass,
  type GrowthAgentOpClass,
} from "../../../catalog/providers/growth-agent-canonical-map.js";

export type GrowthAgentFailSafeAction =
  | "fail-closed"
  | "hold-stale"
  | "hold-partial"
  | "hold-connection-loss"
  | "refuse-uncertain-schedule"
  | "refuse-uncertain-publish"
  | "refuse-schema-drift"
  | "refuse-discovery-expand"
  | "refuse-wrong-project"
  | "refuse-effect-collapse"
  | "proceed";

export interface GrowthAgentIdentityMandate {
  readonly providerId: string;
  readonly operation: string;
  readonly projectId?: string;
  readonly connectionId?: string;
  readonly workspaceId?: string;
}

export interface GrowthAgentFailSafeEvent {
  readonly opClass: GrowthAgentOpClass;
  readonly effectClass: GrowthAgentEffectClass;
  readonly projectMatchesMandate: boolean;
  readonly staleAnalyticsWindow: boolean;
  readonly schemaDrift: boolean;
  readonly newlyExposedUpstreamTool: boolean;
  readonly uncertainScheduleResult: boolean;
  readonly uncertainPublishResult: boolean;
  readonly connectionLost: boolean;
  readonly paginationPartial: boolean;
  /** Attempted collapse of distinct effect classes (e.g. schedule treated as public-publish). */
  readonly effectClassCollapsed: boolean;
  readonly silentDiscoveryExpandAttempted: boolean;
  readonly authorityGranted: boolean;
  readonly noninteractiveFlags?: readonly string[];
  /** Attempted live publish / experiment / customer-data / sign-in. */
  readonly liveProtectedAttempted: boolean;
}

export interface GrowthAgentFailSafeDecision {
  readonly action: GrowthAgentFailSafeAction;
  readonly allowSilentDiscoveryExpand: boolean;
  readonly allowEffectCollapse: boolean;
  readonly allowLiveProtected: false;
  readonly reason: string;
}

export function classifyGrowthAgentFailSafe(event: GrowthAgentFailSafeEvent): GrowthAgentFailSafeDecision {
  const flags = event.noninteractiveFlags ?? [];
  const base = {
    allowSilentDiscoveryExpand: false as const,
    allowEffectCollapse: false as const,
    allowLiveProtected: false as const,
  };

  if (flags.some(growthAgentFlagLooksNoninteractive) && !event.authorityGranted) {
    void growthAgentNoninteractiveGrantsAuthority(flags);
    return { ...base, action: "fail-closed", reason: "noninteractive-flags-do-not-grant-authority" };
  }
  void growthAgentNoninteractiveGrantsAuthority(flags);

  if (event.liveProtectedAttempted) {
    return { ...base, action: "fail-closed", reason: "live-publish-experiment-customer-query-signin-held" };
  }

  if (event.effectClassCollapsed) {
    return { ...base, action: "refuse-effect-collapse", reason: "effect-classes-remain-distinct" };
  }

  if (!event.projectMatchesMandate) {
    return { ...base, action: "refuse-wrong-project", reason: "wrong-project-or-connection" };
  }

  if (event.staleAnalyticsWindow) {
    return { ...base, action: "hold-stale", reason: "stale-analytics-window" };
  }

  if (event.schemaDrift || event.newlyExposedUpstreamTool || event.silentDiscoveryExpandAttempted) {
    return {
      ...base,
      action: event.newlyExposedUpstreamTool || event.silentDiscoveryExpandAttempted ? "refuse-discovery-expand" : "refuse-schema-drift",
      reason: event.newlyExposedUpstreamTool
        ? "new-tool-not-auto-granted"
        : event.silentDiscoveryExpandAttempted
          ? "discovery-must-not-auto-expand"
          : "schema-drift-requires-review",
    };
  }

  if (event.connectionLost) {
    return { ...base, action: "hold-connection-loss", reason: "connection-loss" };
  }

  if (event.uncertainPublishResult) {
    return { ...base, action: "refuse-uncertain-publish", reason: "uncertain-publish-reconcile-before-retry" };
  }

  if (event.uncertainScheduleResult) {
    return { ...base, action: "refuse-uncertain-schedule", reason: "uncertain-schedule-reconcile-before-retry" };
  }

  if (event.paginationPartial) {
    return { ...base, action: "hold-partial", reason: "pagination-or-partial-output" };
  }

  return { ...base, action: "proceed", reason: "ok" };
}

export function classifyWrongGrowthProject(
  opClass: GrowthAgentOpClass,
  effectClass: GrowthAgentEffectClass,
  mandate: GrowthAgentIdentityMandate,
  candidate: GrowthAgentIdentityMandate,
): GrowthAgentFailSafeDecision {
  const identityOk =
    mandate.providerId === candidate.providerId &&
    mandate.operation === candidate.operation &&
    (mandate.projectId === undefined || mandate.projectId === candidate.projectId) &&
    (mandate.connectionId === undefined || mandate.connectionId === candidate.connectionId) &&
    (mandate.workspaceId === undefined || mandate.workspaceId === candidate.workspaceId);

  return classifyGrowthAgentFailSafe({
    opClass,
    effectClass,
    projectMatchesMandate: identityOk,
    staleAnalyticsWindow: false,
    schemaDrift: false,
    newlyExposedUpstreamTool: false,
    uncertainScheduleResult: false,
    uncertainPublishResult: false,
    connectionLost: false,
    paginationPartial: false,
    effectClassCollapsed: false,
    silentDiscoveryExpandAttempted: false,
    authorityGranted: true,
    liveProtectedAttempted: false,
  });
}

export function classifySchemaDriftRefuse(opClass: GrowthAgentOpClass = "layers-discovery-drift"): GrowthAgentFailSafeDecision {
  return classifyGrowthAgentFailSafe({
    opClass,
    effectClass: "observe",
    projectMatchesMandate: true,
    staleAnalyticsWindow: false,
    schemaDrift: true,
    newlyExposedUpstreamTool: false,
    uncertainScheduleResult: false,
    uncertainPublishResult: false,
    connectionLost: false,
    paginationPartial: false,
    effectClassCollapsed: false,
    silentDiscoveryExpandAttempted: false,
    authorityGranted: true,
    liveProtectedAttempted: false,
  });
}

export function classifyDiscoveryAutoExpandRefuse(opClass: GrowthAgentOpClass = "layers-discovery-drift"): GrowthAgentFailSafeDecision {
  return classifyGrowthAgentFailSafe({
    opClass,
    effectClass: "observe",
    projectMatchesMandate: true,
    staleAnalyticsWindow: false,
    schemaDrift: false,
    newlyExposedUpstreamTool: true,
    uncertainScheduleResult: false,
    uncertainPublishResult: false,
    connectionLost: false,
    paginationPartial: false,
    effectClassCollapsed: false,
    silentDiscoveryExpandAttempted: true,
    authorityGranted: true,
    liveProtectedAttempted: false,
  });
}

export function classifyUncertainScheduleRefuse(opClass: GrowthAgentOpClass = "postiz-schedule"): GrowthAgentFailSafeDecision {
  return classifyGrowthAgentFailSafe({
    opClass,
    effectClass: "schedule",
    projectMatchesMandate: true,
    staleAnalyticsWindow: false,
    schemaDrift: false,
    newlyExposedUpstreamTool: false,
    uncertainScheduleResult: true,
    uncertainPublishResult: false,
    connectionLost: false,
    paginationPartial: false,
    effectClassCollapsed: false,
    silentDiscoveryExpandAttempted: false,
    authorityGranted: true,
    liveProtectedAttempted: false,
  });
}

export function classifyUncertainPublishRefuse(opClass: GrowthAgentOpClass = "postiz-live-publish"): GrowthAgentFailSafeDecision {
  return classifyGrowthAgentFailSafe({
    opClass,
    effectClass: "public-publish",
    projectMatchesMandate: true,
    staleAnalyticsWindow: false,
    schemaDrift: false,
    newlyExposedUpstreamTool: false,
    uncertainScheduleResult: false,
    uncertainPublishResult: true,
    connectionLost: false,
    paginationPartial: false,
    effectClassCollapsed: false,
    silentDiscoveryExpandAttempted: false,
    authorityGranted: true,
    liveProtectedAttempted: false,
  });
}

export function classifyConnectionLoss(opClass: GrowthAgentOpClass = "layers-get-job"): GrowthAgentFailSafeDecision {
  return classifyGrowthAgentFailSafe({
    opClass,
    effectClass: "observe",
    projectMatchesMandate: true,
    staleAnalyticsWindow: false,
    schemaDrift: false,
    newlyExposedUpstreamTool: false,
    uncertainScheduleResult: false,
    uncertainPublishResult: false,
    connectionLost: true,
    paginationPartial: false,
    effectClassCollapsed: false,
    silentDiscoveryExpandAttempted: false,
    authorityGranted: true,
    liveProtectedAttempted: false,
  });
}

export function classifyStaleAnalyticsWindow(opClass: GrowthAgentOpClass = "consumer-probe"): GrowthAgentFailSafeDecision {
  return classifyGrowthAgentFailSafe({
    opClass,
    effectClass: "analytics-read",
    projectMatchesMandate: true,
    staleAnalyticsWindow: true,
    schemaDrift: false,
    newlyExposedUpstreamTool: false,
    uncertainScheduleResult: false,
    uncertainPublishResult: false,
    connectionLost: false,
    paginationPartial: false,
    effectClassCollapsed: false,
    silentDiscoveryExpandAttempted: false,
    authorityGranted: true,
    liveProtectedAttempted: false,
  });
}

export function classifyEffectCollapseRefuse(
  attempted: GrowthAgentEffectClass,
  treatedAs: GrowthAgentEffectClass,
): GrowthAgentFailSafeDecision {
  void attempted;
  void treatedAs;
  return classifyGrowthAgentFailSafe({
    opClass: "postiz-schedule",
    effectClass: attempted,
    projectMatchesMandate: true,
    staleAnalyticsWindow: false,
    schemaDrift: false,
    newlyExposedUpstreamTool: false,
    uncertainScheduleResult: false,
    uncertainPublishResult: false,
    connectionLost: false,
    paginationPartial: false,
    effectClassCollapsed: true,
    silentDiscoveryExpandAttempted: false,
    authorityGranted: true,
    liveProtectedAttempted: false,
  });
}

/** Flags that never grant live publish / experiment / customer-data / sign-in. */
export function liveProtectedAllowedByYesFlag(flags: readonly string[]): false {
  void flags;
  void GROWTH_AGENT_NON_AUTHORITY_FLAGS;
  return false;
}
