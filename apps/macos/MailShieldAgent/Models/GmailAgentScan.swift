import Foundation

struct GmailAgentScanResponse: Decodable, Equatable {
    let normalizedEmailSummary: NormalizedEmailSummary
    let agentSteps: [AgentStep]
    let checks: [AgentCheck]
    let finalRiskLevel: RiskLevel
    let finalRiskScore: Int
    let finalSummary: String?
    let keyReasons: [String]?
    let recommendedAction: String?
    let finalExplanation: String
    let limitations: [String]

    var displaySummary: String {
        if let finalSummary, !finalSummary.isEmpty {
            return finalSummary
        }

        return finalExplanation
    }

    var displayKeyReasons: [String] {
        keyReasons ?? []
    }

    var displayRecommendedAction: String? {
        recommendedAction
    }
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
