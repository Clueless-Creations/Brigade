# Spec Pack

A spec pack is the one founder-approved contract for a new consumer app.

## Purpose

The spec pack is the first artifact for a new app.
It records every screen, state, web page, token, store listing, and event the build must meet.

The founder has two gates:

- Gate 1: spec approval
- Gate 2: store submission

Workers do not ask the founder questions between those gates.

## Contents

A spec pack is one manifest and one generated review page.
Edit `spec.yaml` only.
The renderer writes `index.html`.
The check list lives in `examples/spec-pack/README.md`.

A spec pack holds:

- every app screen and state at phone size
- a click-through prototype
- web pages: landing, privacy, terms, support, and account deletion
- design tokens and one art style prompt
- the store listing and paywall offer
- the analytics event map
- the repo starter files
- an approval checklist

## Required states

Every screen lists the states it must render.
Use the same state names as [Design Acceptance](design-acceptance.md).

Allowed names:

- `default`
- `loading`
- `empty`
- `error`
- `offline`
- `permission-denied`
- `success`

Every screen must include `default`.
Treat `loading`, `empty`, and `error` as a state, or list each one in `not_applicable` with a product reason.
Add `offline`, `permission-denied`, and `success` when they apply to that screen.
A listed state must have a mock.

## Acceptance

The machine check lives in `build.mjs`.
The check list lives in `examples/spec-pack/README.md`.
The check proves the spec is complete.
The check does not prove the design is good.

Gate 1 is the human gate.
The founder reviews `index.html` and the checklist.
The founder decides quality at Gate 1.

## Build to spec

After Gate 1, workers build to the spec.
They do not ask questions.

A screen is done when all of these are true:

- Each required state has a simulator screenshot that matches its mock.
- The screen tests pass.
- The merge gate is green.

Match layout, copy, tokens, and tap targets.
Fix differences or list them in the pull request.

## Change after approval

A change after Gate 1 needs a new `meta.spec_version`.
Re-approve the changed screens only.

## Ownership

The spec pack is a pre-acceptance draft and a generated review page.
It is not a new product store.
It is not a new design store.
It is not a new task store.
It is not a new state store.

After founder approval, each section lands in its existing owner.

| Spec section | Owner after approval |
| --- | --- |
| `meta` (promise, audience, core loop, definition of good, kill criteria) | `product.yaml` |
| `research` | `strategy/RESEARCH.md` |
| `design.tokens`, `design.style_prompt` | `DESIGN.md` and its token files |
| `screens` (states, acceptance) | `DESIGN.md` `acceptance` surfaces, `design/screens/<id>.md`, `studio/seed/business.json` |
| `web` | studio seed `landingPages`, `DESIGN.md` web surfaces |
| `store` | studio seed `appStore`, `SCREENSHOTS.md`, revenue docs |
| `analytics` | `analytics/ANALYTICS.md` |
| `repo` | the app `AGENTS.md`, `TASKS.md`, and merge gate |

Moving approved values into those owners is a manual step in this change.
Do not add a CLI command, reducer field, or schema for that move.

## Limits

Block mocks are low fidelity.
A mock is not runtime evidence.
Checkboxes on the review page do not record approval.
Approval lives in `spec.yaml` in Git.

The renderer turns simple blocks into phone mocks.
Unknown block types render as a labeled placeholder.

## Use

1. Copy `examples/spec-pack/`.
2. Replace the placeholder app in `spec.yaml`.
3. Run `node build.mjs` until the check exits 0.
4. Open `index.html` for founder review.
5. Record Gate 1 in `spec.yaml` and commit.

The example app is a placeholder countdown app named Soon.
Replace it.

## Relation to the Design Room

The Design Room reviews an accepted design after screens exist.
The spec pack is the approval view before those screens exist.
See [Design Room](design-room.md).

## Lifecycle

1. Research fills `research` and `meta`.
2. An agent writes the rest of `spec.yaml` and renders the page.
3. The founder approves at Gate 1.
4. Workers build one screen at a time.
5. The founder approves store submission at Gate 2.
6. The daily ship loop reads the event map.

## Pipeline

Work follows this order:

- research
- spec pack
- Gate 1
- build to spec
- real-device dogfood
- Gate 2
- launch and run
