/**
 * Provider-neutral optional managed human-beta recruitment (#213).
 * TaskGrind qualification hold → operator-assisted handoff only.
 * No speculative adapter, network, spend, or live recruit.
 */
import { createHash } from "node:crypto";

export const HUMAN_BETA_ISSUE = "#213" as const;
export const HUMAN_BETA_STAMP = "0.221.61" as const;
export const HUMAN_BETA_BASE_MAIN_SHA = "ee1e358ffa6a1f3cb38b4407735cb7078181b2f1" as const;
export const HUMAN_BETA_HOLD_ID = "taskgrind.qualification-authoritative-access-unavailable" as const;
export const HUMAN_BETA_MODE = "operator-assisted" as const;
export const HUMAN_BETA_LIVE_NOT_PERFORMED = true as const;
export const HUMAN_BETA_NO_NETWORK = true as const;
export const HUMAN_BETA_APP_QUALITY_OWNER = "engineering/APP_QUALITY.md" as const;
export const HUMAN_BETA_BINDING_PREFIX = "binding.human-beta.recruitment" as const;
export const TASKGRIND_CANDIDATE_ID = "taskgrind" as const;

export type QualificationStatus =
  | { readonly status: "qualified"; readonly mode: "api" | "sdk" | "browser-assisted" | "operator-assisted"; readonly observedAt: string }
  | { readonly status: "hold"; readonly holdId: string; readonly reason: string; readonly observedAt: string; readonly unknowns: readonly string[] };

export const TASKGRIND_QUALIFICATION: QualificationStatus = {
  status: "hold",
  holdId: HUMAN_BETA_HOLD_ID,
  reason: "Authoritative TaskGrind first-party API/SDK/docs/pricing/privacy surface unavailable (2026-09-20).",
  observedAt: "2026-09-20",
  unknowns: [
    "native interaction modes",
    "native operations and readback IDs",
    "tester/platform/region/device constraints",
    "pricing and incentives",
    "privacy retention automation",
    "cancel versus refund provider semantics",
  ],
};

export type BetaRecruitmentSelection =
  | { readonly kind: "none" }
  | { readonly kind: "self-managed" }
  | { readonly kind: "other-provider"; readonly providerLabel: string; readonly bindingId: string }
  | { readonly kind: "managed-candidate"; readonly candidateId: typeof TASKGRIND_CANDIDATE_ID; readonly bindingId: string };

export type SelectionRefusal = "vendor-global-flag-forbidden" | "missing-binding" | "qualification-hold" | "unknown-candidate" | "no-beta-selected";

export type SelectionGate =
  | {
      readonly ok: true;
      readonly route: "none" | "self-managed" | "other-provider" | "operator-assisted-pending-qualification" | "operator-assisted";
      readonly selection: BetaRecruitmentSelection;
    }
  | { readonly ok: false; readonly code: SelectionRefusal; readonly message: string };

export function resolveRecruitmentSelection(
  selection: BetaRecruitmentSelection,
  options: { readonly vendorGlobalTaskgrindFlag?: boolean; readonly qualification?: QualificationStatus } = {},
): SelectionGate {
  if (options.vendorGlobalTaskgrindFlag === true) {
    return {
      ok: false,
      code: "vendor-global-flag-forbidden",
      message: "TaskGrind must not be enabled by a vendor-global flag; use product/recipe/binding selection.",
    };
  }
  const qualification = options.qualification ?? TASKGRIND_QUALIFICATION;
  switch (selection.kind) {
    case "none":
      return { ok: true, route: "none", selection };
    case "self-managed":
      return { ok: true, route: "self-managed", selection };
    case "other-provider":
      if (!selection.bindingId.startsWith(HUMAN_BETA_BINDING_PREFIX)) {
        return { ok: false, code: "missing-binding", message: "other-provider requires an explicit human-beta binding id." };
      }
      return { ok: true, route: "other-provider", selection };
    case "managed-candidate": {
      if (selection.candidateId !== TASKGRIND_CANDIDATE_ID) {
        return { ok: false, code: "unknown-candidate", message: `Unknown managed candidate: ${selection.candidateId}` };
      }
      if (!selection.bindingId.startsWith(HUMAN_BETA_BINDING_PREFIX)) {
        return { ok: false, code: "missing-binding", message: "managed-candidate requires an explicit human-beta binding id." };
      }
      if (qualification.status === "hold") {
        return { ok: true, route: "operator-assisted-pending-qualification", selection };
      }
      if (qualification.status === "qualified" && qualification.mode === "operator-assisted") {
        return { ok: true, route: "operator-assisted", selection };
      }
      return { ok: false, code: "qualification-hold", message: "Managed candidate is not available for automated modes under current qualification." };
    }
    default: {
      const _exhaustive: never = selection;
      return _exhaustive;
    }
  }
}

