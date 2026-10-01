# Approved integration version record

Status: approved and applied locally on 2026-10-01. Parent authorization also covers a branch push and draft PR.
Baseline: `12fd1bfd55744463c5d2bf0ac5f6fa9b6799eece`.
Canonical source version: `0.221.96` to `0.221.97`. Current main was rechecked before applying the stamp.
The independent plugin remains `0.1.0`.

The unstamped addition triggered `version_discipline.version_not_ahead_of_base` and `version_discipline.pending_manifest_update_missing`.
The repository gate does not exempt a plugin excluded from npm. Its requirement is a source integration stamp, not an npm release.

## Exact approved source edits

| File | Proposed fields | Why needed |
| --- | --- | --- |
| `skill-version.json` | `version: 0.221.97`; `updatedAt: 2026-10-01`; prepend the two release notes below. Preserve prior history. | The version gate requires a forward source stamp in the same commit as the addition. |
| `package.json` | Top-level `version: 0.221.97` only. | Package parity requires the canonical package and skill source version to match. |
| `package-lock.json` | Top-level `version` and `packages[""].version` to `0.221.97` only. | Keep the root lock record aligned; no dependency resolution or package entries change. |

Approved release notes:

1. `Prepare the bounded first-five-minutes ChatGPT and Codex plugin with the existing read-only knowledge MCP. Local draft only; no install, deployment, or publication.`
2. `Add original synthetic captures, matched baseline evaluation preparation, credential-free deterministic packaging, and submission holds. Comparison remains unrun; no empirical utility claim.`

## Exact generated changes

The existing renderers changed exactly these eight generated files.
No digest was hand-edited and no drift check was bypassed.

| File | Expected change | Why needed |
| --- | --- | --- |
| `catalog/generated/firstparty/catalog-pack.yaml` | `version` and `revision` to `0.221.97`. | Authored first-party pack identity derives from the source version. |
| `catalog/generated/firstparty/extension.yaml` | Extension `version` to `0.221.97`. | Installed first-party identity must match its source and pin. |
| `catalog/generated/firstparty/package.json` | Copied top-level package `version` to `0.221.97`. | This declared first-party asset mirrors the root package bytes. |
| `catalog/generated/firstparty/snapshot.json` | Embedded extension version; hashes for the three changed package files; aggregate digest. | Snapshot verification binds exact resource and manifest bytes. |
| `catalog/generated/firstparty-pin.json` | `version` to `0.221.97` and the new snapshot digest. | Runtime catalog loading checks the source version and immutable snapshot pin. |
| `catalog/generated/catalog.json` | `skillVersion` to `0.221.97`. | Composed catalog projection follows the installed first-party version. |
| `catalog/generated/hosted-knowledge.json` | `engineVersion`, embedded catalog version, `catalogSha256`, and `bundleSha256`. | Hosted bundle drift checks bind the versioned catalog. Document content and source hashes stay unchanged. |
| `kernel/schema/evidence-schema-version.json` | New `catalogSha256` and renderer timestamp. `schemaSha256` stays unchanged. | Evidence fingerprint binds the composed catalog; no schema or evidence contract changes. |

Total canonical change boundary: **eleven files**, three source metadata/lock files plus eight generated files.
The render commands rewrote other projections with identical bytes. No additional canonical path changed.
No hosted subpackage manifest or lockfile, dependency, workflow, knowledge document, schema, or kernel implementation belongs in this proposal.

```bash
npm run render:all
npm run render:evidence-schema-version
```

The approved render produced these observed values:

- Hosted bundle SHA-256: `debaea13bd82cb73123af5316ec9b2a716f853815c83b51960e83f12af646100`.
- Catalog SHA-256: `6de870649079fc9250496e463aae3f79e5ef218f9febedff09c25f5d0c52c23a`.
- Evidence schema SHA-256 remains `94f21f0dcaf7efcfb07b302d457ec2a0a6ffbe4619270cd8f14843115e479eb4`.

Prior release history, dependency entries, and all hosted document bytes remained identical.
The recorded renderer timestamp comes from generation; no live service was redeployed.

## Published-package impact

Pilot citation registration is a separate integration edit in `checks/validation/repository/source-registry.yaml`.
The full audit required thirteen new URL entries for the cited plugin docs, schemas, and pinned Brigade sources.
Only those entries were appended. Prior registry rows, snapshots, and freshness dates remain unchanged.
This edit does not expand the eleven-file source-stamp boundary above.

The root manifest includes the whole `entrypoints/` directory.
Without exclusion, an actual npm dry run included 40 pilot files totaling 532,498 bytes.
The new `.npmignore` **inside this pilot folder** excludes all of them.
A second dry run included zero pilot files; every other canonical package entry was identical.
No root `files` array or root `.npmignore` change is needed.

If a later owner independently publishes npm, the source stamp would label the canonical package `0.221.97` and change its version/pin/digest metadata.
It would not distribute the pilot skill, prompts, test code, or synthetic captures through npm.
There is no new package, dependency, executable API, or hosted deployment in this proposal.
The plugin ZIP remains the same six files, version `0.1.0`, SHA-256 `6b35115b36895ab530b20fe2655447526ad14da22f82f3b3b764ccbcad526815`.
No npm publication is requested or implied.

Complete required repository checks before the authorized local commit, push, and draft PR.
Merge, installation, account/credential changes, deployment, submission, and publication remain separately reserved.

Automatic approval review initially rejected this stamp for insufficient scope authority.
The user then explicitly approved the exact update, push, and draft PR. The approved retry succeeded.
