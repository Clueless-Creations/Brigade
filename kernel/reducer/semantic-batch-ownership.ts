/**
 * #518 SQ-07 — Ownership/settlement coordination notes for semantic batches.
 *
 * Extends reducer ownership/lock semantics for semantic batch settlement.
 * Does NOT invent a second ownership generation — callers must reuse the
 * generation from shared-claims / lock (or the paper in-memory handle that
 * mirrors those fields). Coordinate with #73; do not replace dispatch-boundary ownership.
 *
 * Assessment-only speculation; no tool/product side effects here.
 */
import type { OwnershipHandle } from "../session/semantic-batch.js";

export const SEMANTIC_BATCH_OWNERSHIP_ISSUE = "#518" as const;
export const SEMANTIC_BATCH_OWNERSHIP_COORDINATES = "#73" as const;
export const SEMANTIC_BATCH_OWNERSHIP_NO_SECOND_GENERATION = true as const;

/**
 * Assert a paper ownership handle carries the same identity fields as a
 * shared-claim generation (generation, workspace, occurrence, resource).
 * Used by fixtures — does not open fs-backed claims.
 */
export function assertOwnershipGenerationShape(handle: OwnershipHandle): void {
  if (!handle.generation.trim()) throw new Error("ownership.generation_required");
  if (!handle.workspaceId.trim()) throw new Error("ownership.workspace_required");
  if (!handle.occurrenceId.trim()) throw new Error("ownership.occurrence_required");
  if (!handle.resource.trim()) throw new Error("ownership.resource_required");
}

/**
 * True when ownership may be released: handle inactive or cancelled with no
 * remaining active claim. Fixtures use this with MapReduceSummary.ownershipReleased.
 */
export function mayReleaseOwnership(handle: OwnershipHandle, siblingsActive: boolean): boolean {
  if (siblingsActive) return false;
  return !handle.active || handle.cancelled;
}
