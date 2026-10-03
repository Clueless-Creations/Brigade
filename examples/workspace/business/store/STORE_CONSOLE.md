# {{APP_NAME}} Store Console Packet

Status: scaffold

This packet is the copy-paste operator surface for App Store Connect and Google Play. Keep values aligned with `state/business-state.json`, `APP_STORE_LISTING.md`, `store/APPLE_APP_STORE_REQUIREMENTS.md`, `SCREENSHOTS.md`, `trust/PRIVACY.md`, `trust/TERMS.md`, `revenue/REVENUE_OPS.md`, and founder approval.

## Console Routes

| Surface                           | Click path                                                                                 | Values to record                                                                                                                                                     | Evidence                                                                                       | Approval                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------- |
| App Store Connect app creation    | ASC CLI/skill-pack route, or App Store Connect > Apps > plus button > New App when blocked | platform, app name, primary locale, bundle ID, SKU, user access, developer-name implications                                                                         | `store/APPLE_SIGNING.md`, `app-store-connect-cli.md` preflight, `asc-id-resolver` once created | founder approval before create            |
| App Store Connect app information | Apps > {{APP_NAME}} > App Information                                                      | name, subtitle, SKU, primary locale, bundle ID, category, privacy policy URL                                                                                         | `APP_STORE_LISTING.md`                                                                         | founder approval before save              |
| App Store Connect App Privacy     | Apps > {{APP_NAME}} > App Privacy                                                          | data types, linked status, tracking status, privacy purposes                                                                                                         | `app-privacy-questionnaire.html`                                                               | founder approval before publish           |
| Apple pre-ASC requirements        | local app bundle plus App Store Connect upload path                                        | `PrivacyInfo.xcprivacy`, required reason APIs, SDK manifests/signatures, Xcode privacy report, purpose strings, ATT, account deletion, review notes, upload warnings | `store/APPLE_APP_STORE_REQUIREMENTS.md`                                                        | founder approval before upload/submission |
| App Store Connect pricing         | Apps > {{APP_NAME}} > Pricing and Availability                                             | base territory, price, trial or intro offer, subscription groups                                                                                                     | `revenue/REVENUE_OPS.md`, RevenueCat catalog diff                                              | founder approval before price changes     |
| App Store Connect localization    | Apps > {{APP_NAME}} > Localizations                                                        | metadata, keywords, screenshots, App Preview, review notes                                                                                                           | `APP_STORE_LISTING.md`, `SCREENSHOTS.md`                                                       | founder approval before upload            |
| App Store Connect marketing       | Apps > {{APP_NAME}} > Product Page Optimization, Custom Product Pages, In-App Events       | custom product page plan, In-App Event plan, campaign measurement                                                                                                    | ASO research, App Analytics plan                                                               | founder approval before create            |
| Google Play main listing          | Play Console > {{APP_NAME}} > Store presence > Main store listing                          | package name, short description, full description, graphics, screenshots                                                                                             | Play listing document                                                                          | founder approval before save              |
| Google Play Data safety           | Play Console > {{APP_NAME}} > Policy > App content > Data safety                           | collected data, sharing, security practices, deletion route                                                                                                          | `trust/PRIVACY.md`, vendor inventory                                                           | founder approval before submit            |

## Store Asset Rules

- App Store Connect work should route through the ASC CLI/skill pack first when credentials are configured or the founder asked for ASC work. App creation, `asc-id-resolver`, metadata, screenshots, TestFlight, products, subscriptions, review status, and `asc-revenuecat-catalog-sync` are CLI/skill-pack candidates; blocked auth, 2FA, missing agreements, or unapproved sticky fields are blockers, not "cannot do it" answers.
- Screenshots use `SCREENSHOTS.md` as the canonical packet; raw in-app simulator, MobAI, or device captures are source inputs, while final iPhone, iPad, and Google Play assets need copy overlay, production composition, validation, and visual QA.
- Use ParthJadhav/app-store-screenshots when a reusable local screenshot editor/export board is useful for iPhone/iPad/Play decks, locale variants, app icon placement, and final PNG export from real UI plus design-system copy.
- Higgsfield can support app icons, backgrounds, CPP media, In-App Event media, and thumbnails when tied to `DESIGN.md` and `11_STAR_EXPERIENCE.md`.
- App Icon output records `app-icon/app-icon-1024.png`, thumbnail contrast, no alpha, no rounded corners, and category differentiation.
- App Preview and Google Play promo video output use real in-app footage, Remotion or owned media, captions, poster frame review, and current platform policy checks.

## Review Packet

- Review notes describe new features and product changes, plus any account setup, entitlement, restoration, deletion, or privacy-sensitive instructions needed to test them.
- App Store Connect upload readiness is blocked until `store/APPLE_APP_STORE_REQUIREMENTS.md` accounts for privacy manifests, required reason APIs, SDK manifest/signature status, App Privacy labels, purpose strings, ATT, account deletion, review notes, and archive/upload warnings.
- If the app name is already in use, stop for founder approval before using any fallback name.

### App Review Information

Follow [Apple's field definitions](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information) and [Guidelines 2.1/2.3.1](https://developer.apple.com/app-store/review/guidelines/). Provide current review contact details and access to all reviewable features. Notes must describe new features, functionality, and product changes specifically, plus any settings or instructions needed to test them.

Sign-in required: unknown — inspect the shipped reviewable features, then record yes or no. Unknown is an unresolved Brigade packet state, not an Apple checkbox value.
Review access: pending — when sign-in is required, reference the secure route for a working, non-expiring demo account covering all account types and login-gated features. A built-in demo mode in place of an account requires Apple's prior approval under 2.1(a). Keep credentials out of this packet.

An app without login does not need demo credentials. That does not establish that all data stays on-device or that Notes are unnecessary. Describe test devices, external services, regional behavior, or regulated material when they affect review/testing or Apple requests them; they are not a universal Notes checklist. Do not predict automatic rejection or invent an automated no-login flag.

Record reusable, non-secret Notes content in `APP_STORE_LISTING.md`. Read existing review details and reuse verified information before preparing an authorized update through the supported ASC review-details route. Refresh the applicable command's help for current flags; preserve founder approval for mutations and submission.

## Age Rating Questionnaire

Apple requires these answers for every new submission and update from September 2026. Do not infer false from a blank field. Run `asc age-rating audit` on the exact app before review submission. `asc age-rating edit` needs an exact mutation envelope and product evidence. See `knowledge/store/age-rating-questionnaire.md`.

| Field                    | Product evidence | Answer (`true` or `false`) | Escalation |
| ------------------------ | ---------------- | -------------------------- | ---------- |
| socialMedia              | Record           | Record                     | Record     |
| messagingAndChat         | Record           | Record                     | Record     |
| socialMediaAgeRestricted | Record           | Record                     | Record     |
| ageAssurance             | Record           | Record                     | Record     |
| userGeneratedContent     | Record           | Record                     | Record     |

- Founder approval is required before App Store submission, Google Play submission, pricing edits, subscription edits, custom product page creation, In-App Event creation, paid Higgsfield generation, or public asset upload.
