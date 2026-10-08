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
- web head tags and discovery files. See [GEO and SEO](../growth/geo-seo.md#2-required-launch-artifacts) section 2.
- the web-to-app path in [Web to App Store](../growth/cro-landing.md#web-to-app-store)
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

## Choose the onboarding archetype

Pick one archetype and record why. The example app Soon is `utility-quick-start`.

| Archetype | Use it when | Shape |
| --- | --- | --- |
| `utility-quick-start` | A utility or widget. First value is under 30 seconds. | At most 5 onboarding screens. No quiz. |
| `result-reveal` | A result-led creative app. | Show the result. Do not use symptom screens. |
| `quiz-led-problem` | A problem/solution subscription app, such as health, habits, learning, or money. | The 9-step pattern, amended below. |

The 9-step pattern is a low-confidence practitioner heuristic. It names no dataset and no outcome data. ScreensDesign is how to check how common each step is, once the founder says yes. It is paid, needs founder yes. Do not connect it before that yes. A rank is not proof a screen caused an outcome.

`quiz-led-problem` keeps these amendments:

- Results comparisons need a cited baseline.
- At most 2 symptom screens, in the user's own words, neutral color, no medical claims, and Skip always visible. Banned for appearance or body, kids and teens, grief, and money distress.
- Native review prompt only, after the plan reveal. Any custom rating screen fails the check.
- Real testimonials only.
- One feature screen, tied to an answer.
- Plan loader backed by real computation.
- The paywall shows a trial timeline whose reminder is really scheduled.
- One closing offer, with the standard price and the renewal price, eligibility once.
- Keep the attribution question.

The approval checklist also carries these five checks:

- Value in 3 seconds. The first screen's default mock shows the core value and does not ask for sign-up. The machine check enforces this.
- The name and icon decide the invite.
- Marketing and product are one thing. The ad, the store page, onboarding, and the invite use the same audience and the same promise.
- Product-market fit is binary. If it is unclear, it is not working, so cut or pivot at Gate 2.
- Live support chat is in the app in the early days.

The spec pack uses the catalog event names: `onboarding_started`, `onboarding_step_viewed`, `onboarding_answer_selected`, and `onboarding_completed`. `utility-quick-start` and `result-reveal` require started, step viewed, and completed. `quiz-led-problem` also requires `onboarding_answer_selected`. A closing offer also requires `closing_offer_viewed` and `closing_offer_selected`.

Record the step-completion funnel, quiz drop-off per question, and time to first value. Record paywall view to trial, or view to purchase for a one-time price, and trial to paid. Discount take rate is `closing_offer_selected / closing_offer_viewed`. Guardrails are refund rate, Day-0 trial cancellation, and "charged/scam" 1–2 star reviews.

`mascot` is `yes` or `no`, with a reason. When the answer is yes and Masko is the route, the mascot is a state machine: poses are nodes, generated videos are transitions, and app inputs trigger them. The export is a `MaskoAnimationConfig` JSON plus a player. Generation is paid, needs founder yes. A dry-run quote is not spend approval.

## Acceptance

The machine check lives in `examples/spec-pack/checks/`. `build.mjs` loads those modules.
The check list lives in `examples/spec-pack/README.md`.
The check proves the spec is complete.
The check does not prove the design is good.

Gate 1 is the human gate.
The founder reviews `index.html` and the checklist.
The founder decides quality at Gate 1.

## Gate 1 handoff

End the spec-pack phase with this handoff.

The founder receives three files:

- `GATE1.md`
- `preview.png`
- the zipped spec pack

Send the chat in this order:

1. Name the app and the angle in one line. Then give review evidence as counts.
2. State the price model in one sentence.
3. Give pack counts: screens and states, light and dark mocks, and the click-through prototype. Also count web pages with real copy, the store listing, and payments setup. Also count analytics events with targets and kill criteria, build tasks, and backend or no backend. Then give the spec-check result and the research spend.
4. Tell the founder how to approve. Ask them to open `index.html` and reply "approved" or list changes. After approval, workers build one screen per pull request. Each screen matches its mock and passes tests.
5. List the open decisions only the founder can make. Give each decision a recommendation.
6. Describe the tracker work. Point to [Tracker mapping](#tracker-mapping). Keep the draft. Read the issue count from `tracker-draft.json`. Do not create tracker issues or store listings before approval. When the app is announced or launched, update its portfolio card. Use the founder's portfolio site, if any (a workspace setting). Refresh the "how we build" story.

Use counts from real sources.
Do not invent evidence.
Give each open decision a recommendation.
Do not create work in the tracker or the stores before approval.

Copy `examples/spec-pack/GATE1.md` and replace the placeholders.

When the learning ledger is on, approval writes the ledger record (`contracts/portfolio-ledger/learning-ledger.schema.json`) into the user's own private store.

## Tracker mapping

One project per app.

Milestones are the phases:

- Build
- Dogfood
- Gate 2
- Launch
- Run

Area labels:

- App
- Web
- Store & Marketing
- Growth
- Money
- Ops

Capability labels:

- Auth
- Privacy
- Security
- Deep links
- Discovery (SEO/AEO/GEO)
- Analytics
- Accessibility

`node build.mjs` writes `tracker-draft.json` next to `index.html`.
Each task becomes one issue.
The issue uses the task area label.
It adds capability labels when the task lists them.
Task dependencies become blockers.
Acceptance lines become the checklist.
A screen task id is `S-<id>` and its area is App.
A web page task id is `W-<id>` and its area is Web.
Other tasks come from the `tasks:` list.
Each issue starts on the Build milestone.
Set `milestone` on a task to move it.
Allowed values are the five milestones above.
The draft is not a task store.
The app task list stays in `TASKS.md`.

Do not create tracker issues before Gate 1 approval.
That write is a separate approved step.
Do not put tracker credentials, workspace names, or live ids in this repo.

`meta.web_origin` is the one site origin.
If it is missing, the build uses `https://<slug>.<account>.workers.dev`.
`meta.domain` is optional.
A missing domain does not fail the spec check.

## Build to spec

After Gate 1, workers build to the spec.
They do not ask questions.

A screen is done when all of these are true:

- Each required state has a simulator screenshot that matches its mock.
- The screen tests pass.
- The merge gate is green.

Match layout, copy, tokens, and tap targets.
Fix differences or list them in the pull request.
Web polish loads [Landing Motion Craft](landing-motion-craft.md).

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
5. Send the [Gate 1 handoff](#gate-1-handoff).
6. Record Gate 1 in `spec.yaml` and commit.

The example app is a placeholder countdown app named Soon.
Replace it.

## Relation to the Design Room

The Design Room reviews an accepted design after screens exist.
The spec pack is the approval view before those screens exist.
See [Design Room](design-room.md).

## Lifecycle

1. Research fills `research` and `meta`.
2. An agent writes the rest of `spec.yaml` and renders the page.
3. Send the Gate 1 handoff. The founder approves at Gate 1.
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

Discovery runs in parallel with the first web task.
It starts in the same wave as that page.
