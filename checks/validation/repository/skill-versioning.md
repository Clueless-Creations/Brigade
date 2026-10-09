# Skill Versioning And Runtime Freshness

This skill must detect when the installed runtime copy is behind the latest local source copy before starting substantial launch, design, store, revenue, or build work.

## Runtime Freshness Loop

1. Read `skill-version.json` from the installed skill runtime.
2. Compare it with the latest source copy when available.
3. If the installed runtime is current, continue the original request.
4. If the installed runtime is stale, pause before continuing the original request and use the AskUserQuestion flow when available:

```text
A newer B2C App Builder skill is available: installed <installed_version>, latest <latest_version>.
Do you want me to update the local skill runtime now so I can use the latest launch and Design Room features, or continue with the installed version for this request?
```

If AskUserQuestion is unavailable, ask the same question plainly and wait for the founder's answer.
Unavailable source content does not prove freshness. Report the failed check and obtain an
explicit decision before continuing without verification.

## Commands

From the source repo:

```bash
npm run check:skill-version -- --source . --installed ~/.codex/skills/brigade
npm run check:version-discipline -- --repo-root . --skill-root .
```

Local checks, including `--all-runtimes`, are offline. Only `--remote` or `--remote-url` requests
a remote comparison. The flag must have a non-empty URL value, not another flag.

Remote comparison reads the public manifest over HTTPS and never attaches an authorization
header. Do not put a token in the URL. Then run:

```bash
npm run check:skill-version -- \
  --installed ~/.codex/skills/brigade \
  --remote-url https://raw.githubusercontent.com/Clueless-Creations/Brigade/main/skill-version.json
```

The reader refuses redirects and checks HTTP 200 before reading the body. A denied response
never retries with credentials.

Denial, timeout, and other fetch failures produce `ERROR skill_version.remote_unavailable`
with exit status 1. They do not produce a current or stale comparison. Errors omit supplied
URLs and response text. An invalid remote manifest also fails verification.

From the installed runtime:

```bash
cd ~/.codex/skills/brigade
# replace the --source path with your local clone of this repo
npm run check:skill-version -- --source "$HOME/code/b2c-app-builder" --installed .
```

When the founder approves an upgrade on this machine, run the ownership-tracked sync from the repo root:

```bash
npm run runtime:check
```

```bash
npm run runtime:sync -- --all-clients
```

`runtime:sync` computes its plan from git-tracked source files against the manifest that the previous sync wrote (`.runtime-sync-manifest.json` in the runtime). It copies changed files, deletes only files that a previous sync wrote and the source no longer ships, preserves unowned files, and refuses to overwrite runtime files edited since the last sync. Resolve those conflicts in source or pass `--force` deliberately. On the first run without a manifest, pass `--adopt` after you confirm that no runtime-only fixes must return to source. After writing, it installs dependencies when required, runs runtime verification, and reports whether the `~/.claude/skills/b2c-app-builder`, `~/.agents/skills/b2c-app-builder`, and `~/.cursor/skills/b2c-app-builder` links resolve to the synced runtime.

Use `runtime:sync` for installed copies. It tracks ownership, protects runtime edits, and preserves unowned files.

Managed-file cleanup follows the same ownership rules. An unchanged managed file can be
deleted; a hand-edited file blocks sync before any planned write. An unowned file remains.
For temporary installation tests, always supply both `--installed <temporary-runtime>` and
`--runtimes-root <temporary-client-root>`. Alias diagnostics use that client root. Without the
flag, they use the normal machine home. Do not override `HOME` or `CODEX_HOME` for tests.

The runtime includes `catalog/generated/knowledge-freshness.json`. This pin carries the
reviewed source snapshot date and digest. Installed catalog checks use that pin without
reading documents above the installed directory. Missing or invalid pins fail the audit.
Repository checks also compare the pin with the canonical source snapshot. Do not copy
repository documents into a client directory to repair a missing pin; render and sync the
owned source file.

## Release stamp

