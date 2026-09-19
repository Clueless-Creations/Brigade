/**
 * #517 SQ-06 — Pure selection / projection helpers for semantic source projections.
 *
 * No filesystem, workspace, clock, network, or execution dependency.
 * createKnowledgeService must remain free of those deps; this module is likewise pure.
 * Extends knowledge-service — does not invent a retrieval backend / embeddings engine.
 */
import { sha256Hex } from "../../contracts/semantic/canonicalize.js";

export const SEMANTIC_SOURCE_PROJECTION_HELPERS_ISSUE = "#517" as const;
export const SEMANTIC_SOURCE_PROJECTION_HELPERS_SCHEMA_VERSION = 1 as const;

/** Default candidate-pair ceiling for semanticJoin (recipe may tighten; never raise without policy). */
export const DEFAULT_MAX_CANDIDATE_PAIRS = 64 as const;

export type Sha256Hex = string;

/** Unicode code-point slice — offsets count code points, never UTF-16 code units. */
export function codePointSlice(text: string, offset: number, limit: number): string {
  let index = 0;
  let result = "";
  for (const point of text) {
    if (index >= offset + limit) break;
    if (index >= offset) result += point;
    index += 1;
  }
  return result;
}

export function codePointLength(text: string): number {
  let n = 0;
  for (const _ of text) n += 1;
  return n;
}

/** Recover a span by Unicode code-point offsets without corrupting surrogate pairs / combining marks. */
export function recoverSpan(text: string, start: number, end: number): string {
  if (start < 0 || end < start) {
    throw new Error("invalid_span_offsets");
  }
  const length = end - start;
  return codePointSlice(text, start, length);
}

/** Field provenance for an immutable projection field. */
export interface FieldProvenance {
  readonly sourceId: string;
  readonly fieldPath: string;
  readonly spanStart: number;
  readonly spanEnd: number;
  readonly contentSha256: Sha256Hex;
}

export type CoverageStatus = "complete" | "partial" | "omitted" | "missing" | "held";

export interface CoverageEntry {
  readonly sourceId: string;
  readonly fieldPath: string;
  readonly status: CoverageStatus;
  /** Continuation offset when truncated; null when complete or held. */
  readonly nextOffset: number | null;
  readonly reason?: string;
}

export interface OmittedInput {
  readonly sourceId: string;
  readonly fieldPath: string;
  readonly reason: "out_of_scope" | "private" | "budget" | "redacted" | "unresolved" | "absent";
}

/** Separate candidate-pair predicates — never conflated into one score. */
export type CandidatePairPredicate = "identity" | "same-mechanism" | "related-context" | "evidence-sufficiency";

export interface CandidateRecord {
  readonly id: string;
  readonly sourceId: string;
  readonly key: string;
  readonly mechanism?: string;
  readonly contextTags: readonly string[];
  readonly evidenceChars: number;
  readonly bindingId?: string;
  readonly providerId?: string;
}

export interface CandidatePair {
  readonly leftId: string;
  readonly rightId: string;
  readonly predicates: readonly CandidatePairPredicate[];
  readonly orderKey: string;
}

export interface MissedCandidateReport {
  readonly caseId: string;
  readonly missedId: string;
  readonly reason: "budget_truncation" | "filter_excluded" | "negative_control" | "paraphrase_miss";
  readonly recoverableByAssessor: boolean;
}

export interface CandidateGenerationResult {
  readonly candidates: readonly CandidateRecord[];
  readonly pairs: readonly CandidatePair[];
  readonly missed: readonly MissedCandidateReport[];
  readonly volumeBound: number;
  readonly stableOrderDigest: Sha256Hex;
}

/** Exact-key lookup — first candidate mechanism (no embeddings). */
export function selectByExactKeys(records: readonly CandidateRecord[], keys: readonly string[]): CandidateRecord[] {
  const want = new Set(keys);
  return records.filter((r) => want.has(r.key)).sort((a, b) => a.id.localeCompare(b.id));
}

