/**
 * #520 SQ-10 — Persist inference receipts with policy replay + scoped caching.
 *
 * Stored assessment / policy projection (kernel/services ownership).
 * Paper / in-memory ownership handle — NOT an independent semantic journal or
 * direct cache authority. Cache hits are receipt references, not authorization.
 *
 * Consumes #512–#519. Implements SQ-10 persist/replay/cache; coordinates
 * invalidation/erasure with kernel/engine + kernel/reducer. Does not implement #521–#529.
 * Does not alter source-fingerprint guarantees. No TTL-only freshness, exactly-once
 * claim, silent result replacement, hash-as-privacy, or cache→provider from passive reads.
 *
 * Jev decides (Choice/Score/Noul); LLM writes; code owns persist / replay / cache.
 */
import { digestOf, sha256Hex } from "../../contracts/semantic/canonicalize.js";
import { PLAN_IDENTITY_CANONICALIZATION_VERSION } from "../../contracts/semantic/query-ir.js";
import {
  parseInferenceReceipt,
  parsePolicyApplicationReceipt,
  type InferenceReceipt,
  type PolicyApplicationReceipt,
} from "../../contracts/semantic/receipts.js";
import type { StoredReceiptRef } from "../knowledge-service/semantic-graph-views.js";

export const INFERENCE_RECEIPT_STORE_ISSUE = "#520" as const;
export const INFERENCE_RECEIPT_STORE_EPIC = "#511" as const;
export const INFERENCE_RECEIPT_STORE_CONSUMES = ["#512", "#513", "#514", "#515", "#516", "#517", "#518", "#519"] as const;
export const INFERENCE_RECEIPT_STORE_STAMP = "0.221.40" as const;
export const INFERENCE_RECEIPT_STORE_SCHEMA_VERSION = 1 as const;
export const INFERENCE_RECEIPT_STORE_NO_521_IMPL = true as const;
export const INFERENCE_RECEIPT_STORE_NO_NETWORK = true as const;
export const INFERENCE_RECEIPT_STORE_NO_PARALLEL_CACHE_AUTHORITY = true as const;
export const INFERENCE_RECEIPT_STORE_NO_TTL_ONLY = true as const;
export const INFERENCE_RECEIPT_STORE_NO_EXACTLY_ONCE = true as const;
export const INFERENCE_RECEIPT_STORE_NEXT_AFTER_CLOSE = "#521" as const;
export const INFERENCE_RECEIPT_CANONICALIZATION_VERSION = PLAN_IDENTITY_CANONICALIZATION_VERSION;

export class InferenceReceiptStoreError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "InferenceReceiptStoreError";
    this.code = code;
  }
}

/** Parts that form a scoped cache key — workspace is mandatory and never elided. */
export interface ScopedCacheKeyParts {
  readonly workspaceId: string;
  readonly securityScope: string;
  readonly sourceDigest: string;
  readonly projectionDigest: string;
  readonly questionPackDigest: string;
  readonly bindingId: string;
  readonly adapterDigest: string;
  readonly responseContractDigest: string;
  /** Exact model revision when known; otherwise alias id with explicit freshness bound. */
  readonly modelIdentity: string;
  /** Required when modelIdentity is a mutable alias (not an immutable revision). */
  readonly modelAliasFreshnessBound?: string;
  readonly locale: string;
  readonly purpose: string;
  readonly canonicalizationVersion: number;
}

/**
 * Build a scoped cache key. Omits secrets/PII by construction — only digests,
 * ids, and declared purpose/locale. Same projection bytes in two workspaces
 * produce DISTINCT keys (workspaceId is always in the key).
 */
