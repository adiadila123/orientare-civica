import Foundation
import MapKit
import Observation

let maxDescriptionLength = 2000 // la fel ca în app/api/triage/route.ts

/// Selecția curentă de pe hartă (județ, localitate, centru și primăria găsită).
struct MapSelection: Equatable {
    var judet = ""
    var localitate = ""
    var center: CLLocationCoordinate2D?
    var span = 4.0 // grade; mai mic = mai aproape
    var townhall: Townhall?
    var loading = false
    var error: String?
    var townhallError: String?

    static func == (lhs: MapSelection, rhs: MapSelection) -> Bool {
        lhs.judet == rhs.judet && lhs.localitate == rhs.localitate
            && lhs.center?.latitude == rhs.center?.latitude && lhs.center?.longitude == rhs.center?.longitude
            && lhs.townhall == rhs.townhall && lhs.loading == rhs.loading
            && lhs.error == rhs.error && lhs.townhallError == rhs.townhallError
    }
}

@MainActor
@Observable
final class AppState {
    // Triaj
    var description = "" {
        didSet { if description.count > maxDescriptionLength { description = String(description.prefix(maxDescriptionLength)) } }
    }
    var isAnalyzing = false
    var result: TriageResponse?
    var analyzedDescription = ""
    var savedId: String?
    var triageError: String?

    // Instituții
    var institutions: [Institution] = []
    var institutionsLoading = false
    var institutionsError: String?

    // Hartă
    var selection = MapSelection()
    private var locationTask: Task<Void, Never>?

    // Dosare (stocate doar pe telefon)
    private(set) var records: [SavedRecord] = []
    private let recordsKey = "records_v1"

    init() {
        if let data = UserDefaults.standard.data(forKey: recordsKey),
           let saved = try? JSONDecoder.api.decode([SavedRecord].self, from: data) {
            records = saved
        }
    }

    // MARK: Triaj

    func analyze() async {
        let text = description.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, !isAnalyzing else { return }
        isAnalyzing = true
        triageError = nil
        result = nil
        savedId = nil
        defer { isAnalyzing = false }
        do {
            result = try await API.triage(description: text)
            analyzedDescription = text
        } catch {
            triageError = error.localizedDescription
        }
    }

    func resetTriage() {
        description = ""
        result = nil
        triageError = nil
        savedId = nil
    }

    func saveCurrentResult() {
        guard let result, savedId == nil else { return }
        let record = SavedRecord(id: UUID().uuidString, savedAt: .now, description: analyzedDescription, result: result)
        savedId = record.id
        records.insert(record, at: 0)
        persistRecords()
    }

    func deleteRecord(id: String) {
        records.removeAll { $0.id == id }
        persistRecords()
    }

    private func persistRecords() {
        if let data = try? JSONEncoder.api.encode(records) {
            UserDefaults.standard.set(data, forKey: recordsKey)
        }
    }

    // MARK: Instituții

    func loadInstitutions() async {
        guard !institutionsLoading else { return }
        institutionsLoading = true
        institutionsError = nil
        defer { institutionsLoading = false }
        do {
            institutions = try await API.institutions()
        } catch {
            institutionsError = error.localizedDescription
        }
    }

    func institution(code: String) -> Institution? {
        institutions.first { $0.code.caseInsensitiveCompare(code) == .orderedSame }
    }

    // MARK: Hartă

    func selectJudet(_ judet: String) {
        locationTask?.cancel()
        selection = MapSelection(judet: judet, loading: true)
        locationTask = Task {
            let point = await Geocoder.coordinate(for: "\(judet), România")
            guard !Task.isCancelled else { return }
            selection.loading = false
            if let point {
                selection.center = point
                selection.span = 1.6
            } else {
                selection.error = "Nu am găsit județul pe hartă."
            }
        }
    }

    func selectLocalitate(_ localitate: String) {
        let judet = selection.judet
        guard !judet.isEmpty else { return }
        locationTask?.cancel()
        selection = MapSelection(judet: judet, localitate: localitate, center: selection.center, span: selection.span, loading: true)
        locationTask = Task {
            let name = Localities.searchName(localitate)
            let query = judet == "București" ? "\(name), România" : "\(name), \(judet), România"
            guard let point = await Geocoder.coordinate(for: query) else {
                guard !Task.isCancelled else { return }
                selection.loading = false
                selection.error = "Nu am găsit localitatea pe hartă."
                return
            }
            guard !Task.isCancelled else { return }
            selection.center = point
            selection.span = 0.06
            await loadTownhall(point)
        }
    }

    func retryTownhall() {
        guard let center = selection.center else { return }
        locationTask?.cancel()
        selection.loading = true
        selection.townhallError = nil
        locationTask = Task { await loadTownhall(center) }
    }

    /// Serviciul OpenStreetMap e uneori ocupat, așa că mai încercăm o dată.
    private func loadTownhall(_ point: CLLocationCoordinate2D) async {
        var lastError: String?
        for attempt in 0..<2 {
            do {
                let townhall = try await API.nearestTownhall(lat: point.latitude, lon: point.longitude)
                guard !Task.isCancelled else { return }
                selection.townhall = townhall
                selection.townhallError = nil
                selection.loading = false
                return
            } catch {
                lastError = error.localizedDescription
                if attempt == 0 { try? await Task.sleep(for: .seconds(2)) }
                if Task.isCancelled { return }
            }
        }
        selection.loading = false
        selection.townhallError = lastError
    }

    func clearSelection() {
        locationTask?.cancel()
        selection = MapSelection()
    }
}

/// Căutare de adrese cu MapKit (fără chei API).
enum Geocoder {
    static func coordinate(for query: String) async -> CLLocationCoordinate2D? {
        let request = MKLocalSearch.Request()
        request.naturalLanguageQuery = query
        // Restrângem căutarea la România.
        request.region = MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 45.9432, longitude: 24.9668),
            span: MKCoordinateSpan(latitudeDelta: 8, longitudeDelta: 12)
        )
        let response = try? await MKLocalSearch(request: request).start()
        return response?.mapItems.first?.placemark.coordinate
    }
}
