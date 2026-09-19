# Greenfield #76 business-change-impact Required-scenario matrix closeout (U4-6)

Owner: **#76**. Status: tip AC→evidence map + deterministic Required-scenario residual closeout.
Main pin at land: `2864605e9b6031174d475d1219b260ba303927be` / `b2c-app-builder@0.221.29` → stamp **0.221.30**.
Typed module: `catalog/providers/greenfield-76-change-impact-closeout-map.ts`.
Fixtures: `checks/verification/fixtures/greenfield-76-change-impact-closeout.fixtures.ts`
Primary pack: `checks/verification/fixtures/business-change-impact.fixtures.ts` (extend, do not rewrite).

This slice is **deterministic business-change-impact / Required-scenario matrix closeout** only.
It does **not** run live greenfield complete-business benchmark, publish-of-evidence,
invent a measured #72 onboarding interval, real provider/billing/legal access,
autonomous external-change detection, invent a parallel dependency DB / second graph
service, automatic product/pricing/provider migration, redo #66/#70/#71/#73/#75,
steal #38/#68/#107/#117/#395/#397/#403/#127, or start U5/#511 / #72 implementation.

## Consumed tip surfaces (do not rebuild)

| Area | Path | Note |
| --- | --- | --- |
| Business-change-impact pack | `business-change-impact.fixtures.ts` | Prior 4 checks + residual Required-scenario rows |
| Cascade workflow / receipt | `operating-system.ts` / `check-change-cascade.ts` | Exercise before inventing |
| Invalidation / review / lifecycle | `runstate.ts` / `review-evidence.ts` / `lifecycle.ts` | Canonical owners |
| Engine interruption / needs_readback | `engine.fixtures.ts` | Map to #76 interruption row — covered |
| #66 umbrella | `greenfield-delivery-audit-*` | **consume only** |
| #70 applicability | `greenfield-70-applicability-closeout-*` | **consume only** |
| #71 handoff/stop-lines | `greenfield-71-handoff-closeout-*` | **consume only** |
| #73 overhead Stage A retain | `greenfield-73-overhead-closeout-*` | **consume only** |
| #75 retrieval Stage A no-change | `greenfield-75-retrieval-closeout-*` | next was #76 — **consume only** |

## Acceptance / report → evidence

| #76 acceptance row | Tip evidence | Fixture / test | Status |
| --- | --- | --- | --- |
| Each scenario expected impact set + observed result | `business-change-impact.fixtures.ts` | business-change-impact suite | **done** |
| Structural ≠ proposed semantic ≠ approved ≠ runtime | four-layers check + residual rows | business-change-impact | **done** |
| Only justified reopen; unrelated preserved | checks 1–4 + residual rows | business-change-impact | **done** |
| Repair / freshness / idempotency / interruption | check 2–3 + engine interrupted-run | business-change-impact + engine | **done** |
| New relationship needs named consumer + failing regression | no new graph; cascade owners only | this closeout map | **done** |
| Fixture limits; no autonomous external-change / live legal-provider claim | hard holds + live→#72 | this closeout map | **done** |

## Required scenarios → evidence

| Required-scenario row | Tip fixture | Status |
| --- | --- | --- |
| Import permission unverified | `unverified import observation…` | **done** (landed) |
| Approved price/entitlement change | `approved price/entitlement change…` | **done** (residual landed) |
| Approved shipping-platform / design-scope | `approved shipping-platform change…` | **done** (residual landed) |
| Source correction contradicts one claim | `source correction reopens only the linked claim…` | **done** (residual landed) |
| Source metadata/URL no semantic change | `source metadata/URL change opens freshness…` | **done** (residual landed) |
| Duplicate change / interrupted repair | needs_readback + idempotent + engine interrupted-run | **done** (mapped; no residual hole) |

## Live / provider (held → #72)

| Hold | Owner | Note |
| --- | --- | --- |
| Live greenfield complete-business benchmark | **#72** | Default no in #76 |
| Publish-of-evidence | **#72** | Default no |
| Measured onboarding interval | **#72** | Do not invent elapsed/token/live metrics |
| Real provider / billing / legal equivalence / autonomous external-change detection | **#72** / held | Fixture cascades ≠ observed live behavior |

## Four proof layers (keep distinct)

1. **Structural validity** — catalog/YAML compiles and schema validates.
2. **Proposed semantic impact** — expected affected/unaffected ID sets recorded before cascade.
3. **Approved authority decision** — independent/authority decision required before engine applies consequences; worker cannot self-approve scope change.
4. **Current runtime acceptance** — node/binding status after invalidate/repair.

Structural success alone cannot keep an unsupported promise currently accepted once its material dependency was invalidated through the supported path.

## Expected-IDs rule

Compare **expected affected/unaffected IDs** from the fixture, not just a count of reopened nodes. Unrelated acceptance stays current where proof/deps are unchanged.

## Coordinate (do not steal)

| Issue | Role |
| --- | --- |
| #38 | Apple media producer/consumer change (coverage example only) |
| #68 | Plan/blocker projection — consume; do not reimplement |
| #107 / #117 | Versioned binding + semantic-chain inventory (CLOSED — consume) |
| #395 / #397 | Research Pivot/hold authoring + field diagnostics |
| #403 | 11-star ladder / quality-principle / visual judgment |
| #127 | Connection identity / wrong-surface |
| #72 | Live complete-business + publish-of-evidence + measured interval (**next deepen**) |

## Hard holds (this slice)

- Live greenfield / publish-of-evidence / measured onboarding interval → **#72**
- Real provider access / billing / legal equivalence / autonomous external-change detection
- Parallel dependency DB / second graph service / automatic product-pricing-provider migration
- Invent ontology slot names
- Sibling implementation → **#72** (separate deepen; authority-gated live)
- Redo #66 umbrella / #70 applicability / #71 handoff / #73 overhead / #75 retrieval
- Steal #38/#68/#107/#117/#395/#397/#403/#127
- Worker self-approving scope change
- U5 / #511, Formation, App Review, prices, credentials, paid-tool install, silent spend

## U4 remaining sequence (after #76)

```
#72 last
```

- Skip **#74 CLOSED**
- **No U5 / #511** until HoE orders
- After #76 close: **STOP → #72 deepen separate** (authority-gated live)

## Evidence class (this PR)

| Class | This slice |
| --- | --- |
| business-change-impact fixtures (prior 4 + residual rows) | **Yes** |
| AC→evidence map + thin closeout fixtures | **Yes** |
| Cascade / invalidate / review-evidence / lifecycle (consume) | **Yes** |
| Engine interruption / needs_readback (map) | **Yes** (read + map; no redo) |
| Live greenfield / publish-of-evidence / measured interval | **No** (→ #72) |
| Real provider / billing / legal / autonomous external-change | **No** (held) |
| Parallel dependency DB / second graph / auto price migration | **No** (hard hold) |

## Next

Parent Shepherd: merge PR when CI green → handoff comment → **close #76** → **STOP — next deepen is #72 ONLY** (separate; authority-gated live). Do not implement #72 here. Do not start U5/#511.
