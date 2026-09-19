/**
 * Greenfield delivery-audit fail-safe classifiers (#66).
 *
 * Deterministic refuse/hold decisions for: docs-padding-as-intent, fake
 * overhead savings, proof-class collapse, synthetic liveLaunchProven,
 * sibling shotgun, live/publish in #66, U5/#511, and umbrella-closes-children.
 */
import {
  GREENFIELD_66_LIVE_OWNER,
  GREENFIELD_66_NEXT_AFTER_CLOSE,
  GREENFIELD_66_U4_REMAINING_SEQUENCE,
  type Greenfield66ProofClass,
} from "../../catalog/providers/greenfield-delivery-audit-map.js";
import {
  deliveryClassesCollapsed,
  intentEqualsDocsPadding,
  liveLaunchProvenFromSynthetic,
  overheadSavingsFromWorkflowCountAlone,
  shotgunOpenChildren,
} from "./boundary.js";

export type Greenfield66FailSafeAction =
  | "fail-closed"
  | "hold-live-for-72"
  | "hold-publish-for-72"
  | "refuse-docs-padding-as-intent"
  | "refuse-fake-overhead-savings"
  | "refuse-proof-class-collapse"
  | "refuse-synthetic-live-proven"
  | "refuse-sibling-shotgun"
  | "refuse-u5"
  | "refuse-umbrella-closes-children"
  | "refuse-workflow-consolidation"
  | "proceed-framework-only";

export interface Greenfield66FailSafeDecision {
  readonly action: Greenfield66FailSafeAction;
  readonly reason: string;
  readonly ownerIssue: string;
}

export interface Greenfield66FailSafeEvent {
  readonly kind:
    | "intent-claim"
    | "overhead-claim"
    | "proof-claim"
    | "live-request"
    | "publish-request"
    | "sibling-batch"
    | "u5-request"
    | "umbrella-close"
    | "consolidation-request"
    | "framework-only";
  readonly docsPaddingAsIntent?: boolean;
  readonly packetShapeAsIntent?: boolean;
  readonly checklistDensityAsIntent?: boolean;
  readonly structuralOnlyAsSemantic?: boolean;
  readonly structuralOnlyAsRuntime?: boolean;
  readonly workflowCountReduced?: boolean;
  readonly measuredIntervalPresent?: boolean;
  readonly stageARetainHonored?: boolean;
  readonly proofClass?: Greenfield66ProofClass | "synthetic" | "ci-green" | "tuck-screenshot";
  readonly liveLaunchProven?: boolean;
  readonly deliveryAccepted?: boolean;
  readonly submissionReadiness?: boolean;
  readonly submitted?: boolean;
  readonly released?: boolean;
  readonly live?: boolean;
  readonly treatedAsSame?: boolean;
  readonly requestedIssues?: readonly string[];
  readonly closeChildren?: boolean;
}

export function classifyGreenfield66FailSafe(event: Greenfield66FailSafeEvent): Greenfield66FailSafeDecision {
  if (event.kind === "u5-request") {
    return {
      action: "refuse-u5",
      reason: "U5 / #511 is hard-held until HoE orders; after #66 next is #70 only.",
      ownerIssue: GREENFIELD_66_NEXT_AFTER_CLOSE,
    };
  }

  if (event.kind === "live-request") {
    return {
      action: "hold-live-for-72",
      reason: "Live greenfield complete-business benchmark is deferred to #72.",
      ownerIssue: GREENFIELD_66_LIVE_OWNER,
    };
  }

  if (event.kind === "publish-request") {
    return {
      action: "hold-publish-for-72",
      reason: "Publish-of-evidence is deferred to #72 with founder authority.",
      ownerIssue: GREENFIELD_66_LIVE_OWNER,
    };
  }

  if (event.kind === "consolidation-request") {
    return {
      action: "refuse-workflow-consolidation",
      reason: "No production workflow consolidation in #66; Stage A retain until measured #72 interval (#73).",
      ownerIssue: "#73",
    };
  }

  if (event.kind === "umbrella-close" && event.closeChildren) {
    return {
      action: "refuse-umbrella-closes-children",
      reason: "Closing #66 must not close open children #70/#71/#72/#73/#75/#76.",
      ownerIssue: "#66",
    };
  }

  if (event.kind === "sibling-batch" && shotgunOpenChildren(event.requestedIssues ?? [])) {
    return {
      action: "refuse-sibling-shotgun",
      reason: `Open children must stay sequenced ${GREENFIELD_66_U4_REMAINING_SEQUENCE.join(" → ")}; one-issue deepen/WIP.`,
      ownerIssue: GREENFIELD_66_NEXT_AFTER_CLOSE,
    };
  }

  if (
    event.kind === "intent-claim" &&
    intentEqualsDocsPadding({
      docsPaddingAsIntent: event.docsPaddingAsIntent,
      packetShapeAsIntent: event.packetShapeAsIntent,
      checklistDensityAsIntent: event.checklistDensityAsIntent,
      structuralOnlyAsSemantic: event.structuralOnlyAsSemantic,
      structuralOnlyAsRuntime: event.structuralOnlyAsRuntime,
    })
  ) {
    return {
      action: "refuse-docs-padding-as-intent",
      reason: "Intent ≠ docs padding / packet shape / checklist density; consume #74 structural≠semantic≠runtime.",
      ownerIssue: "#74",
    };
  }

  if (
    event.kind === "overhead-claim" &&
    overheadSavingsFromWorkflowCountAlone({
      workflowCountReduced: event.workflowCountReduced,
      measuredIntervalPresent: event.measuredIntervalPresent,
      stageARetainHonored: event.stageARetainHonored,
    })
  ) {
    return {
      action: "refuse-fake-overhead-savings",
      reason: "Workflow-count reduction alone is not measurable overhead savings; Stage A retain until #72 interval.",
      ownerIssue: "#73",
    };
  }

  if (
    event.kind === "proof-claim" &&
    deliveryClassesCollapsed({
      deliveryAccepted: event.deliveryAccepted,
      submissionReadiness: event.submissionReadiness,
      submitted: event.submitted,
      released: event.released,
      live: event.live,
      treatedAsSame: event.treatedAsSame,
    })
  ) {
    return {
      action: "refuse-proof-class-collapse",
      reason: "delivery ≠ submission-readiness ≠ submitted ≠ released ≠ live.",
      ownerIssue: GREENFIELD_66_LIVE_OWNER,
    };
  }

  if (
    event.kind === "proof-claim" &&
    liveLaunchProvenFromSynthetic({
      liveLaunchProven: event.liveLaunchProven,
      evidenceClass: event.proofClass,
    })
  ) {
    return {
      action: "refuse-synthetic-live-proven",
      reason: "liveLaunchProven must not flip from synthetic/fixture/screenshot/protocol/CI success.",
      ownerIssue: GREENFIELD_66_LIVE_OWNER,
    };
  }

  if (event.kind === "framework-only" || event.kind === "umbrella-close") {
    return {
      action: "proceed-framework-only",
      reason: "Umbrella framework assertions/docs/sequence lock only; children remain open; live held for #72.",
      ownerIssue: "#66",
    };
  }

  return {
    action: "fail-closed",
    reason: `unrecognized or unsafe greenfield #66 event: ${event.kind}`,
    ownerIssue: "#66",
  };
}

export function liveProtectedAllowedByYesFlag(_yes: boolean): boolean {
  return false;
}
