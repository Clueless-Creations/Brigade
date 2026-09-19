# Greenfield complete-business benchmark protocol

Owner: #72. Measurement reuse: #73. Expo reuse: #88, only when the selected
product, revision, toolchain, and authority actually match.

A protocol PR is progress, not completion of the real-run requirement.

## Prerequisites (all required before a measured run)

1. Founder-approved representative app and empty-directory workspace.
2. Frozen mandate, product scope, and acceptance rubric hashes.
3. Selected recipe, providers, platforms, host agent, and toolchain pins.
4. Authorized budget and stop line.
5. Authority for any live provider mutation, device, submission, or publication.

Missing any row is a hold, not permission to invent the app or splice later
repairs into a frozen-baseline success.

**Current hold:** those inputs are not supplied on this checkout. After Credits
is a candidate only when that workspace is actually provided.

## Path A paper closeout (HoE settled — live not performed)

**Close path:** Path A — paper/deterministic-only. HoE settled no-live for #72.
Live complete-business, publish-of-evidence, and a measured onboarding interval were
**not performed**. This protocol remains progress, not completion of a live run.

Honesty locks for this close:

- Protocol ≠ completion of the real-run requirement.
- Fixtures / fabricated receipts ≠ live complete-business.
- `deliveryAccepted` ≠ submitted ≠ released ≠ live.
- Ungraded complete-business authoring forbids a completion claim.
- **Current hold** above is retained — prerequisites were not supplied; Path A does not invent them.
- #73 Stage B remains held without a measured interval (paper close does not unlock).
- #75 paid Stage B remains held without a measured interval (paper close does not unlock).
- After #72 closes on Path A: **U4 DONE — STOP**. **#511 / U5 PARKED** (do not auto-start).

See [greenfield-72-benchmark-closeout.md](./greenfield-72-benchmark-closeout.md).

## Report contract

These fields are a read model over existing receipts. They are not public API
and not a second execution state.

| Record | Required information |
| --- | --- |
| Run | Unique run reference; builder commit/version/package digest; app source revisions; mandate/scope/rubric hashes; selected recipe/providers/platforms; actual worker/runtime/model/toolchain; timestamps; authorized budget/stop-line references |
| Attempt | Existing session/attempt/workflow reference; start/end; result; retry/repair reason; observed usage/cost source; referenced outputs and review |
| Intervention | Time; phase; category; trigger; safe question/action summary; affected work; whether independent work continued; resolution and evidence reference |
| Observation | Claim; source/environment/revision; fixture/workspace/provider provenance; observed value or explicit unknown; coverage limitation |
| Final verdict | Every accepted requirement mapped to current proof or blocker; independent quality judgment; delivery status; separate submission/release/live claims |

Intervention categories: planned founder decision; external dependency;
unplanned builder rescue; discretionary product/scope change.

## #73 Stage A

Reuse this report. The unit of analysis is one observed selected subgraph, not
the whole catalog. Until a #72 interval exists, the keep/change recommendation
is **retain the current graph**. The compact boundary table is
[workflow-overhead-boundaries.md](./workflow-overhead-boundaries.md). Observed
cost stays unknown. Apple media (#38) stays an independent-effect boundary. Do
not merge to reduce workflow count. **#73 closes on this Stage A retain**; Stage B
is held until a real #72 measured interval (Path A paper close of #72 does **not** unlock Stage B). See
[greenfield-73-overhead-closeout.md](./greenfield-73-overhead-closeout.md).

## #75 Stage A

Reuse this report only for live complete-business / publish-of-evidence /
measured-interval ownership that was deferred to **#72** (Path A: not performed). Retrieval-to-worker evaluation and
independent judgment close on tip Stage A: **no-change recommendation** on
retrieval infrastructure; BM25 preserved; no vector store, embeddings, or graph
database; hosted `catalog()` does not import `matchWorkflows`. **#75 closes on this Stage A no-change**;
paid Stage B is held (Path A paper close of #72 does **not** unlock Stage B). See
[greenfield-75-retrieval-closeout.md](./greenfield-75-retrieval-closeout.md)
and [greenfield-72-benchmark-closeout.md](./greenfield-72-benchmark-closeout.md).


## #76 Required-scenario matrix

Reuse this report only for live complete-business / publish-of-evidence /
measured-interval ownership on **#72**. Business-change-impact / change-propagation
closes on tip deterministic Required-scenario matrix: expected affected/unaffected
IDs; four proof layers distinct; cascade owners exercised; residual price/platform/
source-correction/source-metadata rows landed; interruption mapped via needs_readback
+ engine interrupted-run. **#76 closes on this deterministic matrix**; live/provider/
publish/measured interval were deferred to **#72**. #72 closed on **Path A paper**
(live/publish/measured **not performed**). See
[greenfield-76-change-impact-closeout.md](./greenfield-76-change-impact-closeout.md)
and [greenfield-72-benchmark-closeout.md](./greenfield-72-benchmark-closeout.md).

## #88 reuse

Reuse this report only for a matching Expo product scope. The frozen matrix is
[expo-proof-matrix.md](./expo-proof-matrix.md). Missing device or cloud access
stays `not-run` / `blocked`.
