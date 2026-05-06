import SwiftUI

enum BackendConnectionStatus: String {
    case notChecked = "Not checked"
    case checking = "Checking"
    case online = "Online"
    case offline = "Offline"
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

    private let backendClient: BackendClient

    var backendStatus: String {
        backendConnectionStatus.rawValue
    }

    var isCheckingBackend: Bool {
        backendConnectionStatus == .checking
    }

    var selectedScanResult: EmailScanResult? {
        scanResults.first { $0.id == selectedScanResultID }
    }

    var selectedScanPreviewItem: ScanPreviewItem? {
        scanPreviewItems.first { $0.id == selectedScanPreviewItemID }
    }

    init(backendClient: BackendClient = BackendClient()) {
        self.backendClient = backendClient
    }

    func checkBackendHealthIfNeeded() async {
        guard backendLastCheckedAt == nil else {
            return
        }

        await checkBackendHealth()
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
}
