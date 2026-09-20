---
title: "feat: Define Product Profile v1 and truth ownership"
type: feat
date: 2026-09-20T09:31:55-05:00
issue: 563
status: proposed
planning_baseline: fbbb23f7ef4eed1e48d75516a4df854e2debd9ef
---

# Product Profile v1: contract and implementation plan

## Summary and decision gate

Scope: #563 only. Define one versioned product representation with explicit source ownership, stable identities, evidence provenance, and reference-profile compatibility. Deliver its validator, examples, and a small read-only interoperability seam before the dependent producers and query features.

This is a proposed plan, not an accepted architecture decision or an implemented contract. **HoE must settle this plan before `@ce-work` starts.** Record settlement on #563 or its pull request, referencing the plan revision and the KTD decisions below. Silence, a generated approval field, and the implementer's own review are not settlement.

The planning pull request changes only this file. It does not close #563. Implementation, independent conformance review, and the required final checks must precede closure.

### Assigned lane

The authorized order is #563, then #564, then #567, with one deepen/work item active at a time. This plan does not deepen those later issues. #565, #566, #568, #569, and #570 remain held until #563 lands. #562 remains the coordination epic, not this plan's implementation unit or first deliverable.

Do not edit, replace, merge, or open competing work for Shepherd's #129 / PR #587 or queue #127, #403, #397, #395, #213, #6, #3, #2. Do not change their acceptance or close them as a side effect.

Publication remains held under #26. No App Review, pricing changes, Formation work, release tags, deployments, account changes, or paid inference are authorized here.

---

## Problem frame and source evidence

The current architecture names a planned Product Profile but does not yet provide the foundational contract in `contracts/`. Without a shared contract, the intended producer, observed producer, Dissector, and query service could create incompatible product models or treat observations as accepted requirements.

The following evidence was inspected at the planning baseline. Refresh main and active ownership before implementation; this table is not a claim about later revisions.

| Source | Relevant finding |
| --- | --- |
| `AGENTS.md`, architecture and truth ownership | `product.yaml`, `DESIGN.md`, reducer/evidence state, Git, and the local registry already own different facts. Profiles must project them. |
| `docs/north-star-architecture.md`, ARCH-02, ARCH-05, ARCH-06, ARCH-07 | One logical execution/state owner; strict versioned contracts; pinned inputs; no competing product-truth store. |
| `docs/architecture.md`, Planned Product Profile projection | The profile remains a proposal, not a supported command. |
| `docs/decision-driven-building.md`, Product Profiles and passive reads | Observation mode and reference origin must remain distinguishable. Reads execute no inference. |
| `contracts/semantic/questions.ts` | Existing contracts use strict Zod schemas, bounded fields, inferred TypeScript types, and separate consistency checks. |
| `contracts/source-access.ts`, `validateSourceAccess` | App-source write claims cannot grant writes to product, design, authority, or execution-state owners. |
| `kernel/services/source-projection.ts`, `projectAuthorizedSources` | A service seam already handles caller-supplied pinned sources, authorized scope, omissions, and unresolved revisions without network access. Reuse its ownership, not an additional source store. |
| `tooling/render-public-api.ts` | One existing renderer emits JSON Schema 2020-12 from typed contracts. Imported artifact schemas must use strict input semantics, not its additive operation-result transformation. |
| `checks/validation/repository/check-architecture.ts` and its architecture fixtures | Existing dependency checks are available. They do not by themselves prove Product Profile ownership, provenance, or truth. |
| #563, #564, #567 | #563 requires reference round-trip/queryability proof; #564 owns the intended producer; #567 owns bounded connected-subgraph retrieval and context projection. |

At inspection, PR #587 was open on a separate branch and included a package stamp. This planning change reserves no stamp and changes none of its paths.

Applicable rules: ARCH-01, ARCH-02, ARCH-05 through ARCH-13, ARCH-15, ARCH-16, ARCH-17. Use the existing [conformance protocol](../architecture-conformance.md), [decision-driven design](../decision-driven-building.md), and ADR-0016. Do not introduce a Jev-specific contract, compiler, or controller.

