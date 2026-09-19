/**
 * #517 SQ-06 — Authorized scoped source projections + measured candidate generation.
 *
 * Owns the semantic source-projection seam under kernel/services/.
 * Do NOT conflate with plan-projection.ts (public business-plan holds/briefs).
 *
 * Paper / no-network: operates on caller-supplied pinned source bytes and declared
 * selectors only. Never invents credentials, embeddings engines, or #518 batch scheduling.
 *
 * Consumes #512 IR contracts + #516 select/project stage kinds as upstream shapes.
 * Extends knowledge-service pure helpers; does not pull fs/network into createKnowledgeService.
 */
import { digestOf, sha256Hex } from "../../contracts/semantic/canonicalize.js";
import {
  buildCoverageLedger,
  codePointLength,
  generateCandidatePairs,
  recoverSpan,
  retainSelectedProviderKnowledge,
  selectByAuthoredBindings,
  selectByBoundedRules,
  selectByExactKeys,
  verifyPinnedExcerpt,
  type CandidateGenerationResult,
  type CandidateRecord,
  type CoverageEntry,
  type FieldProvenance,
  type MissedCandidateReport,
  type OmittedInput,
  type PinVerifyResult,
  DEFAULT_MAX_CANDIDATE_PAIRS,
} from "../knowledge-service/projection-helpers.js";

export const SEMANTIC_SOURCE_PROJECTION_ISSUE = "#517" as const;
export const SEMANTIC_SOURCE_PROJECTION_EPIC = "#511" as const;
export const SEMANTIC_SOURCE_PROJECTION_CONSUMES = ["#512", "#513", "#514", "#515", "#516"] as const;
export const SEMANTIC_SOURCE_PROJECTION_STAMP = "0.221.37" as const;
export const SEMANTIC_SOURCE_PROJECTION_SCHEMA_VERSION = 1 as const;

export type SourceProjectionOutcomeCode = "ok" | "insufficient_context" | "selector_rejected" | "unresolved" | "scope_violation";

export class SourceProjectionError extends Error {
  readonly code: SourceProjectionOutcomeCode | "invalid_arguments";
  constructor(code: SourceProjectionOutcomeCode | "invalid_arguments", message: string) {
    super(message);
    this.name = "SourceProjectionError";
    this.code = code;
  }
}

/** Declared source selector — never an arbitrary filesystem path. */
export interface DeclaredSourceSelector {
  readonly selectorId: string;
  readonly workspaceId: string;
  readonly productRevision: string;
  readonly purpose: string;
  readonly dataScope: readonly string[];
  /** Relative logical source keys only (no path escape). */
  readonly allowedSourceIds: readonly string[];
  readonly selectedProviderId?: string;
  readonly privacyClass: "public" | "workspace" | "private";
}

/** Pinned source supplied by the caller (already authorized/read elsewhere). */
export interface PinnedSourceRecord {
  readonly sourceId: string;
  readonly workspaceId: string;
  readonly content: string;
  readonly contentSha256: string;
  readonly privacyClass: "public" | "workspace" | "private";
  readonly fields: Readonly<Record<string, string>>;
  readonly providerId?: string;
}

export interface ProjectionField {
  readonly fieldPath: string;
  readonly value: string;
  readonly provenance: FieldProvenance;
}

export interface ImmutableSourceProjection {
  readonly schemaVersion: typeof SEMANTIC_SOURCE_PROJECTION_SCHEMA_VERSION;
  readonly selectorId: string;
  readonly workspaceId: string;
  readonly productRevision: string;
  readonly purpose: string;
  readonly fields: readonly ProjectionField[];
  readonly coverage: ReturnType<typeof buildCoverageLedger>;
  readonly projectionDigest: string;
  /** Safe for cache keys — never includes private/out-of-scope bytes. */
  readonly cacheKeyPayload: string;
  /** Safe for public diagnostics — redacted. */
  readonly publicDiagnostic: {
    readonly selectorId: string;
    readonly coverageComplete: boolean;
    readonly fieldCount: number;
    readonly omittedCount: number;
    readonly outcome: SourceProjectionOutcomeCode;
  };
  /** Safe for provider dispatch — minimized + redacted. */
  readonly providerRequestPayload: {
    readonly purpose: string;
    readonly fields: Readonly<Record<string, string>>;
    readonly projectionDigest: string;
  };
  readonly outcome: SourceProjectionOutcomeCode;
  readonly pinVerifications: readonly { readonly sourceId: string; readonly result: PinVerifyResult }[];
}

