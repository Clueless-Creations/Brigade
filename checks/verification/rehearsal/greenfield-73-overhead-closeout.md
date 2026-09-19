# Greenfield #73 workflow-overhead Stage A retain closeout (U4-4)

Owner: **#73**. Status: tip AC→evidence map + Stage A retain closeout (Leave-open flipped).
Main pin at land: `e1bbc824980030389bdd9501cf07eb6cb9d819e2` / `b2c-app-builder@0.221.27` → stamp **0.221.28**.
Typed module: `catalog/providers/greenfield-73-overhead-closeout-map.ts`.
Fixtures: `checks/verification/fixtures/greenfield-73-overhead-closeout.fixtures.ts`

This slice is **measure-first workflow-overhead Stage A retain closeout** only.
It does **not** run a live greenfield benchmark, publish-of-evidence, invent a
measured #72 onboarding interval, Stage B consolidate / add a
`work-package-equivalence` suite, claim fake savings from workflow-count alone,
redo #66/#70/#71, steal #75/#403/#395/#397/#127, invent telemetry/scheduler/graph DB,
or implement siblings #72/#75/#76.

## Consumed tip surfaces (do not rebuild)

| Area | Path | Note |
| --- | --- | --- |
| Stage A boundary table | `workflow-overhead-boundaries.md` | Selected set; all **keep**; cost **unknown**; **Retain the current graph** |
| Eval baselines protocol | `eval-baselines.md` | Shared accounting; **#73 closed on Stage A retain**; Stage B held → #72 |
| Greenfield benchmark | `greenfield-benchmark.md` | `#73 Stage A` retain until #72 interval |
| Eval baselines fixtures | `eval-baselines.fixtures.ts` | KEEP / unknown cost / no work-package suite / closed-on-retain |
| #66 overhead pillar | `greenfield-delivery-audit-*` | Measurable; refuse fake savings; Stage A retain — **consume only** |
| #70 applicability | `greenfield-70-applicability-closeout-*` | **consume only** |
| #71 handoff/stop-lines | `greenfield-71-handoff-closeout-*` | **consume only** |
| ONB-16 catalog honesty | `catalog/workflows/product-experience.ts` | reads/deps match authored comment (#231) |

## Acceptance / decision report → evidence

| #73 acceptance row | Tip evidence | Fixture / test | Status |
| --- | --- | --- | --- |
| Baseline metrics + coverage limits recorded | `workflow-overhead-boundaries.md` (cost **unknown**) | eval-baselines #73 keep/unknown | **done** |
| Each retained boundary has concrete reason (not count quota) | Stage A table rows | eval-baselines #73 keep/unknown | **done** |
| Preservation map complete; independent review separate | Stage B N/A under retain | this closeout map | **held** → #72 |
| Equivalent-scope quality/overhead/failure/variability | After measured interval | this closeout map | **held** → #72 |
| Accepted changes preserve authority/pins/contracts | No production merge under retain | eval-baselines no work-package suite | **done** |
| No-change documented when candidate not better | **Retain the current graph** (#151 + Stage A) | eval-baselines #73 keep/unknown | **done** |

## Stage A obligations → evidence

| Stage A row | Tip path | Status |
| --- | --- | --- |
| Selected subgraph named; existing IDs only | `workflow-overhead-boundaries.md` | **done** |
| Observable metrics only; uncertainty marked | Observed cost **unknown** | **done** |
| Compact boundary table + keep/change | **Retain the current graph**; all **keep** | **done** |
| Boundary decision rule respected | Distinct authority/effects kept | **done** |
| #38 Apple media independent-effect | Keep; not onboarding merge candidate | **done** |
| Protocol Leave-open → closed on Stage A retain | `eval-baselines.md` + fixture assert | **done** |

## Stage B / measured interval (held)

| Hold | Owner | Note |
| --- | --- | --- |
| Measured onboarding interval | **#72** | Do not invent elapsed/token/live metrics |
| Live greenfield complete-business + publish-of-evidence | **#72** | Default no in #73 |
| `work-package-equivalence` suite / recipe merge / silent repin | after #72 interval | Suite **absent** on tip |
| Equivalent-scope merge comparison | after #72 interval | Retain stands until then |

## Closeout honesty (Leave-open flip)

- Prior protocol said **Leave #73 open** for a measured interval.
- Issue body allows an evidence-backed **retain / no-change** as a valid closeout.
- Stage A already recommends **Retain the current graph** with unknown cost and all **keep**.
- This closeout flips protocol/fixtures to **#73 closed on Stage A retain**; Stage B /
  measured interval **held → #72**.
- Do not invent metrics. Do not claim overhead savings from workflow-count alone.
- Fixture timings ≠ model execution cost.

## Coordinate (do not steal)

| Issue | Role |
| --- | --- |
| #75 | Retrieval / outcome corpus / independent live-agent judgment (next deepen) |
| #403 | 11-star ladder / quality-principle (coordinate wording only) |
| #395 / #397 | Research Pivot/hold authoring + field diagnostics |
| #127 | Connection identity / wrong-surface |
| #72 | Live complete-business + publish-of-evidence + measured interval baseline |
| #76 | Change-impact propagation |

## Hard holds (this slice)

- Live greenfield / publish-of-evidence / measured onboarding interval → **#72**
- Stage B consolidation / work-package-equivalence / recipe merge / silent repin
- Fake overhead savings from workflow-count alone; invent elapsed/token/live metrics
- Sibling implementations → **#72 / #75 / #76** (separate deepens)
- Redo #66 umbrella / #70 applicability / #71 handoff
- Steal #75/#403/#395/#397/#127
- New telemetry / special scheduler / graph DB / mass renumber / reduced-scope mode
- U5 / #511, Formation, App Review, prices, credentials, paid-tool install, silent spend
- Real user registry / real signing keys / live app
- Merging #38 Apple media for count reduction

## U4 remaining sequence (after #73)

```
#75 → #76 → #72 last
```

- Skip **#74 CLOSED**
- **No U5 / #511** until HoE orders
- After #73 close: **STOP → #75 deepen separate**

## Evidence class (this PR)

| Class | This slice |
| --- | --- |
| Deterministic Stage A table / eval-baselines / #66 overhead fixtures | **Yes** |
| AC→evidence map + closeout fixtures | **Yes** |
| Protocol Leave-open → closed on Stage A retain | **Yes** |
| Live greenfield / publish-of-evidence / measured interval | **No** (→ #72) |
| Stage B consolidation / work-package suite | **No** (held) |
| Independent live-agent judgment | **No** (→ #75) |

## Next

Parent Shepherd: merge PR when CI green → handoff comment → **close #73** →
**STOP — next deepen is #75 ONLY** (separate). Do not implement siblings here.
Do not Stage B consolidate without a measured #72 interval.
