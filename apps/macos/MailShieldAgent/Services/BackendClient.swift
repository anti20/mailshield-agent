import Foundation

struct BackendClient {
    private let baseURL: URL

    init(baseURL: URL = URL(string: "http://localhost:3000")!) {
        self.baseURL = baseURL
    }

    func fetchHealth() async throws -> HealthResponse {
        let url = baseURL.appending(path: "health")
        let (data, response) = try await URLSession.shared.data(from: url)

        guard let httpResponse = response as? HTTPURLResponse,
              (200..<300).contains(httpResponse.statusCode) else {
            throw BackendClientError.invalidResponse
        }

        return try JSONDecoder().decode(HealthResponse.self, from: data)
    }
}

enum BackendClientError: LocalizedError {
    case invalidResponse

    var errorDescription: String? {
        "The backend returned an unexpected response."
    }
}
