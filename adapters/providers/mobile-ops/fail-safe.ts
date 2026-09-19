/**
 * Mobile-ops fail-safe / uncertain-interaction classification (#115 / ADR-0013).
 *
 * Deterministic rules for wrong/stale identity, unsupported host, schema drift,
 * partial/uncertain interaction (no silent fallback), concurrent ownership,
 * and explicit-replan-only fallback after known-safe failure — without live
 * device, live MCP, tool install, or private capture.
 *
 * KTD-115-3: uncertain interaction ≠ silent fallback (no duplicate-effect risk).
 * KTD-115-4: Expo MCP schema drift refuse / no auto-expand.
 * KTD-115-6: captures ≠ acceptance.
 * KTD-115-7: evidence tied to identity.
 */

import {
  MOBILE_OPS_NON_AUTHORITY_FLAGS,
  mobileOpsFlagLooksNoninteractive,
  mobileOpsNoninteractiveGrantsAuthority,
  type MobileOpsOpClass,
} from "../../../catalog/providers/mobile-ops-canonical-map.js";
import type { MobileTarget } from "../../../contracts/mobile-operation.js";

export type MobileOpsFailSafeAction =
  | "fail-closed"
  | "hold-stale"
  | "hold-partial"
  | "hold-concurrent"
  | "refuse-uncertain-fallback"
  | "refuse-schema-drift"
  | "refuse-unsupported"
  | "explicit-replan"
  | "proceed";

export interface MobileOpsIdentityMandate {
  readonly providerId: string;
  readonly operation: string;
  readonly target: MobileTarget;
  readonly stateId?: string;
  readonly ownershipGeneration?: string;
  readonly workspaceId?: string;
  readonly sourceRevision?: string;
  readonly devServerId?: string;
}

export interface MobileOpsFailSafeEvent {
  readonly opClass: MobileOpsOpClass;
  readonly targetMatchesMandate: boolean;
  readonly staleCaptureOrProof: boolean;
  readonly unsupportedHostOrPlatform: boolean;
  readonly schemaDrift: boolean;
  readonly newlyExposedUpstreamTool: boolean;
  readonly interactionUncertainOrPartial: boolean;
  readonly interactionInterrupted: boolean;
  readonly concurrentOwnership: boolean;
  readonly knownSafeFailure: boolean;
  readonly explicitReplanRequested: boolean;
  /** Attempted silent provider switch after uncertain effect. */
  readonly silentProviderFallbackAttempted: boolean;
  readonly captureUsedAsAcceptance: boolean;
  readonly authorityGranted: boolean;
  readonly noninteractiveFlags?: readonly string[];
}

export interface MobileOpsFailSafeDecision {
  readonly action: MobileOpsFailSafeAction;
  readonly allowSilentFallback: boolean;
  readonly allowAutoExpandOps: boolean;
  readonly acceptanceFromCapture: false;
  readonly reason: string;
}

export function classifyMobileOpsFailSafe(event: MobileOpsFailSafeEvent): MobileOpsFailSafeDecision {
  const flags = event.noninteractiveFlags ?? [];
  const base = {
    allowSilentFallback: false as const,
    allowAutoExpandOps: false as const,
    acceptanceFromCapture: false as const,
  };

  if (flags.some(mobileOpsFlagLooksNoninteractive) && !event.authorityGranted) {
    void mobileOpsNoninteractiveGrantsAuthority(flags);
    return { ...base, action: "fail-closed", reason: "noninteractive-flags-do-not-grant-authority" };
  }
  void mobileOpsNoninteractiveGrantsAuthority(flags);

  if (event.captureUsedAsAcceptance) {
    return { ...base, action: "fail-closed", reason: "captures-are-not-acceptance" };
  }

  if (!event.targetMatchesMandate) {
    return { ...base, action: "fail-closed", reason: "wrong-target-identity" };
  }

  if (event.staleCaptureOrProof) {
    return { ...base, action: "hold-stale", reason: "stale-capture-or-proof" };
  }

  if (event.unsupportedHostOrPlatform) {
    return { ...base, action: "refuse-unsupported", reason: "unsupported-host-or-platform" };
  }

  if (event.schemaDrift || event.newlyExposedUpstreamTool) {
    return {
      ...base,
      action: "refuse-schema-drift",
      reason: event.newlyExposedUpstreamTool ? "new-tool-not-auto-granted" : "schema-drift-requires-review",
    };
  }

  if (event.concurrentOwnership) {
    return { ...base, action: "hold-concurrent", reason: "concurrent-ownership" };
  }

  if (event.interactionUncertainOrPartial || event.interactionInterrupted) {
    if (event.silentProviderFallbackAttempted) {
      return { ...base, action: "refuse-uncertain-fallback", reason: "uncertain-interaction-no-silent-fallback" };
    }
    return { ...base, action: "refuse-uncertain-fallback", reason: "interrupted-effect-uncertain" };
  }

  if (event.silentProviderFallbackAttempted) {
    return { ...base, action: "refuse-uncertain-fallback", reason: "silent-provider-fallback-forbidden" };
  }

  if (event.knownSafeFailure && event.explicitReplanRequested) {
    return { ...base, action: "explicit-replan", reason: "explicit-replan-after-known-safe-failure" };
  }

  if (event.knownSafeFailure && !event.explicitReplanRequested) {
    return { ...base, action: "fail-closed", reason: "known-safe-failure-requires-explicit-replan" };
  }

  return { ...base, action: "proceed", reason: "ok" };
}

