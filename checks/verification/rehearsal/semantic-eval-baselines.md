# Semantic-execution baselines + held-out decision-quality (#514 / SQ-03)

Owner: **#514** (SQ-03). Epic: **#511**. Stamp target: **0.221.35**.
Typed map: `catalog/providers/semantic-eval-baselines-map.ts`.
Fixtures: `checks/verification/fixtures/semantic-eval-baselines.fixtures.ts`.
Golden: `checks/verification/goldens/eval/semantic-held-out-cases.json`.
Ultrafast fold: `docs/evaluation/semantic-ultrafast-interactive-candidate.md`.

Paper / deterministic only. **Live provider, live browser, and iOS-sim were not
performed.** Hosted TypeSafe key remains **CoS→Eduardo**. Consumes #512 contracts,
#513 qualify, #515 adapter — does **not** redo them. Reuses #73 cost accounting and
#75 delivery metrics — does **not** replace retrieval scope or invent a second
evaluation harness / cost store.

## Consumed tip surfaces (do not rebuild)

| Area                     | Path                                                                  | Note                                     |
| ------------------------ | --------------------------------------------------------------------- | ---------------------------------------- |
| SQ-01 contracts          | `contracts/semantic/`                                                 | #512 / PR #550                           |
| SQ-01 fixtures           | `semantic-contracts.fixtures.ts`                                      | consume                                  |
| SQ-02 qualify            | `docs/upstreams/typesafe-qualification.md`, `typesafe-qualify-map.ts` | #513 / PR #551                           |
| SQ-04 adapter            | `adapters/providers/typesafe/*`                                       | #515 / PR #552; fake-transport only here |
| Eval baselines protocol  | `eval-baselines.md`                                                   | #73/#75 pins preserved                   |
| Stage A retrieval golden | `stage-a-cases.json`                                                  | #75 — do not replace                     |
| Ultrafast cite           | https://github.com/browser-use/jev-ultrafast + jev-ops note 12        | pattern only                             |

## Three comparison arms (equivalent evidence)

| Arm                           | Id                              | Discipline                                                                                       |
| ----------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------ |
| Deterministic route/retrieval | `deterministic-route-retrieval` | BM25/route reuse (#75); rule match; tool trace present                                           |
| Agent-driven workflow         | `agent-driven-workflow`         | Same evidence; missing tool trace **disclosed**; same-model judging **disclosed**                |
| Semantic candidate            | `semantic-candidate`            | Host-controlled Choice/Score/Noul-shaped answers via #512/#515 surfaces; fake transport; no live |

## Held-out reservation + predeclared thresholds

Thresholds frozen at `2026-09-19T15:00:00-05:00` **before** held-out scoring
(`SEMANTIC_EVAL_ADMISSION_THRESHOLDS.frozenBeforeHeldOutRun = true`). Held-out
paraphrases/contexts are unused for question-pack or retrieval tuning. Source and
question versions are stored on every case. Product/time splits for later outcome
learning are **documented as reserved**, not invented as live datasets.

Case classes: paraphrase-same-failure; similar-wording-different-failure;
no-applicable-candidate; insufficient-evidence; contradictory-evidence; stale-source;
hostile-instruction.

## Decision-quality metrics (separated)

candidate-generation recall · assessment quality · graph-path relevance · guidance
delivered · downstream proposal correctness · dependent inference rounds ·
batch/map counts · fixture p50/p95 latency · **live provider latency separate
(not performed)** · actual vs estimated cost (#73: unknown ≠ zero) · cache
contribution · useful abstention · reviewer correction effort. Per-case traces and
omissions are required — aggregate-only scores are insufficient.

## Honesty gates

| Gate                                   | Evidence                                                                                     |
| -------------------------------------- | -------------------------------------------------------------------------------------------- |
| Wrong high-confidence fails downstream | `wrongHighConfidenceFailsDownstream()`                                                       |
| Cannot pass by dropping hard/unknown   | hard classes required; `cheaterDroppingHardCasesWouldInflate()`                              |
| Equivalent evidence + disclose judging | all arms share case evidence; agent arm discloses missing tool trace / same-model judging    |
| Report limits                          | model/version uncertainty named; sample = small-pilot; **no** rare-failure reliability claim |
| No-change / reject TypeSafe OK         | default disposition `no-change` while live benefit unproven                                  |

## Metamorphic suite

| Test                    | Expectation                                   |
| ----------------------- | --------------------------------------------- |
| Irrelevant rename/order | classification stable                         |
| Explicit contradiction  | classification changes to retain-conflict     |
| Duplicated evidence     | does **not** become independent corroboration |

## Cheap ultrafast fold (Option A)

Paper/eval plan + **non-live** indexed-element fixtures. Pattern: structured page →
indexed element table; one Jev request/cycle; LLM only TYPE_TEXT; code executes
validated targets; model never emits selectors/coords/JS. Fixture ≠ live ≠ browser.
Live unlock = CoS→Eduardo residual only. iOS-sim **OOS**.

## Acceptance → evidence

| #514 Acceptance                                                                    | Tip evidence                                        | Status             |
| ---------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------ |
| Wrong high-confidence fails downstream correctness                                 | map + fixtures `wrongHighConfidenceFailsDownstream` | **done** (fixture) |
| Cannot pass by dropping no-match/unknown / never surfacing hard examples           | required classes + cheater inflation gate           | **done** (fixture) |
| Equivalent evidence; disclose missing tool trace / same-model judging              | three-arm runs + agent disclosures                  | **done** (fixture) |
| Report names model/version uncertainty, sample size, limits; no rare-failure claim | `buildDecisionQualityReport`                        | **done** (fixture) |
| No-change / reject TypeSafe acceptable when benefit unproven                       | report disposition `no-change`                      | **done** (fixture) |

## Explicit non-claims

- Fixture success ≠ live provider verification ≠ interactive browser proof.
- Small pilot establishes **no** rare-failure reliability.
- Live TypeSafe / browser ultrafast / iOS-sim **not performed**.
- No credentials invented; no Formation / App Review / prices.
- After #514 close: **STOP** — next = HoE-ordered next #511 child.
