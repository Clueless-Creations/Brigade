# Recommended Agent Skills

Use this before an Expo, SwiftUI, Flutter, or web-landing implementation session.

Use it when the session needs an external agent skill pack for craft, motion, store work, or opt-in recency research.

This file is not a substitute for B2C App Builder validators. B2C App Builder owns graph execution, evidence, and done gates. External packs reduce craft mistakes inside a build session.

Do not install a vendor MCP as a B2C App Builder default. Do not vendor a pack without a LICENSE file.

## Contents

- 1. Stack Applicability
- 2. Selected Expo Path
- 3. Opt-In Packs
- 4. Skip List
- 5. Install Commands
- 6. Evidence Rule
- 7. MCP Server Evaluation
- 8. Periodic Audit

## 1. Stack Applicability

Expo is a selectable app stack, not the default. Load [`expo-stack-selection.md`](./expo-stack-selection.md) before treating a business as Expo. Stack-specific packs apply only when the selected stack matches. Stack-neutral Brigade owners apply on every mobile stack, including Flutter.

| Source | Mode | SwiftUI | Expo / RN | Flutter | Web landing | Approval |
| --- | --- | --- | --- | --- | --- | --- |
| `expo/skills` (`expo-skills`) | producer, Expo stack only | no | yes, mapped skill from `catalog/stacks/expo-agent-tools.ts` | no | Expo web surface only | founder, scoped `--skill` |
| `emilkowalski/skills` `animate-expo` | producer, Expo/RN only | no | yes; do not also install Expo `expo-animation` (same body, Emil's notice) | no | no | founder |
| `emilkowalski/skills` `review-animations`, `improve-animations`, `find-animation-opportunities` | auditor; different agent from the producer | motion review only | yes | stack-neutral Brigade owners first; these packs are Expo/web-leaning | yes, web motion | founder |
| `emilkowalski/skills` `write-swift` | producer reference | yes | no | no | no | founder |
| `emilkowalski/skills` `apple-design`, `emil-design-eng`, `animate`, `animation-vocabulary`, `mobile-native` | reference, web/landing lane | no | no | no | yes | founder |
| `Appllama/appllama-skills` `appllama-app-design-skill` | producer companion | no | yes | no; use `mobile-flow-craft.md` | no | founder |
| `Appllama/appllama-skills` `appllama-usage` | provider usage | only with authorized Appllama MCP | only with authorized Appllama MCP | only with authorized Appllama MCP | no | independently authorized MCP |
| `vercel-labs/agent-skills` React Native skill | hold | no | opt-in install after a LICENSE file exists; Brigade adapts nothing | no | no | founder; rights still unverified |
| `vercel-labs/agent-skills` deploy, token, optimize, writing, web-design | reject or web-only reference | no | no | no | writing stays in `no-slop-writing.md` | do not install |
| `twostraws/SwiftUI-Agent-Skill` `swiftui-pro` | auditor; different agent from the producer | yes | no | no | no | founder |
| Paid EAS skills (`eas-*`) | selected-method, paid | native Swift iOS only when that EAS skill says so | yes, unselected until chosen | no | EAS Hosting only | founder; paid |
| `mvanhorn/last30days-skill` `last30days` | opt-in recency engine | stack-neutral | stack-neutral | stack-neutral | stack-neutral | founder |

Before applying version-specific API advice from any pack, read the project's actual deployment target. Do not copy unverified platform version claims (including SwiftUI Pro's Core Instructions). Platform versions come from current vendor documentation.

Do not install an external skill merely because B2C App Builder cites methods derived from it. The internal doctrine is sufficient when the stack-specific instructions add no value.

## 2. Selected Expo Path

When the composition target is `{ platform: ios|android|web, runtime: expo }` and the founder approved an external pack for that session, these packs are optional:

- `expo/skills` — Expo Router, native UI, EAS, and store guidance from Expo. Discover the mapped skill name from `catalog/stacks/expo-agent-tools.ts` first. Do not install during intake or as a global default. Do not run a blanket `npx skills add expo/skills --skill '*' --yes`. `expo-skill-feedback` stays refused.
- `emilkowalski/skills` `animate-expo` — Expo/RN motion producer. Do not also load Expo `expo-animation`.

An `expo` dependency is not permission to install these packs.

## 3. Opt-In Packs

Use these packs only when the product path matches:

