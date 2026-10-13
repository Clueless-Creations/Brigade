# Live-screen harness

Copy the flavour that matches the app stack into the screen pull request.

| Stack | View | Test |
| --- | --- | --- |
| Flutter | `flutter/shipping_view.dart` | `flutter/live_screen_test.dart` |
| SwiftUI | `swiftui/ShippingView.swift` | `swiftui/LiveScreenTests.swift` |

Rename `ShippingScreen` to the shipping widget or view. Keep that type declaration on one line. Point the test import at the shipping file. Pass the screen's real controller, or a fake of that same type, into `fakedAtBoundary`. Do not construct a different fixture widget.

The test pumps the shipping type. It runs the primary interaction (`captureCount`, `drag`, or the screen's own action). It uses a long name, `textScale2x`, and `landscape`. It calls `expectNoOverlap`, `expectNoOverflow`, and `expectReachableAction`. Those assertions carry the tokens `noOverlap`, `noOverflow`, and `reachableAction`.

Keep these tokens in the test file. `scripts/check-live-screen-test.sh` reads them. The script does not run the test. A comment-only file is not a substitute for the assertions above.

`scripts/check-mock-state-branches.sh` fails when a production view branches on a fixture property. A name-length threshold such as `name.length > 36`, and a gate-only flag such as `gateOnly`, are fixture properties. Put a max-length rule in a non-view validator. Do not hide or swap the shipping view because a name is long.

Other stacks use the same tokens in their widget test. The diff must include that test when the shipping view changes.
