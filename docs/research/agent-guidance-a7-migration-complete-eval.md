# A7 migration-complete evaluation (#392)

**Date:** 2026-09-20 (America/Chicago)  
**Issue:** Clueless-Creations/Brigade#392  
**Unit:** A7 integrated instruction-context + autonomy evaluation (migration-complete gate)  
**Package tip under evaluation:** `a1d6c0a` / `0.221.55` (post-#388 A0–A6)  
**Pre-#388 baseline pin:** `8384cb3` / `0.221.54`  
**Frozen corpus:** `docs/research/agent-guidance-a0.json` (baseline source revision `8ab690f…`)  
**Harness:** existing `npm run check:agent-entrypoints` only — no new evaluator  

## Decision

**migration complete: HOLD (live criterion open)**

Deterministic / source portions of the A7 gate pass on the frozen ten-case corpus. Live Astra / model-tool matched traces were **not** authorized or available under #75 / TYPESAFE for this deepen; that observed-evidence criterion remains **explicitly open**. Fewer UTF-8 bytes alone are not treated as success. No publication or deployment is authorized by this evaluation.

## Reproduce

```sh
# Pre-#388 baseline pin
npm run check:agent-entrypoints -- \
  --guidance-baseline docs/research/agent-guidance-a0.json \
  --guidance-source-ref 8384cb3113d4469eba20788ed66bb8800c24b0b9 \
  --guidance-report /tmp/a7-baseline.json

# Candidate tip (post-#388)
npm run check:agent-entrypoints -- \
  --guidance-baseline docs/research/agent-guidance-a0.json \
  --guidance-source-ref a1d6c0a0c4e8069bb2031e77152f63dedc36e1bb \
  --guidance-report /tmp/a7-candidate.json
```

Committed reports:

- `docs/research/agent-guidance-a7-baseline-8384cb3.json`
- `docs/research/agent-guidance-a7-candidate-a1d6c0a.json`
- `docs/research/agent-guidance-a7-comparison-summary.json`

Both reports have `modelId`, `modelTokens`, `observedAgentTrace`, and `serviceResult` = `null`.

## Frozen cases (issue #392)

| ID | Route (expected) |
| --- | --- |
| A0-01 | focused read-only experience review |
| A0-02 | focused implementation plan (tiny change) |
| A0-03 | narrow app fix (follow app instructions; no launch program) |
| A0-04 | managed-business continuation |
| A0-05 | provider-backed task; provider unselected |
| A0-06 | provider selected but live access unavailable |
| A0-07 | protected external effect (deploy/publish/spend held) |
| A0-08 | maintainer core architecture |
| A0-09 | maintainer provider integration |
| A0-10 | contributor non-provider source adoption |

## Packet comparison (UTF-8 bytes; not tokens)

| Case | A0 frozen | baseline `8384cb3` | candidate `a1d6c0a` | vs A0 | vs baseline |
| --- | ---: | ---: | ---: | ---: | ---: |
| A0-01 | 22668 | 20266 | 19945 | −2723 | −321 |
| A0-02 | 24500 | 22098 | 21519 | −2981 | −579 |
| A0-03 | 13545 | 10694 | 10249 | −3296 | −445 |
| A0-04 | 26068 | 23259 | 22814 | −3254 | −445 |
| A0-05 | 22668 | 20266 | 19945 | −2723 | −321 |
| A0-06 | 19860 | 17051 | 16606 | −3254 | −445 |
| A0-07 | 26068 | 23259 | 22814 | −3254 | −445 |
| A0-08 | 125817 | 134693 | 134342 | +8525 | −351 |
| A0-09 | 63062 | 63471 | 63120 | +58 | −351 |
| A0-10 | 59223 | 56197 | 55644 | −3579 | −553 |

**Narrow / business cases (A0-01–07, A0-10):** materially smaller packets vs frozen A0 and vs pre-#388 tip.  
**A0-08:** larger than ancient A0 because architecture docs grew after the original freeze; still −351 vs the pre-#388 tip. Bytes alone are not the success metric.

Standing AGENTS.md: frozen A0 13,545 → baseline tip 10,694 → candidate 10,249 UTF-8.

## Qualitative gate findings (deterministic guidance)

| Criterion | Result | Notes |
| --- | --- | --- |
| Less irrelevant standing context on narrow cases | **PASS** | Early-exit / conditional setup / specialty-as-applicability / CONTRIBUTING-conditional contributor path from #388 |
| Required routing intact | **PASS** | Same declared routers/tasks per frozen case; `check:agent-entrypoints` 0 errors |
| Protected-effect stop intact | **PASS** | AGENTS “Completion authority and protected effects” still requires authority at effect boundary for deploy/publish/spend/secrets |
| Positive local-completion observable | **PASS** | Explicit reversible repository-local completion authority in AGENTS |
| Narrower verification defaults; required gates intact | **PASS** | Risk-proportional verification wording; CONTRIBUTING still owns exact commands/cadence; “do not skip/weaken CI” retained |
| No second router/planner/context store | **PASS** | Standing “extend existing owners” invariant retained |
| No invented live Astra proof | **PASS** | Reports null model/trace fields; live hold explicit |

## Regression-gate checklist (candidate fails if…)

| Fail condition | Result |
| --- | --- |
| Loses architecture/effect/provider/evidence invariant | **PASS** (standing + entrypoint contract) |
| Business work loads maintainer curriculum by default | **PASS** (early-exit + conditional loading) |
| Narrow task requires runtime setup | **PASS** (setup remains conditional) |
| Silently omits applicable specialty obligation | **PASS** (specialty-when-implicated retained) |
| Allows protected effects without authority | **PASS** |
| Treats mock as live evidence | **PASS** (null live fields; no fabricated traces) |
| Adds another router/planner/context store | **PASS** |
| Cuts founder/source intent to win bytes | **PASS** (intent-preservation standing rule retained) |

## Live Astra / #75

**Status: EXPLICITLY OPEN (observed-evidence hold)**

- #75 owns live model/tool outcome authority.
- This deepen found no TYPESAFE / #75 authorization or budget to run matched baseline/candidate Astra sessions.
- Claude Code host discovery remains explicitly open from #386 (orthogonal honesty; not silently counted as an #392 fail).
- No paid evaluation was run. No model-behavior improvement is claimed.

## Acceptance map

| AC | Result |
| --- | --- |
| 1. A0 baseline captured/reconstructed from pinned pre-change revision | **PASS** (`8384cb3` pin + committed report) |
| 2. Same frozen cases on candidate | **PASS** (ten A0 cases) |
| 3. Narrow cases materially less irrelevant standing context | **PASS** |
| 4. Required routing/guidance/effect stops intact | **PASS** |
| 5. Positive local-completion observable | **PASS** |
| 6. Verification defaults narrower without weakening required gates | **PASS** |
| 7. Explicit handoffs to #73/#75/#126/#378 | **PASS** (issue comments + this doc + PR) |
| 8. Independent review (architecture/safety) | **PASS** (`docs/research/agent-guidance-a7-independent-review.md`) |
| 9. Live Astra results **or** observed-evidence hold | **HOLD** (criterion explicitly open) |

## Owners / handoffs

- **#73** — before/after packet table above; keep measurement ownership; do not treat this as workflow-node consolidation evidence.
- **#75** — live Astra/matched traces remain owned here; criterion open until authorized.
- **#126** — root SKILL remains conditional; no second router from this gate.
- **#378** — progressive task-skill applicability pattern consumed; no task-surface rebuild in #392.

## Out of scope / bans observed

No npm publish (#26). No Product Profile steal. No new eval framework. No auto-advance to #129. No stamp bump (docs/evidence only; tip remains `0.221.55`).
