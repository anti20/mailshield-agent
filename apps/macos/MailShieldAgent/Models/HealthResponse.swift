import Foundation

struct HealthResponse: Decodable {
    let status: String
    let service: String
}
