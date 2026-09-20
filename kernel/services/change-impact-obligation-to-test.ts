/**
 * #525 SQ-13 — Semantic change-impact / obligation-to-test review proposals.
 *
 * Assesses the missing semantic relation `impactsProductObligation` where graph
 * reachability alone cannot establish impact. Produces bounded matrices
 * (change×obligation, obligation×evidence, uncovered×candidate test) with
 * supported / contradicted / insufficient / not_applicable kept distinct.
 * Routes proposed affected sets through the existing #76 cascade / source-
 * checkpoint path; fingerprint / true-dependency currency rules unchanged.
 * Proposed tests wait for accepted evidence — semantic coverage ≠ passed.
 * No semantic score can waive required acceptance invalidation.
 *
 * Paper / synthetic. Consumes #519+#521+#520+#522+#523. Coordinates #74/#76/#403.
 * Does not replace #76. Does not invent a second obligation ledger. Does not
 * implement #511 closeout or #573 (NO_527_IMPL cleared by #527; NO_528_IMPL cleared by #528; NO_529_IMPL cleared by #529).
 */
import {
  CHANGE_IMPACT_OBLIGATION_RECIPE_POLICY,
  MISSING_SEMANTIC_RELATION,
  MISSING_SEMANTIC_RELATION_GAP,
  RELATION_SUPPORT_STATES,
  type CandidateTestStatus,
  type ChangeImpactObligationRecipePolicy,
  type RelationSupportState,
} from "../../catalog/workflows/change-impact-obligation-to-test.js";

export const CHANGE_IMPACT_OBLIGATION_ISSUE = "#525" as const;
export const CHANGE_IMPACT_OBLIGATION_EPIC = "#511" as const;
export const CHANGE_IMPACT_OBLIGATION_PLANNING_ID = "SQ-13" as const;
export const CHANGE_IMPACT_OBLIGATION_CONSUMES = ["#519", "#521", "#520", "#522", "#523"] as const;
export const CHANGE_IMPACT_OBLIGATION_COORDINATES = ["#74", "#76", "#403"] as const;
export const CHANGE_IMPACT_OBLIGATION_STAMP = "0.221.46" as const;
export const CHANGE_IMPACT_OBLIGATION_SCHEMA_VERSION = 1 as const;
export const CHANGE_IMPACT_OBLIGATION_NO_NETWORK = true as const;
export const CHANGE_IMPACT_OBLIGATION_NO_SECOND_LEDGER = true as const;
export const CHANGE_IMPACT_OBLIGATION_NO_REPLACE_76 = true as const;
export const CHANGE_IMPACT_OBLIGATION_NO_SEMANTIC_WAIVER = true as const;
export const CHANGE_IMPACT_OBLIGATION_NO_DEVICE_PROOF = true as const;
export const CHANGE_IMPACT_OBLIGATION_NO_AUTO_ACCEPT_SCOPE = true as const;
export const CHANGE_IMPACT_OBLIGATION_NO_525_IMPL = false as const;
export const CHANGE_IMPACT_OBLIGATION_NEXT_AFTER_CLOSE = "#574" as const;

export { MISSING_SEMANTIC_RELATION, MISSING_SEMANTIC_RELATION_GAP, RELATION_SUPPORT_STATES };
export type { RelationSupportState, CandidateTestStatus, ChangeImpactObligationRecipePolicy };

export class ChangeImpactObligationError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ChangeImpactObligationError";
    this.code = code;
  }
}

/** Proposed product/evidence change under review. */
export interface ProposedChange {
  readonly changeId: string;
  readonly kind: string;
  readonly description: string;
  readonly sourceIds: readonly string[];
  readonly revision: string;
  /** Graph-reachable surface ids (may be empty — semantic impact can still exist). */
  readonly graphReachableSurfaceIds: readonly string[];
}

/** Product obligation / promise that may be impacted. */
export interface ProductObligation {
  readonly obligationId: string;
  readonly promise: string;
  readonly surfaceId: string;
  readonly dependentSurfaceIds: readonly string[];
}

/** Source / implementation evidence bound to an obligation. */
export interface ObligationEvidence {
  readonly evidenceId: string;
  readonly sourceId: string;
  readonly revision: string;
  readonly claim: string;
  /** Whether this evidence actually supports the claimed obligation (semantic). */
  readonly supportsObligation: boolean;
  readonly fingerprint: string;
}

