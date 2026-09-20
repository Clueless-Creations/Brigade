# App Quality And Vitals

## Purpose

Use this guide to define and prove the mobile release-quality envelope.

## Required proof

Measure crashes, application-not-responding events, startup time, battery use, app size, offline behavior, and adaptive layouts. Test supported device sizes and operating-system versions. Set a release threshold and an owner for each measure. Record evidence from the build or the production provider.

Keep a third-party SDK inventory. Record the SDK owner, version, permissions, data use, privacy manifest, update route, and removal route. Include the SDK inventory in software-supply-chain review.

## Optional human-beta companion

When beta testing is in scope, the persona-balanced worksheet in `engineering/APP_QUALITY.md` remains optional planning guidance for complementary perspectives. It is not measured quality evidence.

Optional managed or self-managed human-beta recruitment is described in `knowledge/engineering/human-beta-recruitment.md`. Recruitment is selected only through product/recipe/binding mechanisms. It does not authorize distribution, substitute for release acceptance, or create a competing quality ledger. TaskGrind remains a candidate under an explicit qualification hold until authoritative access exists.

## Output

Write the results in `engineering/APP_QUALITY.md`.

## Source

- [Android vitals](https://developer.android.com/topic/performance/vitals/index.html)
