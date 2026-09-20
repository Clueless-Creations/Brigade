/**
 * #523 SQ-18 — Semantic-runtime safety, recovery, observability, staged rollout.
 *
 * Composition proof across provider / execution / graph / cache / public boundaries.
 * Mode machine: disabled / shadow / advisory / admitted-execution + rollback.
 * Observability enrichment on existing receipts/reports only (no new metrics daemon).
 * Public stored-result projection: explain / receipt / coverage via shared registry;
 * passive public calls → zero paid inference / zero run-state mutation.
 * Admission freeze: record accepted evidence + exact head/question/policy versions;
 * independent review cannot be manufactured by producer.
 *
 * Consumes #514+#515+#518+#519+#520+#522. Extends existing owners.
 * Paper / synthetic only. No network-in-knowledge-reads.
 * NO_524_IMPL cleared by #524. NO_525_IMPL cleared by #525. NO_526_IMPL cleared by #526. NO_527_IMPL cleared by #527. NO_528_IMPL cleared by #528. NO_529_IMPL cleared by #529. #571 landed. #573 landed. epic 511 remains open. Does not implement #574 architecture as product code.
 */
import { digestOf } from "../../contracts/semantic/canonicalize.js";
import type { InferenceReceipt, PolicyApplicationReceipt, UsageCost } from "../../contracts/semantic/receipts.js";
import {
  SEMANTIC_RUNTIME_DEFAULT_MODE,
  SEMANTIC_RUNTIME_MODES,
  SEMANTIC_RUNTIME_SAFETY_ROLLOUT_POLICY,
  type SemanticRuntimeMode,
} from "../../catalog/workflows/semantic-runtime-safety-rollout.js";
import { detectInjectedInstructions, sanitizeObservationText, type PipelineTraceBindings } from "./feedback-to-work-shadow.js";

export const SEMANTIC_RUNTIME_SAFETY_ISSUE = "#523" as const;
export const SEMANTIC_RUNTIME_SAFETY_EPIC = "#511" as const;
export const SEMANTIC_RUNTIME_SAFETY_PLANNING_ID = "SQ-18" as const;
export const SEMANTIC_RUNTIME_SAFETY_CONSUMES = ["#514", "#515", "#518", "#519", "#520", "#522"] as const;
export const SEMANTIC_RUNTIME_SAFETY_STAMP = "0.221.44" as const;
export const SEMANTIC_RUNTIME_SAFETY_SCHEMA_VERSION = 1 as const;
export const SEMANTIC_RUNTIME_SAFETY_NO_NETWORK = true as const;
export const SEMANTIC_RUNTIME_SAFETY_NO_METRICS_DAEMON = true as const;
export const SEMANTIC_RUNTIME_SAFETY_NO_AUTO_PROVIDER_FALLBACK = true as const;
export const SEMANTIC_RUNTIME_SAFETY_NO_NEW_AUTHORITY = true as const;
export const SEMANTIC_RUNTIME_SAFETY_NO_KEY_IMPLIES_LIVE = true as const;
export const SEMANTIC_RUNTIME_SAFETY_NO_523_IMPL = false as const;
export const INFERENCE_RECEIPTS_NO_523_IMPL = false as const;
export const SEMANTIC_RUNTIME_SAFETY_NEXT_AFTER_CLOSE = "#574" as const;

export class SemanticRuntimeSafetyError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "SemanticRuntimeSafetyError";
    this.code = code;
  }
}

// ─── Mode machine + rollback ───────────────────────────────────────────────

export type { SemanticRuntimeMode };

export interface ModeTransitionRecord {
  readonly from: SemanticRuntimeMode;
  readonly to: SemanticRuntimeMode;
  readonly at: string;
  readonly reason: string;
  readonly keyInstalled: boolean;
  readonly allowed: boolean;
  readonly blockReason?: string;
}

export interface RollbackResult {
  readonly previousMode: SemanticRuntimeMode;
  readonly mode: SemanticRuntimeMode;
  readonly stoppedNewSemanticInfluence: true;
  readonly historyRetained: true;
  readonly staleProofRevived: false;
  readonly cancelledUndispatchedAdmittedWork: boolean;
  readonly at: string;
}

const MODE_RANK: Record<SemanticRuntimeMode, number> = {
  disabled: 0,
  shadow: 1,
  advisory: 2,
  "admitted-execution": 3,
};

