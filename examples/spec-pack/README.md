# Spec pack template

A spec pack is the one contract for a new app. It holds every app screen and
state, the web pages, design tokens, the art style prompt, the store listing,
the price and paywall rule, the analytics event map, and the repo starter
files. The founder approves it once (Gate 1). After that, build workers build
to it and do not ask questions.

The example app ("Soon", a countdown app) is a placeholder. Replace it.

## Files

| File | Purpose |
| --- | --- |
| `spec.yaml` | The manifest. You edit this file only. |
| `template.html` | Page layout and mock renderer. Do not edit per app. |
| `build.mjs` | Loads `checks/` and `sections/`, checks `spec.yaml`, and writes `index.html`. |
| `checks/` | One check module per file. `build.mjs` loads `*.mjs` in filename order. |
| `sections/` | One review-page section per file. `build.mjs` injects `*.js` in filename order. |
| `index.html` | Generated review page. `release:stamp` writes it. Open it in a browser. |
| `render-mocks.sh` | Writes one PNG per screen and state to `mocks/` at 393x852. |
| `preview.png`, `preview-full.png` | Screenshots of `index.html`. `preview.png` is the Gate 1 handoff image. |
| `GATE1.md` | Founder-facing Gate 1 summary. Replace the placeholders. |
| `MERGE.md` | When a reviewer agent can merge a build pull request without the founder. |

## Use

```sh
npm install            # one dependency: yaml
node build.mjs         # check spec.yaml, write index.html; exit 1 on errors
node build.mjs --list-checks
./render-mocks.sh      # mocks/<screen>--<state>.png for comparison
```

Copy [`scripts/check-snapshot-record-mode.sh`](scripts/check-snapshot-record-mode.sh) into `scripts/merge-gate.sh`. It fails when a tracked snapshot test is in record mode.

One mock alone: open `index.html?mock=<screen>:<state>` (add `:dark` for dark
mode, `&w=<px>&h=<px>` for another device size).

## What the spec check enforces

1. Every screen has a `default` state and a mock for each listed state.
2. `loading`, `empty` and `error` are each a state or listed in
   `not_applicable` with a reason.
3. Every screen has acceptance rules.
4. Every tap target goes to a real screen, and every screen is reachable from
   the first screen.
5. Every event a screen names is in `analytics.events`. The minimum events are
   present: `app_opened`, `core_action_completed`, `paywall_viewed`,
   `purchase_completed`.
6. The five web surfaces exist: landing, privacy, terms, support, delete.
7. Store screenshots use real screen IDs.
8. `status: approved` needs `approved_by` and `approved_at`.
9. Task ids are unique, every `depends_on` names a task, there is no dependency
   cycle, and `area` is one of App, Web, Store & Marketing, Growth, Money, Ops.
   Each screen is task `S-<id>` and each web page is task `W-<id>`.

`node build.mjs --list-checks` prints one line per check module (`id: describe`).
Add a later check as `checks/<NN>-<area>.mjs`. Add a review section as
`sections/<NN>-<area>.js`. Add build tasks in the `tasks:` list. Put that lane's
fixtures in `checks/verification/fixtures/spec-pack-<area>.fixtures.ts`. The
fixture runner loads every `*.fixtures.ts` in that directory.

The check proves the spec is complete. It does not prove the design is good.
The founder decides that at Gate 1.

## Lifecycle

1. **Research** fills `research` and `meta` (comps, patterns, definition of
   good, kill criteria).
2. **Spec pack**: an agent writes the rest of `spec.yaml`, runs the check
   until it passes, and renders `index.html`. Real mocks can replace the
   block mocks later; keep the IDs.
3. **Gate 1**: send `GATE1.md`, `preview.png`, and the zipped pack. The
   founder reviews `index.html` and the checklist. Approval sets
   `meta.status: approved`, `approved_by` and `approved_at`, in a commit. Do
   not create tracker issues or store listings before approval.
4. **Build to spec**: one screen at a time. A screen is done when:
   its simulator screenshot for each required state matches
   `mocks/<screen>--<state>.png` in layout, copy, tokens and tap targets; its
   tests pass; and the merge gate is green. Differences are fixed or listed in
   the PR. A reviewer merges only under `MERGE.md`.
5. **Gate 2**: the founder approves store submission after a real-device
   dogfood verdict.
6. **Launch and run**: the daily ship loop reads the event map to judge
   changes.

A change after Gate 1 needs a new `spec_version` and a new approval for the
changed screens only.

## Block mocks

Each state in `screens[].mock` is a list of blocks. Supported types: `nav`,
`title`, `text`, `art`, `button`, `link`, `input`, `chips`, `countdown`,
`big`, `row`, `bullets`, `price`, `close`, `spinner`, `banner`. Add `to:
<screen-id>` to make a block a tap target. `nav` takes `back` and
`action`/`action_to`. Unknown types render as a labeled placeholder.
`countdown` is an example of an app-specific block; add your own in
`template.html` the same way.