export function taskgrindContextAllowed(selection: BetaRecruitmentSelection): boolean {
  return selection.kind === "managed-candidate" && selection.candidateId === TASKGRIND_CANDIDATE_ID;
}

export interface RecruitmentBrief {
  readonly workspaceId: string;
  readonly audience: string;
  readonly goals: string;
  readonly buildRef: string;
  readonly quoteRef?: string;
  readonly exposureScope: string;
  readonly incentivePolicy: "honest-findings-only";
  readonly minorsAllowed: false;
}

export interface PreparedBrief {
  readonly workspaceId: string;
  readonly briefDigest: string;
  readonly buildRef: string;
  readonly quoteRef: string | null;
  readonly audience: string;
  readonly exposureScope: string;
  readonly preparedAt: string;
  readonly mode: typeof HUMAN_BETA_MODE;
  readonly qualificationHoldId: string | null;
  readonly liveProofClaimed: false;
}

export function prepareRecruitmentBrief(brief: RecruitmentBrief, nowIso = "2026-09-20T19:14:00.000Z"): PreparedBrief {
  if (brief.minorsAllowed !== false) {
    throw new Error("human-beta.refuse-minors: recruiting minors requires a separately reviewed consent/compliance plan.");
  }
  if (brief.incentivePolicy !== "honest-findings-only") {
    throw new Error("human-beta.refuse-positive-incentive: never incentivize positive findings, ratings, or endorsements.");
  }
  const digest = createHash("sha256")
    .update(
      JSON.stringify({
        workspaceId: brief.workspaceId,
        audience: brief.audience,
        goals: brief.goals,
        buildRef: brief.buildRef,
        quoteRef: brief.quoteRef ?? null,
        exposureScope: brief.exposureScope,
        incentivePolicy: brief.incentivePolicy,
      }),
    )
    .digest("hex");
  return {
    workspaceId: brief.workspaceId,
    briefDigest: digest,
    buildRef: brief.buildRef,
    quoteRef: brief.quoteRef ?? null,
    audience: brief.audience,
    exposureScope: brief.exposureScope,
    preparedAt: nowIso,
    mode: HUMAN_BETA_MODE,
    qualificationHoldId: HUMAN_BETA_HOLD_ID,
    liveProofClaimed: false,
  };
}

export type HandoffState = "pending" | "imported" | "cancelled" | "stale";

export interface PendingHandoff {
  readonly handoffId: string;
  readonly workspaceId: string;
  readonly briefDigest: string;
  readonly buildRef: string;
  readonly quoteRef: string | null;
  readonly audience: string;
  readonly exposureScope: string;
  readonly state: HandoffState;
  readonly createdAt: string;
  readonly remoteCampaignId: null;
  readonly liveProofClaimed: false;
  readonly counts: { readonly requested: "unknown"; readonly enrolled: "unknown"; readonly started: "unknown"; readonly completed: "unknown" };
}

export function openPendingHandoff(prepared: PreparedBrief, handoffId: string, nowIso = "2026-09-20T19:14:00.000Z"): PendingHandoff {
  return {
    handoffId,
    workspaceId: prepared.workspaceId,
    briefDigest: prepared.briefDigest,
    buildRef: prepared.buildRef,
    quoteRef: prepared.quoteRef,
    audience: prepared.audience,
    exposureScope: prepared.exposureScope,
    state: "pending",
    createdAt: nowIso,
    remoteCampaignId: null,
    liveProofClaimed: false,
    counts: { requested: "unknown", enrolled: "unknown", started: "unknown", completed: "unknown" },
  };
}

export interface EffectApproval {
  readonly approvalId: string;
  readonly briefDigest: string;
  readonly buildRef: string;
  readonly quoteRef: string | null;
  readonly audience: string;
  readonly exposureScope: string;
}

export function isEffectApprovalCurrent(approval: EffectApproval, current: PreparedBrief | PendingHandoff): boolean {
  return (
    approval.briefDigest === current.briefDigest &&
    approval.buildRef === current.buildRef &&
    (approval.quoteRef ?? null) === (current.quoteRef ?? null) &&
    approval.audience === current.audience &&
    approval.exposureScope === current.exposureScope
  );
}

export function invalidateStaleApproval(approval: EffectApproval, current: PreparedBrief | PendingHandoff): PendingHandoff | null {
  if (isEffectApprovalCurrent(approval, current) && "state" in current) return current;
  if ("state" in current) return { ...current, state: "stale" };
  return null;
}

