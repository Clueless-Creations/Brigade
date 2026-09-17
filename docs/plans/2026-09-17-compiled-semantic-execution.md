# Compiled semantic execution delivery plan

Date: 2026-09-17. Status: proposed, not implemented.
Architecture: [semantic execution](../semantic-execution.md) and
[ADR-0016](../decisions/0016-compiled-semantic-execution.md).

SQ IDs are stable planning identifiers for this program, not GitHub issue numbers
or replacements for existing U IDs. Keep implementation progress in GitHub issues.
The architecture PR does not close implementation work or activate a provider.

## Goal capsule

Make a source-backed business observation flow through deterministic selection,
parallel semantic checks, a provenance-bound graph view, conditional expertise and
an ordinary work proposal. Prove that this is more useful than repeatedly asking
an agent to interpret the same relationships. Preserve the existing owners for
composition, knowledge, planning, execution, authority, evidence and workspace
state. A no-adoption result is valid when the measured benefit is insufficient.

The first slice is feedback-to-work in one synthetic or separately authorized
business context. The architecture can support other scenarios, but the initial
implementation does not require a generic query language, graph database,
portfolio platform, new model service or generated-app framework.

## Requirements

| ID | Requirement | Principal proof |
| --- | --- | --- |
| R-SQ-01 | Code owns control flow; semantic checks are typed, bounded operations | Compiler/IR and dispatch fixtures |
| R-SQ-02 | Independent checks share eligible stages; true data dependencies retain rounds | Branch and dependency fixtures |
| R-SQ-03 | Inference never grants authority or acceptance | Type-confusion, authority and review negatives |
| R-SQ-04 | Graph relationships remain derived and context-bound | Reconstruction, source-span and identity tests |
| R-SQ-05 | Passive services remain passive | Zero-write and zero-inference assertions |
| R-SQ-06 | Selected provider, source scope, budget and privacy are enforced | Boundary and transport conformance tests |
| R-SQ-07 | Partial, unknown, contradictory and missing evidence remain distinct | Per-case coverage and failure reports |
| R-SQ-08 | Cache/replay/invalidation/erasure follow current owners | Stale result, crash, deletion and replay tests |
| R-SQ-09 | Evidence measures downstream usefulness, not only schema success | Frozen baseline/candidate evaluation |
| R-SQ-10 | New behavior is opt-in, observable and reversible | Shadow/advisory/rollout and rollback proof |

## Units and dependencies

This table defines work, not completion state. Independent units can be researched
in parallel. Overlapping contract, reducer, compiler and catalog edits have one
integrator. A dependency means its required contract and proof are integrated, not
that a related draft or issue exists.

| Unit | Outcome | Hard prerequisites |
| --- | --- | --- |
| SQ-01 | Define typed semantic query, question-pack, result, and receipt contracts | None |
| SQ-02 | Qualify TypeSafe as a selected semantic-assessment provider | None |
| SQ-03 | Establish semantic-execution baselines and held-out decision-quality evaluation | SQ-01 |
| SQ-04 | Implement the TypeSafe adapter with strict decoding and controlled effects | SQ-01, SQ-02 |
| SQ-05 | Lower semantic query plans in the existing composition compiler | SQ-01 |
| SQ-06 | Build scoped source projections and candidate generation for semantic operators | SQ-01, SQ-05 |
| SQ-07 | Schedule shared-state batches, speculative checks, and bounded map-reduce | SQ-04, SQ-05, SQ-06 |
| SQ-08 | Add provenance-bound semantic relationships as derived graph views | SQ-01, SQ-06 |
| SQ-09 | Evaluate context-bound knowledge applicability and retain competing graph paths | SQ-07, SQ-08, SQ-10 |
| SQ-10 | Persist inference receipts with policy replay, scoped caching, invalidation and erasure | SQ-01, SQ-07, SQ-08 |
| SQ-11 | Prove the feedback-to-work semantic pipeline in shadow mode | SQ-03, SQ-07, SQ-08, SQ-09, SQ-10 |
| SQ-12 | Rank eligible next work by evidence gaps and decision impact | SQ-11, SQ-18 |
| SQ-13 | Compile semantic change-impact and obligation-to-test review proposals | SQ-08, SQ-09, SQ-10, SQ-11, SQ-18 |
| SQ-14 | Preserve design diversity with parallel defect diagnosis and targeted repair | SQ-03, SQ-09, SQ-11, SQ-18 |
| SQ-15 | Compile source-backed opportunity research with semantic map-reduce | SQ-03, SQ-07, SQ-08, SQ-09, SQ-10, SQ-18 |
| SQ-16 | Learn transferable product mechanisms and evaluate new semantic questions | SQ-03, SQ-08, SQ-09, SQ-10, SQ-11, SQ-18 |
| SQ-17 | Generate bounded AI-powered product components with tested fallback behavior | SQ-01, SQ-04, SQ-05, SQ-07, SQ-10, SQ-18 |
| SQ-18 | Prove semantic-runtime safety, recovery, observability and staged rollout | SQ-03, SQ-04, SQ-07, SQ-08, SQ-10, SQ-11 |