- `Appllama/appllama-skills` `appllama-app-design-skill` — optional implementation companion for Expo/React Native mobile craft. B2C App Builder already adapts its cross-platform flow, native-fidelity, anti-generic, motion, and verification principles in `knowledge/design/mobile-flow-craft.md`; load the upstream skill when its stack-specific recipes improve the selected implementation.
- `Appllama/appllama-skills` `appllama-usage` — only when the acting user has independently authorized Appllama MCP access and the task needs its proprietary mobile-design evidence. Let the upstream skill own provider syntax, credits, pagination, and media behavior. B2C App Builder owns the research question, evidence contract, and adoption decision.
- `emilkowalski/skills` auditor trio — `review-animations`, `improve-animations`, `find-animation-opportunities`. A different agent from the motion producer. See `external-skill-packs.md`.
- `emilkowalski/skills` `write-swift` — SwiftUI stack only.
- `vercel-labs/agent-skills` React Native skill — only after a LICENSE file exists on that repo. Brigade still adapts nothing from it. Performance methods in `premium-mobile-craft.md` come from primary platform docs.
- `twostraws/SwiftUI-Agent-Skill` `swiftui-pro` — SwiftUI archetype or a native SwiftUI brownfield app only, auditor mode, founder approval. Brigade's SwiftUI adapter and `accessibility-readiness.md` remain the contracts.
- `mvanhorn/last30days-skill` `last30days` — optional host engine for scored recency briefs. B2C App Builder already adapts the method in `knowledge/process/tool-recipes/research-intelligence.md`. Load the upstream skill only when the host already has it or the founder approved install. It does not replace AppKittie, XPOZ, or Firecrawl.

## 4. Skip List

Do not add these to the default B2C App Builder surface:

- The full Vercel labs pack (web and deploy skills). `deploy-to-vercel`, `vercel-cli-with-tokens`, and `vercel-optimize` stay rejected.
- Emil `ask-sonner`, `pick-ui-library`, and `prototype`.
- Appeeky MCP or any paid UA vendor MCP.
- Appllama MCP as an automatic/default dependency. It is optional, user-authorized design evidence when available.
- Expo hooks, Expo MCP as a default, and `expo-skill-feedback`.
- Bulk install of every skill named in a social roundup.
- The last30days Claude Code marketplace plugin on a host that already installed the skill with `npx skills add`. The two copies duplicate.

## 5. Install Commands

Run with founder approval. Do not treat install as a done gate.

```bash
npx skills add expo/skills --skill expo-overview
npx skills add emilkowalski/skills --skill animate-expo
```

Auditor-mode Emil skills, a different agent from the producer:

```bash
npx skills add emilkowalski/skills --skill review-animations --skill improve-animations --skill find-animation-opportunities
```

Optional Appllama implementation skill for a matching Expo/React Native session:

```bash
npx skills@latest add appllama/appllama-skills --skill appllama-app-design-skill
```

If Appllama MCP is independently connected and authorized for the user, load `appllama-usage` through the host's skill mechanism. Do not install or authorize the MCP merely because a workflow can use it.

Optional SwiftUI auditor, founder approval, SwiftUI stack only:

```bash
npx skills add https://github.com/twostraws/SwiftUI-Agent-Skill --skill swiftui-pro
```

Optional ASO pack (see `aso-store-ops.md`):

```bash
npx skills add Eronred/aso-skills --skill '*' --yes
```

Optional last30days recency-research skill, only after founder approval. The host engine needs Python 3.12 or newer. Do not run the upstream setup wizard, cookie capture, or extra CLI installs from a business session:

```bash
npx skills add mvanhorn/last30days-skill --skill last30days -g
```

## 6. Evidence Rule

A skill pack cannot mark a lane done. Device proof, store evidence, and `check:*` gates remain required.

Record the installed pack name in `engineering/ENGINEERING_PLAN.md` when a session used it. When provider evidence was used, record the resolved reference through the design evidence/rubric contract rather than treating skill installation as evidence.

## 7. MCP Server Evaluation

Check five things before approving a new vendor MCP:

- a recent release
- a complete README with setup examples
- automated tests or CI
- an open-source license for any client material we intend to adopt; a hosted service may have separate terms
- a use case this repo's own MCP does not already cover

Record the actual contributor count next to any star count. Star count alone does not show maintenance health.

Before installing, compare the package's claimed capability against its unpacked size. Run `npm view <package> --json | grep unpackedSize`. A tool that claims many local capabilities in a few kilobytes is often a thin network client, not a local implementation. Read the source when the size and the claim disagree.

Prefer a familiar CLI over an unfamiliar vendor MCP schema for a standard integration. A model often already knows a familiar CLI from training data. Reserve a vendor MCP for a proprietary API or evidence corpus where the provider owns information we cannot reproduce locally.

Record the check date, outcome, contributor count, last-release date, access/terms boundary, and selected role in `strategy/TOOL_DECISIONS.md` next to the install decision.

## 8. Periodic Audit

Review installed skill packs every quarter. Drop a pack once no lane in `state/business-state.json` still names it. Record the removal in `engineering/ENGINEERING_PLAN.md`.