export interface ImportAttachment {
  readonly relativePath: string;
  readonly mediaType: string;
  readonly bytesSha256: string;
}

export interface AttributableImportEnvelope {
  readonly workspaceId: string;
  readonly handoffId: string;
  readonly externalEvidenceId: string;
  readonly sourceLabel: string;
  readonly observedAt: string;
  readonly testerComments: readonly string[];
  readonly attachments: readonly ImportAttachment[];
  readonly resultUrls: readonly string[];
  readonly observedCounts?: { readonly requested?: number; readonly enrolled?: number; readonly started?: number; readonly completed?: number };
}

export type ImportRefusal =
  | "workspace-mismatch"
  | "handoff-not-pending"
  | "path-traversal"
  | "executable-attachment"
  | "unsafe-url"
  | "cross-workspace-import"
  | "missing-attribution"
  | "malformed-envelope";

export interface ImportedEvidence {
  readonly workspaceId: string;
  readonly handoffId: string;
  readonly externalEvidenceId: string;
  readonly sourceLabel: string;
  readonly observedAt: string;
  readonly testerContentTrust: "untrusted";
  readonly attachmentDigests: readonly string[];
  readonly resultUrls: readonly string[];
  readonly counts: {
    readonly requested: number | "unknown";
    readonly enrolled: number | "unknown";
    readonly started: number | "unknown";
    readonly completed: number | "unknown";
  };
  readonly liveProofClaimed: false;
  readonly altersInstructions: false;
  readonly altersProviderSelection: false;
  readonly altersApprovalState: false;
}

export type ImportResult =
  | { readonly ok: true; readonly handoff: PendingHandoff; readonly imported: ImportedEvidence }
  | { readonly ok: false; readonly code: ImportRefusal; readonly message: string };

const FORBIDDEN_ATTACHMENT_SUFFIXES = [".exe", ".sh", ".bat", ".cmd", ".msi", ".dmg", ".app", ".js", ".mjs", ".cjs", ".py", ".rb", ".ps1"] as const;

function isPathTraversal(relativePath: string): boolean {
  if (relativePath.includes("\0")) return true;
  if (relativePath.startsWith("/") || relativePath.startsWith("\\")) return true;
  if (/^[a-zA-Z]:[\\/]/.test(relativePath)) return true;
  return relativePath.split(/[/\\]/u).some((part) => part === "..");
}

function isExecutableAttachment(relativePath: string, mediaType: string): boolean {
  const lower = relativePath.toLowerCase();
  if (FORBIDDEN_ATTACHMENT_SUFFIXES.some((suffix) => lower.endsWith(suffix))) return true;
  return mediaType.startsWith("application/x-") || mediaType === "application/javascript" || mediaType === "text/javascript";
}

function isUnsafeUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return true;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return true;
  const host = parsed.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".local")) return true;
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|169\.254\.)/u.test(host)) return true;
  return host === "metadata.google.internal" || host === "169.254.169.254";
}

export function importAttributableResults(handoff: PendingHandoff, envelope: AttributableImportEnvelope): ImportResult {
  if (!envelope.externalEvidenceId?.trim() || !envelope.sourceLabel?.trim()) {
    return { ok: false, code: "missing-attribution", message: "Import requires externalEvidenceId and sourceLabel." };
  }
  if (envelope.workspaceId !== handoff.workspaceId) {
    return { ok: false, code: "cross-workspace-import", message: "Import workspace must match handoff workspace." };
  }
  if (envelope.handoffId !== handoff.handoffId) {
    return { ok: false, code: "malformed-envelope", message: "Import handoffId must match pending handoff." };
  }
  if (handoff.state !== "pending") {
    return { ok: false, code: "handoff-not-pending", message: `Handoff state is ${handoff.state}; only pending accepts import.` };
  }
  for (const attachment of envelope.attachments) {
    if (isPathTraversal(attachment.relativePath)) return { ok: false, code: "path-traversal", message: `Attachment path refused: ${attachment.relativePath}` };
    if (isExecutableAttachment(attachment.relativePath, attachment.mediaType))
      return { ok: false, code: "executable-attachment", message: `Executable attachment refused: ${attachment.relativePath}` };
    if (!/^[a-f0-9]{64}$/u.test(attachment.bytesSha256)) return { ok: false, code: "malformed-envelope", message: "Attachment digest must be sha256 hex." };
  }
  for (const url of envelope.resultUrls) {
    if (isUnsafeUrl(url)) return { ok: false, code: "unsafe-url", message: `Unsafe or non-http(s) URL refused: ${url}` };
  }
  const observed = envelope.observedCounts ?? {};
  const imported: ImportedEvidence = {
    workspaceId: handoff.workspaceId,
    handoffId: handoff.handoffId,
    externalEvidenceId: envelope.externalEvidenceId,
    sourceLabel: envelope.sourceLabel,
    observedAt: envelope.observedAt,
    testerContentTrust: "untrusted",
    attachmentDigests: envelope.attachments.map((item) => item.bytesSha256),
    resultUrls: [...envelope.resultUrls],
    counts: {
      requested: observed.requested ?? "unknown",
      enrolled: observed.enrolled ?? "unknown",
      started: observed.started ?? "unknown",
      completed: observed.completed ?? "unknown",
    },
    liveProofClaimed: false,
    altersInstructions: false,
    altersProviderSelection: false,
    altersApprovalState: false,
  };
  void envelope.testerComments;
  return { ok: true, handoff: { ...handoff, state: "imported", counts: handoff.counts }, imported };
}

