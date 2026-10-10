# Keep workspace startup guidance current

Brigade supplies one canonical workspace `AGENTS.md`. Claude and Cursor adapters
point to its `Start` section. That section distinguishes focused work from a
managed business and routes managed work through status, plan, and the current task.

## New and existing workspaces

For a new business, use `b2c business-create` with an empty or absent target.
Creation installs the three startup guides in the planning scaffold. It does not
require runtime initialization. See [business creation](build-a-business.md#create-a-planning-workspace).

For an existing scaffold, register its directory if needed:

```bash
b2c workspaces register my-app ./my-app
b2c business-status --workspace my-app --json
b2c business-plan --workspace my-app --json
```

Registration records workspace identity; it does not install instructions.
Status and plan report missing, stale, modified, or unsafe startup guides through
their existing `warnings` field. These reads never repair files or change work eligibility.
A focused review or code fix needs neither registration nor a Brigade runtime.

## Preview and apply a refresh

Use a registered ID or a path to an existing planning or runtime scaffold:

```bash
b2c refresh-entrypoints --workspace my-app --json
b2c refresh-entrypoints --workspace my-app --apply --json
```

The first command is a read-only preview. The second applies the permitted changes.
Refresh uses templates shipped with the invoking Brigade CLI. It updates only
`AGENTS.md`, `CLAUDE.md`, and `.cursor/rules/agents.mdc`.

Each guide has a marked Brigade-owned block. Keep app-specific instructions
outside that block; refresh preserves them in the active file. Known unmarked
legacy templates migrate into the block while surrounding app text stays active.
An unrelated existing guide keeps its text and receives the Brigade block.
Review conflicting app instructions on their merits; installation cannot resolve their meaning.

Refresh does not initialize the runtime or update its package pins. It does not
change product or design files, roles, host settings, permissions, or business state.
Its write path uses the existing workspace lock and refuses pending lifecycle transitions.

## Refusals and interrupted work

Refresh refuses changed managed text, ambiguous legacy copies, malformed markers,
unsafe paths or files, and conflicting Cursor rule scope. A preflight refusal
writes none of the three guides. The JSON report names the affected file and reason.
Reconcile that conflict while preserving app instructions, then preview again.

If an interruption occurs during writes, preview again before retrying. Each
guide is written atomically; the three-file refresh is not a transaction.
Already refreshed guides remain current and an intact remaining guide can be retried.

Apply does not break stale session locks by default. If it reports
`entrypoints.session_lock_stale`, verify that the previous owner is inactive, then retry:

```bash
b2c refresh-entrypoints --workspace my-app --apply --break-stale-verified --json
```

`--break-stale-verified` requires `--apply`. It asserts the caller's verification;
it does not detect whether the previous process stopped. The existing lock owner
rereads the heartbeat and refuses recovery if it is fresh or changes between reads.
A stale timestamp alone is not evidence that the previous owner stopped.
Wait for an active owner to finish instead of breaking its lock.

## What the checks establish

`current` means the managed blocks match the invoking CLI's templates and retained
variables. It does not prove that an agent opened them or followed their instructions.
Test actual fresh and resumed host sessions when evaluating startup behavior.
Provider, device, store, and business acceptance still require their own evidence.
