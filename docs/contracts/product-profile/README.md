# Product Profile v1

Contract: `product-profile/v1`. Schema identity: `urn:brigade:product-profile:v1`.
Decision: [ADR-0019](../../decisions/0019-product-profile-truth-ownership.md).

This is the repository-owned architecture contract for #563. It includes an executable conformance reference, not a shipped business API.
Generation belongs to #564. The bounded runtime service belongs to #567. Neither operation is enabled by this directory.

## One model, three modes

| Mode                 | Meaning                                                 | Producer method |
| -------------------- | ------------------------------------------------------- | --------------- |
| `intended`           | A projection of accepted product and design sources     | `projection`    |
| `observed`           | A projection of evidence about a managed product        | `observation`   |
| `observed-reference` | The same observed model with reference capture metadata | `dissection`    |

Reference identity and observation are different facts. A managed product can be observed without becoming a reference product.
A reference profile uses the same `elements`, `relationships`, `claims`, `evidence`, `coverage`, and `unknowns` fields.
Only `extensions.reference` adds capture provenance, the observed version reference, capture bounds, and dissection limitations.
It cannot define another entity, state, journey, or relationship model.

The standalone Dissector receives a source product, not a target-market or copying decision.
A later target-product decision may cite a reference mechanism. It does not modify the source profile or its evidence.

## Authority and precedence

There is no global ranking that makes one document authoritative for every fact.
Resolve a claim within its owning domain:

| Fact                                                                  | Owner                                | Conflict behavior                                                                                        |
| --------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Accepted promise, audience, scope, requirements, product decisions    | `product.yaml`                       | An observed defect cannot change accepted intent.                                                        |
| Readable product index                                                | Rendered `PRODUCT.md`                | Re-render from `product.yaml`; do not treat edits to the rendering as new intent.                        |
| Global experience and design decisions                                | `DESIGN.md`                          | Preserve product constraints. Escalate disagreement rather than silently choosing a new product promise. |
| Detailed interaction, screen, motion, content, or technical contracts | Their linked authored contracts      | Preserve their revision and controlling product/design decision. Unresolved disagreement stays visible.  |
| Attempts, observations, accepted proof, pending work, grants, history | Existing reducer-owned state         | Only the reducer changes execution or acceptance state. A profile cannot grant authority.                |
| Original captures and verification records                            | Existing evidence owner              | Keep original bytes and modality. A description is not an independent capture.                           |
| Code and authored design history                                      | Git                                  | Source presence does not prove runtime behavior. Bind live claims to the relevant build evidence.        |
| Source-product capture and dissection provenance                      | Existing reference evidence artifact | Preserve its scope. It cannot accept requirements for a different product.                               |

Profiles are immutable derived artifacts over these owners. They are not an editable product database, execution journal, or acceptance store.
Do not copy pending work, grants, credentials, provider state, or acceptance booleans into this contract.
The schema rejects such additional fields, including fields inside the reference extension.

Editing a profile does not update its sources. New source truth requires its existing review and write path.
Conflicting source claims must remain distinct, with a named unknown or contradiction and their source references.
No averaging of confidence, latest-file-wins rule, or silent rewrite can settle that conflict.

## Wire structure

[`contracts/product-profile/product-profile.v1.schema.json`](../../../contracts/product-profile/product-profile.v1.schema.json) is the canonical authored JSON Schema 2020-12 document.
Objects reject unknown fields. The schema and the semantic rules below both apply.
JSON text must have unique object keys, a maximum UTF-8 size of 2,000,000 bytes, and nesting of at most 32 containers.
Array and string bounds are defined in the schema. These are import limits, not the runtime projection budget for #567.

| Field                                  | Contract                                                                                                  |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `apiVersion`, `id`, `revision`, `mode` | Wire version, stable profile-series identity, immutable snapshot digest, and projection mode              |
| `product`                              | Product identity, display name, version identity, optional known version/build labels, and product claims |
| `provenance`                           | Generation time, producer identity/version/method, and revision-bound source references                   |
| `elements`                             | Typed product concepts with stable IDs and subject-specific claims                                        |
| `relationships`                        | Directed typed relationships with their own IDs and subject-specific claims                               |
| `claims`                               | Statements with explicit epistemic status and grounding                                                   |
| `evidence`                             | References to original evidence owners, not embedded captures or an acceptance ledger                     |
| `coverage`                             | Exactly one scoped coverage record for each supported concept family                                      |
| `unknowns`                             | Named gaps, affected subjects, reasons, source references, and questions                                  |
| `extensions`                           | Empty except for the required `reference` object in `observed-reference` mode                             |

### Product concepts and relationships

