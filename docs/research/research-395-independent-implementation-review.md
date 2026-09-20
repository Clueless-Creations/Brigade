# Independent implementation review — #395 Pivot/hold + post-audit continuation

**Date:** 2026-09-20 (America/Chicago)  
**Issue:** #395  
**Baseline tip reviewed against:** `b85f26f` / `0.221.59`  
**Closeout stamp under test:** `0.221.60`  
**Reviewer role:** conformance / ownership / AC mapping (executor-recorded; CI + Shepherd merge remain authoritative)

## Scope reviewed

- ADR-0014 R0 compatibility + `not_run` settlement
- `kernel/services/research-decision.ts` guarded authoring (consumed increments + residual scenarios)
- `kernel/session/research-checkpoint-projection.ts` lifecycle projection (#395)
- `kernel/session/research-proof-projection.ts` proof projection (#74 — unchanged ownership)
- Planning resume schema `researchCheckpoint`
- Public-api `research-decision` suite scenarios
- Closeout map / fixtures / rehearsal
- Conditional artifact-contracts guidance for `b2c research-decision`

## Findings

1. **Ownership split holds.** Checkpoint lifecycle facts live under #395; offer demand / proof sentences remain under #74; #397 diagnostics were not rewritten.
2. **No second authority owner.** Authoring remains `business.research.decision` with `initializationEligible: false` and `authorityGranted: false`.
3. **`not_run` not added.** ADR and offer contract keep `run`/`waived`; other statuses stay incomplete.
4. **Init gate intact.** Pivot/Kill planning resume still `not_initialized`; initialize refuses until Go continuation + accepted product (existing E2E).
5. **Recovery matrix present.** Journal / product / rendered interruption, third-party preserve, stale revision, replay idempotence, concurrent lock, symlink refuse covered in public suite.
6. **Honesty.** Synthetic fixtures only; no claim of live business proof or observed agent efficiency.

## Residual risks (accepted / deferred)

- Live host-agent Pivot continuation efficiency → **#75**
- Overhead measurement of research-decision path → **#73**
- npm publish → **#26**
- Product Profile → **#564+** (Codex)
- Next U6 unit → **#213** on HoE order only

## Verdict

**Accept for Shepherd merge when CI green**, contingent on stamp/render discipline and focused + required gates green on the exact PR head. Do not merge from this document alone.