export function inferCountAcrossStages(
  _from: "requested" | "enrolled" | "started" | "completed",
  _to: "requested" | "enrolled" | "started" | "completed",
): never {
  throw new Error("human-beta.unknown-stays-unknown: do not infer recruitment counts across stages.");
}

export type WriteUncertainty = {
  readonly kind: "uncertain-paid-or-recruitment-write";
  readonly localRequestId: string;
  readonly remoteId: string | null;
  readonly disposition: "reconcile-via-readback-or-manual-recovery";
  readonly blindRetryAuthorized: false;
};

export function classifyUncertainWrite(localRequestId: string, remoteId: string | null): WriteUncertainty {
  return {
    kind: "uncertain-paid-or-recruitment-write",
    localRequestId,
    remoteId,
    disposition: "reconcile-via-readback-or-manual-recovery",
    blindRetryAuthorized: false,
  };
}

export function cancelHandoff(handoff: PendingHandoff): PendingHandoff {
  return { ...handoff, state: "cancelled" };
}

export type RefundObservation =
  | { readonly status: "not-applicable"; readonly reason: string }
  | { readonly status: "unknown"; readonly reason: string }
  | { readonly status: "observed"; readonly externalRefundId: string };

export function refundAfterLocalCancel(): RefundObservation {
  return { status: "not-applicable", reason: "Local pending handoff cancel did not dispatch a paid provider write; refund is not applicable." };
}

export function refundWhenProviderUnknown(): RefundObservation {
  return { status: "unknown", reason: "Provider refund semantics are unknown under TaskGrind qualification hold." };
}

export interface ResumeResult {
  readonly ok: boolean;
  readonly code?: "pending-without-evidence" | "cancelled" | "stale" | "ready";
  readonly message: string;
  readonly liveProofClaimed: false;
}

export function resumeAfterImport(handoff: PendingHandoff, imported: ImportedEvidence | null): ResumeResult {
  if (handoff.state === "cancelled") return { ok: false, code: "cancelled", message: "Cancelled handoff cannot resume.", liveProofClaimed: false };
  if (handoff.state === "stale") return { ok: false, code: "stale", message: "Stale handoff requires a fresh brief and approval.", liveProofClaimed: false };
  if (handoff.state === "pending" || !imported) {
    return {
      ok: false,
      code: "pending-without-evidence",
      message: "Handoff remains pending until attributable external evidence is imported.",
      liveProofClaimed: false,
    };
  }
  return {
    ok: true,
    code: "ready",
    message: "Attributable import present; resume local quality/repair owners. Live human-beta proof still not claimed.",
    liveProofClaimed: false,
  };
}

export function recruitmentAuthorizesDistribution(): false {
  return false;
}
export function paidFeedbackSubstitutesFor(_a: boolean, _b: boolean, _c: boolean, _d: boolean): false {
  return false;
}
export function qualitySummaryOwner(): typeof HUMAN_BETA_APP_QUALITY_OWNER {
  return HUMAN_BETA_APP_QUALITY_OWNER;
}

export function noBetaLoadsTaskgrind(
  selection: BetaRecruitmentSelection,
): { readonly reads: false; readonly setup: false; readonly context: false; readonly fees: false; readonly prompts: false } | { readonly context: true } {
  if (!taskgrindContextAllowed(selection)) return { reads: false, setup: false, context: false, fees: false, prompts: false };
  return { context: true };
}

export function productionCustomerDataAllowedInBrief(): false {
  return false;
}
export function secretsAllowedInImport(): false {
  return false;
}
