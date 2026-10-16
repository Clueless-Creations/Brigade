# Vendored development skills

Repository-only skills for agents that work on Brigade. They are not installed
business skills or part of the published skill surface. The upstream manifests
and retained MIT notices use the repository's existing catalog/credits owners.

| Material and attribution | Source | Reviewed commit | Manifest and notice |
| --- | --- | --- | --- |
| Ponytail and Ponytail review — DietrichGebert | https://github.com/DietrichGebert/ponytail (`skills/`) | 2961b52fc1fe6a5a87c7a959a79512e5c2f3ffe5 | [Manifest](../../catalog/upstreams/ponytail.yaml), [MIT notice](../../catalog/upstreams/notices/ponytail.txt) |
| pstack — Lauren Tan (@poteto), published by Cursor | https://github.com/cursor/plugins (`pstack/skills/`) | 1dcc2bacde73ddd284803b7af28164d0436198fc | [Manifest](../../catalog/upstreams/cursor-pstack.yaml), [MIT notice](../../catalog/upstreams/notices/cursor-pstack.txt) |
| Thermo-Nuclear Code Quality Review — Cursor Team Kit, Cursor | https://github.com/cursor/plugins (`cursor-team-kit/skills/`) | 1dcc2bacde73ddd284803b7af28164d0436198fc | [Manifest](../../catalog/upstreams/cursor-team-kit.yaml), [MIT notice](../../catalog/upstreams/notices/cursor-team-kit.txt) |
| `chained-review` | Authored here | Repository history | Repository license; selected derivations below |

Cursor provenance is verified for the selected Thermo-Nuclear skill; Anthropic
authorship is not established. Other similarly named variants remain unverified.
The manifests retain immutable source paths, license evidence and hashes.

## Supported local path

[Chained review](chained-review/SKILL.md) is the single local review procedure.
It adapts these selected methods under AGENTS.md and CONTRIBUTING.md:

The existing [Compound Engineering route](../../knowledge/orchestration/compound-engineering-routing.md)
owns applicable app stages. This loop reuses those stages and supplies the review
methods below; it adds no second planning, implementation, review or lesson process.

| Source unit | Kept | Local constraint |
| --- | --- | --- |
| Ponytail / Ponytail review | Necessity, reuse, native options, connected-code correctness and safety review | Preserve validation, error handling, accessibility and meaningful tests. No shortest-diff score, benchmark target, or exemption for unsafe documented shortcuts. |
| pstack Laziness Protocol, Fix Root Causes, Prove It Works | Consolidate decisions, reproduce defects, trace causes, verify the actual result | Scope related fixes; preserve required guards. No full Poteto Mode, shipping/cleanup playbooks, tool/model assumptions or external-action authority in this chain. |
| Thermo-Nuclear review | Structural simplification, canonical ownership, clear boundaries, ordering and atomicity | Evidence-based findings within the affected dependency path. File size is a signal, not an automatic blocker. |

Broader pstack files were vendored previously and remain discoverable source
material. They are outside this supported local path; their presence is not a
full plugin, script, host or authority qualification. Do not auto-load or execute
them through this chain. No upstream executable or installer was needed to adapt
these methods. Host discovery, actual invocation and pilot acceptance require
separate evidence; source inspection alone proves none of them.

## Copy history and updates

Vendored upstream files are unmodified except for the existing omissions and
example-link change below. `chained-review` is a local adaptation. Licenses were
moved unchanged from `.agents/licenses/` to the canonical notice paths above so
packaged upstream manifests retain their notice files.

- Left out of pstack: `poteto-help` (links to unvendored docs), `recall` (home-path example), and `make-bot-ui` (unregistered install and webhook URLs).
- pstack `why/references/synthesizer-prompt.md`: the example link `(url)` became `https://example.com/pull/123`.

Updates are manual maintainer changes: read the proposed source revision, review
rights and behavioral differences, retain local constraints, update pins and
provenance, and run applicable checks with independent review. No automatic
update hook is added. Generated credits remain owned by the release stamp.
