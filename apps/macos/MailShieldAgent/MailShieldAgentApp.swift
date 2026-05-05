import SwiftUI

@main
struct MailShieldAgentApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        MenuBarExtra {
            MenuBarView()
                .environmentObject(appState)
        } label: {
            Label("MailShield Agent", systemImage: "shield.lefthalf.filled")
        }
        .menuBarExtraStyle(.menu)

        Window("MailShield Agent", id: "dashboard") {
            DashboardView()
                .environmentObject(appState)
                .frame(minWidth: 480, minHeight: 440)
        }
        .defaultSize(width: 560, height: 520)
    }
}