export function buildScopedCacheKey(parts: ScopedCacheKeyParts): string {
  if (!parts.workspaceId.trim()) {
    throw new InferenceReceiptStoreError("cache.missing_workspace", "workspaceId required for scoped cache key");
  }
  if (!parts.securityScope.trim()) {
    throw new InferenceReceiptStoreError("cache.missing_security_scope", "securityScope required");
  }
  if (!parts.purpose.trim()) {
    throw new InferenceReceiptStoreError("cache.missing_purpose", "purpose required");
  }
  if (parts.canonicalizationVersion !== INFERENCE_RECEIPT_CANONICALIZATION_VERSION) {
    throw new InferenceReceiptStoreError(
      "cache.canonicalization_mismatch",
      `expected ${INFERENCE_RECEIPT_CANONICALIZATION_VERSION}, got ${parts.canonicalizationVersion}`,
    );
  }
  // Alias honesty: mutable alias without freshness bound is refused.
  if (parts.modelIdentity.startsWith("alias:") && !parts.modelAliasFreshnessBound?.trim()) {
    throw new InferenceReceiptStoreError(
      "cache.alias_freshness_required",
      "model alias requires an explicit freshness bound; replaying stored values is deterministic, repeat inference may not be",
    );
  }
  return digestOf({
    v: INFERENCE_RECEIPT_STORE_SCHEMA_VERSION,
    workspaceId: parts.workspaceId,
    securityScope: parts.securityScope,
    sourceDigest: parts.sourceDigest,
    projectionDigest: parts.projectionDigest,
    questionPackDigest: parts.questionPackDigest,
    bindingId: parts.bindingId,
    adapterDigest: parts.adapterDigest,
    responseContractDigest: parts.responseContractDigest,
    modelIdentity: parts.modelIdentity,
    modelAliasFreshnessBound: parts.modelAliasFreshnessBound ?? null,
    locale: parts.locale,
    purpose: parts.purpose,
    canonicalizationVersion: parts.canonicalizationVersion,
  });
}

/** Aggregate source revisions into a digest for cache keys (order-independent). */
export function sourceRevisionsDigest(revisions: readonly { readonly sourceId: string; readonly revision: string }[]): string {
  const sorted = [...revisions]
    .map((r) => ({ sourceId: r.sourceId, revision: r.revision }))
    .sort((a, b) => a.sourceId.localeCompare(b.sourceId) || a.revision.localeCompare(b.revision));
  return digestOf(sorted);
}

export type PolicyDecisionOutcome = "apply" | "defer" | "reject" | "require-observation";

export interface PolicyDecision {
  readonly outcome: PolicyDecisionOutcome;
  readonly selectedAlternativeId?: string;
  readonly excludedAlternatives: readonly { readonly alternativeId: string; readonly reason: string }[];
  readonly derived?: Record<string, string | number | boolean | null>;
}

export interface OwnershipPersistHandle {
  readonly generation: string;
  readonly workspaceId: string;
  readonly occurrenceId: string;
  readonly resource: string;
  readonly active: boolean;
}

export interface PersistedInferenceRecord {
  readonly receipt: InferenceReceipt;
  readonly receiptDigest: string;
  readonly cacheKey: string;
  readonly workspaceId: string;
  readonly sourceDigest: string;
  /** Source revision observed at persist time — used for in-flight stale checks. */
  readonly persistSourceRevision: string;
  readonly published: boolean;
  readonly erased: boolean;
  readonly stale: boolean;
  readonly staleReason: string | null;
  readonly modelIdentity: string;
  readonly modelAliasFreshnessBound: string | null;
}

export interface StoredPolicyRecord {
  readonly policyReceipt: PolicyApplicationReceipt;
  readonly policyReceiptDigest: string;
  readonly inferenceReceiptId: string;
  readonly inferenceReceiptDigest: string;
  readonly providerCallsDuringReplay: number;
  readonly erased: boolean;
}

export interface ProviderCallCounter {
  calls: number;
}

/** Authorization context rechecked on every cache reuse. */
export interface AuthContext {
  readonly workspaceId: string;
  readonly securityScope: string;
  readonly authorized: boolean;
  readonly purpose: string;
}

/**
 * In-memory paper store. Not a durable journal authority — fixtures and
 * reducer ownership drive persistence lifecycle. Reverse refs live in the
 * invalidation module; this store only holds receipt/policy projection state.
 */
