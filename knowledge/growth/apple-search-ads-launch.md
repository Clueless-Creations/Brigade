# Apple Search Ads Launch

Use this before a first Apple Search Ads test that bids on a same-niche competitor and on category terms.

This recipe sits inside [`paid-user-acquisition.md`](paid-user-acquisition.md). It does not replace the fit gate, the MMP-before-spend rule, the blended report, or the founder spend gate. Load [`localization-market-research.md`](../research/localization-market-research.md) before choosing storefronts. Load [`paid-tool-routing.md`](../operations/paid-tool-routing.md) before any ad-account action that can spend.

## Contents

- When it fits
- When it does not fit
- Campaign structure
- Bid ramp
- Metrics
- Learning ledger
- Spend, policy, and creative limits
- Outputs
- Common failure modes

## Source

This recipe reauthors one indie founder's self-reported setup. Label that account self-reported. It is one anecdote. Leave its spend, CPT, CPA, install, and revenue figures out of `PAID_UA.md`. They are not targets.

Apple's current ad rules outrank the anecdote. Re-read the live pages below before enabling delivery. A date in this file is the day those pages were read, not a promise that Apple still says the same thing.

Read on 2026-10-08:

- [Apple Advertising Policies](https://ads.apple.com/policies) (page date February 26, 2025)
- [Structure campaigns](https://ads.apple.com/app-store/help/campaigns/0056-structure-campaigns)
- [Campaign structure best practices](https://ads.apple.com/app-store/best-practices/campaign-structure)
- [Modify audience settings](https://ads.apple.com/app-store/help/ad-groups/0021-modify-audience-settings)

## When it fits

Use this shape when all of these hold:

- The app is in the same niche as a larger app.
- That larger app already markets on socials, so people search the category and that app's name.
- The product page can convert a searcher who already wants this kind of app: screenshots, ratings, and the paywall agree with the listing.
- `LOCALIZATION_MARKET_RESEARCH.md` has storefront tiers with demand evidence.
- RevenueCat (or the approved subscription source) and product analytics can show trial start and revenue, not installs alone.
- The founder has approved a test and a daily cap. The campaign stays a PAUSED draft until that approval.

## When it does not fit

Leave this recipe and stay on `paid-user-acquisition.md` when:

- The product page, paywall, privacy disclosure, or purchase path is not ready for paid traffic.
- The other app is in a different niche, so its name is not a search for this job.
- The job is keyword mining. Apple's discovery campaign uses broad match and Search Match. This recipe turns Search Match off.
- The product is iPad-first. This recipe limits the ad group to iPhone.
- The account is on a mode that cannot choose keywords. Maximize Conversions creates an ad group with Search Match on. This recipe needs Manage Bids.
- No daily cap is approved. Preparing the draft can continue. Enabling delivery cannot.

## Campaign structure

Prepare one Manage Bids search-results test inside `PAID_UA.md`. Create it paused.

- Exact-match competitor keywords: the other app's name and the close variants a searcher would type. One competitor theme per ad group so its CPT stays readable.
- Exact-match category keywords: non-brand terms for what the app does, taken from the ASO keyword evidence and the localization matrix.
- Search Match off on these ad groups.
- Customer type: New users.
- Device: iPhone. Apple's audience help says an iPhone choice can also serve iPod touch. Record that limit in the packet.
- Narrowing customer type or device excludes people with Personalized Ads turned off. Record the smaller reach in the packet before judging a quiet first day.

Territory tiers follow the localization priority tiers. Bids scale with the tier. A higher-demand tier may open at a higher max CPT than a thinner tier. Both stay inside the approved daily cap. Give each tier its own campaign, or its own ad group with its own cap, so one expensive storefront cannot spend the whole day. Skip a storefront that has no demand row. Use the in-language category terms for that storefront.

Apple's structure help still recommends a separate discovery campaign with Search Match on. That campaign is out of scope here. Add it later only through `paid-user-acquisition.md`, with its own cap and founder approval.

## Bid ramp

Start low inside the tier and inside the daily cap. Write the starting max CPT in `PAID_UA.md` before the draft exists.

The self-reported account waited because Apple Ads reporting lags. After the first delivery, leave bids alone for 1 to 2 days. Read spend, taps, installs, and trial starts only after that window. Raise the max CPT in a small step, still under the daily cap, and only with a new founder approval when the step changes the cap or turns delivery on.

A quiet day is a reason to check storefront, app availability, and the Personalized Ads reach limit. It is a reason to wait out the lag. Jumping to a high bid to force impressions is outside this recipe.

The 48-hour kill window in `paid-user-acquisition.md` still applies once spend is live. Pause when CPA or payback breaks the recorded threshold.

## Metrics

Track these for the test, in Apple Ads and in the blended row of `growth/paid-ua-report.csv`:

- spend
- installs
- CPT (cost per tap)
- CPA (cost per trial or per the recorded target event)
- trial start
- revenue per install
- payback against the window in `revenue/REVENUE_OPS.md`

Installs alone do not pass the test. Compare the paid row with the organic baseline in `paid-user-acquisition.md`. Ad-platform counts can disagree with RevenueCat, App Store Connect, and PostHog. Use the attribution tolerance already recorded in `PAID_UA.md`.

## Learning ledger

When the founder opts the app into the portfolio learning ledger (CLU-111), write this test as one channel outcome on that ledger's acquisition-channel record.

Fields:

- channel: `apple-search-ads`
- fit: ran or deferred, with the reason
- approved daily cap
- spend, installs, CPT, CPA, trial starts, revenue per install, payback
- a short note on why the test worked or failed

The public repository keeps this field list. The app's numbers stay in the private portfolio record. Do not commit live spend, revenue, account ids, or customer data here.

## Spend, policy, and creative limits

Any ad spend is a paid action. It needs the founder's explicit approval and a daily cap before delivery. That includes the first unpause, a budget edit, and a bid that would change the cap. The gate is the Paid Tool Decision Protocol and Founder Gates in [`paid-tool-routing.md`](../operations/paid-tool-routing.md), plus Founder-Only Gates in [`paid-user-acquisition.md`](paid-user-acquisition.md). An agent may prepare the paused draft. An agent must not enable delivery.

Re-read [Apple Advertising Policies](https://ads.apple.com/policies) before relying on them. Policy 1.4 (read 2026-10-08) says ad content, and the App Store content used to generate the ad, may not violate another party's intellectual property. Logos, graphics, and artwork need a license.

Bidding on a competitor's name is a keyword choice. Ad copy and custom product pages use this app's own claims, UI, and screenshots. Describe that page as modelled on the category. Competitor trademarks, competitor creative, and competitor screenshots stay out of the ad and the product page.

A custom product page is a design surface. Load [`surfaces-b2c.md`](../design/surfaces-b2c.md) and [`design-room.md`](../design/design-room.md) before spend, as `paid-user-acquisition.md` already requires.

## Outputs

- `PAID_UA.md`: fit decision, paused Manage Bids draft, exact-match lists, Search Match off, new users, iPhone, territory tiers and starting bids, daily cap, bid-ramp log, and the metric thresholds
- `growth/paid-ua-report.csv` rows for spend through payback
- a CLU-111 channel outcome only after the founder opts in
- `state/LAUNCH_TRACE.md` row from the localization tier and the listing to this campaign

## Common failure modes

- Enabling delivery, or raising the cap, without a recorded founder approval.
- Leaving Search Match on, or using Maximize Conversions, and then reading the result as this recipe.
- One campaign for every storefront, so a single country spends the daily cap.
- Raising bids during the 1-to-2-day reporting lag, or jumping to a high bid after a quiet day.
- Putting a competitor name, logo, or screenshot into ad copy or a custom product page.
- Copying the self-reported anecdote's figures in as CPA or payback targets.
- Scoring the test on installs while trial start, revenue per install, and payback are blank.
- Writing the app's live numbers into this public repository.
