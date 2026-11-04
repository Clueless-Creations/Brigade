# Development skill sources

Agents that work on Brigade get Ponytail and pstack from host plugins. Brigade keeps
no copies of them and pins no version of them, and nothing in this repository selects
an upstream version. Each host owns its plugin install and updates.

[Chained review](chained-review/SKILL.md) is the one skill kept here. It is authored
in this repository and carries its selected methods in its own text, so it still
works on a host without the plugins.

| Material and attribution | Source | Manifest and notice |
| --- | --- | --- |
| Ponytail and Ponytail review — DietrichGebert | https://github.com/DietrichGebert/ponytail (`skills/`) | [Manifest](../../catalog/upstreams/ponytail.yaml), [MIT notice](../../catalog/upstreams/notices/ponytail.txt) |
| pstack — Lauren Tan (@poteto), published by Cursor | https://github.com/cursor/plugins (`pstack/skills/`) | [Manifest](../../catalog/upstreams/cursor-pstack.yaml), [MIT notice](../../catalog/upstreams/notices/cursor-pstack.txt) |
| Thermo-Nuclear Code Quality Review — Cursor Team Kit, Cursor | https://github.com/cursor/plugins (`cursor-team-kit/skills/`) | [Manifest](../../catalog/upstreams/cursor-team-kit.yaml), [MIT notice](../../catalog/upstreams/notices/cursor-team-kit.txt) |
| `chained-review` | Authored here | Repository license; selected derivations below |

Cursor provenance is verified for the selected Thermo-Nuclear skill; Anthropic
authorship is not established. Other similarly named variants remain unverified.
The manifests keep the license evidence and the dated source review behind each
adapted method. Those are receipts, not pins.

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

Host discovery, actual invocation and pilot acceptance require separate evidence;
source inspection alone proves none of them.

## Updates

When an upstream method changes in a way that matters here, update `chained-review` through a normal reviewed change. Generated
credits remain owned by the release stamp.
