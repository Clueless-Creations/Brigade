<div align="center">

# Brigade

**Build the business around the app.**

Primitives for creating, launching, and improving consumer-app businesses.

[Get started](#get-started) · [Documentation](docs/README.md) · [Architecture](docs/north-star-architecture.md) · [Contribute](CONTRIBUTING.md)

</div>

![Sheet 1. The kitchen layout, six stations and a pass, with the business going out the door.](docs/assets/business-primitives.svg)

A consumer business needs more than an app that compiles. It needs a product
people want, a distinctive experience, a working funnel, and reliable
monetization. It needs a way to learn what works and improve.

Brigade gives AI agents a shared **context and operating layer** for that whole business. It keeps expertise, product understanding, execution, evidence, and authority connected instead of asking every agent to reconstruct the business from files on each turn.
It is laid out like a restaurant kitchen. Stations are the responsibilities
every consumer-app business has, and they do not change with the app.
Capabilities define what each station must produce. Providers implement them.
Recipes arrange the work into creation and operating loops. Selected knowledge
is the mise en place that helps the agent decide well. You are the executive
chef. You choose the opportunity and the product, set the bar, and let your
agents cook. The [ethos](docs/ethos.md) explains the stations and who runs them.

Skills and sourced knowledge are part of that foundation, and this repository
ships a lot of both. Each one describes how to do a single job well. What it
leaves open is which job comes next, what the last job decided, which provider
will run this one, whether the result holds up, and what happens when it fails.
Capabilities, recipes, planning, bounded execution, evidence, and recovery
answer those questions. They are what keep several specialized agents and
providers working on the same consumer business rather than on disconnected
pieces of it.

You run all of this yourself. You bring the agent and model, the infrastructure,
the provider accounts and credentials, and the environment the work executes in.
The method is here in full under the MIT licence: the capabilities, recipes,
knowledge, planning, execution, review, evidence, recovery, and the extension
contracts for adding your own.

The goal is to move human attention from building one app to designing and
testing businesses. Produce one excellent consumer business first. Then reuse
its foundations for a different approach to the same market, with comparable
evidence.

## Choose how to use it

**Need expertise for one job?** Use [a focused task skill](agents/skills/README.md) for research, onboarding, monetization, release review, or another bounded task. You can use the expertise without creating a Brigade workspace.

**Need an agent to understand and operate one product over time?** Use the managed business runtime. `product.yaml` and `DESIGN.md` keep accepted intent; the **Product Profile** projects that truth into a queryable product-system model; observed profiles and deltas describe what evidence says the running product actually does; status, plan, execution, evidence, and recovery preserve continuity and authority.

**Need only a small piece of product context?** Query the Product Profile by stable ID or bounded text instead of loading the whole profile, source documents, screenshots, or recordings. Semantic judgment is a separate explicit operation. Passive profile/status reads never secretly call a model or provider.

Both modes use the same catalog and sourced knowledge.

[Browse the knowledge by business area](knowledge/README.md).

## Get started

Use Node.js 24.

The canonical npm package is `@cluelesscreations/brigade`. The repository
checkout remains the best path for contribution and source-level development.

```bash
git clone https://github.com/Clueless-Creations/Brigade.git
cd Brigade
npm ci
npm run setup
```

From a checkout, setup runs `npm link`, so `b2c` resolves to that checkout.
Setup creates the local workspace registry and prints the MCP registration
command for Claude Code, Cursor, and Codex. Register that local server as
`b2c-local`. Hosted knowledge is a separate `b2c-hosted` connection and cannot
run a workspace.

After the first authorized publish, the consumer path is:

```bash
npm install -g @cluelesscreations/brigade
b2c setup
```

The portable MCP form (post-publish) needs no global install:

```bash
claude mcp add --scope user b2c-local -- npx -y @cluelesscreations/brigade
```

A leftover `b2c-app-builder` client name is not a third capability. Read the
connection receipt. See leftover names in the
[package guide](docs/guides/runtime-package.md#mcp). Setup never edits Claude,
Cursor, or Codex config.

Either way, start with the ordinary business path. The [`b2c-app-builder` skill](SKILL.md)
routes that work. `b2c --help` groups commands by task; see
[Find a command](docs/guides/runtime-package.md#find-a-command) rather than a
second command table here. Catalog discovery and composition preview are optional later.

For a new business, create and register its planning workspace in one command:

```bash
b2c business-create --workspace my-app --directory /absolute/path/to/my-app --name "My App" --hypothesis "The consumer problem to research" --mandate-file ./brief.md --json
b2c business-status --workspace my-app --json
b2c business-plan --workspace my-app --json
```

The target must be empty or absent. For an existing planning or runtime workspace,
use `b2c workspaces register` to adopt it, then resume through status and plan.
Creation records a hypothesis; research and an explicit product decision precede
initialization. Direct `--mandate` is for short requests. `--mandate-file` preserves
the complete founder brief in `operations/FOUNDER_BRIEF.md`.

Continue from the canonical brief in `operations/FOUNDER_BRIEF.md`. `operations/LAUNCH_PROGRAM.md`
is the derived program view and does not replace that source.

The [business-building guide](docs/guides/build-a-business.md) walks through
the product workflow, design decisions, and release boundaries.

The public lifecycle creates a planning workspace, initializes its accepted
product with the 99-workflow complete-business recipe, plans eligible work, and
runs bounded sessions through the existing executor. Evidence reports separate
current acceptance from missing or stale proof. Interrupted requests close through revision-checked recovery after uncertain effects are reconciled. See the [lifecycle contract](docs/public-interface.md#business-lifecycle)
for commands, revisions, request replay, and recovery.

To inspect the catalog or preview a composition without creating a workspace:

```bash
b2c catalog --json
b2c compose --config contracts/public-api/examples/subscription-app.json --json
```

The preview resolves each operation to a provider and lists any blockers.
This declaration preview reports `canApply: false`. To activate an installed
package recipe, use the separate revision-checked
[composition plan and activation commands](docs/guides/composition-activation.md).

## What it covers

<!-- catalog-generated:start business-areas -->
| Area | Station | What the system helps an agent do |
| --- | --- | --- |
| [Opportunity](knowledge/README.md#opportunity) | Prep & design, menu planning | Research users, competitors, demand, and a defensible product hypothesis. |
| [Product](knowledge/README.md#product) | Prep & design | Define the promise, first value, core loop, complete scope, and success measures. |
| [Experience](knowledge/README.md#experience) | Prep & design | Develop a distinct identity, onboarding, interaction, motion, accessible states, and user-facing words. |
| [Engineering](knowledge/README.md#engineering) | The hot line | Build and release native and web surfaces with explicit contracts, runtime verification, privacy, and security. |
| [Revenue and growth](knowledge/README.md#revenue-and-growth) | Front of house | Establish subscriptions, acquisition, funnels, attribution, and lifecycle work. |
| [Learning and operations](knowledge/README.md#learning-and-operations) | The pass and the office | Inspect evidence, plan improvements, support users, coordinate work, and maintain the business. |
<!-- catalog-generated:end business-areas -->

Each area has workflow and knowledge coverage. See [Status](#status) for what
is implemented today.

## How it fits together

| Primitive  | What it is                                                                 | In the kitchen              | What you can change                                       |
| ---------- | -------------------------------------------------------------------------- | --------------------------- | --------------------------------------------------------- |
| Capability | A business responsibility with operation semantics and acceptance criteria | The equipment at a station  | Which responsibilities your business needs                |
| Provider   | An implementation of specific operations, with declared support and limits | The purveyor                | Vendor, tool, native stack, or execution environment      |
| Recipe     | A configurable creation or operating loop                                  | How you run service         | Sequence, review policy, parameters, and product approach |
| Knowledge  | Sourced guidance, loaded in bounded amounts                                | Mise en place               | The expertise selected for the task, provider, and recipe |
| Product Profile | Versioned projection of intended or observed product behavior, relationships, states, and claims | The working model at the pass | Which bounded product facts an agent needs for this task |
| Evidence   | Observations tied to a claim, artifact, and environment                    | The plate check at the pass | The tool that produces the observation, not its meaning   |

A provider swap does not redefine what an entitlement means. A different
analytics tool does not redefine activation. A new recipe reuses the same
execution and evidence machinery. Shared foundations should make distinctive
apps easier to build. Builders keep control of product, brand, business model,
and operating loop.

A composition binds a recipe to a target. It can override the provider for a
single operation:

```yaml
apiVersion: b2c/v1
recipe:
  id: b2c/subscription-app
  version: 1.0.0
target:
  platform: ios
  runtime: swiftui
bindings:
  b2c/monetization.present-paywall:
    provider:
      id: b2c/revenuecat
      version: 1.0.0
    connection: connection:paywalls
```

Save this as `b2c.yaml` and run `b2c compose --config b2c.yaml --json`. Every
other operation uses the recipe default. Connection values are names of
separately managed connections, never credentials. The
[architectural shape](docs/north-star-architecture.md#architectural-shape)
shows how a request moves through entrypoints, contracts, composition,
execution, and evidence.

![Sheet 3. One station in detail, with its operation, bound provider, loaded knowledge, and returned evidence.](docs/assets/station-detail.svg)

Sheet 3 draws that binding as one station. The purveyor can change, and the
operation keeps its meaning.

[Public interface](docs/public-interface.md) · [Generated schemas](contracts/public-api/REFERENCE.md) · [Extension guide](docs/guides/extend-the-system.md)

## Operate the app

Mobile app operation is a capability of its own. Agents use it to walk
customer journeys, reproduce bugs, review design, and capture screenshots or
demo footage. The default provider is the agent host's native simulator
tooling. MobAI or another provider can be selected when its coverage fits the
task better. The [mobile app operation guide](docs/guides/mobile-app-operation.md)
covers provider selection and what counts as evidence.

## Example quality

[Tuck](examples/tuck/README.md) shows real app and web captures, including trip planning,
packing, and the landing page. The gallery links capture provenance and
verification limits.

## Status

| Surface                                                               | Status                                                              |
| --------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Source-backed knowledge, workflow catalog, CLI, and local MCP         | Implemented                                                         |
| Workspace creation, planning, bounded execution, review, and evidence | Implemented                                                         |
| Product Profile v1: intended, observed, delta, bounded query, reference interop | Implemented; projections preserve existing truth owners and evidence boundaries |
| `b2c/v1` discovery, composition preview, and business status          | Implemented, with shared CLI/MCP schemas and contract tests         |
| Local package import and composition activation                       | Implemented with content pins, preview checks and recovery          |
| Provider execution routes                                             | Explicit host adapters; declarations alone never execute            |
| One complete, benchmark-quality consumer business                     | Next milestone                                                      |
| Comparable market reports                                             | Implemented; the observed multi-business milestone remains unproven |

Declared support, a working implementation, and a launch-ready business are
separate facts. This table reports the first two.

## Open source and credits

The builder runs and wraps open-source projects, adapts published methods, and
offers one optional managed provider. [ACKNOWLEDGMENTS.md](ACKNOWLEDGMENTS.md)
credits the projects and people behind that work.
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) carries the legal notices for
material the builder incorporates. Both files are rendered from the upstream
manifests under `catalog/upstreams`. Workers never receive credits as
instructions.

## Contribute

Contribute a better consumer-app reference, an operation contract, a provider,
or a recipe. Contributors build the kitchen and the way it runs. Most
contributions add a way to run a station, not a new station. First-party and
community extensions pass the same conformance suite. Start with the [extension guide](docs/guides/extend-the-system.md), then
[CONTRIBUTING.md](CONTRIBUTING.md). Agents read [AGENTS.md](AGENTS.md) first.
It routes by scope: one business uses `b2c-app-builder`, a reusable contribution
uses `b2c-contributor`, and the builder itself uses `b2c-maintainer`.

[MIT licensed](LICENSE).
