# #395 Pivot/hold + post-audit continuation — closeout map

**Program:** U6 Skills/Astra · R1 #9  
**Issue:** #395  
**Baseline tip:** `b85f26f` / `0.221.59`  
**Closeout stamp:** `0.221.60`  
**Next after close:** **#213** only on HoE order  

## Ownership (binding)

| Owner | Scope |
| --- | --- |
| **#395 (this)** | Lifecycle states + decision effects — Pivot/hold, unrun≠waiver, founder continuation, one guarded recoverable multi-file authoring path |
| **#397** | Field/parse diagnostics + contract explain — **consume; do not redo** |
| **#74** | Proof-strength semantics — **retain; do not rewrite** |
| **#71 / #66** | Primary lifecycle / program parents — handoff |
| **#126** | Business-context routing — retain |
| **#75 / #73** | Receive synthetic scenario + measurement points; do not claim real-agent proof or overhead completion here |

## Consumed increments

Prior merged #395 slices (ADR-0014 / PR #400, guarded authoring #406, finding binding #407, Pivot lifecycle #427, stale #453, ambiguous #459, not_run negative #468, recovery #476/#483/#492, Kill #488) plus prior #71 increments #145/#173/#180 are **consumed**, not rebuilt.

## Means landed (this closeout)

1. **R0** ADR-0014 updated with before/after authority table and explicit **no additive `not_run`** settlement (unknown ≠ confirmed not-run; old `run`/`waived` preserved).
2. **R1** Read-only `researchCheckpoint` on planning resume (verdict / recordedVia / initializationEligible:false) with precise Pivot/Kill/Go next-action sentences — distinct from #74 proof projection.
3. **R2** Existing `business.research.decision` retained as the single guarded authoring path; residual public scenarios cover precise next action, protected obligations, local preview without broaden, symlink refuse, concurrent lock.
4. **R3** Conditional `b2c research-decision` guidance in artifact-contracts; closeout map/fixtures/rehearsal/independent review; stamp `0.221.60`.

## Hard holds observed

- Not a second planner / approval DB / decision database / new skill
- Unrun ≠ waived; Pivot hold ≠ malformed; checkpoint validity ≠ init eligibility
- Do **not** redo #397 diagnostics
- Do **not** steal #74 proof semantics
- No fabricating review receipts; no init as side effect; no provider calls
- Box npm **HOLD** — **#26 owns publish; no npm**
- Profile #564+ Codex — **do not steal**
- No App Review / prices / Formation / #987 / paid eval / real-business risk / deploy/publish/submit/release
- Fixture success ≠ live business proof
- One PR only; do **not** merge from executor; do **not** start #213

## Handoffs

| Target | What they receive |
| --- | --- |
| **#71** | Implementation of research-decision lifecycle continuation under greenfield parent |
| **#74** | Proof projection left intact; checkpoint projection explicitly separate |
| **#73** | Synthetic scenario IDs in closeout map (measurement points only) |
| **#75** | Same synthetic corpus points — not claimed as observed agent efficiency |
| **#397** | Diagnostics consumed; vocab coordinated via ADR checkpoint language |

## Honesty residuals

- Founder-transcript interrupted-edit counts are not newly reproduced — synthetic fixtures only.
- Fixture/source closure ≠ demonstrated real-agent efficiency (#75) or overhead (#73).
- Structural validity ≠ claim certification (#74).
- Planning `researchCheckpoint` is read-only guidance; it never initializes.

## STOP

After Shepherd merges and closes #395: **STOP** → next **#213** only on HoE order.
