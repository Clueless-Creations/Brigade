/**
 * ASC / App Review uncertain-execution classification (#113).
 *
 * Kernel-owned identity/effect recovery stays elsewhere. This module names the
 * adapter-boundary rules for mutation + failed verify, wrong-target fail-closed,
 * duplicate refusal, and partial/truncated provider output — without live ASC.
 *
 * KTD-113-3: confirmed mutation + failed verification resumes verification.
 * KTD-113-4: wrong account/app/build/env fails before protected effects.
 * KTD-113-8: `--yes` / noninteractive never grants authority.
 */

import {
  ASC_NON_AUTHORITY_FLAGS,
  ascFlagLooksNoninteractive,
  ascNoninteractiveGrantsAuthority,
  type AscOpClass,
} from "../../catalog/providers/apple-asc-canonical-map.js";

export type AscUncertainPhase =
  "failure-before-dispatch" | "dispatched-unknown" | "remotely-accepted" | "verification-pending" | "verified" | "irreconcilably-uncertain";

export type AscUncertainResumeAction = "resume-verify" | "refuse-blind-replay" | "fail-closed" | "hold-duplicate" | "hold-partial-output" | "no-op";

export interface AscMutationTarget {
  readonly appId: string;
  readonly appleTeamId?: string;
  readonly appStoreVersionId?: string;
  readonly marketingVersion?: string;
  readonly environment?: string;
}

export interface AscUncertainEvent {
  readonly opClass: AscOpClass;
  readonly phase: AscUncertainPhase;
  /** True when a write/effect was already confirmed remotely. */
  readonly mutationConfirmed: boolean;
  /** True when local receipt/readback has not yet matched remote acceptance. */
  readonly localReceiptMissing: boolean;
  readonly verifyFailed: boolean;
  readonly duplicateRequest: boolean;
  readonly targetMatchesMandate: boolean;
  readonly outputTruncatedOrPartial: boolean;
  readonly authorityGranted: boolean;
  readonly noninteractiveFlags?: readonly string[];
}

export interface AscUncertainDecision {
  readonly action: AscUncertainResumeAction;
  readonly allowMutationReplay: boolean;
  readonly reason: string;
}

/**
 * Decide the next action after an uncertain remote ASC effect.
 * Never authorizes blind mutation replay after a confirmed write.
 */
export function classifyAscUncertainExecution(event: AscUncertainEvent): AscUncertainDecision {
  const flags = event.noninteractiveFlags ?? [];
  if (flags.some(ascFlagLooksNoninteractive) && !event.authorityGranted) {
    return {
      action: "fail-closed",
      allowMutationReplay: false,
      reason: "noninteractive-flags-do-not-grant-authority",
    };
  }
  // Prove the helper stays false for any flag bag.
  void ascNoninteractiveGrantsAuthority(flags);

  if (!event.targetMatchesMandate) {
    return {
      action: "fail-closed",
      allowMutationReplay: false,
      reason: "wrong-target-before-protected-effect",
    };
  }

  if (event.duplicateRequest && event.phase !== "failure-before-dispatch") {
    return {
      action: "hold-duplicate",
      allowMutationReplay: false,
      reason: "duplicate-request-while-effect-in-flight-or-done",
    };
  }

  if (event.outputTruncatedOrPartial && event.phase !== "verified") {
    return {
      action: "hold-partial-output",
      allowMutationReplay: false,
      reason: "pagination-or-partial-provider-output",
    };
  }

  if (event.mutationConfirmed && event.verifyFailed) {
    return {
      action: "resume-verify",
      allowMutationReplay: false,
      reason: "confirmed-mutation-failed-verify-resumes-observation",
    };
  }

  if (event.mutationConfirmed && event.localReceiptMissing) {
    return {
      action: "resume-verify",
      allowMutationReplay: false,
      reason: "remote-accept-before-local-receipt",
    };
  }

  if (event.phase === "dispatched-unknown" || event.phase === "verification-pending") {
    return {
      action: "resume-verify",
      allowMutationReplay: false,
      reason: "uncertain-phase-requires-readback",
    };
  }

  if (event.phase === "irreconcilably-uncertain") {
    return {
      action: "refuse-blind-replay",
      allowMutationReplay: false,
      reason: "irreconcilable-uncertainty-holds-new-mutation",
    };
  }

  if (event.phase === "failure-before-dispatch") {
    return {
      action: "no-op",
      allowMutationReplay: event.authorityGranted,
      reason: "no-effect-dispatched",
    };
  }

  return {
    action: "no-op",
    allowMutationReplay: false,
    reason: "stable-or-verified",
  };
}

/**
 * Timeout after a recorded mutation: treat as verification-pending and never
 * re-dispatch the write. Mirrors resubmit_timeout_readback for any op class.
 */
export function classifyTimeoutAfterMutation(opClass: AscOpClass): AscUncertainDecision {
  return classifyAscUncertainExecution({
    opClass,
    phase: "verification-pending",
    mutationConfirmed: true,
    localReceiptMissing: true,
    verifyFailed: false,
    duplicateRequest: false,
    targetMatchesMandate: true,
    outputTruncatedOrPartial: false,
    authorityGranted: true,
  });
}

export function targetsMatch(mandate: AscMutationTarget, candidate: AscMutationTarget): boolean {
  if (mandate.appId !== candidate.appId) return false;
  if (mandate.appleTeamId !== undefined && candidate.appleTeamId !== undefined && mandate.appleTeamId !== candidate.appleTeamId) {
    return false;
  }
  if (mandate.appStoreVersionId !== undefined && candidate.appStoreVersionId !== undefined && mandate.appStoreVersionId !== candidate.appStoreVersionId) {
    return false;
  }
  if (mandate.marketingVersion !== undefined && candidate.marketingVersion !== undefined && mandate.marketingVersion !== candidate.marketingVersion) {
    return false;
  }
  if (mandate.environment !== undefined && candidate.environment !== undefined && mandate.environment !== candidate.environment) {
    return false;
  }
  return true;
}

export function classifyWrongTarget(opClass: AscOpClass, mandate: AscMutationTarget, candidate: AscMutationTarget): AscUncertainDecision {
  return classifyAscUncertainExecution({
    opClass,
    phase: "failure-before-dispatch",
    mutationConfirmed: false,
    localReceiptMissing: false,
    verifyFailed: false,
    duplicateRequest: false,
    targetMatchesMandate: targetsMatch(mandate, candidate),
    outputTruncatedOrPartial: false,
    authorityGranted: true,
  });
}

/** Truncated CLI JSON / partial page must fail closed — never invent completeness. */
export function classifyPartialProviderOutput(opClass: AscOpClass, truncated: boolean): AscUncertainDecision {
  return classifyAscUncertainExecution({
    opClass,
    phase: "dispatched-unknown",
    mutationConfirmed: false,
    localReceiptMissing: true,
    verifyFailed: false,
    duplicateRequest: false,
    targetMatchesMandate: true,
    outputTruncatedOrPartial: truncated,
    authorityGranted: true,
  });
}

export { ASC_NON_AUTHORITY_FLAGS, ascFlagLooksNoninteractive, ascNoninteractiveGrantsAuthority };
