# 0017 - One public npm package and its publication boundary

- **Status:** accepted for the boundary decision. The publish action itself stays
  held for the founder; this record performs no publish and grants no release
  authority.
- **Date:** 2026-09-18.
- **Steward:** repository architecture steward, drafted under closeout Unit 0.
- **Affected rules and contracts:** ARCH-01, ARCH-05; [ADR-0002](0002-repository-layout.md);
  roadmap KTD3; the `files` manifest in `package.json`; `check:package-parity`;
  the "Releasing to npm" procedure in `CONTRIBUTING.md`.
- **Affected units:** closeout Unit 0. No renumbering of existing U IDs.

## Context and evidence

[ADR-0002](0002-repository-layout.md) settled that the repository root is the
package root (`docs/decisions/0002-repository-layout.md:92`) and rejected an
npm-workspaces monorepo (`docs/decisions/0002-repository-layout.md:59-63`). It did
not state what may be published, and it predates the task-skill packing work. Two
gaps remained open:

1. Nothing recorded, as a decision, that `@b2c/hosted` and `@b2c/app` are not
   consumer packages. They are ordinary directories with real `package.json`
   files, so the question recurs.
2. Earlier guidance described the whole `agents/` tree as forbidden from the
   published artifact. That statement is now obsolete and must not be cited on
   its own.

Evidence inspected on 2026-09-18 at `a78797c`:

| Evidence | Consequence |
| --- | --- |
| `package.json:2` — `"name": "b2c-app-builder"` | The repository root is the one published name. |
| `package.json:35-72` — `files` manifest | The published artifact is an explicit allowlist, not a directory sweep. |
| `package.json:54-62,68-71` — `agents/skills/b2c-*` business skills and `agents/skills/b2c-app-builder/references` are listed | **Business task skills do ship.** The blanket "all `agents/` is forbidden" table is obsolete. |
| `checks/validation/repository/check-package-parity.ts:292-296` — `agents/` is a development-only prefix **except** `businessSkillPrefixes` | The corrected rule: contributor/maintainer skills are excluded; business task-skill projections and `b2c-app-builder/references/` are carved in. Introduced by #295 (`c26eedd`, 2026-09-11) and standing unchanged since. |
| `agents/skills/` listing — `b2c-contributor`, `b2c-maintainer` are the only non-business skills, and neither appears in `package.json` `files` | The carve-out is closed by construction, not by convention. |
| `hosted/knowledge-mcp/package.json:2-4` — `@b2c/hosted`, `"private": true` | Not publishable as written. |
| `hosted/builder-console/package.json:2-4` — `@b2c/app`, `"private": true` | Not publishable as written. |
| `.github/workflows/publish.yml:12-18,65` — `release` trigger, `id-token: write`, `npm publish --provenance` | Exactly one publish path exists, and it is release-triggered. |
| `CONTRIBUTING.md:117-136` — "Releasing to npm" | The sole publish procedure: one machine publish first, then trusted publishing. |
| `docs/guides/runtime-package.md:103-120` — package-boundary table | The consumer-facing statement of the same boundary, landed by #510 (`4c77b3d`). |
| `README.md:58-61`, `docs/guides/runtime-package.md:78-81` | The registry state is documented as "not published yet, `npm view b2c-app-builder` → 404", with npm snippets labelled post-publish. |

Registry re-verification on 2026-09-18 (CT) by the Unit 0 implementer:
`npm view b2c-app-builder` → **404 Not Found** (`E404` from registry.npmjs.org).
That matches the 404 recorded by #510 on 2026-09-16. A maintainer must still
re-run `npm view b2c-app-builder` immediately before any first publish.

## Alternatives

| Option | Compatibility impact | Evidence |
| --- | --- | --- |
| **A. One public package, everything else private (chosen)** | No change to consumers. `check:package-parity` already encodes it. | `package.json:35-72`; `check-package-parity.ts:292-296` |
| B. Publish `@b2c/hosted` and `@b2c/app` as consumer packages | Breaking. Both are deployed Workers with their own version line (`hosted/*/package.json:3`, currently `0.211.2` against a root `0.221.13`). Publishing them creates a second compatibility surface the runtime does not test and invites installs of a service that cannot run a workspace. | `hosted/knowledge-mcp/package.json:2-4`; `docs/guides/runtime-package.md:113` |
| C. Publish contributor/maintainer skills | Breaking the operator boundary. `b2c-contributor` and `b2c-maintainer` carry repository-maintenance instructions with no meaning in a business workspace, and the parity check would have to drop its `agents/` guard to allow them. | `check-package-parity.ts:292-296`; `docs/guides/runtime-package.md:114` |
| D. Split into an npm-workspaces publish graph | Already rejected by ADR-0002 on the grounds that the audit plan, `npm link` setup, `runtime:sync`, and the script surface assume one package. Nothing in Unit 0's evidence reopens it. | `docs/decisions/0002-repository-layout.md:59-63` |

