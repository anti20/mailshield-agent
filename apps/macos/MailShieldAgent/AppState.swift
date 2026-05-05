import SwiftUI

@MainActor
final class AppState: ObservableObject {
    @Published var backendStatus = "Not connected"
    let recentScansPlaceholder = "No scans yet"
    let agentChecksPlaceholder = "No agent checks yet"
}
