import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            header

            StatusCardView(status: appState.backendStatus)

            PlaceholderSectionView(
                title: "Recent scans",
                message: appState.recentScansPlaceholder
            )

            PlaceholderSectionView(
                title: "Agent checks",
                message: appState.agentChecksPlaceholder
            )
        }
        .padding(24)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Color(nsColor: .windowBackgroundColor))
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("MailShield Agent")
                .font(.largeTitle)
                .fontWeight(.semibold)

            Text("Gmail threat monitoring for macOS")
                .font(.headline)
                .foregroundStyle(.secondary)
        }
    }
}