/** Candidate test proposed for an uncovered obligation — not a pass proof. */
export interface CandidateTestProposal {
  readonly testId: string;
  readonly obligationId: string;
  readonly title: string;
  readonly status: CandidateTestStatus;
  readonly acceptedEvidenceId: string | null;
  readonly explanation: string;
}

export interface RelationCell {
  readonly rowId: string;
  readonly columnId: string;
  readonly state: RelationSupportState;
  readonly explanation: string;
  readonly appliesToRevision: string;
  readonly needMoreEvidence: boolean;
  readonly nextWork: string;
}

export interface ChangeObligationMatrix {
  readonly relation: typeof MISSING_SEMANTIC_RELATION;
  readonly cells: readonly RelationCell[];
  readonly affectedSurfaceIds: readonly string[];
  readonly retainedUnrelatedSurfaceIds: readonly string[];
  readonly appliesToRevision: string;
}

export interface ObligationEvidenceMatrix {
  readonly cells: readonly RelationCell[];
  readonly coveredObligationIds: readonly string[];
  readonly uncoveredObligationIds: readonly string[];
  /** Sources that exist but do not support the obligation — never counted as coverage. */
  readonly unsupportedExistingSourceIds: readonly string[];
}

export interface UncoveredTestMatrix {
  readonly proposals: readonly CandidateTestProposal[];
  readonly incompleteCoverageExplicit: true;
}

export interface CascadeRouteReceipt {
  readonly cascadeEventId: string;
  readonly recoveryId: string;
  readonly affectedSurfaceIds: readonly string[];
  readonly retainedUnrelatedSurfaceIds: readonly string[];
  readonly effectKeys: readonly string[];
  readonly routedThroughExistingCascade: true;
  readonly replaced76: false;
  readonly secondLedger: false;
}

export interface SemanticScoreWaiverAttempt {
  readonly semanticScore: number;
  readonly sourceChanged: boolean;
  readonly acceptanceInvalidationRequired: boolean;
  /** Always false — semantic score never exempts changed source. */
  readonly waived: false;
  readonly reason: string;
}

export interface AssessmentExplanation {
  readonly revision: string;
  readonly relation: typeof MISSING_SEMANTIC_RELATION;
  readonly summary: string;
  readonly needMoreEvidence: boolean;
  readonly nextWork: string;
  readonly cells: readonly RelationCell[];
}

/** Seeded TUCK trip-edit fixture (hypothetical; not claiming an existing TUCK bug). */
export const TUCK_TRIP_EDIT_FIXTURE = {
  seeded: true as const,
  claimsExistingBug: false as const,
  product: "TUCK",
  change: {
    changeId: "tuck.trip.edit.hypothetical",
    kind: "trip_edit",
    description: "Hypothetical trip-edit mutation against preservation obligations (seeded test mutation).",
    sourceIds: ["tuck.src.trip-store"],
    revision: "tuck-rev-seed-1",
    graphReachableSurfaceIds: ["tuck.surface.trip-list"],
  } satisfies ProposedChange,
  obligations: [
    {
      obligationId: "tuck.obl.preserve-custom-items",
      promise: "Trip edit must preserve custom packing items",
      surfaceId: "tuck.surface.custom-items",
      dependentSurfaceIds: ["tuck.surface.packing-list"],
    },
    {
      obligationId: "tuck.obl.preserve-packed-state",
      promise: "Trip edit must preserve packed-state flags",
      surfaceId: "tuck.surface.packed-state",
      dependentSurfaceIds: ["tuck.surface.packing-list"],
    },
  ] as const satisfies readonly ProductObligation[],
  unrelatedFeature: {
    obligationId: "tuck.obl.weather-widget",
    promise: "Weather widget remains valid and unrelated to trip-edit packing preservation",
    surfaceId: "tuck.surface.weather-widget",
    dependentSurfaceIds: [] as const,
  } satisfies ProductObligation,
  evidence: [
    {
      evidenceId: "tuck.ev.custom-items-support",
      sourceId: "tuck.src.trip-store",
      revision: "tuck-rev-seed-1",
      claim: "custom items persist across trip field edits",
      supportsObligation: true,
      fingerprint: "sha256:tuck-custom-items-v1",
    },
    {
      evidenceId: "tuck.ev.packed-unsupported",
      sourceId: "tuck.src.analytics-mirror",
      revision: "tuck-rev-seed-1",
      claim: "analytics mirror exists but does not support packed-state preservation",
      supportsObligation: false,
      fingerprint: "sha256:tuck-analytics-mirror-v1",
    },
  ] as const satisfies readonly ObligationEvidence[],
} as const;

