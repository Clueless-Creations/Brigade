# Compiled semantic execution

Status: proposed target design, not implemented runtime support.
Date: 2026-09-17.
Decision: [ADR-0016](decisions/0016-compiled-semantic-execution.md).
Delivery: [semantic execution plan](plans/2026-09-17-compiled-semantic-execution.md).

## Purpose

Move repeatable interpretation of consumer-business data out of open-ended agent
loops and into explicit software operations. Agents propose new products,
explanations, implementations, and experiments. Versioned semantic questions
assess bounded state. Code combines their results. The existing execution owner
checks authority, performs eligible work, and records evidence.

The principal use is a feedback-to-work pipeline: connect a customer observation
to the affected product promise, retain competing explanations, retrieve
applicable expertise, and propose a useful next observation or reversible repair.
The same operations can later support opportunity research, change-impact
analysis, design exploration, and bounded AI-powered consumer applications.

This is more than an assessor attached to an agent. A recipe declares semantic
filters, candidate joins, relationship checks, and traversals. The existing
composition compiler lowers those declarations into an executable dependency
plan. Independent questions execute in parallel; only actual data dependencies
require another inference round.

## What is established and what is proposed

The current system already has a world ontology, workspace-owned instances,
manifest-backed expertise, an agent/work graph, shared services, and a controlled
execution path. Current architecture describes their implemented boundaries.
This document does not establish a working TypeSafe adapter, semantic query
contract, model evaluation result, or generated application runtime.

TypeSafe documents Choice, Score, and Noul questions evaluated independently
against shared state, speculative fan-out, entity alignment, hierarchical search,
and feature discovery. These are source-backed provider capabilities and example
patterns, not measurements of Brigade. Sources appear at the end of this document.

All operation names, receipt fields, relationship additions, and compilation
stages below are proposed contracts. Do not advertise a new CLI command, MCP
operation, or provider support tuple until implementation and conformance land.
No TypeSafe dependency, credential, service call, live dataset, workspace repin,
or production behavior is introduced by accepting the architecture alone.

## One set of owners

| Responsibility | Owner to extend | Excluded interpretation |
| --- | --- | --- |
| Versioned semantic request/result and plan types | Shared contracts; proposed `contracts/semantic/` module | Provider SDK types used as business contracts |
| Query definitions, question packs, recipe policy | Catalog/extension package resources | A second prompt or policy registry |
| Query validation and lowering | Existing composition compiler; current `kernel/composition/` and catalog seams | Another workflow engine or top-level compiler service |
| Business state and authored decisions | Existing product, design, research, Git, and reducer owners | Model output replacing authored truth |
| Expertise and source retrieval | Existing knowledge index and `kernel/knowledge-service/` | A new authoritative graph database |
| Scoped source projections and operation admission | Shared services under existing workspace and access rules | Arbitrary repository, account, or workspace reads |
| Scheduling, dispatch, budget, cancellation, recovery | Existing session/execution owner | Provider-owned scheduling or an extra operation journal |
| Inference receipts and persistent annotations | Existing reducer-controlled receipt/artifact boundary | Mutable semantic facts without provenance |
| Graph indexes and cached query results | Rebuildable views of existing sources and receipts | Another source of acceptance, authority, or history |
| TypeSafe request/response translation | Explicitly selected provider adapter | Automatic selection because a key or SDK exists |
| Work eligibility and founder question | Existing planner, consuming stored results | Model calls inside passive planning |

`kernel/knowledge-service/service.ts` explicitly excludes filesystem, workspace,
clock, network, and execution dependencies. Keep its pure retrieval boundary.
Shared services can assemble authorized immutable projections and previously
recorded annotations for pure query functions. Network inference runs only through
an admitted operation, not as a hidden side effect of reading knowledge.

These are logical responsibilities. A useful internal helper is not another
owner. Conversely, a second persistent graph or job table that independently
controls truth or scheduling is another owner even if it lives under `kernel/`.

## Three modes of computation

Use deterministic code for parsing, identity resolution where exact keys exist,
authorization, arithmetic, dependency scheduling, validation, and effect execution.
Use semantic assessment for bounded judgments whose question and evidence are
known. Use generative work for invention or cases the current question vocabulary
does not represent.

For example, code selects the reports in the authorized product revision and
creates candidate pairs. A semantic operation assesses whether a pair describes
the same failure mechanism. A generative worker proposes a new recovery flow only
when the current catalog lacks a suitable response. That proposal enters normal
review and implementation; it does not install new behavior by describing it.

