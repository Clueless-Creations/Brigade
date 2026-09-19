# Expo proof matrix

Owner: #88. Status: frozen protocol + child-evidence collection map (deterministic).
Draft origin: issue #88 comment on 2026-09-08, maintained 2026-09-19 against main post-#537.

Fixture success is never native, OTA, store, or hosted proof. A row stays
`not-run` or `blocked` (or `live-held` in the collection map) until its exact
evidence exists. Do not rewrite this matrix to match weaker tests.

Collection map module: `catalog/stacks/expo-proof-collection.ts` (child→evidence
pointers only — never invents live green).

## Hold

No selected Expo app, physical device, paid EAS job, Observe account, approved
upgrade workspace, or matching #72 authority is available on this checkout.
Deterministic models + honest holds may close **#88** per HoE settle; this file
**never closes #80** (#80 closeout is a separate follow-on slice).

## Canonical identities (existing contracts)

| Fact | Existing owner |
| --- | --- |
| Operation target | `composition.target` `{platform, runtime}` |
| Declared support vs maturity vs config vs route vs authority vs proof | ARCH-11 / `BindingReadiness` |
| iOS/Android device capture | `contracts/mobile-operation.ts` |
| Product intent | `product.yaml` / rendered `PRODUCT.md` |
| Design adapter stack | `DESIGN.md` + `design/platforms/<stack>.json` |
| Stack/toolchain pins | workspace lockfiles + selected EAS image + host binaries |
| Native runtime / update | Expo runtime policy + binary + update id when #85 is selected |

Do not invent `product.platforms` or a global “Expo supported” boolean.

## Levels

| Level | What it can prove | What it cannot |
| --- | --- | --- |
| Static / type / unit / contract | Synthetic and builder-offline behavior | Native execution, store, or OTA |
| Component / Router integration | In-process UI contracts | Release-like binary without Metro |
| Simulator / emulator E2E | Installed custom-dev or release-like build on that OS | Physical hardware, store, or production crash |
| Physical device | Hardware, permission, background, store-sandbox claims the simulator cannot | Publication or production users |
| Browser against exported web | Production web output | iOS or Android requirements |
| Authorized cloud / provider readback | Named job or account observation | A configured SDK with no arrived events |

## Child evidence collection (#81–#87 fixtures vs live holds)

| Child | Fixture suites (consume) | Live hold (honest) |
| --- | --- | --- |
| #81 | `expo-selection` | Live Expo CLI / SDK install not-run |
| #82 | `expo-foundation` | Native compile + device install held (on this matrix) |
| #83 | `expo-capabilities` | IdP / native-IAP sandbox / spend held |
| #84 | `expo-eas-execution` (+ doctor/decode/durability) | Paid EAS cloud / live submit held |
| #85 | `expo-eas-update-lifecycle` (+ policy) | Live OTA / production channel hard-held |
| #86 | `expo-web-api`, `expo-web-hosting` | Live hosting deploy / browser E2E held; web≠native |
| #87 | `expo-agent-tools`, `expo-mcp` | Live MCP connect / device bind held |
| #88 | `expo-quality`, `expo-observability`, `expo-sdk-upgrade`, `expo-proof-collection` | Live full matrix / Observe / upgrade workspace / #72 held |

## Required rows (status on this checkout)

| Requirement | Platform | Method | Status |
| --- | --- | --- | --- |
| Unit/native mocks cannot satisfy simulator/device/store acceptance | ios / android | native E2E vs jest-expo | not-run (fixture refuse models collected — live E2E held) |
| Web export cannot satisfy an Android requirement | android vs web | separate rows | not-run (fixture models collected; live parity held) |
| Release-like binary starts offline without Metro | ios / android | installed binary | blocked — no device/app |
| Accessibility and platform navigation | selected design | per-platform assertions | not-run (a11y≠screenshot fixtures collected; live a11y held) |
| Account isolation / selected purchase / permission failure | capable target | #83 cases | blocked — no sandbox authority |
| Source/SDK/build/update/review change invalidates old proof | selected stack | #85 / #88 invalidation | not-run (invalidation fixtures collected; live retest held) |
| Observe missing data and absent native crash coverage stay visible | selected observability | #88 owners | blocked — no Observe account |
| Upgrade failure preserves native customizations | isolated copy | SDK walkthrough | blocked — no approved upgrade workspace |
| Complete-business closeout distinguishes delivery / submission / live | matching #72 run | [greenfield-benchmark.md](./greenfield-benchmark.md) | blocked — #72 hold |

## Disposition states (complete-business read-model)

Keep distinct — never collapse: `delivery-accepted` / `submission-ready` /
`submitted` / `released` / `observed`. Missing #72 authority → hold, not invent.