function assertSupportState(state: string): asserts state is RelationSupportState {
  if (!(RELATION_SUPPORT_STATES as readonly string[]).includes(state)) {
    throw new ChangeImpactObligationError("relation.unknown_state", `Unknown relation support state: ${state}`);
  }
}

function cell(input: {
  readonly rowId: string;
  readonly columnId: string;
  readonly state: RelationSupportState;
  readonly explanation: string;
  readonly appliesToRevision: string;
  readonly needMoreEvidence?: boolean;
  readonly nextWork?: string;
}): RelationCell {
  assertSupportState(input.state);
  const needMoreEvidence = input.needMoreEvidence ?? input.state === "insufficient";
  return {
    rowId: input.rowId,
    columnId: input.columnId,
    state: input.state,
    explanation: input.explanation,
    appliesToRevision: input.appliesToRevision,
    needMoreEvidence,
    nextWork:
      input.nextWork ??
      (needMoreEvidence
        ? `Gather additional evidence for ${input.rowId}×${input.columnId} before asserting impact or no-impact.`
        : `No additional evidence required for ${input.rowId}×${input.columnId} at revision ${input.appliesToRevision}.`),
  };
}

/**
 * Assess change × obligation via the missing semantic relation.
 * Graph reachability is consulted but never sole authority for impact.
 */
export function assessChangeObligationMatrix(input: {
  readonly change: ProposedChange;
  readonly obligations: readonly ProductObligation[];
  readonly unrelatedObligationIds?: readonly string[];
  readonly impactByObligationId: ReadonlyMap<string, RelationSupportState>;
  readonly policy?: ChangeImpactObligationRecipePolicy;
}): ChangeObligationMatrix {
  const policy = input.policy ?? CHANGE_IMPACT_OBLIGATION_RECIPE_POLICY;
  if (policy.replace76 || policy.secondObligationLedger) {
    throw new ChangeImpactObligationError("policy.forbidden", "Recipe forbids replacing #76 or a second ledger");
  }

  const cells: RelationCell[] = [];
  const affected = new Set<string>();
  const retained = new Set<string>();
  const unrelated = new Set(input.unrelatedObligationIds ?? []);

  for (const obligation of input.obligations) {
    const state = input.impactByObligationId.get(obligation.obligationId) ?? "insufficient";
    const graphHit =
      input.change.graphReachableSurfaceIds.includes(obligation.surfaceId) ||
      obligation.dependentSurfaceIds.some((id) => input.change.graphReachableSurfaceIds.includes(id));

    const explanation =
      state === "supported"
        ? `Change ${input.change.changeId} semantically impacts obligation ${obligation.obligationId}` +
          (graphHit ? " (also graph-reachable)." : " (beyond graph reachability — missing relation applied).")
        : state === "contradicted"
          ? `Evidence contradicts impact of ${input.change.changeId} on ${obligation.obligationId}.`
          : state === "not_applicable"
            ? `Obligation ${obligation.obligationId} is not applicable to change ${input.change.changeId}.`
            : `Insufficient evidence to assert impact or no-impact of ${input.change.changeId} on ${obligation.obligationId}` +
              (graphHit ? " despite graph reachability." : " (graph reachability also absent).");

    cells.push(
      cell({
        rowId: input.change.changeId,
        columnId: obligation.obligationId,
        state,
        explanation,
        appliesToRevision: input.change.revision,
      }),
    );

    if (state === "supported" || state === "insufficient") {
      if (!unrelated.has(obligation.obligationId)) {
        affected.add(obligation.surfaceId);
        for (const dep of obligation.dependentSurfaceIds) affected.add(dep);
      }
    }
    if (unrelated.has(obligation.obligationId) || state === "not_applicable") {
      retained.add(obligation.surfaceId);
    }
  }

  // Always retain explicitly unrelated surfaces even if absent from impact map.
  for (const obligation of input.obligations) {
    if (unrelated.has(obligation.obligationId)) retained.add(obligation.surfaceId);
  }

  return {
    relation: MISSING_SEMANTIC_RELATION,
    cells,
    affectedSurfaceIds: [...affected].sort(),
    retainedUnrelatedSurfaceIds: [...retained].sort(),
    appliesToRevision: input.change.revision,
  };
}