export function targetsMatch(mandate: MobileTarget, candidate: MobileTarget): boolean {
  return JSON.stringify(mandate) === JSON.stringify(candidate);
}

export function classifyWrongMobileTarget(
  opClass: MobileOpsOpClass,
  mandate: MobileOpsIdentityMandate,
  candidate: MobileOpsIdentityMandate,
): MobileOpsFailSafeDecision {
  const identityOk =
    mandate.providerId === candidate.providerId &&
    mandate.operation === candidate.operation &&
    targetsMatch(mandate.target, candidate.target) &&
    (mandate.stateId === undefined || mandate.stateId === candidate.stateId) &&
    (mandate.ownershipGeneration === undefined || mandate.ownershipGeneration === candidate.ownershipGeneration) &&
    (mandate.workspaceId === undefined || mandate.workspaceId === candidate.workspaceId) &&
    (mandate.sourceRevision === undefined || mandate.sourceRevision === candidate.sourceRevision) &&
    (mandate.devServerId === undefined || mandate.devServerId === candidate.devServerId);

  return classifyMobileOpsFailSafe({
    opClass,
    targetMatchesMandate: identityOk,
    staleCaptureOrProof: false,
    unsupportedHostOrPlatform: false,
    schemaDrift: false,
    newlyExposedUpstreamTool: false,
    interactionUncertainOrPartial: false,
    interactionInterrupted: false,
    concurrentOwnership: false,
    knownSafeFailure: false,
    explicitReplanRequested: false,
    silentProviderFallbackAttempted: false,
    captureUsedAsAcceptance: false,
    authorityGranted: true,
  });
}

export function classifyUncertainInteractionNoSilentFallback(opClass: MobileOpsOpClass = "interact"): MobileOpsFailSafeDecision {
  return classifyMobileOpsFailSafe({
    opClass,
    targetMatchesMandate: true,
    staleCaptureOrProof: false,
    unsupportedHostOrPlatform: false,
    schemaDrift: false,
    newlyExposedUpstreamTool: false,
    interactionUncertainOrPartial: true,
    interactionInterrupted: true,
    concurrentOwnership: false,
    knownSafeFailure: false,
    explicitReplanRequested: false,
    silentProviderFallbackAttempted: true,
    captureUsedAsAcceptance: false,
    authorityGranted: true,
  });
}

export function classifyExplicitReplanAfterKnownSafeFailure(opClass: MobileOpsOpClass = "launch"): MobileOpsFailSafeDecision {
  return classifyMobileOpsFailSafe({
    opClass,
    targetMatchesMandate: true,
    staleCaptureOrProof: false,
    unsupportedHostOrPlatform: false,
    schemaDrift: false,
    newlyExposedUpstreamTool: false,
    interactionUncertainOrPartial: false,
    interactionInterrupted: false,
    concurrentOwnership: false,
    knownSafeFailure: true,
    explicitReplanRequested: true,
    silentProviderFallbackAttempted: false,
    captureUsedAsAcceptance: false,
    authorityGranted: true,
  });
}

export function classifySchemaDriftRefuse(opClass: MobileOpsOpClass = "expo-mcp-device"): MobileOpsFailSafeDecision {
  return classifyMobileOpsFailSafe({
    opClass,
    targetMatchesMandate: true,
    staleCaptureOrProof: false,
    unsupportedHostOrPlatform: false,
    schemaDrift: true,
    newlyExposedUpstreamTool: false,
    interactionUncertainOrPartial: false,
    interactionInterrupted: false,
    concurrentOwnership: false,
    knownSafeFailure: false,
    explicitReplanRequested: false,
    silentProviderFallbackAttempted: false,
    captureUsedAsAcceptance: false,
    authorityGranted: true,
  });
}

export function classifyNewToolAutoExpandRefuse(opClass: MobileOpsOpClass = "expo-mcp-device"): MobileOpsFailSafeDecision {
  return classifyMobileOpsFailSafe({
    opClass,
    targetMatchesMandate: true,
    staleCaptureOrProof: false,
    unsupportedHostOrPlatform: false,
    schemaDrift: false,
    newlyExposedUpstreamTool: true,
    interactionUncertainOrPartial: false,
    interactionInterrupted: false,
    concurrentOwnership: false,
    knownSafeFailure: false,
    explicitReplanRequested: false,
    silentProviderFallbackAttempted: false,
    captureUsedAsAcceptance: false,
    authorityGranted: true,
  });
}

export function classifyCaptureAsAcceptanceRefuse(): MobileOpsFailSafeDecision {
  return classifyMobileOpsFailSafe({
    opClass: "capture-screenshot",
    targetMatchesMandate: true,
    staleCaptureOrProof: false,
    unsupportedHostOrPlatform: false,
    schemaDrift: false,
    newlyExposedUpstreamTool: false,
    interactionUncertainOrPartial: false,
    interactionInterrupted: false,
    concurrentOwnership: false,
    knownSafeFailure: false,
    explicitReplanRequested: false,
    silentProviderFallbackAttempted: false,
    captureUsedAsAcceptance: true,
    authorityGranted: true,
  });
}

/** Flags that never grant live-device / MCP / install authority. */
export function liveDeviceAllowedByYesFlag(flags: readonly string[]): false {
  void flags;
  void MOBILE_OPS_NON_AUTHORITY_FLAGS;
  return false;
}