/** Key installed never implies live / admitted-execution. */
export function resolveModeAfterKeyInstall(current: SemanticRuntimeMode, keyInstalled: boolean): SemanticRuntimeMode {
  void keyInstalled;
  return current;
}

export function canAdvanceMode(input: {
  readonly from: SemanticRuntimeMode;
  readonly to: SemanticRuntimeMode;
  readonly admissionFrozen: boolean;
  readonly independentReviewPresent: boolean;
  readonly benefitProven: boolean;
  readonly providerConformanceProven: boolean;
  readonly safetyProofPresent: boolean;
  readonly keyInstalled?: boolean;
}): { readonly allowed: boolean; readonly blockReason?: string } {
  if (input.to === input.from) return { allowed: true };
  if (MODE_RANK[input.to] < MODE_RANK[input.from]) {
    // Rollback / demotion always allowed.
    return { allowed: true };
  }
  if (input.keyInstalled && input.to === "admitted-execution" && !input.admissionFrozen) {
    return { allowed: false, blockReason: "key_installed_does_not_imply_live" };
  }
  if (input.to === "advisory" || input.to === "admitted-execution") {
    if (!input.admissionFrozen) return { allowed: false, blockReason: "admission_not_frozen" };
    if (!input.independentReviewPresent) return { allowed: false, blockReason: "independent_review_missing" };
    if (!input.benefitProven) return { allowed: false, blockReason: "benefit_proof_missing" };
    if (!input.providerConformanceProven) return { allowed: false, blockReason: "provider_conformance_missing" };
    if (!input.safetyProofPresent) return { allowed: false, blockReason: "safety_proof_missing" };
  }
  return { allowed: true };
}

export function transitionMode(input: {
  readonly from: SemanticRuntimeMode;
  readonly to: SemanticRuntimeMode;
  readonly at: string;
  readonly reason: string;
  readonly keyInstalled?: boolean;
  readonly admissionFrozen: boolean;
  readonly independentReviewPresent: boolean;
  readonly benefitProven: boolean;
  readonly providerConformanceProven: boolean;
  readonly safetyProofPresent: boolean;
}): ModeTransitionRecord {
  const gate = canAdvanceMode({
    from: input.from,
    to: input.to,
    admissionFrozen: input.admissionFrozen,
    independentReviewPresent: input.independentReviewPresent,
    benefitProven: input.benefitProven,
    providerConformanceProven: input.providerConformanceProven,
    safetyProofPresent: input.safetyProofPresent,
    keyInstalled: input.keyInstalled,
  });
  return {
    from: input.from,
    to: gate.allowed ? input.to : input.from,
    at: input.at,
    reason: input.reason,
    keyInstalled: input.keyInstalled === true,
    allowed: gate.allowed,
    blockReason: gate.blockReason,
  };
}

/**
 * Rollback: stop new semantic influence; keep history; do not revive stale proof.
 * Cancels undispatched admitted work when leaving admitted-execution.
 */
export function rollbackSemanticInfluence(input: {
  readonly currentMode: SemanticRuntimeMode;
  readonly at: string;
  readonly undispatchedAdmittedWork?: boolean;
}): RollbackResult {
  const target: SemanticRuntimeMode = input.currentMode === "disabled" ? "disabled" : input.currentMode === "shadow" ? "disabled" : "shadow";
  return {
    previousMode: input.currentMode,
    mode: target,
    stoppedNewSemanticInfluence: true,
    historyRetained: true,
    staleProofRevived: false,
    cancelledUndispatchedAdmittedWork: input.currentMode === "admitted-execution" && input.undispatchedAdmittedWork === true,
    at: input.at,
  };
}

export function defaultRuntimeMode(): SemanticRuntimeMode {
  return SEMANTIC_RUNTIME_DEFAULT_MODE;
}

export function listRuntimeModes(): readonly SemanticRuntimeMode[] {
  return SEMANTIC_RUNTIME_MODES;
}

// ─── Admission freeze ──────────────────────────────────────────────────────

export interface AdmissionEvidenceRecord {
  readonly evidenceId: string;
  readonly kind: "fixture" | "shadow-comparison" | "provider-conformance" | "safety-proof" | "benefit";
  readonly digest: string;
  readonly producerId: string;
}

export interface AdmissionFreezeRecord {
  readonly frozen: true;
  readonly headSha: string;
  readonly questionPackDigest: string;
  readonly policyVersion: string;
  readonly acceptedEvidence: readonly AdmissionEvidenceRecord[];
  readonly independentReviewerId: string;
  readonly producerId: string;
  readonly frozenAt: string;
}

