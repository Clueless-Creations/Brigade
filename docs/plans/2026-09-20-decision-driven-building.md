# Decision-driven building delivery

Date: 2026-09-20. Status: proposed implementation plan. This document assigns work; it is not a release receipt or a second issue tracker.

Architecture: [decision-driven building](../decision-driven-building.md), [ADR-0016](../decisions/0016-compiled-semantic-execution.md), and ARCH-02, ARCH-07, ARCH-09 through ARCH-13, ARCH-16 and ARCH-17 in the [north star](../north-star-architecture.md).

## Goal capsule

An admitted Brigade build uses qualified semantic decisions to choose useful work, relevant context, execution routes, observations and repairs. It advances through the existing executor without a general-purpose agent reinterpreting every intermediate result. Generative workers remain responsible for invention and unfamiliar problems. A Product Profile makes intent, observed behavior and their relationships addressable without becoming a new source of truth.

Success is an evidence-backed closed build loop, not merely a router returning valid JSON. Demonstrate that different source evidence changes the next executed action, and that the action improves the product or resolves the named uncertainty. An unresolved result and a deliberate stop can be correct outcomes.

## Existing owners

The inspected baseline is `8870d87bd79de4699dc271eafa7418c6175a639e`. Refresh main, issue discussion, active PRs and tests before implementation. Source presence and prior paper/fixture merges do not establish integrated or live execution.

Coordination refresh: main subsequently reached `94334f9cabcaff98309fb80f893e58aa8f344f71` through #523 / PR #572, adding paper safety/rollout work. #524 has an active bounded ranking handoff. Preserve that assignment. [#573](https://github.com/Clueless-Creations/Brigade/issues/573) owns the subsequent active checkpoint and dispatch integration, consuming #524 rather than expanding its in-flight scope. This is a follow-on unit under #511, not a second execution program.

