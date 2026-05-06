import Foundation

struct GmailAgentScanResponse: Decodable, Equatable {
    let normalizedEmailSummary: NormalizedEmailSummary
    let agentSteps: [AgentStep]
    let checks: [AgentCheck]
    let finalRiskLevel: RiskLevel
    let finalRiskScore: Int
    let finalExplanation: String
    let limitations: [String]
}

struct NormalizedEmailSummary: Decodable, Equatable {
    let id: String
    let gmailMessageId: String?
    let threadId: String?
    let subject: String
    let sender: String
    let replyTo: String?
    let receivedAt: Date
    let linkCount: Int
    let attachmentCount: Int
    let hasHtml: Bool
    let hasText: Bool
}

struct AgentStep: Decodable, Identifiable, Equatable {
    let id: String
    let agentName: String
    let status: AgentStepStatus
    let summary: String
}

enum AgentStepStatus: String, Decodable {
    case completed
    case limited
}