## Decision

This repository publishes **exactly one** public npm package: `b2c-app-builder`,
built from the repository root and defined by the `files` manifest in
`package.json`. `@b2c/hosted` and `@b2c/app` are private deployment packages and
are never published to npm; they deploy as Cloudflare Workers on their own
version line. Contributor and maintainer skills (`agents/skills/b2c-contributor`,
`agents/skills/b2c-maintainer`) are never published. Business task skills and
`agents/skills/b2c-app-builder/references/` **are** published — the authority for
what `agents/` content ships is the `files` manifest together with the
`businessSkillPrefixes` carve-out in
`checks/validation/repository/check-package-parity.ts:292-296`, not any earlier
table that described the whole `agents/` tree as excluded. No second public
package and no npm-workspaces publish graph may be introduced without a record
that supersedes this one. Publication uses the single procedure in
`CONTRIBUTING.md:117-136` and the single workflow `.github/workflows/publish.yml`;
no other path to the registry is sanctioned.

This record decides the **boundary**. It does not authorize the first publish,
does not register a trusted publisher, and does not cut a release.

## Compatibility and migration

No consumer input changes. `npm pack` output is unchanged by this record, so
existing fixtures, pins, and the parity check keep passing without migration.
The supported consumer surfaces stay the `b2c` CLI, the `b2c-app-builder` /
`b2c-app-builder-mcp` bins, and the routing skill.

Because the package is not on the registry, there is no deprecation or overlap
period to manage: the boundary is being recorded *before* the first publish, not
retrofitted after one. Until the first authorized publish lands, the clone-first
path in `README.md:63-68` and `docs/guides/runtime-package.md:83-89` is the only
working install, and every npm snippet in the documentation is labelled as the
intended post-publish path.

A later decision that splits the package must supersede this record, keep
`b2c-app-builder` resolvable for existing installs, and state the overlap period
in its own Compatibility section.

## Founder-reserved decisions

These are the yes/no questions Unit 0 cannot answer. They cover closeout
plan KTD3 (authorize first publish; confirm no hosted/contributor publish;
trusted-publisher after first version; keep #13/#14 separate) and refine
roadmap KTD3 ("Make local packages the first external boundary",
`docs/plans/2026-09-04-1747-refactor-consumer-business-primitives-plan.md:178-182`).
Each carries the steward's recommended default; the founder owns the answer.
#13/#14 stay out of scope for this pack (see Scope).

| # | Question | Recommended default | Why |
| --- | --- | --- | --- |
| Q1 | Publish `b2c-app-builder` to the public npm registry at all? | **Yes**, when the founder chooses the moment. | The package is built for it: bins, `files`, `prepack` build, and a release-triggered workflow all exist. Nothing else in this record depends on the answer. |
| Q2 | Perform the first manual publish from a maintainer machine? | **Yes** — it is unavoidable if Q1 is yes. | Trusted publishing cannot create a package's first version (`CONTRIBUTING.md:133-136`). |
| Q3 | Register the npm trusted publisher (owner `Clueless-Creations`, repo `b2c-app-builder`, workflow `publish.yml`) after the first version? | **Yes.** | It removes the need for any long-lived npm token in the repository or Actions secrets (`CONTRIBUTING.md:125-127`) and enables provenance attestation (`.github/workflows/publish.yml:65`). |
| Q4 | Publish the hosted Workers `@b2c/hosted` / `@b2c/app` as npm packages? | **No.** | They are `private: true`, version independently, and cannot run a workspace. Publishing them creates an untested second compatibility surface. See alternative B. |
| Q5 | Publish contributor/maintainer skills (`b2c-contributor`, `b2c-maintainer`)? | **No.** | Repository-maintenance instructions have no meaning in a business workspace, and allowing them would require weakening the parity check's `agents/` guard. See alternative C. |
| Q6 | Adopt a second public package or an npm-workspaces publish graph? | **No.** | Already rejected by ADR-0002 on evidence that has not changed. See alternative D. |

Q1 through Q3 are release authority and stay held. Q4 through Q6 are boundary
questions; the Decision section above records the recommended answers as the
standing rule, and a founder reversal would supersede this record.

## Scope

- Issues #13 and #14 are **out of scope** for this record and for Unit 0. Nothing
  here decides, blocks, or pre-empts them.
- Unit 0 **performs no publish**: no `npm publish`, no `gh release create`, no
  trusted-publisher registration, and no version bump to `package.json` or
  `skill-version.json`.

## Issue #26 acceptance mapping

The acceptance criteria below are the boundary claims Unit 0 was asked to settle.
The issue's own text could not be re-read in session (`gh` was unavailable to the
agent), so each row is stated against repository evidence and should be
re-checked against the issue body before the issue is closed.

