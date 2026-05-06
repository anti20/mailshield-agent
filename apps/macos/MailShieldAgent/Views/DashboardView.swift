import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        ScrollView {
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

                GmailConnectionCardView(
                    oauthConfigurationStatus: appState.gmailOAuthConfigurationStatus.rawValue,
                    oauthConfigurationMessage: appState.gmailOAuthConfigurationMessage,
                    isOAuthConfigured: appState.isGmailOAuthConfigured,
                    status: appState.gmailConnectionStatus.rawValue,
                    connectedEmailAddress: appState.connectedGmailEmailAddress,
                    statusMessage: appState.gmailStatusMessage,
                    isLoading: appState.isLoadingGmailConnection,
                    refreshAction: {
                        Task {
                            await appState.refreshGmailConnection()
                        }
                    },
                    openLoginAction: {
                        appState.openGmailLogin()
                    }
                )

                VStack(alignment: .leading, spacing: 12) {
                    Text("Real Gmail Messages")
                        .font(.title3)
                        .fontWeight(.semibold)

                    HStack(alignment: .top, spacing: 16) {
                        GmailMessageListView(
                            messages: appState.recentGmailMessages,
                            selectedMessageID: $appState.selectedGmailMessageID,
                            isLoading: appState.isLoadingRecentGmailMessages,
                            errorMessage: appState.recentGmailMessagesErrorMessage,
                            loadAction: {
                                Task {
                                    await appState.loadRecentGmailMessages()
                                }
                            }
                        )
                        .frame(width: 300)

                        GmailMessageScanView(
                            selectedMessage: appState.selectedGmailMessage,
                            scanResult: appState.selectedGmailMessageScan,
                            isLoading: appState.isLoadingSelectedGmailMessageScan,
                            errorMessage: appState.selectedGmailMessageScanErrorMessage,
                            agentScanResult: appState.selectedGmailMessageAgentScan,
                            isLoadingAgentScan: appState.isLoadingSelectedGmailMessageAgentScan,
                            agentScanErrorMessage: appState.selectedGmailMessageAgentScanErrorMessage,
                            runScanAction: {
                                Task {
                                    await appState.runStaticScanForSelectedGmailMessage()
                                }
                            },
                            runAgentScanAction: {
                                Task {
                                    await appState.runAgentScanForSelectedGmailMessage()
                                }
                            }
                        )
                    }
                }

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

                VStack(alignment: .leading, spacing: 12) {
                    Text("Static Threat Agent Preview")
                        .font(.title3)
                        .fontWeight(.semibold)

                    HStack(alignment: .top, spacing: 16) {
                        StaticPreviewListView(
                            previewItems: appState.scanPreviewItems,
                            selectedPreviewItemID: $appState.selectedScanPreviewItemID,
                            isLoading: appState.isLoadingScanPreview,
                            errorMessage: appState.scanPreviewErrorMessage,
                            runAction: {
                                Task {
                                    await appState.runStaticPreview()
                                }
                            }
                        )
                        .frame(width: 300)

                        StaticPreviewDetailView(previewItem: appState.selectedScanPreviewItem)
                    }
                }
            }
            .padding(24)
            .frame(maxWidth: .infinity, alignment: .topLeading)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Color(nsColor: .windowBackgroundColor))
        .task {
            await appState.checkBackendHealthIfNeeded()
            await appState.refreshGmailConnection()
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
