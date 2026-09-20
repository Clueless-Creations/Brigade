# Brand System Skill Onboard

Use this reference when a launch needs brand-locked stills or video instead of
generic AI commodity. It documents how Brigade onboards Amir Mushich's
[brand-system-skill](https://github.com/amirmushichge/brand-system-skill)
(CC BY 4.0) and when to reach for [motion-brief](https://github.com/amirmushichge/motion-brief).

This file is the **onboard path**. Method bodies stay in the owners below. Do not
create a second design authority.

## Tip inventory (homes)

| Concern | Home |
| --- | --- |
| Art-direction research / Design Room | `design-room.md`, `workflow.design.design-room`, `workflow.design.brand-definition`, `workflow.design.design-system-audit` |
| Audience identity and taste | `audience-derived-identity.md`, `quality-lens.md`, `design-worthiness.md` |
| Anchor Brand Kit + reference roles | `design-visual-system.md` § Brand Kit And Reference Roles |
| Brand Lock before still/video production | `remotion-content-assets.md` § Brand Consistency Before Production |
| Optional installed Skill pack routing | `../engineering/external-skill-packs.md` row `brand-system-skill` |
| Visual/motion recipes (Higgsfield, UGC, Remotion) | `../process/tool-recipes/visual-and-motion-production.md` |
| UGC Ops desk | `../growth/ugc-creator-engine.md` |
| Fastlane AI marketing path | `../growth/fastlane-growth-ops.md` |
| Paid/gen spend gate | `../operations/paid-tool-routing.md` |
| Upstream pin + notice | `catalog/upstreams/amir-brand-system.yaml`, `catalog/upstreams/notices/amir-brand-system.txt` |
| Fixture spike (no paid gen) | `examples/contributions/brand-system-skill-spike/` |

Selective harvest only: primary is `brand-system-skill`. Use `motion-brief` only
when a video path needs a Seedance-oriented brief structure. Do not bulk-install
other kits from the same author.

## DEEP PRODUCT DESIGN vs Brand Skill (do not replace)

**DEEP PRODUCT DESIGN** is Brigade's name for **art-direction research**: brief,
audience, journey, identity derivation, Design Room direction, quality-lens /
worthiness critique, and independent design-system audit. It decides *what the
product should feel and look like* and records that direction in `DESIGN.md`.

**Brand Skill** (this pattern) is **execution after direction exists**: Anchor
Brand Kit → reference roles → Generation Plan / Brand Lock → one inspected asset
→ scale only after consistency review.

| Phase | Owner | Brand Skill role |
| --- | --- | --- |
| Research & art direction | DEEP PRODUCT DESIGN (`design-room`, `brand-definition`, `quality-lens`, `audience-derived-identity`) | **None** — do not run Brand Skill to invent direction |
| Lock kit in `DESIGN.md` | Design Room acceptance + `design-visual-system` kit section | Adapted kit method may help structure the kit; Skill does not write `DESIGN.md` alone |
| Produce still / video / UGC / ads | Content-assets / UGC / Fastlane desks | Brand Lock procedure **required** before credit-burning gens |
| Optional Lovart / installed pack | Operator installs `brand-system-skill` | **Opt-in**; absence never blocks the B2C path |

Never treat the upstream Skill, case studies, or third-party metrics as a
substitute for DEEP PRODUCT DESIGN. Never claim Warner/Pepsi or other upstream
results as ours.

## Onboard path for `brand-system-skill`

1. Confirm DEEP PRODUCT DESIGN outputs are accepted: `DESIGN.md` direction,
   Design Room review, and (when in graph) design-system audit.
2. Record an **Anchor Brand Kit** inside existing `DESIGN.md` (typography,
   colors, imagery, composition, motion, allowed/rejected treatments). Link kit
   assets; do not invent a second global design doc. See
   [`design-visual-system.md`](./design-visual-system.md).
3. Decide install mode (see **Default-on vs opt-in** below). If installing the
   upstream Skill for a Lovart- or host-specific session: copy `SKILL.md` from
   the pinned upstream revision into that session only; do not vendor the Skill
   into this repository as executable authority.
4. Assign each creative reference a role: `identity`, `scene`, `composition`,
   `motion` (or product). Scene may not change approved identity.
5. Before any credit-burning generation, follow
   [`remotion-content-assets.md`](./remotion-content-assets.md) Brand Consistency
   and obtain spend authority via
   [`paid-tool-routing.md`](../operations/paid-tool-routing.md). Present a
   concise Generation Plan (objective, inputs, locked decisions, permitted
   variation, model) and wait for explicit human approval.
6. Produce **one** Brand-Locked still or short clip; independently review; repair
   before multiplying variants.
7. Record pack use (if any) in `strategy/TOOL_DECISIONS.md` with role, mode, and
   verified installed set.

Upstream pin: `catalog/upstreams/amir-brand-system.yaml` (reviewed commit
`30f6084ddf6adf4173cf882fce266015f8872c17`). Refresh on the upstream review
cadence; do not silently float.

## When to use `motion-brief`

Use [motion-brief](https://github.com/amirmushichge/motion-brief) **only** when:

- the asset is video (Seedance / image-to-video / Marketing Studio clip), and
- a structured production brief from a brand still would help the prompt, and
- DEEP PRODUCT DESIGN + Anchor Brand Kit already exist.

Motion Brief may structure a video brief. It does **not** choose the provider,
grant spending authority, replace Brand Lock, or waive
`paid-tool-routing.md`. It has no verified SPDX pin in this tip; treat it as an
optional external brief aid, not a vendored dependency. Do not import its
pricing/sell frameworks as our metrics.

## Studio desk wiring (required before credit-burning gens)

Desks that own creatives must satisfy all of the following before video/model
runs that burn credits:

1. Accepted art direction (DEEP PRODUCT DESIGN) and Anchor Brand Kit in
   `DESIGN.md`.
2. Brand Skill / Brand Lock procedure from `remotion-content-assets.md` (kit
   revision, reference roles, permitted variation, approved claims).
3. Explicit human approval for the Generation Plan and the paid route.

| Desk | File | Gate |
| --- | --- | --- |
| Content assets / Studio production | `remotion-content-assets.md`, `workflow.design.content-assets-remotion-generated-visuals` | Kit-bound brief before generate |
| Visual & motion recipes | `../process/tool-recipes/visual-and-motion-production.md` | Brand guide + Lock before Higgsfield / Marketing Studio / Seedance calls |
| UGC Ops | `../growth/ugc-creator-engine.md` | Script panel + Brand Lock before synthetic UGC gen spend |
| Fastlane AI marketing | `../growth/fastlane-growth-ops.md` | Brand Lock on generated/scheduled creatives; no auto spend |

Anti-slop and listing locks remain in force: `../words/no-slop-writing.md`,
store listing prep, and truthful-UI rules are not waived by Brand Lock.

## Default-on vs opt-in (recorded)

| Layer | Decision | Rationale |
| --- | --- | --- |
| Adapted Brand Lock + Anchor Kit procedure in Brigade knowledge | **Default process** for brand-bound creative production | Prevents generic commodity output without requiring a third-party install |
| Installing upstream `brand-system-skill` into an agent host / Lovart | **Opt-in** | Matches `external-skill-packs.md`; absence never blocks B2C |
| Any gen-credit spend | **Human approval required** | Matches upstream approval gates + `paid-tool-routing.md` |

Do not auto-spend gen credits under this issue or this Skill alone.

## Attribution and non-claims

- License: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Credit: Amir Mushich — Brand System Skill
  (https://github.com/amirmushichge/brand-system-skill).
- Notices: `catalog/upstreams/notices/amir-brand-system.txt`,
  `ACKNOWLEDGMENTS.md`, `THIRD_PARTY_NOTICES.md`.
- Do not claim upstream case studies, benchmarks, or commercial results as
  Clueless Creations outcomes.

## Spike evidence

See `examples/contributions/brand-system-skill-spike/` for a local
reference → Anchor Kit → Brand-Locked still path with **no paid generation**.
Paid gen remains **HOLD** without separate human approval.
