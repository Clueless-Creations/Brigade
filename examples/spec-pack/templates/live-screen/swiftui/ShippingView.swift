import SwiftUI

protocol CaptureControlling {
    func capture()
    var capturedCount: Int { get }
}

struct ShippingScreen: View {
    let controller: any CaptureControlling
    let title: String

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            ScrollView {
                Text(title)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .accessibilityIdentifier("screen-title")
            }
            Button("Capture") {
                controller.capture()
            }
            .accessibilityIdentifier("primary-action")
        }
    }
}
