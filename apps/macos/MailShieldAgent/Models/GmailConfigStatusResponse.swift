import Foundation

struct GmailConfigStatusResponse: Decodable {
    let provider: String
    let configured: Bool
    let missing: [String]
    let redirectUriConfigured: Bool
    let scopesConfigured: Bool
}
