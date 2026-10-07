# Bounded Brigade knowledge

The single bundled MCP connection points to the existing Brigade knowledge service.
Its four tools read catalog, workflow, search, and reference data. They do not inspect the user's app or store an audit.
They are available without sign-in.

## Retrieve only applicable guidance

1. Read these existing workflow routes with `b2c_workflow` and `include: "route"`:
   - `workflow.experience.onboarding-system.onb-10-first-value-activation`
   - `workflow.experience.onboarding-system.onb-11-effort-question-audit`
2. Follow each returned `route.expand` with `b2c_workflow`. Interpret its managed authoring instructions as review criteria for this advisory task.
3. Use `b2c_knowledge_search` with generic terms, such as `first value effort`, and the applicable workflow ID. Never send app names, capture text, user profiles, or file contents.
4. Find `reference.experience.onboarding-conversion` in the returned route or search data. Preserve its `contentSha256`.
5. Discover headings with `b2c_knowledge_get`: `referenceId`, `view: "sections"`, and `expectedContentSha256` from discovery.
6. Retrieve the discovered `sectionId` for **Evidence contract** and **Product and architecture contract** with that hash.
7. When a paywall is visible, search `pricing disclosure paywall` for `reference.money.paywall-pricing-and-experiments`.
8. Discover its headings. Retrieve **1. Paywall Timing, Plans, Trials, And Offers** and **2. Pricing And Disclosure Rules** only when needed.

Use the returned section IDs; do not construct them from heading slugs.
Follow `nextCall` until the selected content is complete. Offsets count Unicode code points, not bytes or tokens.
A search excerpt or workflow route is not complete guidance. A stale hash requires fresh discovery, not dropping revision checks.
If a heading is absent or access fails, report the missing source and continue the supported capture audit.

The paywall reference contains benchmarks and business defaults. They are priors, not evidence about this app.
Do not transplant figures, default prices, trial lengths, providers, or expected lifts into the findings.
Read only the applicable evidence, input/value, disclosure, and recovery rules. Do not execute its managed-workspace procedures.

## Cite accurately

For a capture observation, cite its source ID and supplied timestamp. For guidance, cite the reference ID, section, returned hash, and provenance URL.
Include a source date when available. A source review date does not establish current live policy or app behavior.
Use a current official platform source when making a platform-policy claim. If that source is unavailable, label the claim unresolved.
Do not cite a URL that the returned source does not provide as if it was retrieved.

The reviewed repository baseline is `12fd1bfd55744463c5d2bf0ac5f6fa9b6799eece`.
These public source links explain the method; they do not prove the hosted version:

- [First value](https://github.com/Clueless-Creations/Brigade/blob/12fd1bfd55744463c5d2bf0ac5f6fa9b6799eece/agents/skills/b2c-design-onboarding/references/workflow.experience.onboarding-system.onb-10-first-value-activation.md)
- [Effort and questions](https://github.com/Clueless-Creations/Brigade/blob/12fd1bfd55744463c5d2bf0ac5f6fa9b6799eece/agents/skills/b2c-design-onboarding/references/workflow.experience.onboarding-system.onb-11-effort-question-audit.md)
- [Onboarding evidence and product contract](https://github.com/Clueless-Creations/Brigade/blob/12fd1bfd55744463c5d2bf0ac5f6fa9b6799eece/knowledge/experience/onboarding-conversion.md#evidence-contract)
- [Paywall disclosures](https://github.com/Clueless-Creations/Brigade/blob/12fd1bfd55744463c5d2bf0ac5f6fa9b6799eece/knowledge/money/paywall-pricing-and-experiments.md#2-pricing-and-disclosure-rules)

The onboarding document contains conflicting review-prompt timing instructions outside these selected sections.
Do not treat the full document as a single current platform rule. Identify conflicts before recommending review timing.