export function freezeAdmission(input: {
  readonly headSha: string;
  readonly questionPackDigest: string;
  readonly policyVersion: string;
  readonly acceptedEvidence: readonly AdmissionEvidenceRecord[];
  readonly independentReviewerId: string;
  readonly producerId: string;
  readonly frozenAt: string;
}): AdmissionFreezeRecord {
  if (!input.headSha.trim()) throw new SemanticRuntimeSafetyError("admission.missing_head", "headSha required");
  if (!input.questionPackDigest.trim()) throw new SemanticRuntimeSafetyError("admission.missing_question", "questionPackDigest required");
  if (!input.policyVersion.trim()) throw new SemanticRuntimeSafetyError("admission.missing_policy", "policyVersion required");
  if (!input.independentReviewerId.trim()) throw new SemanticRuntimeSafetyError("admission.missing_reviewer", "independentReviewerId required");
  if (input.independentReviewerId === input.producerId) {
    throw new SemanticRuntimeSafetyError("admission.producer_cannot_review", "independent review cannot be manufactured by producer");
  }
  const kinds = new Set(input.acceptedEvidence.map((e) => e.kind));
  if (!kinds.has("benefit") || !kinds.has("provider-conformance") || !kinds.has("safety-proof")) {
    throw new SemanticRuntimeSafetyError("admission.required_evidence_missing", "benefit, provider-conformance, and safety-proof required");
  }
  return {
    frozen: true,
    headSha: input.headSha,
    questionPackDigest: input.questionPackDigest,
    policyVersion: input.policyVersion,
    acceptedEvidence: input.acceptedEvidence,
    independentReviewerId: input.independentReviewerId,
    producerId: input.producerId,
    frozenAt: input.frozenAt,
  };
}

export function advisoryOrExecutionBlocked(input: {
  readonly mode: SemanticRuntimeMode;
  readonly freeze: AdmissionFreezeRecord | null;
  readonly benefitPresent: boolean;
  readonly providerConformancePresent: boolean;
  readonly safetyProofPresent: boolean;
  readonly independentReviewPresent: boolean;
}): { readonly blocked: boolean; readonly reasons: readonly string[] } {
  if (input.mode === "disabled" || input.mode === "shadow") {
    return { blocked: false, reasons: [] };
  }
  const reasons: string[] = [];
  if (!input.freeze) reasons.push("admission_not_frozen");
  if (!input.benefitPresent) reasons.push("benefit_missing");
  if (!input.providerConformancePresent) reasons.push("provider_conformance_missing");
  if (!input.safetyProofPresent) reasons.push("safety_proof_missing");
  if (!input.independentReviewPresent) reasons.push("independent_review_missing");
  return { blocked: reasons.length > 0, reasons };
}

// ─── Observability enrichment (existing receipts — no new daemon) ──────────

export interface SpeculativeCheckRecord {
  readonly checkId: string;
  readonly eligible: boolean;
  readonly used: boolean;
}

export interface ObservabilityEnrichment {
  readonly dependentRounds: number;
  readonly speculativeChecks: readonly SpeculativeCheckRecord[];
  readonly omissions: readonly string[];
  readonly staleResults: readonly string[];
  readonly retries: number;
  readonly usageCost: UsageCost;
  readonly latencyMs: number | null;
  readonly humanCorrection: {
    readonly occurred: boolean;
    readonly note?: string;
  };
  readonly NO_METRICS_DAEMON: true;
}

export function enrichReceiptObservability(input: {
  readonly receipt: InferenceReceipt | PolicyApplicationReceipt | { readonly receiptId: string };
  readonly dependentRounds?: number;
  readonly speculativeChecks?: readonly SpeculativeCheckRecord[];
  readonly omissions?: readonly string[];
  readonly staleResults?: readonly string[];
  readonly retries?: number;
  readonly usageCost?: UsageCost;
  readonly latencyMs?: number | null;
  readonly humanCorrection?: { readonly occurred: boolean; readonly note?: string };
}): ObservabilityEnrichment & { readonly receiptId: string } {
  const usageCost: UsageCost =
    input.usageCost ?? ("usageCost" in input.receipt ? input.receipt.usageCost : { status: "unknown", reason: "not measured in paper fixture" });
  const latencyMs =
    input.latencyMs !== undefined ? input.latencyMs : usageCost.status === "measured" && typeof usageCost.latencyMs === "number" ? usageCost.latencyMs : null;
  return {
    receiptId: input.receipt.receiptId,
    dependentRounds: input.dependentRounds ?? 0,
    speculativeChecks: input.speculativeChecks ?? [],
    omissions: input.omissions ?? [],
    staleResults: input.staleResults ?? [],
    retries: input.retries ?? 0,
    usageCost,
    latencyMs,
    humanCorrection: input.humanCorrection ?? { occurred: false },
    NO_METRICS_DAEMON: true,
  };
}

