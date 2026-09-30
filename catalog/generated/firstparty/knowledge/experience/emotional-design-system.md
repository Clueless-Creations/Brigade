# Emotional Experience System

Use this when building, auditing, or reviewing the emotional and behavioral layer of a B2C mobile app. Apps charged with emotions feel different: they anticipate, solve, and reward action. This file is the methodology. The canonical 12-card deck lives in `knowledge/experience/experience-cards.md`; producer recipes for the four foundational cards are in `knowledge/experience/emotional-experience-design.md`, and measurement contracts in `knowledge/experience/emotional-experience-measurement.md`. Read both before implementation.
## Applicability And Evidence Boundary

Card selection is conditional; the discipline of making and reviewing that selection is core. Calm, predictable feedback and immediate completion can be the right emotional experience. Evaluate the actual user need before selecting novelty, anticipation, a commitment, or a reveal. Do not manufacture a behavioral loop to fill a card checklist.

Psychological theories and examples below motivate hypotheses. They do not establish a universal effect size, a guaranteed star-level improvement, or a measured benefit in this product. Keep observed user response separate from intended tone. Every applied card retains its ethics, truthful progress, accessibility and measurement obligations; marking another card non-applicable waives none of them.

Focused audits use the Audit Output Contract below and the evidence relevant to their scope.
The formal producer and auditor artifacts apply when the selected task requires those deliverables.
Numeric scoring and star-ladder exercises apply only when the selected task explicitly requests them.
Do not create formal artifacts or runtime state merely to report a focused finding.

Cross-references (do NOT duplicate; integrate):

- `knowledge/experience/eleven-star-experience.md` — audit finding contract and an optional, explicitly selected star-ladder exercise.
- `knowledge/design/quality-lens.md` — "specific to the user's emotional job, not a generic SaaS wrapper."
- `knowledge/experience/onboarding-conversion.md` — onboarding is the primary sales surface; card timing relative to paywall and App Review popup is governed here.
- `knowledge/data/analytics-attribution.md` — every emotional moment must emit a named PostHog event; the event catalog is extended here, not duplicated.
- `knowledge/design/design-room.md` / `knowledge/design/design-visual-system.md` — motion is a delight lever; every card-level motion moment must declare a `prefers-reduced-motion` / OS reduce-motion fallback in `DESIGN.md`.
- `knowledge/process/failure-cards.md` — dark-pattern violations and missing card attestations become failure cards.
- `knowledge/experience/ethics-guardrail.md` — the Guardrail Contract and per-mechanism prohibitions are the compliance boundary for every card applied by this system.
- `knowledge/experience/consumer-product-design-agency.md` — the five-tier academic source synthesis; this file operationalizes it.

When no card applies, record the following fenced YAML inside the existing `EMOTIONAL_DESIGN.md`. Each text field must explain the actual product decision (at least 30 characters, no placeholders). The audit independently records its decision in `EMOTIONAL_AUDIT.md`; an empty map alone is insufficient. This selects zero cards, not a skipped ethics review. A selection cannot coexist with applied card blocks.

```yaml
experience_card_selection:
  status: not_applicable
  user_job: Locate the household document and read its renewal date.
  rationale: Predictable retrieval needs no commitment, reward, wait or intent mirror.
  alternative: Show the requested record immediately with clear status and recovery.
```


## Contents

- Principle
- Knowledge Hierarchy
- Experience Card Deck
- Emotional Review Framework
- Producer Protocol
- Auditor Protocol
- Ethics And Dark-Pattern Guardrail
- Required Artifacts
- Integration
- Run Protocol
- Audit Output Contract
- Gates Before Build
- Common Failures

---

## Principle

Functional apps complete tasks. Emotional apps create memories. The difference is not polish — it is deliberate design of anticipation, effort, recognition, and surprise.

Four questions drive this system:

- Where does the user feel something, and is that moment designed or accidental?
- Is the emotional peak placed before or after the paywall?
- Is the session-end moment shaped, or is it just a dismiss tap?
- What does the user tell their friend tomorrow, and which product moment made that sentence possible?

The system does not teach manipulation. Every card has a bright line (serves the user's real goal) and a dark line (extracts value against the user's interest). The dark line is a compliance veto: implementation stops until it is resolved.

