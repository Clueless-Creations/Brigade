# 0022 — Preserve app instructions when refreshing startup guidance

- **Status:** accepted
- **Date:** 2026-10-10
- **Steward:** repository maintainer
- **Affected rules and contracts:** ARCH-07, ARCH-09, ARCH-11; ADR-0008, ADR-0012; public status and plan warnings
- **Affected units:** U25; workspace creation and entrypoint installation

## Context and evidence

Workspace host adapters repeated legacy session commands instead of selecting the
canonical business startup path. The continuity validator also required that
wording. Its corrected owner is
`checks/validation/business/orchestration/check-continuity-contract.ts:190`.

Whole-file installation preserved modified guides only in a backup. That retained
bytes but displaced app instructions from the active guide. Registration alone
does not install guidance. Status and plan therefore need a passive diagnostic,
and an existing workspace needs a bounded repair before runtime initialization.
The shared repair owner is `adapters/workspace-entrypoints.ts:172`; status and
plan project its diagnostics through `kernel/services/workspace-entrypoint-warnings.ts:4`.

## Alternatives

1. Replace entire guides and keep backups. This leaves app instructions inactive.
2. Repair during status or plan. This violates passive-read behavior and hides writes.
3. Add startup instructions to every host adapter. This preserves competing policy copies.
4. Mark the Brigade-owned block and expose an explicit local refresh. This preserves
   app text and reuses canonical templates without adding a business-state owner.

## Decision

Add this rule under ARCH-09: “Workspace status and plan may report startup-guidance
drift without writes or new eligibility holds. Explicit local refresh preserves
app instructions outside Brigade-owned blocks and leaves runtime pins and business state unchanged.”

Creation and runtime installation use the same block-aware writer. The canonical
workspace `AGENTS.md` owns startup semantics; host adapters point to its `Start`
section. A standalone local CLI command previews by default and applies only
when requested. It is not a new versioned business operation or an MCP mutation.

## Compatibility and migration

Existing public schemas, state, authority, and package pins retain their meaning.
Diagnostics use the existing additive `warnings` array. Registration still only
records identity. Planning workspaces can refresh without initialization.

Known intact legacy templates migrate to marked blocks, preserving surrounding
app text. Unrelated guide text remains active. Modified managed content, ambiguous
legacy content, unsafe paths, and conflicting Cursor scope refuse before writes.
Do not infer ownership of arbitrary instructions from a familiar filename.

## Consequences

U25 carries the startup diagnostic through both public status and plan. The
existing installer and creation path share the refresh implementation. Test
missing guides, legacy migration, retained app instructions, refusal without
writes, repeat application, and uninitialized workspaces through supported paths.
Each file write is atomic; an interrupted multi-file refresh requires a new preview.
Apply preserves stale session locks unless the caller verifies that the previous
owner is inactive and supplies `--apply --break-stale-verified`. The existing lock
owner rereads the heartbeat and refuses a fresh or changed heartbeat. This reuses
the current recovery contract; it adds no automatic stale-lock break or approval workflow.

Static checks establish template consistency, not agent compliance. Fresh and
resumed host sessions need separate routing evidence. No access, spending,
provider, publication, deployment, or store authority comes from this record.