---

## Requirements

These plan-local R IDs trace #563. They do not replace GitHub issue IDs or migration-unit IDs.

| ID | Required outcome |
| --- | --- |
| R1 | A versioned `product-profile/v1` contract validates intended and observed profiles with one shared model. |
| R2 | Stable product, record, relationship, and snapshot identities have distinct meanings and documented lifetimes. |
| R3 | The model covers every product concept listed in #563, including causal behavior and non-visual feedback. |
| R4 | Each assertion retains its epistemic basis, contributing sources, revisions, and evidence references. Unknown and unobserved are not negative findings. |
| R5 | A truth-ownership contract states which existing owner governs each responsibility and what happens on disagreement. No profile operation edits or accepts source truth. |
| R6 | A reference profile is compatible with the base representation, with isolated reference metadata and no duplicated core semantics. |
| R7 | Round-trip and import tests read a reference profile through the same minimal Product Profile service used for other modes. |
| R8 | Contract validation and reads are deterministic, bounded, read-only, and inference-free. Evidence is referenced, not fetched implicitly. |
| R9 | An ADR and narrow architecture updates explain dependencies, authored/generated ownership, migration, and breaking-change rules. |
| R10 | Examples, adversarial fixtures, schema-generation checks, independent conformance review, and applicable repository gates support the exact closure claim. |

---

## Key technical decisions proposed for HoE settlement

### KTD1. One base model; mode and origin are separate

Use `product-profile/v1` as the canonical serialization identity. Keep mode (`intended` or `observed`) separate from origin (`managed` or `reference`). An observed managed app is not a reference merely because it was inspected.

In this first contract, reference origin is an observed profile with a validated reference extension. Do not introduce a second foundational `reference-product-profile/v1` payload. #563 explicitly permits this equivalent representation. Do not claim compatibility with an uninspected historical Dissector format.

Reference metadata holds capture provenance, the observed version/build or an explicit unknown, capture scope and constraints, and dissection provenance. Shared product identity, graph records, claims, and coverage remain in the base. Reference metadata must not supply overrides for core fields. The standalone Dissector does not take target-product decisions or decide what another business should copy.

### KTD2. Typed product records, not a new general graph platform

Use a common envelope and typed records with stable IDs and typed relationships. Define these semantic categories in the contract, rather than packing them into arbitrary strings or an unconstrained metadata bag:

| Product concepts | Required representation |
| --- | --- |
| Identity and version | Product identity; source/product version when known; observed build when known; separate projection revision and contract version. |
| Domain and mechanics | Entities, systems, persistent mechanics, and their data/behavior relationships. |
| Experience | Distinct states and surfaces; transitions with source/destination state, trigger, and supported conditions; journeys with stable, ordered step identities. |
| Causality | Events, effects, and directional causal relationships whose support is independently identifiable. Visual adjacency is not causation. |
| Design | Visual foundations, components, navigation patterns, motion families, and gesture families. |
| Feedback and content | Feedback patterns with distinct haptic/audio/visual modalities; content patterns. |
| Technical observations | Observable technical characteristics with the environment and observation basis preserved. |
| Knowledge limits | Claims, evidence/source references, coverage boundaries, contradictions, and explicit unknowns. |

The schema must validate relationship endpoint kinds and local referential integrity. Missing external evidence bodies are allowed as explicitly unresolved references; a dangling internal node reference is not.

Do not add a graph database, scheduler, per-agent journal, query language, workflow DSL, provider-native payload, or mutable profile-authoring API. The typed graph is a projection of product facts, not another execution graph.

### KTD3. Stable identity is not a content hash or a display label

Reuse stable IDs from authoritative source owners where available. Scope record IDs by product identity and record kind. Preserve identity when labels, ordering, descriptions, or evidence change. Never derive durable record identity from an array position or mutable text.

