# Privacy manifest

Every Apple target that ships code needs its own `PrivacyInfo.xcprivacy`. App Store Connect sends ITMS-91053 when a required-reason API has no declared reason.

| Target | File |
| --- | --- |
| App | `App/PrivacyInfo.xcprivacy` |
| Widget or other extension | `Widget/PrivacyInfo.xcprivacy` |

1. Copy `App/PrivacyInfo.xcprivacy` into the app target folder. Copy `Widget/PrivacyInfo.xcprivacy` into each extension target folder.
2. Add each file to the resources of its own target in Xcode.
3. Keep `CA92.1` when the target reads or writes its own `UserDefaults`. Keep `1C8F.1` when the target uses `UserDefaults(suiteName:)` for the App Group. Remove a reason that the target does not use.
4. Make `NSPrivacyCollectedDataTypes` in the app manifest match `privacy.inventory` in `spec.yaml` and the App Privacy answers. The template matches the example app: product interaction (PostHog), purchase history (RevenueCat), and crash data (Sentry).
5. Run `plutil -lint` on each file.

`scripts/check-privacy-manifest.sh` reads each tracked Swift, Objective-C, and C source file. A file belongs to the nearest `PrivacyInfo.xcprivacy` in its folder or a parent folder. The check fails when the file uses a required-reason API and that manifest has no reason for the category. It covers `UserDefaults`, file timestamps, system boot time, disk space, and active keyboards. The script does not run Xcode. It does not check third-party SDK manifests. Record those in `store/APPLE_APP_STORE_REQUIREMENTS.md`.
