import SwiftUI

// MARK: - Butoane

struct PrimaryButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.body.weight(.semibold))
            .foregroundStyle(isEnabled ? Palette.onPrimary : Palette.onSurfaceVariant.opacity(0.6))
            .frame(maxWidth: .infinity, minHeight: 52)
            .padding(.horizontal, Spacing.md)
            .background(isEnabled ? Palette.primary : Palette.secondaryContainer.opacity(0.7), in: RoundedRectangle(cornerRadius: 26))
            .opacity(configuration.isPressed ? 0.85 : 1)
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}

struct TonalButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.body.weight(.medium))
            .foregroundStyle(Palette.onSurface)
            .frame(minHeight: minTouch)
            .padding(.horizontal, Spacing.md)
            .background(Palette.secondaryContainer, in: RoundedRectangle(cornerRadius: 24))
            .opacity(configuration.isPressed ? 0.8 : 1)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}

struct OutlineButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.body.weight(.medium))
            .foregroundStyle(Palette.primary)
            .frame(maxWidth: .infinity, minHeight: minTouch)
            .padding(.horizontal, Spacing.md)
            .overlay(RoundedRectangle(cornerRadius: 24).stroke(Palette.outline, lineWidth: 1))
            .opacity(configuration.isPressed ? 0.7 : 1)
    }
}

// MARK: - Carduri

extension View {
    /// Card cu fundal, contur fin și colțuri rotunjite.
    func cardStyle(fill: Color = Palette.surface, radius: CGFloat = 16) -> some View {
        background(fill, in: RoundedRectangle(cornerRadius: radius))
            .overlay(RoundedRectangle(cornerRadius: radius).stroke(Palette.outline, lineWidth: 1))
    }
}

struct SectionTitle: View {
    let text: String
    init(_ text: String) { self.text = text }

    var body: some View {
        Text(text)
            .font(.title3.weight(.bold))
            .foregroundStyle(Palette.onSurface)
            .accessibilityAddTraits(.isHeader)
            .padding(.top, Spacing.sm)
    }
}

struct ScreenHeader: View {
    let title: String
    var subtitle: String?

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text(title)
                .font(.largeTitle.weight(.bold))
                .foregroundStyle(Palette.onSurface)
                .accessibilityAddTraits(.isHeader)
            if let subtitle {
                Text(subtitle)
                    .font(.body)
                    .foregroundStyle(Palette.onSurfaceVariant)
            }
        }
    }
}

// MARK: - Iconițe și etichete

/// Cerc tintat cu o iconiță SF Symbol.
struct IconBadge: View {
    let symbol: String
    var tint: Color = Palette.onPrimaryContainer
    var background: Color = Palette.primaryContainer
    var size: CGFloat = 44

    var body: some View {
        ZStack {
            Circle().fill(background)
            Image(systemName: symbol)
                .font(.system(size: size * 0.45, weight: .semibold))
                .foregroundStyle(tint)
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}

/// Iconița unui domeniu, în culoarea lui.
struct CategoryBadge: View {
    let category: String?
    var size: CGFloat = 44

    var body: some View {
        let style = Categories.style(category)
        IconBadge(symbol: style.symbol, tint: style.tint, background: style.tint.opacity(0.16), size: size)
    }
}

/// Etichetă informativă: întotdeauna icon + text, nu doar culoare.
struct InfoPill: View {
    let symbol: String
    let text: String
    var background: Color = Palette.secondaryContainer
    var foreground: Color = Palette.onSurface

    var body: some View {
        Label(text, systemImage: symbol)
            .font(.footnote.weight(.medium))
            .foregroundStyle(foreground)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(background, in: Capsule())
    }
}

struct StepRow: View {
    let number: Int
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Text("\(number)")
                .font(.subheadline.weight(.bold))
                .foregroundStyle(Palette.onPrimary)
                .frame(width: 32, height: 32)
                .background(Palette.primary, in: Circle())
                .accessibilityHidden(true)
            Text(text)
                .font(.body)
                .foregroundStyle(Palette.onSurface)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.top, 4)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Pasul \(number): \(text)")
    }
}

struct CheckRow: View {
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: "checkmark.circle.fill")
                .font(.title3)
                .foregroundStyle(Palette.tertiary)
                .accessibilityHidden(true)
            Text(text)
                .font(.body)
                .foregroundStyle(Palette.onSurface)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

struct EmptyState: View {
    let symbol: String
    let title: String
    let message: String

    var body: some View {
        VStack(spacing: Spacing.sm) {
            IconBadge(symbol: symbol)
            Text(title).font(.headline).foregroundStyle(Palette.onSurface)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(Palette.onSurfaceVariant)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, Spacing.xl)
        .accessibilityElement(children: .combine)
    }
}

struct ErrorBanner: View {
    let message: String
    var retry: (() -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Label(message, systemImage: "exclamationmark.circle")
                .font(.subheadline)
            if let retry {
                Button("Reîncearcă", action: retry)
                    .buttonStyle(OutlineButtonStyle())
            }
        }
        .foregroundStyle(Palette.onErrorContainer)
        .padding(Spacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Palette.errorContainer, in: RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Rânduri de detalii

/// Rând cu iconiță, etichetă și valoare; devine atingibil dacă are `action`.
struct DetailRow: View {
    let symbol: String
    let label: String
    let value: String
    var action: (() -> Void)?

    var body: some View {
        let content = HStack(spacing: 14) {
            Image(systemName: symbol)
                .font(.title3)
                .foregroundStyle(Palette.primary)
                .frame(width: 26)
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 2) {
                Text(label).font(.footnote).foregroundStyle(Palette.onSurfaceVariant)
                Text(value).font(.body).foregroundStyle(Palette.onSurface)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            if action != nil {
                Image(systemName: "chevron.right")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(Palette.onSurfaceVariant)
                    .accessibilityHidden(true)
            }
        }
        .padding(.horizontal, Spacing.md)
        .padding(.vertical, 10)
        .frame(minHeight: 60)
        .contentShape(Rectangle())

        if let action {
            Button(action: action) { content }.buttonStyle(.plain)
        } else {
            content.accessibilityElement(children: .combine)
        }
    }
}

/// Card care grupează rânduri, separate printr-o linie fină.
struct GroupedCard<Content: View>: View {
    var title: String?
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            if let title { SectionTitle(title) }
            VStack(spacing: 0) { content }
                .cardStyle()
        }
    }
}

