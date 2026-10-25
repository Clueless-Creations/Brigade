import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

import 'shipping_view.dart';

const brigadeLiveScreenTest = 'brigade-live-screen-test';

class BoundaryFakeController implements CaptureController {
  int capturedCount = 0;

  @override
  Future<void> capture() async {
    capturedCount += 1;
  }
}

CaptureController fakedAtBoundary() => BoundaryFakeController();

const textScale2x = 2.0;
const portrait = Size(390, 844);
const landscape = Size(844, 390);
const noOverlap = 'noOverlap';
const noOverflow = 'noOverflow';
const reachableAction = 'reachableAction';

Future<void> pumpLiveScreen(
  WidgetTester tester, {
  required CaptureController controller,
  required String title,
  required Size size,
  required double textScale,
  required String primaryInteraction,
}) async {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
  await tester.pumpWidget(
    MediaQuery(
      data: MediaQueryData(size: size, textScaler: TextScaler.linear(textScale)),
      child: Directionality(
        textDirection: TextDirection.ltr,
        child: SizedBox(
          width: size.width,
          height: size.height,
          child: ShippingScreen(controller: controller, title: title),
        ),
      ),
    ),
  );
  if (primaryInteraction == 'captureCount') {
    await tester.tap(find.byKey(const Key('primary-action')));
    await tester.pump();
    await tester.tap(find.byKey(const Key('primary-action')));
    await tester.pump();
  }
  if (primaryInteraction == 'drag') {
    await tester.drag(find.byKey(const Key('screen-title')), const Offset(0, -80));
    await tester.pump();
  }
}

void expectNoOverflow(WidgetTester tester) {
  expect(tester.takeException(), isNull, reason: noOverflow);
}

void expectNoOverlap(WidgetTester tester) {
  final title = tester.getRect(find.byKey(const Key('screen-title')));
  final action = tester.getRect(find.byKey(const Key('primary-action')));
  expect(title.overlaps(action), isFalse, reason: noOverlap);
}

void expectReachableAction(WidgetTester tester) {
  final action = find.byKey(const Key('primary-action'));
  expect(action, findsOneWidget);
  final rect = tester.getRect(action);
  final size = tester.view.physicalSize / tester.view.devicePixelRatio;
  expect(rect.width, greaterThan(0));
  expect(rect.height, greaterThan(0));
  expect(rect.right, lessThanOrEqualTo(size.width));
  expect(rect.bottom, lessThanOrEqualTo(size.height), reason: reachableAction);
}

void main() {
  testWidgets(brigadeLiveScreenTest, (tester) async {
    final controller = fakedAtBoundary();
    const longName = 'North warehouse receiving door with the full lane name visible';
    await pumpLiveScreen(
      tester,
      controller: controller,
      title: longName,
      size: portrait,
      textScale: textScale2x,
      primaryInteraction: 'captureCount',
    );
    expect(controller.capturedCount, 2);
    expectNoOverflow(tester);
    expectNoOverlap(tester);
    expectReachableAction(tester);

    await pumpLiveScreen(
      tester,
      controller: controller,
      title: longName,
      size: landscape,
      textScale: textScale2x,
      primaryInteraction: 'drag',
    );
    expectNoOverflow(tester);
    expectNoOverlap(tester);
    expectReachableAction(tester);
  });
}