The shared element kinds are `entity`, `system`, `mechanic`, `state`, `surface`, `transition`, `journey`, `event`, and `effect`.
They also include `visual-foundation`, `component`, `navigation-pattern`, `motion-family`, `gesture-family`, `feedback`, `content-pattern`, and `technical-characteristic`.

An entity names a domain object. Its claims describe fields and invariants; relationships connect its surrounding model.
A system groups responsibilities. A mechanic describes a persistent rule, such as progression or eligibility.
A state describes a product condition. A surface presents an experience; it is not synonymous with state.

A transition requires `from` and `to` state IDs and a `trigger` event ID.
A journey contains ordered transition IDs in `steps`. Consecutive steps must connect.
Branching journeys use separate supported paths that share transition IDs. Do not fabricate an unobserved branch.
Feedback declares one or more `visual`, `audio`, or `haptic` channels.
These specialized fields are forbidden on other element kinds.

Each relationship carries its own claim and provenance through that claim:

| Kind        | Meaning and allowed endpoints                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `contains`  | A concept structurally includes another concept. Both endpoints are elements.                                 |
| `uses`      | A concept depends on another concept. Both endpoints are elements.                                            |
| `renders`   | A surface/component presents a state, component, content pattern, or visual foundation.                       |
| `causes`    | An event, transition, effect, or mechanic produces an effect, event, or state.                                |
| `persists`  | A system/mechanic retains an entity or state.                                                                 |
| `emits`     | An event, transition, effect, system, or mechanic emits an event or feedback.                                 |
| `navigates` | Navigation, gesture, or transition leads to a surface or state.                                               |
| `governs`   | A system, mechanic, visual foundation, navigation, motion, gesture, or content pattern constrains an element. |

A relationship is a claim, not proof of causation. Mark an inferred relationship `inferred` and retain its grounding.
The `causes` label cannot upgrade correlation to an observed cause.
These relationships describe a product. They do not create executable dependencies or a second work graph.

### IDs and revisions

Every record ID is unique within a profile and has its kind prefix, such as `state:completed` or `claim:completion`.
All references must resolve to the correct record type. A claim reference must describe the record that carries it.
Cross-product identity is the pair `(product.id, record.id)`. Matching labels do not merge products or concepts.

IDs identify concepts, not array offsets, display names, capture timestamps, or content hashes.
Keep an ID across renaming, reordering, regeneration, and equivalent observations of the same known subject.
Use source-owned stable anchors or a preserved identity mapping in the existing source/evidence artifact.
Do not add a global profile registry to assign IDs. Ambiguous correspondence remains an explicit unknown.
Retire an ID when its concept is removed. Do not reuse it for a different concept.

`product.version.id` identifies the described version context. Unknown release/build labels are `null`, never guessed strings.
`profile.id` identifies a projection series. Separate intended and observed series can describe the same known product version.
`revision` identifies exact normalized snapshot content. It is not the product version or a package release.

Compute `revision` as `sha256:` plus a lowercase SHA-256 hex digest of canonical JSON, excluding the root `revision` field.
Sort object keys lexicographically by JavaScript UTF-16 order. Preserve array order and string code points.
Encode strings with JSON escaping and encode the complete result as UTF-8. Insert no whitespace.
The v1 payload has no numeric fields; this algorithm does not define a general numeric canonicalization protocol.
Whitespace and object-key order do not affect the digest. Array reordering or changed source revisions do.
A digest detects inconsistent content. It proves neither the producer's identity nor the truth of a statement.

Each source requires its owner, locator, owner revision, exact `contentDigest`, and derivation references.
A locator is an opaque reference, never an instruction to fetch a URL or open a file.
The producer must verify source identity, revision, digest, scope, and acceptance through existing owners before projection.
Conformance checks the metadata, not those external facts. Source access remains with existing scoped services.

### Epistemic status and evidence

| Claim status   | Meaning                                                    | Required support                                                      |
| -------------- | ---------------------------------------------------------- | --------------------------------------------------------------------- |
| `declared`     | An accepted authored requirement or decision               | Product, design, or linked authored source; intended mode only        |
| `observed`     | The scoped statement is supported by an observation        | Direct evidence for that subject; observed modes only                 |
| `inferred`     | An interpretation beyond direct declaration or observation | Source/evidence references and a reason; never independent acceptance |
| `unknown`      | Available sources cannot establish the statement           | A reason and a named unknown linked to the subject's coverage         |
| `contradicted` | Direct evidence disagrees with the scoped statement        | Direct subject evidence and a reason; observed modes only             |

A contradiction retains the statement that was challenged. It does not replace intended truth with the observed defect.
Not seeing a behavior is not a contradiction. Scope and adequate observation must support the disagreement.
`declared` asserts that the producer used accepted sources; the schema cannot verify that acceptance itself.
There is deliberately no `accepted` status. Only the existing acceptance owner can accept proof.