/** Authored binding lookup — first candidate mechanism. */
export function selectByAuthoredBindings(records: readonly CandidateRecord[], bindingIds: readonly string[]): CandidateRecord[] {
  const want = new Set(bindingIds);
  return records.filter((r) => r.bindingId !== undefined && want.has(r.bindingId)).sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Bounded retrieval by explicit rules (term overlap on key + tags).
 * No embeddings / second search engine — BM25-style token overlap only when rules allow.
 */
export function selectByBoundedRules(
  records: readonly CandidateRecord[],
  rules: {
    readonly requiredTags?: readonly string[];
    readonly keyPrefix?: string;
    readonly maxResults: number;
    readonly minEvidenceChars?: number;
  },
): CandidateRecord[] {
  const required = rules.requiredTags ?? [];
  const minEvidence = rules.minEvidenceChars ?? 0;
  const filtered = records.filter((r) => {
    if (rules.keyPrefix !== undefined && !r.key.startsWith(rules.keyPrefix)) return false;
    if (r.evidenceChars < minEvidence) return false;
    if (required.length === 0) return true;
    return required.every((tag) => r.contextTags.includes(tag));
  });
  filtered.sort((a, b) => {
    const tagDelta = b.contextTags.length - a.contextTags.length;
    if (tagDelta !== 0) return tagDelta;
    const evidenceDelta = b.evidenceChars - a.evidenceChars;
    if (evidenceDelta !== 0) return evidenceDelta;
    return a.id.localeCompare(b.id);
  });
  return filtered.slice(0, Math.max(0, rules.maxResults));
}

export function evaluateIdentity(a: CandidateRecord, b: CandidateRecord): boolean {
  return a.key === b.key && a.key.length > 0;
}

export function evaluateSameMechanism(a: CandidateRecord, b: CandidateRecord): boolean {
  return a.mechanism !== undefined && a.mechanism === b.mechanism;
}

export function evaluateRelatedContext(a: CandidateRecord, b: CandidateRecord): boolean {
  if (a.contextTags.length === 0 || b.contextTags.length === 0) return false;
  const bTags = new Set(b.contextTags);
  return a.contextTags.some((tag) => bTags.has(tag));
}

export function evaluateEvidenceSufficiency(a: CandidateRecord, b: CandidateRecord, minChars: number): boolean {
  return a.evidenceChars >= minChars && b.evidenceChars >= minChars;
}

/**
 * Generate bounded, deterministically ordered candidate pairs for semanticJoin.
 * Predicates remain separate — never collapsed into a single fused score.
 */
export function generateCandidatePairs(
  candidates: readonly CandidateRecord[],
  options: {
    readonly maxPairs?: number;
    readonly minEvidenceChars?: number;
    readonly caseId: string;
    /** IDs the assessor would recover if a cheap filter dropped them (measured recall). */
    readonly expectedRecoverableIds?: readonly string[];
  },
): CandidateGenerationResult {
  const maxPairs = options.maxPairs ?? DEFAULT_MAX_CANDIDATE_PAIRS;
  const minEvidence = options.minEvidenceChars ?? 1;
  const ordered = [...candidates].sort((a, b) => a.id.localeCompare(b.id));
  const pairs: CandidatePair[] = [];

  for (let i = 0; i < ordered.length; i++) {
    for (let j = i + 1; j < ordered.length; j++) {
      const left = ordered[i]!;
      const right = ordered[j]!;
      const predicates: CandidatePairPredicate[] = [];
      if (evaluateIdentity(left, right)) predicates.push("identity");
      if (evaluateSameMechanism(left, right)) predicates.push("same-mechanism");
      if (evaluateRelatedContext(left, right)) predicates.push("related-context");
      if (evaluateEvidenceSufficiency(left, right, minEvidence)) predicates.push("evidence-sufficiency");
      if (predicates.length === 0) continue;
      pairs.push({
        leftId: left.id,
        rightId: right.id,
        predicates,
        orderKey: `${left.id}\0${right.id}\0${predicates.join(",")}`,
      });
    }
  }

  pairs.sort((a, b) => a.orderKey.localeCompare(b.orderKey));
  const kept = pairs.slice(0, maxPairs);
  const truncated = pairs.slice(maxPairs);

  const missed: MissedCandidateReport[] = [];
  for (const pair of truncated) {
    missed.push({
      caseId: options.caseId,
      missedId: `${pair.leftId}|${pair.rightId}`,
      reason: "budget_truncation",
      recoverableByAssessor: true,
    });
  }

  const keptIds = new Set(ordered.map((c) => c.id));
  for (const expectedId of options.expectedRecoverableIds ?? []) {
    if (!keptIds.has(expectedId)) {
      missed.push({
        caseId: options.caseId,
        missedId: expectedId,
        reason: "filter_excluded",
        recoverableByAssessor: true,
      });
    }
  }

  const stableOrderDigest = sha256Hex(kept.map((p) => p.orderKey).join("\n"));

  return {
    candidates: ordered,
    pairs: kept,
    missed,
    volumeBound: maxPairs,
    stableOrderDigest,
  };
}

/** Verify an excerpt exists in a pinned source at the expected hash. Stale/missing → unresolved. */
export type PinVerifyResult =
  | { readonly status: "ok"; readonly recovered: string }
  | { readonly status: "unresolved"; readonly reason: "stale_hash" | "missing_content" | "span_mismatch" };

export function verifyPinnedExcerpt(input: {
  readonly pinnedContent: string;
  readonly expectedContentSha256: Sha256Hex;
  readonly spanStart: number;
  readonly spanEnd: number;
  readonly expectedExcerpt?: string;
}): PinVerifyResult {
  const actualHash = sha256Hex(input.pinnedContent);
  if (actualHash !== input.expectedContentSha256) {
    return { status: "unresolved", reason: "stale_hash" };
  }
  const length = codePointLength(input.pinnedContent);
  if (input.spanStart < 0 || input.spanEnd > length || input.spanStart > input.spanEnd) {
    return { status: "unresolved", reason: "missing_content" };
  }
  const recovered = recoverSpan(input.pinnedContent, input.spanStart, input.spanEnd);
  if (input.expectedExcerpt !== undefined && recovered !== input.expectedExcerpt) {
    return { status: "unresolved", reason: "span_mismatch" };
  }
  return { status: "ok", recovered };
}

/**
 * Selected-provider knowledge retention: unselected-provider guidance cannot replace
 * a selected binding's retained knowledge record.
 */
export function retainSelectedProviderKnowledge(input: {
  readonly selectedProviderId: string;
  readonly selectedRecords: readonly CandidateRecord[];
  readonly unselectedGuidance: readonly CandidateRecord[];
}): { readonly retained: readonly CandidateRecord[]; readonly rejectedReplacements: readonly string[] } {
  const retained = input.selectedRecords.filter((r) => r.providerId === input.selectedProviderId).sort((a, b) => a.id.localeCompare(b.id));
  const retainedKeys = new Set(retained.map((r) => r.key));
  const rejectedReplacements: string[] = [];
  for (const guide of input.unselectedGuidance) {
    if (guide.providerId === input.selectedProviderId) continue;
    // Similar key/tag overlap must not replace selected retention.
    if (retainedKeys.has(guide.key) || retained.some((r) => evaluateRelatedContext(r, guide))) {
      rejectedReplacements.push(guide.id);
    }
  }
  rejectedReplacements.sort((a, b) => a.localeCompare(b));
  return { retained, rejectedReplacements };
}

/** Build coverage + omitted entries for honest projection accounting. */
export function buildCoverageLedger(
  entries: readonly CoverageEntry[],
  omitted: readonly OmittedInput[],
): {
  readonly complete: boolean;
  readonly entries: readonly CoverageEntry[];
  readonly omitted: readonly OmittedInput[];
} {
  const sortedEntries = [...entries].sort((a, b) => `${a.sourceId}:${a.fieldPath}`.localeCompare(`${b.sourceId}:${b.fieldPath}`));
  const sortedOmitted = [...omitted].sort((a, b) => `${a.sourceId}:${a.fieldPath}`.localeCompare(`${b.sourceId}:${b.fieldPath}`));
  const complete = sortedOmitted.length === 0 && sortedEntries.every((e) => e.status === "complete") && sortedEntries.length > 0;
  return { complete, entries: sortedEntries, omitted: sortedOmitted };
}
