import AppKit
import SwiftUI

enum BackendConnectionStatus: String {
    case notChecked = "Not checked"
    case checking = "Checking"
    case online = "Online"
    case offline = "Offline"
}

enum GmailConnectionStatus: String {
    case checking = "Checking"
    case connected = "Connected"
    case notConnected = "Not connected"
}

enum GmailOAuthConfigurationStatus: String {
    case checking = "Checking"
    case configured = "Configured"
    case notConfigured = "Not configured"
}

@MainActor
final class AppState: ObservableObject {
    @Published private(set) var backendConnectionStatus: BackendConnectionStatus = .notChecked
    @Published private(set) var backendServiceName: String?
    @Published private(set) var backendLastCheckedAt: Date?
    @Published private(set) var backendErrorMessage: String?

    @Published private(set) var scanResults: [EmailScanResult] = []
    @Published var selectedScanResultID: EmailScanResult.ID?
    @Published private(set) var isLoadingScanResults = false
    @Published private(set) var scanResultsErrorMessage: String?

    @Published private(set) var scanPreviewItems: [ScanPreviewItem] = []
    @Published var selectedScanPreviewItemID: ScanPreviewItem.ID?
    @Published private(set) var isLoadingScanPreview = false
    @Published private(set) var scanPreviewErrorMessage: String?

    @Published private(set) var gmailConnectionStatus: GmailConnectionStatus = .checking
    @Published private(set) var connectedGmailEmailAddress: String?
    @Published private(set) var gmailStatusMessage: String?
    @Published private(set) var isLoadingGmailConnection = false
    @Published private(set) var gmailOAuthConfigurationStatus: GmailOAuthConfigurationStatus = .checking
    @Published private(set) var gmailOAuthConfigurationMessage: String?
    @Published private(set) var recentGmailMessages: [GmailMessageMetadata] = []
    @Published var selectedGmailMessageID: GmailMessageMetadata.ID? {
        didSet {
            if oldValue != selectedGmailMessageID {
                selectedGmailMessageScan = nil
                selectedGmailMessageScanErrorMessage = nil
            }
        }
    }
    @Published private(set) var isLoadingRecentGmailMessages = false
    @Published private(set) var recentGmailMessagesErrorMessage: String?
    @Published private(set) var selectedGmailMessageScan: GmailStaticScanResponse?
    @Published private(set) var isLoadingSelectedGmailMessageScan = false
    @Published private(set) var selectedGmailMessageScanErrorMessage: String?

    private let backendClient: BackendClient

    var backendStatus: String {
        backendConnectionStatus.rawValue
    }

    var isCheckingBackend: Bool {
        backendConnectionStatus == .checking
    }

    var isGmailConnected: Bool {
        gmailConnectionStatus == .connected
    }

    var isGmailOAuthConfigured: Bool {
        gmailOAuthConfigurationStatus == .configured
    }

    var selectedScanResult: EmailScanResult? {
        scanResults.first { $0.id == selectedScanResultID }
    }

    var selectedScanPreviewItem: ScanPreviewItem? {
        scanPreviewItems.first { $0.id == selectedScanPreviewItemID }
    }

    var selectedGmailMessage: GmailMessageMetadata? {
        recentGmailMessages.first { $0.id == selectedGmailMessageID }
    }

    init(backendClient: BackendClient = BackendClient()) {
        self.backendClient = backendClient
    }

    func checkBackendHealthIfNeeded() async {
        guard backendLastCheckedAt == nil else {
            return
        }

        await checkBackendHealth()
        await refreshGmailConnection()
    }

    func checkBackendHealth() async {
        backendConnectionStatus = .checking
        backendErrorMessage = nil

        do {
            let health = try await backendClient.fetchHealth()
            backendLastCheckedAt = Date()
            backendServiceName = health.service

            if health.status == "ok" {
                backendConnectionStatus = .online
            } else {
                backendConnectionStatus = .offline
                backendErrorMessage = "Unexpected backend status: \(health.status)"
            }
        } catch {
            backendLastCheckedAt = Date()
            backendServiceName = nil
            backendConnectionStatus = .offline
            backendErrorMessage = error.localizedDescription
        }
    }