export interface ProjectSourcesInput {
  readonly selector: DeclaredSourceSelector;
  /** Registry of allowed selectors — only these may resolve. */
  readonly registeredSelectors: readonly DeclaredSourceSelector[];
  readonly pinnedSources: readonly PinnedSourceRecord[];
  readonly requiredSourceIds: readonly string[];
  readonly fieldPaths: readonly string[];
  /** Max Unicode code points per field before truncation → continuation/hold. */
  readonly maxFieldChars?: number;
  readonly candidates?: readonly CandidateRecord[];
  readonly candidateOptions?: {
    readonly maxPairs?: number;
    readonly minEvidenceChars?: number;
    readonly caseId: string;
    readonly expectedRecoverableIds?: readonly string[];
    readonly exactKeys?: readonly string[];
    readonly bindingIds?: readonly string[];
    readonly boundedRules?: {
      readonly requiredTags?: readonly string[];
      readonly keyPrefix?: string;
      readonly maxResults: number;
      readonly minEvidenceChars?: number;
    };
  };
}

export interface ProjectSourcesResult {
  readonly projection: ImmutableSourceProjection;
  readonly candidates?: CandidateGenerationResult;
  readonly selectedProviderRetention?: ReturnType<typeof retainSelectedProviderKnowledge>;
}

const PATH_ESCAPE = /(?:^|\/)\.\.(?:\/|$)|^[\\/]|^[A-Za-z]:|\\|\0|~/;

function isSafeSourceId(sourceId: string): boolean {
  if (!sourceId || sourceId.length > 256) return false;
  if (PATH_ESCAPE.test(sourceId)) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(sourceId) && !sourceId.startsWith("src.")) return false;
  return /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(sourceId);
}

function assertRegisteredSelector(selector: DeclaredSourceSelector, registered: readonly DeclaredSourceSelector[]): DeclaredSourceSelector {
  const found = registered.find((s) => s.selectorId === selector.selectorId);
  if (!found) {
    throw new SourceProjectionError("selector_rejected", `Unregistered selector ${selector.selectorId}`);
  }
  // Fail closed: caller must match declared purpose/scope/workspace/revision.
  if (found.workspaceId !== selector.workspaceId) {
    throw new SourceProjectionError("scope_violation", "workspaceId does not match registered selector");
  }
  if (found.productRevision !== selector.productRevision) {
    throw new SourceProjectionError("scope_violation", "productRevision does not match registered selector");
  }
  if (found.purpose !== selector.purpose) {
    throw new SourceProjectionError("scope_violation", "purpose does not match registered selector");
  }
  return found;
}

function rejectEscapingOrCrossWorkspace(selector: DeclaredSourceSelector, sources: readonly PinnedSourceRecord[]): void {
  for (const sourceId of selector.allowedSourceIds) {
    if (!isSafeSourceId(sourceId)) {
      throw new SourceProjectionError("selector_rejected", `Escaping or invalid source id: ${sourceId}`);
    }
  }
  for (const source of sources) {
    if (!isSafeSourceId(source.sourceId)) {
      throw new SourceProjectionError("selector_rejected", `Escaping or invalid pinned source id: ${source.sourceId}`);
    }
    if (source.workspaceId !== selector.workspaceId) {
      throw new SourceProjectionError("scope_violation", `Cross-workspace source refused: ${source.sourceId}`);
    }
  }
}

