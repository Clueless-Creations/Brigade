import SwiftUI
import UIKit
import XCTest

let brigadeLiveScreenTest = "brigade-live-screen-test"
let textScale2x = DynamicTypeSize.accessibilityExtraExtraExtraLarge
let portrait = CGSize(width: 390, height: 844)
let landscape = CGSize(width: 844, height: 390)
let noOverlap = "noOverlap"
let noOverflow = "noOverflow"
let reachableAction = "reachableAction"

final class BoundaryFakeController: CaptureControlling {
    private(set) var capturedCount = 0
    func capture() { capturedCount += 1 }
}

func fakedAtBoundary() -> CaptureControlling { BoundaryFakeController() }

@MainActor
func pumpLiveScreen(
    controller: CaptureControlling,
    title: String,
    size: CGSize,
    textScale: DynamicTypeSize,
    primaryInteraction: String
) -> UIHostingController<AnyView> {
    let root = AnyView(
        ShippingScreen(controller: controller, title: title)
            .environment(\.dynamicTypeSize, textScale)
            .frame(width: size.width, height: size.height)
    )
    let host = UIHostingController(rootView: root)
    host.view.bounds = CGRect(origin: .zero, size: size)
    host.view.setNeedsLayout()
    host.view.layoutIfNeeded()
    if primaryInteraction == "captureCount" {
        controller.capture()
        controller.capture()
    }
    if primaryInteraction == "drag" {
        XCTAssertNotNil(findView("screen-title", in: host.view), brigadeLiveScreenTest)
    }
    return host
}

func findView(_ identifier: String, in view: UIView) -> UIView? {
    if view.accessibilityIdentifier == identifier { return view }
    for child in view.subviews {
        if let found = findView(identifier, in: child) { return found }
    }
    return nil
}

@MainActor
func expectNoOverflow(_ host: UIHostingController<AnyView>) {
    let limit = host.view.bounds
    func walk(_ view: UIView) {
        let frame = view.convert(view.bounds, to: host.view)
        XCTAssertLessThanOrEqual(frame.maxX, limit.width + 1, noOverflow)
        XCTAssertLessThanOrEqual(frame.maxY, limit.height + 1, brigadeLiveScreenTest)
        for child in view.subviews { walk(child) }
    }
    walk(host.view)
}

@MainActor
func expectNoOverlap(_ host: UIHostingController<AnyView>) {
    let title = findView("screen-title", in: host.view)
    let action = findView("primary-action", in: host.view)
    XCTAssertNotNil(title, brigadeLiveScreenTest)
    XCTAssertNotNil(action, brigadeLiveScreenTest)
    guard let title, let action else { return }
    let titleFrame = title.convert(title.bounds, to: host.view)
    let actionFrame = action.convert(action.bounds, to: host.view)
    XCTAssertFalse(titleFrame.intersects(actionFrame), noOverlap)
}

@MainActor
func expectReachableAction(_ host: UIHostingController<AnyView>) {
    let action = findView("primary-action", in: host.view)
    XCTAssertNotNil(action, brigadeLiveScreenTest)
    guard let action else { return }
    let frame = action.convert(action.bounds, to: host.view)
    XCTAssertGreaterThan(frame.width, 0, brigadeLiveScreenTest)
    XCTAssertGreaterThan(frame.height, 0, brigadeLiveScreenTest)
    XCTAssertTrue(host.view.bounds.intersects(frame), reachableAction)
}

@MainActor
final class LiveScreenTests: XCTestCase {
    func testShippingScreen() {
        let controller = fakedAtBoundary()
        let longName = "North warehouse receiving door with the full lane name visible"
        let host = pumpLiveScreen(
            controller: controller,
            title: longName,
            size: portrait,
            textScale: textScale2x,
            primaryInteraction: "captureCount"
        )
        XCTAssertEqual(controller.capturedCount, 2, brigadeLiveScreenTest)
        expectNoOverflow(host)
        expectNoOverlap(host)
        expectReachableAction(host)

        let wide = pumpLiveScreen(
            controller: controller,
            title: longName,
            size: landscape,
            textScale: textScale2x,
            primaryInteraction: "drag"
        )
        expectNoOverflow(wide)
        expectNoOverlap(wide)
        expectReachableAction(wide)
    }
}
