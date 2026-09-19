# Apple ASC canonical-operation inventory (#113)

Owner: #113. Status: durable inventory for ADR-0013 proving-provider audit.
Main pin at land: `062296d` / `b2c-app-builder@0.221.20` → stamp `0.221.21`.
Fixture pin: ASC CLI **5.1.0** (`ca759a3b6ab88c8c39aed13325461248436615ca`).
Typed module: `catalog/providers/apple-asc-canonical-map.ts`.

## Authority / evidence holds

| Class | Allowed this slice | Notes |
| --- | --- | --- |
| Independent fixture / cookbook | Yes | 5.1.0 pin |
| Fake transport wiring | Yes | Not contract source |
| Live sandbox observe / dry-run | **No** (HoE settle) | Never submit/release |
| TestFlight live | No | `testflight-held` |
| App Review / submit | No | `review-held` |
| Production release / prices / credentials / app create | No | `production-held` / founder-protected |

`fixture ≠ sandbox-held ≠ testflight-held ≠ review-held ≠ production-held`.
`--yes` / `--non-interactive` never grants authority.

## Logical seams (ADR-0013)

| Role | Owner |
| --- | --- |
| definition | `catalog/providers/apple-asc.yaml` + `apple-asc-canonical-map.ts` |
| encoder | `adapters/app-review/asc-provider.ts` + `resubmit.ts` |
| transport | `AscCommandRunner` / `spawnAscCommand` |
| decoder | `adapters/app-review/asc-provider.ts` |
| reconciler | `poll.ts` + `resubmit.ts` + standing-envelope workflows |

Not a generic multi-store CLI framework. Not a second App Store state store.

## Native → canonical → impl → evidence (summary)

| Op class | Native (examples) | Canonical operation | Evidence | Authority |
| --- | --- | --- | --- | --- |
| observe | `asc review status`, agreements status, version/capabilities | `workflow.store.app-review-observe` | fixture | observe |
| observe | `asc apps list` | `workflow.operations.live-app-store-portfolio` | fixture | observe (#23/#60–#62) |
| create | app-record create | none | sandbox-held | founder-protected (**held**) |
| metadata | validate / push --dry-run | `workflow.store.app-review-remediate` | fixture | observe |
| metadata / l10n | `asc metadata push` | `workflow.store.apple-store-metadata-standing-envelope` | sandbox-held | standing-envelope |
| media (#38) | screenshots sizes/validate/upload/download | `workflow.store.apple-store-media-standing-envelope` | fixture | observe / standing-envelope |
| upload | binary upload / already-uploaded proof | `workflow.store.app-review-resubmit` | sandbox-held | founder-protected (**held**) |
| testflight | feedback/crashes list; workflow run testflight_beta | `workflow.store.apple-testflight-standing-envelope` | fixture / testflight-held | observe / standing-envelope |
| review-submit | `asc review submit` | `workflow.store.app-review-resubmit` | review-held | founder-protected |
| release | `asc publish appstore --submit`; pending developer release | none | production-held | rejected / founder-protected |
| readback | post-mutation `asc review status` | `workflow.store.app-review-observe` | fixture | observe (resume verify) |

Rejected forever in App Review lane: `asc web agreements accept`, `asc webhooks serve`, `asc publish appstore --submit`.

## #38 media reconcile

- Screenshot/media maps to `workflow.store.apple-store-media-standing-envelope`.
- Media workflow depends on `store-screenshots-production` + `store-console-workflow`.
- **No** new graph edge making media a prerequisite of all `workflow.store.asc-cli-automation`.
- #38 remains the media standing-envelope owner; #113 integrates only.

## Owners preserved

| Issue | Role |
| --- | --- |
| #23 / #60 / #61 / #62 | First-run ASC health, portfolio hold, tool-intake |
| #38 | Apple store-media standing envelope |
| #113 | Canonical-operation boundary audit (this inventory) |
| #114–#116 | Follow-on only — **not** implemented here |

## Uncertain execution (deterministic)

Covered by `adapters/app-review/uncertain-execution.ts` + fixture suite:

1. Timeout after mutation → resume verify (not blind replay)
2. Remote accept before local receipt → resume verify
3. Failed verify-after-mutate → resume verify
4. Duplicate request → hold
5. Wrong app/account/env → fail closed before protected effect
6. Pagination / partial / truncated output → hold (no invented completeness)

## Architecture review checklist (ADR-0013)

- [x] Workflows depend on canonical store ops; ASC-native types terminate at adapter
- [x] Independent 5.1.0 fixtures with provenance; fake ≠ contract source
- [x] Logical seams named without a generic provider framework
- [x] Effects/authority classified; `--yes` never grants authority
- [x] Mutation + failed verify resumes verification
- [x] Wrong target fails closed
- [x] Evidence classes remain distinct
- [x] #23/#38/#60–#62 remain owners
- [x] No live App Review / submit / release / create / credentials this slice
- [x] No #114–#116 product work

Full row table: `APPLE_ASC_CANONICAL_MAP` in `catalog/providers/apple-asc-canonical-map.ts`.