A snapshot digest may identify serialized content; it must not become the product ID or replace a record's identity. Pin the contributing source revisions and the projection/contract version separately. Canonicalization must not destroy meaningful journey order.

For sources without a durable ID, the producer must use an explicit source-owned identity or retain an unresolved identity mapping. It must not invent a parallel identity registry. #564 owns the producer-specific mapping after this contract lands.

Observed records may have capture-scoped identities until correspondence is supported. Similar labels across captures or products do not authorize a merge. Preserve explicit correspondence evidence and aliases; a cross-product composition creates target-owned identities and retains reference lineage rather than transferring reference authority.

### KTD4. Epistemic basis, support, freshness, and acceptance are different

Represent an assertion's basis explicitly: declared by a source, directly observed, inferred from identified inputs, or unknown. Represent supporting/contradicting/unresolved evidence separately. Represent freshness against source revisions separately again. A single `verified` boolean cannot express these facts.

An intended assertion references accepted source material through its existing owner. An observed assertion references an observation and its environment. An inferred assertion references its derivation or existing semantic receipt and does not masquerade as accepted intent or direct observation. Unknown assertions give the missing condition without manufacturing a value.

Acceptance stays with the existing source/reducer owner. A submitted profile's claimed acceptance, a matching hash, a timestamp, a model's confidence, and a successful schema parse cannot establish that acceptance. Consumers must resolve acceptance/freshness through the authoritative path when they need to act on it. Without that resolution, return unverified or unresolved, not current-and-accepted.

Coverage states distinguish covered, partial, not observed, blocked, and outside the declared scope. Completeness is relative to a named scope and revision, not an assertion that the whole app was explored. Absence requires an appropriate scoped observation; an inaccessible screen is not proof that a feature is missing.

Evidence references retain the original modality and any derivation. A text report of an animation is not direct video observation. Physical haptic behavior remains unknown without suitable evidence. No confidence field or acceptance receipt is synthesized to fill a gap.

### KTD5. Existing owners win within their responsibility

| Responsibility | Owner that governs a disagreement | Profile behavior |
| --- | --- | --- |
| Accepted promise, audience, scope, requirements, journey, and product decisions | `product.yaml`, with accepted detailed artifacts referenced by that owner | Retain source references and flag stale/conflicting projections. Correct the source through its existing accepted-change path, never by editing the profile. |
| Rendered product description | `PRODUCT.md` is derived, not an independent owner | Do not promote rendered prose over the source that produced it. A mismatch is rendering/projection drift. |
| Global experience/design decisions | `DESIGN.md`; detailed contracts within their declared scope | Surface cross-owner conflicts. Design detail cannot silently change accepted product scope. |
| Attempts, observations, evidence, acceptance, pending work, authority, and history | Existing reducer/evidence owners | Reference their records. Importing a profile cannot create an observation, grant, reviewer, acceptance, or state transition. |
| Implemented source and authored history | Git and its exact revisions | Describe implementation separately from intended behavior and observed runtime behavior. Code presence is not runtime proof. |
| Workspace identity/address | Existing local registry | Reference workspace identity when applicable; do not create or relocate a workspace during import. |

There is no universal last-writer-wins order across different propositions. Accepted intent can require persistence while a valid observation shows persistence failing. Keep both facts and the disagreement. Do not rewrite the intent to match the defect, or discard the observation because intent says otherwise.

When an owner or its relevant revision cannot be resolved, expose the gap. Do not fall back to whichever document is easiest to read. Regeneration may replace a derived snapshot only through the existing authorized lifecycle, retaining required evidence/history semantics.

### KTD6. Small interoperability seam now; bounded query work later

#563 includes a pure import/parse and exact-ID read seam under the existing application-service layer. It consumes an already supplied profile, validates it, and returns one requested core record with its claim/provenance references and profile revision. It must use the same path for intended, observed-managed, and observed-reference profiles.

