import Foundation

/// Eroare cu mesaj gata de afișat utilizatorului, în română.
struct APIError: LocalizedError {
    let message: String
    var errorDescription: String? { message }
}

/// Același backend Next.js ca site-ul și aplicația Android.
enum API {
    static let baseURL = URL(string: "https://unde-merg.vercel.app")!

    private static let session: URLSession = {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 60 // triajul apelează un LLM
        return URLSession(configuration: config)
    }()

    static func triage(description: String) async throws -> TriageResponse {
        var request = URLRequest(url: baseURL.appending(path: "api/triage"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder.api.encode(["description": description.trimmingCharacters(in: .whitespacesAndNewlines)])
        return try await send(request)
    }

    static func institutions() async throws -> [Institution] {
        try await send(URLRequest(url: baseURL.appending(path: "api/institutions")))
    }

    static func nearestTownhall(lat: Double, lon: Double) async throws -> Townhall {
        var components = URLComponents(url: baseURL.appending(path: "api/nearest-townhall"), resolvingAgainstBaseURL: false)!
        components.queryItems = [
            URLQueryItem(name: "lat", value: String(lat)),
            URLQueryItem(name: "lon", value: String(lon)),
        ]
        return try await send(URLRequest(url: components.url!))
    }

    private static func send<T: Decodable>(_ request: URLRequest) async throws -> T {
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw APIError(message: "Nu mă pot conecta la server. Verifică conexiunea la internet.")
        }
        guard let http = response as? HTTPURLResponse else {
            throw APIError(message: "Răspuns neașteptat de la server.")
        }
        guard (200..<300).contains(http.statusCode) else {
            let serverMessage = (try? JSONDecoder().decode([String: String].self, from: data))?["error"]
            throw APIError(message: serverMessage ?? "Eroare \(http.statusCode). Încearcă din nou.")
        }
        do {
            return try JSONDecoder.api.decode(T.self, from: data)
        } catch {
            throw APIError(message: "Nu am putut citi răspunsul serverului.")
        }
    }
}
