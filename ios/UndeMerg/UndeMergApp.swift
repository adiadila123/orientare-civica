import SwiftUI

@main
struct UndeMergApp: App {
    @State private var app = AppState()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(app)
                .tint(Palette.primary)
                .task { await app.loadInstitutions() }
        }
    }
}

struct RootView: View {
    var body: some View {
        TabView {
            HomeView()
                .tabItem { Label("Triaj", systemImage: "house.fill") }
            InstitutionsView()
                .tabItem { Label("Instituții", systemImage: "building.columns.fill") }
            InstitutionsMapView()
                .tabItem { Label("Hartă", systemImage: "map.fill") }
            RecordsView()
                .tabItem { Label("Dosare", systemImage: "folder.fill") }
        }
    }
}
