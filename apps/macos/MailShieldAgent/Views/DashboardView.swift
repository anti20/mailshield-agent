import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            header

            StatusCardView(
                status: appState.backendStatus,
                serviceName: appState.backendServiceName,
                lastCheckedAt: appState.backendLastCheckedAt,
                errorMessage: appState.backendErrorMessage,
                isChecking: appState.isCheckingBackend,
                checkAction: {
                    Task {
                        await appState.checkBackendHealth()
                    }
                }
            )

            HStack(alignment: .top, spacing: 16) {
                EmailListView(
                    scanResults: appState.scanResults,
                    selectedScanResultID: $appState.selectedScanResultID,
                    isLoading: appState.isLoadingScanResults,
                    errorMessage: appState.scanResultsErrorMessage,
                    loadAction: {
                        Task {
                            await appState.loadMockScans()
                        }
                    }
                )
                .frame(width: 260)

                EmailDetailView(scanResult: appState.selectedScanResult)
            }
        }
        .padding(24)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Color(nsColor: .windowBackgroundColor))
        .task {
            await appState.checkBackendHealthIfNeeded()
        }
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
