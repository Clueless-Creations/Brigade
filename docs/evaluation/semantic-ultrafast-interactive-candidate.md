# Semantic ultrafast interactive candidate (cheap fold for #514)

**Issue:** #514 (SQ-03) · **Epic:** #511 · **Stamp:** 0.221.35  
**Evidence class:** paper / eval-plan + **non-live** indexed-element fixtures  
**Live browser / paid TypeSafe / iOS-sim:** **not performed** (default hold)

## Citations

- Upstream pattern: [browser-use/jev-ultrafast](https://github.com/browser-use/jev-ultrafast)
- Ops note (cite only; do not clone/run live by default):
  `/workspace/jev-ops/notes/12-jev-ultrafast-browser-use.md`

## Pattern (paper)

1. Structured page → **indexed element table** (not screenshots in the default loop).
2. **One** TypeSafe/Jev request per cycle: Choice-like operation + speculative
   target heads (`CLICK` / `TYPE_TEXT` / `SELECT` / …).
3. Small LLM **only** when the operation is `TYPE_TEXT` (writes text; does not decide).
4. **Code** executes validated DOM/indexed targets.
5. The model **never** emits selectors, coordinates, or JavaScript.

This matches the SQ north star: **Jev decides**, **LLM invents only when needed**,
**code owns effects**. Assessment provider stays swappable (#513/#515).

## How #512 / #515 feed the interactive step

Host-controlled assessment answers (Choice/Score/Noul shapes from
`contracts/semantic/`, encoded/decoded by `adapters/providers/typesafe` under
**fake transport**) select an operation + target **index** from the synthetic
element table. Fixtures in
`catalog/providers/semantic-eval-baselines-map.ts`
(`decideUltrafastFromAssessment`, `SEMANTIC_ULTRAFAST_FIXTURE_PAGE`) prove the
feed without browser, DOM, iOS-sim, or cloning jev-ultrafast.

## Honesty

| Claim                                        | Status                                           |
| -------------------------------------------- | ------------------------------------------------ |
| Fixture indexed-element decision works in CI | yes (deterministic)                              |
| Live browser ultrafast productize            | **no** — not performed                           |
| Live paid TypeSafe in PR CI                  | **no**                                           |
| iOS-sim ultrafast                            | **OOS** (separate agent; later provider surface) |
| Fixture success = live = browser proof       | **forbidden claim**                              |

## Live unlock path (off by default)

Only if HoE settles **and** CoS→Eduardo unlocks hosted key/budget:

1. Opt-in behavioral path using existing harness (`evals:behavioral` inventory).
2. Record evidence class separately from fixtures.
3. Never required to close #514.

Env **names** only (from #513 wiring recipe): `TYPESAFE_API_KEY` (and optional
`JEV_API_KEY`, `TYPESAFE_BASE_URL`, …). Confirm presence without printing values.
No credentials invented or committed.

## Out of #514 close path

- Cloning/running jev-ultrafast against real sites
- Live browser automation in default CI
- iOS-sim ultrafast
- Asking Jev for prose / code / summaries
- Formation / App Review / prices
