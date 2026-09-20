# Architecture conformance and delegation

For public-facing work, audit the [public interface](public-interface.md) and saved
v1 fixtures before inspecting implementation. The founder directed a greenfield
architecture. Existing command names, folders, and runtime types do not constrain
the target. ADR-0003 authorizes one current format because there are no installed
users. Remove obsolete owners and update their callers in the same change.
Review the README, agent guides, skill, source templates, setup and help output,
CLI and MCP, generated schemas, and examples as one release surface. U23 and U24
precede the internal roadmap. U25 owns the lifecycle facade and U26 owns mobile
app operation. A new facade does not complete unimplemented provider or business proofs.

Use this protocol with the [north-star architecture](north-star-architecture.md)
and [migration plan](plans/2026-09-04-1747-refactor-consumer-business-primitives-plan.md).
The architecture owns rules. The plan owns requirements, work-unit definitions,
and acceptance. This document owns the review and handoff process. It does not
create another execution-state store.

## Roles

| Role                 | Owns                                                                                             | Escalates                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Architecture steward | Architecture rules, cross-cutting decisions, unit boundaries, dependency order, exceptions       | Reserved business authority to founder                           |
| Auditor              | Read-only comparison of actual code and evidence with cited ARCH rules and plan requirements     | Contract ambiguity or a proposed exception to steward            |
| Implementer          | One assigned unit, its declared files, focused proof, and handoff                                | Shared-file conflicts, invalid assumptions, changes outside unit |
| Integrator           | Serialized shared changes, generated output, release-compatible verification and integration     | External actions and releases requiring founder authority        |
| Founder              | Business direction and reserved access, spend, pricing, legal, destructive and release decisions | May override architecture direction explicitly                   |

The architecture steward starts as the architect of this roadmap. Any later
agent can assume that role by reading these artifacts and the accepted ADRs.
There is no automatic background supervision. Each assignment names the
responsible roles. A small task may combine steward and integrator. The final
conformance review must still be independent of the implementation.

## Start every architecture-sensitive task

1. Inspect the branch, revision, dirty files, and active ownership. Preserve work
   from other agents. A dirty checkout is context, not permission to overwrite.
2. Read the plan's Goal Capsule, Verification Contract, Definition of Done, and
   the assigned unit. Load only its cited requirements, decisions, and ARCH rules.
3. Inspect current source and focused tests. Report whether the described gap
   still exists; a plan's snapshot does not outrank current evidence.
4. Confirm dependencies by evidence, then declare owned paths and excluded paths.
   Serialize overlapping runtime/catalog files. A dependent unit can research
   early, but cannot assume an unintegrated contract is available.
5. Execute within the unit. If it cannot be bounded as written, propose the
   smallest split or architecture decision before broadening it.

## Audit result

Use one finding per violated contract. Report:

| Field               | Required content                                                                       |
| ------------------- | -------------------------------------------------------------------------------------- |
| Rule                | ARCH ID and relevant R/KTD/U IDs                                                       |
| Observation         | Exact source path and current line or observed behavior                                |
| Impact              | Concrete business, extension, authority, compatibility, or proof consequence           |
| Classification      | Conforms; existing debt; regression; missing evidence; or architecture decision needed |
| Smallest correction | Existing owner to change and bounded behavior to restore                               |
| Proof               | Input and expected result that distinguish a real fix from a cosmetic change           |

Do not score code by resemblance to a proposed folder layout. Judge ownership,
dependency direction, semantics, and externally observable guarantees. Mark
missing evidence as missing; do not infer live behavior from fixtures or prose.

## Review dimensions

| Check                          | Rules            | Reviewer asks                                                                                        |
| ------------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------- |
| Product purpose and simplicity | ARCH-01–ARCH-03  | Does this help a consumer business, and extend an existing owner?                                    |
| Extension parity and selection | ARCH-04–ARCH-06  | Can an external package do this without kernel edits or root-package privileges?                     |
| Truth and migration            | ARCH-07, ARCH-08 | Is there one owner, a stable active pin, and recoverable migration?                                  |
| Agent usability                | ARCH-09, ARCH-11 | Can an agent discover supported actions, limitations, proof, and re-entry through existing services? |
| Authority and coordination     | ARCH-10          | Are effects scoped and duplicate or conflicting effects prevented?                                   |
| Evidence and semantics         | ARCH-11, ARCH-12 | Does the evidence establish the actual claim, and are comparisons meaningful?                        |
| Product quality and scale      | ARCH-13, ARCH-14 | Does reuse preserve product freedom and independent business operation?                              |
| Change governance              | ARCH-15          | Is any exception explicit, narrow, owned, and removable?                                             |

## Semantic execution review

For the proposed semantic execution model, apply the [detailed contract](semantic-execution.md), [ADR-0016](decisions/0016-compiled-semantic-execution.md), and [delivery plan](plans/2026-09-17-compiled-semantic-execution.md) together with the existing rules. This proposal is not implementation evidence.

Review compiled ownership, parallel correctness, read purity, provenance-bound graph meaning, bounded source access, explicit provider selection, recovery, replay and erasure, measured benefit, and staged admission. Each implementation issue supplies its negative controls; SQ-18 integrates them without deferring privacy, authority, or recovery. Self-review is not independent conformance.

