import Foundation

/// Județele și localitățile (aceeași sursă ca site-ul: lib/data/localitati.json).
enum Localities {
    /// Datele sursă folosesc ş/ţ cu sedilă; afișăm și căutăm cu ș/ț (virgulă).
    static func fixDiacritics(_ text: String) -> String {
        text.replacingOccurrences(of: "ş", with: "ș")
            .replacingOccurrences(of: "Ş", with: "Ș")
            .replacingOccurrences(of: "ţ", with: "ț")
            .replacingOccurrences(of: "Ţ", with: "Ț")
    }

    /// Numele curat pentru căutare: fără „Municipiul” / „Oraș”.
    static func searchName(_ localitate: String) -> String {
        var name = fixDiacritics(localitate)
        for prefix in ["Municipiul ", "Oraș "] where name.hasPrefix(prefix) {
            name.removeFirst(prefix.count)
        }
        return name.trimmingCharacters(in: .whitespaces)
    }

    /// Județ → localități, ambele cu diacritice corecte; județele sortate pe alfabetul românesc.
    static let data: [(judet: String, localities: [String])] = {
        guard
            let url = Bundle.main.url(forResource: "localitati", withExtension: "json"),
            let raw = try? Data(contentsOf: url),
            let decoded = try? JSONDecoder().decode([String: [String]].self, from: raw)
        else { return [] }
        let locale = Locale(identifier: "ro_RO")
        return decoded
            .map { (fixDiacritics($0.key), $0.value.map(fixDiacritics)) }
            .sorted { $0.0.compare($1.0, locale: locale) == .orderedAscending }
            .map { (judet: $0.0, localities: $0.1) }
    }()

    static var judete: [String] { data.map(\.judet) }

    static func localities(in judet: String) -> [String] {
        data.first(where: { $0.judet == judet })?.localities ?? []
    }
}
