# Greenfield #71 handoff / stop-lines closeout (U4-3)

Owner: **#71**. Status: tip AC→evidence map + core handoff matrix residual closeout.
Main pin at land: `ad8e2c9d4d7409b044d2d725106c1e9e64ff59e0` / `b2c-app-builder@0.221.26` → stamp **0.221.27**.
Typed module: `catalog/providers/greenfield-71-handoff-closeout-map.ts`.
Fixtures: `checks/verification/fixtures/greenfield-71-handoff-closeout.fixtures.ts`

- consume porchwatch-lifecycle + public-api lifecycle/init/recovery/research-decision/business-help.

This slice is **planning→execution handoff + authorized stop-lines residual closeout** only.
It does **not** run a live greenfield benchmark, publish-of-evidence, live host-agent rehearsal,
redo #66/#70, steal #395/#397/#402–#405/#403/#127, build a second planner, flip
`liveLaunchProven` from synthetic, or implement siblings #72/#73/#75/#76.

## Consumed tip surfaces (do not rebuild)

| Area                 | Path                                           | Note                                                      |
| -------------------- | ---------------------------------------------- | --------------------------------------------------------- |
| Lifecycle service    | `kernel/services/lifecycle.ts`                 | create / plan / initialize / run / recover / completion   |
| Lifecycle public-api | `lifecycle.test.ts`                            | create/init/run/recover/replay + catalog matrix #487–#494 |
| Initialization       | `initialization.test.ts`                       | forged stage / symlink / FIFO refuse                      |
| Recovery             | `recovery.test.ts`                             | settled-only close; no duplicate dispatch                 |
| Research decision    | `research-decision.test.ts`                    | apply-once; Pivot/Kill holds                              |
| Business help/guide  | `business-help.test.ts`                        | deliveryAccepted ≠ submission; liveLaunchProven false     |
| Porchwatch fixtures  | `porchwatch-lifecycle.fixtures.ts` (11 checks) | absent-dir; acceptance≠init; uncertain research           |
| Catalog refusal      | lifecycle catalog tests (#487–#494)            | corrupt/missing/mismatched; CLI/MCP parity                |
| #66 umbrella         | `greenfield-delivery-audit-*`                  | **consume only**                                          |
| #70 applicability    | `greenfield-70-applicability-closeout-*`       | **consume only**                                          |

## Verification / acceptance → evidence

| #71 acceptance row                                                             | Tip evidence                                        | Fixture / test                                                                                                          | Status                                   |
| ------------------------------------------------------------------------------ | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Creation-to-first-execution + listed resume boundaries recorded                | porchwatch + lifecycle + init + recovery (composed) | absent-directory; acceptance/init separate; uncertain research; create/init/run/recover/replay                          | **done**                                 |
| No duplicate registration / reducer edit / self-approval / silent substitution | lifecycle + initialization                          | create…preserve authority and registration boundaries; forged completed stage cannot clear intent; exact request replay | **done**                                 |
| Public next step actionable; authority/external holds ≠ builder failures       | lifecycle plan projection                           | distinct hold kinds, ready briefs, revision-bound founder question                                                      | **done**                                 |
| Docs / CLI/MCP / signed authority consistent                                   | business-help + catalog CLI/MCP parity              | delivery≠submission help/guide; #487–#494 envelopes                                                                     | **done**                                 |
| PR states fixture vs real-agent; not unattended publication                    | this doc + typed map + PR body                      | `greenfield-71-handoff-closeout`                                                                                        | **done** (real-agent: **not performed**) |

## Boundary-case table → evidence

| Boundary                                       | Tip path                   | Fixture name(s)                                                               | Status   |
| ---------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------- | -------- |
| Target exists / ID registered                  | lifecycle public-api       | create…preserve authority and registration boundaries                         | **done** |
| Research uncertain interrupt                   | porchwatch                 | uncertain research resumes from saved observations without fabricated runtime | **done** |
| Product updated after init preview             | initialization             | forged completed stage…cannot clear an initialization intent                  | **done** |
| Accepted without work authority                | porchwatch                 | product acceptance and initialize stay separate                               | **done** |
| Existing valid authority reuse                 | lifecycle run              | run uses existing authority…; exact request replay                            | **done** |
| Authority revoked/expired or candidate changed | lifecycle plan             | distinct hold kinds, ready briefs…                                            | **done** |
| Session ends with remaining work               | business-help + porchwatch | deliveryAccepted off store/live; deliveryAccepted false under planning        | **done** |
| Request replay after interrupt                 | recovery + lifecycle       | recovery closes only settled requests; exact request replay                   | **done** |
| One lane held, independent work ok             | lifecycle plan             | distinct hold kinds + ready briefs                                            | **done** |
| Worker self-approve/sign design                | initialization             | forged completed stage cannot clear intent (trust boundary)                   | **done** |

## Sept 12 catalog matrix → evidence

| Matrix row                  | Tip evidence                        | Status             |
| --------------------------- | ----------------------------------- | ------------------ |
| Corrupt initialized catalog | lifecycle corrupt refusal (#487)    | **done** (consume) |
| Missing initialized catalog | lifecycle missing refusal (#489)    | **done** (consume) |
| MCP corrupt+missing parity  | lifecycle MCP envelope (#490)       | **done** (consume) |
| Mismatched catalog pin      | lifecycle version-disagree (#491)   | **done** (consume) |
| CLI+MCP mismatched parity   | lifecycle CLI/MCP mismatched (#494) | **done** (consume) |

## Stop-line honesty

- `completion.deliveryAccepted` = selected closeout evidence currently accepted — **not** store submission or release.
- `liveLaunchProven: false` remains an explicit contract limit without provider-native proof + separately granted authority.
- Do not flip `liveLaunchProven` from synthetic/CI/fixture success.

## Handoff ≠ second planner

Handoff is the supported public lifecycle route:
`create → plan → research reconcile → accept → initialize → first authorized run → recover/resume`.
Pre-initialization emptiness (`not_initialized` + actionable resume) is a design boundary — not a defect to "fix" with a second planner, hidden daemon, unbounded re-dispatch, auto-repin, or silent catalog fallback.

## Coordinate (do not steal)

| Issue            | Role                                                |
| ---------------- | --------------------------------------------------- |
| #395 / #397      | Research Pivot/hold authoring + field diagnostics   |
| #402–#405 / #403 | Post-build owners + 11-star ladder/preview/delivery |
| #127             | Connection identity / wrong-surface                 |
| #72              | Live complete-business + publish-of-evidence        |
| #75              | Independent live-agent retrieval judgment           |
| #73              | Measured overhead consolidation (next deepen)       |
| #76              | Change-impact propagation                           |

HoE Q4: **core handoff matrix only** — do not expand #402–#405/#403 creative-refinement loop into #71.

## Hard holds (this slice)

- Live greenfield complete-business benchmark / publish-of-evidence / live host-agent rehearsal → **#72**
- Independent agent judgment → **#75**
- Sibling implementations → **#72 / #73 / #75 / #76** (separate deepens)
- Redo #66 umbrella / #70 applicability
- Steal #395/#397/#402–#405/#403/#127
- Second planner / hidden daemon / unbounded re-dispatch / auto-repin / silent catalog fallback
- Flip `liveLaunchProven` from synthetic
- U5 / #511, Formation, App Review, prices, credentials, paid-tool install, silent spend
- Real user registry / real signing keys / live app
- Claiming complete-business delivery from lifecycle fixtures alone

## U4 remaining sequence (after #71)

```
#73 → #75 → #76 → #72 last
```

- Skip **#74 CLOSED**
- **No U5 / #511** until HoE orders
- After #71 close: **STOP → #73 deepen separate**

## Evidence class (this PR)

| Class                                          | This slice        |
| ---------------------------------------------- | ----------------- |
| Deterministic public-api + porchwatch fixtures | **Yes**           |
| AC→evidence map + closeout fixtures            | **Yes**           |
| Live greenfield / publish-of-evidence          | **No** (→ #72)    |
| Independent live-agent judgment                | **No** (→ #75)    |
| Real-agent observation on this PR              | **Not performed** |

## Next

Parent Shepherd: merge PR when CI green → handoff comment → **close #71** →
**STOP — next deepen is #73 ONLY** (separate). Do not implement siblings here.