This is the smallest executable proof for R7. Round-trip means parse, serialize, parse again, then retrieve the same IDs and semantics through that shared service. Preserve the reference extension in serialization while keeping core reads independent of reference-specific metadata. Do not implement a reference-only lookup helper and call it a general service.

The seam does not read files, dereference URLs, import bundles into a workspace, fetch evidence, register public operations, or refresh stale sources. Actual reference acquisition/adoption remains #569. Multi-hop subgraphs, semantic question interpretation, intended/observed/delta selection, omission budgets, and CLI/MCP exposure remain #567. Intended generation remains #564. This boundary requires explicit HoE settlement because it is the overlap between #563's acceptance and #567's scope.

### KTD7. Single schema owner and one dependency direction

Author the typed contract in `contracts/product-profile/`, following the existing strict-schema and separate-consistency-check pattern. Generate JSON Schema 2020-12 from that owner through `tooling/render-public-api.ts`; do not maintain a handwritten second schema or register an imaginary public operation.

Use strict artifact/import semantics. Do not apply the renderer's additive public-result transformation to a profile being imported. Unknown core fields and unsupported extension/version combinations fail explicitly rather than disappearing. Document cross-record invariants that require the canonical validator in addition to structural JSON Schema; test both layers without claiming that either proves truth.

Dependency direction is existing source owners and their authorized readers -> application projection/read service -> Product Profile contract. The contract imports no kernel service, adapter, filesystem, network, workspace state, or validation runner. Consumers may depend on the contract, not the reverse. Reuse existing source-projection and evidence responsibilities without copying their storage.

Generated portions are schemas and projected profile snapshots. Authored portions are the schema source, ADR/contract guidance, accepted source artifacts in their existing owners, and clearly synthetic test examples. Hand-editing a generated profile is not an accepted product change.

### KTD8. Version the representation without silently migrating truth

Distinguish contract major, product/source version, observed build, projection implementation version, and snapshot digest. Missing product/build knowledge remains explicit; it is not substituted with the Brigade package version.

Publish one current foundational representation. Do not create compatibility shims for hypothetical installed formats. If implementation discovers a real supported reference format, stop that import boundary and present its evidence and explicit migration mapping for settlement before widening scope.

Changes to required fields, supported IDs, enum meanings, relation semantics, ownership, or interpretation require a breaking-change decision and a new contract major when they break supported inputs. An apparently additive field or enum is not automatically compatible with a strict consumer. Optional extension evolution needs explicit capability/version handling and fixture proof; unsupported consumers refuse clearly, never silently strip meaningful data.

Any future migration preserves source/evidence lineage and required history, validates before accepting the result, and does not repin a workspace or rewrite source owners on a passive read. Contract introduction does not enable publishing or release authority.

---

## Implementation units after settlement

U IDs below are local to this #563 plan. They do not renumber or claim any existing migration unit. Implement them serially within one #563 work lane and one pull request.

### U1. Record ownership and compatibility decisions

**Requirements:** R2, R4, R5, R6, R9. **Dependency:** recorded HoE settlement of this plan.

**Files:** new `docs/product-profile.md`; new `docs/decisions/<next-free-id>-product-profile-truth-ownership.md`; narrow updates to `docs/decisions/README.md`, `docs/north-star-architecture.md`, `docs/architecture.md`, and `docs/architecture-conformance.md`.

**Approach:** Recheck the ADR index at current tip and allocate the decision number in the shared-file window. Carry KTD1-KTD8 into the owning contract/ADR with links rather than duplicating another architecture manual. Keep target direction and implemented support distinct. Preserve existing ARCH IDs, independent-review rules, and Shepherd's edits.

**Verification:** The owner/conflict table covers every source named in #563. The ADR explains rejected alternatives, migration, and dependency direction. Current architecture does not advertise a CLI/MCP operation or an enabled producer before it exists. Documentation changes alone are not completion evidence for #563.

### U2. Implement the base schema and synthetic examples

**Requirements:** R1-R6, R8. **Dependency:** U1.

