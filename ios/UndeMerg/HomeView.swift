import SwiftUI

/// Un subiect frecvent: atingerea lui completează începutul descrierii.
private struct Topic: Identifiable {
    let id = UUID()
    let title: String
    let hint: String
    let starter: String
    let symbol: String
    let tint: Color
}

private let topics: [Topic] = [
    Topic(title: "Amenzi", hint: "Contestă un proces-verbal",
          starter: "Am primit o amendă de la Poliția Locală și nu sunt de acord.",
          symbol: "hammer.fill", tint: Color(light: 0x0369A1, dark: 0x7DD3FC)),
    Topic(title: "Facturi", hint: "Curent, gaz, internet",
          starter: "Factura la curent este mult prea mare și nu înțeleg de ce.",
          symbol: "bolt.fill", tint: Color(light: 0xB45309, dark: 0xFCD34D)),
    Topic(title: "Taxe și impozite", hint: "ANAF și fiscalitate",
          starter: "Am o problemă cu o taxă sau un impozit pe care îl datorez la ANAF.",
          symbol: "banknote.fill", tint: Color(light: 0x0F766E, dark: 0x5EEAD4)),
    Topic(title: "Cazier", hint: "Certificat judiciar",
          starter: "Am nevoie de un certificat de cazier judiciar pentru angajare.",
          symbol: "checkmark.seal.fill", tint: Color(light: 0x4338CA, dark: 0xA5B4FC)),
    Topic(title: "Cumpărături", hint: "Produse și servicii",
          starter: "Am cumpărat un produs online și nu am primit ce am comandat.",
          symbol: "cart.fill", tint: Color(light: 0xBE123C, dark: 0xFDA4AF)),
    Topic(title: "Mașină și permis", hint: "Înmatriculare, permis",
          starter: "Vreau să preschimb permisul de conducere.",
          symbol: "car.fill", tint: Color(light: 0x15803D, dark: 0x86EFAC)),
    Topic(title: "Muncă", hint: "Drepturi la locul de muncă",
          starter: "Angajatorul meu nu îmi respectă drepturile din contract.",
          symbol: "briefcase.fill", tint: Color(light: 0x6D28D9, dark: 0xC4B5FD)),
    Topic(title: "Discriminare", hint: "Tratament nedrept",
          starter: "Am fost tratat diferit și nejustificat din cauza unui criteriu personal.",
          symbol: "person.3.fill", tint: Color(light: 0x475569, dark: 0xCBD5E1)),
]

struct HomeView: View {
    @Environment(AppState.self) private var app
    @FocusState private var inputFocused: Bool
    @State private var path: [Institution] = []

