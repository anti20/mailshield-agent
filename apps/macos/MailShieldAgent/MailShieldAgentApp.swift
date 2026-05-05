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
                .frame(minWidth: 760, minHeight: 520)
        }
        .defaultSize(width: 860, height: 640)
    }
}
