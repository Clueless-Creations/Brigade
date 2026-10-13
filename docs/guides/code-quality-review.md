# Code quality review

Use this procedure for a bounded review of proposed code changes in this repository.
For ordinary coding, apply the reuse order below while implementing the requested behavior.
This is repository guidance, not a runtime operation or an installed business skill.
The [source adoption record](../upstreams/code-quality-review.md) identifies the adapted methods and retained notices.

## Invoke

In a host that discovers repository skills, run:

```text
/review-code-quality <base> <head> [focused|deep]
```

Otherwise ask the reviewing agent to follow this file with the same arguments.
The slash command is a prompt entrypoint, not an executable test or a quality score.
Default to focused review. Use deep review for explicit requests or demonstrated structural risk.
A typo or other trivial change needs only its affected text, links, and existing required checks.

## Establish the review

1. Read the applicable `AGENTS.md`, current task, ownership, and [required checks](../../CONTRIBUTING.md#checks).
2. Resolve base and head to commit IDs. State the comparison and whether local edits are included.
3. Inspect the diff, affected callers, tests, and boundary contracts. Preserve other agents' edits.
4. State the intended behavior and retained guarantees before proposing simplification.
5. Use a reviewer who did not implement the change. Report missing independence as incomplete review.

Review is read-only. Findings do not authorize edits, PR creation, merge, installation, publication, or deployment.
If fixes are separately authorized, the implementer applies them and reruns affected checks.
The independent reviewer then checks the final head and any changed guarantees.
Existing [integration and authority rules](../../AGENTS.md#verification-and-integration) remain in force.
An AI review passing never authorizes automatic merge.

## Review lenses

**Necessity and reuse (Ponytail).** Check whether each new mechanism serves the requested behavior.
Prefer the existing owner, helper, component, or abstraction when it fits.
Next consider the standard library, native platform features, and already-installed dependencies.
Introduce a new dependency or abstraction only when its benefit exceeds its maintenance burden.
Keep the solution readable; a dense one-liner can hide more complexity than several direct statements.
Remove unused flexibility, wrappers, conversions, or speculative features when behavior and supported callers remain intact.

**Root cause and proof (pstack).** For a bug, reproduce the failure and trace its cause before suggesting a correction.
Inspect sibling callers for the same defect. Keep unrelated fixes outside the task.
Check persistent state and invalid observations when symptoms appear after restart.
Require evidence from the changed behavior or artifact; compilation alone cannot prove runtime correctness.
Retain validation at trust boundaries and error handling that prevents data loss.
A guard is suspect when it hides a broken invariant, not merely because it is a guard.

**Structure (Thermo-Nuclear Code Quality Review).** Trace repeated decisions, branch growth, unnecessary wrappers, and unclear type boundaries.
Check whether logic remains with its canonical owner and whether callers still understand its contract.
Consider simpler data models or existing abstractions that remove concepts rather than move complexity between files.
For stateful or asynchronous changes, inspect partial updates, recovery, ordering, and cancellation.
Parallelize only work proved independent; preserve transaction and authority boundaries.
File length and diff size prompt investigation, not mandatory splits or rewrites.
Deep review extends these questions into the immediately affected dependency path; it is not a repository-wide refactor mandate.

Correctness, security, accessibility, supported behavior, tests, and maintainability outrank line-count reduction.
Keep meaningful tests. Do not remove validation or weaken checks to make a smaller diff pass.
Use the existing architecture decision route if a proposed correction changes a supported contract or ownership boundary.

## Report

Record the base and head, reviewed paths, reviewer independence, and checks actually run.
List concrete findings by impact: location, triggering condition, consequence, bounded correction, and distinguishing proof.
Separate regressions, existing debt, optional simplifications, and missing evidence.
Do not invent findings or treat a stylistic preference as a blocker.
Say when no substantiated findings remain, with coverage limits and any required checks still pending.
Keep the result in the existing task or PR; do not create another review database.

## Bounded pilot

Use three existing, immutable changes: a small bug fix, a stateful/asynchronous change, and an instruction-only change.
Record their selection rationale and exact base/head in the existing task before reviewing them.
Review each once with this procedure. Cap each initial pass at 20 minutes and record unfinished coverage.
Do not modify those changes during the baseline review.

For each case, record accepted defects, rejected suggestions, regression-test evidence, reviewer time, and requested rework.
If a simplification is accepted later, record the actual implementation and review cycles, retained guarantees, and rerun checks.
Record line, branch, and dependency deltas only as descriptive evidence where useful.
A zero-deletion result is valid. No author-reported percentage is a local success target.
Unknown elapsed time, correctness, or rework stays unknown.

After three cases, the maintainer decides whether to keep, narrow, revise, or retire this procedure.
Adopt more broadly only if the evidence shows useful findings or simpler maintained code without weaker guarantees or disproportionate rework.
This pilot alone does not establish causality, productivity gains, or cross-project readiness.
Other repositories require their own owner, instructions, active-work, quality-gate, and review mapping before adoption.
