import SwiftUI
import MapKit

struct InstitutionsView: View {
    @Environment(AppState.self) private var app
    @State private var query = ""

    private var filtered: [Institution] {
        let q = Localities.fixDiacritics(query.trimmingCharacters(in: .whitespaces)).lowercased()
        guard !q.isEmpty else { return app.institutions }
        return app.institutions.filter {
            $0.name.lowercased().contains(q) || $0.code.lowercased().contains(q)
                || ($0.category.map { Categories.label($0).lowercased().contains(q) } ?? false)
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.md) {
                    Text("Găsește rapid datele de contact ale instituțiilor publice.")
                        .font(.body)
                        .foregroundStyle(Palette.onSurfaceVariant)

                    if app.institutionsLoading && app.institutions.isEmpty {
                        ProgressView().frame(maxWidth: .infinity).padding(.top, Spacing.lg)
                    } else if let error = app.institutionsError, app.institutions.isEmpty {
                        ErrorBanner(message: error) { Task { await app.loadInstitutions() } }
                    } else if filtered.isEmpty {
                        EmptyState(symbol: "magnifyingglass", title: "Nicio instituție găsită",
                                   message: "Încearcă un alt cuvânt, de exemplu „fiscal” sau „primărie”.")
                    } else {
                        LazyVStack(spacing: Spacing.sm) {
                            ForEach(filtered) { institution in
                                NavigationLink(value: institution) { InstitutionRow(institution: institution) }
                                    .buttonStyle(.plain)
                            }
                        }
                    }
                }
                .padding(Spacing.md)
            }
            .background(Palette.background)
            .navigationTitle("Instituții")
            .navigationBarTitleDisplayMode(.large)
            .searchable(text: $query, placement: .navigationBarDrawer(displayMode: .always), prompt: "Caută după nume sau domeniu")
            .navigationDestination(for: Institution.self) { InstitutionDetailView(institution: $0) }
            .refreshable { await app.loadInstitutions() }
        }
    }
}

private struct InstitutionRow: View {
    let institution: Institution

    var body: some View {
        HStack(spacing: 12) {
            CategoryBadge(category: institution.category)
            VStack(alignment: .leading, spacing: 2) {
                Text(institution.name)
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(Palette.onSurface)
                    .multilineTextAlignment(.leading)
                if let category = institution.category {
                    Text(Categories.label(category))
                        .font(.footnote.weight(.medium))
                        .foregroundStyle(Palette.primary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            Image(systemName: "chevron.right")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(Palette.onSurfaceVariant)
                .accessibilityHidden(true)
        }
        .padding(Spacing.md)
        .frame(minHeight: 72)
        .cardStyle()
        .contentShape(Rectangle())
    }
}

struct InstitutionDetailView: View {
    let institution: Institution
    @Environment(\.openURL) private var openURL

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.md) {
                header
                InstitutionContactButtons(institution: institution)

                let hasContact = institution.address != nil || institution.phone != nil
                    || institution.email != nil || institution.websiteUrl != nil
                if hasContact {
                    GroupedCard(title: "Contact") { contactRows }
                }
                if institution.waitTimeMinutes != nil || institution.associatedCourt != nil {
                    GroupedCard(title: "Bine de știut") {
                        if let wait = institution.waitTimeMinutes {
                            DetailRow(symbol: "clock", label: "Timp de așteptare estimat", value: "\(wait) minute")
                        }
                        if institution.waitTimeMinutes != nil && institution.associatedCourt != nil { RowDivider() }
                        if let court = institution.associatedCourt {
                            DetailRow(symbol: "scalemass", label: "Instanță competentă", value: court)
                        }
                    }
                }
                if institution.iban != nil || institution.codVenit != nil || institution.cui != nil {
                    GroupedCard(title: "Date pentru plăți") {
                        let rows: [(String, String)] = [
                            ("IBAN", institution.iban), ("Cod venit", institution.codVenit), ("CUI", institution.cui),
                        ].compactMap { label, value in value.map { (label, $0) } }
                        ForEach(Array(rows.enumerated()), id: \.offset) { index, row in
                            if index > 0 { RowDivider() }
                            DetailRow(symbol: "banknote", label: row.0, value: row.1)
                                .textSelection(.enabled)
                        }
                    }
                }
            }
            .padding(Spacing.md)
        }
        .background(Palette.background)
        .navigationTitle("Instituție")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            CategoryBadge(category: institution.category, size: 56)
            Text(institution.name)
                .font(.title2.weight(.bold))
                .foregroundStyle(Palette.onPrimaryContainer)
                .accessibilityAddTraits(.isHeader)
            if let category = institution.category {
                InfoPill(symbol: Categories.style(category).symbol, text: Categories.label(category), background: Palette.surface)
            }
            if let description = institution.description {
                Text(description).font(.body).foregroundStyle(Palette.onPrimaryContainer)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Spacing.md)
        .background(Palette.primaryContainer, in: RoundedRectangle(cornerRadius: 20))
    }

    @ViewBuilder private var contactRows: some View {
        let items = contactItems
        ForEach(Array(items.enumerated()), id: \.offset) { index, item in
            if index > 0 { RowDivider() }
            DetailRow(symbol: item.symbol, label: item.label, value: item.value) {
                if let url = item.url { openURL(url) }
            }
        }
    }

    private var contactItems: [(symbol: String, label: String, value: String, url: URL?)] {
        var items: [(String, String, String, URL?)] = []
        if let address = institution.address {
            let q = address.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? address
            items.append(("mappin.and.ellipse", "Adresă", address, URL(string: "http://maps.apple.com/?q=\(q)")))
        }
        if let phone = institution.phone {
            items.append(("phone", "Telefon", phone, URL(string: "tel:\(phone.filter { $0.isNumber || $0 == "+" })")))
        }
        if let email = institution.email {
            items.append(("envelope", "E-mail", email, URL(string: "mailto:\(email)")))
        }
        if let site = institution.websiteUrl {
            let shown = site.replacingOccurrences(of: "https://", with: "").replacingOccurrences(of: "http://", with: "")
            items.append(("globe", "Site", shown.hasSuffix("/") ? String(shown.dropLast()) : shown, URL(string: site)))
        }
        return items.map { (symbol: $0.0, label: $0.1, value: $0.2, url: $0.3) }
    }
}
