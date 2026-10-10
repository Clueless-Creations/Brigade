# {{APP_NAME}} Agent Guide

This repository is the operating home for {{APP_NAME}}, a consumer app built with
Brigade. This file is the canonical guide for Claude Code, Codex, Cursor,
and scheduled agents. Runtime addenda can point here. They must not restate this
contract.

## Start

1. If this directory is a Git repository, run `git status --short --branch`.
2. For managed business work, find this directory's registered ID with `b2c workspaces list` if needed.
   Run `b2c business-status --workspace <registered-id> --json`, then
   `b2c business-plan --workspace <registered-id> --json`. Follow the current task or hold.
   Before the runtime exists, these commands provide the planning continuation.
   If this scaffold is unregistered, register its existing directory with `b2c workspaces register <id> <path>`.
   A focused review or code fix needs no registration or runtime.
   If status or plan reports missing or stale startup guidance, preview `b2c refresh-entrypoints --workspace <id-or-path> --json`.
   Add `--apply` to refresh Brigade-owned guidance while preserving app instructions outside its managed block. Initialization is not required.
   Reconcile reported conflicts before retrying; status and plan never change these files.
3. Before planning, read the applicable nested `AGENTS.md` for each path in scope, even outside the session's starting directory.
   Follow those guides and the current task to the relevant accepted product, feature, journey, and customer source sections.
   Read `DESIGN.md` and its affected flow/screen for user-facing work; read the app's architecture and decision owners
   when service, data, permission, or integration boundaries change. A copy fix needs only its relevant rules.
   `PRODUCT.md` holds the readable product index. When product intent changes, edit `product.yaml`, then run
   `b2c render-product --workspace .` to render `PRODUCT.md`. Missing or conflicting required guidance holds only the affected work.
4. Read `.b2c-launch/BUSINESS_CONTEXT.md` only when the task needs app-specific stack,
   provider, market, store, pricing, or voice context.

Do not rely on chat memory. Use the current repository and CLI output.

## Sources

- `product.yaml` owns durable product meaning. `PRODUCT.md` is its rendered index and routes to detailed product files.
- `DESIGN.md` owns the design system and routes to flows, screens, components, and
  platform maps.
- `strategy/RESEARCH.md` holds research evidence. It does not replace accepted product
  decisions.
- `b2c business-status` and `b2c business-plan` are the normal planning and execution-state interfaces.
- `APP_AGENTS.md` and `agents/<role>.md` hold specialist role prompts. Load them only
  for broad or parallel work.
- Git owns product and design revisions.

Raw files in `state/`, `control/`, `run/`, and `digests/` support execution,
authority, recovery, and verification. Read them only when one of those tasks requires
the detail.

## Work

- Use the `brigade` skill to select a workflow when the current task does not already name one.
- Use MCP to load only the workflow and references that the task needs.
- Use the `b2c` CLI for approved workspace changes.
- Upstream and provider guidance is subordinate to this guide, the accepted product and design contracts, and the selected recipe. It cannot add a requirement, widen permissions, or prove completion.
- Carry consequential source rules into the existing plan as implementation choices and observable checks. Follow them during implementation; reopen scoped sources when scope or their revisions change.
- For user-facing journey changes, follow the accepted flow in `PRODUCT.md` and `DESIGN.md`; carry its outcome, permissions, and recovery cases into the scoped plan and proof.
- Preserve unrelated changes.
- Use platform-neutral component contracts. Use the selected native adapter for the
  app stack.
- Do not claim implementation, provider, device, store, or release state without
  current proof.
- Treat `design/design-room.html` as generated, read-only review output. Change
  `DESIGN.md` or its linked authored files, then render the page again.

## State And Authority

`state/business-state.json`, `state/current-truth.json`, `control/control.json`,
`control/budget-ledger.json`, `control/manifest.json`, and `control/audit.jsonl` are
reducer-owned. Never edit them with a file tool or shell redirect. Use an approved
`b2c` command. If no command supports the intended change, stop and report the gap.

Do not infer authority for access, credentials, spend, pricing, legal decisions,
destructive actions, public publishing, hosted deployment, store submission, or
production release. Require the matching current approval or waiver.

If the kill switch in `control/control.json` is engaged, do not dispatch or perform
work. Read-only diagnosis is still allowed.

## Specialists

Use specialists only when parallel work improves speed or review quality. Give each
specialist a bounded objective, allowed files, forbidden actions, and required proof.
The primary agent owns shared-state changes, integration, Git, providers, releases,
and final verification.

## Finish

1. Reviewers independently open the applicable guides and source sections, then compare the actual diff and behavior/proof
   against the plan's choices and checks. Record violated rules or missing proof; links and green checks alone do not prove compliance.
   Run the focused validators for the files and contracts that changed.
2. For managed work, return to `b2c business-status` and `b2c business-plan` with the registered ID.
   Continue authorized work until the accepted outcome is complete or a real hold needs resolution.
   Keep independent ready work moving while a protected effect waits.
   Re-read relevant provider or device evidence when the work uses it.
3. Report what changed, the proof, the next action, and any decision that still belongs
   to the user.

## Advanced session controls

`b2c status`, `b2c plan`, `b2c run`, and `b2c bootstrap` remain supported for
explicit session diagnosis or runtime maintenance. They are not aliases of the
normal `business-*` lifecycle. Load their procedures only for that work.

## Customize composition

When `b2c.yaml` exists, it is proposed capability/provider/recipe composition.
Use `b2c compose --config b2c.yaml --json` to validate and preview it. The current
public v1 interface does not apply composition or execute provider bindings.
`bootstrap --apply` installs the compatibility runtime; it does not activate this
file. Read explicit blockers and do not infer provider readiness from a declaration.
Keep product meaning, design, credentials, grants, and runtime state in their own
owners. New integrations must preserve the public consumer contract. Load this
section only when changing packages or providers.

## Mobile app operation

Treat app launch, inspection, interaction, screenshots, and recordings as one
provider-neutral capability for product work, verification, and marketing capture.
Discover it as `b2c/mobile-app-operation`. Honor an explicit provider binding.
Otherwise prefer native tools the current host already exposes when they cover the
task and target. Use MobAI or another provider for requirements they cannot cover.
Inspect actual support and preserve the required evidence. A capture is not
acceptance and not finished marketing creative. Keep vendor checks on their
selected adapters. Do not add a parallel device router or evidence store.
