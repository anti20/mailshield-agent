import Foundation

struct GmailRecentMessagesResponse: Decodable {
    let items: [GmailMessageMetadata]
}

struct GmailMessageMetadata: Decodable, Identifiable, Equatable {
    let id: String
    let threadId: String
    let subject: String
    let sender: String
    let snippet: String
    let receivedAt: Date
    let labelIds: [String]
    let hasAttachments: Bool
}

struct GmailStaticScanResponse: Decodable, Equatable {
    let email: NormalizedEmail
    let checks: [AgentCheck]

    var passedCheckCount: Int {
        checks.filter { $0.status == .passed }.count
    }

    var warningCheckCount: Int {
        checks.filter { $0.status == .warning }.count
    }

    var failedCheckCount: Int {
        checks.filter { $0.status == .failed }.count
    }
}