export class InferenceReceiptStore {
  private readonly byId = new Map<string, PersistedInferenceRecord>();
  private readonly byCacheKey = new Map<string, string>(); // cacheKey → receiptId (workspace-scoped via key)
  private readonly policyById = new Map<string, StoredPolicyRecord>();
  private readonly erasedReceiptIds = new Set<string>();
  /** Non-identifying erasure metadata only (digests / counts — never payloads). */
  private readonly erasureTombstones: {
    readonly erasureId: string;
    readonly receiptDigest: string;
    readonly erasedAt: string;
    readonly coveredDerivedCount: number;
  }[] = [];
  readonly providerCalls: ProviderCallCounter;

  constructor(providerCalls: ProviderCallCounter = { calls: 0 }) {
    this.providerCalls = providerCalls;
  }

  /** Crash-point seam: persist must succeed before any derived annotation publish. */
  persistInferenceReceipt(input: {
    readonly receipt: unknown;
    readonly cacheKeyParts: ScopedCacheKeyParts;
    readonly ownership: OwnershipPersistHandle;
    readonly persistSourceRevision: string;
    /** When true, simulate crash mid-persist (no store write, no publish). */
    readonly simulateCrashBeforeCommit?: boolean;
  }): PersistedInferenceRecord {
    if (!input.ownership.active) {
      throw new InferenceReceiptStoreError("persist.ownership_inactive", "ownership must be active to persist");
    }
    if (input.ownership.workspaceId !== input.cacheKeyParts.workspaceId) {
      throw new InferenceReceiptStoreError("persist.ownership_workspace_mismatch", "ownership workspace ≠ cache key workspace");
    }
    const receipt = parseInferenceReceipt(input.receipt);
    const workspaceId = receipt.workspaceId ?? input.cacheKeyParts.workspaceId;
    if (workspaceId !== input.cacheKeyParts.workspaceId) {
      throw new InferenceReceiptStoreError("persist.receipt_workspace_mismatch", "receipt workspace ≠ cache key workspace");
    }
    assertNoSecretsInReceiptSurfaces(receipt);

    const cacheKey = buildScopedCacheKey(input.cacheKeyParts);
    const receiptDigest = digestOf(receipt);

    if (input.simulateCrashBeforeCommit) {
      throw new InferenceReceiptStoreError("persist.crash_before_commit", "simulated crash before ownership commit — no publish");
    }

    if (this.erasedReceiptIds.has(receipt.receiptId)) {
      throw new InferenceReceiptStoreError("persist.erased_id_reuse", "cannot re-persist an erased receipt id");
    }

    const record: PersistedInferenceRecord = {
      receipt: { ...receipt, workspaceId },
      receiptDigest,
      cacheKey,
      workspaceId,
      sourceDigest: input.cacheKeyParts.sourceDigest,
      persistSourceRevision: input.persistSourceRevision,
      published: false, // publish only via publishDerivedAnnotations
      erased: false,
      stale: false,
      staleReason: null,
      modelIdentity: input.cacheKeyParts.modelIdentity,
      modelAliasFreshnessBound: input.cacheKeyParts.modelAliasFreshnessBound ?? null,
    };
    this.byId.set(receipt.receiptId, record);
    this.byCacheKey.set(`${workspaceId}\0${cacheKey}`, receipt.receiptId);
    return record;
  }

  /**
   * Publish derived annotations ONLY after a validated receipt is persisted.
   * Persist-before-publish: refuses if receipt missing / erased / stale.
   */
  publishDerivedAnnotations(receiptId: string): PersistedInferenceRecord {
    const record = this.requireLive(receiptId);
    if (record.stale) {
      throw new InferenceReceiptStoreError("publish.stale_receipt", record.staleReason ?? "stale");
    }
    const published: PersistedInferenceRecord = { ...record, published: true };
    this.byId.set(receiptId, published);
    return published;
  }

  get(receiptId: string): PersistedInferenceRecord | undefined {
    return this.byId.get(receiptId);
  }

