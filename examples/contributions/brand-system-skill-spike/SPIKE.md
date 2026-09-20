# Spike: reference → Anchor Kit → Brand-Locked still (#3)

**Date:** 2026-09-20 (America/Chicago)  
**Issue:** Clueless-Creations/Brigade#3  
**Tip base:** `df3d557` / `0.221.62`  
**Spend:** **HOLD** — no paid generative credits used. Local SVG compose only.

## Path executed

1. **Reference** — `inputs/reference.svg` (fixture geometric mark; not a third-party brand).
2. **Anchor Kit** — `kit/ANCHOR_KIT.md` records identity tokens, reference roles, allowed/forbidden variation (mirrors `design-visual-system` / Brand Lock method).
3. **Brand-Locked still** — `out/brand-locked-still.svg` composed from kit tokens only (primary clay, warm surface, serif display label, accent for secondary line). No model call.

## Generation Plan (would gate paid runs)

```text
GENERATION PLAN
Objective: one Brand-Locked vertical still for spike evidence
Deliverable: out/brand-locked-still.svg (local) — paid still HOLD
Inputs: inputs/reference.svg + kit/ANCHOR_KIT.md
References and roles: reference.svg → identity
Locked decisions: palette, serif display, no store chrome
Elements that may change: crop/layout within kit
Prohibited: cool AI defaults, ratings, prices, endorsements
Number and format: 1 still, 1080×1350 SVG
```

Human approval for paid gen: **not requested / not granted** → substitute local still.

## Gaps vs anti-slop / listing locks

| Gate | Spike status | Gap / note |
| --- | --- | --- |
| `no-slop-writing` | N/A for SVG mark; label text is meta (“Brand Lock”), not customer copy | Live creatives still need voice/claims audit |
| Store listing / screenshot truthful-UI | Not attempted | Brand Lock ≠ listing acceptance; store frames need real UI capture |
| `check:content-assets` v2 brief | Not run against a business workspace | Fixture kit is outside `DESIGN.md`; production must bind kit revision SHA |
| Anti-generic / quality-lens | Manual: avoided purple-glow AI defaults | Automated visual acceptance still human |
| UGC script judge panel | Out of scope (still, not UGC video) | Video path also needs script_id + judge_verdict |
| Paid-tool / Generation Plan | Documented HOLD | Required before Higgsfield/Seedance/Marketing Studio |

## Attribution

Method adapted from Amir Mushich brand-system-skill (CC BY 4.0). No upstream case studies or metrics claimed. Fixture artwork is original to this spike.
