# Adoption map: ios-agent-skill-packs

Goal: Adopt five iOS/app agent-skill sources as maintained upstreams; adapt stack-neutral craft methods into existing owners; route stack-specific skills as opt-in packs

Created: 2026-10-07T16:28:02.099Z. Synthetic: no.

## Routing

- Scope: contribution
- Verdict: contribution
- Intended target: Existing design and engineering knowledge owners plus opt-in skill-pack routing
- Effect: Adapted stack-neutral methods and selected-skill-guidance; no provider execution or host install
- Reason: targets are knowledge references, extension packages, evaluations, or showcases

## Sources

| id | kind | origin | publisher | revision | retrieval | rights | refused directives |
| --- | --- | --- | --- | --- | --- | --- | --- |
| expo-skills-1 | repository | https://github.com/expo/skills | 650 Industries, Inc. (aka Expo) | main@d4f484024fec15196bfd3c272e953e3f983972cf | complete | verified MIT; evidence LICENSE | 6 |
| appllama-appllama-skills-2 | repository | https://github.com/Appllama/appllama-skills | Antmind Ventures Private Limited (appllama.io) | main@dd5caaec3d5d50ad7fc0324da238119c6b7c3707 | complete | verified MIT; evidence LICENSE | 5 |
| emilkowalski-skills-3 | repository | https://github.com/emilkowalski/skills | Emil Kowalski | main@e8a175de22ae1e49370fc144c1f3bb9aeedf988d | complete | verified MIT; evidence LICENSE | 2 |
| vercel-labs-agent-skills-4 | repository | https://github.com/vercel-labs/agent-skills | vercel-labs | main@063bee94c3f4df8453406c830b0a7df0f2860278 | complete | unverified MIT; evidence README.md names MIT without license text | 16 |
| twostraws-swiftui-agent-skill-5 | repository | https://github.com/twostraws/SwiftUI-Agent-Skill | Paul Hudson | main@f9800713b24580bc444931949aad4519128605e8 | complete | verified MIT; evidence LICENSE | 4 |

### Refused directives

Sentences in the sources that read as instructions to an agent. They are recorded as data and were not followed.

| source | location | category | text |
| --- | --- | --- | --- |
| expo-skills-1 | AGENTS.md:93 | grant-permission | allowed-tools without permission |
| expo-skills-1 | README.md | install | npx skills add expo/skills --skill '*' --yes |
| expo-skills-1 | plugins/expo/hooks/hooks.json | execute | PostToolUse and UserPromptExpansion run skill-event.cjs |
| expo-skills-1 | plugins/expo/mcp.json | configure-agent | Expo MCP |
| expo-skills-1 | plugins/expo/skills/expo-skill-feedback/SKILL.md | execute | npx submit-expo-feedback |
| expo-skills-1 | plugins/expo | configure-agent | host plugin manifests |
| appllama-appllama-skills-2 | README.md:86 | configure-agent | Claude skills directory install |
| appllama-appllama-skills-2 | README.md:90 | fetch-remote | git clone |
| appllama-appllama-skills-2 | README.md:91 | configure-agent | copy into ~/.claude/skills |
| appllama-appllama-skills-2 | mcp.json | configure-agent | Appllama mcp.json |
| appllama-appllama-skills-2 | README.md | install | npx skills add appllama/appllama-skills |
| emilkowalski-skills-3 | README.md:48 | execute | improve-animations executable plans |
| emilkowalski-skills-3 | README.md | install | npx skills add emilkowalski/skills |
| vercel-labs-agent-skills-4 | README.md | publish / install | deploy, token, optimize, and npx skills add |
| twostraws-swiftui-agent-skill-5 | README.md | install | npx skills add and brew install node |
| twostraws-swiftui-agent-skill-5 | agents/openai.yaml | configure-agent | host plugin copy |
| twostraws-swiftui-agent-skill-5 | swiftui-pro/SKILL.md | other | iOS 27 / Xcode 27.1 / Swift 6.4 / iPhone Duo |

## Units