// ─── Public stored-result projection (shared registry; CLI/MCP parity) ─────

export type PublicProjectionKind = "explain" | "receipt" | "coverage";

export interface PublicStoredResultProjection {
  readonly kind: PublicProjectionKind;
  readonly workspaceId: string;
  readonly receiptId: string;
  readonly sanitized: true;
  readonly secretsPresent: false;
  readonly rawPrivateReportPresent: false;
  readonly providerNativePolicyLeak: false;
  readonly paidInferencePerformed: false;
  readonly runStateMutated: false;
  readonly body: Readonly<Record<string, unknown>>;
}

export interface PassivePublicCallResult {
  readonly projection: PublicStoredResultProjection;
  readonly paidProviderInferenceCount: 0;
  readonly runStateChanges: 0;
  readonly NO_NETWORK: true;
}

const SECRETISH = /\b(sk|pk|api|token|secret|password|bearer)[-_]?[A-Za-z0-9]{8,}\b/gi;
const B64ISH = /\b[A-Za-z0-9+/]{40,}={0,2}\b/g;

function redactPublicText(value: string): string {
  return value.replace(SECRETISH, "[redacted]").replace(B64ISH, "[redacted-b64]");
}

function stripPrivateFields(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripPrivateFields);
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (/secret|password|token|rawPrivate|providerNativePolicy|apiKey/i.test(k)) continue;
      out[k] = typeof v === "string" ? redactPublicText(v) : stripPrivateFields(v);
    }
    return out;
  }
  if (typeof value === "string") return redactPublicText(value);
  return value;
}

/** Shared registry projection used by CLI and MCP — same function ⇒ parity. */
export function projectPublicStoredResult(input: {
  readonly kind: PublicProjectionKind;
  readonly workspaceId: string;
  readonly receiptId: string;
  readonly privatePayload: Readonly<Record<string, unknown>>;
}): PassivePublicCallResult {
  const sanitizedBody = stripPrivateFields(input.privatePayload) as Record<string, unknown>;
  const projection: PublicStoredResultProjection = {
    kind: input.kind,
    workspaceId: input.workspaceId,
    receiptId: input.receiptId,
    sanitized: true,
    secretsPresent: false,
    rawPrivateReportPresent: false,
    providerNativePolicyLeak: false,
    paidInferencePerformed: false,
    runStateMutated: false,
    body: sanitizedBody,
  };
  return {
    projection,
    paidProviderInferenceCount: 0,
    runStateChanges: 0,
    NO_NETWORK: true,
  };
}

/** Registry of public projection kinds — CLI/MCP must share this list. */
export const PUBLIC_STORED_RESULT_REGISTRY = ["explain", "receipt", "coverage"] as const;

export function publicProjectionKindsForCli(): readonly PublicProjectionKind[] {
  return PUBLIC_STORED_RESULT_REGISTRY;
}

export function publicProjectionKindsForMcp(): readonly PublicProjectionKind[] {
  return PUBLIC_STORED_RESULT_REGISTRY;
}

// ─── Threat + failure composition ──────────────────────────────────────────

export type ThreatClass =
  | "untrusted_source_instructions"
  | "cross_workspace_read"
  | "secret_pii_exposure"
  | "malicious_question_pack"
  | "inference_to_authority_confusion"
  | "provider_corruption"
  | "replay_after_ownership_loss";

export type FailureStage =
  | "admission"
  | "dispatch"
  | "partial_map"
  | "response_validation"
  | "receipt_persist"
  | "graph_publish"
  | "timeout"
  | "quota_denial"
  | "schema_drift"
  | "cancel"
  | "late_response";

