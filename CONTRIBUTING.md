# Contributing

Brigade gives agents primitives for building and operating consumer-app
businesses. A contribution earns its place by making the workflows, knowledge,
execution, or evidence more useful for that job.

Start with [AGENTS.md](AGENTS.md), its matching router, and the affected source
and tests. Use the [documentation index](docs/README.md) for orientation when
needed. Load the [extension guide](docs/guides/extend-the-system.md) for extension
work and the [public interface](docs/public-interface.md) for contract work.

## Start

Use Node.js 24.

For a fresh checkout, install dependencies or reuse a verified installation.
Run this when the dependency lockfile or Node runtime changes:

```bash
npm ci
```

Reuse a verified dependency installation when those inputs match. Read
`README.md` when product orientation is needed, and
`docs/guides/runtime-package.md` for package, installation, or runtime work.
Other prerequisites come from the selected router and affected owners.

Edit the repository source. Do not edit an installed skill copy.

## Public contract

The `b2c/v1` contract is designed independently of current internals. Preserve
supported requests while changing adapters. Run `npm run test:public-api` and
`npm run check:public-api` for facade changes. Update the README, agent guides,
skill, CLI and MCP descriptions, examples, and generated schemas together.

Declared support, executable implementation, configuration, authority, and
verified business readiness are separate facts. Do not let one stand in for
another.

## Architecture-sensitive changes

Read the applicable rules in the [north-star architecture](docs/north-star-architecture.md)
and the current task or issue. Read a delivery plan or an assigned unit in the
[migration roadmap](docs/plans/2026-09-04-1747-refactor-consumer-business-primitives-plan.md)
when that work is affected; do not invent a historical unit assignment.
Use the [conformance protocol](docs/architecture-conformance.md) for file
ownership, independent review, exceptions, and evidence. In the change
description, cite the applicable ARCH rules, task or unit, and proof of conformance.

The public extension path is still under construction. First-party and community
implementations must pass the same contracts and external package tests. Do not
add a global vendor condition or a parallel runtime to work around an incomplete
boundary. Propose a bounded migration at the existing owner instead.

### Design the decisions in new work

