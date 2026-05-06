import Foundation

struct BackendClient {
    private let baseURL: URL
    private let decoder: JSONDecoder

    init(baseURL: URL = URL(string: "http://localhost:3000")!) {
        self.baseURL = baseURL

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        self.decoder = decoder
    }

    func fetchHealth() async throws -> HealthResponse {
        let url = baseURL.appending(path: "health")
        let data = try await fetchData(from: url)

        return try decoder.decode(HealthResponse.self, from: data)
    }

    func fetchScanResults() async throws -> ScanResultsResponse {
        let url = baseURL.appending(path: "scan-results")
        let data = try await fetchData(from: url)

        return try decoder.decode(ScanResultsResponse.self, from: data)
    }

    func fetchScanPreview() async throws -> ScanPreviewResponse {
        let url = baseURL.appending(path: "scan-preview")
        let data = try await fetchData(from: url)

        return try decoder.decode(ScanPreviewResponse.self, from: data)
    }

    func fetchGmailAuthStatus() async throws -> GmailAuthStatusResponse {
        let url = baseURL.appending(path: "auth/gmail/status")
        let data = try await fetchData(from: url)

        return try decoder.decode(GmailAuthStatusResponse.self, from: data)
    }

    func fetchGmailConfigStatus() async throws -> GmailConfigStatusResponse {
        let url = baseURL.appending(path: "auth/gmail/config-status")
        let data = try await fetchData(from: url)

        return try decoder.decode(GmailConfigStatusResponse.self, from: data)
    }

    func fetchGmailProfile() async throws -> GmailProfileResponse {
        let url = baseURL.appending(path: "auth/gmail/profile")
        let data = try await fetchData(from: url)

        return try decoder.decode(GmailProfileResponse.self, from: data)
    }

    func fetchRecentGmailMessages(limit: Int = 10) async throws -> GmailRecentMessagesResponse {
        var components = URLComponents(
            url: baseURL.appending(path: "gmail/messages/recent"),
            resolvingAgainstBaseURL: false
        )
        components?.queryItems = [URLQueryItem(name: "limit", value: "\(limit)")]

        guard let url = components?.url else {
            throw BackendClientError.invalidResponse(statusCode: nil)
        }

        let data = try await fetchData(from: url)
        return try decoder.decode(GmailRecentMessagesResponse.self, from: data)
    }

    func fetchGmailStaticScan(messageId: String) async throws -> GmailStaticScanResponse {
        let url = baseURL.appending(path: "gmail/messages/\(messageId)/static-scan")
        let data = try await fetchData(from: url)

        return try decoder.decode(GmailStaticScanResponse.self, from: data)
    }

    func fetchGmailAgentScan(messageId: String) async throws -> GmailAgentScanResponse {
        let url = baseURL.appending(path: "gmail/messages/\(messageId)/agent-scan")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"

        let data = try await fetchData(for: request)
        return try decoder.decode(GmailAgentScanResponse.self, from: data)
    }

    var gmailOAuthStartURL: URL {
        baseURL.appending(path: "auth/gmail/start")
    }

    private func fetchData(from url: URL) async throws -> Data {
        let (data, response) = try await URLSession.shared.data(from: url)
        return try validate(data: data, response: response)
    }

    private func fetchData(for request: URLRequest) async throws -> Data {
        let (data, response) = try await URLSession.shared.data(for: request)
        return try validate(data: data, response: response)
    }

    private func validate(data: Data, response: URLResponse) throws -> Data {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw BackendClientError.invalidResponse(statusCode: nil)
        }

        guard (200..<300).contains(httpResponse.statusCode) else {
            throw BackendClientError.invalidResponse(statusCode: httpResponse.statusCode)
        }

        return data
    }
}

enum BackendClientError: LocalizedError {
    case invalidResponse(statusCode: Int?)

    var errorDescription: String? {
        switch self {
        case .invalidResponse(let statusCode):
            if let statusCode {
                return "The backend returned HTTP \(statusCode)."
            }

            return "The backend returned an unexpected response."
        }
    }
}
