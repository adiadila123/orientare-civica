import SwiftUI

// Sistem de design „Accessible & Ethical”: navy + albastru de încredere, contrast peste 4.5:1.
// Aceeași paletă ca pe Android; pe iOS folosim fontul sistemului (respectă Dynamic Type).

extension Color {
    /// Culoare care se adaptează automat la tema luminoasă/întunecată.
    init(light: UInt32, dark: UInt32) {
        self.init(uiColor: UIColor { traits in
            UIColor(hex: traits.userInterfaceStyle == .dark ? dark : light)
        })
    }

    init(hex: UInt32) { self.init(uiColor: UIColor(hex: hex)) }
}

extension UIColor {
    convenience init(hex: UInt32) {
        self.init(
            red: CGFloat((hex >> 16) & 0xFF) / 255,
            green: CGFloat((hex >> 8) & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255,
            alpha: 1
        )
    }
}

enum Palette {
    static let primary = Color(light: 0x0369A1, dark: 0x7DD3FC)
    static let onPrimary = Color(light: 0xFFFFFF, dark: 0x082F49)
    static let primaryContainer = Color(light: 0xE0F2FE, dark: 0x0C4A6E)
    static let onPrimaryContainer = Color(light: 0x0C4A6E, dark: 0xE0F2FE)
    static let secondaryContainer = Color(light: 0xE2E8F0, dark: 0x334155)
    static let tertiary = Color(light: 0x0F766E, dark: 0x5EEAD4)
    static let background = Color(light: 0xF8FAFC, dark: 0x0B1220)
    static let surface = Color(light: 0xFFFFFF, dark: 0x111A2B)
    static let surfaceLow = Color(light: 0xF1F5F9, dark: 0x162033)
    static let onSurface = Color(light: 0x0F172A, dark: 0xE2E8F0)
    static let onSurfaceVariant = Color(light: 0x475569, dark: 0xCBD5E1)
    static let outline = Color(light: 0xCBD5E1, dark: 0x334155)
    static let error = Color(light: 0xB91C1C, dark: 0xFCA5A5)
    static let errorContainer = Color(light: 0xFEE2E2, dark: 0x7F1D1D)
    static let onErrorContainer = Color(light: 0x7F1D1D, dark: 0xFEE2E2)
    static let heroTop = Color(hex: 0x0B3A5B)
    static let heroBottom = Color(hex: 0x0369A1)
}

enum Spacing {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 16
    static let lg: CGFloat = 24
    static let xl: CGFloat = 32
}

/// Ținta tactilă minimă (Apple HIG: 44pt).
let minTouch: CGFloat = 48

// MARK: - Domenii: iconiță + culoare

struct CategoryStyle {
    let symbol: String
    let tint: Color
}

enum Categories {
    private static let styles: [String: CategoryStyle] = [
        "fiscal": .init(symbol: "banknote.fill", tint: Color(light: 0x0F766E, dark: 0x5EEAD4)),
        "energie": .init(symbol: "bolt.fill", tint: Color(light: 0xB45309, dark: 0xFCD34D)),
        "telecomunicatii": .init(symbol: "antenna.radiowaves.left.and.right", tint: Color(light: 0x4338CA, dark: 0xA5B4FC)),
        "protectia_consumatorului": .init(symbol: "cart.fill", tint: Color(light: 0xBE123C, dark: 0xFDA4AF)),
        "ombudsman": .init(symbol: "scalemass.fill", tint: Color(light: 0x6D28D9, dark: 0xC4B5FD)),
        "sanatate": .init(symbol: "cross.case.fill", tint: Color(light: 0x15803D, dark: 0x86EFAC)),
        "ordine_publica": .init(symbol: "shield.lefthalf.filled", tint: Color(light: 0x1D4ED8, dark: 0x93C5FD)),
        "discriminare": .init(symbol: "person.3.fill", tint: Color(light: 0x475569, dark: 0xCBD5E1)),
        "circulatie_rutiera": .init(symbol: "car.fill", tint: Color(light: 0x15803D, dark: 0x86EFAC)),
        "munca": .init(symbol: "briefcase.fill", tint: Color(light: 0x6D28D9, dark: 0xC4B5FD)),
        "administratie_locala": .init(symbol: "building.columns.fill", tint: Color(light: 0x0369A1, dark: 0x7DD3FC)),
    ]

    private static let labels: [String: String] = [
        "fiscal": "Fiscal",
        "energie": "Energie",
        "telecomunicatii": "Telecomunicații",
        "protectia_consumatorului": "Protecția consumatorului",
        "ombudsman": "Avocatul Poporului",
        "sanatate": "Sănătate",
        "ordine_publica": "Ordine publică",
        "discriminare": "Discriminare",
        "circulatie_rutiera": "Circulație rutieră",
        "munca": "Muncă",
        "administratie_locala": "Administrație locală",
    ]

    static func style(_ category: String?) -> CategoryStyle {
        category.flatMap { styles[$0.lowercased()] }
            ?? CategoryStyle(symbol: "building.columns.fill", tint: Palette.primary)
    }

    /// Transformă cheia din baza de date într-o etichetă citibilă în română.
    static func label(_ category: String) -> String {
        labels[category.lowercased()]
            ?? category.replacingOccurrences(of: "_", with: " ").capitalized
    }
}
