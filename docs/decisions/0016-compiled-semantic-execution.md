# 0016 - Compile semantic decisions through the existing execution model

- **Status:** proposed; founder requested this direction, independent conformance and integration remain pending.
- **Date:** 2026-09-17.
- **Steward:** repository architecture steward; this change set records the requested design and does not invent an independent reviewer.
- **Affected rules and contracts:** ARCH-02 through ARCH-13, ARCH-15; proposed ARCH-16 and ARCH-17; experimental semantic contracts, composition, knowledge, provider and evidence boundaries.
- **Affected units:** SQ-01 through SQ-18 in the [delivery plan](../plans/2026-09-17-compiled-semantic-execution.md). Existing U IDs are not renumbered or declared complete.

## Context and evidence

The founder requested a working model centered on AI-powered software, parallel
decision checks, and knowledge-graph use cases, rather than an extra reviewer
around a sequential agent. The requested repository changes are architecture and
an implementation issue program, not a claim that the whole program is implemented.

The public source inspected on 2026-09-17 supplies these integration boundaries.
Line references are from the inspected public main views and must be refreshed
against the eventual PR head. An immutable checkout was unavailable during drafting.

| Evidence | Consequence |
| --- | --- |
| `docs/architecture.md:209-218` distinguishes world ontology, workspace instances, expertise, and work graph | Add inferred relationships as projections, not another world or work owner |
| `docs/north-star-architecture.md:90-101` requires one compiler, planner, reducer, knowledge index, and execution store | Semantic lowering belongs inside the existing compiler responsibility |
| `kernel/services/business.ts:1-29` imports shared lifecycle, installed composition, public contracts, and provider resolution | Keep public projection and selection in these shared service seams |
| `kernel/knowledge-service/service.ts:217-218` excludes filesystem, workspace, clock, network, and execution dependencies | The pure knowledge service cannot become an implicit model client |
| `kernel/session/plan.ts:45-53,521-525` describes no-write planning and uses a cloned state | Read stored semantic receipts; never assess while passively planning |
| `docs/architecture.md:234-260` separates bounded execution, resource coordination, and isolated review | Reuse occurrence/attempt identity, authority, recovery and acceptance |
| `docs/guides/provider-integrations.md:40-72,99-118` requires canonical mapping, independent fixtures, effects and one journal | TypeSafe is an explicitly qualified adapter, not a global SDK dependency |
| `CONTRIBUTING.md:123-180` separates presubmit from full verification and forbids bypasses | A green presubmit alone is insufficient merge evidence |

TypeSafe's official documentation supports the technical opportunity: atomic
Choice/Score/Noul assessments, shared-state parallel questions, speculative fan-out,
entity alignment, hierarchical search, and feature discovery. The detailed design
cites those primary sources. It does not adopt the vendor's latency or cost examples
as measured Brigade properties.

## Alternatives

### Keep all interpretation in the agent loop

This preserves current implementation effort but requires repeated interpretation
of known relationships and makes control flow harder to inspect, budget, replay,
and measure. It remains suitable for novel work. Use it as a comparison baseline,
not the only implementation model.

### Add a generic TypeSafe review hook

This can improve a narrow check, but leaves semantic joins, graph traversal,
branch evaluation, and routine event handling inside sequential agent decisions.
It does not implement the requested working model. A narrow assessor is still a
useful early test of contract and provider behavior.

### Introduce an autonomous graph agent and graph database

This could centralize graph operations but creates new truth and orchestration
owners without a measured deployment need. It risks conflating inferred
relationships with accepted facts and producing an unnecessary migration. Reject
this as the initial design. A future storage backend may implement the existing
index contract only after a measured need and separate migration review.

### Extend the existing compiler with bounded semantic operations

Chosen direction. Recipes declare versioned semantic questions and operators.
The existing compiler separates data dependencies from result-use conditions and
lowers eligible work into the existing execution model. Selected providers perform
assessment. Code reduces results and proposes work. Inferred graph views retain
source and receipt identity without replacing authored or accepted state.