    func loadMockScans() async {
        isLoadingScanResults = true
        scanResultsErrorMessage = nil

        do {
            let response = try await backendClient.fetchScanResults()
            scanResults = response.items

            if selectedScanResultID == nil || selectedScanResult == nil {
                selectedScanResultID = response.items.first?.id
            }
        } catch {
            scanResultsErrorMessage = error.localizedDescription
        }

        isLoadingScanResults = false
    }

    func runStaticPreview() async {
        isLoadingScanPreview = true
        scanPreviewErrorMessage = nil

        do {
            let response = try await backendClient.fetchScanPreview()
            scanPreviewItems = response.items

            if selectedScanPreviewItemID == nil || selectedScanPreviewItem == nil {
                selectedScanPreviewItemID = response.items.first?.id
            }
        } catch {
            scanPreviewErrorMessage = error.localizedDescription
        }

        isLoadingScanPreview = false
    }

    func refreshGmailConnection() async {
        isLoadingGmailConnection = true
        gmailStatusMessage = nil
        gmailOAuthConfigurationStatus = .checking
        gmailOAuthConfigurationMessage = nil

        do {
            let configStatus = try await backendClient.fetchGmailConfigStatus()

            if configStatus.configured {
                gmailOAuthConfigurationStatus = .configured
            } else {
                gmailOAuthConfigurationStatus = .notConfigured
                gmailConnectionStatus = .notConnected
                connectedGmailEmailAddress = nil
                gmailStatusMessage = "No Gmail account is connected yet."

                let missing = configStatus.missing.joined(separator: ", ")
                gmailOAuthConfigurationMessage =
                    "Google OAuth credentials are missing (\(missing)). Add them to apps/core/.env."

                isLoadingGmailConnection = false
                return
            }

            let status = try await backendClient.fetchGmailAuthStatus()

            guard status.connected else {
                gmailConnectionStatus = .notConnected
                connectedGmailEmailAddress = nil
                gmailStatusMessage = "No Gmail account is connected yet."
                isLoadingGmailConnection = false
                return
            }

            gmailConnectionStatus = .connected
            let profile = try await backendClient.fetchGmailProfile()
            connectedGmailEmailAddress = profile.emailAddress

            if profile.emailAddress == nil || profile.emailAddress?.isEmpty == true {
                gmailStatusMessage = "Connected account email is not available."
            } else {
                gmailStatusMessage = nil
            }
        } catch {
            gmailOAuthConfigurationStatus = .notConfigured
            gmailOAuthConfigurationMessage = "Unable to verify Gmail OAuth configuration."
            gmailConnectionStatus = .notConnected
            connectedGmailEmailAddress = nil
            gmailStatusMessage = error.localizedDescription
        }

        isLoadingGmailConnection = false
    }

    func openGmailLogin() {
        guard isGmailOAuthConfigured else {
            return
        }

        NSWorkspace.shared.open(backendClient.gmailOAuthStartURL)
    }

    func loadRecentGmailMessages(limit: Int = 10) async {
        guard isGmailOAuthConfigured else {
            recentGmailMessagesErrorMessage = "Configure Gmail OAuth in apps/core/.env first."
            return
        }

        isLoadingRecentGmailMessages = true
        recentGmailMessagesErrorMessage = nil

        do {
            let response = try await backendClient.fetchRecentGmailMessages(limit: limit)
            recentGmailMessages = response.items

            if selectedGmailMessageID == nil || selectedGmailMessage == nil {
                selectedGmailMessageID = response.items.first?.id
            }

            selectedGmailMessageScan = nil
            selectedGmailMessageScanErrorMessage = nil
        } catch {
            recentGmailMessagesErrorMessage = error.localizedDescription
        }

        isLoadingRecentGmailMessages = false
    }

    func runStaticScanForSelectedGmailMessage() async {
        guard let selectedGmailMessage else {
            selectedGmailMessageScanErrorMessage = "Select a Gmail message first."
            return
        }

        isLoadingSelectedGmailMessageScan = true
        selectedGmailMessageScanErrorMessage = nil

        do {
            selectedGmailMessageScan = try await backendClient.fetchGmailStaticScan(
                messageId: selectedGmailMessage.id
            )
        } catch {
            selectedGmailMessageScanErrorMessage = error.localizedDescription
        }

        isLoadingSelectedGmailMessageScan = false
    }
}