Do not force all decisions through AI. A report with an exact incident ID should
join deterministically. A missing timestamp is missing data, not an invitation to
infer one. Reserved founder decisions remain explicit.

## Semantic operation algebra

The following internal operators are consumer-business building blocks, not a
public general-purpose automation language.

| Operator | Input and output | Required limitation |
| --- | --- | --- |
| `select` | Deterministic authorized source selection to candidate IDs | Preserve selection scope and omitted coverage |
| `project` | Source references to a bounded typed state | Record omitted fields, missing sources, and projection revision |
| `assess` | State plus atomic question pack to typed distributions | Each question reads only its declared state, not sibling answers |
| `semanticFilter` | Candidates plus predicates to classified candidates | Unknown differs from false; required work is never silently pruned |
| `semanticJoin` | Candidate pairs to typed relationships | Same entity, same mechanism, and related context are separate predicates |
| `classifyEdge` | Endpoints and evidence to relation assessments | Supporting, conflicting, insufficient, and irrelevant evidence remain distinct |
| `traverse` | Seed IDs and admissible edge types to bounded paths | Enforce visited sets, depth, beam, candidate and inference budgets |
| `reduce` | Keyed, typed results to a deterministic summary or ranking | Version weighting and tie-breaking; preserve conflicting and missing evidence |
| `proposeWork` | Results plus existing recipe policy to a work proposal | No execution, authority grant, acceptance, or product mutation |

The initial implementation supports only the subset exercised by the feedback
pipeline. Add an operator when a named consumer needs it. Avoid a universal query
language whose broad interface is justified only by hypothetical reuse.

Every operator declares inputs, outputs, source scope, data dependencies, resource
cost bounds, effects, and partial-result behavior. A question pack is a versioned
resource containing explicit instructions and answer contracts. It is not just a
set of suggestive identifiers. Questions identify relevant state paths because
question IDs are not instructions to the provider model.

## Compilation and planning

Compilation is pure. It validates the recipe, resource digests, question types,
field references, candidate limits, provider coverage, and permitted operator
composition. It produces a typed intermediate representation and an explain view.
It does not call a model, discover a credential, reserve money, or fetch private
sources.

The compiler separates three kinds of edge:

1. Data dependency: an input value or record set does not exist until another
   operation completes. This requires ordering.
2. Result-use condition: code will consume an already computable result only if
   another result selects a branch. Assessment may run speculatively.
3. Authority or resource dependency: a prerequisite must hold before data access,
   paid inference, or another effect. Speculation cannot cross this boundary.

A branch can be logically conditional without its questions being data-dependent.
For a report about unexpected payment after long setup, onboarding effort, offer
expectation, implementation mismatch, and wrong-audience fit can be assessed in
one round when all necessary evidence is already present and in scope. Retrieving
a newly identified journey and assessing its details needs a later round.

The explain view records required inference rounds, batch groupings, estimated
upper-bound questions and candidate pairs, excluded candidates, coverage limits,
selected provider bindings, and reasons for retaining sequential stages. Report
unknown cost explicitly. Optimize the critical path subject to error, privacy,
budget, and completeness constraints; do not optimize question count alone.

Equivalent recipe input, pinned resources, policy and source metadata produce the
same compiled plan and digest. Stable ordering and deterministic tie-breaking are
required. Model results are not guaranteed reproducible by recompiling a plan.

## Parallel execution

The existing execution owner admits a compiled operation under current authority,
resource claims, and budget. It materializes the authorized snapshot, reserves
bounded spend when required, dispatches through the selected provider, validates
responses, and persists a receipt before publishing derived results.

There are three distinct forms of parallelism:

* Shared-state questions: multiple atomic questions in one provider request.
* Record or pair map: bounded concurrent requests over independent projections.
* Speculative branches: independent questions for several candidate paths before
  code chooses which results to consume.

None implies unlimited context or constant total cost. Respect observed provider
limits for context, question counts, criterion counts, request size, concurrency,
rate, deadline, and response size. Do not promise that the entire knowledge graph
fits in one request. Each pair may require its own request, as in the vendor's
entity-alignment example.

Batch only compatible scope, binding, snapshot, data policy, and question-pack
requirements. Required source coverage takes precedence over opportunistic
batching. Do not put another workspace's data in a batch to save tokens. Omission,
truncation, unsupported coverage, timeout, cancellation, malformed response, and
explicit negative answers remain different outcomes.

