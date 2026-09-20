/**
 * #522 SQ-11 — Source-/revision-bound work proposal emission in **shadow** mode.
 *
 * Extends existing kernel/operating-model work-proposal semantics (gap / option /
 * evidence-request / diagnosis records). Shadow mode records candidates only:
 * does not change eligibility, send founder questions, accept evidence, or
 * dispatch repairs. Passive planner may read stored results only.
 *
 * Paper / synthetic. No network. NO_523_IMPL cleared by #523. NO_524_IMPL cleared by #524. NO_525_IMPL cleared by #525. NO_526_IMPL cleared by #526. NO_527_IMPL cleared by #527. NO_528_IMPL cleared by #528. NO_529_IMPL cleared by #529. Does not implement #511 closeout or #573.
 */
import { digestOf } from "../../contracts/semantic/canonicalize.js";
import type {
  DiagnosisRecord,
  EvidenceRecord,
  EvidenceRequest,
  GapRecord,
  MetricRecord,
  ObjectiveRecord,
  ObservationRecord,
  OptionRecord,
  OperatingRecord,
  ReplayClock,
} from "./types.js";
import { appendOperatingRecord, applyOperatingEvent, seedOperatingModel } from "./events.js";
import type { OperatingModel } from "./types.js";

export const WORK_PROPOSAL_SHADOW_ISSUE = "#522" as const;
export const WORK_PROPOSAL_SHADOW_EPIC = "#511" as const;
export const WORK_PROPOSAL_SHADOW_STAMP = "0.221.43" as const;
export const WORK_PROPOSAL_SHADOW_NO_NETWORK = true as const;
export const WORK_PROPOSAL_SHADOW_SHADOW_ONLY = true as const;
export const WORK_PROPOSAL_SHADOW_NEXT_AFTER_CLOSE = "#511" as const;

export type ShadowProposalKind = "retrieval" | "observation" | "review" | "repair";

export interface ShadowWorkProposalSideEffects {
  readonly eligibilityChanged: false;
  readonly founderQuestionSent: false;
  readonly evidenceAccepted: false;
  readonly repairDispatched: false;
  readonly mode: "shadow";
}

export interface ShadowWorkProposalTrace {
  readonly questionPackDigest: string;
  readonly projectionDigest: string;
  readonly providerResponseClass: string;
  readonly policyVersion: string;
  readonly sourceUri: string;
  readonly sourceRevision: string;
}

export interface ShadowWorkProposalInput {
  readonly workspaceId: string;
  readonly proposalId: string;
  readonly kind: ShadowProposalKind;
  readonly title: string;
  readonly rationale: string;
  readonly observationIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly alternativeIds: readonly string[];
  readonly contradictoryEvidenceIds: readonly string[];
  readonly omittedCoverage: readonly string[];
  readonly objectiveId: string;
  readonly metricId: string;
  readonly sourceUri: string;
  readonly sourceRevision: string;
  readonly missingEvidenceNeeded?: string;
  readonly trace: ShadowWorkProposalTrace;
  readonly recordedAt: string;
  readonly producer?: string;
}

export interface ShadowWorkProposalResult {
  readonly proposalId: string;
  readonly kind: ShadowProposalKind;
  readonly records: readonly OperatingRecord[];
  readonly evidenceRequest: EvidenceRequest | null;
  readonly sideEffects: ShadowWorkProposalSideEffects;
  readonly trace: ShadowWorkProposalTrace;
  readonly proposalDigest: string;
  readonly model: OperatingModel;
  /** Catalog / semantic evidence ids (not necessarily operating-model evidence record ids). */
  readonly semanticEvidenceIds: readonly string[];
}

const SHADOW_SIDE_EFFECTS: ShadowWorkProposalSideEffects = {
  eligibilityChanged: false,
  founderQuestionSent: false,
  evidenceAccepted: false,
  repairDispatched: false,
  mode: "shadow",
};

function common(id: string, recordedAt: string, producer: string): Pick<OperatingRecord, "id" | "revision" | "recordedAt" | "producer" | "epistemic"> {
  return { id, revision: 1, recordedAt, producer, epistemic: "inferred" };
}

/**
 * Emit a source-/revision-bound shadow work proposal into an operating model.
 * Seeds required objective/metric/observation/evidence lineage first.
 * Never mutates eligibility / founder / evidence-accept / repair dispatch.
 */
