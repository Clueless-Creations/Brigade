---
name: ship-ios-testflight
description: Get an iOS app from "it builds" to an uploaded TestFlight build. Finds App Review and signing blockers, explains each fix, and gives the exact next steps. Read-only; it never uploads, signs or submits for you.
---
# Ship my iOS app to TestFlight

1. Load the release workflows with `b2c_workflow`:
   `workflow.store.apple-signing-and-release-readiness`, then `workflow.store.apple-testflight-standing-envelope`.
2. Inspect the user's project locally (Info.plist, PrivacyInfo.xcprivacy, entitlements, AppIcon, version/build numbers, export compliance).
3. For each gap, cite the rule with `b2c_knowledge_search` / `b2c_knowledge_get` and propose the fix. Never invent a guideline; if no reference matches, say so.
4. If the user pastes an App Review rejection, map it to the guideline and the smallest fix.
5. Finish with a checklist: blockers (must fix), warnings, then the archive -> upload -> TestFlight steps.
Rules: propose only. Do not run signing, upload or submission commands, and never ask for Apple credentials.
