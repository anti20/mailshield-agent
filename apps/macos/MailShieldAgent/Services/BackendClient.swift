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

    private func fetchData(from url: URL) async throws -> Data {
        let (data, response) = try await URLSession.shared.data(from: url)

        guard let httpResponse = response as? HTTPURLResponse,
              (200..<300).contains(httpResponse.statusCode) else {
            throw BackendClientError.invalidResponse
        }

        return data
    }
}

enum BackendClientError: LocalizedError {
    case invalidResponse

    var errorDescription: String? {
        "The backend returned an unexpected response."
    }
}
