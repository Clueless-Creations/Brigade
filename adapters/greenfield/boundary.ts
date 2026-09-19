/**
 * Greenfield delivery-audit boundary guards (#66 / U4-1 umbrella).
 *
 * Thin asserts for the three pillars + sequence lock. Does not implement
 * sibling issues, consolidate workflows, invent a second proof ontology /
 * planner / scheduler / execution store, or flip liveLaunchProven from
 * synthetic success. Live benchmark + publish-of-evidence stay on #72.
 */
import {
  GREENFIELD_66_MAP_PATH,
  GREENFIELD_66_CLOSED_CHILDREN,
  GREENFIELD_66_OPEN_CHILDREN,
  GREENFIELD_66_U4_REMAINING_SEQUENCE,
  GREENFIELD_66_SKIP_CLOSED,
  GREENFIELD_66_NEXT_AFTER_CLOSE,
  GREENFIELD_66_LIVE_OWNER,
  GREENFIELD_66_HARD_HOLDS,
  GREENFIELD_66_PROOF_CLASSES,
  GREENFIELD_66_PILLARS,
  GREENFIELD_66_DISTINCT_PROOF_NOTE,
  greenfield66SequenceIsLocked,
  greenfield66ProofClassesRemainDistinct,
  greenfield66UmbrellaClosesChildren,
  greenfield66AllowsLiveInThisSlice,
  greenfield66AllowsU5,
  greenfield66InventedSecondProofOntology,
  greenfield66ConsolidatesWorkflows,
  type Greenfield66ProofClass,
  type Greenfield66HardHold,
} from "../../catalog/providers/greenfield-delivery-audit-map.js";

export function greenfield66MapModulePath(): string {
  return GREENFIELD_66_MAP_PATH;
}

/** Pillar 1 — intent ≠ docs padding (consume #74; no second ontology). */
export function intentEqualsDocsPadding(claim: {
  readonly docsPaddingAsIntent?: boolean;
  readonly packetShapeAsIntent?: boolean;
  readonly checklistDensityAsIntent?: boolean;
  readonly structuralOnlyAsSemantic?: boolean;
  readonly structuralOnlyAsRuntime?: boolean;
}): boolean {
  return Boolean(
    claim.docsPaddingAsIntent || claim.packetShapeAsIntent || claim.checklistDensityAsIntent || claim.structuralOnlyAsSemantic || claim.structuralOnlyAsRuntime,
  );
}

/** Pillar 2 — overhead measurable; workflow-count alone is not savings. */
export function overheadSavingsFromWorkflowCountAlone(claim: {
  readonly workflowCountReduced?: boolean;
  readonly measuredIntervalPresent?: boolean;
  readonly stageARetainHonored?: boolean;
}): boolean {
  return Boolean(claim.workflowCountReduced && !claim.measuredIntervalPresent);
}

export function stageARetainRequired(claim: { readonly measuredIntervalPresent?: boolean }): boolean {
  return !claim.measuredIntervalPresent;
}

/**
 * Pillar 3 — e2e proof-class honesty.
 * delivery ≠ submission-readiness ≠ submitted ≠ released ≠ live.
 * fixture / screenshot / protocol-alone ≠ live complete-business.
 */
export const GREENFIELD_66_NON_LIVE_PROOF_CLASSES: readonly Greenfield66ProofClass[] = [
  "fixture",
  "screenshot",
  "protocol-doc",
  "lifecycle-public-test",
  "criteria-frozen-authoring",
] as const;

export function proofClassIsLiveCompleteBusiness(proofClass: Greenfield66ProofClass): boolean {
  return proofClass === "live-complete-business";
}

export function nonLiveProofClaimsLive(proofClass: Greenfield66ProofClass): boolean {
  return (GREENFIELD_66_NON_LIVE_PROOF_CLASSES as readonly string[]).includes(proofClass);
}

