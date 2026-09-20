# #3 Brand-system Skill pattern — independent implementation review

**Date:** 2026-09-20 (America/Chicago)  
**Base tip:** `df3d557` / `0.221.62`  
**Issue:** #3  
**Stamp under review:** `0.221.63` (this revision)

## Scope

Fresh-context review of U6 #3: onboard Amir Mushich brand-system-skill pattern
for design/branding/marketing without replacing DEEP PRODUCT DESIGN, without
unauthorized gen-credit spend, and without store/price/ads changes.

## Surfaces reviewed

| Surface | Finding |
| --- | --- |
| `knowledge/design/brand-system-skill-onboard.md` | Onboard path, tip inventory, DEEP PRODUCT DESIGN vs Brand Skill map, desk gates, opt-in vs default, attribution, spike pointer |
| `catalog/knowledge/design/design-brand-system-skill-onboard.yaml` | Packaged; binds design + growth workflows; CC BY source pin |
| `design-room.md` / `design-visual-system.md` / `remotion-content-assets.md` | DEEP PRODUCT DESIGN named; kit + Brand Lock link to onboard |
| `external-skill-packs.md` | Upstream pack remains **opt-in**; onboard cross-link |
| UGC / Fastlane / visual-and-motion recipes | Brand Lock required before credit-burning gens |
| `examples/contributions/brand-system-skill-spike/` | Local reference → kit → still; paid gen **HOLD** |
| Upstream `amir-brand-system` | local_owners include onboard; notice/ACKNOWLEDGMENTS retained |

## Acceptance map

| AC | Evidence | Status |
| --- | --- | --- |
| Onboard path documented | `brand-system-skill-onboard.md` | Met |
| DEEP PRODUCT DESIGN preserved | Explicit map + design-room naming; Skill is execution-after-direction | Met |
| Studio desks require guide+Skill/Lock before video/model runs | UGC, Fastlane, visual recipes, remotion | Met |
| Spike recorded + gaps | `SPIKE.md` local still; gaps vs anti-slop/listing | Met (paid HOLD) |
| Default-on vs opt-in + human gate | Table in onboard: adapted Lock = default process; upstream install = opt-in; gen credits = human approval | Met |
| CC BY attribution; no invented metrics | Upstream pin, notices, ACKNOWLEDGMENTS; spike disclaimer | Met |
| No store/price/ads; no publish; Profile untouched | Docs/wiring only; no listing/price files changed | Met |

## Decision recorded

- **Adapted Brand Lock + Anchor Kit procedure:** default process for brand-bound creatives.  
- **Upstream `brand-system-skill` install:** opt-in.  
- **Gen credits:** human approval required; this spike used local SVG only.

## Limitations left open

1. Paid Brand-Locked model still/video not produced — **HOLD** pending separate spend approval.  
2. `motion-brief` remains optional/unpinned (no SPDX in tip); cited for when-video-only.  
3. Live agent adherence to desk gates unevaluated (docs + fixture evidence only).  
4. Profile #564+, #2, npm publish, App Review, Formation, #987 out of scope.

## Verdict

#3 acceptance is met for docs + skill wiring + fixture spike evidence on this tip.
Leave PR open for CI; do not merge from this review alone; do not close #3 until
Shepherd/HoE settle. Do **not** start #2.