`npm run release:stamp` is the only writer for the version and the generated stamp files.
It runs on a clean main checkout that contains `origin/main`.
It adds one patch to the current version line.
`--version` may set a higher version.
It writes release notes from `git log --first-parent` subjects since the last stamp.
It skips subjects that match `Stamp <version>`.
It keeps at least two concrete notes.
It then runs `render:all`, `render:evidence-schema-version`, `render:artifact-pages`, and `node examples/spec-pack/build.mjs`.
It runs the drift checks in release mode.
It commits on `release/stamp-<version>`.
The default branch is `release/stamp-<version>`.
`--branch` selects another `release/stamp-*` branch.
It pushes only with `--push`.
A second run with no commits since that stamp validates the generated files.
If they match, it does nothing. If they are stale, it creates a new patch stamp
with a recovery note through the same generation, validation, and commit path.
Failed generation or validation never creates a stamp commit.

Patch plus one stays on the version line readers already compare.
The number only increases along first-parent main.

### Stamp-managed files

This is the file set. Other docs point here.

- `package.json` and `package-lock.json`: the root `version` field only
- `skill-version.json`
- `kernel/schema/evidence-schema-version.json`
- `catalog/generated/**`
- `knowledge/README.md`
- `ACKNOWLEDGMENTS.md`
- `THIRD_PARTY_NOTICES.md`
- `docs/upstreams/coverage-report.md`
- `docs/upstreams/support-report.md`
- `examples/spec-pack/index.html`
- `contracts/public-api/REFERENCE.md`
- `contracts/public-api/schemas/**`
- `contracts/extensions/schemas/extension.schema.json`
- generated task-skill directories under `agents/skills/`
- generated blocks in `README.md`, `SKILL.md`, and `agents/skills/README.md`

The same paths are enforced by `tooling/lib/stamp-files.ts`.

### Check modes

- Pull request mode fails with `version_discipline.stamp_file_in_pr` when a stamp file changes.
- `release/stamp-*` branches are exempt. `version_discipline.version_not_ahead_of_base` still applies.
- Dependency edits in `package.json` and the lockfile are allowed. Only `version` counts.
- A main push warns `main is N commits past stamp X`. It does not fail.
- Drift checks in pull-request and main-push mode render twice and require byte-stable output.
- They do not require the committed files to match.
- In those modes `check:catalog` allows a knowledge file that already has a `catalog/knowledge` manifest. The CatalogReference is written at the next release stamp. Release mode still requires that reference.
- In those modes the hosted bundle check renders from the authored catalog, so a new active package can match its manifest. It does not compare that render to the committed bundle.
- Release mode requires an exact match. Deploy, `runtime:sync`, and `publish.yml` use it.
- `runtime:sync` refuses an unstamped tree: `Run npm run release:stamp, or sync from the latest stamp.`
- The automatic run is described under Automatic stamp.

### Automatic stamp

A push to `main` runs `.github/workflows/stamp.yml`.
`workflow_dispatch` runs the same job.
The job skips a subject that starts with `Stamp `.
The job skips a subject that names a `release/stamp-*` branch.
A stamp merge does not start another stamp.
The concurrency group is `stamp-main`.
Overlapping pushes queue in that group.
The run opens `release/stamp-<version>` when no stamp pull request is open.
The run updates an open stamp pull request on its current branch.
Before updating an existing candidate, the run disables any inherited auto-merge.
It waits for the newly dispatched CI run on the exact candidate SHA and requires
completed success, including the CI aggregate. Missing, cancelled, and failed
runs cannot authorize a merge.
It fetches main again. If main advanced beyond the candidate, it queues a new
stamp run to refresh the open pull request. Otherwise it squash-merges the
verified head and checks the generated files on merged main. A stale merged
tree queues recovery and fails the run. Deploy, publish, and runtime sync still
enforce their own stamp guard; the fetch and merge are not atomic.
The workflow does not change repository rules or require auto-merge to be enabled.
`GITHUB_TOKEN` does not start `pull_request` workflows.
The stamp job dispatches CI on the stamp branch.
That dispatch uses `workflow_dispatch` and `verification=presubmit`.
`workflow_dispatch` creates a run with the default token.

## Rules

- `skill-version.json` is the version source of truth for installed-runtime freshness.
- `check-skill-version.ts` must return a nonzero status when the installed runtime is older than the source copy.
- Ordinary pull requests do not bump `skill-version.json`. `release:stamp` does.
- A stale installed runtime is a founder decision gate, not a silent warning.
- If the source copy or remote manifest is unavailable, report the failure. Continue without verification only after an explicit human decision.
- Runtime upgrades must preserve user work. `runtime:sync` writes only git-tracked source files and never touches unowned runtime files. It stops on conflicting runtime edits instead of overwriting them.
