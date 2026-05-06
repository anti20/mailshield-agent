import Foundation

struct ScanPreviewResponse: Decodable {
    let items: [ScanPreviewItem]
}

struct ScanPreviewItem: Decodable, Identifiable, Equatable {
    let email: NormalizedEmail
    let checks: [AgentCheck]

    var id: String {
        email.id
    }

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

struct NormalizedEmail: Decodable, Identifiable, Equatable {
    let id: String
    let gmailMessageId: String?
    let threadId: String?
    let subject: String
    let sender: String
    let replyTo: String?
    let bodyText: String?
    let bodyHtml: String?
    let links: [EmailLink]
    let attachments: [EmailAttachment]
    let receivedAt: Date
}

struct EmailLink: Decodable, Identifiable, Equatable {
    let text: String?
    let url: String

    var id: String {
        "\(text ?? "")-\(url)"
    }
}

struct EmailAttachment: Decodable, Identifiable, Equatable {
    let filename: String
    let mimeType: String?
    let sizeBytes: Int?

    var id: String {
        filename
    }
}