/**
 * Obligation × evidence matrix. A source that exists but does not support the
 * claimed obligation is never counted as coverage (AC2).
 */
export function assessObligationEvidenceMatrix(input: {
  readonly obligations: readonly ProductObligation[];
  readonly evidenceByObligationId: ReadonlyMap<string, readonly ObligationEvidence[]>;
  readonly revision: string;
}): ObligationEvidenceMatrix {
  const cells: RelationCell[] = [];
  const covered: string[] = [];
  const uncovered: string[] = [];
  const unsupportedExisting: string[] = [];

  for (const obligation of input.obligations) {
    const evidence = input.evidenceByObligationId.get(obligation.obligationId) ?? [];
    if (evidence.length === 0) {
      cells.push(
        cell({
          rowId: obligation.obligationId,
          columnId: "(none)",
          state: "insufficient",
          explanation: `No evidence bound to obligation ${obligation.obligationId}.`,
          appliesToRevision: input.revision,
        }),
      );
      uncovered.push(obligation.obligationId);
      continue;
    }

    let anySupport = false;
    for (const item of evidence) {
      const state: RelationSupportState = item.supportsObligation ? "supported" : "contradicted";
      if (!item.supportsObligation) {
        unsupportedExisting.push(item.sourceId);
      } else {
        anySupport = true;
      }
      cells.push(
        cell({
          rowId: obligation.obligationId,
          columnId: item.evidenceId,
          state,
          explanation: item.supportsObligation
            ? `Evidence ${item.evidenceId} supports obligation ${obligation.obligationId}.`
            : `Source ${item.sourceId} exists but does not support obligation ${obligation.obligationId} — not counted as coverage.`,
          appliesToRevision: item.revision,
          needMoreEvidence: !item.supportsObligation,
          nextWork: item.supportsObligation
            ? `Retain supporting evidence ${item.evidenceId}.`
            : `Do not count ${item.sourceId} as coverage; obtain supporting evidence for ${obligation.obligationId}.`,
        }),
      );
    }
    if (anySupport) covered.push(obligation.obligationId);
    else uncovered.push(obligation.obligationId);
  }

  return {
    cells,
    coveredObligationIds: covered,
    uncoveredObligationIds: uncovered,
    unsupportedExistingSourceIds: [...new Set(unsupportedExisting)].sort(),
  };
}

/**
 * Deterministic compact additional-test proposals for uncovered obligations.
 * Semantic coverage is never proof a test passed (AC4).
 */
export function proposeTestsForUncovered(input: {
  readonly uncoveredObligationIds: readonly string[];
  readonly obligations: readonly ProductObligation[];
  readonly acceptedEvidenceByTestId?: ReadonlyMap<string, string>;
  readonly policy?: ChangeImpactObligationRecipePolicy;
}): UncoveredTestMatrix {
  const policy = input.policy ?? CHANGE_IMPACT_OBLIGATION_RECIPE_POLICY;
  const byId = new Map(input.obligations.map((o) => [o.obligationId, o]));
  const proposals: CandidateTestProposal[] = [];

  for (const obligationId of input.uncoveredObligationIds) {
    const obligation = byId.get(obligationId);
    if (!obligation) continue;
    const testId = `test.propose.${obligationId}`;
    const accepted = input.acceptedEvidenceByTestId?.get(testId) ?? null;
    const status: CandidateTestStatus = accepted ? "passed_with_accepted_evidence" : "proposed";
    proposals.push({
      testId,
      obligationId,
      title: `Compact additional test for ${obligation.promise}`,
      status,
      acceptedEvidenceId: accepted,
      explanation: accepted
        ? `Proposed test ${testId} has accepted evidence ${accepted}.`
        : `Proposed test ${testId} has not passed — waiting for accepted evidence; incomplete coverage remains explicit.`,
    });
    if (proposals.length >= policy.maxCandidateTestsPerUncovered * input.uncoveredObligationIds.length) break;
  }

  return { proposals, incompleteCoverageExplicit: true };
}

/**
 * Route proposed affected sets through the existing cascade identity space.
 * Repeat / interrupt reuse the same cascadeEventId + recoveryId without
 * duplicate effects (AC5). Does not replace #76 or invent a second ledger.
 */