The map stage records each input key and outcome. The reduce stage is deterministic
and declares how incomplete maps affect coverage. A failed shard cannot disappear
from a denominator. A partial ranking cannot claim to cover every candidate.

Transport attempts use the existing request identity and recovery boundary.
Distinguish logical request, provider attempt, and recorded result. A timeout may
leave billing or processing uncertain. Where the provider cannot reconcile a
request, record that limitation and require the selected retry policy and remaining
budget. A local idempotency key alone does not establish exactly-once billing.

Cancellation stops new dispatch, attempts transport cancellation where supported,
and settles or marks all in-flight attempts before releasing ownership. Late
responses cannot commit after loss of the relevant ownership generation or against
a different source revision.

## Provider-independent result contract

Keep the useful native distinctions rather than flattening everything into one
number. Choice carries option probabilities and the selected option. Score carries
ordered criteria, the distribution, and its expected level. Noul carries a binary
proposition probability. Missing confidence is not fabricated for Noul.

Validate exact expected question IDs and option labels, numeric finiteness, ranges,
distribution normalization within a declared tolerance, and score consistency.
Reject missing or duplicate answers and unsupported response versions. An HTTP
success and a TypeScript cast do not establish a valid semantic result.

A receipt identifies at least:

| Field group | Required contents |
| --- | --- |
| Identity | Schema version, logical request and attempt IDs, workspace and occurrence identity |
| Inputs | Source IDs and revisions, projection version/digest, coverage and omissions |
| Program | Plan and question-pack digests, canonicalization version, declared operator |
| Provider | Selected binding, adapter digest, requested model/version, returned model identity when available |
| Results | Complete validated per-question outputs and explicit per-question failures |
| Evidence class | `inference`, independently observed facts referenced separately, not accepted truth |
| Operations | Dispatch/response times, status, measured latency, usage and actual/estimated/unknown cost |
| Privacy | Data classification, approved purpose, retention/erasure references, sanitized correlation metadata |

Keep policy application separate. A decision-policy receipt references the source
inference receipt and policy digest, records its deterministic result, and describes
why an alternative was excluded. It does not rewrite the model's output.

Confidence derived from a distribution is not an independent corroborating
witness. A middle expected score can hide a polarized distribution. Separate
questions can have correlated errors; do not multiply answers into a purported
end-to-end success probability without a validated joint model.

If a hosted model alias does not identify an immutable model revision, record the
limitation. Replaying stored answers through code can be reproducible; rerunning
the provider need not be. Model drift policy must not invent version guarantees.

## World graph, expertise graph, and work graph

Keep their meanings separate. The world graph describes consumer-business objects.
Workspace documents and accepted source owners hold its instances. The expertise
library holds sourced methods and conditions of use. The agent/work graph describes
work and its execution obligations.

A semantic graph view links these through explicit references:

```text
Customer observation
  -> candidate failure mechanism
  -> affected journey or product obligation
  -> supporting and contradicting observations
  -> conditionally applicable method
  -> candidate intervention or evidence-gathering action
  -> ordinary work proposal
```

The graph view is a projection. A model may propose `reportsSameFailureAs`,
`usesSameMechanismAs`, `supportsClaim`, `contradictsClaim`, or `applicableUnder`.
Those identifiers are illustrative until the ontology contract is reviewed.
Authoritative identity links require their existing acceptance process. Similarity
never automatically merges entities, user identities, requirements, or experiments.

An inferred edge retains subject/object IDs and versions, predicate definition,
context digest, supporting source spans, inference receipt, policy version,
assessment outcome, and validity/invalidation reason. Verify cited span existence
against the selected source before judging its relevance. An existing excerpt is
not necessarily support for the asserted relationship.

Keep relation type and evidence sufficiency as separate dimensions. Two reports
can clearly describe related but distinct mechanisms. Alternatively, there may be
too little evidence to tell whether they describe the same one. Those cases need
different next actions and must not share a single ambiguous middle score.

### Computed applicability

Some relationships depend on the current query. A method can be applicable to one
product stage and inappropriate after a scope or audience change. Evaluate
applicability over the method's context, counterconditions, required evidence, and
the exact product snapshot. Cache it as a context-bound inferred edge, not a
universal fact about the method.

Unknown applicability remains unresolved. It cannot remove a required reference
from a worker brief. Selected-provider procedures must not be replaced by more
semantically similar instructions for an unselected provider.