| Work | Existing issue owner | Required integration |
| --- | --- | --- |
| Semantic architecture and program | [#511](https://github.com/Clueless-Creations/Brigade/issues/511) | Extend ADR-0016 and existing SQ work; do not create a Jev framework alongside it |
| Provider qualification, adapter and actual Jev behavior | [#571](https://github.com/Clueless-Creations/Brigade/issues/571), reusing #513-#515 | Distinguish model, gateway/endpoint, API/SDK contract, binding and current proof |
| Eligible next-work ranking | [#524](https://github.com/Clueless-Creations/Brigade/issues/524) | Preserve its bounded current handoff and consume its result |
| Active build-level and within-task routing | [#573](https://github.com/Clueless-Creations/Brigade/issues/573) | Extend current frontier, briefs and session/executor checkpoints; not a second planner |
| Safety and staged autonomy | [#523](https://github.com/Clueless-Creations/Brigade/issues/523), consumed by #573 | Reuse landed safety machinery; end-to-end evidence still precedes live enablement |
| Product Profile contract and views | [#562](https://github.com/Clueless-Creations/Brigade/issues/562), #563-#569 | One base schema; intended/observed views and reference specialization |
| Reference composition | [#570](https://github.com/Clueless-Creations/Brigade/issues/570), coordinated with #528 | Preserve source profiles and accepted target-product authority |
| Change impact, design, research and product-runtime consumers | #525-#529 | Reuse decision contracts and provider bindings without making every consumer a prerequisite |
| Packaged guidance and host discovery | [#386](https://github.com/Clueless-Creations/Brigade/issues/386) | Source definitions, generated skills, workspace installation and actual package verification |
| Fresh-agent autonomy and context evidence | [#392](https://github.com/Clueless-Creations/Brigade/issues/392) | Compare entrypoint-driven behavior, not responses to a pasted architecture document |

## Delivery order

### 1. Freeze a small decision contract and prove offline control flow

Within #573, consume #524 and the existing semantic contract owner. Define only the request/result additions needed for one complete routing slice. Reuse `contracts/semantic/`, the existing source projection, compiler, batch and receipt seams.

Start with current eligible work plus a bounded observation. Include explicit no-fit, insufficient-information and generation/escalation routes. Use a frozen candidate set and tests to prove that one input selects inspection, another selects local repair, and a third requests independent verification. Preserve material revisions, candidate omissions, binding identity and effect class.

Demonstrate deterministic dispatch revalidation and stored result replay. Do not invent public CLI/MCP names in guidance before a registry-backed implementation exists. Fake transport proves control flow only.

### 2. Qualify Jev and the real execution path

#571 reuses the #513-#515 evidence and adapter owners. Read current official contracts and pin the supported tuple. Do not assume the existing TypeSafe endpoint and another gateway expose interchangeable envelopes or question types.

Exercise real asynchronous admission, bounded fanout and cancellation through the existing #518 session boundary. Reuse #514's frozen evaluation method, with a separate routing corpus where needed. Include provider errors, unsupported response/model identity, uncertain charged requests, aliases, evidence privacy and actual usage reporting.

Offline implementation and profile schema work can proceed without live credentials. A paid or private-data test needs its own scoped authority and budget. Missing live proof is a qualification hold, not a reason to relabel a fake run.

### 3. Close the active build loop

#573 implements meaningful checkpoints: new accepted input, completed bounded work, new observation, test failure, context gap, or stale decision. Active refresh runs under an admitted session; passive plan and status remain inference-free.

Policy selects one or several compatible actions from current eligible routes. Support within-task observe/repair/review continuation without launching the entire headless runner inside an interactive agent. Reconcile uncertain effects before retry. Retain candidates and alternatives so a mistaken omission can be diagnosed.

When no finite candidate fits, a bounded generative task may propose new work or hypotheses through the existing work-order/composition path. This does not let model output invent executable authority. Required obligations remain visible, and deterministic fairness prevents starvation by cheap easy work.

After family-specific qualification, permit automatic reversible dispatch under existing grants. Do not retain a mandatory frontier-agent approval wrapper around every decision. Do not use shadow mode as the permanent interpretation of the feature.

### 4. Add profile-backed reasoning without blocking the first slice

#563 establishes `product-profile/v1` before reference specialization. #564 and #565 produce revision-bound intended/observed views. #566 compares them without converting absent evidence into disproved behavior. #567 retrieves bounded connected context without hidden inference. #568 refreshes views at material lifecycle boundaries. #569 imports compatible reference profiles without changing business intent.

Use these nodes to make routing more precise: completion can affect progress, profile, persistence, animation and feedback. A missing relationship can request a new observation rather than speculative implementation. The first routing slice may use existing source owners directly until profile contracts land; do not duplicate them temporarily.

### 5. Propagate the behavior to real agent entrypoints

This is a delivery requirement, not optional documentation polish. Extend current canonical sources and renderers, rather than hand-editing generated task skills or copying a new architecture manual into every worker prompt.

The implementation change must cover the applicable surfaces together:

- authored catalog workflow/question/policy resources and exact knowledge bindings;
- generated task skills and their conditional references;
- root business skill's managed-work route and supported lifecycle reference;
- source workspace AGENTS template and reference-business copy;
- selected-provider procedures and public service/CLI/MCP descriptions;
- package contents, installed skill references and fresh Claude/Codex entrypoint behavior.

Root `AGENTS.md`, the conformance assignment template and `CONTRIBUTING.md` govern how new repository issues are designed now. They must not tell installed business workers to call an unimplemented command. Implementation guidance should expose supported operations, bounded briefs, selected routes and evidence requirements, not maintainer ARCH vocabulary.

Keep host adapters thin. A focused code fix or a deterministic check does not need the whole architecture, a workspace initializer or a paid model call. A workspace pinned before this feature remains unchanged until explicit composition migration.

#573 owns propagation for the new active loop, using #386's package/discovery proof and #392's fresh-agent evaluation mechanisms. These follow-on scenarios do not expand unrelated in-flight skill migration scope. Issue IDs are coordination pointers, not a replacement for published supported instructions. Packaged-source changes require the existing version and generation gates.

### 6. Promote by decision family and outcome evidence

#573 reuses #523's staged admission: offline conformance, authorized live shadow, advisory use, then active use for named qualified families. Record exit criteria and rollback per stage. Active build routing need not wait for research, generated-app AI or every future profile consumer.

After the first accepted slice, exercise a structurally different app and a new problem context. Expand through #525-#529 only where the evidence supports it. Human-reserved decisions, source-proof obligations and independent design review remain unchanged.

## Verification contract

Use existing fixture, public parity, behavioral and evaluation owners. Required cases include:

| Case | Distinguishing evidence |
| --- | --- |
| Next-work routing | Two otherwise eligible actions exist; changed evidence changes which action actually runs |
| Within-task routing | A failed test selects a relevant probe; a later observation selects repair, then current-runtime verification |
| Progressive context | Required instructions arrive; unrelated content is excluded; omitted candidates and truncation stay explicit |
| Novel task | No match produces a scoped generative proposal or observation request, not an arbitrary command |
| Parallel questions | Independent questions overlap in a real async test; dependent input waits for a later round |
| Independent worker/device work | Conflicting writes and device ownership serialize despite parallel inference |
| Stale selection | Source, grant, binding or ownership changes between inference and dispatch prevent stale execution |
| No hidden cost | Repeated status, plan and profile reads produce zero inference requests |
| Failure and recovery | Timeout, cancellation, late result and uncertain effect retain receipts and do not silently replay mutations |
| Loop and fairness | Repeated no-progress routes stop; mandatory work cannot be starved indefinitely |
| Profile epistemics | Missing haptic observation stays unknown; reference profile import cannot modify accepted target intent |
| Same-model bias | A confident but wrong answer fails independent criteria; duplicate evidence is not corroboration |
| Package/host parity | Fresh installed agents discover the supported route without a pasted design or maintainer knowledge |
| Outcome comparison | Frozen task/evidence are compared with deterministic and current agent-driven baselines; total accepted-work cost and correction effort are reported |

A valid JSON result, a mocked batch, a merged PR and a deployed build establish different facts. Record them separately. Live benchmarks report request count, sample size, cold/warm conditions, omitted cases, queue and tool time, actual/estimated/unknown spend, and model identity limitations.

## Definition of done for the architecture change

The architecture change is documentation and issue coordination only. It is reviewable when current/target distinctions are accurate, links resolve, the owning rules and ADR agree, agent/issue guidance is conditional, and the delivery mapping has no competing owner or circular prerequisite. Required repository checks and genuinely independent conformance review still apply before merge.

It does not authorize provider activation, inference spend, data transfer, deployment, publication or a live business release. No implementation issue closes merely because this plan exists.