function isInScope(selector: DeclaredSourceSelector, source: PinnedSourceRecord): boolean {
  if (!selector.allowedSourceIds.includes(source.sourceId)) return false;
  if (source.workspaceId !== selector.workspaceId) return false;
  // Private sources never project unless selector privacyClass is private AND source is allowed.
  if (source.privacyClass === "private" && selector.privacyClass !== "private") return false;
  // Data scope must intersect — empty dataScope means no data admitted.
  if (selector.dataScope.length === 0) return false;
  return true;
}

function redactValue(value: string): string {
  // Approved minimization: strip secret-like tokens before diagnostics / provider dispatch.
  return value
    .replace(/\b(sk|pk|api|token|secret|password|bearer)[-_]?[A-Za-z0-9]{8,}\b/gi, "[redacted]")
    .replace(/\b[A-Za-z0-9+/]{40,}={0,2}\b/g, "[redacted-b64]");
}

/**
 * Build an immutable, authority-scoped source projection.
 * Private / out-of-scope bytes never enter projection fields, cache keys, diagnostics, or provider payloads.
 */
export function projectAuthorizedSources(input: ProjectSourcesInput): ProjectSourcesResult {
  const registered = assertRegisteredSelector(input.selector, input.registeredSelectors);
  rejectEscapingOrCrossWorkspace(registered, input.pinnedSources);

  const byId = new Map(input.pinnedSources.map((s) => [s.sourceId, s]));
  const coverageEntries: CoverageEntry[] = [];
  const omitted: OmittedInput[] = [];
  const fields: ProjectionField[] = [];
  const pinVerifications: { sourceId: string; result: PinVerifyResult }[] = [];
  const maxFieldChars = input.maxFieldChars ?? 512;

  // Required sources: absent → insufficient_context (not confident no-match).
  for (const requiredId of input.requiredSourceIds) {
    if (!isSafeSourceId(requiredId)) {
      throw new SourceProjectionError("selector_rejected", `Escaping required source id: ${requiredId}`);
    }
    const source = byId.get(requiredId);
    if (!source) {
      omitted.push({ sourceId: requiredId, fieldPath: "*", reason: "absent" });
      coverageEntries.push({
        sourceId: requiredId,
        fieldPath: "*",
        status: "missing",
        nextOffset: null,
        reason: "absent_required_source",
      });
    } else if (!isInScope(registered, source)) {
      // Out-of-scope / private: never project; record omission without leaking content.
      omitted.push({
        sourceId: requiredId,
        fieldPath: "*",
        reason: source.privacyClass === "private" ? "private" : "out_of_scope",
      });
      coverageEntries.push({
        sourceId: requiredId,
        fieldPath: "*",
        status: "omitted",
        nextOffset: null,
        reason: source.privacyClass === "private" ? "private" : "out_of_scope",
      });
    }
  }

  const absentRequired = omitted.some((o) => o.reason === "absent");
  if (absentRequired) {
    const coverage = buildCoverageLedger(coverageEntries, omitted);
    const projection = finalizeProjection({
      registered,
      fields: [],
      coverage,
      outcome: "insufficient_context",
      pinVerifications: [],
    });
    return { projection };
  }

  // Project in-scope sources only.
  for (const source of [...input.pinnedSources].sort((a, b) => a.sourceId.localeCompare(b.sourceId))) {
    if (!isInScope(registered, source)) {
      // Never leak private/out-of-scope into any payload — omit silently from fields.
      if (!input.requiredSourceIds.includes(source.sourceId)) {
        omitted.push({
          sourceId: source.sourceId,
          fieldPath: "*",
          reason: source.privacyClass === "private" ? "private" : "out_of_scope",
        });
      }
      continue;
    }

    // Pinned integrity: verify hash before using content under this identity.
    const pin = verifyPinnedExcerpt({
      pinnedContent: source.content,
      expectedContentSha256: source.contentSha256,
      spanStart: 0,
      spanEnd: codePointLength(source.content),
    });
    pinVerifications.push({ sourceId: source.sourceId, result: pin });
    if (pin.status === "unresolved") {
      omitted.push({ sourceId: source.sourceId, fieldPath: "*", reason: "unresolved" });
      coverageEntries.push({
        sourceId: source.sourceId,
        fieldPath: "*",
        status: "missing",
        nextOffset: null,
        reason: pin.reason,
      });
      continue;
    }

    for (const fieldPath of input.fieldPaths) {
      const raw = source.fields[fieldPath];
      if (raw === undefined) {
        omitted.push({ sourceId: source.sourceId, fieldPath, reason: "absent" });
        coverageEntries.push({
          sourceId: source.sourceId,
          fieldPath,
          status: "missing",
          nextOffset: null,
          reason: "field_absent",
        });
        continue;
      }

      const fullLen = codePointLength(raw);
      // Locate span inside pinned content when possible; else treat field as its own span.
      let spanStart = 0;
      let spanEnd = fullLen;
      const idx = source.content.indexOf(raw);
      if (idx >= 0) {
        // Convert UTF-16 index to code-point offset.
        spanStart = codePointLength(source.content.slice(0, idx));
        spanEnd = spanStart + fullLen;
      }

      let value = raw;
      let status: CoverageEntry["status"] = "complete";
      let nextOffset: number | null = null;
      if (fullLen > maxFieldChars) {
        value = recoverSpan(raw, 0, maxFieldChars);
        status = "partial";
        nextOffset = maxFieldChars;
        // Bounded omission → valid continuation (nextOffset) — not silent drop.
      }

      const redacted = redactValue(value);
      fields.push({
        fieldPath: `${source.sourceId}.${fieldPath}`,
        value: redacted,
        provenance: {
          sourceId: source.sourceId,
          fieldPath,
          spanStart,
          spanEnd: status === "partial" ? spanStart + maxFieldChars : spanEnd,
          contentSha256: source.contentSha256,
        },
      });
      coverageEntries.push({
        sourceId: source.sourceId,
        fieldPath,
        status,
        nextOffset,
        reason: status === "partial" ? "budget_truncation" : undefined,
      });
    }
  }

  // If a required source was unresolved (stale hash), outcome is unresolved — never silent refresh.
  const hasUnresolved = pinVerifications.some((p) => p.result.status === "unresolved");
  const hasPrivateOrOutOfScopeRequired = omitted.some(
    (o) => (o.reason === "private" || o.reason === "out_of_scope") && input.requiredSourceIds.includes(o.sourceId),
  );

  let outcome: SourceProjectionOutcomeCode = "ok";
  if (hasUnresolved) outcome = "unresolved";
  else if (hasPrivateOrOutOfScopeRequired) outcome = "insufficient_context";
  else if (fields.length === 0 && input.requiredSourceIds.length > 0) outcome = "insufficient_context";

  const coverage = buildCoverageLedger(coverageEntries, omitted);
  const projection = finalizeProjection({
    registered,
    fields,
    coverage,
    outcome,
    pinVerifications,
  });

  let candidates: CandidateGenerationResult | undefined;
  let selectedProviderRetention: ReturnType<typeof retainSelectedProviderKnowledge> | undefined;

  if (input.candidates && input.candidateOptions) {
    let pool = [...input.candidates];
    const opts = input.candidateOptions;
    if (opts.exactKeys && opts.bindingIds) {
      const merged = new Map<string, CandidateRecord>();
      for (const c of [...selectByExactKeys(input.candidates, opts.exactKeys), ...selectByAuthoredBindings(input.candidates, opts.bindingIds)]) {
        merged.set(c.id, c);
      }
      pool = [...merged.values()];
    } else if (opts.exactKeys) {
      pool = selectByExactKeys(pool, opts.exactKeys);
    } else if (opts.bindingIds) {
      pool = selectByAuthoredBindings(input.candidates, opts.bindingIds);
    }
    if (opts.boundedRules) {
      const bounded = selectByBoundedRules(input.candidates, opts.boundedRules);
      if (!opts.exactKeys && !opts.bindingIds) {
        pool = bounded;
      } else {
        const allow = new Set(bounded.map((c) => c.id));
        pool = pool.filter((c) => allow.has(c.id));
      }
    }

    candidates = generateCandidatePairs(pool, {
      maxPairs: opts.maxPairs ?? DEFAULT_MAX_CANDIDATE_PAIRS,
      minEvidenceChars: opts.minEvidenceChars,
      caseId: opts.caseId,
      expectedRecoverableIds: opts.expectedRecoverableIds,
    });
  }

  if (registered.selectedProviderId) {
    const selectedRecords = (input.candidates ?? []).filter((c) => c.providerId === registered.selectedProviderId);
    const unselected = (input.candidates ?? []).filter((c) => c.providerId !== registered.selectedProviderId);
    selectedProviderRetention = retainSelectedProviderKnowledge({
      selectedProviderId: registered.selectedProviderId,
      selectedRecords,
      unselectedGuidance: unselected,
    });
  }

  return {
    projection,
    ...(candidates ? { candidates } : {}),
    ...(selectedProviderRetention ? { selectedProviderRetention } : {}),
  };
}