**Files:** new `contracts/product-profile/contract.ts`, `contracts/product-profile/index.ts`, and `contracts/product-profile/examples/{intended,observed,observed-reference}.json`; `tooling/render-public-api.ts`; generated `contracts/product-profile/schemas/product-profile.schema.json`; new `checks/verification/fixtures/product-profile.fixtures.ts` using the existing fixture runner.

**Approach:** Write failing fixtures first. Implement bounded strict fields, typed records/relations, explicit epistemic/provenance data, reference-extension validation, and consistency checks. Keep structural schema generation separate from graph/ownership consistency checks. Do not install a new schema package or test runner.

Use one fictional practice app. Model session completion affecting progress, profile-visible state, and feedback. Include navigation cancellation and an unobserved haptic claim. Cover every R3 concept across the examples; these fixtures are not observations of a real app.

**Test scenarios:**

1. Each of the three example modes passes structural and canonical validation with all required concept kinds represented.
2. Duplicate identities, dangling internal links, wrong endpoint kinds, invalid journey references, and malformed provenance fail with stable diagnostic categories.
3. Label edits and collection reordering preserve record IDs; meaningful journey reordering remains semantically different.
4. Reference-origin metadata cannot override a core node or claim. Invalid mode/origin/extension combinations fail.
5. Unknown build, unobserved haptics, partial coverage, and blocked screens remain explicit rather than receiving defaults or false absence claims.
6. A contradicted observation can coexist with accepted intent without changing either source's meaning.
7. Unknown fields, unsupported majors/extensions, over-limit input, invalid numeric values where applicable, and path/URL-like instructions cannot become executable input. Enforce declared size/count/depth limits before expensive graph processing.
8. Structural JSON Schema and the canonical validator agree on supported structure. Additional relational failures remain explicitly documented and tested at the canonical layer.

**Verification:** Every R3 category and negative case has an executable fixture. Generated schema bytes match the source. Passing validation is reported as format/conformance proof, not business acceptance.

### U3. Prove reference interoperability through the shared read seam

**Requirements:** R4-R8. **Dependency:** U2 and explicit settlement of KTD6.

**Files:** new `kernel/services/product-profile.ts`; extend `checks/verification/fixtures/product-profile.fixtures.ts`.

**Approach:** Implement only KTD6. Operate on supplied immutable input with no filesystem, HTTP, provider, reducer, or persistence dependency. Return source/profile identities, epistemic status, and unresolved freshness when an authoritative current-source resolution has not been supplied. A supplied claim of acceptance remains a claim, not a grant.

**Test scenarios:**

1. Parse/serialize/reparse each example and read the same exact IDs through the same service. Core content and reference metadata survive without a reference-only path.
2. A missing ID returns an explicit not-found result, not a generated explanation or inferred record.
3. A mismatched expected profile revision refuses current use. Missing authoritative source resolution does not become a current/accepted result.
4. Repeated reads have identical semantic output, leave frozen inputs unchanged, and invoke no evidence loader, inference provider, or state writer.
5. An embedded evidence URL is returned only as a bounded reference when in scope. It is never fetched. A reference extension cannot introduce a target-product write or selection.
6. Content containing instructions to approve work or change source owners remains inert data. No acceptance or authority receipt is created.

**Verification:** R7 has an actual shared-service round-trip test, not only a type assertion. No connected-subgraph/query feature, producer, import workflow, or new public operation has entered this slice.

### U4. Conformance, generated output, and serialized integration

**Requirements:** R8-R10. **Dependencies:** U1-U3.

**Files:** existing architecture checker/fixtures only where needed for the new dependency boundary; `docs/architecture-conformance.md`; source-owned renderer registrations; affected generated output; package stamps only in the agreed integration window.

**Approach:** Extend existing conformance coverage with negative controls for contract -> service/adapter/runtime-check dependencies and read-side effects. Do not turn source-string presence into proof of truth. Preserve existing checks and do not add blanket debt exceptions.