export function deliveryClassesCollapsed(claim: {
  readonly deliveryAccepted?: boolean;
  readonly submissionReadiness?: boolean;
  readonly submitted?: boolean;
  readonly released?: boolean;
  readonly live?: boolean;
  readonly treatedAsSame?: boolean;
}): boolean {
  const distinctCount = [claim.deliveryAccepted, claim.submissionReadiness, claim.submitted, claim.released, claim.live].filter(
    (flag) => flag !== undefined,
  ).length;
  return Boolean(claim.treatedAsSame && distinctCount >= 2);
}

/** Never set liveLaunchProven from synthetic / fixture / protocol success. */
export function liveLaunchProvenFromSynthetic(claim: {
  readonly liveLaunchProven?: boolean;
  readonly evidenceClass?: Greenfield66ProofClass | "synthetic" | "ci-green" | "tuck-screenshot";
}): boolean {
  if (!claim.liveLaunchProven) return false;
  if (claim.evidenceClass === "synthetic" || claim.evidenceClass === "ci-green" || claim.evidenceClass === "tuck-screenshot") {
    return true;
  }
  if (claim.evidenceClass !== undefined && nonLiveProofClaimsLive(claim.evidenceClass)) {
    return true;
  }
  return false;
}

export function sequenceLockHolds(): boolean {
  return greenfield66SequenceIsLocked();
}

export function shotgunOpenChildren(requested: readonly string[]): boolean {
  const open = new Set<string>(GREENFIELD_66_OPEN_CHILDREN);
  return requested.filter((issue) => open.has(issue)).length > 1;
}

export function implementsSiblingIn66(issue: string): boolean {
  return (GREENFIELD_66_OPEN_CHILDREN as readonly string[]).includes(issue);
}

export function reopensClosedChild(issue: string): boolean {
  return (GREENFIELD_66_CLOSED_CHILDREN as readonly string[]).includes(issue);
}

export function umbrellaCloseClosesChildren(): boolean {
  return greenfield66UmbrellaClosesChildren();
}

export function liveAllowedIn66(): boolean {
  return greenfield66AllowsLiveInThisSlice();
}

export function u5AllowedIn66(): boolean {
  return greenfield66AllowsU5();
}

export function secondProofOntologyIntroduced(): boolean {
  return greenfield66InventedSecondProofOntology();
}

export function workflowsConsolidatedIn66(): boolean {
  return greenfield66ConsolidatesWorkflows();
}

export function hardHoldActive(hold: Greenfield66HardHold): boolean {
  return (GREENFIELD_66_HARD_HOLDS as readonly string[]).includes(hold);
}

export function proofClassesRemainDistinct(): boolean {
  return greenfield66ProofClassesRemainDistinct() && GREENFIELD_66_PROOF_CLASSES.length === 11;
}

export function pillarsLocked(): boolean {
  return (
    GREENFIELD_66_PILLARS.length === 3 &&
    GREENFIELD_66_PILLARS[0] === "intent-preservation" &&
    GREENFIELD_66_PILLARS[1] === "overhead-measurable" &&
    GREENFIELD_66_PILLARS[2] === "e2e-proof-framework"
  );
}

export function nextAfter66(): string {
  return GREENFIELD_66_NEXT_AFTER_CLOSE;
}

export function liveOwnerIssue(): string {
  return GREENFIELD_66_LIVE_OWNER;
}

export function u4RemainingSequence(): readonly string[] {
  return GREENFIELD_66_U4_REMAINING_SEQUENCE;
}

export function skipClosedIssue(): string {
  return GREENFIELD_66_SKIP_CLOSED;
}

export function distinctProofNote(): string {
  return GREENFIELD_66_DISTINCT_PROOF_NOTE;
}

export const GREENFIELD_66_FORBIDDEN_SUCCESS_CLAIMS = [
  "liveLaunchProven=true from fixture",
  "complete-business from CI alone",
  "complete-business from Tuck screenshots alone",
  "complete-business from protocol PR alone",
  "overhead reduced by workflow count alone",
  "intent preserved by docs padding",
  "U5 started",
  "#511 started",
  "children closed by umbrella",
] as const;

export function sourceClaimsForbiddenSuccess(source: string): readonly string[] {
  return GREENFIELD_66_FORBIDDEN_SUCCESS_CLAIMS.filter((claim) => source.includes(claim));
}