function finalizeProjection(args: {
  registered: DeclaredSourceSelector;
  fields: ProjectionField[];
  coverage: ReturnType<typeof buildCoverageLedger>;
  outcome: SourceProjectionOutcomeCode;
  pinVerifications: readonly { readonly sourceId: string; readonly result: PinVerifyResult }[];
}): ImmutableSourceProjection {
  const { registered, fields, coverage, outcome, pinVerifications } = args;
  // Cache key: digests + selector identity + field digests — never raw private content.
  const cacheKeyPayload = digestOf({
    selectorId: registered.selectorId,
    workspaceId: registered.workspaceId,
    productRevision: registered.productRevision,
    purpose: registered.purpose,
    dataScope: registered.dataScope,
    fieldDigests: fields.map((f) => ({ path: f.fieldPath, sha256: sha256Hex(f.value) })),
    coverageDigest: digestOf(coverage),
    outcome,
  });
  const projectionDigest = sha256Hex(cacheKeyPayload);

  const providerFields: Record<string, string> = {};
  for (const field of fields) {
    providerFields[field.fieldPath] = field.value;
  }

  // Assert no private marker strings leaked (defense in depth for fixtures).
  const serialized = JSON.stringify({
    cacheKeyPayload,
    publicDiagnostic: { selectorId: registered.selectorId },
    providerRequestPayload: providerFields,
    fields: fields.map((f) => f.value),
  });
  if (serialized.includes("PRIVATE_PAYLOAD") || serialized.includes("OUT_OF_SCOPE_SECRET")) {
    throw new SourceProjectionError("scope_violation", "Private/out-of-scope content leaked into projection payloads");
  }

  return {
    schemaVersion: SEMANTIC_SOURCE_PROJECTION_SCHEMA_VERSION,
    selectorId: registered.selectorId,
    workspaceId: registered.workspaceId,
    productRevision: registered.productRevision,
    purpose: registered.purpose,
    fields,
    coverage,
    projectionDigest,
    cacheKeyPayload,
    publicDiagnostic: {
      selectorId: registered.selectorId,
      coverageComplete: coverage.complete,
      fieldCount: fields.length,
      omittedCount: coverage.omitted.length,
      outcome,
    },
    providerRequestPayload: {
      purpose: registered.purpose,
      fields: providerFields,
      projectionDigest,
    },
    outcome,
    pinVerifications,
  };
}

/** Try-variant for fixtures — never throws for expected fail-closed outcomes. */
export function tryProjectAuthorizedSources(
  input: ProjectSourcesInput,
): { readonly ok: true; readonly result: ProjectSourcesResult } | { readonly ok: false; readonly code: string; readonly message: string } {
  try {
    return { ok: true, result: projectAuthorizedSources(input) };
  } catch (error) {
    if (error instanceof SourceProjectionError) {
      return { ok: false, code: error.code, message: error.message };
    }
    throw error;
  }
}

export type { CandidateGenerationResult, CandidateRecord, MissedCandidateReport, PinVerifyResult };