The cost is new contract, query-planning, evaluation, provenance and failure-handling
work. Bound that cost through the feedback-to-work vertical slice before broader
operators or a general public query language are added.

## Decision

Adopt compiled semantic execution as a target capability of Brigade, implemented
through the existing composition, knowledge, execution, provider and evidence
owners. Use deterministic code for control flow and authority, narrow semantic
assessment for known judgments, and generative agents for invention or unresolved
cases. Add the following normative rule wording to the north-star architecture:

> ARCH-16: Repeatable semantic work compiles into typed, versioned operations under
> the existing composition compiler and execution owner. Parallelize assessments
> whose inputs and authority prerequisites are already available. Never speculate
> external effects or required data access across an authority boundary. Passive
> discovery, status, knowledge retrieval, and planning do not run paid inference.

> ARCH-17: Semantic relationships and applicability judgments are context-bound
> inferences with source revisions and receipt provenance. They remain derived
> graph views and cannot overwrite authored truth, create identity equivalence,
> waive required evidence, or grant authority. Unknown, conflicting, and missing
> evidence remain explicit. Invalidation and erasure follow the existing source
> and reducer owners.

The [detailed contract](../semantic-execution.md) expands these rules. Its operator
names and schema fields are proposed experimental contracts, not current API claims.
TypeSafe is the first candidate provider to qualify. Availability does not select
it, qualification does not activate it, and receipt production does not establish
business acceptance.

## Compatibility and migration

Preserve existing `b2c/v1` inputs, current passive services, pinned workspaces,
canonical knowledge/reference IDs, authored product/design truth, and all evidence
classes. No root skill expansion, mandatory hosted service, new top-level runtime,
new graph database, deployment, or package release is part of this docs change.

Implementation begins with a versioned experimental resource contract and a fixture
provider. Add TypeSafe after source qualification and independent upstream fixtures.
Compile an opt-in shadow recipe. Preserve the existing default behavior and record
comparative evidence. Introduce advisory planner projections only after the
end-to-end slice proves useful. Explicit admission to execution retains all
existing authority, revision, budget, resource and independent-review gates.

Policy changes can replay stored distributions; source, question, projection or
relevant model changes require renewed assessment. Rollback disables new semantic
policy without discarding receipts or treating stale evidence as current. A model
alias is not an immutable version guarantee. Erasure applies to derived data too.

Generated connected-app behavior and cross-business learning are later consumers,
not prerequisites to the first slice. TUCK's offline product contract remains
unchanged. Existing issue #403 retains design-delivery ownership; this program adds
semantic candidate assessment rather than a competing design workflow. Provider
work conforms to #109/ADR-0013 instead of redefining that program.

## Consequences and proof

SQ-01 defines contracts; SQ-02 qualifies the provider; SQ-03 establishes evaluation;
SQ-04 through SQ-10 implement the adapter, compiler, projections, parallel runtime,
graph and invalidation; SQ-11 proves feedback-to-work. SQ-12 through SQ-17 are
bounded consumers. SQ-18 owns integrated safety, failure, parity, observability,
and rollout proof, without deferring those requirements in earlier units.

The minimum integration result distinguishes same mechanism from similar wording,
retains competing explanations and contradictory evidence, proposes an observation
when evidence is missing, and cannot dispatch unauthorized work. Compare against
existing deterministic and agent baselines using frozen held-out cases. Record
actual cost, latency, coverage, and human correction effort when observed.

The architecture PR changes only documentation. It does not close any implementation
issue or assert upstream conformance. Required repository checks and independent
review apply to its final head. When those pass, the steward can change this record
to accepted and the integrator can merge under existing protections. Creating an
issue or receiving founder direction is not that verification.

No provider spend, customer-data transfer, account configuration, production
release, or experiment allocation is authorized by this decision. Each remains a
separate effect-boundary requirement.