    var body: some View {
        @Bindable var app = app

        NavigationStack(path: $path) {
            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.md) {
                    hero
                    inputCard(text: $app.description)

                    if app.isAnalyzing {
                        VStack(alignment: .leading, spacing: Spacing.sm) {
                            ProgressView().progressViewStyle(.linear).tint(Palette.primary)
                            Text("Analizez problema… poate dura câteva secunde.")
                                .font(.subheadline)
                                .foregroundStyle(Palette.onSurfaceVariant)
                        }
                    }
                    if let error = app.triageError {
                        ErrorBanner(message: error) { Task { await app.analyze() } }
                    }

                    if app.result == nil && !app.isAnalyzing {
                        topicsSection
                        howItWorks
                    }

                    if let result = app.result {
                        TriageResultView(result: result) { path.append($0) }
                        Button {
                            app.saveCurrentResult()
                        } label: {
                            Label(app.savedId == nil ? "Salvează în Dosarele mele" : "Salvat pe telefon",
                                  systemImage: app.savedId == nil ? "folder.badge.plus" : "folder.fill")
                        }
                        .buttonStyle(PrimaryButtonStyle())
                        .disabled(app.savedId != nil)
                        .sensoryFeedback(.success, trigger: app.savedId)
                    }
                }
                .padding(Spacing.md)
                .animation(.easeInOut(duration: 0.25), value: app.result)
                .animation(.easeInOut(duration: 0.25), value: app.isAnalyzing)
            }
            .scrollDismissesKeyboard(.interactively)
            .background(Palette.background)
            .toolbar(.hidden, for: .navigationBar)
            .navigationDestination(for: Institution.self) { InstitutionDetailView(institution: $0) }
        }
    }

    // MARK: Antet

    private var hero: some View {
        ZStack(alignment: .bottomTrailing) {
            Image(systemName: "building.columns.fill")
                .font(.system(size: 130))
                .foregroundStyle(.white.opacity(0.10))
                .offset(x: 28, y: 28)
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: Spacing.md) {
                HStack(spacing: 12) {
                    Image(systemName: "safari.fill")
                        .font(.system(size: 26))
                        .foregroundStyle(.white)
                        .frame(width: 48, height: 48)
                        .background(.white.opacity(0.18), in: Circle())
                        .accessibilityHidden(true)
                    Text("Unde merg?")
                        .font(.largeTitle.weight(.bold))
                        .foregroundStyle(.white)
                        .accessibilityAddTraits(.isHeader)
                }
                Text("Spune-ne problema ta. Îți arătăm instituția potrivită, documentele de care ai nevoie și pașii de urmat.")
                    .font(.body)
                    .foregroundStyle(.white.opacity(0.92))
                HStack(spacing: Spacing.sm) {
                    HeroPill(symbol: "eurosign.circle", text: "Gratuit")
                    HeroPill(symbol: "lock.fill", text: "Fără cont")
                }
                HeroPill(symbol: "iphone", text: "Datele rămân pe telefon")
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(Spacing.lg)
        }
        .background(
            LinearGradient(colors: [Palette.heroTop, Palette.heroBottom], startPoint: .topLeading, endPoint: .bottomTrailing)
        )
        .clipShape(RoundedRectangle(cornerRadius: 28))
    }

    // MARK: Intrare

    private func inputCard(text: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text("Descrie problema ta")
                .font(.subheadline.weight(.medium))
                .foregroundStyle(Palette.onSurfaceVariant)
            TextField("Ex.: am primit o amendă și nu sunt de acord…", text: text, axis: .vertical)
                .lineLimit(3...8)
                .focused($inputFocused)
                .font(.body)
                .padding(12)
                .background(Palette.background, in: RoundedRectangle(cornerRadius: 12))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(inputFocused ? Palette.primary : Palette.outline, lineWidth: inputFocused ? 2 : 1))
                .accessibilityLabel("Descrie problema ta")
            HStack {
                Text("\(text.wrappedValue.count)/\(maxDescriptionLength)")
                    .font(.footnote.monospacedDigit())
                    .foregroundStyle(Palette.onSurfaceVariant)
                Spacer()
                if app.result != nil || app.triageError != nil {
                    Button("Nouă") { app.resetTriage() }
                        .font(.body.weight(.medium))
                        .frame(minHeight: minTouch)
                }
            }
            Button {
                inputFocused = false
                Task { await app.analyze() }
            } label: {
                Label("Află unde mergi", systemImage: "arrow.right")
                    .labelStyle(TrailingIconLabelStyle())
            }
            .buttonStyle(PrimaryButtonStyle())
            .disabled(app.description.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || app.isAnalyzing)
        }
        .padding(Spacing.md)
        .cardStyle(radius: 20)
        .shadow(color: .black.opacity(0.06), radius: 8, y: 2)
    }

    // MARK: Subiecte și explicații

    private var topicsSection: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            SectionTitle("Alege un subiect")
            LazyVGrid(columns: [GridItem(.flexible(), spacing: Spacing.sm), GridItem(.flexible(), spacing: Spacing.sm)],
                      spacing: Spacing.sm) {
                ForEach(topics) { topic in
                    Button {
                        app.description = topic.starter
                    } label: {
                        VStack(alignment: .leading, spacing: Spacing.sm) {
                            IconBadge(symbol: topic.symbol, tint: topic.tint, background: topic.tint.opacity(0.16))
                            VStack(alignment: .leading, spacing: 2) {
                                Text(topic.title).font(.subheadline.weight(.bold)).foregroundStyle(Palette.onSurface)
                                Text(topic.hint).font(.footnote).foregroundStyle(Palette.onSurfaceVariant)
                                    .multilineTextAlignment(.leading)
                            }
                        }
                        .padding(Spacing.md)
                        .frame(maxWidth: .infinity, minHeight: 112, alignment: .topLeading)
                        .cardStyle()
                    }
                    .buttonStyle(.plain)
                    .accessibilityHint("Completează descrierea cu un exemplu")
                }
            }
        }
    }

    private var howItWorks: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            SectionTitle("Cum funcționează")
            VStack(alignment: .leading, spacing: 14) {
                StepRow(number: 1, text: "Descrie pe scurt ce s-a întâmplat, cu cuvintele tale.")
                StepRow(number: 2, text: "Primești instituția potrivită, cu telefon, e-mail și site.")
                StepRow(number: 3, text: "Urmezi pașii și strângi documentele din listă.")
            }
            .padding(Spacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Palette.surfaceLow, in: RoundedRectangle(cornerRadius: 16))
        }
    }
}

private struct HeroPill: View {
    let symbol: String
    let text: String

    var body: some View {
        Label(text, systemImage: symbol)
            .font(.footnote.weight(.medium))
            .foregroundStyle(.white)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(.white.opacity(0.16), in: Capsule())
    }
}

private struct TrailingIconLabelStyle: LabelStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack(spacing: Spacing.sm) {
            configuration.title
            configuration.icon
        }
    }
}