export function emitShadowWorkProposal(input: ShadowWorkProposalInput): ShadowWorkProposalResult {
  const producer = input.producer ?? "b2c.feedback-to-work-shadow";
  const clock: ReplayClock = { now: input.recordedAt };

  const objective: ObjectiveRecord = {
    ...common(input.objectiveId, input.recordedAt, producer),
    kind: "objective",
    status: "active",
    title: "Feedback-to-work shadow objective",
    valueLoop: "delivery",
  };
  const metric: MetricRecord = {
    ...common(input.metricId, input.recordedAt, producer),
    kind: "metric",
    status: "active",
    objectiveId: input.objectiveId,
    name: "Feedback signal",
  };

  const observationRecords: ObservationRecord[] = input.observationIds.map((obsId) => ({
    ...common(obsId, input.recordedAt, producer),
    kind: "observation",
    status: "recorded",
    metricId: input.metricId,
    observedAt: input.recordedAt,
    source: { uri: input.sourceUri, revision: input.sourceRevision },
    independenceGroup: "synthetic.fixture",
    confidence: { lower: 0.5, upper: 0.7 },
    value: null,
  }));

  // Operating-model evidence records (kind: evidence) — distinct from catalog evidence ids.
  const evidenceRecords: EvidenceRecord[] = input.observationIds.map((obsId, index) => ({
    ...common(`evidence.op.${input.proposalId}.${index}`, input.recordedAt, producer),
    kind: "evidence",
    status: "recorded",
    observationIds: [obsId],
    source: { uri: input.sourceUri, revision: input.sourceRevision },
    observedAt: input.recordedAt,
    independenceGroup: "synthetic.fixture",
    confidence: { lower: 0.5, upper: 0.7 },
    supportsBelief: false,
  }));
  const operatingEvidenceIds = evidenceRecords.map((row) => row.id);

  let model = seedOperatingModel([objective, metric, ...observationRecords, ...evidenceRecords], clock, producer);

  const gapId = `gap.${input.proposalId}`;
  const diagnosisId = `diagnosis.${input.proposalId}`;
  const optionId = `option.${input.proposalId}`;
  const requestId = input.kind === "observation" || Boolean(input.missingEvidenceNeeded) ? `evidence-request.${input.proposalId}` : null;

  let evidenceRequest: EvidenceRequest | null = null;
  if (requestId) {
    evidenceRequest = {
      id: requestId,
      status: "open",
      needed: input.missingEvidenceNeeded ?? "Collect the next concrete observation named by omitted coverage.",
      recordedAt: input.recordedAt,
      gapId,
    };
    // Append evidence request before the gathering gap that cites it.
    model = applyOperatingEvent(
      model,
      {
        id: `evt.evidence-request.${requestId}`,
        type: "evidence_requested",
        recordedAt: input.recordedAt,
        producer,
        payload: { request: evidenceRequest },
      },
      clock,
    );
  }

  const gap: GapRecord = {
    ...common(gapId, input.recordedAt, producer),
    kind: "gap",
    status: requestId ? "gathering" : "diagnosed",
    objectiveId: input.objectiveId,
    metricId: input.metricId,
    observationId: input.observationIds[0],
    ...(requestId ? { missingEvidenceRequestId: requestId } : {}),
  };

  const diagnosis: DiagnosisRecord = {
    ...common(diagnosisId, input.recordedAt, producer),
    kind: "diagnosis",
    status: "recorded",
    gapId,
    evidenceIds: [...operatingEvidenceIds],
    sourceRevision: input.sourceRevision,
  };

  // Shadow: option stays "discovered" / never selected-authorized for dispatch.
  const option: OptionRecord = {
    ...common(optionId, input.recordedAt, producer),
    kind: "option",
    status: "discovered",
    diagnosisId,
    evidenceIds: [...operatingEvidenceIds],
    sourceRevision: input.sourceRevision,
  };

  model = appendOperatingRecord(model, gap, clock, producer, `evt.append.${gapId}`);
  model = appendOperatingRecord(model, diagnosis, clock, producer, `evt.append.${diagnosisId}`);
  model = appendOperatingRecord(model, option, clock, producer, `evt.append.${optionId}`);

  const proposalDigest = digestOf({
    proposalId: input.proposalId,
    kind: input.kind,
    observationIds: input.observationIds,
    evidenceIds: input.evidenceIds,
    alternatives: input.alternativeIds,
    contradictions: input.contradictoryEvidenceIds,
    omitted: input.omittedCoverage,
    sourceUri: input.sourceUri,
    sourceRevision: input.sourceRevision,
    trace: input.trace,
    sideEffects: SHADOW_SIDE_EFFECTS,
  });

  return {
    proposalId: input.proposalId,
    kind: input.kind,
    records: [objective, metric, ...observationRecords, ...evidenceRecords, gap, diagnosis, option],
    evidenceRequest,
    sideEffects: SHADOW_SIDE_EFFECTS,
    trace: input.trace,
    proposalDigest,
    model,
    semanticEvidenceIds: [...input.evidenceIds],
  };
}

/** Build a synthetic observation record bound to source uri/revision (post-ingestion). */
export function syntheticObservationRecord(input: {
  id: string;
  metricId: string;
  sourceUri: string;
  sourceRevision: string;
  recordedAt: string;
  observedAt: string;
  value?: unknown;
  producer?: string;
}): ObservationRecord {
  return {
    ...common(input.id, input.recordedAt, input.producer ?? "b2c.feedback-to-work-shadow"),
    kind: "observation",
    status: "recorded",
    metricId: input.metricId,
    observedAt: input.observedAt,
    source: { uri: input.sourceUri, revision: input.sourceRevision },
    independenceGroup: "synthetic.fixture",
    confidence: { lower: 0.5, upper: 0.7 },
    value: input.value ?? null,
  };
}

export function assertShadowSideEffectsIntact(sideEffects: ShadowWorkProposalSideEffects): boolean {
  return (
    sideEffects.mode === "shadow" &&
    sideEffects.eligibilityChanged === false &&
    sideEffects.founderQuestionSent === false &&
    sideEffects.evidenceAccepted === false &&
    sideEffects.repairDispatched === false
  );
}