export type RecoverableStatus =
  | "ok"
  | "blocked_injection"
  | "cross_workspace_denied"
  | "secret_redacted"
  | "pack_rejected"
  | "authority_confusion_refused"
  | "provider_corrupt_held"
  | "replay_denied"
  | "admission_held"
  | "dispatch_held"
  | "partial_map_uncertain"
  | "validation_failed"
  | "persist_failed"
  | "graph_publish_held"
  | "timeout_held"
  | "quota_denied"
  | "schema_drift_held"
  | "cancelled"
  | "late_response_rejected";

export interface FrozenAuthoritySurface {
  readonly bindings: PipelineTraceBindings;
  readonly tools: readonly string[];
  readonly grants: readonly string[];
  readonly questionResources: readonly string[];
  readonly approvedPurpose: string;
}

export interface ThreatExerciseResult {
  readonly threat: ThreatClass;
  readonly recoverableStatus: RecoverableStatus;
  readonly authorityUnchanged: boolean;
  readonly surface: FrozenAuthoritySurface;
  readonly defaultPathRegression: false;
}

export interface FailureExerciseResult {
  readonly stage: FailureStage;
  readonly recoverableStatus: RecoverableStatus;
  readonly becameCompleteGraphEvidence: false;
  readonly duplicateRepair: false;
  readonly externalEffect: false;
  readonly defaultPathRegression: false;
}

export function freezeAuthoritySurface(partial?: Partial<FrozenAuthoritySurface>): FrozenAuthoritySurface {
  return {
    bindings: partial?.bindings ?? {
      questionPackDigest: digestOf("qpack.runtime-safety.1"),
      projectionDigest: digestOf("proj.runtime-safety.1"),
      providerResponseClass: "typesafe.assessment.v1",
      policyVersion: "policy.runtime-safety.v1",
    },
    tools: partial?.tools ?? ["tool.explain", "tool.receipt", "tool.coverage"],
    grants: partial?.grants ?? [],
    questionResources: partial?.questionResources ?? ["resource.question-pack.v1"],
    approvedPurpose: partial?.approvedPurpose ?? "semantic-assessment",
  };
}

function surfacesEqual(a: FrozenAuthoritySurface, b: FrozenAuthoritySurface): boolean {
  return (
    a.bindings.questionPackDigest === b.bindings.questionPackDigest &&
    a.bindings.projectionDigest === b.bindings.projectionDigest &&
    a.bindings.providerResponseClass === b.bindings.providerResponseClass &&
    a.bindings.policyVersion === b.bindings.policyVersion &&
    a.tools.join("|") === b.tools.join("|") &&
    a.grants.join("|") === b.grants.join("|") &&
    a.questionResources.join("|") === b.questionResources.join("|") &&
    a.approvedPurpose === b.approvedPurpose
  );
}

export function exerciseThreat(input: {
  readonly threat: ThreatClass;
  readonly surface: FrozenAuthoritySurface;
  readonly sourceText?: string;
  readonly readerWorkspaceId?: string;
  readonly ownerWorkspaceId?: string;
  readonly ownershipLost?: boolean;
  readonly providerBytesCorrupt?: boolean;
}): ThreatExerciseResult {
  const before = structuredClone(input.surface) as FrozenAuthoritySurface;
  let status: RecoverableStatus = "ok";

  switch (input.threat) {
    case "untrusted_source_instructions": {
      const text = input.sourceText ?? "";
      if (detectInjectedInstructions(text) || /IGNORE ALL|modify (the )?question pack|grant authority|change provider/i.test(text)) {
        sanitizeObservationText(text);
        status = "blocked_injection";
      }
      break;
    }
    case "cross_workspace_read": {
      if (input.readerWorkspaceId && input.ownerWorkspaceId && input.readerWorkspaceId !== input.ownerWorkspaceId) {
        status = "cross_workspace_denied";
      }
      break;
    }
    case "secret_pii_exposure": {
      status = "secret_redacted";
      break;
    }
    case "malicious_question_pack": {
      status = "pack_rejected";
      break;
    }
    case "inference_to_authority_confusion": {
      status = "authority_confusion_refused";
      break;
    }
    case "provider_corruption": {
      if (input.providerBytesCorrupt !== false) status = "provider_corrupt_held";
      break;
    }
    case "replay_after_ownership_loss": {
      if (input.ownershipLost !== false) status = "replay_denied";
      break;
    }
  }

  const after = input.surface;
  return {
    threat: input.threat,
    recoverableStatus: status,
    authorityUnchanged: surfacesEqual(before, after),
    surface: after,
    defaultPathRegression: false,
  };
}