Evidence records point to an `evidence-store` or `reference-capture` source.
They record subjects, modality, environment, direct/derived status, observation time, and scope.
Direct evidence has no derivation parents. Derived evidence names its parents. Source and evidence derivation must be acyclic.
Observation times cannot exceed profile generation time.

An original screenshot cannot prove motion, audio, haptics, backend implementation, or persistence by itself.
The reference validator enforces direct audio/haptic evidence for those feedback channels and physical-device context for haptics.
It requires video or measurement evidence for observed motion families.
Other claim-to-modality judgments require domain review. Format validation cannot prove sufficient observation or factual correctness.
A text-only model's interpretation of a capture stays derived. It does not become a new independent observation.

### Coverage and missing data

`covered` means the named scope is represented, not that the whole product is complete or verified.
It requires elements and no linked unresolved unknowns. Inferred claims retain their status even in represented scope.
`partial`, `unknown`, and `inaccessible` require explicit unknown references.
`not-applicable` requires a declared or observed coverage claim and no elements or unresolved unknowns for that scope.
An empty list never establishes absence or non-applicability.

Every element must appear in its family coverage. Every unknown must appear in coverage.
A subject's own unknown cannot be hidden under an unrelated family.
Unknowns distinguish missing sources, inaccessible behavior, ambiguous identity, conflicting sources, redaction, and deliberate exclusions.
Preserve these gaps during import and projection. A later bounded query must report its additional omissions separately.

### Reference capture

Reference profiles require capture sources owned by `reference-capture` and the same version ID as the common product envelope.
The capture window is ordered, includes its evidence observations, and ends no later than profile generation.
Dissection method, version, and limitations describe how the profile was produced.
They do not claim that a schema-valid profile is an accurate reconstruction of the product.
Reference captures retain their source access restrictions. A portable profile does not authorize copying private captures.

## Conformance and interoperability

Run from the repository root after `npm ci` with Node.js 24:

```bash
node --test docs/contracts/product-profile/contract.test.mjs
```

[`contracts/product-profile/conformance.mjs`](../../../contracts/product-profile/conformance.mjs) validates the schema, typed references, evidence rules, coverage, and snapshot digest.
Its `importProfile(json)` reference reader returns an immutable snapshot, `get(id)`, and `export()`.
It resolves IDs in memory and preserves supported values on round-trip, including reference metadata.
It reads only its checked-in schema at module initialization. Import and lookup do not access source locators or run inference.
This is the minimum general-model reader for the #563 interoperability proof, not the #567 runtime query service.

The three [examples](examples/) describe a synthetic lesson-completion scenario across all concept families.
They include an inferred mechanism, contradicted persistence, and unknown offline behavior where applicable.
Their capture pointers and digests are fixtures. They are not evidence that a real device or product was inspected.
The tests exercise shared IDs, import/export, immutable reads, type errors, mode errors, tampering, and unsupported evidence claims.

Independent conformance review remains required before merge. These tests cannot replace that review or the later live/runtime proofs.

## Versioning, placement, and rollout

The schema and semantic rules form one contract. Both must pass; a schema-only pass is insufficient.
New required fields, enum values, field meanings, or relaxed semantics can break strict v1 readers.
Use a new major contract for such changes. Do not silently discard unsupported fields or auto-upgrade a profile during a read.
Clarifications, additional tests, and examples may retain v1 only when existing supported meanings and validation remain unchanged.

This architecture slice stores its canonical schema and reference validator under `docs/` and tests them through scoped CI.
They are repository-only and do not change the npm package or a pinned workspace.
At first runtime adoption, move the schema and reusable validator into `contracts/product-profile/` under the same schema identity.
Remove the old owner in that same change; update imports and links instead of retaining two editable copies.
Runtime contracts must not import `docs/`. Shared kernel services consume the contract; entrypoints consume those services.

#564 owns generation from accepted sources and package integration. #567 owns bounded context projection through existing services.
#565 owns observed generation; #566 owns comparison; #568 owns refresh; #569 owns managed reference import.
#570 owns target-product composition from references, separate from dissection and accepted source truth.
Those units must reuse this model and preserve exclusions, source revisions, and uncertainty.

No supported deployed Product Profile format was found at the #563 baseline.
`reference-product-profile/v1` is not a second accepted wire name; import refuses it instead of guessing its meaning.
A future external format requires an explicit migration with source/ID preservation, loss reporting, and round-trip proof.
Migration must not fabricate evidence, overwrite accepted intent, alter reducer history, or silently repin a workspace.
This decision grants no provider access, inference spend, deployment, publication, store submission, or release authority.
