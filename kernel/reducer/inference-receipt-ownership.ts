/**
 * #520 SQ-10 — Receipt + erasure ownership transitions for inference receipts.
 *
 * Extends kernel/reducer/ existing receipt and erasure transitions.
 * Coordinates with kernel/reducer/erasure.ts + erasure-guard.ts — does NOT fork
 * a parallel erasure engine. Coordinates #74 / #76 — no parallel invalidation.
 *
 * Persist-before-publish is enforced via InferenceReceiptStore; this module
 * records ownership-handle shape and erasure cascade coordination.
 *
 * Consumes #512–#519. NO_521_IMPL cleared by #521. NO_522_IMPL cleared by #522. NO_523_IMPL cleared by #523. Does not implement #511 closeout or #573 (#524–#529 landed).
 */
import type { OwnershipPersistHandle } from "../services/inference-receipt-store.js";
import { SQ10_IMPLEMENTED_HOOK_IDS, INFERENCE_INVALIDATION_COORDINATES, INFERENCE_INVALIDATION_NO_PARALLEL_ENGINE } from "../engine/inference-invalidation.js";

export const INFERENCE_RECEIPT_OWNERSHIP_ISSUE = "#520" as const;
export const INFERENCE_RECEIPT_OWNERSHIP_EPIC = "#511" as const;
export const INFERENCE_RECEIPT_OWNERSHIP_COORDINATES = ["#74", "#76"] as const;
export const INFERENCE_RECEIPT_OWNERSHIP_STAMP = "0.221.40" as const;
export const INFERENCE_RECEIPT_OWNERSHIP_NO_PARALLEL_ERASURE_ENGINE = true as const;
export const INFERENCE_RECEIPT_OWNERSHIP_NO_PARALLEL_INVALIDATION = INFERENCE_INVALIDATION_NO_PARALLEL_ENGINE;
export const INFERENCE_RECEIPT_OWNERSHIP_EXTENDS_ERASURE = true as const;
export const INFERENCE_RECEIPT_OWNERSHIP_NO_521_IMPL = false as const;
export const INFERENCE_RECEIPT_OWNERSHIP_NO_522_IMPL = false as const;
export const INFERENCE_RECEIPT_OWNERSHIP_NO_523_IMPL = false as const;

/** Assert paper ownership handle carries identity fields (generation/workspace/occurrence/resource). */
export function assertReceiptOwnershipShape(handle: OwnershipPersistHandle): void {
  if (!handle.generation.trim()) throw new Error("receipt_ownership.generation_required");
  if (!handle.workspaceId.trim()) throw new Error("receipt_ownership.workspace_required");
  if (!handle.occurrenceId.trim()) throw new Error("receipt_ownership.occurrence_required");
  if (!handle.resource.trim()) throw new Error("receipt_ownership.resource_required");
}

export function createReceiptOwnershipHandle(input: {
  readonly generation: string;
  readonly workspaceId: string;
  readonly occurrenceId: string;
  readonly resource?: string;
}): OwnershipPersistHandle {
  const handle: OwnershipPersistHandle = {
    generation: input.generation,
    workspaceId: input.workspaceId,
    occurrenceId: input.occurrenceId,
    resource: input.resource ?? "semantic.inference-receipt",
    active: true,
  };
  assertReceiptOwnershipShape(handle);
  return handle;
}

export function releaseReceiptOwnership(handle: OwnershipPersistHandle): OwnershipPersistHandle {
  return { ...handle, active: false };
}

/**
 * Non-identifying erasure metadata retained after receipt erasure cascade.
 * Coordinates with EvidenceErasureTombstone style — digests only, never payloads.
 */
export interface InferenceReceiptErasureTombstone {
  readonly erasureId: string;
  readonly receiptDigest: string;
  readonly erasedAt: string;
  readonly workspaceBindingDigest: string;
  readonly coveredDerivedCount: number;
  readonly providerDeletion: "pending" | "not_required";
}

export function buildInferenceReceiptErasureTombstone(input: {
  readonly erasureId: string;
  readonly receiptDigest: string;
  readonly erasedAt: string;
  readonly workspaceBindingDigest: string;
  readonly coveredDerivedCount: number;
  readonly providerDeletion?: "pending" | "not_required";
}): InferenceReceiptErasureTombstone {
  return {
    erasureId: input.erasureId,
    receiptDigest: input.receiptDigest,
    erasedAt: input.erasedAt,
    workspaceBindingDigest: input.workspaceBindingDigest,
    coveredDerivedCount: input.coveredDerivedCount,
    providerDeletion: input.providerDeletion ?? "not_required",
  };
}

/** Confirm the four #519 hooks are implemented (no longer declaredOnly). */
export function listImplementedInvalidationHookIds(): readonly string[] {
  return SQ10_IMPLEMENTED_HOOK_IDS;
}

export function assertHooksImplemented(): void {
  const expected = [
    "hook.invalidate-edges-on-source-revision",
    "hook.invalidate-edges-on-receipt-erasure",
    "hook.reject-stale-edge-at-commit",
    "hook.rebuild-index-after-invalidation",
  ];
  const got = [...listImplementedInvalidationHookIds()].sort();
  const want = [...expected].sort();
  if (got.length !== want.length || got.some((id, i) => id !== want[i])) {
    throw new Error(`receipt_ownership.hooks_incomplete: got ${got.join(",")} want ${want.join(",")}`);
  }
  if (INFERENCE_RECEIPT_OWNERSHIP_COORDINATES.join(",") !== INFERENCE_INVALIDATION_COORDINATES.join(",")) {
    throw new Error("receipt_ownership.coordinate_mismatch");
  }
}
