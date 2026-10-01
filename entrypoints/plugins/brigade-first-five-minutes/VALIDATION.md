# Local pilot evidence

Baseline: `12fd1bfd55744463c5d2bf0ac5f6fa9b6799eece`, source version `0.221.96`.
Branch: `codex/brigade-first-five-plugin`. Pilot version: `0.1.0`.
Approved integration source version: `0.221.97`; no dependency or hosted document change.
Date: 2026-10-01. The checkout is isolated from the parent's other work.

## Scope and ownership

This assignment owns `entrypoints/plugins/brigade-first-five-minutes/` and the eleven approved version/stamp files in [Version record](VERSION_PROPOSAL.md).
The existing source registry receives thirteen pilot-only URL entries required by the repository's source-freshness gate. Prior registry entries are unchanged.
The existing knowledge service owns routes, references, authorization, and read-only tool behavior.
The skill owns an advisory capture audit; it establishes no accepted app or business evidence.
The pilot adds no kernel operation, workflow definition, execution engine, package dependency, or deployed service.
The pilot-local `.npmignore` excludes this portable plugin from the canonical npm tarball.

| Architecture rule | Conformance evidence |
| --- | --- |
| ARCH-01 | The single product audits obstacles to a consumer app's first useful outcome. |
| ARCH-02 | MCP wiring reuses the existing four-tool knowledge service; no execution or persistence implementation. |
| ARCH-10 | The skill excludes account, billing, deployment, and publication effects; the probe cannot register clients or exchange tokens. |
| ARCH-11 | Schema validity, public protocol observations, synthetic captures, authenticated behavior, and installed utility are recorded separately. |
| ARCH-12 | Both arms receive identical hashed input bytes and a competent shared prompt; missing results remain unscored. |

An independent package reviewer reproduced and closed all reported guard defects.
A separate evaluation reviewer assessed differentiation and fairness without making model calls.
Neither review made model calls or changed accounts. Installed-host discovery and utility remain missing evidence.

## Completed checks

| Check | Result |
| --- | --- |
| Pilot unit and negative tests | 19 passed; 0 failed. Includes schema holds, credential syntax, path and symlink escapes, SVG content, safe probe, paired inputs, omitted settings/hashes/cases, negative and critical-failure gates, and deterministic ZIP contents. |
| Official portable schemas | Both 1.0.0 schemas passed using downloaded canonical bytes; hashes are recorded below. |
| Skill frontmatter | The existing skill-creator validator reported `Skill is valid!`. |
| ZIP reproduction | Two independent test builds had identical bytes. The final ZIP has exactly six files and no evaluation, development, or account files. |
| npm boundary | The initial dry run included 40 pilot files (532,498 bytes). The pilot-local exclusion reduced that to zero; every other package entry remained identical. No root manifest or ignore-file edit. |
| Repository presubmit | Approved-stamp run passed: 15 checks, 0 failed, 89 deferred. Deferred checks are not a full-audit pass. |
| Full repository audit | Completed: 101 checks passed, 2 failed, 1 skipped. Both failures are described below; this is not a full pass. All integration suites passed. |
| Source registration correction | Thirteen new pilot URL entries added. Targeted source-freshness check passed with 0 errors and 97 warnings. New entries have no automated freshness snapshot; none was invented. |
| Branch source version | Explicit source-checkout comparison passed with 0 errors and 0 warnings. Personal installed-client pins remain held. |
| Final documentation checks | Local links, no-slop, and technical-documentation checks passed with 0 errors. The style checks reported warnings. |
| Existing knowledge Worker gate | `npm run hosted:check` passed, including 21 unit and 28 tenant tests. Local loopback tests required sandbox escalation. |
| Existing console gate | `npm run app:check` passed, including 168 unit and 113 integration tests. No live account or payment change. |
| Public protocol probe | Health and both OAuth metadata routes returned 200; unauthenticated MCP initialize returned 401 with a Bearer challenge. No client registration or token exchange. |
| Evaluation preparation | Eight synthetic cases, 22 captures, two arms, two repeats: 32 blank run forms. `status=not_run`, `actualOutputs=0`, `scores=null`. |

Plugin schema SHA-256: `0a4aad95ce337878ad38802ebf0daa3fde76abe3f65400c86bcbb1ec0b3ab883`.
MCP schema SHA-256: `6539175bfcdf43085855183e86da40ea94b166547a72b47ae9a0a390516d3acb`.
Final ZIP SHA-256: `6b35115b36895ab530b20fe2655447526ad14da22f82f3b3b764ccbcad526815`.

Raw logs, downloaded schemas, the ZIP, source patch, version proposal, and blank evaluation forms live in the task's artifact directory.
They are outside tracked source and outside the plugin ZIP.

## Repository integration qualification

The first presubmit failed because top-level `plugins/` is not an approved source layer.
The pilot moved to the existing skill and MCP interface layer, `entrypoints/`, without changing the gate.
Repository-boundary and architecture checks then passed in the audit attempt.

Before the source stamp, the staged pilot failed version discipline with:

- `version_discipline.version_not_ahead_of_base`
- `version_discipline.pending_manifest_update_missing`

The gate counts every non-documentation source addition, including this npm-excluded plugin, as a source-version change.
The user subsequently approved the exact canonical source update, push, and draft PR.
The approved retry applied `0.221.97` and regenerated exactly the eleven listed files.
Existing release history, dependency entries, and hosted document bytes were preserved.

The first full repository audit was interrupted before completion while integration authority was held.
The unstamped presubmit had 14 passes, one version-discipline failure, and 89 skipped checks.
Current verification follows the approved stamp. Presubmit, Worker, console, package, and schema checks passed in the new run.
The full audit completed with thirteen unregistered-source errors and four installed-runtime pin errors.
Registering the pilot URLs resolved source freshness in a targeted rerun. No existing source entry, snapshot, or freshness date changed.
The default all-runtime check remains failed because personal Codex, Claude, Agents, and Cursor clients are at `0.221.96`, behind branch source `0.221.97`.
Syncing those clients would change personal installations outside the authorized isolated pilot. No sync or install occurred.
The explicit comparison of this source checkout with itself passed; it does not resolve installed-client freshness.
The full audit was not rerun after the metadata correction. Its observed failed result is retained, and publication remains held.
No previous audit attempt is treated as a full pass. Skipped checks are not green.

## External evidence holds

Public discovery does not qualify OAuth consent, entitlement, client longevity, or authenticated tools.
The existing source requests an entitled owner API key; public customer/reviewer access is unqualified.
The documented 90-day registered-client lifetime also needs qualification against current connection-longevity guidance.

No installed ChatGPT or Codex test, same-model comparison, real recording, publisher verification, domain challenge, or public submission occurred.
See [Submission readiness](SUBMISSION_READINESS.md) for the exact owner actions.
The [Authenticated test plan](AUTHENTICATED_TEST_PLAN.md) identifies the smallest next account approval and separates MCP qualification from installed-package comparison.