  toStoredReceiptRef(receiptId: string): StoredReceiptRef {
    const record = this.requireLive(receiptId);
    return {
      receiptId: record.receipt.receiptId,
      workspaceId: record.workspaceId,
      projectionDigest: record.receipt.projectionDigest,
      planIdentity: record.receipt.planIdentity,
    };
  }

  /**
   * Lookup by scoped cache key with mandatory auth recheck.
   * Cache hit ≠ authorization. Cross-workspace keys never collide.
   * Passive reads NEVER trigger provider calls.
   */
  lookupByCacheKey(input: {
    readonly cacheKeyParts: ScopedCacheKeyParts;
    readonly auth: AuthContext;
  }): { readonly hit: true; readonly record: PersistedInferenceRecord } | { readonly hit: false; readonly reason: string } {
    if (input.auth.workspaceId !== input.cacheKeyParts.workspaceId) {
      return { hit: false, reason: "auth.workspace_mismatch" };
    }
    if (!input.auth.authorized) {
      return { hit: false, reason: "auth.not_authorized" };
    }
    if (input.auth.securityScope !== input.cacheKeyParts.securityScope) {
      return { hit: false, reason: "auth.security_scope_mismatch" };
    }
    if (input.auth.purpose !== input.cacheKeyParts.purpose) {
      return { hit: false, reason: "auth.purpose_mismatch" };
    }
    const cacheKey = buildScopedCacheKey(input.cacheKeyParts);
    const id = this.byCacheKey.get(`${input.cacheKeyParts.workspaceId}\0${cacheKey}`);
    if (!id) return { hit: false, reason: "cache.miss" };
    const record = this.byId.get(id);
    if (!record || record.erased) return { hit: false, reason: "cache.erased" };
    if (record.stale) return { hit: false, reason: "cache.stale" };
    if (record.workspaceId !== input.auth.workspaceId) {
      // Defense in depth — should be unreachable if keys include workspace.
      return { hit: false, reason: "cache.cross_workspace_denied" };
    }
    return { hit: true, record };
  }

  /**
   * Policy-only replay over an immutable original inference result.
   * NEVER increments providerCalls — assessment ≠ policy.
   */
  applyPolicy(input: {
    readonly inferenceReceiptId: string;
    readonly policyDigest: string;
    readonly policyReceiptId: string;
    readonly decision: PolicyDecision;
    readonly recordedAt: string;
  }): StoredPolicyRecord {
    const record = this.requireLive(input.inferenceReceiptId);
    if (record.stale) {
      throw new InferenceReceiptStoreError("policy.stale_inference", record.staleReason ?? "stale");
    }
    if (!record.published && !record.receipt) {
      throw new InferenceReceiptStoreError("policy.missing_inference", input.inferenceReceiptId);
    }
    const providerCallsBefore = this.providerCalls.calls;
    // Deterministic policy over immutable original — zero provider calls by construction.
    const policyReceipt = parsePolicyApplicationReceipt({
      schemaVersion: 1,
      kind: "policy-application-receipt",
      evidenceClass: "inference",
      receiptId: input.policyReceiptId,
      inferenceReceiptId: record.receipt.receiptId,
      inferenceReceiptDigest: record.receiptDigest,
      policyDigest: input.policyDigest,
      decision: {
        outcome: input.decision.outcome,
        selectedAlternativeId: input.decision.selectedAlternativeId,
        excludedAlternatives: [...input.decision.excludedAlternatives],
      },
      derived: input.decision.derived ?? {},
      recordedAt: input.recordedAt,
    });
    if (this.providerCalls.calls !== providerCallsBefore) {
      throw new InferenceReceiptStoreError("policy.provider_called", "policy replay must not call provider");
    }
    const stored: StoredPolicyRecord = {
      policyReceipt,
      policyReceiptDigest: digestOf(policyReceipt),
      inferenceReceiptId: record.receipt.receiptId,
      inferenceReceiptDigest: record.receiptDigest,
      providerCallsDuringReplay: 0,
      erased: false,
    };
    this.policyById.set(policyReceipt.receiptId, stored);
    return stored;
  }

