import Foundation

struct GmailProfileResponse: Decodable {
    let emailAddress: String?
    let messagesTotal: Int?
    let threadsTotal: Int?
    let historyId: String?
}