The emotional layer is not separate from product, onboarding, and analytics. It is a constraint on how those systems are designed and measured. A card that does not emit a PostHog event does not exist. A card that cannot be verified on a running app — the in-app iOS Simulator (rung 0) is sufficient for a bright-line check such as "is this editable at any time", MobAI or a real device when Android, haptics, thermals, real-network latency, or a repeatable suite are in scope — does not ship.

---

## Knowledge Hierarchy

The system draws on five academic tiers, synthesized in `knowledge/experience/consumer-product-design-agency.md`. That file is the source-of-truth for researcher attribution, tier artifacts, and failure modes. Do not duplicate it here; extend the operational layer.

Tier hierarchy for decision-making:

1. **Tier 1 — Human-Centered Design.** (Norman, Nielsen, Miller, Hick, WCAG.) Cognitive load, accessibility, and formative research. Determines onboarding screen count, choices per screen, and contrast/motion safety gates. Failure: onboarding that felt obvious to the team confuses real users.

2. **Tier 2 — Emotional Design.** (Norman visceral/behavioral/reflective, Picard, Cooper, Garrett.) The three Norman levels fire simultaneously from the first frame. `DESIGN.md` must encode a deliberate choice at each level before any screen is built. Failure: the app sits at 5-star because it is functionally correct but emotionally neutral.

3. **Tier 3 — Behavioral Science.** (Fogg B=MAP, Kahneman peak-end rule, Cialdini, Skinner, Schultz, Berridge, Eyal, Ariely, Thaler, Dai fresh-start.) The Four Required Cards are the primary Tier 3 artifacts. Peak-end rule governs session architecture. B=MAP governs onboarding conversion. Failure: Day-7 retention is low not because the loop is broken but because no deliberate peak was designed.

4. **Tier 4 — Service Design.** (Blueprinting, frontstage/backstage, journey mapping, systems thinking.) Maps every onboarding screen to its backstage dependency. Surfaces feedback loops that produce launch failures. Failure: beautiful frontstage, broken backstage; discovered from 1-star reviews, not pre-launch validation.

5. **Tier 5 — Human-Centered AI.** (Stanford HAI, MIT CSAIL, CMU HCII.) Trust calibration, agency, explainability. First AI result sets trust. Agency path (≤2 taps to override) is required for every AI-generated recommendation. Failure: "AI feels like a gimmick" 3-star pattern — a perception gap not visible in crash analytics.

Researcher attribution for every claim used in card design is required. Where a canonical paper exists, name it. Where attribution is uncertain, write `attribution-uncertain: <closest known basis>` rather than inventing a citation.

---

## Experience Card Deck

Twelve cards cover the full behavioral arc from first session through churn recovery. Each card is selected only when the user job supports it. The eight additional cards fill temporal, memorial, social, identity, pre-conversion, and failure-state gaps that the named four leave open.

Use this table as a navigation surface. The files under `knowledge/experience/experience-cards/` (e.g. `knowledge/experience/experience-cards/commitment-card.md`), routed by the index at `knowledge/experience/experience-cards.md`, are frozen free-layer stubs — title, one-liner, risk tier, bright/dark lines, and a served-by-MCP pointer. The full card specs — psychological basis, trigger timing, motion spec, guardrail detail, PostHog events, and dark-pattern tests — are served per card by the Retention Mechanics MCP (`retention_get_mechanic`). Load only the cards in scope; the index carries the card shape, summary table, and Ethics Ladder.