  getPolicy(policyReceiptId: string): StoredPolicyRecord | undefined {
    return this.policyById.get(policyReceiptId);
  }

  /**
   * Mark inference in-flight against a source revision; a later source change
   * before accept → stale refusal (not current acceptance).
   */
  beginInFlight(receiptId: string, sourceRevisionAtStart: string): void {
    const record = this.requireLive(receiptId);
    if (record.persistSourceRevision !== sourceRevisionAtStart) {
      const stale: PersistedInferenceRecord = {
        ...record,
        stale: true,
        staleReason: "source_changed_while_in_flight",
        published: false,
      };
      this.byId.set(receiptId, stale);
      throw new InferenceReceiptStoreError(
        "inflight.stale_source",
        `source changed while inference in flight: started=${sourceRevisionAtStart} persisted=${record.persistSourceRevision}`,
      );
    }
  }

  /**
   * Accept in-flight result only if source revision is unchanged.
   * Source change → refuse (stale), never current acceptance.
   */
  acceptInFlightResult(input: {
    readonly receiptId: string;
    readonly sourceRevisionAtAccept: string;
    readonly sourceRevisionAtStart: string;
  }): PersistedInferenceRecord {
    const record = this.requireLive(input.receiptId);
    if (input.sourceRevisionAtAccept !== input.sourceRevisionAtStart) {
      const stale: PersistedInferenceRecord = {
        ...record,
        stale: true,
        staleReason: "source_changed_while_in_flight",
        published: false,
      };
      this.byId.set(input.receiptId, stale);
      throw new InferenceReceiptStoreError("accept.stale_source", "source changed while inference in flight — refusing stale result (not current acceptance)");
    }
    if (record.persistSourceRevision !== input.sourceRevisionAtAccept) {
      const stale: PersistedInferenceRecord = {
        ...record,
        stale: true,
        staleReason: "persist_revision_mismatch",
        published: false,
      };
      this.byId.set(input.receiptId, stale);
      throw new InferenceReceiptStoreError("accept.revision_mismatch", "persist revision ≠ accept revision");
    }
    return this.publishDerivedAnnotations(input.receiptId);
  }

  /** Model-alias mutation honesty: changing alias freshness bound cannot silently reuse old entry. */
  assertModelAliasStillValid(receiptId: string, currentFreshnessBound: string | undefined): void {
    const record = this.requireLive(receiptId);
    if (record.modelIdentity.startsWith("alias:")) {
      if (!currentFreshnessBound?.trim()) {
        throw new InferenceReceiptStoreError("alias.freshness_missing", "current alias freshness bound required");
      }
      if (record.modelAliasFreshnessBound !== currentFreshnessBound) {
        throw new InferenceReceiptStoreError(
          "alias.drift",
          "model alias freshness bound drifted — replaying stored values is deterministic; repeat inference may not be",
        );
      }
    }
  }