struct RowDivider: View {
    var body: some View {
        Divider().overlay(Palette.outline).padding(.leading, 56)
    }
}

// MARK: - Contact

struct InstitutionContactButtons: View {
    let institution: Institution
    @Environment(\.openURL) private var openURL

    var body: some View {
        // Butoane care se mută pe rândul următor când nu încap (ex. text mare).
        ViewThatFits(in: .horizontal) {
            HStack(spacing: Spacing.sm) { buttons }
            VStack(spacing: Spacing.sm) { buttons }
        }
    }

    @ViewBuilder private var buttons: some View {
        if let phone = institution.phone, let url = URL(string: "tel:\(phone.filter { $0.isNumber || $0 == "+" })") {
            Button { openURL(url) } label: { Label("Sună", systemImage: "phone.fill") }
                .buttonStyle(PrimaryButtonStyle())
                .fixedSize(horizontal: true, vertical: false)
        }
        if let email = institution.email, let url = URL(string: "mailto:\(email)") {
            Button { openURL(url) } label: { Label("E-mail", systemImage: "envelope.fill") }
                .buttonStyle(TonalButtonStyle())
        }
        if let site = institution.contactFormUrl ?? institution.websiteUrl, let url = URL(string: site) {
            Button { openURL(url) } label: { Label("Site", systemImage: "globe") }
                .buttonStyle(TonalButtonStyle())
        }
    }
}

// MARK: - Rezultatul triajului

struct TriageResultView: View {
    let result: TriageResponse
    var onOpenInstitution: (Institution) -> Void

    private var percent: Int { Int((result.confidence * 100).rounded()) }

    private func channelLabel(_ channel: String) -> (String, String) {
        switch channel {
        case "online": ("Online", "globe")
        case "telefon": ("Telefon", "phone.fill")
        default: ("La ghișeu", "building.2.fill")
        }
    }

    private func urgencyLabel(_ urgency: String) -> (String, String) {
        switch urgency {
        case "high": ("Urgent", "exclamationmark.triangle.fill")
        case "low": ("Fără grabă", "checkmark.circle")
        default: ("Prioritate normală", "clock")
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            summaryCard

            if result.confidence < 0.7 {
                Label("Încrederea e scăzută. Verifică direct cu instituția înainte să faci pașii de mai jos.",
                      systemImage: "info.circle.fill")
                    .font(.subheadline)
                    .foregroundStyle(Palette.onErrorContainer)
                    .padding(Spacing.md)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Palette.errorContainer, in: RoundedRectangle(cornerRadius: 16))
            }

            if !result.nextSteps.isEmpty {
                SectionTitle("Pașii de urmat")
                VStack(alignment: .leading, spacing: 12) {
                    ForEach(Array(result.nextSteps.enumerated()), id: \.offset) { index, step in
                        StepRow(number: index + 1, text: step)
                    }
                }
            }

            if !result.requiredDocuments.isEmpty {
                SectionTitle("Documente necesare")
                VStack(alignment: .leading, spacing: 12) {
                    ForEach(result.requiredDocuments, id: \.self) { CheckRow(text: $0) }
                }
            }

            if let institution = result.institution {
                SectionTitle("Contact")
                if let address = institution.address {
                    Text(address).font(.body).foregroundStyle(Palette.onSurface)
                }
                if let wait = institution.waitTimeMinutes {
                    InfoPill(symbol: "clock", text: "Așteptare estimată: \(wait) min")
                }
                InstitutionContactButtons(institution: institution)
                Button("Vezi toate detaliile instituției") { onOpenInstitution(institution) }
                    .buttonStyle(OutlineButtonStyle())
            }
        }
    }

    private var summaryCard: some View {
        let urgency = urgencyLabel(result.urgency)
        let channel = channelLabel(result.recommendedChannel)
        return VStack(alignment: .leading, spacing: Spacing.sm) {
            HStack(spacing: 12) {
                IconBadge(symbol: "building.columns.fill", tint: Palette.onPrimary, background: Palette.primary)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Te adresezi la").font(.footnote.weight(.medium))
                    Text(result.institution?.name ?? result.institutionType)
                        .font(.title3.weight(.bold))
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            Text(result.explanation).font(.body)
            HStack(spacing: Spacing.sm) {
                InfoPill(symbol: urgency.1, text: urgency.0, background: Palette.surface)
                InfoPill(symbol: channel.1, text: channel.0, background: Palette.surface)
            }
            VStack(alignment: .leading, spacing: 4) {
                Text("Încredere în analiză: \(percent)%").font(.footnote.weight(.medium))
                ProgressView(value: min(max(result.confidence, 0), 1))
                    .tint(Palette.primary)
            }
            .accessibilityElement(children: .combine)
            .accessibilityLabel("Încredere în analiză: \(percent) la sută")
        }
        .foregroundStyle(Palette.onPrimaryContainer)
        .padding(Spacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Palette.primaryContainer, in: RoundedRectangle(cornerRadius: 20))
    }
}
