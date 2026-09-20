# #129 Builder house style — fresh-context review and evidence limits

**Date:** 2026-09-20 (America/Chicago)  
**Tip under review:** `fbbb23f` / `0.221.55` plus this #129 revision  
**Issue:** #129  
**Vocabulary owner:** #122 / [Kitchen-language boundary](../ethos.md#kitchen-language-boundary)

## What this is

A fresh-context review of the discoverability, consistency, and review surfaces for the builder house style. It is **not** a live agent behavioral eval and **not** a fixture relabel.

## Surfaces reviewed

| Surface | Finding |
| --- | --- |
| `knowledge/words/no-slop-writing.md` §9 | Marked **Original**; voice, kitchen boundary, evidence-state, surface table, and Avoid/Prefer examples cover progress, issue/PR, help, handoff, errors, customer voice, and literal IDs. Links #122 and ethos. Packaged note preserved. |
| `knowledge/engineering/technical-documentation-ste100.md` §1 | README split coherent: narrative → no-slop; technical examples → STE100; no third regime. |
| Root `AGENTS.md` | Short route: no-slop + §9 before relevant writing + STE100 + kitchen boundary (#122). Host adapters directed to stay thin. |
| Root `CLAUDE.md` | Thin adapter: Read AGENTS first; no copied style manual. |
| `CONTRIBUTING.md` / `.github/PULL_REQUEST_TEMPLATE.md` | Linked house-style / #122 reminders on existing review surfaces; no new bureaucracy. |
| `evals/launchbench/house-style-*.yaml` (12 scenarios) | Authored matrix matches issue scenario list (README kitchen, inspect literal, fixture≠ready, timeout uncertainty, ADR/API, mixed README, partial PR, handoff, customer voice, literal controls, packaged ethos path, entrypoints). Each file states lint-only / not live / not fresh-context. |
| `check:agent-entrypoints` review-surface contract | Protects §9 heading, #122 URL, ethos anchor, PR reminder, and AGENTS discovery link. Structural evidence only. |
| `check:no-slop` | Front-door banned-word/pattern gate. Does **not** prove every agent message followed §9. |

## Representative before/after (authored examples, not model runs)

| Avoid (bad claim) | Prefer (house style) |
| --- | --- |
| `RevenueCat integration is complete.` after fixtures only | Name fixture scope; require authorized live proof |
| `The request failed.` after a timed-out mutation | Unknown remote effect; reconcile before retry |
| `Continuing in the background.` as a handoff | Name hold + next safe action |
| `Independent review: complete` without a reviewer | Leave review open; report checks that ran |
| Rewriting `doctor.node_too_old` to a kitchen alias | Keep the identifier; explain in prose |
| Imposing brigade/mise on playful customer onboarding | Keep accepted customer voice |

## Deterministic vs behavioral

| Kind | Status |
| --- | --- |
| Authored/linted house-style scenarios (`npm run launchbench`) | Registered; definition lint + validator fixtures only |
| `check:agent-entrypoints` / `check:no-slop` / `check:documentation-ste100` | Structural / front-door / STE100 sentence gates |
| Live `evals:behavioral` on house-style prompts | **Not run** — house-style YAMLs omit `behavioral: true` by design |
| Fresh-context human review of instructions + examples | **This document** |
| Claim that style is enforced everywhere via front-door lint | **Forbidden / false** |

## Protected meanings (unchanged)

Consumer-app brand voice, public contract command/field IDs, machine/JSON output, and authority/evidence vocabulary stay literal. §9 and the Avoid/Prefer table require that; scenarios `house-style-customer-voice`, `house-style-literal-controls`, `house-style-adr-api-example`, and `house-style-mixed-readme` encode the negative controls.

## Limitations left open

1. **Live agent adherence** to §9 is unevaluated. Do not treat LaunchBench green as behavioral proof.
2. **Tone and metaphor quality** still need human review on changed prose; regex cannot score them.
3. **Historical issues/ADRs** are not rewritten by this issue.
4. **#127** and later U6 work are out of scope; STOP after #129 close.

## Verdict

Discoverability, ownership, review reminders, deterministic regressions, and honest evidence labeling meet #129 acceptance for the authored/linted path. Behavioral proof remains **explicitly open**.