  /**
   * Authorized erasure of a receipt and its derived policy/cache projections.
   * Leaves only non-identifying tombstone metadata. Rebuild must not restore.
   */
  eraseReceipt(input: { readonly receiptId: string; readonly erasureId: string; readonly erasedAt: string; readonly authorized: boolean }): {
    readonly erasedReceiptId: string;
    readonly erasedPolicyIds: readonly string[];
    readonly tombstone: { readonly erasureId: string; readonly receiptDigest: string; readonly erasedAt: string; readonly coveredDerivedCount: number };
  } {
    if (!input.authorized) {
      throw new InferenceReceiptStoreError("erasure.unauthorized", "erasure requires authorization");
    }
    const record = this.byId.get(input.receiptId);
    if (!record) {
      throw new InferenceReceiptStoreError("erasure.not_found", input.receiptId);
    }
    if (record.erased) {
      throw new InferenceReceiptStoreError("erasure.already_erased", input.receiptId);
    }
    const erasedPolicies: string[] = [];
    for (const [pid, policy] of this.policyById) {
      if (policy.inferenceReceiptId === input.receiptId && !policy.erased) {
        this.policyById.set(pid, { ...policy, erased: true });
        erasedPolicies.push(pid);
      }
    }
    const tombstone = {
      erasureId: input.erasureId,
      receiptDigest: record.receiptDigest,
      erasedAt: input.erasedAt,
      coveredDerivedCount: 1 + erasedPolicies.length,
    };
    this.erasureTombstones.push(tombstone);
    this.erasedReceiptIds.add(input.receiptId);
    // Redact payload — keep only tombstone linkage; strip results/coverage content.
    const redacted: PersistedInferenceRecord = {
      ...record,
      erased: true,
      published: false,
      stale: true,
      staleReason: "erased",
      receipt: {
        ...record.receipt,
        results: [
          {
            status: "cancelled",
            questionId: "q.erased",
            detail: "erased",
          },
        ],
        coverage: { includedSourceIds: [], omittedSourceIds: [], omittedFields: [] },
      },
    };
    this.byId.set(input.receiptId, redacted);
    this.byCacheKey.delete(`${record.workspaceId}\0${record.cacheKey}`);
    return { erasedReceiptId: input.receiptId, erasedPolicyIds: erasedPolicies, tombstone };
  }

  listErasureTombstones(): readonly {
    readonly erasureId: string;
    readonly receiptDigest: string;
    readonly erasedAt: string;
    readonly coveredDerivedCount: number;
  }[] {
    return this.erasureTombstones;
  }

  isErased(receiptId: string): boolean {
    return this.erasedReceiptIds.has(receiptId);
  }

  /**
   * Rebuild must not restore erased receipts. Returns only non-erased live records
   * for a workspace — erased digests stay in tombstones only.
   */
  listLiveReceiptsForRebuild(workspaceId: string): readonly PersistedInferenceRecord[] {
    return [...this.byId.values()].filter((r) => r.workspaceId === workspaceId && !r.erased && !r.stale);
  }

  markStale(receiptId: string, reason: string): void {
    const record = this.byId.get(receiptId);
    if (!record || record.erased) return;
    this.byId.set(receiptId, { ...record, stale: true, staleReason: reason, published: false });
  }

  private requireLive(receiptId: string): PersistedInferenceRecord {
    const record = this.byId.get(receiptId);
    if (!record) throw new InferenceReceiptStoreError("receipt.not_found", receiptId);
    if (record.erased) throw new InferenceReceiptStoreError("receipt.erased", receiptId);
    return record;
  }
}

/** Refuse secrets/PII patterns in receipt surfaces that become keys/logs. */
export function assertNoSecretsInReceiptSurfaces(receipt: InferenceReceipt): void {
  const surfaces = [
    receipt.receiptId,
    receipt.requestId,
    receipt.attemptId,
    receipt.planId,
    receipt.binding.providerBindingId,
    receipt.binding.requestedModel ?? "",
    receipt.binding.returnedModel ?? "",
    receipt.privacy?.purpose ?? "",
    receipt.privacy?.dataClassification ?? "",
  ].join("\n");
  const forbidden = [
    /api[_-]?key/i,
    /sk-[a-zA-Z0-9]{8,}/,
    /Bearer\s+[A-Za-z0-9._-]+/,
    /password\s*=/i,
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i, // email-as-PII in id surfaces
  ];
  for (const re of forbidden) {
    if (re.test(surfaces)) {
      throw new InferenceReceiptStoreError("privacy.secret_or_pii_in_surface", "omit secrets/PII from keys/logs/receipts");
    }
  }
}

/** Simulate a provider call (fixtures only) — policy replay must never use this. */
export function recordProviderCall(counter: ProviderCallCounter): void {
  counter.calls += 1;
}

/** Hash helper re-export for fixtures that need stable digests without importing crypto. */
export function stableDigest(value: unknown): string {
  return digestOf(value);
}

export function sha256OfText(text: string): string {
  return sha256Hex(text);
}
