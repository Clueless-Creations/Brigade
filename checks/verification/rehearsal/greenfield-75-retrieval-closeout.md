# Greenfield #75 knowledge-retrieval Stage A no-change closeout (U4-5)

Owner: **#75**. Status: tip AC→evidence map + Stage A no-change closeout (Leave-open flipped).
Main pin at land: `375587fcafd7c69391a522b04ee105b30ec5abe2` / `b2c-app-builder@0.221.28` → stamp **0.221.29**.
Typed module: `catalog/providers/greenfield-75-retrieval-closeout-map.ts`.
Fixtures: `checks/verification/fixtures/greenfield-75-retrieval-closeout.fixtures.ts`

This slice is **evaluation-first retrieval Stage A no-change closeout** only.
It does **not** run paid Stage B live-worker evaluation, live greenfield
benchmark, publish-of-evidence, invent a measured #72 onboarding interval,
add a vector store / embeddings / graph DB / parallel memory/evaluator,
extract `matchWorkflows` into hosted `catalog()`, claim observed usability
from CI alone, tune against held-out paraphrases, redo #66/#70/#71/#73,
steal #378/#392/#395/#397/#403/#127/#39/#40, or implement siblings #72/#76.

## Consumed tip surfaces (do not rebuild)

| Area | Path | Note |
| --- | --- | --- |
| Stage A eight-class golden | `stage-a-cases.json` | Issue 75; 8 reviewed cases; held-out frozen; `actualModelUsage: unknown` |
| Eval baselines protocol | `eval-baselines.md` | **#75 closed on Stage A no-change**; Stage B held; live → #72 |
| Eval baselines fixtures | `eval-baselines.fixtures.ts` | Stage A walks + no-change infra asserts + Leave-open flip |
| Hosted discovery / design-foundation | existing fixture suites | Consume patterns |
| Knowledge service / node brief | `service.ts` / `node-brief.ts` | BM25 + worker contract — **preserve** |
| Store utterance corpus | `store-utterances.json` | Schema owned earlier — read only |
| #66 umbrella | `greenfield-delivery-audit-*` | **consume only** |
| #70 applicability | `greenfield-70-applicability-closeout-*` | **consume only** |
| #71 handoff/stop-lines | `greenfield-71-handoff-closeout-*` | judgment → #75 — **consume only** |
| #73 overhead Stage A retain | `greenfield-73-overhead-closeout-*` | next was #75 — **consume only** |

## Acceptance / report → evidence

| #75 acceptance row | Tip evidence | Fixture / test | Status |
| --- | --- | --- | --- |
| Baseline, corpus split, units recorded | `stage-a-cases.json` | eval-baselines Stage A per-case | **done** |
| Cases through actual service/brief paths | eval-baselines Stage A walks | eval-baselines Stage A per-case | **done** |
| Continuation / revision / hosted-local correct | tight-bundle / stale-hash / hosted-only | eval-baselines Stage A | **done** |
| Separately authorized live subset | Stage B / #72 | this closeout map | **held** → Stage B / #72 |
| Optimization benefit or rejected with reasons | **no-change recommendation** | eval-baselines no-change | **done** |
| Scorer/wording ownership; no duplicate harness | #39/#40; no matchWorkflows in catalog | eval-baselines no-change | **done** |

## Stage A obligations → evidence

| Stage A row | Tip path | Status |
| --- | --- | --- |
| Eight required case classes through real paths | `stage-a-cases.json` + eval-baselines | **done** |
| Held-out unused for tuning; case-level reports | `store-001` / `store-002` reserved | **done** |
| Prefer binding/selector/spec fix; no-change OK | eval-baselines **Recommendation: no-change** | **done** |
| No vector / embeddings / graph; no matchWorkflows in catalog | eval-baselines + package.json | **done** |
| Protocol Leave-open → closed on Stage A no-change | `eval-baselines.md` + fixture assert | **done** |

## Stage B / live (held)

| Hold | Owner | Note |
| --- | --- | --- |
| Paid Stage B live-worker evaluation | **held** (default) | `evals:behavioral -- --list` only |
| Live greenfield complete-business + publish-of-evidence | **#72** | Default no in #75 |
| Measured onboarding interval | **#72** | Do not invent elapsed/token/live metrics |
| Observed usability from CI alone | **not claimed** | Stage A no-change ≠ live gain |

## Closeout honesty (Leave-open flip)

- Prior protocol said **Leave #75 open** for the paid Stage B hold.
- Issue Outcome explicitly allows an evidence-backed **no-change recommendation** as a valid closeout.
- Stage A already recommends **no-change** on retrieval infrastructure with BM25 preserved and no vector/embeddings/graph.
- This closeout flips protocol/fixtures to **#75 closed on Stage A no-change**; paid Stage B
  **held**; live / publish / measured interval **→ #72**.
- Do not invent tool traces. Do not claim usability improvement from green CI alone.
- Fixture walks ≠ observed model/tool behavior. Independent judgment → **#75**; live → **#72**.

## Coordinate (do not steal)

| Issue | Role |
| --- | --- |
| #378 / #392 | Task-skill / Astra evaluation addenda (coordinate wording only) |
| #395 / #397 | Research Pivot/hold authoring + field diagnostics |
| #403 | 11-star ladder / quality-principle / visual judgment |
| #127 | Connection identity / wrong-surface |
| #39 / #40 | Scorer adoption / response-delivery coverage wording (CLOSED — do not reimplement) |
| #72 | Live complete-business + publish-of-evidence + measured interval baseline |
| #76 | Change-impact propagation (next deepen) |

## Hard holds (this slice)

- Live greenfield / publish-of-evidence / measured onboarding interval → **#72**
- Paid Stage B worker eval / invent tool traces / claim usability from CI alone
- Vector store / embeddings / graph DB / parallel memory/evaluator
- Extract `matchWorkflows` into hosted `catalog()`
- Sibling implementations → **#72 / #76** (separate deepens)
- Redo #66 umbrella / #70 applicability / #71 handoff / #73 overhead
- Steal #378/#392/#395/#397/#403/#127/#39/#40
- Expanded #378/#392/#403 addenda corpora inside this closeout
- Tune against held-out paraphrases
- U5 / #511, Formation, App Review, prices, credentials, paid-tool install, silent spend
- Real user registry / real signing keys / live app

## U4 remaining sequence (after #75)

```
#76 → #72 last
```

- Skip **#74 CLOSED**
- **No U5 / #511** until HoE orders
- After #75 close: **STOP → #76 deepen separate**

## Evidence class (this PR)

| Class | This slice |
| --- | --- |
| Deterministic Stage A / eval-baselines / hosted-discovery | **Yes** |
| AC→evidence map + closeout fixtures | **Yes** |
| Protocol Leave-open → closed on Stage A no-change | **Yes** |
| Paid Stage B / live worker host traces | **No** (held) |
| Live greenfield / publish-of-evidence / measured interval | **No** (→ #72) |
| Vector / embeddings / graph / matchWorkflows-in-catalog | **No** (hard hold) |
| Expanded addenda corpora | **No** (coordinate only) |

## Next

Parent Shepherd: merge PR when CI green → handoff comment → **close #75** →
**STOP — next deepen is #76 ONLY** (separate). Do not implement siblings here.
Do not run paid Stage B. Do not jump to #72. Do not start U5/#511.