Refresh and rebase onto tip before shared ARCH/ADR or version edits. Reconcile PR #587's current status without modifying its lane. When runtime code is included, perform exactly one coordinated package/skill/lockfile stamp update and render through existing owners. A planning/docs-only diff has no bump. Inspect every generated diff for unrelated changes.

**Verification:** Run the focused profile fixtures, schema generation checks, typecheck, architecture/boundary checks, and the public-contract checks affected by the change. Then run the applicable presubmit and full final verification from current `CONTRIBUTING.md`, including hosted/app checks and the locally required skill validation. Record exact commits, commands, results, and unrun gates on the PR. Green presubmit is not full verification.

Obtain an actual independent conformance review of the final implementation revision. Reviewers must distinguish schema validity, source provenance, observation, and acceptance, and identify remaining unsupported runtime claims. Do not merge or close #563 while required settlement, review, or verification is missing.

---

## Decision-driven assignment and downstream handoff

**Computation:** #563 is deterministic contract/validation/read work. No Jev assessment is necessary. Later semantic interpretation consumes these records through the existing admitted semantic path, never inside passive retrieval.

**Checkpoint and source:** explicit validation/import/read against a named profile revision and its source references. No automatic lifecycle refresh or decision dispatch is introduced.

**Candidates and bounds:** one exact record identity in the minimal read seam; strict import size, count, and structural bounds; explicit unsupported, not-found, stale, and unresolved outcomes. Full subgraph/context policy belongs to #567.

**Authority and freshness:** profile data cannot select a provider, create a grant, waive independent review, or write accepted source state. Historical snapshots can remain readable as historical without being eligible for current decisions.

**Agent propagation:** use existing maintainer routing and contract documentation. Do not edit root or workspace business guidance to advertise absent operations. When #564/#567 add supported behavior, their canonical catalog/service/skill/renderer owners must propagate it through the existing path.

**After #563 lands:** report its merged PR and exact contract revision on #563. Start #564 only after confirming that dependency is integrated. Start #567 only after its contracted prerequisite and the assigned lane order are satisfied. Do not close the held children or epic by inference from this contract's completion.

---

## Planning method, review limits, and settlement request

This plan uses the repository's **Standalone Engineering Loop** because native Compound Engineering commands are not installed in the current host. The CE release endpoint reported `compound-engineering-v3.27.0`, target `65dd958da881843868daa219c7f0a5a0e694d9db`; source guidance was read at that release tag. This is a reviewed upstream source version, not an installed host version or a native `@ce-plan` execution.

Planning used `skills/ce-plan/SKILL.md`, its structure guidance, and the source guidance for `ce-doc-review`, together with the repository's [CE router](../../knowledge/orchestration/compound-engineering-routing.md) and [fallback loop](../../knowledge/engineering/engineering-orchestration.md#1b-standalone-engineering-loop-ce-unavailable). The plan carries requirements, decisions, serial units, source paths, concrete tests, scope boundaries, and verification. Brainstorming was skipped because the product direction and assigned sequence are already specified.

A same-session planning check addressed four risks: conflating mode with reference origin; giving observations authority over intent; satisfying reference interoperability only with schema parsing; and duplicating #567's query implementation. It also preserves the distinction between strict import schemas and additive public result envelopes. This check is not native `ce-doc-review`, an independent reviewer, or HoE settlement. No reviewer identity has been invented.

No production code, schema, example, generated file, package stamp, or accepted ADR was changed during planning. No repository tests, builds, or live provider/device checks were run. The available checkout route did not yield a usable local repository; GitHub reads/writes support this isolated planning branch, not claims of executable verification. Implementation requires a working Node.js 24 checkout and the checks above.

HoE settlement must resolve the proposed KTDs, explicitly accept or revise KTD6's minimal shared-service boundary, and confirm the shared-file integration window. Reference that settlement before `@ce-work` or the bounded-work fallback starts. Do not treat this proposed plan as its own permission to cross that gate.