SQ-09 depends on SQ-10 even though its identifier sorts earlier. Use the dependency
graph, not numeric issue order, for dispatch. SQ-18 proves integrated readiness
using SQ-11 shadow evidence; later advisory/product consumers depend on SQ-18.
It does not block building the shadow slice or defer safety obligations in earlier
units. There is no dependency cycle.

## Delivery sequence

### Foundation and measurement

SQ-01 defines experimental contracts and the first concrete query. SQ-02 qualifies
the TypeSafe relationship and independent native fixtures. SQ-03 freezes baselines
and evaluation cases before candidate tuning. These are bounded design/proof units;
source qualification does not require credentials or actual activation.

### Executable semantic slice

SQ-04 adds the selected provider adapter. SQ-05 lowers typed semantic work inside
the existing compiler. SQ-06 supplies scoped immutable projections and candidates.
SQ-07 executes shared-state and map batches through the current session owner.
SQ-08 introduces only required inferred relationship types and derived views.
SQ-10 supplies persistence, policy replay, invalidation and erasure. SQ-09 adds
contextual applicability and bounded competing-path traversal.

Each unit includes its own authority, privacy, failure and non-regression tests.
Do not build a broad framework first and postpone its first consumer. Keep the
concrete feedback query and frozen cases available throughout implementation.

### End-to-end proof and admission

SQ-11 composes the actual owners into a shadow feedback-to-work recipe. SQ-18
verifies integrated boundaries, failure recovery, public projections and rollout.
An independent review determines whether the evidence supports advisory use.
Existing deterministic/manual behavior remains available while semantic behavior
is disabled, held or rejected.

### Further consumers

SQ-12 adds evidence-seeking priority inside the current eligible frontier. SQ-13
adds semantic affected-set/test proposals to the existing cascade. SQ-14 evaluates
design alternatives without replacing creative work or independent visual review.
SQ-15 applies map-reduce to already authorized research. SQ-16 investigates
mechanism transfer and question discovery with real measurement discipline.
SQ-17 generates an explicitly scoped connected-app component with finite actions
and a tested fallback. These are separate PRs with separate proof, not an excuse
to broaden the first slice.

## Existing issue ownership

| Existing issue | Responsibility retained | New program relationship |
| --- | --- | --- |
| #73 | Workflow overhead and dispatch-cost measurement | SQ-03/07/18 reuse its accounting and compare dependent rounds |
| #74 | Structural, semantic and runtime proof distinctions | SQ-01/08/10/18 preserve proof class and independent acceptance |
| #75 | Retrieval-to-worker evaluation before new infrastructure | SQ-03/06/09 extend cases and delivery evidence, not replace retrieval blindly |
| #76 | End-to-end change propagation and accepted repair | SQ-08/10/13 provide narrowly required inferred relations and proposals |
| #109 and ADR-0013 | Provider architecture and upstream conformance | SQ-02/04 follow the established lifecycle |
| #403 | Continuous experience and reference-led creative-loop delivery | SQ-14 supplies candidate/defect checks; #403 retains final creative/delivery proof |

Refresh these issues and open PRs before publishing or starting work. Public issue
retrieval in the drafting session was incomplete; no claim of exhaustive duplicate
search is made. Existing work is neither closed nor reopened by this plan. If a
related implementation already supplies a requirement, link its proof and reduce
the new unit instead of building it again.

## Ownership and dependency direction