export class CascadeIdentityLedger {
  private readonly byChangeKey = new Map<string, CascadeRouteReceipt>();
  private readonly effectBag = new Set<string>();

  route(input: {
    readonly changeId: string;
    readonly revision: string;
    readonly affectedSurfaceIds: readonly string[];
    readonly retainedUnrelatedSurfaceIds: readonly string[];
    readonly interrupted?: boolean;
  }): CascadeRouteReceipt {
    const changeKey = `${input.changeId}@${input.revision}`;
    const existing = this.byChangeKey.get(changeKey);
    if (existing) {
      // Repeat / interrupt recovery: reuse identities; no duplicate effects.
      return {
        ...existing,
        effectKeys: [...existing.effectKeys],
        routedThroughExistingCascade: true,
        replaced76: false,
        secondLedger: false,
      };
    }

    const cascadeEventId = `cascade.${input.changeId}.${input.revision}`;
    const recoveryId = input.interrupted ? `recovery.${cascadeEventId}` : `recovery.${cascadeEventId}.primary`;
    const effectKeys: string[] = [];
    for (const surfaceId of input.affectedSurfaceIds) {
      const key = `${cascadeEventId}::${surfaceId}`;
      if (!this.effectBag.has(key)) {
        this.effectBag.add(key);
        effectKeys.push(key);
      }
    }

    const receipt: CascadeRouteReceipt = {
      cascadeEventId,
      recoveryId,
      affectedSurfaceIds: [...input.affectedSurfaceIds],
      retainedUnrelatedSurfaceIds: [...input.retainedUnrelatedSurfaceIds],
      effectKeys,
      routedThroughExistingCascade: true,
      replaced76: false,
      secondLedger: false,
    };
    this.byChangeKey.set(changeKey, receipt);
    return receipt;
  }

  /** Interrupt then resume — same cascade/recovery identities, zero new effects. */
  resumeAfterInterrupt(changeId: string, revision: string): CascadeRouteReceipt {
    const changeKey = `${changeId}@${revision}`;
    const existing = this.byChangeKey.get(changeKey);
    if (!existing) {
      throw new ChangeImpactObligationError("cascade.missing", `No cascade receipt for ${changeKey}`);
    }
    return this.route({
      changeId,
      revision,
      affectedSurfaceIds: existing.affectedSurfaceIds,
      retainedUnrelatedSurfaceIds: existing.retainedUnrelatedSurfaceIds,
      interrupted: true,
    });
  }
}

/**
 * AC3 — no added semantic score can exempt changed source from required
 * acceptance invalidation. Fingerprint / true-dependency rules unchanged.
 */
export function attemptSemanticWaiver(input: {
  readonly semanticScore: number;
  readonly sourceChanged: boolean;
  readonly fingerprintMatches?: boolean;
}): SemanticScoreWaiverAttempt {
  const acceptanceInvalidationRequired = input.sourceChanged;
  return {
    semanticScore: input.semanticScore,
    sourceChanged: input.sourceChanged,
    acceptanceInvalidationRequired,
    waived: false,
    reason: acceptanceInvalidationRequired
      ? `Semantic score ${input.semanticScore} cannot waive required acceptance invalidation for changed source (fingerprint/true-dependency rules unchanged; #76 owns invalidation).`
      : `Source unchanged; semantic score ${input.semanticScore} is informational only and still cannot waive gates.`,
  };
}

/** Unchanged evidence stays current only under existing true-dependency / fingerprint rules. */
export function evidenceRemainsCurrent(input: {
  readonly evidence: ObligationEvidence;
  readonly currentFingerprints: ReadonlyMap<string, string>;
  readonly trueDependencySourceIds: readonly string[];
}): { readonly current: boolean; readonly reason: string } {
  if (!input.trueDependencySourceIds.includes(input.evidence.sourceId)) {
    return { current: false, reason: "evidence source is not a true dependency of the obligation under review" };
  }
  const currentFp = input.currentFingerprints.get(input.evidence.sourceId);
  if (currentFp === undefined) {
    return { current: false, reason: "missing current fingerprint for evidence source" };
  }
  if (currentFp !== input.evidence.fingerprint) {
    return { current: false, reason: "fingerprint drift — evidence no longer current" };
  }
  return { current: true, reason: "true dependency + fingerprint match — evidence remains current" };
}

