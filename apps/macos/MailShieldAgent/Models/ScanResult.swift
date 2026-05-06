import Foundation

struct ScanResultsResponse: Decodable {
    let items: [EmailScanResult]
}

struct EmailScanResult: Decodable, Identifiable, Equatable {
    let id: String
    let gmailMessageId: String
    let threadId: String
    let subject: String
    let sender: String
    let receivedAt: Date
    let scannedAt: Date
    let riskLevel: RiskLevel
    let riskScore: Int
    let summary: String
    let keyReasons: [String]?
    let recommendedAction: String?
    let agentSteps: [PersistedAgentStep]?
    let checks: [AgentCheck]
}

struct PersistedAgentStep: Decodable, Equatable {
    let id: String
    let agentName: String
    let status: String
    let summary: String
}

enum RiskLevel: String, Decodable {
    case low
    case medium
    case high
    case critical
}

struct AgentCheck: Decodable, Identifiable, Equatable {
    let id: String
    let agentName: String
    let title: String
    let status: AgentCheckStatus
    let reason: String
    let evidence: String?
}

enum AgentCheckStatus: String, Decodable {
    case passed
    case warning
    case failed
}