| unit | kind | upstream location | local target | disposition | status | selection | applicability |
| --- | --- | --- | --- | --- | --- | --- | --- |
| expo-skill-routing | knowledge | expo-skills-1 README.md | recommended-agent-skills.md | reference | proposed | selected-method | Expo stack only |
| expo-inventory-refresh | knowledge | original | expo-operations-map.md | original | proposed | always | |
| native-slop-tells | knowledge | expo native-slop.md | vibecoded-tells.md | adapt | proposed | always | |
| four-state-screens | knowledge | expo-data-fetching | mobile-flow-craft.md | adapt | proposed | always | |
| eas-paid-skills | knowledge | expo README | expo-operations-map.md | reference | proposed | selected-method | Paid EAS |
| expo-hooks-mcp-feedback | resource | hooks.json | undecided | reject | rejected | reference-only | |
| appllama-refresh | knowledge | appllama README | recommended-agent-skills.md | reference | proposed | selected-method | Expo / RN for app-design |
| motion-review-standards | knowledge | review-animations | premium-mobile-craft.md | adapt | proposed | always | |
| momentum-projection | knowledge | apple-design | motion-craft-benchmarks.md | adapt | proposed | always | |
| worst-case-data | knowledge | break-ui | mobile-flow-craft.md | adapt | proposed | always | |
| emil-producer-auditor-routing | knowledge | animate-expo | recommended-agent-skills.md | reference | proposed | selected-method | Expo / RN for animate-expo |
| write-swift-routing | knowledge | write-swift | recommended-agent-skills.md | reference | proposed | selected-method | SwiftUI only |
| emil-web-skills | knowledge | apple-design | recommended-agent-skills.md | reference | proposed | reference-only | Web landing only |
| emil-rejected-skills | resource | README | undecided | reject | rejected | reference-only | |
| vercel-tracking | knowledge | README | recommended-agent-skills.md | defer | deferred | reference-only | |
| vercel-rn-hold | knowledge | README | recommended-agent-skills.md | reference | proposed | reference-only | Expo / RN after LICENSE |
| vercel-performance-informed | knowledge | original | premium-mobile-craft.md | original | proposed | always | |
| vercel-rejected-deploy | resource | README | undecided | reject | rejected | reference-only | |
| vercel-web-skills | knowledge | README | recommended-agent-skills.md | reject | rejected | reference-only | |
| swiftui-pro-routing | knowledge | swiftui-pro/SKILL.md | recommended-agent-skills.md | reference | proposed | selected-method | SwiftUI only |
| swiftui-version-claims | resource | swiftui-pro/SKILL.md | undecided | reject | rejected | reference-only | |
| ios-skill-pack-boundary-eval | evaluation | original | ios-skill-pack-boundary.yaml | original | proposed | always | |
| ios-skill-pack-swiftui-eval | evaluation | original | ios-skill-pack-swiftui-auditor.yaml | original | proposed | selected-method | SwiftUI only |

## Kept, changed, omitted

### native-slop-tells

- Kept: Named tell methods
- Changed: Stack-neutral wording
- Omitted: Expo-only APIs and React Native grep recipes

### four-state-screens

- Kept: Loading, empty, error, and content as distinct states
- Changed: Reauthored into ship-state-cycles
- Omitted: Expo Router and TanStack Query recipes

### motion-review-standards

- Kept: Frequency/purpose gates; existing springs and frame budget
- Changed: Asymmetric enter/exit, origin-aware scale, rapid-trigger interruptibility, gentler reduced motion
- Omitted: CSS easings and millisecond defaults

### momentum-projection

- Kept: 1:1 tracking, velocity handoff, rubber-banding, interruptibility
- Changed: Projected rest position and trajectory hint
- Omitted: Web CSS construction

### worst-case-data

- Kept: Existing state-cycle contract
- Changed: Worst-case data catalog as a review method
- Omitted: Demo data toggle in the shipped product

### expo-hooks-mcp-feedback / emil-rejected-skills / vercel-rejected-deploy / swiftui-version-claims

- Omitted as recorded: hooks, MCP, feedback, web-library opinions, deploy/token/optimize, unverified platform versions

## Uncertainties

- vercel-labs-agent-skills-4 rights unverified; adapt, reuse, wrap, and vendor stay blocked until license text is read
- No host install, live skill execution, or device proof was run
- SwiftUI Pro Core Instructions version claims stay refused

## Missing core mechanism

Present: the sources expect host skill install, MCP registration, hooks, or setup scripts. The contribution records those directives as refused and adopts methods without that mechanism.

## Required checks

- b2c contribute check
- b2c contribute preview
- npm run check:catalog
- npm run check:upstreams
- npm run check:credits

## Affected outputs

- knowledge/engineering/recommended-agent-skills.md
- knowledge/engineering/external-skill-packs.md
- knowledge/engineering/expo-operations-map.md
- knowledge/design/vibecoded-tells.md
- knowledge/design/mobile-flow-craft.md
- knowledge/design/premium-mobile-craft.md
- knowledge/design/motion-craft-benchmarks.md
- checks/validation/repository/evals/agent-behavior/ios-skill-pack-boundary.yaml
- checks/validation/repository/evals/agent-behavior/ios-skill-pack-swiftui-auditor.yaml
