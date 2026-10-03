import SwiftUI
import MapKit

struct InstitutionsMapView: View {
    @Environment(AppState.self) private var app
    @State private var camera: MapCameraPosition = .region(MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 45.9432, longitude: 24.9668), // centrul României
        span: MKCoordinateSpan(latitudeDelta: 7, longitudeDelta: 9)
    ))
    @State private var path: [Institution] = []
    @State private var pickingJudet = false
    @State private var pickingLocalitate = false
    @State private var townhallDismissed = false
    @Environment(\.openURL) private var openURL

    private var mappable: [Institution] {
        app.institutions.filter { $0.latitude != nil && $0.longitude != nil }
    }

    var body: some View {
        NavigationStack(path: $path) {
            ZStack(alignment: .top) {
                Map(position: $camera) {
                    ForEach(mappable) { institution in
                        Annotation(institution.name,
                                   coordinate: CLLocationCoordinate2D(latitude: institution.latitude!, longitude: institution.longitude!),
                                   anchor: .bottom) {
                            Button { path.append(institution) } label: {
                                ZStack {
                                    Image(systemName: "mappin.circle.fill")
                                        .font(.system(size: 34))
                                        .foregroundStyle(.white, Color(hex: 0xEA4335))
                                }
                            }
                            .accessibilityLabel(institution.name)
                        }
                    }
                    if let townhall = app.selection.townhall {
                        Marker(townhall.name, systemImage: "building.columns.fill",
                               coordinate: CLLocationCoordinate2D(latitude: townhall.lat, longitude: townhall.lon))
                            .tint(Palette.primary)
                    }
                }
                .mapControls { MapCompass(); MapScaleView(); MapUserLocationButton() }
                .ignoresSafeArea(edges: .bottom)

                panel
                    .padding(Spacing.md)
            }
            .overlay(alignment: .bottom) {
                if let townhall = app.selection.townhall, !townhallDismissed {
                    townhallCard(townhall)
                        .padding(Spacing.md)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
            .animation(.easeInOut(duration: 0.25), value: townhallDismissed)
            .toolbar(.hidden, for: .navigationBar)
            .navigationDestination(for: Institution.self) { InstitutionDetailView(institution: $0) }
            .sheet(isPresented: $pickingJudet) {
                OptionPicker(title: "Județ", options: Localities.judete) { app.selectJudet($0) }
            }
            .sheet(isPresented: $pickingLocalitate) {
                OptionPicker(title: "Localitate", options: Localities.localities(in: app.selection.judet), display: Localities.searchName) {
                    app.selectLocalitate($0)
                }
            }
            .onChange(of: app.selection.center?.latitude) { moveCamera() }
            .onChange(of: app.selection.center?.longitude) { moveCamera() }
            .onChange(of: app.selection.townhall) { townhallDismissed = false }
        }
    }

    private func moveCamera() {
        guard let center = app.selection.center else { return }
        withAnimation(.easeInOut(duration: 0.8)) {
            camera = .region(MKCoordinateRegion(
                center: center,
                span: MKCoordinateSpan(latitudeDelta: app.selection.span, longitudeDelta: app.selection.span)
            ))
        }
    }

    // MARK: Panou de căutare

    private var panel: some View {
        let selection = app.selection
        return VStack(alignment: .leading, spacing: Spacing.sm) {
            Text("Caută pe hartă").font(.headline).foregroundStyle(Palette.onSurface)
            HStack(spacing: Spacing.sm) {
                pickerButton(label: "Județ", value: selection.judet, placeholder: "Alege", enabled: true) { pickingJudet = true }
                pickerButton(label: "Localitate", value: Localities.searchName(selection.localitate),
                             placeholder: selection.judet.isEmpty ? "Alege județul" : "Alege",
                             enabled: !selection.judet.isEmpty) { pickingLocalitate = true }
            }
            if selection.loading { ProgressView().progressViewStyle(.linear).tint(Palette.primary) }

            if let status = selection.error ?? selection.townhallError {
                Text(status).font(.footnote).foregroundStyle(Palette.error)
            } else if selection.judet.isEmpty {
                Text("\(mappable.count) instituții naționale cu sediul în București. Alege județul și localitatea ca să găsești primăria din zona ta.")
                    .font(.footnote)
                    .foregroundStyle(Palette.onSurfaceVariant)
            }

            if !selection.judet.isEmpty {
                HStack {
                    if selection.townhallError != nil && !selection.localitate.isEmpty {
                        Button("Reîncearcă primăria") { app.retryTownhall() }
                            .buttonStyle(TonalButtonStyle())
                    }
                    Button("Șterge selecția") { app.clearSelection() }
                        .frame(minHeight: minTouch)
                }
            }
        }
        .padding(Spacing.md)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 20))
        .shadow(color: .black.opacity(0.12), radius: 8, y: 2)
    }

    private func pickerButton(label: String, value: String, placeholder: String, enabled: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 2) {
                Text(label).font(.caption).foregroundStyle(Palette.onSurfaceVariant)
                HStack {
                    Text(value.isEmpty ? placeholder : value)
                        .font(.body)
                        .foregroundStyle(value.isEmpty ? Palette.onSurfaceVariant : Palette.onSurface)
                        .lineLimit(1)
                    Spacer(minLength: 4)
                    Image(systemName: "chevron.down").font(.footnote.weight(.semibold)).foregroundStyle(Palette.onSurfaceVariant)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .frame(maxWidth: .infinity, minHeight: minTouch, alignment: .leading)
            .background(Palette.background, in: RoundedRectangle(cornerRadius: 12))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Palette.outline, lineWidth: 1))
            .opacity(enabled ? 1 : 0.5)
        }
        .buttonStyle(.plain)
        .disabled(!enabled)
        .accessibilityLabel("\(label): \(value.isEmpty ? placeholder : value)")
    }

    // MARK: Primăria găsită

    private func townhallCard(_ townhall: Townhall) -> some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            HStack(spacing: 12) {
                IconBadge(symbol: "building.columns.fill")
                VStack(alignment: .leading, spacing: 2) {
                    Text("Primăria cea mai apropiată").font(.footnote.weight(.medium)).foregroundStyle(Palette.primary)
                    Text(townhall.name).font(.subheadline.weight(.bold)).foregroundStyle(Palette.onSurface)
                }
                Spacer()
                Button { townhallDismissed = true } label: {
                    Image(systemName: "xmark").font(.body.weight(.semibold)).frame(width: minTouch, height: minTouch)
                }
                .accessibilityLabel("Închide")
            }
            if let address = townhall.address {
                Text(address).font(.subheadline).foregroundStyle(Palette.onSurface)
            }
            Text("~\(String(format: "%.1f", townhall.distanceKm)) km de centrul localității · date OpenStreetMap, neverificate")
                .font(.footnote)
                .foregroundStyle(Palette.onSurfaceVariant)
            Button {
                let item = MKMapItem(placemark: MKPlacemark(coordinate: CLLocationCoordinate2D(latitude: townhall.lat, longitude: townhall.lon)))
                item.name = townhall.name
                item.openInMaps()
            } label: {
                Label("Deschide în Hărți", systemImage: "arrow.triangle.turn.up.right.diamond.fill")
            }
            .buttonStyle(PrimaryButtonStyle())
        }
        .padding(Spacing.md)
        .background(Palette.surface, in: RoundedRectangle(cornerRadius: 20))
        .shadow(color: .black.opacity(0.18), radius: 10, y: 3)
    }
}

/// Listă cu căutare, afișată într-o foaie (sheet); folosită pentru județ și localitate.
private struct OptionPicker: View {
    let title: String
    let options: [String]
    var display: (String) -> String = { $0 }
    let onSelect: (String) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var query = ""

    private var filtered: [String] {
        let q = Localities.fixDiacritics(query.trimmingCharacters(in: .whitespaces)).lowercased()
        return q.isEmpty ? options : options.filter { $0.lowercased().contains(q) }
    }

    var body: some View {
        NavigationStack {
            List {
                if filtered.isEmpty {
                    Text("Niciun rezultat.").foregroundStyle(Palette.onSurfaceVariant)
                }
                ForEach(filtered, id: \.self) { option in
                    Button {
                        onSelect(option)
                        dismiss()
                    } label: {
                        Text(display(option)).foregroundStyle(Palette.onSurface).frame(minHeight: 36, alignment: .leading)
                    }
                }
            }
            .listStyle(.plain)
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .searchable(text: $query, placement: .navigationBarDrawer(displayMode: .always), prompt: "Caută")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Anulează") { dismiss() } }
            }
        }
        .presentationDetents([.medium, .large])
    }
}
