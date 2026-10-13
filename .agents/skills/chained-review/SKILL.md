---
name: chained-review
description: Review a bounded change with Ponytail, selected pstack principles, and Thermo-Nuclear structural questions. Report concrete findings and verification limits before merge; do not edit or ship.
---

# Chained review

Use one review path for repository coding and review. Sources, pins, licenses, and
local adaptations are recorded in [VENDORED.md](../VENDORED.md).

## Invoke and bound the review

In Codex, request `$chained-review <base> <head> [focused|deep]`, or select the skill
through `/skills`. Other hosts may expose their own skill picker. If discovery is
unavailable, ask an independent reviewing agent to follow this file directly with
the same target. This is a prompt entry point, not an executable quality gate.

Read the applicable [AGENTS.md](../../../AGENTS.md), task, ownership and
[required checks](../../../CONTRIBUTING.md#checks). Resolve base and head to
immutable commit IDs. For a named PR, use its actual target branch; otherwise use
the repository's default branch. Record the merge base, head, reviewed paths and
whether local edits are included. Preserve other agents' work.

Default to focused review of the diff, affected callers, tests and contracts.
Use deep review only for an explicit request or demonstrated structural risk;
limit it to the affected dependency path. State retained behavior and guarantees.
Trivial edits need only affected text, links and existing required checks.

Review is read-only. Findings do not authorize fixes, PR creation, merge,
installation, publication, deployment, external messages or spend. Do not invoke
`poteto-mode`, its shipping/cleanup playbooks, setup scripts, or model/tool choices
as part of this chain. Separately authorized fixes belong to the implementer;
a reviewer who did not implement them must check the final head and affected
guarantees. A skipped or unavailable reviewer is incomplete evidence. A passing
AI review never authorizes automatic merge.

## Apply the selected methods

1. **Correctness and safety — Ponytail review.** Inspect connected code for wrong
   results, security risks, data loss, concurrency and missing meaningful tests.
   Establish these findings before considering simplification; never discard one
   because its fix adds lines. Preserve accessibility and supported behavior.
2. **Necessity and reuse — Ponytail.** Check whether each mechanism serves the
   requested behavior. Prefer the existing owner, helper or abstraction, then
   standard-library, native and already-installed options. Remove speculative
   flexibility only after checking supported callers. Prefer readable code over
   dense one-liners; new dependencies and abstractions must earn their upkeep.
3. **Structure — Thermo-Nuclear review.** Trace repeated decisions, branching,
   wrappers, unclear type boundaries and logic outside its canonical owner.
   Suggest restructuring only for a demonstrated concern. File length is a signal,
   not a split rule or blocker. Inspect partial updates, recovery, ordering and
   cancellation; parallelize only work proved independent.
4. **Root cause and proof — pstack.** Apply the selected Laziness Protocol, Fix Root
   Causes and Prove It Works principles: consolidate repeated decisions, reproduce
   defects, trace their cause and check the real result. Keep related fixes within
   scope. Preserve trust-boundary validation, necessary guards and error handling.
   Compilation alone does not prove runtime correctness.

Correctness, security, accessibility, supported behavior, tests and maintainability
outrank line-count reduction. Zero deletion is valid. Do not remove meaningful
tests, weaken checks or expand scope to obtain a smaller diff.

## Report and evaluate

Record exact base/head, reviewer independence, coverage and checks actually run.
Each finding needs a location, triggering case, consequence, bounded correction
and distinguishing proof. Separate regressions, existing debt, optional
simplifications and missing evidence. Do not invent findings or block on taste.
Report no substantiated findings when appropriate, together with coverage limits
and required checks still pending. Use the existing task or PR, not a new store.

For a pilot, preselect immutable representative changes and a time budget in the
existing task: include a small fix, stateful/asynchronous code and instructions.
Record accepted findings, rejected suggestions, actual test evidence, review time,
coverage limits and requested rework. Record added/removed lines only as context.
A three-case diagnostic does not satisfy a separately agreed larger pilot.

The maintainer decides whether to keep, narrow, revise or retire the method from
observed quality and rework. No benchmark percentage is a local target. Broader
adoption requires the agreed pilot, existing quality gates and independent review;
each repository needs its own owner, instructions, active-work and gate mapping.