### Competing paths

Traversal retains several supported interpretations rather than committing to the
first plausible label. Expand a bounded beam, deduplicate visited states, and apply
source and scope restrictions at each expansion. Record pruned paths and coverage
limits. A path ranking is a search heuristic, not the probability that a complete
business explanation is true. Preserve contradiction paths so review can see
where evidence disagrees.

## Cache, replay, and invalidation

Cache inference by the complete semantic input identity: workspace/security scope,
source revisions and projected bytes, projection and question-pack digests,
provider binding, adapter/response contract, model identity or explicit alias
freshness bound, canonicalization version, locale where material, and purpose.
A cache entry is a receipt reference, not permission to use the data or perform work.
Recheck authorization before reuse.

Policy-only changes may replay stored valid distributions without paid inference.
Changes to questions, source content, relevant model identity, or projection need
new assessment. Store selection policy separately from the cached inference.
No result becomes current merely because its TTL has not expired.

A source-owner change invalidates the dependent annotations, materialized views,
and pending proposals using reverse references. Reject a stale result at commit.
Preserve historical provenance, subject to deletion policy. A semantic assessment
that something is probably unaffected never bypasses existing source fingerprints
or acceptance invalidation.

Deletion propagates to source snapshots, projections, cached responses, derived
edges, and subject-linked outputs, under the existing authorized erasure mechanism.
Retain only allowed non-identifying erasure metadata. Hashes and opaque IDs can
still be identifying and are not automatic exemptions. Rebuildable indexes cannot
resurrect erased data.

## First end-to-end recipe: feedback to work

Input is a source-backed observation already collected by an authorized route. The
recipe does not add a webhook subscription or polling service. It receives events
through existing admitted occurrences or explicit operator execution.

The recipe performs deterministic scope selection and candidate generation, then
parallel alignment and relationship assessment. It retrieves relevant product,
journey, evidence, and expertise records. It evaluates competing paths and candidate
responses, then emits a bounded proposal for the current planner.

One fixture must contain differently worded reports about the same problem. A
second must contain similarly worded reports about different problems. A third
must lack enough evidence and yield an observation request instead of a repair.
A fourth must include contradictory evidence and retain the conflict. Include an
untrusted instruction in a report and prove it cannot change bindings, questions,
authority, or tool access.

Initial mode is shadow: the pipeline records assessments and candidate work without
changing eligibility, asking the founder, accepting evidence, or dispatching a
repair. Compare with a deterministic baseline and the existing agent workflow on
held-out cases. Admission to advisory mode requires independent review of actual
misses, false joins, abstentions, relevant next actions, latency, cost, and human
intervention. Production policy requires a separate readiness decision.

## Evidence-seeking planning

Stored semantic results may help order otherwise eligible work. They cannot make
ineligible work eligible. Distinguish missing retrievable evidence, missing real
observation, conflicting interpretation, and a founder preference or authority
question. Each maps to a different class of next action.

Use measured dependency impact and cost where available. Any predicted information
gain begins as a labeled heuristic. Rank only within the same permitted priority
class. Preserve the existing founder-approval precedence and at-most-one-question
behavior. A question bound to an old revision must not be presented as current.
The planner performs no new inference, cache refresh, or provider discovery.

## Product-level extensions

### Incremental product compilation

Assess candidate changes against product obligations, authored claims,
implementation references, and independent evidence. Emit review obligations and
candidate tests. Deterministic set coverage can propose an economical test set,
but selected tests must run and existing mandatory tests remain required. Semantic
change analysis may add review; it may not waive fingerprint invalidation.

### Design exploration

Generate multiple substantive directions and assess a vector of product-specific
criteria. Preserve nondominated alternatives rather than collapsing originality,
clarity, accessibility, identity fidelity, and implementation completeness into a
universal beauty score. Hard requirements are non-compensatory. Diagnose concept,
composition, copy, interaction, and implementation defects separately so repairs
can remain local. Actual visual and motion judgment requires suitable independent
visual/device evidence; text interpretation is not screenshot inspection.

Coordinate this work with existing issue #403 and its reference-led creative-loop
requirements. Do not create a second design acceptance or experience ledger.

### Opportunity research

