# Vendored development skills

Repository-only skills for agents that work on Brigade. Not part of the published package.

| Skills | Source | Commit | License |
| --- | --- | --- | --- |
| `ponytail`, `ponytail-review` | https://github.com/DietrichGebert/ponytail (`skills/`) | 2961b52fc1fe6a5a87c7a959a79512e5c2f3ffe5 | MIT, [ponytail.LICENSE](../licenses/ponytail.LICENSE) |
| Pstack (`poteto-mode`, `principle-*`, and the rest of `pstack/skills/`) | https://github.com/cursor/plugins (`pstack/skills/`) | 1dcc2bacde73ddd284803b7af28164d0436198fc | MIT, [pstack.LICENSE](../licenses/pstack.LICENSE) |
| `thermo-nuclear-code-quality-review` | https://github.com/cursor/plugins (`cursor-team-kit/skills/`) | 1dcc2bacde73ddd284803b7af28164d0436198fc | MIT, [cursor-team-kit.LICENSE](../licenses/cursor-team-kit.LICENSE) |
| `chained-review` | Authored here | | Repository license |

Copied verbatim. To update, recopy from the source and change the commit above.

Local changes, kept small so Brigade's link audit passes:

- Left out of Pstack: `poteto-help` (links to Pstack docs that are not copied), `recall` (contains a home-path example), and `make-bot-ui` (unregistered install and webhook URLs). None are needed for writing, simplifying, debugging, or review.
- Pstack `why/references/synthesizer-prompt.md`: the example link `(url)` became `https://example.com/pull/123`.
