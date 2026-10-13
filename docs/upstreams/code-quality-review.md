# Code quality review sources

Selected methods inform the repository-local [code quality review guide](../guides/code-quality-review.md).
This adoption adds no runtime provider, installer, hook, or automatic update mechanism.
The upstream manifests own identity, reviewed revisions, license hashes, local consumers, and maintenance cadence.

## Source review

The selected public skill files and their licenses were read as reference data on 2026-10-13.
No upstream code, installer, host configuration, or hook was executed.
The exact reviewed files follow. These immutable links do not track upstream branch changes.

| Source and attribution | Reviewed skill text | Manifest |
| --- | --- | --- |
| Ponytail — DietrichGebert | [Ponytail](https://github.com/DietrichGebert/ponytail/blob/2961b52fc1fe6a5a87c7a959a79512e5c2f3ffe5/skills/ponytail/SKILL.md) | [ponytail.yaml](../../catalog/upstreams/ponytail.yaml) |
| pstack — Lauren Tan (@poteto), published in Cursor's plugin repository | [Laziness Protocol](https://github.com/cursor/plugins/blob/1dcc2bacde73ddd284803b7af28164d0436198fc/pstack/skills/principle-laziness-protocol/SKILL.md), [Fix Root Causes](https://github.com/cursor/plugins/blob/1dcc2bacde73ddd284803b7af28164d0436198fc/pstack/skills/principle-fix-root-causes/SKILL.md), [Prove It Works](https://github.com/cursor/plugins/blob/1dcc2bacde73ddd284803b7af28164d0436198fc/pstack/skills/principle-prove-it-works/SKILL.md) | [cursor-pstack.yaml](../../catalog/upstreams/cursor-pstack.yaml) |
| Cursor Team Kit — Cursor | [Thermo-Nuclear Code Quality Review](https://github.com/cursor/plugins/blob/1dcc2bacde73ddd284803b7af28164d0436198fc/cursor-team-kit/skills/thermo-nuclear-code-quality-review/SKILL.md) | [cursor-team-kit.yaml](../../catalog/upstreams/cursor-team-kit.yaml) |

The selected Thermo-Nuclear source establishes Cursor provenance. Anthropic authorship is unverified and is not asserted.
Other skills or variants need their own source and rights review before adoption.

## Adoption map

Each unit is an adapted method, selected only for the current repository coding or review task.
The [review guide](../guides/code-quality-review.md) owns the local procedure; this map owns its source derivations.
Existing repository authority, quality gates, and independent review still apply.

| Source unit | Kept in the local guide | Changed or omitted |
| --- | --- | --- |
| Ponytail | Smallest complete change; existing abstractions before new ones; native options; caller coverage; preservation of validation and error handling. | Omit persistent session modes, rigid comment formats, shortest-diff scoring, and benchmark targets. Preserve correctness, security, accessibility, tests, and maintainability. |
| pstack: Laziness Protocol | Consolidate repeated decisions and remove unnecessary complexity. | Line count does not rank otherwise different correctness or maintenance outcomes. |
| pstack: Fix Root Causes | Reproduce the failure, inspect evidence, trace the cause, and inspect related instances. | Preserve trust-boundary validation and necessary guards. Related fixes stay within authorized scope; symptom suppression does not count as a root-cause fix. |
| pstack: Prove It Works | Check the actual artifact and behavior; use reproducible verification when useful. | Keep proof proportional to risk. A trivial edit does not require a new script or stored artifact. Existing required gates remain mandatory. |
| Thermo-Nuclear Code Quality Review | Review structural complexity, canonical layers, meaningful abstractions, explicit contracts, and atomic updates. Prefer simplification that preserves behavior. | File length and diff size are signals, not automatic blockers. Review does not authorize unrelated restructuring or require speculative redesign. |

Ponytail and pstack overlap on simplification. One local procedure combines them without adding a second review stage.
The deeper structural review applies when the task or semantic risk warrants it.
The broader pstack plugin remains outside this adoption, including poteto-mode and shipping or cleanup playbooks.
Host-specific tools, model choices, automatic PR creation, external-action autonomy, and automatic merge are not adopted.
Upstream marketing and benchmark claims establish no local quality target or promised percentage gain.

## License evidence

Each selected source uses MIT. The retained notices copy the corresponding license bytes without alteration.
The manifests record their SHA-256 hashes and coverage.

| Source | Immutable license evidence | Retained notice |
| --- | --- | --- |
| Ponytail | [Root LICENSE](https://github.com/DietrichGebert/ponytail/blob/2961b52fc1fe6a5a87c7a959a79512e5c2f3ffe5/LICENSE) | [DietrichGebert notice](../../catalog/upstreams/notices/ponytail.txt) |
| pstack | [pstack/LICENSE](https://github.com/cursor/plugins/blob/1dcc2bacde73ddd284803b7af28164d0436198fc/pstack/LICENSE) | [Lauren Tan notice](../../catalog/upstreams/notices/cursor-pstack.txt) |
| Cursor Team Kit | [cursor-team-kit/LICENSE](https://github.com/cursor/plugins/blob/1dcc2bacde73ddd284803b7af28164d0436198fc/cursor-team-kit/LICENSE) | [Cursor notice](../../catalog/upstreams/notices/cursor-team-kit.txt) |

## Review and adoption status

Source identity, selected text, and license evidence are reviewed. The manifests' `current` review status records that source review.
Their `untested` support entries do not claim runtime integration or measured outcomes.
Independent review of the final change, required gates, and the bounded pilot remain separate acceptance evidence.
The pilot and any subsequent decision to keep, revise, or retire the guidance belong to the local review guide.

This is a repository-local draft. It does not install skills, repin businesses, or update other repositories.
Use the [small-change source-adoption route](../guides/adopt-external-sources.md#lifecycle); no separate contribution root is needed for these bounded derivations.
Future refreshes require source review, retained deviations, and applicable checks through the existing maintainer workflow.
Generated credit updates remain part of the repository release process; this draft changes only their authored inputs.