Map authorized research observations into contexts, problems, workarounds,
explicitly reported costs, mechanisms, and counterevidence. Use bounded semantic
joins and map-reduce to construct source-backed opportunity hypotheses. Repetition
of syndicated text is not independent demand. Preserve source independence,
recency, population, and research coverage. A hypothesis does not approve a product,
claim willingness to pay, or authorize acquisition spend.

### Cross-business learning and question discovery

Transfer candidate mechanisms rather than visual templates or broad category
advice. Compare context and counterconditions before suggesting reuse. Workspace
identity, consent, measurement contracts, and existing comparability checks remain
binding. No raw cross-business customer-data pooling is implicit.

A later experiment can propose question packs, extract semantic features from
historical exposure-time snapshots, and compare them with independently observed
outcomes. Hold out entire businesses or periods where relevant. Keep the model
that proposes a question from supplying its own success label. Associations motivate
experiments, not causal promises. Promote a question pack only through reviewed,
versioned resource changes; no autonomous mutation of decision policy.

### Generated AI-powered applications

A separately approved connected application can use product-specific semantic
predicates over a finite set of tested actions. Brigade generates the graph or
catalog projection, question pack, deterministic decision policy, clarification
behavior, fallback, and regression tests as one product component.

The component interprets meaning but cannot invent privileged actions or arbitrary
UI states. Exact quantities use explicit parsing or clarification. Server-side
secrets, request deadlines, cost limits, data minimization, deletion, and an offline
or unavailable-service fallback are mandatory where applicable. A user can inspect
and correct material interpretations.

This does not change TUCK's accepted offline scope. Build-time assessment is a
separate use from sending a TUCK user's packing data to a hosted model. There is no
claim of an on-device TypeSafe model or automatic rule distillation.

## Proof and rollout

Freeze evaluation cases before tuning question packs. Include no-match,
insufficient-context, contradictory, stale-revision, privacy-boundary, and
provider-failure cases. Measure candidate-generation recall separately from
assessor accuracy: a perfect assessor cannot recover a pair that was never shown.

Report at least quality and coverage at the downstream decision boundary, false
joins, missed contradictions, abstention rates, source-link validity, human
correction effort, dependent inference rounds, p50/p95 end-to-end latency, actual
or explicitly estimated cost, cache contribution, and cold-start behavior. A small
pilot cannot establish rare-failure safety. Set release thresholds before the
held-out run; do not invent favorable thresholds after observing results.

Use metamorphic tests for irrelevant reordering/paraphrase, addition of an explicit
violation, missing evidence, injected instructions, and repeated evidence. Require
complete uncertainty reporting during shard failures and model drift. Mock results
prove wiring and control flow; pinned official examples or captured responses prove
provider contract fit; authorized live runs measure actual provider behavior.

Roll out disabled, shadow, advisory, then explicitly admitted execution. The last
mode still uses existing authority and independent acceptance. Rollback disables
new semantic decisions without deleting history or reviving stale proof. Failure
returns to the approved deterministic/manual path or an explicit hold; it never
silently selects another provider.

## Sources and interpretation

Reviewed as public documentation on 2026-09-17. Mutable pages are discovery
references, not immutable implementation pins. The provider qualification unit
must capture the reviewed source/API/SDK revisions before implementation.

* [TypeSafe introduction](https://docs.typesafe.ai/introduction): typed questions,
  shared-state independent evaluation, atomic judgments composed in code.
* [AI-powered software](https://docs.typesafe.ai/concepts/how-to-build-with-system-one)
  and [use cases](https://docs.typesafe.ai/concepts/use-case-map): code-controlled
  workflows, map-reduce, graph annotation and relationship use cases.
* [Speculative fan-out](https://docs.typesafe.ai/patterns/fan-out) and
  [parallel questions](https://docs.typesafe.ai/cookbooks/parallel_questions):
  independent assessments and batching; vendor example measurements are not an SLA.
* [Entity alignment](https://docs.typesafe.ai/cookbooks/entity_alignment):
  pair assessments and per-field judgments; not unlimited all-pairs throughput.
* [Hierarchical classification](https://docs.typesafe.ai/cookbooks/hierarchical_classification):
  several paths per round; path ranking is not causal or business-outcome proof.
* [Feature discovery](https://docs.typesafe.ai/cookbooks/autoresearch_feature_discovery):
  candidate question generation and outcome-based evaluation on the vendor example.

The compiler integration, context-bound inferred graph, work-selection policy,
and consumer-business applications in this document are Brigade design proposals,
not claims that TypeSafe implements those systems for us.
