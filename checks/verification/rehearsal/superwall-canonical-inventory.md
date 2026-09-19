# Superwall canonical-operation inventory (#114)

Owner: #114. Status: durable inventory for ADR-0013 proving-provider audit.
Main pin at land: `70fb06a` / `b2c-app-builder@0.221.21` → stamp `0.221.22`.
Fixture pin: Superwall-iOS **4.16.3** (`a9990308209c27de2f3c74e666774f121149678e`).
Typed module: `catalog/providers/superwall-canonical-map.ts`.

## Authority / evidence holds

| Class | Allowed this slice | Notes |
| --- | --- | --- |
| Independent fixture / official SDK pin | Yes | 4.16.3 pin |
| Fake / local state wiring | Yes | Not contract source; local Swift tests ≠ transport proof |
| Live sandbox observe / dry-run | **No** (HoE settle) | Never campaign publish |
| Native device live purchase | No | `native-device-held` |
| Live campaign publish / production paywall | No | `production-campaign-held` |
| Account connect / credentials / prices / App Review | No | founder-protected |

`fixture ≠ fake-local-wiring ≠ sandbox-held ≠ native-device-held ≠ production-campaign-held`.
`--yes` / `--non-interactive` never grants authority.

## Catalog / upstream declare-or-hold (E3)

| Seam | Disposition | Why |
| --- | --- | --- |
| `catalog/providers/superwall.yaml` | **held** | Superwall is presentation/assignment when selected, not a full `billing` contract. Declaring `kind: billing` would conflate SW with RevenueCat and violate never-merge-SW+RC. Present-only first-party + extension + 4.16.3 pin already declare the truthful surface without inventing live campaign/API capabilities. |
| `catalog/upstreams/superwall*` | **held** | No managed CLI/API transport to pin like `revenuecat-cli` or ASC/rork. SDK pin lives in `examples/extensions/superwall-ios/native/Package.resolved` + source-registry `superwall-purchase-controller-4-16-3`. |

## Logical seams (ADR-0013)

| Role | Owner |
| --- | --- |
| definition | firstparty-declarations + superwall-canonical-map + superwall-ios extension |
| encoder | extension native (`register(placement:)`; PurchaseController host config) |
| transport | Superwall-iOS SDK 4.16.3 (host-configured; no auto-execution) |
| decoder | `adapters/providers/superwall/measurement.ts` + EntitlementState |
| reconciler | canonical monetization ops + #107 bindings; RC entitlement owners |

Not a generic multi-vendor billing provider framework. Not a second entitlement store.

## Native → canonical → impl → evidence (summary)

| Op class | Native (examples) | Canonical operation | Evidence | Authority / disposition |
| --- | --- | --- | --- | --- |
| present-paywall | `register(placement:)` | `b2c/monetization.present-paywall` | fixture | selected-binding / implement |
| config-campaign-fetch | SDK config / campaign fetch | none | sandbox-held | observe / **held** |
| triggers-events | placement triggers / events | none (exposure via measurement) | fixture | observe / extension |
| experimentation | treatment assignment | none | fixture | selected-binding / extension |
| purchase-delegation | PurchaseController → RC | `none` on SW; `b2c/monetization.purchase` on RC | fixture | selected-binding |
| entitlement-observe | RC CustomerInfo only | `b2c/monetization.read-entitlement` | fixture | selected-binding; SW callback **reject** |
| campaign-publish | dashboard publish/edit | none | production-campaign-held | founder-protected / **held** |
| placement-catalog | placement name catalogs | none | sandbox-held | defer |
| sw-native-analytics | SW dashboard analytics | none | sandbox-held | defer |
| account-connect | API key / account connect | none | production-campaign-held | founder-protected / **held** |

## Presentation ≠ purchase ≠ entitlement

- Superwall may own **presentation / treatment assignment** when selected.
- Purchase execution stays with **RevenueCat** via PurchaseController → `Purchases.shared` (no `Superwall.shared.purchase`).
- Entitlement truth stays with **RevenueCat**; restore ≠ entitlement; Superwall callbacks never grant access.
- Measurement refuses competing authority / bad identity join.

## Owners preserved

| Issue | Role |
| --- | --- |
| #67 / #107 | Onboarding applicability / selected bindings |
| #79 / #101–#104 | RevenueCat purchase / entitlement proving |
| #114 | Canonical-operation boundary audit (this inventory) |
| #115–#116 | Follow-on only — **not** implemented here |

## Unselected Superwall must not impose (#107)

When present-paywall binding is not `b2c/superwall`, Superwall knowledge paths, validators, placement catalogs, and campaign assumptions must not apply to a RevenueCat/native-only business. Package presence alone never selects Superwall.

## Fail-safe classes (deterministic)

Covered by `adapters/providers/superwall/fail-safe.ts` + `superwall-canonical-boundary` fixtures:

1. Version / schema drift → fail-closed
2. Missing placement / config → fail-closed
3. Stale campaign → hold (no invent)
4. Account / project mismatch → fail-closed
5. Offline / cache-only → hold
6. Purchase delegation failure → refuse (no access grant)
7. Competing entitlement authority → refuse
8. Partial analytics → hold
9. Unselected Superwall → idle (non-impose)
10. `--yes` without authority → fail-closed

## Architecture review checklist (ADR-0013)

- [x] Workflows depend on canonical monetization ops; SW-native types terminate at adapter/extension
- [x] Independent 4.16.3 fixtures with provenance; fake ≠ contract source
- [x] Logical seams named without a generic billing-provider framework
- [x] Effects/authority classified; `--yes` never grants authority
- [x] Presentation ≠ purchase ≠ entitlement owners explicit
- [x] Unselected Superwall does not impose
- [x] Delegation / mismatch / drift fail-safe
- [x] Evidence classes remain distinct
- [x] #67/#107 and RC #79/#101–#104 remain owners
- [x] No live campaign publish / production paywall / account connect this slice
- [x] No #115–#116 product work
- [x] Catalog provider yaml + upstream yaml explicitly held (honest)

Full row table: `SUPERWALL_CANONICAL_MAP` in `catalog/providers/superwall-canonical-map.ts`.