/** Revision-bound explanation including explicit need-more-evidence path. */
export function explainAssessment(input: {
  readonly revision: string;
  readonly changeMatrix: ChangeObligationMatrix;
  readonly evidenceMatrix?: ObligationEvidenceMatrix;
}): AssessmentExplanation {
  const needMore = input.changeMatrix.cells.some((c) => c.needMoreEvidence) || (input.evidenceMatrix?.cells.some((c) => c.needMoreEvidence) ?? false);
  const insufficient = input.changeMatrix.cells.filter((c) => c.state === "insufficient");
  const summary = needMore
    ? `At revision ${input.revision}, ${insufficient.length} change×obligation cell(s) need more evidence before asserting impact or no-impact; relation=${MISSING_SEMANTIC_RELATION}.`
    : `At revision ${input.revision}, change-impact assessment is revision-bound with no outstanding evidence gaps for asserted cells; relation=${MISSING_SEMANTIC_RELATION}.`;
  return {
    revision: input.revision,
    relation: MISSING_SEMANTIC_RELATION,
    summary,
    needMoreEvidence: needMore,
    nextWork: needMore
      ? "Collect supporting or contradicting evidence for insufficient cells; do not assert impact/no-impact until evidence arrives."
      : "Proceed with review/test obligations routed through existing #76 cascade; do not waive invalidation.",
    cells: input.changeMatrix.cells,
  };
}

/** Four support states must remain distinct — never collapsed into one fused score. */
export function supportStatesAreDistinct(): {
  readonly distinct: true;
  readonly states: typeof RELATION_SUPPORT_STATES;
  readonly fusedScoreForbidden: true;
} {
  const unique = new Set(RELATION_SUPPORT_STATES);
  if (unique.size !== RELATION_SUPPORT_STATES.length) {
    throw new ChangeImpactObligationError("states.collapsed", "Support states must stay distinct");
  }
  return { distinct: true, states: RELATION_SUPPORT_STATES, fusedScoreForbidden: true };
}

/** Build the seeded TUCK trip-edit assessment (hypothetical; not an existing-bug claim). */
export function assessTuckTripEditFixture(): {
  readonly seeded: true;
  readonly claimsExistingBug: false;
  readonly changeMatrix: ChangeObligationMatrix;
  readonly evidenceMatrix: ObligationEvidenceMatrix;
  readonly testMatrix: UncoveredTestMatrix;
  readonly explanation: AssessmentExplanation;
} {
  const obligations = [...TUCK_TRIP_EDIT_FIXTURE.obligations, TUCK_TRIP_EDIT_FIXTURE.unrelatedFeature];
  const impactByObligationId = new Map<string, RelationSupportState>([
    ["tuck.obl.preserve-custom-items", "supported"],
    ["tuck.obl.preserve-packed-state", "insufficient"],
    ["tuck.obl.weather-widget", "not_applicable"],
  ]);
  const changeMatrix = assessChangeObligationMatrix({
    change: TUCK_TRIP_EDIT_FIXTURE.change,
    obligations,
    unrelatedObligationIds: [TUCK_TRIP_EDIT_FIXTURE.unrelatedFeature.obligationId],
    impactByObligationId,
  });

  const evidenceByObligationId = new Map<string, readonly ObligationEvidence[]>([
    ["tuck.obl.preserve-custom-items", [TUCK_TRIP_EDIT_FIXTURE.evidence[0]!]],
    ["tuck.obl.preserve-packed-state", [TUCK_TRIP_EDIT_FIXTURE.evidence[1]!]],
    ["tuck.obl.weather-widget", []],
  ]);
  const evidenceMatrix = assessObligationEvidenceMatrix({
    obligations,
    evidenceByObligationId,
    revision: TUCK_TRIP_EDIT_FIXTURE.change.revision,
  });
  const testMatrix = proposeTestsForUncovered({
    uncoveredObligationIds: evidenceMatrix.uncoveredObligationIds.filter((id) => id !== "tuck.obl.weather-widget"),
    obligations,
  });
  const explanation = explainAssessment({
    revision: TUCK_TRIP_EDIT_FIXTURE.change.revision,
    changeMatrix,
    evidenceMatrix,
  });

  return {
    seeded: true,
    claimsExistingBug: false,
    changeMatrix,
    evidenceMatrix,
    testMatrix,
    explanation,
  };
}