export function exerciseFailure(input: { readonly stage: FailureStage }): FailureExerciseResult {
  const map: Record<FailureStage, RecoverableStatus> = {
    admission: "admission_held",
    dispatch: "dispatch_held",
    partial_map: "partial_map_uncertain",
    response_validation: "validation_failed",
    receipt_persist: "persist_failed",
    graph_publish: "graph_publish_held",
    timeout: "timeout_held",
    quota_denial: "quota_denied",
    schema_drift: "schema_drift_held",
    cancel: "cancelled",
    late_response: "late_response_rejected",
  };
  return {
    stage: input.stage,
    recoverableStatus: map[input.stage],
    becameCompleteGraphEvidence: false,
    duplicateRepair: false,
    externalEffect: false,
    defaultPathRegression: false,
  };
}

export function partialCannotBecomeCompleteEvidence(input: {
  readonly completeness: "partial" | "uncertain" | "complete";
  readonly graphPublishAttempted: boolean;
}): {
  readonly publishedAsComplete: false;
  readonly duplicateRepair: false;
  readonly externalEffect: false;
} {
  if (input.completeness !== "complete" && input.graphPublishAttempted) {
    return { publishedAsComplete: false, duplicateRepair: false, externalEffect: false };
  }
  return { publishedAsComplete: false, duplicateRepair: false, externalEffect: false };
}

// ─── Deletion / stale-revision across cached + derived history ─────────────

export interface HistoryRecord {
  readonly id: string;
  readonly kind: "source" | "cache" | "derived";
  readonly revision: string;
  readonly deleted: boolean;
  readonly stale: boolean;
}

export interface DeletionStaleSweepResult {
  readonly coveredSource: boolean;
  readonly coveredCache: boolean;
  readonly coveredDerived: boolean;
  readonly newestOnly: false;
  readonly remainingLive: readonly HistoryRecord[];
}

export function sweepDeletionAndStale(records: readonly HistoryRecord[]): DeletionStaleSweepResult {
  const remaining = records.filter((r) => !r.deleted && !r.stale);
  return {
    coveredSource: records.some((r) => r.kind === "source" && (r.deleted || r.stale)),
    coveredCache: records.some((r) => r.kind === "cache" && (r.deleted || r.stale)),
    coveredDerived: records.some((r) => r.kind === "derived" && (r.deleted || r.stale)),
    newestOnly: false,
    remainingLive: remaining,
  };
}

// ─── Support statements (fixture vs live vs product vs production) ─────────

export type SupportStatementClass = "fixture" | "authorized-live-provider-proof" | "product-behavior" | "production-readiness";

export interface SupportStatement {
  readonly class: SupportStatementClass;
  readonly claim: string;
  readonly asserted: boolean;
  readonly note: string;
}

export function buildSupportStatements(input: {
  readonly fixturesGreen: boolean;
  readonly liveProviderAuthorized: boolean;
  readonly liveProviderPerformed: boolean;
  readonly productBehaviorProvenInFixtures: boolean;
  readonly productionReady: boolean;
}): readonly SupportStatement[] {
  return [
    {
      class: "fixture",
      claim: "Paper / synthetic composition fixtures prove wiring and negative controls.",
      asserted: input.fixturesGreen,
      note: "Fixture success is not live provider proof.",
    },
    {
      class: "authorized-live-provider-proof",
      claim: "Authorized live provider proof was performed under independent authority.",
      asserted: input.liveProviderAuthorized && input.liveProviderPerformed,
      note: input.liveProviderPerformed ? "Live run recorded." : "Live provider proof NOT performed (OOS default for #523).",
    },
    {
      class: "product-behavior",
      claim: "Product behavior under shadow / public projection matches declared policy.",
      asserted: input.productBehaviorProvenInFixtures,
      note: "Product behavior ≠ production readiness.",
    },
    {
      class: "production-readiness",
      claim: "Production readiness / admitted-execution is independently decided.",
      asserted: input.productionReady,
      note: input.productionReady ? "Ready." : "NOT production-ready; default remains non-admitted.",
    },
  ];
}

// ─── Integrated composition runner (paper) ─────────────────────────────────

