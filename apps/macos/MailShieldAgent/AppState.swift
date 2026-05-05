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

    let recentScansPlaceholder = "No scans yet"
    let agentChecksPlaceholder = "No agent checks yet"

    private let backendClient: BackendClient

    var backendStatus: String {
        backendConnectionStatus.rawValue
    }

    var isCheckingBackend: Bool {
        backendConnectionStatus == .checking
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
}
