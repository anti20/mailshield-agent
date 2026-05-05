import AppKit
import SwiftUI

struct MenuBarView: View {
    @Environment(\.openWindow) private var openWindow
    @EnvironmentObject private var appState: AppState

    var body: some View {
        Button("Open Dashboard") {
            openWindow(id: "dashboard")
        }

        Divider()

        Text("Backend status: \(appState.backendStatus)")

        Divider()

        Button("Quit MailShield Agent") {
            NSApplication.shared.terminate(nil)
        }
        .keyboardShortcut("q")
    }
}
