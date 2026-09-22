# Use Brigade with an agent

Give your agent the repository URL or point it at a checkout. Start with the
question you actually want answered. The agent should choose the smallest path
that can answer it.

## Choose the path

| Your request | Agent should do | Brigade setup required |
| --- | --- | --- |
| Explain, research, review, or plan something | Read the matching task skill and relevant knowledge. Keep the work advisory unless you ask for a change. | No runtime, MCP, or workspace |
| Make a focused change in an existing app | Read the app's instructions, inspect the affected surface, and run focused proof. | No Brigade runtime |
| Explore a new app idea | Use the opportunity and product task skills, then return a hypothesis and evidence before implementation. | No runtime for research |
| Build and operate one business over multiple sessions | Create or resume a registered workspace, then read status and plan before running bounded work. | Local CLI runtime; agent execution tools when running work |
| Ask for current store, billing, analytics, device, or provider facts | Use the named provider/device tools and report missing evidence as a blocker. | The relevant provider or device connection |
| Ask to inspect the catalog or preview a composition | Use `b2c catalog` or `b2c compose`. Treat preview as a declaration, not proof of executable provider support. | Node 24 and `npm ci` for a checkout; no Jev |

Do not create a workspace, install MCP, or configure Jev just to answer a
focused question. A task skill is intentionally usable on its own.

## The normal first response

For an ordinary product question, the agent should:

1. identify whether the request is focused work or a managed business;
2. read the smallest matching skill and the app's own instructions;
3. answer or make the requested scoped change;
4. name the evidence it used and what remains unverified.

The agent should not dump the whole catalog, invent provider access, or treat a
successful plan as a shipped product.

## When setup is needed

Use the local runtime only when you want the CLI, MCP, registered workspace
state, composition tooling, or repository checks:

```bash
nvm install
nvm use
npm ci
npm run setup
```

The repository pins Node 24 in `.nvmrc` and `.node-version`. `npm run setup`
creates the local registry and prints optional MCP registration instructions;
it does not edit Claude, Cursor, or Codex configuration. Keep MCP read-only by
default and use the CLI for approved writes.

Jev is optional. It is one provider path for selected semantic work, not a
prerequisite for task skills, research, product definition, planning, or
ordinary focused implementation.

## Useful prompts

These prompts keep the agent on the right path:

```text
Review the onboarding in my existing app and give me the highest-impact fixes.
Do not change files yet.
```

```text
Research whether this app idea is worth pursuing. Return the evidence,
hypothesis, risks, and the next founder decision. Do not create a workspace.
```

```text
Build and operate this as a complete consumer business. Start with the
hypothesis, research, and product decision; then use the managed lifecycle.
Pause for credentials, spend, pricing, legal, deployment, store submission,
and production release.
```

```text
Set up the local Brigade CLI and MCP connection for this checkout, then show
me the exact commands and the read-only tools available.
```

For the full contract, continue to the [business-building guide](build-a-business.md),
[public interface](../public-interface.md), and [runtime package guide](runtime-package.md).