### Decision-driven building review

For changes to build workflows, next-work routing, context/skill selection,
worker routing, semantic review, or Product Profiles, also apply
[decision-driven building](decision-driven-building.md) and its
[delivery plan](plans/2026-09-20-decision-driven-building.md). Existing exact
checks and narrow code fixes do not require a new semantic operation merely to
satisfy this checklist.

| Concern | Required review question |
| --- | --- |
| Computation choice | Which decisions belong in exact code, bounded semantic operations, or generative work, and why? |
| Active routing | Does a qualified decision change the next eligible action, rather than only annotate an artifact after work is finished? |
| Single ownership | Do candidate construction, dispatch, receipts and state use the existing planner, compiler, services, executor and reducer? |
| Candidate coverage | Are no-match, insufficient-context, omitted candidates and necessary generation/observation routes explicit? |
| Freshness and effects | Are source revisions, bindings, grants, ownership and budget rechecked before acting on a stored decision? |
| Read purity | Do repeated status, plan, knowledge and profile reads execute zero inference requests? |
| Parallel correctness | Are actual data dependencies separated from conditional result use, with aggregate cost and complete failed/cancelled accounting? |
| Evidence quality | Does the evaluator receive a supported modality, and are confidence, semantic correctness, observation and acceptance kept distinct? |
| Profile ownership | Does a reference profile conform to the general Product Profile model without replacing accepted product/design truth? |
| Autonomy and recovery | Is active reversible dispatch permitted after qualification, with loop, no-progress, failure and uncertainty handling? |
| Agent delivery | Are supported changes propagated through canonical catalog/skill/template owners and tested in actual installed fresh-host entrypoints? |

Freeze outcome criteria before tuning questions. A routing proof must include a
case where changed evidence changes the next executed action, a no-fit case, a
stale-after-selection refusal, and a provider-failure recovery. Actual network
fanout and useful build outcomes need evidence beyond synchronous barrier or
mocked response fixtures. Do not call format validation proof of truth.

## Work assignment template

Copy this into the existing task or issue surface. Replace the placeholders;
do not copy the entire roadmap into every agent prompt.

```text
Role: implementer (or read-only auditor).
Objective: <one bounded observable outcome>.
Plan: <the applicable existing delivery plan>.
Unit: <existing unit or issue>; requirements/decisions: <relevant IDs>.
Architecture: docs/north-star-architecture.md; applicable rules: <ARCH IDs>.
Baseline and dependencies: <revision, integrated prerequisites and evidence>.
Owned paths: <exact files or narrow module>.
Excluded/shared paths: <other agent ownership and required integration window>.
You are not alone in the codebase. Preserve others' edits and accommodate them.
Allowed work: <local source/doc changes and focused verification>.
Reserved actions: <existing authority constraints; none are granted by this task>.
Acceptance: <cite the unit scenarios and add task-specific inputs if needed>.
Escalate: <contract change, unresolved ownership, invalid plan assumption>.
Return: changes, rule mapping, proof, limitations, debt, next dependency.
Do not rewrite the architecture to fit the implementation.
```

For a decision-bearing workflow or routing issue, append only the relevant
fields below. A deterministic-only issue can state that no semantic decision is
needed instead of inventing one.

```text
Decision checkpoint: <what material change requests a new decision>.
Source of truth: <accepted intent, source revisions, evidence, profile references>.
Computation split: <exact code / bounded semantic assessment / generative work>.
Candidates and context: <eligible IDs, required guidance, bounded projection, omissions>.
Decision use: <what action policy selects and which existing owner dispatches it>.
Bounds and fallback: <rounds, time, requests, spend, no-fit, failure and escalation>.
Freshness and authority: <what is rechecked between selection and dispatch>.
Proof and rollout: <independent outcome cases; offline / shadow / advisory / active>.
Agent propagation: <canonical sources, renderers, package/template and fresh-host tests>.
```

## Architecture changes and debt

Compatible implementation choices do not need an ADR. For a material change,
the proposer supplies the affected rules/contracts, evidence, alternatives,
recommendation, compatibility impact, and affected units. The steward records
the decision in [`docs/decisions/`](decisions/README.md) and updates the owning architecture rule and
plan references in the same change. Superseded decisions remain traceable in Git.

Urgent work may retain existing debt. Name the exact boundary, the reason, the
responsible role, and the removal unit or issue. Show evidence that the change does
not expand the debt. A declaration is not a waiver of authority or proof rules.
No broad allowlist such as "all existing code is exempt."

Track task progress in the existing task/issue system or runtime, not in this architecture or the immutable unit numbering. Classify
existing debt explicitly; changed code must not expand it. Keep U IDs
stable and do not add completion checkboxes to the plan. If a unit splits, retain
its ID for the original responsibility and add new IDs for the split work.

## Integration acceptance

An independent reviewer must be able to state which rules apply, what changed,
and why it conforms. They must also name what remains unproven. The integrator verifies
the affected checks, compatibility, generated projections when applicable,
and absence of unrelated changes. External readiness needs current external
evidence and its existing authority; local conformance is a separate result.

Mechanical checks cover dependency boundaries, extension schema parity,
immutable pins, and external-package conformance. Run them against the final
source tree. Documentation and a declaration of conformance cannot substitute
for those results or for current external evidence.
