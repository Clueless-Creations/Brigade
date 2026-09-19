# Mobile-ops canonical-operation inventory (#115)

Owner: #115. Status: durable inventory for ADR-0013 proving-provider audit.
Main pin at land: `e7e1bd3` / `b2c-app-builder@0.221.22` → stamp `0.221.23`.
Fixture pins: host-native mobile-host fixtures; Expo MCP **fixture-schema-v1** (#87); MobAI CLI **1.9.3** (device-proof hole-fill only).
Typed module: `catalog/providers/mobile-ops-canonical-map.ts`.

## Authority / evidence holds

| Class | Allowed this slice | Notes |
| --- | --- | --- |
| Independent fixture / reviewed schema pin | Yes | host-native + #87 + MobAI 1.9.3 hole-fill |
| Synthetic / fake transport wiring | Yes | Routing only; not contract source |
| Host-native fixture / proof inject | Yes | Existing mobile-host; no live sim required |
| Live simulator / device / MCP | **No** (HoE settle) | `live-device-held` / `live-mcp-held` |
| Physical-device parity claim | No | `physical-parity-held` |
| Tool install / account connect / private capture | No | founder-protected |
| Forced Expo or MobAI migration | No | Host-native alone when sufficient |
| Wrapping MobAI as MOT / duplicate Expo MOT | No | DeviceProofAdapter + #87 owners |

`fixture ≠ synthetic-routing ≠ host-native-fixture ≠ live-device-held ≠ live-mcp-held ≠ physical-parity-held`.
`--yes` / `--non-interactive` never grants authority.

## Logical seams (ADR-0013)

| Role | Owner |
| --- | --- |
| definition | contracts/mobile-operation + firstparty-declarations + mobile-ops-canonical-map |
| encoder | mobile-operation-host + device-proof + expo-mcp-route |
| transport | host-native MOT \| MobAI DeviceProofAdapter \| Expo fake-schema (#87) |
| decoder | normalizeMobileObservation + requireMobileSupport |
| reconciler | createMobileOperationRoute → OperationRouteRegistry; recipe; #107 |

One route factory. No second device router / evidence store / scheduler.

## Native → canonical → fit/limits → evidence (summary)

| Provider | Native (examples) | Canonical operation | Fit | Evidence | Disposition |
| --- | --- | --- | --- | --- | --- |
| host-native | `simctl launch` | `b2c/mobile-app-operation.launch` | exact | host-native-fixture | implement |
| host-native | install identity inspect | `…inspect` | partial (no UI tree) | host-native-fixture | implement |
| host-native | interact | `…interact` | **unsupported** | host-native-fixture | **held** |
| host-native | `simctl io screenshot` + foreground | `…capture-screenshot` | exact | host-native-fixture | implement |
| host-native | video | `…record-video` | **unsupported** | host-native-fixture | **held** |
| MobAI | device resolve / app install / screenshot | launch/capture (semantic) | partial/extension | fixture | extension (DeviceProofAdapter — **not MOT**) |
| MobAI | `.mob` suite / bridge | interact | extension | fixture | extension (preserve; residual) |
| Expo MCP | docs/learn | none | extension | fixture | extension (#87) |
| Expo MCP | inspect/capture fake-schema | inspect (held live) | partial | fixture / live-mcp-held | held (#87; no duplicate MOT) |
| Expo MCP | schema drift / new tools | none | n/a | fixture | **reject** (no auto-expand) |
| shared | requireMobileSupport / normalize / route factory | all five ops | exact | fixture / synthetic-routing | implement |

## KTDs locked

- Workflows name `b2c/mobile-app-operation.*`, not tool commands (prose may cite providers).
- Fake device tools ≠ provider contract.
- Uncertain interaction ≠ silent fallback.
- Expo MCP change ≠ auto-expand.
- Host-native usable alone.
- Captures ≠ acceptance; evidence ↔ identity.
- One route factory; MobAI not wrapped as MOT.
- #87 / #82 / #107 / #117 remain coordinate owners.
- STOP after close → **#116** deepen (separate — not implemented here).

## Owners preserved

| Issue | Role |
| --- | --- |
| #87 | Expo MCP/skills (CLOSED) — consume fake-schema; no duplicate Expo MOT |
| #82 | CNG/native residual facts |
| #107 | Selected bindings (CLOSED) |
| #117 | Shared inventory (CLOSED) |
| #115 | Canonical-operation boundary audit (this inventory) |
| #116 | Follow-on only — **not** implemented here |

## Fail-safe classes (deterministic)

Covered by `adapters/providers/mobile-ops/fail-safe.ts` + `mobile-ops-canonical-boundary` fixtures:

1. Wrong app/device/server/identity → fail-closed
2. Stale capture/proof → hold
3. Unsupported host/platform → refuse
4. Schema drift / new upstream tool → refuse (no auto-expand)
5. Partial/uncertain/interrupted interaction → refuse silent fallback
6. Concurrent ownership → hold
7. Known-safe failure → explicit replan only (never silent)
8. Capture used as acceptance → fail-closed
9. Host-native alone when sufficient (must not require Expo/MobAI)
10. `--yes` without authority → fail-closed; live device never authorized by flags

## Architecture review checklist (ADR-0013)

- [x] Workflows depend on canonical mobile ops; provider-native commands terminate at adapter
- [x] Independent fixtures with provenance; fake ≠ contract source
- [x] Logical seams named without a second device router
- [x] Effects/authority classified; `--yes` never grants authority
- [x] Host-native alone; MobAI DeviceProofAdapter; Expo #87 consume
- [x] Uncertain ≠ silent fallback; Expo MCP ≠ auto-expand
- [x] Captures ≠ acceptance; evidence ↔ identity
- [x] Evidence classes remain distinct
- [x] Live device/MCP/physical parity/tool install/account connect held
- [x] #116 not started

## Next

After #115 closes: **STOP** → deepen **#116** (growth/agent) separately.