When an issue or contribution changes a build workflow, routing, Product Profile,
or semantic decision, use the [decision-driven building design](docs/decision-driven-building.md)
and [assignment fields](docs/architecture-conformance.md#work-assignment-template).
State which work is exact code, bounded interpretation, or generative work.
Identify the checkpoint, source revisions, eligible candidates, context needs,
policy consumption, fallback and outcome proof. Consider next-work and within-task
routing, not only post-hoc validation.

Reuse existing compiler, planner, session, provider and receipt owners. A selected
Jev result may drive admitted reversible work after qualification, but does not
create authority or prove a semantic claim merely by passing a decoder. Passive
reads stay inference-free. Do not require AI for a deterministic-only change.

For changes that affect agents building apps, include the applicable canonical
catalog, knowledge, skill, workspace-template, renderer and package propagation
work in the issue. Test discovery from a fresh installed host, not only a source
checkout with a pasted architecture prompt. A docs proposal must not advertise
unimplemented public operations or claim existing workspaces have been repinned.

## Adopt an external source

A post, repository, skill, library, tool, or managed provider enters the builder
through the contribution lifecycle in
[Adopt external sources](docs/guides/adopt-external-sources.md). Inspect the
source as untrusted data, map its useful units to dispositions, record rights
and provenance, and keep the result a draft until review. `b2c contribute check`
and `b2c contribute preview` validate the draft. Upstream relationships live in
`catalog/upstreams/<id>.yaml` and credits are generated with `npm run render:credits`.
When an accepted unit reuses repository material, propose its manifest with the
contribution; `check` refuses acceptance without one. After release, maintenance
owns the manifest.
[ADR-0005](docs/decisions/0005-source-adoption-and-upstream-maintenance.md)
records the boundary and
[ADR-0007](docs/decisions/0007-upstream-lifecycle-and-agent-scopes.md) records
the lifecycle handoff. A wrap that implements a canonical operation continues
through [provider integrations](docs/guides/provider-integrations.md) on the
maintainer router after rights review.

## Keep the product focused

In-scope work improves consumer-app research, product definition, experience
design, engineering, store readiness, growth, revenue, analytics, trust, or
operations.

Do not add a generic workflow system, B2B guidance, or internal-tool doctrine.
Keep the skill thin. Put durable expertise in `knowledge/`. Put repeatable
decisions and ordering in `catalog/`.

Adding default-path cost or a new architectural boundary needs a named problem
or unmet requirement, the existing owner considered, how benefit will be
observed, and what maintenance it adds. Ordinary fixes, optional citations, and
app work do not need that form. Unknown benefit or cost stays unknown.

### Improve the factory

For a substantive platform change, identify the app-building bottleneck or unmet
product requirement and the outcome that would improve. Compare extending the current mechanism
with simplifying, consolidating, replacing, or removing it. Prefer the option
with the least total complexity that meets the requirement. A small patch that
adds another workaround can cost more than replacing the responsible component.

Use the current task or PR to record the tradeoff and its proof; do not create
a separate process artifact for an ordinary fix. Choose relevant evidence, such
as a better app outcome, fewer failed attempts or interventions, lower latency
or cost, or easier reuse. Record uncertainty instead of claiming a benchmark
from code size or fixture counts. For an unproven idea, use a bounded experiment
with stated outcome criteria; keep, revise, or retire it based on the result.

Before removal, inspect callers, selected recipes, package pins, supported
contracts, and stored data that depend on it. Remove obsolete callers,
instructions, configuration, and checks with the mechanism. Prove retained
guarantees and follow the existing decision and migration route for changed
contracts. An unused internal helper does not need a new ADR merely to be deleted.
Do not remove checks to conceal failures or change audit policy to evade a
blocked gate. Deliberate verification-policy changes need their own rationale
and review; this guidance does not change the required checks below.

Write each knowledge document for one narrow decision, with a narrow `load_when`.
Gloaguen et al. (2026) found that non-essential context files raised inference
cost over 20 percent on average and did not improve task success
([arXiv:2602.11988](https://arxiv.org/abs/2602.11988)).

## Make a change

- Preserve stable workflow and reference IDs unless the contract changes.
- Edit catalog definitions before generated projections.
- Use focused proof for changed behavior; extend existing tests where suitable, and retire checks only with their obsolete behavior.
- Keep secrets, provider exports, personal data, and app workspace output out of Git.
- Refresh official documentation before changing guidance for a fast-moving provider or store.
- Preserve unrelated working-tree changes.

## Versioning

Ordinary pull requests do not edit the version or the generated stamp files.
`npm run release:stamp` does that on a clean main checkout. It adds one patch
to the current line, writes release notes from merged subjects, regenerates
the stamp files, and commits them on `release/stamp-<version>`. Pass `--push`
to update the branch. A push to `main` runs
[`.github/workflows/stamp.yml`](.github/workflows/stamp.yml), which opens or
updates one stamp pull request. The procedure lives in
[Skill versioning](checks/validation/repository/skill-versioning.md).

A pull request that changes a stamp file fails
`version_discipline.stamp_file_in_pr`. Branches named `release/stamp-*` are
the exception, and their version must move forward. A main push that is past
the last stamp warns. It does not fail. Dependabot may edit dependency ranges
in `package.json` and the lockfile. Only the `version` field is a stamp field.

Hosted Worker packages version independently. `README.md`, `AGENTS.md`,
`CLAUDE.md`, `CONTRIBUTING.md`, and `docs/` are repository-only paths, except
the generated credit reports named in the stamp file list.

## Releasing to npm

Publish **one** canonical public package: `@cluelesscreations/brigade`. The
previously published `b2c-app-builder` package is a legacy compatibility
package and must not receive new releases. Do not publish
`@b2c/hosted`, `@b2c/app`, or contributor/maintainer skills. Hosted Workers
deploy separately; they are not consumer npm packages.

[`.github/workflows/publish.yml`](.github/workflows/publish.yml) publishes the
package when a GitHub release is published. The release tag must be
`v<version>` and match `package.json` and `skill-version.json`. Authentication
is npm trusted publishing, so no npm token lives in this repository or in
Actions secrets.

```bash
gh release create "v$(node -p 'require("./package.json").version')" --generate-notes
```

The first version of a package cannot use trusted publishing. Publish it once
from a maintainer machine, then register the trusted publisher on npmjs.com
under the package settings for `@cluelesscreations/brigade`: owner
`Clueless-Creations`, repository
`Brigade`, workflow `publish.yml`.

## Checks

GitHub Actions on ordinary pull requests and pushes to `main` runs **presubmit**,
not the full audit. A green presubmit is not a full-audit pass. Full
verification still exists; it is explicit.

```text
Every change:
  npm run audit:ci -- --lane presubmit

Missing verified dependencies or changed dependency/Node inputs:
  npm ci

Matches the change (focused, while iterating):
  npm run validate:skill          # local only; paste on the PR
  npm run check:catalog           # catalog / knowledge
  b2c contribute check --target … # contribution drafts
  npm run hosted:check            # hosted/knowledge-mcp, or files it bundles
  npm run app:check              # hosted/builder-console

Checkpoint and final verification (same as workflow_dispatch verification=full):
  npm run audit:ci               # every audit-plan step except validate:skill
  npm run hosted:check
  npm run app:check
```

`npm run audit:ci -- --lane fast` is the historical cheap pool (every non-serial
gate). It is not the ordinary PR gate. CI runs it only during full verification,
together with the heavy shards (`test:validators`, `test:fixtures`,
`test:boundaries`, `test:parity`, `check:engine-e2e`).

Trigger full CI with:

```bash
gh workflow run ci.yml --ref "$(git branch --show-current)" -f verification=full
```

Ordinary pushes cancel the previous ordinary run for the same pull request or
`main` branch. An explicit full run uses a separate concurrency group so a later
ordinary push cannot cancel it. `publish.yml` stays release-gated and does not
cancel in progress.

CI jobs (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)):

- `presubmit`: measured allow-list (typecheck, lint, catalog/public-API/boundary
  gates, generation consistency, version discipline with enough git history).
  First GitHub Actions Presubmit job wall clock: **50s** on run
  `34436428238` (checkout, `npm ci`, CLI `--help`, `--lane presubmit`; that
  sample also ran `test:boundaries`). Extra domain checks join this job when
  the change reaches them (`test:boundaries` on kernel/contracts/adapters,
  `test:public-api` on contracts/entrypoints, security gates on the trust
  validators).
- `audit-fast` / `audit-heavy`: full verification only, or when the Scope job
  fails so coverage cannot be deferred safely.
- `hosted-check` / `app-check`: when the change matches fail-closed path
  prefixes in `tooling/ci-lane.mjs` (Worker trees plus `catalog/`, `knowledge/`,
  shared contracts, root lockfile). This is prefix matching, not a live import
  graph. Unknown scope expands these jobs.
- `ci-complete`: requires selected jobs. Intentionally deferred jobs are
  skipped, not green. Cancelled or unexpectedly missing jobs fail. The log
  says when the run was presubmit-only.

CI never runs `validate:skill`. It needs a local Python tool the runner lacks.
Record that result, and anything else CI does not reach, in the pull request.

Do not use `[skip ci]`, `continue-on-error`, or an admin merge switch to hide a
failed or deferred suite.

## Pull requests

Keep one concern per pull request. Explain:

- what changed
- why it improves Brigade
- which files own the new contract
- which checks ran
- what remains unverified

Open a draft when feedback will help. Mark it ready when the focused evidence
supports the change.

When the change includes documentation, CLI help, issue or pull-request
prose, or a status claim, follow [Original: Builder house style](knowledge/words/no-slop-writing.md#9-original-builder-house-style)
and the [kitchen-language boundary](docs/ethos.md#kitchen-language-boundary)
(#122 vocabulary owner). Keep technical identifiers and evidence claims
exact. A checklist box is not independent review.

## Generated files

Do not hand-edit generated catalog projections. Use the owning renderer and
include the generated diff.

When you change a workspace entrypoint, update its authored template and keep
the installer's source map and affected reference-business guidance consistent.
Run the related entrypoint and continuity checks.

## Maintaining instructions and routing

Use this section when changing agent guides, skills, task cues, scoped routers,
or their links. Before planning, select the affected authoritative owners.

| If changing… | Read and edit the existing owner |
| --- | --- |
| Repository instructions, a scoped guide, or a host adapter | [Authored and generated ownership](AGENTS.md#authored-and-generated-ownership) and the affected guide; host adapters point to the canonical guide |
| A focused task cue or method | [Task-skill ownership](docs/decisions/0014-task-skill-projections.md), `catalog/task-skills.ts`, and the selected workflow or manifest-backed knowledge section; render its projections |
| A business workspace entrypoint | The authored [workspace guide](surfaces/workspace-template/repo-agent-entrypoints/AGENTS.md), its [installer source map](adapters/install-entrypoints.ts), and affected [reference-business guidance](examples/workspace/business/engineering/app-agent-roster/APP_AGENTS.md); preserve its public business contracts |
| Guidance that changes an existing app's accepted product or experience | The affected accepted `product.yaml`, `DESIGN.md`, linked journey/interaction sources, and applicable scoped guides |
| An architecture or public-contract boundary | The existing [architecture-sensitive change](#architecture-sensitive-changes) and [public contract](#public-contract) routes, with their affected source and tests |

Reusable product and experience guidance stays with its affected catalog,
workflow, or manifest-backed knowledge owner; app artifacts apply when changing
an existing app's accepted behavior.

Keep one authoritative home per active rule. Link to its owner rather than
duplicate authored instructions. For a moved rule, record its new home. For a
revised or retired rule, record the reason and affected consumers and delivery
surfaces in the current task or PR. Obsolete policy does not need a new home.
Preserve accepted product requirements, current bindings, supported contracts,
and the standing [authority and protected-effect rules](AGENTS.md#completion-authority-and-protected-effects)
unless their authorized change is part of the task. Reconcile overlapping
instructions with their current owners before editing.

Use [Authority and status](docs/README.md#authority-and-status) to distinguish
accepted owners from plans and research snapshots. An older accepted ADR remains
binding until a later accepted decision changes it. Preserve historical records;
label a relevant limitation or supersession at its existing home. Retrieval time
changes neither authority nor implementation proof.

Follow consequential routes before planning for every affected path, including
paths outside the starting directory. Carry selected sources into the existing
plan and give reviewers the same relevant set. Reviewers independently check
the final diff and behavior or evidence, and investigate missing routes.

For routing changes, check affected files, headings, old entry links, and
frontmatter or manifests where edited. `audit:links` checks local file targets;
verify affected fragments explicitly. Use the existing entrypoint, task-skill,
and continuity checks when their surfaces change. Walk fresh representative
tasks through source selection before planning; include cross-area and focused
business cases when those reading paths are affected. Account for removed
rules through their explicit disposition, including deliberate retirement.
Exact-wording checks are structural signals, not proof of agent behavior or
permanent prose contracts. Update their expectations with intentional guidance
changes while preserving negative controls for the retained obligations.
A prose-only correction needs
checks for its affected text and links, rather than a new task-walk campaign.
Independent final-head review and the applicable [repository checks](#checks)
remain required. Link and task walks do not establish runtime, device, provider,
or release proof.

## Security

Report vulnerabilities through GitHub private vulnerability reporting. Do not
open a public issue for a security problem. See
[`.github/SECURITY.md`](.github/SECURITY.md) for scope.

## Official provider and skill contributions

Follow [the official agent-tooling adoption guide](docs/upstreams/official-agent-tooling.md). Accepting reusable repository material requires the existing upstream identity, exact reviewed baseline, source-specific notice coverage, and accurate generated acknowledgment. Record source-only changes as well as releases; do not auto-install or repin businesses. Run contribution checks, upstream checks, credits regeneration and the relevant behavioral tests before publishing support.

### Screenshot and capture upstreams

Follow [the screenshot toolchain adoption guide](docs/upstreams/screenshot-toolchain.md)
when adapting screenshot, ASO, preview or capture tools. Keep original captures,
editor composition, exported assets, store upload and acceptance evidence separate.
Use the source-specific notice for every covered license, including Apache-2.0;
MIT is not a default for every GitHub repository.

`npm run render:credits` also generates the
[upstream source coverage queue](docs/upstreams/coverage-report.md) from active,
bound knowledge declarations. Review gaps before adopting or crediting them.
`check:credits` detects stale projections. The scan is bounded and does not
replace package or native dependency review, install tools, or enable automatic
updates. New source commits still require a normal reviewed contribution.