Contracts remain independent of internal runtime and providers. Catalog/recipe
resources define question packs and policy; their compiled projections retain the
existing resource pin. The composition owner validates and lowers semantic query
plans. Shared services resolve authorized sources and stored observations. The
knowledge service remains pure. Provider adapters execute admitted inference;
existing session/reducer owners hold operation progress, budget and receipts.
Entrypoints project shared services and cannot import a provider to bypass them.

The graph read model and caches are derived from existing owners. Business truth
stays in product/design/research sources, accepted observations and Git. New
semantic modules are helpers behind those contracts, not another task store,
knowledge database, scheduler, reducer, public router or authority mechanism.

No existing migration unit or KTD is silently rewritten. The semantic plan extends
the target with proposed ARCH-16/17 and explicitly coordinates current logical
owners. Exact files beneath those owners must be confirmed at the implementation
head; directory suggestions in issues are not invented evidence of existing APIs.

## Verification contract

Freeze the following scenarios before tuning:

| Case | Required result |
| --- | --- |
| Different wording, same failure | Relate the mechanism; preserve distinct observations and provenance |
| Similar wording, different failures | Keep separate; no false entity or problem merge |
| No matching method | Explicit none/unknown, not forced best-option endorsement |
| Missing decisive evidence | Propose retrieval/observation, not an invented conclusion |
| Conflicting evidence | Preserve conflict and competing paths |
| Useful second interpretation | Bounded traversal can recover after a misleading first branch |
| Stale source/model/question context | Invalidate relevant cache/edge/proposal; no stale commit |
| Unknown/partial shard | Report incomplete coverage and correct denominators |
| Injected source instruction | No changed questions, tools, binding, data purpose or grants |
| Duplicate event/uncertain request | Reuse operation identity; no unaccounted replay or duplicate work |
| Authorization withdrawn/cache hit | Refuse prohibited reuse or execution |
| Erasure after receipt acceptance | Remove covered snapshots/edges/cache; rebuild cannot restore data |
| Provider unavailable | Explicit hold or approved fallback, never silent model substitution |
| Passive status/plan/knowledge read | No paid inference, hidden refresh or workspace mutation |
| Hard design constraint failure | No compensation from a high creativity score |

Record exact source/pack/policy/model/adapter versions and all scope limitations.
Separate three evidence classes: deterministic fixture/control-flow proof,
independent upstream-native conformance, and separately authorized live outcomes.
A fake provider is not native conformance. A hosted response is not proof of a
consumer app's behavior. A synthetic graph is not a measured business result.

Relevant focused commands include existing `check:graph-foundations`,
`check:architecture`, `test:fixtures`, `test:boundaries`, `test:public-api`,
`check:public-api`, `check:catalog`, `check:upstreams`, `check:credits` and
`check:engine-e2e`, selected by touched scope. Register added fixtures in current
runners; do not invoke invented npm scripts.

The final gate authority is current CONTRIBUTING. At the reviewed baseline it
requires `npm ci`, presubmit, explicit full `npm run audit:ci`,
`npm run hosted:check`, and `npm run app:check` at checkpoint/final verification.
Record the local `validate:skill` result or its actual missing-tool/skipped state
when applicable. Green presubmit does not imply full audit. Do not bypass branch
protection, independent conformance or deferred suites.

## Definition of done

For the architecture PR: updated target rules, detailed contracts, decision,
conformance dimensions, current-implementation disclaimer, documentation/provider
indexes and this plan agree; no runtime support is falsely claimed; a final-head
independent reviewer and required repository checks are recorded.

For the first runtime slice: the real service/compiler/session/reducer paths execute
the frozen feedback query in shadow, preserve the negative controls, and produce
source-backed results with honest coverage and cost. An independently reviewed
comparison supports adoption or rejects it. Later modes require explicit admission.

For each consumer: its issue-specific observable behavior, existing owners,
regression proof and remaining live limitations are documented. An architecture
merge cannot close these implementation issues.

## Migration and rollback

Existing default workflows and pinned businesses continue without TypeSafe. Importing
or discovering a question pack does not activate it. New semantic resources use
experimental versions until external-package and business proofs justify stability.
Composition changes follow current explicit preview/apply and recovery rules.

Rollback disables new semantic policy influence and cancels undispatched admitted
work through existing mechanisms. It preserves allowed historical receipts,
reconciles uncertain effects and does not restore erased data or stale acceptance.
Connected runtime behavior remains outside TUCK's offline scope unless the founder
explicitly changes that product contract.
