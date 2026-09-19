# Mixed-surface independent review

Status: **filled**. Fresh-context independent re-score against rubric v1 for
issue **#70** applicability closeout (U4-2). This is Quiet Receipt
**fixture-tier** evidence — not a live greenfield complete-business run and
not publish-of-evidence (#72).

Frozen rubric: `design/reviews/rubrics/RUBRIC-mixed-surface-v1.md` version 1.

Date: 2026-09-19 (CT). Tip base at review: `d00ebd80066d75cd13998efe963743d15b8316ff`
(`b2c-app-builder@0.221.25`). The reviewer did not author the Quiet Receipt
pages, the leftover HTML repairs (`8a49788`), or the producer Accept-increment
comments.

## Method

Browser automation was unavailable for this pass. Re-score is
**file-based independent review** of tip sources: `growth/landing/privacy.html`,
`conversion.html`, `cinematic.html`, `studio/seed/business.json`, and this
rubric. Studio `interaction` / `job` and implemented `data-scene-*` hooks set
the class. Purpose prose was not parsed as authority. Pages were not restyled
and copy was not edited during this review. Prior leftover prose in the
2026-09-09 finding file was treated as a claim to re-verify against tip HTML,
not as authority.

## Findings

| Surface | Severity | Finding | Fit and usability |
| --- | --- | --- | --- |
| privacy | none | Static disclosures only. Semantic headings cover what is stored, who can read it, and how to delete. Nav links load the other two pages. `mailto:privacy@example.invalid` is a real mail link. Zero forms, zero scripts, zero `data-scene-*` hooks. Tip copy states the waitlist form on the conversion page **does not store** the email you submit; a valid submit puts that address in the page URL only — aligned with conversion confirmation. Fixture nav links declare `min-height` / `min-width: 24px`. The page stays a document. | Fits `static-document`. A privacy page that does not invent scrollytelling is not a fail. Prior privacy-copy drift and sub-24px nav leftovers are **cleared** on tip. |
| conversion | none | Promise, one labeled email field, one submit, and truthful fixture copy are present. Native `required` keeps an empty submit on `conversion.html`. `type="email"` rejects a value without `@`. A valid GET submit lands on `conversion.html?email=…#joined`. `#joined` names the address, says it was put in the URL and was **not stored**, and takes focus. JavaScript off: `:target` still shows the generic confirmation; the address remains in the query string. There are no `data-scene-*` hooks. Fixture nav links declare `min-height` / `min-width: 24px`. The waitlist control remains a large native button. | Fits `conversion` for promise, first action, and confirmation. Scroll-linked animation is correctly absent. |
| cinematic | none | Situation, mechanism, outcome, and proof are complete as a numbered list. Source implements scroll-linked hooks (`data-scene-track`, `--scene-p`, sticky `.pin`, paired step/visual state IDs). Active lifecycle hides plate labels (`[data-scene-lifecycle="active"] [data-scene-visual] p { display: none }`), sizes the stage (`min-height: 16.5rem`), and gives `figcaption` a solid paper background with `z-index: 1` so the prior 48px plate/caption collision at 1280 is not present in tip CSS. `prefers-reduced-motion: reduce`: pin `static`, all four visuals visible, `.now` hidden. Default markup keeps lifecycle `static` with all four steps and plates visible (JavaScript-off readable). Fixture nav links declare `min-height` / `min-width: 24px`. | Fits `scroll-linked`. Motion marks which state is under discussion. Prior 48px plate/figcaption leftover is **cleared** on tip CSS. Fashionable extra effects are not required. File-based review does not remeasure live paint pixels. |

Shared prior leftover (19px nav targets) is **cleared**: all three pages set
`nav[aria-label="Fixture pages"] a { min-height: 24px; min-width: 24px; }`.

## Verdict

pass

Privacy fits a static legal/support page and matches conversion on waitlist
storage claims. Conversion fits a waitlist page and acknowledges a valid
submit without inventing scroll-linked hooks. Cinematic is a measured
scroll-linked runtime that still reads with JavaScript off and with reduced
motion; tip CSS repairs remove the recorded 48px plate/figcaption overlap.
No class fails remain on tip sources. This Verdict is fixture-tier Quiet
Receipt re-score only — it does not claim #72 live greenfield evidence.