When a `retention-mechanics` MCP server is connected, prefer it over loading card files directly: `retention_search_mechanics` routes a product moment to candidate cards without loading the whole deck, and `retention_get_mechanic` / `retention_get_ethics_ladder` serve the maintained, versioned card content and the tier-appropriate attestation scaffold. The bundled deck stays the frozen offline snapshot — validators always read it, and it is authoritative whenever the server is not connected (see the index's live-deck-access note).

The deck itself is [`experience-cards.md`](./experience-cards.md) — its Card Routing table says
which card to reach for when, and its Summary Table carries the thesis, 11-star level and
bright-line guardrail per card. That index and the twelve card files under
[`experience-cards/`](./experience-cards.md) are the single source; a second copy of the same
twelve rows here is the duplication docs/architecture.md names, and it drifts silently because
nothing compares the two tables.

**Deck coverage rationale.** The four foundational cards (Commitment, Variable Reward, Perceived Effort Delay, Intent Mirroring) are strongest at 6-star and 7-star and operate primarily within a single session or the onboarding funnel. The eight additional cards fill five gaps: temporal momentum and return-visit drive (Endowed Progress, Streak and Loss Aversion, Fresh Start); memory and word-of-mouth b2c (Peak-End); intrinsic and social motivation (Mastery and Status); identity anchoring (Identity and Self-Expression); and pre-conversion motivation and failure resilience (Reciprocity, Recovery and Trust Repair). No card in the deck duplicates another's mechanism.

---

## Emotional Review Framework

Use relevant lenses to inspect the affected feature, screen, or journey against the accepted user outcome.
Inspect the running app for behavior claims and rendered proofs for design proposals.
Use an authorized provider that supplies the required evidence. Haptics, thermals, and real-device latency require device proof.
Label unavailable evidence instead of inferring it from a simulator or screenshot.

Only when explicitly requested, score each lens 0–2 (0 = absent or harmful, 1 = weak, 2 = strong).
The optional total is out of 12. It supports discussion and grants no acceptance authority.
Resolve material defects and verify behavior, visual craft, accessibility, and recovery regardless of scoring.

### Lens 1 — Human Goal And JTBD

Does this feature serve the job the user actually hired the app to do? Not what the feature does, but what the user was trying to accomplish in their life. State the JTBD in one sentence using the form: "When [situation], I want to [motivation], so I can [expected outcome]." If the user goal is unresolved, record that gap before accepting a design decision.

Evidence required: `PRODUCT.md` JTBD statement or `11_STAR_EXPERIENCE.md` user scene for the relevant star level.

### Lens 2 — Emotional Goal

What emotion should the user feel during and after this interaction? Name it specifically (confidence, relief, surprise, pride, curiosity, belonging). A feature that produces no deliberate emotion produces no memory. A feature that produces the wrong emotion (anxiety, confusion, guilt) damages trust.

Evidence required: the `DESIGN.md` three-level emotional tone block (visceral/behavioral/reflective) for this screen or feature cluster.

### Lens 3 — Emotional Journey

Map the emotional arc across the session or flow: entry state → trigger → build → peak → resolve → exit state. Identify the peak explicitly. The peak must occur before the paywall, not after. The exit state must not be a paywall decline.

Evidence required: the Emotional Curve artifact (see below) plotted for this flow.

### Lens 4 — Behavioral Analysis (Fogg B=MAP)

At the moment you want the user to act, is Motivation high enough, Ability low enough (friction minimized), and Prompt timed correctly? Identify which factor is weakest. Score 2 only if all three are deliberately designed, not assumed.

Evidence required: the B=MAP audit row in `product/ONBOARDING.md` for onboarding features; the equivalent note in `PRODUCT.md` for core-loop features.

### Lens 5 — Experience Quality (Norman's Three Levels)

Does the feature work at all three Norman levels simultaneously?

- Visceral: does it look and feel right on first sight? (palette, motion, typography)
- Behavioral: does it do what the user expects with minimal friction? (affordances, signifiers, CTA copy)
- Reflective: does it make the user feel something about themselves? (goal language, identity, memory)

Score 0 if any level is absent or actively harmful. Score 2 only if all three are deliberate.

Evidence required: the three-level tone block in `DESIGN.md` and signifier audit in `product/ONBOARDING.md`.

### Lens 6 — Service Design

Is every frontstage moment backed by a verified backstage dependency? Name the API, entitlement state, analytics event, and permission required for this feature. A frontstage/backstage table gap is a known launch risk, not a cosmetic issue.

Evidence required: the frontstage/backstage dependency table in `engineering/TECH_SPEC.md` for this screen or feature.

### Emotional Curve Artifact

Produce an Emotional Curve when the selected task requires that artifact. It plots the session or flow using Lens 3 observations.
A focused review may describe the relevant transitions directly without creating a plot or estimating numeric intensity.

Requirements:

- Plot it in `emotional-design.html` using the project's design tokens (`--motion-*`, `DesignTokens.Motion`).
- The curve must peak at or before the paywall marker. This is a deterministic validator rule: a curve that peaks after the paywall fails the audit.
- Mark the positions of each applied Experience Card on the curve.
- Mark the App Review popup position (must be at or after the peak, per `onboarding-conversion.md`).
- Include a reduced-motion fallback (flat curve with labeled milestones) for `prefers-reduced-motion` contexts.

Validator phrase: `Emotional Curve` must appear in `EMOTIONAL_DESIGN.md`. The paywall marker and peak position must be documented in that file as machine-checkable values.

---

## Producer Protocol

Use this when the task is to charge a feature with emotion ("turn this feature into an emotional experience", "charge this feature", "apply the X card to this flow").

This protocol produces `EMOTIONAL_DESIGN.md` updates, card applications, measurement events, and an ethics attestation. It does not produce a separate report — it updates existing artifacts.

### Ordered Steps

1. **Load context.** Read [`eleven-star-experience.md`](eleven-star-experience.md), `analytics-attribution.md`, `onboarding-conversion.md`, and `design-visual-system.md` if not already loaded. Read `PRODUCT.md` and `product/ONBOARDING.md` for the target feature.

2. **Name the JTBD.** Write one JTBD sentence for the feature being charged. If it does not exist in `PRODUCT.md`, add it before proceeding.

3. **Run the Emotional Review Framework.** Record concrete findings for the relevant lenses. Score them only when the selected task requests scoring. Keep the formal artifact's Review Scores section, stating when scoring was not selected. Actual findings determine repairs; scores establish no outcome.

4. **Select cards.** From the twelve-card deck, identify which cards apply to this feature and at which moments. Evaluate the four foundational cards (Commitment, Variable Reward, Perceived Effort Delay, Intent Mirroring) at applicability depth; mark them not-applicable with a user-job reason when unsuitable. Justify each selected additional card with a JTBD-level reason, not a "would be cool" reason.

5. **Design the Emotional Curve.** Map the entry state, build, peak, resolve, and exit state for the flow. Verify the peak falls before the paywall. Render the curve in `emotional-design.html`.

6. **Write card applications.** For each selected card, write the application block in `EMOTIONAL_DESIGN.md`:
   - trigger moment (screen name, state, user action)
   - copy or interaction spec (≤3 sentences; use the user's goal language, not generic copy)
   - motion spec (design token reference; `prefers-reduced-motion` fallback)
   - PostHog event(s) from `emotional-experience-measurement.md` for this card
   - bright-line attestation (one sentence confirming it serves the user's real goal)
   - dark-line check (one sentence confirming no forbidden pattern is present)

7. **Update `analytics/ANALYTICS.md`.** Add the card-specific PostHog events to the event catalog. Do not reuse existing event names — extend them per the naming rules in `analytics-attribution.md`.

8. **Update `DESIGN.md`.** Add the three-level emotional tone block for this feature if absent. Add the motion spec for each card's delight moment with a reduce-motion fallback.

9. **Update `engineering/TECH_SPEC.md`.** Add the frontstage/backstage dependency table row for each card-carrying screen.

10. **Write the ethics attestation.** For each applied card, write the attestation block required by `ethics-guardrail.md §Guardrail Contract`. Run `npm run check:emotional-design -- --root .` and fix all errors before proceeding.

11. **Run the validator.** `npm run check:emotional-design -- --root .` must pass before claiming any card is applied.

12. **Update `engineering/PRODUCTION_READINESS.md`.** Add the card application as an evidence row. Mark it `pending verification` until a running-app audit — in-app iOS Simulator (rung 0) or MobAI — confirms the behavior on the device class the card targets.

**Output.** The producer protocol modifies existing artifacts, does not create new standalone documents. The one exception is the first run: create `EMOTIONAL_DESIGN.md` from the template if it does not exist.

---

## Auditor Protocol

Use this when the task is to audit an existing app's emotional design ("audit this app's emotional design", "score this flow", "find where we're leaving emotional value on the table").

Inspect the running app and report concrete findings with a repair and verification path.
Produce `EMOTIONAL_AUDIT.md` when the selected task requires that formal artifact. A focused review returns findings directly.
Simulator evidence supports the behavior it demonstrates. Use an authorized device provider for haptics, thermals, or real-device latency claims.
Formal managed acceptance retains its required evidence and independent review.

### Ordered Steps

1. **Load context.** Read the accepted product and design context relevant to the journey. Load the selected device provider's instructions when needed. Apply the ethics guardrail to persuasive mechanisms. Open the star ladder only when the selected task requires that exercise.

2. **List screens.** On rung 0, ask the runtime to run the app in the simulator and read the screen; on MobAI, read the active MCP resources or current CLI help and use the exposed app/device/bridge route. Navigate each screen in the primary journey (onboarding → first value → paywall → core loop → re-engagement). Use the route's screenshot tool — the pane's capture shortcut, the Codex screenshot tool, or the `mobai screenshot` form from live help — to capture each state. Do not pre-choreograph multi-step chains without per-step screen verification; that applies to a rung-0 tap sequence exactly as it does to a MobAI DSL block (see `mobai-onboarding-chain-unverified` failure card).

3. **Inspect each relevant screen.** Record observed friction, user impact, behavior, visual craft, accessibility, recovery, and any dark-pattern signals. Use scores only when explicitly requested.

4. **Inspect the journey.** Trace first value, friction, and resolution through the requested flow. Produce a curve or star comparison only when the selected task requests it. Distinguish observed behavior from inferred emotional response.

5. **Write findings.** Use the Audit Output Contract below. A short paragraph or table is sufficient when it contains the required evidence.

6. **Generate pathways to better state.** For each material finding, write a specific repair. Select a card only when it addresses the diagnosed need; ordinary feedback, clearer content or removing a delay may be the appropriate repair. Include the card name, the trigger moment, the copy sketch, and the PostHog event that would measure the change.

7. **Record material defects.** Flag dark patterns and unmet user needs. Open required failure cards for managed work through its supported process. A focused review reports them directly. A documented non-applicable card is not a failure.

8. **Record managed evidence.** When the selected task requires runtime evidence, use the supported operation for the audit result. Include scores only when selected. Never edit reducer-owned state directly.

9. **Verify applicable contracts.** For formal emotional-design deliverables, run `npm run check:emotional-design -- --root .` and resolve errors. Focused reviews report the evidence examined and the checks needed to verify proposed repairs. Neither path substitutes a score for independent acceptance.

**Output.** Findings and verification gaps. Formal managed tasks also produce their declared artifacts and record evidence through supported operations.

---

## Ethics And Dark-Pattern Guardrail

This section is a compliance surface. The full policy, regulatory basis, and per-mechanism prohibitions live in `knowledge/experience/ethics-guardrail.md`. Do not duplicate that file — integrate it.

### Bright-Line Vs Dark-Line

[`ethics-guardrail.md`](./ethics-guardrail.md) §1 Bright-Line Vs Dark-Line Distinction.

### Hard Gates (Unconditional Vetoes)

[`ethics-guardrail.md`](./ethics-guardrail.md) §5 Guardrail Contract → Non-Negotiable Prohibitions.

### Regulatory Basis

[`ethics-guardrail.md`](./ethics-guardrail.md) §2 Regulatory And Platform Landscape.

## Required Artifacts

Create or update before calling the emotional layer build-ready:

- `EMOTIONAL_DESIGN.md`: the applied card deck for this product. Sections: Review Scores, Card Applications (one block per applied card), Emotional Curve (text representation; rendered in `emotional-design.html`), Ethics Attestations.
- `emotional-design.html`: rendered Emotional Curve using design tokens; position markers for each card, paywall, and App Review popup.
- `analytics/ANALYTICS.md`: card-specific PostHog events added to the event catalog.
- `DESIGN.md`: three-level emotional tone block; motion spec per card with reduce-motion fallback.
- `engineering/TECH_SPEC.md`: frontstage/backstage dependency table for each card-carrying screen.
- `engineering/PRODUCTION_READINESS.md`: card application evidence rows; real-device verification status.
- `operations/FAILURE_CARDS.md` (or `state/business-state.json`): open cards for any dark-pattern findings, missing cards on key screens, or validator errors.

Update `state/business-state.json`:

```yaml
lanes:
  emotional_design:
    status: "partial"
    evidence:
      - "EMOTIONAL_DESIGN.md"
      - "emotional-design.html"
    blockers: []
```

---

## Integration

### Eleven-Star Experience (`eleven-star-experience.md`)

When the selected task requests star-ladder mapping, relate card applications to its accepted experience contract. Suggested mapping:

- 5-star: no card applied; the feature works but creates no emotional memory.
- 6-star (better than expected): Commitment, Variable Reward, Perceived Effort Delay, Endowed Progress, Streak, Reciprocity, Fresh Start, Recovery cards elevate to this level.
- 7-star (made for me): Intent Mirroring, Identity and Self-Expression, Mastery and Status, Peak-End cards operate primarily at this level.
- 10–11 star: inspiration reference only; no cards operate here by default.

Lens scores and star levels are discussion tools. Neither establishes the experience achieved without current evidence.

### Quality Lens (`quality-lens.md`)

The anti-generic check from `quality-lens.md` applies to every card application: the card implementation must use the product's actual nouns, verbs, and the user's own words — not generic "keep going!" copy. The Reflective Norman level is where "specific to the user's emotional job" is tested. A card that passes the bright-line test but uses generic copy is at 5-star, not 6.

### Onboarding Conversion (`onboarding-conversion.md`)

Card timing relative to the paywall and App Review popup is governed by `onboarding-conversion.md`. Required timings:

- **Commitment Card**: during onboarding, at the first personalization question. Echo appears before the paywall.
- **Perceived Effort Delay Card**: at the personalized plan reveal, before the paywall.
- **Intent Mirroring Card**: after first value or at session end. Must not appear on the same screen as a paywall CTA.
- **App Review popup**: never inside first-run onboarding. Earn eligibility at the first value moment (the peak of the Emotional Curve), then request through the native platform API outside first-run onboarding, at a later natural success in normal product use, with a 1–2 second async delay after that screen mounts. Must not be bound to a tap that dismisses the screen.
- **Paywall**: shown after the Emotional Curve peak, not before.

### Analytics Attribution (`analytics-attribution.md`)

Every card emits PostHog events. The events are named and specified in `emotional-experience-measurement.md`. Integration rules:

- Add events to `analytics/ANALYTICS.md` before implementation.
- Do not reuse existing event names; extend the catalog.
- Use `snake_case` event names consistent with the catalog.
- System-level envelope events (`emotion_card_fired`, `emotion_card_completed`, `emotion_card_abandoned`, `emotion_card_opt_out`) fire for every card activation and feed the Dark-Pattern Watch dashboard.
- Peak-end event pair (Variable Reward reveal = peak; Intent Mirror or last core action = end) feeds the north-star retention dashboard.

### Design Room And Visual System (`design-room.md`, `design-visual-system.md`)

Motion is a delight lever, not decoration. Rules:

- Every card-level delight moment must reference a named `DesignTokens.Motion` token (for SwiftUI / Flutter / Reanimated native targets) or a `--motion-*` CSS variable (for web).
- Every motion moment must declare a `prefers-reduced-motion` / OS reduce-motion fallback in `DESIGN.md`.
- The Emotional Curve rendered in `emotional-design.html` uses the project's motion tokens for its own animation.
- Generated or token-derived motion proofs must live in `emotional-design.html`, not in a standalone mood board.

### Failure Cards (`failure-cards.md`)

Card-level failure shapes to open when violations are found:

| ID  | Trigger | Required Fix |
| --- | ------- | ------------ |

<!-- Canonical failure-card definitions (full YAML shape, severity, owner, validator) live in
     emotional-experience-design.md §Failure Cards. This table is a routing surface. The IDs
     must match that file exactly. -->

| `experience-card-not-implemented` | A selected card is absent where its accepted user-job rationale requires it | Apply the card per the Producer Protocol; add PostHog event to `analytics/ANALYTICS.md`; run `check:emotional-design` |
| `experience-card-dark-pattern` | Any applied card fails the three-question bright-line test or uses a prohibited pattern from `ethics-guardrail.md §Non-Negotiable Prohibitions` | Stop implementation; remove or redesign the mechanism; run `check:emotional-design`; open as severity critical |
| `emotional-curve-peak-after-paywall` | The Emotional Curve plot in `EMOTIONAL_DESIGN.md` or `emotional-design.html` shows the emotional peak occurring after the paywall marker | Redesign the flow so the peak occurs before the paywall; re-render `emotional-design.html` |
| `experience-card-event-missing` | A card is applied in `EMOTIONAL_DESIGN.md` but no corresponding event exists in `analytics/ANALYTICS.md` | Add the event to `analytics/ANALYTICS.md` before implementation; verify with `check:attribution` |
| `experience-card-motion-no-fallback` | A card's motion moment is specified in `DESIGN.md` without a `prefers-reduced-motion` fallback | Add the fallback; re-run `check:token-promotion` |
| `emotional-audit-unintegrated` | An audit (`EMOTIONAL_AUDIT.md`) exists but findings have not been converted to failure cards or `state/business-state.json` updates | Accept or reject each finding; open failure cards; update `state/business-state.json` |

---

## Run Protocol

Classify the requested work before selecting a protocol. A focused review returns findings without creating producer artifacts.
For implementation, author the product and design decisions required by the accepted scope before dependent changes.
Create `EMOTIONAL_DESIGN.md` when the selected producer task requires that formal deliverable.
Requests to improve emotional design do not automatically request numeric scoring or a star-ladder exercise.

**Trigger phrases that invoke the Producer Protocol:**

- "turn this feature into an emotional experience"
- "charge this feature"
- "apply the [card name] card"
- "add [card name] to [flow]"
- any equivalent instruction to add emotional design to a new or existing feature

**Trigger phrases that invoke the Auditor Protocol:**

- "audit this app's emotional design"
- "score this flow"
- "find where we're leaving emotional value on the table"
- "do an emotional design pass"
- any equivalent instruction to evaluate existing emotional design

The ordered output sequences are the Producer Protocol and Auditor Protocol above, in this same file. Dispatch to a protocol using the table above, then follow that protocol as written.

## Audit Output Contract

Use the UX And Onboarding Audit Output Contract in [`eleven-star-experience.md`](eleven-star-experience.md):
observed problem, user impact, proposed change, and verification, with the affected surface and supporting evidence.

Include mechanism, ethics, motion, and measurement details when they affect the finding or repair.
Numeric lens scores, emotional intensity estimates, and current/target star levels are optional unless the selected task explicitly requests them.
Formal artifacts retain their required sections; state when an optional exercise was not selected.
No score, card selection, or document can replace observed behavior, accessibility proof, or independent acceptance.

---

## Gates Before Build

The build-handoff gate is [`ethics-guardrail.md`](./ethics-guardrail.md) §7 Acceptance Checklist.
`check:emotional-design` enforces it. Do not restate the checklist here — a second copy is a
second place to drift from the validator.

## Common Failures

- The "emotional design" pass produces only copy changes (warmer button labels) without engaging any card mechanism. The result is 5-star with nicer words.
- Cards are named in `PRODUCT.md` but not specified: no trigger moment, no copy sketch, no PostHog event. Unnamed implementations are unmeasurable and untestable.
- The Emotional Curve is described in prose but not rendered in `emotional-design.html`. The paywall-marker rule cannot be validated from prose.
- The Perceived Effort Delay stage labels are written for marketing impact, not accuracy. Fabricated labels ("Analyzing 47 data points…" for a cached lookup) are a compliance veto, not a copy problem.
- Variable Reward motion is specced but has no reduce-motion fallback. Accessibility is a launch gate, not a polish task.
- The Intent Mirroring Card copy uses generic filler ("Great job on your session!") rather than the user's own words from the Commitment Card. This is a 5-star implementation labeled as 7-star.
- The Emotional Curve peaks after the paywall. Conversion suffers because the user's highest-engagement moment is locked behind a purchase gate rather than creating the motivation to purchase.
- Cards are applied to success paths only. Failure states (errors, lapsed streaks, payment failures) receive no card — producing negative peaks that dominate the user's memory per the peak-end rule.
- The audit omits the affected journey step, observed problem, user impact, proposed change, or verification. Optional scores cannot supply missing evidence.
- `check:emotional-design` is never run during the producer or auditor session. Known validation gaps accumulate invisibly and block the next agent.
- The ethics attestation blocks in `EMOTIONAL_DESIGN.md` are filled with "N/A" or empty strings. Empty attestations are not compliant; they are the same as no attestation.
- An auditor chains 6+ onboarding steps in a single MobAI DSL block without per-step screen verification. Navigation silently stalls on the wrong screen and the audit findings are invalid. Follow the Onboarding-Flow Navigation Pattern in `mobai-toolbelt.md`.
