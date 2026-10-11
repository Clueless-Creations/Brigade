---
name: b2c-maintainer
description: "Maintain Brigade's platform: instructions, routing, runtime implementation, architecture, simplification and removal, upstream upkeep, and provider integrations. Use for repository-local engineering; use Brigade for operating one business and b2c-contributor for external source intake."
metadata:
  short-description: Maintain the builder and its upstreams
---

# B2C Maintainer

This skill is a thin, repository-local router for maintenance work. Do not install it in a business workspace.

## Use this router

Use this router for one of the following:

- instruction, skill, and routing maintenance
- architecture/conformance edits that touch canonical boundaries
- maintenance ownership of existing upstreams and generated credits
- post-adoption maintenance for provider integration and support changes already adopted by the repo

## Route conditionally

1. **Instruction and routing maintenance**

- when changing agent guides, skills, task cues, scoped routers, or their links, use [Maintaining instructions and routing](../../../CONTRIBUTING.md#maintaining-instructions-and-routing)
- select the affected authored owners before planning; apply architecture, provider, and upstream routes only when their existing triggers are implicated

2. **Architectural or mechanism edits**

- use [Improve the factory](../../../CONTRIBUTING.md#improve-the-factory) to compare changes by their app-building outcome and total complexity
- load `docs/architecture-conformance.md` and `docs/north-star-architecture.md` as required
- record boundary changes with evidence (`path:line`) and keep decision ownership in `docs/decisions/`
- keep changes to builder runtime and reducer implementation on this route; preserve their supported guarantees, not their current structure

3. **Upstream support maintenance**

- load `workflow.machine.upstream-support-maintainer` from the catalog
- own `catalog/upstreams/<id>.yaml`, `docs/upstreams/`, and generated credit evidence
- run `b2c contribute upstream-check`, `b2c contribute upgrade-plan`, `npm run render:credits`, and the matching gates (`npm run check:upstreams`, `npm run check:credits`) for affected work

4. **Provider maintenance after adoption**

- continue through `docs/guides/provider-integrations.md` and ADR-0013
- map native capability to canonical operations and independent conformance evidence
- preserve adapter seams and only keep provider-native code at the boundary layer

## Other scopes

Route external source intake, rights review, and manifest proposals to
[`b2c-contributor`](../b2c-contributor/SKILL.md). Return here for accepted-source maintenance.

Route operation of one business to [Brigade](../../../SKILL.md), including its
selected provider credentials and workspace operator policy. Change that
business's execution state through its public operations and reducer. Editing
the reducer implementation is platform maintenance, not permission to edit
workspace state directly.

## CI and checks

Load exact commands from [CONTRIBUTING.md](../../../CONTRIBUTING.md) only for the selected change. Run checks proportional to changed behavior plus required gates. Do not treat every branch update as a full audit.

## Boundaries

- keep evidence owners and version facts (`release`, `reviewed baseline`, `supported range`, `workspace pin`) separate
- one change only becomes release-ready after real review and founder authority requirements are satisfied

## Handoff

Report the changed ownership, manifest deltas, checks run, conformance evidence, blocks, and founder decisions that block merge or release.
