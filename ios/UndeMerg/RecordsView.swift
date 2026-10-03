import SwiftUI

struct RecordsView: View {
    @Environment(AppState.self) private var app

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.md) {
                    Text("Analizele salvate rămân doar pe acest telefon.")
                        .font(.body)
                        .foregroundStyle(Palette.onSurfaceVariant)

                    if app.records.isEmpty {
                        EmptyState(symbol: "folder", title: "Nu ai nicio analiză salvată",
                                   message: "După o analiză, apasă „Salvează în Dosarele mele” ca să o găsești aici.")
                    } else {
                        LazyVStack(spacing: Spacing.sm) {
                            ForEach(app.records) { record in
                                NavigationLink(value: record) { RecordRow(record: record) }
                                    .buttonStyle(.plain)
                                    .contextMenu {
                                        Button(role: .destructive) { app.deleteRecord(id: record.id) } label: {
                                            Label("Șterge analiza", systemImage: "trash")
                                        }
                                    }
                            }
                        }
                    }
                }
                .padding(Spacing.md)
            }
            .background(Palette.background)
            .navigationTitle("Dosarele mele")
            .navigationBarTitleDisplayMode(.large)
            .navigationDestination(for: SavedRecord.self) { RecordDetailView(record: $0) }
            .navigationDestination(for: Institution.self) { InstitutionDetailView(institution: $0) }
        }
    }
}

private struct RecordRow: View {
    @Environment(AppState.self) private var app
    let record: SavedRecord

    var body: some View {
        HStack(spacing: 12) {
            CategoryBadge(category: record.result.institution?.category)
            VStack(alignment: .leading, spacing: 2) {
                Text(record.result.institution?.name ?? record.result.institutionType)
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(Palette.onSurface)
                    .multilineTextAlignment(.leading)
                Text(record.description)
                    .font(.subheadline)
                    .foregroundStyle(Palette.onSurfaceVariant)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                Text(record.savedAt.formatted(.dateTime.locale(Locale(identifier: "ro_RO")).day().month(.abbreviated).year().hour().minute()))
                    .font(.caption)
                    .foregroundStyle(Palette.onSurfaceVariant)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            Button(role: .destructive) { app.deleteRecord(id: record.id) } label: {
                Image(systemName: "trash").frame(width: minTouch, height: minTouch)
            }
            .accessibilityLabel("Șterge analiza")
        }
        .padding(.leading, Spacing.md)
        .padding(.vertical, Spacing.sm)
        .padding(.trailing, Spacing.xs)
        .cardStyle()
        .contentShape(Rectangle())
    }
}

struct RecordDetailView: View {
    let record: SavedRecord
    @State private var path: Institution?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.md) {
                SectionTitle("Problema ta")
                Text(record.description).font(.body).foregroundStyle(Palette.onSurface)
                TriageResultView(result: record.result) { path = $0 }
            }
            .padding(Spacing.md)
        }
        .background(Palette.background)
        .navigationTitle("Analiză salvată")
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(item: $path) { InstitutionDetailView(institution: $0) }
    }
}
