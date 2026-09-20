# 0019 - Product Profile v1 and truth ownership

- **Status:** proposed
- **Date:** 2026-09-20
- **Steward:** Product Profile architecture lane for #563; acceptance requires independent conformance review.
- **Affected rules and contracts:** ARCH-02, ARCH-05, ARCH-07, ARCH-09, ARCH-11, ARCH-13, ARCH-15; ADR-0009 and ADR-0016.
- **Affected units:** #563; downstream #564 through #570; program #562.

## Context and evidence

Baseline: main `fbbb23f7ef4eed1e48d75516a4df854e2debd9ef`, before this contract slice.

`docs/north-star-architecture.md:221` defines one owner for each kind of truth.
`docs/architecture.md:84` describes product authority and separates it from reducer bookkeeping.
`docs/decision-driven-building.md:145` proposes common intended/observed profiles and a reference specialization.
`kernel/services/source-projection.ts:1` already owns scoped source projection for semantic work.
`docs/decisions/0009-bespoke-design-foundations.md:14` retains `DESIGN.md` and existing design/evidence owners.

The baseline proposes profiles but does not define their wire shape, identity rules, or source precedence.
The repository has no shipped general Product Profile service at this baseline.
A reference-specific foundation would duplicate product concepts and force later conversion or competing query paths.
An editable profile database would duplicate accepted product truth and reducer state.

## Alternatives

**Separate reference schema.** This makes dissection convenient but gives states, journeys, and relationships two owners.
Shared lookup requires conversion, and conversion can lose capture limitations or uncertainty. Reject this option.

**Editable product knowledge graph.** This permits direct profile edits but competes with product/design sources and execution state.
It also makes observed defects capable of overwriting intent. Reject this option.

**Universal runtime service in this issue.** This could deliver generation and queries together, but expands into #564, #567, and package integration.
It increases shared-file collisions and cannot establish the contract before consumers depend on it. Defer those implementations to their existing owners.

**One immutable projection contract with a reference specialization.** This preserves existing truth owners and makes import behavior executable before runtime adoption.
Choose this option.

## Decision

Define one strict `product-profile/v1` contract, with `intended`, `observed`, and `observed-reference` modes.
The [canonical contract](../contracts/product-profile/README.md) owns the schema, semantic validation rules, stable IDs, and compatibility guarantees.
`extensions.reference` holds only capture/version/dissection metadata. Shared product concepts remain in the base payload.
Profiles are source-bound derived artifacts, not accepted source truth or executable authority.

The added normative wording in ARCH-07 is:

> Product Profiles conform to the versioned base contract and its source-ownership rules. They are immutable, revision-bound projections, never an additional authoring or acceptance store.

Keep source declarations, original observations, interpretations, unknowns, contradictions, and acceptance distinct.
Do not infer absent behavior from missing coverage. A profile read cannot fetch missing evidence, execute inference, update sources, or dispatch work.
Use exact code for conformance and identity checks. This issue requires no semantic provider operation.

## Compatibility and migration

This first slice is repository-only: canonical schema, reference conformance reader, fixtures, CI, and architecture routing links.
It defines a wire contract but advertises no CLI/MCP operation and changes no package version or workspace pin.
All existing runtime inputs, installed compositions, and accepted source artifacts remain unchanged.

On first runtime adoption, move the schema and reusable validation into `contracts/product-profile/` without changing the schema identity.
Remove the old editable owner and update links in the same change. Runtime modules must not import repository documentation.
#564 owns this package integration, accepted-source generation, and the required version/generation checks.
#567 owns the bounded kernel service and public projection path when supported.

There is no overlap period with a second reference wire schema. Refuse unsupported schema versions and unknown fields.
An external format needs explicit conversion with preservation of source IDs, epistemic status, and loss reporting.
Breaking syntax or semantic changes require a new major contract. Reads must not migrate, repin, or rewrite source truth.

## Consequences

#563 can prove structural and semantic conformance without live provider credentials or a package release.
The common reference reader imports all three modes, supports ID lookup, and preserves reference metadata on export/import.
This proves contract interoperability, not the production bounded-query service or the accuracy of a dissection.

#564 and #565 project intended and observed sources. #566 compares them without repairing intent to match a defect.
#567 preserves unknowns and query omissions. #568 refreshes derived views at admitted checkpoints.
#569 imports reference profiles through existing storage/access owners. #570 keeps target-product composition separate from source dissection.
The #562 epic remains open until its children supply their actual proofs.

Final conformance review must be independent. The author cannot turn these fixtures or self-review into that receipt.
No access, pricing, publication, store, deployment, or release decision is authorized here. Publication remains with #26.