| # | Acceptance criterion | State | Evidence |
| --- | --- | --- | --- |
| AC1 | One public package `b2c-app-builder` is stated as the boundary | **Satisfied** | `CONTRIBUTING.md:119-121`; `docs/guides/runtime-package.md:105-112`; this record |
| AC2 | `@b2c/hosted` and `@b2c/app` are excluded from npm | **Satisfied** | `hosted/*/package.json:2-4` (`private: true`); `CONTRIBUTING.md:119-121`; `docs/guides/runtime-package.md:113` |
| AC3 | Contributor/maintainer skills are excluded from npm | **Satisfied** | `check-package-parity.ts:292-296`; absent from `package.json:35-72`; `docs/guides/runtime-package.md:114` |
| AC4 | No second public package and no npm workspaces publish graph | **Satisfied** | `docs/decisions/0002-repository-layout.md:59-63`; `docs/guides/runtime-package.md:117-120`; this record |
| AC5 | The boundary cites the current `files` manifest and `check:package-parity`, not the obsolete "all `agents/` forbidden" table | **Satisfied by this record** | Context table above; `package.json:54-62,68-71`; `check-package-parity.ts:292-296` |
| AC6 | Install docs separate the two audiences and label npm snippets as post-publish | **Satisfied** | `README.md:58-87`; `docs/guides/runtime-package.md:71-97` (landed by #510, `4c77b3d`) |
| AC7 | CONTRIBUTING is the sole publish procedure and is linked from the guides | **Satisfied** | `CONTRIBUTING.md:117-136`; linked from `docs/guides/runtime-package.md:79-81,117-120` |
| AC8 | `npm view b2c-app-builder` returns 404 and the docs say so | **Satisfied** | Docs: `README.md:58-59`; `docs/guides/runtime-package.md:78`. Fresh observation 2026-09-18 CT: `npm view b2c-app-builder` → E404 Not Found. |
| AC9 | Founder yes/no questions recorded with recommended defaults | **Satisfied** | Founder-reserved decisions section above |
| AC10 | First npm publish performed | **Held — founder** | Q1–Q3 above; `CONTRIBUTING.md:129-136` |
| AC11 | Trusted publisher registered on npmjs.com | **Held — founder** | Q3 above; `CONTRIBUTING.md:133-136` |
| AC12 | `## CLI` heading lost from the package guide when #510 inserted the boundary section | **Residual, fixed in this change** | `git show 4c77b3d -- docs/guides/runtime-package.md` removes `-## CLI` and leaves its `b2c --help` fence orphaned under "Package boundary" |

## Consequences

- **Unit 0 (this change).** Restore the `## CLI` heading in
  `docs/guides/runtime-package.md` so the boundary section does not absorb the CLI
  examples. Proof: the heading is present and the `b2c --help` fence sits under
  it.
- **Founder.** Answer Q1 through Q3. Until then the registry stays empty and the
  clone-first path is the only working install. Proof of landing: a published
  `b2c-app-builder` version whose tag matches `package.json` and
  `skill-version.json`, followed by a registered trusted publisher.
- **Any future unit proposing a second package.** Supersede this record first.
  Proof: a numbered record in this directory and an updated index row.
- **Standing proof for the boundary itself.** `npm run check:package-parity`
  stays green. This change touches Markdown only, so no parity input changed;
  focused checks are run on the Unit 0 PR branch before merge.
