---
name: chained-review
description: Run the pre-merge code quality review. Runs the thermonuclear review on a change, applies Ponytail's YAGNI ladder to every finding, and uses Pstack to simplify and verify. Use for /chained-review, "review before merge", or a baseline simplification pass.
disable-model-invocation: true
---

# Chained review

The review step itself is read-only: do not push to main or change behavior while reviewing.

1. Pick the target: the named PR, branch, or files. Nothing named: the current branch against `main`.
2. Run `thermo-nuclear-code-quality-review` on the target. List each finding with file, line, and the proposed change.
3. Pass each finding through `ponytail`: does it need to exist, can the standard library or platform do it, can it be one line. Keep the smallest option. Drop findings that add code without removing more.
4. Run `ponytail-review` for correctness, safety, and tests on what remains.
5. For each kept change, use `/poteto-mode` (Pstack). Bugs follow its bug-fix playbook: reproduce, root cause, smallest fix, runtime evidence.
6. Verify: run the tests the change touches plus the gates in CONTRIBUTING.md. Record lines of code before and after (`git diff --shortstat main`).
7. Report: findings, what changed, tests run, LOC before and after. For a baseline pass, open one small PR per coherent simplification. Merge it once CI is green and review is clean, unless Codex or the PR states a specific reason to hold. Never bypass branch protections or force-push. Production releases, App Store submissions, payments, and cutover gates still need the founder's explicit yes.
