# ADR-0014: Research checkpoints do not grant initialization eligibility

- **Status:** accepted
- **Date:** 2026-09-12
- **Updated:** 2026-09-20 (#395 U6 closeout — R0 compatibility table + `not_run` settlement)
- **Steward:** founder-directed architecture decision
- **Affected rules and contracts:** ARCH-07, ARCH-09, ARCH-10, ARCH-11, ARCH-15; research validator and initialization boundary
- **Affected work:** #395, #397, #71, #74

This record does not grant product, pricing, legal, provider, deployment, publication, or release authority. It records the narrow compatibility decision required before the research lifecycle implementation.

## Context

The research artifact carries several facts that must not collapse into one readiness bit:

| Fact                       | Current owner                                                                                 | Meaning                                                                                                            |
| -------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Artifact contract validity | `checks/validation/business/research/check-research-evidence.ts` and `kernel/schema/index.ts` | The authored research structures parse and satisfy their required fields.                                          |
| Independent assessment     | Existing review receipts and freshness checks                                                 | A reviewer recommendation remains bound to the reviewed revision; it is not founder authority.                     |
| Experiment execution       | `strategy/OFFER_TEST.md` and its validator                                                    | `run` and `waived` retain their documented compatibility meaning; neither turns unknown demand into a measurement. |
| Founder product decision   | `product.yaml` and its rendered `PRODUCT.md`                                                  | The accepted product remains the canonical product authority.                                                      |
| Initialization eligibility | `kernel/session/bootstrap.ts`                                                                 | Durable initialization requires the accepted product and rendered projection.                                      |
| Execution authority        | Existing grants, protected-effect gates, and run receipts                                     | Initialization never grants authority to perform protected work.                                                   |

The prior validator treated a well-formed Pivot or Kill row in a completed research lane as an error. That forced a valid checkpoint to masquerade as malformed input, even though the existing initialization boundary already refuses a product whose `meta.status` is not `accepted`.

## Decision

1. A valid Go, Pivot, or Kill row is a valid research checkpoint when its required evidence, date, and founder decision fields pass structural validation.
2. A Pivot or Kill checkpoint emits the stable `research.go_pivot_kill_not_go` warning with explicit held-state guidance. It does not become a Go, improve evidence strength, or authorize initialization.
3. Initialization eligibility remains owned by `kernel/session/bootstrap.ts` and the accepted `product.yaml`/`PRODUCT.md` pair. No new readiness store, enum, or automatic migration is introduced here.
4. Existing offer-test statuses `run` and `waived` remain unchanged. A waiver changes only the permitted decision path; it does not claim measured conversion or resolve an independent finding.
5. **Additive `not_run` is not introduced.** An authored Decision status other than `run`/`waived` (including the literal `not_run`) remains **incomplete** under the existing contract. Unknown execution is not the same as confirmed not-run; confirmed unrun work must not be encoded as `waived`. Old supported `run`/`waived` records keep their meaning with no automatic migration or repin.
6. Founder-acceptable residual risk (when policy permits) is recorded separately from experiment execution and from resolved findings. Generic "continue building" cannot accept every legal, privacy, security, pricing, or release obligation.
7. Guarded authoring is the CLI-only `business.research.decision` / `b2c research-decision` preview/apply path: revision-bound, journal-recovered, writes only `product.yaml` + rendered `PRODUCT.md`, never initializes or grants authority.
8. Planning resume exposes a read-only `researchCheckpoint` lifecycle projection (verdict / recordedVia / initializationEligible:false) distinct from #74 proof-strength facts.

## Before / after state and authority (R0)

| Concern | Before | After (#395) |
| --- | --- | --- |
| Pivot/Kill structural validity | Treated as error when lane "done" | Valid held checkpoint + `research.go_pivot_kill_not_go` warning |
| Init eligibility | Accepted product gate (unchanged owner) | Still accepted-product gate; checkpoint projection never sets eligible |
| Offer execution enum | `run` / `waived` only | Unchanged; `not_run` stays incomplete (not additive status) |
| Multi-file continuation | Hand-edit `product.yaml` + `PRODUCT.md` (+ mirrors) | One guarded preview/apply with journal recovery |
| Proof strength | #74 owners | Unchanged — do not rewrite |
| Field/parse diagnostics | #397 owners | Consumed; do not redo |

## Compatibility and migration

No automatic migration of historical workspaces. Existing Go, Pivot, Kill, `run`, and `waived` records remain parseable. The changed behavior is limited to non-Go checkpoint diagnostics, the guarded authoring path, and the read-only planning `researchCheckpoint` projection. Existing initialization still refuses non-accepted products, so a non-Go checkpoint cannot initialize by accident.

## Evidence

- `checks/validation/business/research/check-research-evidence.ts`: research checkpoint validation and non-Go diagnostic.
- `checks/validation/business/research/offer-evidence.ts`: stable `run`/`waived` contract; non-`run`/`waived` statuses remain incomplete.
- `kernel/session/bootstrap.ts`: accepted product and rendered `PRODUCT.md` initialization gate.
- `kernel/services/research-decision.ts`: guarded preview/apply authoring.
- `kernel/session/research-checkpoint-projection.ts`: planning lifecycle checkpoint facts (#395).
- `kernel/session/research-proof-projection.ts`: offer demand / proof distinctions (#74).
- `checks/validation/repository/fixtures/core-artifacts.fixtures.ts`: synthetic Kill/Pivot/`not_run` regressions.
