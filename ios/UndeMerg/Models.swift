import Foundation

/// Oglinda lui `Institution` din lib/schema.ts (chei snake_case → camelCase prin decoder).
struct Institution: Codable, Identifiable, Hashable {
    let id: String
    let code: String
    let name: String
    var description: String?
    var category: String?
    var websiteUrl: String?
    var contactFormUrl: String?
    var phone: String?
    var email: String?
    var address: String?
    var associatedCourt: String?
    var iban: String?
    var codVenit: String?
    var cui: String?
    var waitTimeMinutes: Int?
    var latitude: Double?
    var longitude: Double?
}

/// Oglinda lui `TriageResponse` (TriageResult + institution) din lib/types.ts.
struct TriageResponse: Codable, Hashable {
    let primaryIntent: String
    let urgency: String
    let institutionType: String
    var requiredDocuments: [String] = []
    let recommendedChannel: String
    var nextSteps: [String] = []
    let explanation: String
    let confidence: Double
    var institution: Institution?
}

/// O analiză salvată local pe telefon („Dosarele mele”).
struct SavedRecord: Codable, Identifiable, Hashable {
    let id: String
    let savedAt: Date
    let description: String
    let result: TriageResponse
}

/// Oglinda răspunsului lui /api/nearest-townhall.
struct Townhall: Codable, Hashable {
    let name: String
    var address: String?
    let distanceKm: Double
    let lat: Double
    let lon: Double
}

extension JSONDecoder {
    static let api: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        decoder.dateDecodingStrategy = .secondsSince1970
        return decoder
    }()
}

extension JSONEncoder {
    static let api: JSONEncoder = {
        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        encoder.dateEncodingStrategy = .secondsSince1970
        return encoder
    }()
}
