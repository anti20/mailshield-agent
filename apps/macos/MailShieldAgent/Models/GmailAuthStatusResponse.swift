import Foundation

struct GmailAuthStatusResponse: Decodable {
    let connected: Bool
    let provider: String
    let scope: String?
    let expiresAt: String?
}