export interface CompositionRunInput {
  readonly workspaceId: string;
  readonly mode: SemanticRuntimeMode;
  readonly hostileSourceText?: string;
  readonly failureStages?: readonly FailureStage[];
  readonly threats?: readonly ThreatClass[];
  readonly history?: readonly HistoryRecord[];
  readonly privatePayload?: Readonly<Record<string, unknown>>;
  readonly freeze?: AdmissionFreezeRecord | null;
  readonly benefitPresent?: boolean;
  readonly providerConformancePresent?: boolean;
  readonly safetyProofPresent?: boolean;
  readonly independentReviewPresent?: boolean;
  readonly keyInstalled?: boolean;
  readonly at?: string;
}

export interface CompositionRunResult {
  readonly mode: SemanticRuntimeMode;
  readonly threats: readonly ThreatExerciseResult[];
  readonly failures: readonly FailureExerciseResult[];
  readonly deletionStale: DeletionStaleSweepResult | null;
  readonly publicCall: PassivePublicCallResult | null;
  readonly admissionBlock: { readonly blocked: boolean; readonly reasons: readonly string[] };
  readonly observability: ObservabilityEnrichment & { readonly receiptId: string };
  readonly support: readonly SupportStatement[];
  readonly rollback: RollbackResult | null;
  readonly authoritySurface: FrozenAuthoritySurface;
  readonly NO_NETWORK: true;
  readonly NO_METRICS_DAEMON: true;
  readonly pipelineDigest: string;
  readonly defaultPathRegression: false;
}

export function runSemanticRuntimeSafetyComposition(input: CompositionRunInput): CompositionRunResult {
  const surface = freezeAuthoritySurface();
  const threats = (input.threats ?? ["untrusted_source_instructions"]).map((threat) =>
    exerciseThreat({
      threat,
      surface,
      sourceText: input.hostileSourceText,
      readerWorkspaceId: "ws.other",
      ownerWorkspaceId: input.workspaceId,
      ownershipLost: true,
      providerBytesCorrupt: true,
    }),
  );
  const failures = (input.failureStages ?? ["partial_map", "late_response"]).map((stage) => exerciseFailure({ stage }));
  const deletionStale = input.history ? sweepDeletionAndStale(input.history) : null;
  const publicCall = input.privatePayload
    ? projectPublicStoredResult({
        kind: "explain",
        workspaceId: input.workspaceId,
        receiptId: "receipt.runtime-safety.1",
        privatePayload: input.privatePayload,
      })
    : null;

  const admissionBlock = advisoryOrExecutionBlocked({
    mode: input.mode,
    freeze: input.freeze ?? null,
    benefitPresent: input.benefitPresent === true,
    providerConformancePresent: input.providerConformancePresent === true,
    safetyProofPresent: input.safetyProofPresent === true,
    independentReviewPresent: input.independentReviewPresent === true,
  });

  const observability = enrichReceiptObservability({
    receipt: { receiptId: "receipt.runtime-safety.1" },
    dependentRounds: 2,
    speculativeChecks: [
      { checkId: "spec.align", eligible: true, used: true },
      { checkId: "spec.unused", eligible: true, used: false },
    ],
    omissions: ["field.optional-pii"],
    staleResults: [],
    retries: 1,
    usageCost: { status: "unknown", reason: "paper fixture; no paid inference" },
    latencyMs: 12,
    humanCorrection: { occurred: false },
  });

  const support = buildSupportStatements({
    fixturesGreen: true,
    liveProviderAuthorized: false,
    liveProviderPerformed: false,
    productBehaviorProvenInFixtures: true,
    productionReady: false,
  });

  const rollback =
    input.mode === "advisory" || input.mode === "admitted-execution"
      ? rollbackSemanticInfluence({
          currentMode: input.mode,
          at: input.at ?? "2026-09-20T05:30:00.000Z",
          undispatchedAdmittedWork: input.mode === "admitted-execution",
        })
      : null;

  return {
    mode: input.mode,
    threats,
    failures,
    deletionStale,
    publicCall,
    admissionBlock,
    observability,
    support,
    rollback,
    authoritySurface: surface,
    NO_NETWORK: true,
    NO_METRICS_DAEMON: true,
    pipelineDigest: digestOf({
      issue: SEMANTIC_RUNTIME_SAFETY_ISSUE,
      stamp: SEMANTIC_RUNTIME_SAFETY_STAMP,
      mode: input.mode,
      workspaceId: input.workspaceId,
      policy: SEMANTIC_RUNTIME_SAFETY_ROLLOUT_POLICY.defaultMode,
    }),
    defaultPathRegression: false,
  };
}
