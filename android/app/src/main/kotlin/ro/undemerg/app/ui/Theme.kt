package ro.undemerg.app.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ro.undemerg.app.R

/**
 * Sistem de design "Accessible & Ethical" pentru servicii publice:
 * navy + albastru de încredere, contrast peste 4.5:1, font Atkinson Hyperlegible.
 */

/** Scala de spațiere 4/8dp. */
object Spacing {
    val xs = 4.dp
    val sm = 8.dp
    val md = 16.dp
    val lg = 24.dp
    val xl = 32.dp
}

/** Dimensiune minimă pentru ținte tactile (Material: 48dp). */
val MinTouch = 48.dp

private val LightColors = lightColorScheme(
    primary = Color(0xFF0369A1),
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFE0F2FE),
    onPrimaryContainer = Color(0xFF0C4A6E),
    secondary = Color(0xFF334155),
    onSecondary = Color(0xFFFFFFFF),
    secondaryContainer = Color(0xFFE2E8F0),
    onSecondaryContainer = Color(0xFF0F172A),
    tertiary = Color(0xFF0F766E),
    onTertiary = Color(0xFFFFFFFF),
    tertiaryContainer = Color(0xFFCCFBF1),
    onTertiaryContainer = Color(0xFF134E4A),
    background = Color(0xFFF8FAFC),
    onBackground = Color(0xFF0F172A),
    surface = Color(0xFFF8FAFC),
    onSurface = Color(0xFF0F172A),
    surfaceVariant = Color(0xFFE8ECF1),
    onSurfaceVariant = Color(0xFF475569),
    outline = Color(0xFF64748B),
    outlineVariant = Color(0xFFCBD5E1),
    error = Color(0xFFB91C1C),
    onError = Color(0xFFFFFFFF),
    errorContainer = Color(0xFFFEE2E2),
    onErrorContainer = Color(0xFF7F1D1D),
    surfaceContainerLowest = Color(0xFFFFFFFF),
    surfaceContainerLow = Color(0xFFF1F5F9),
    surfaceContainer = Color(0xFFF1F5F9),
    surfaceContainerHigh = Color(0xFFE8ECF1),
    surfaceContainerHighest = Color(0xFFE2E8F0),
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF7DD3FC),
    onPrimary = Color(0xFF082F49),
    primaryContainer = Color(0xFF0C4A6E),
    onPrimaryContainer = Color(0xFFE0F2FE),
    secondary = Color(0xFFCBD5E1),
    onSecondary = Color(0xFF0F172A),
    secondaryContainer = Color(0xFF334155),
    onSecondaryContainer = Color(0xFFE2E8F0),
    tertiary = Color(0xFF5EEAD4),
    onTertiary = Color(0xFF042F2E),
    tertiaryContainer = Color(0xFF115E59),
    onTertiaryContainer = Color(0xFFCCFBF1),
    background = Color(0xFF0B1220),
    onBackground = Color(0xFFE2E8F0),
    surface = Color(0xFF0B1220),
    onSurface = Color(0xFFE2E8F0),
    surfaceVariant = Color(0xFF1E293B),
    onSurfaceVariant = Color(0xFFCBD5E1),
    outline = Color(0xFF94A3B8),
    outlineVariant = Color(0xFF334155),
    error = Color(0xFFFCA5A5),
    onError = Color(0xFF450A0A),
    errorContainer = Color(0xFF7F1D1D),
    onErrorContainer = Color(0xFFFEE2E2),
    surfaceContainerLowest = Color(0xFF0B1220),
    surfaceContainerLow = Color(0xFF111A2B),
    surfaceContainer = Color(0xFF162033),
    surfaceContainerHigh = Color(0xFF1E293B),
    surfaceContainerHighest = Color(0xFF273449),
)

private fun atkinson(weight: Int) = Font(
    resId = R.font.atkinson_next,
    weight = FontWeight(weight),
    variationSettings = FontVariation.Settings(FontVariation.weight(weight)),
)

private val Atkinson = FontFamily(atkinson(400), atkinson(500), atkinson(700))

private fun style(size: Int, line: Int, weight: Int) = TextStyle(
    fontFamily = Atkinson,
    fontWeight = FontWeight(weight),
    fontSize = size.sp,
    lineHeight = line.sp,
)

private val AppTypography = Typography(
    headlineLarge = style(32, 40, 700),
    headlineMedium = style(28, 36, 700),
    headlineSmall = style(24, 32, 700),
    titleLarge = style(22, 28, 700),
    titleMedium = style(18, 26, 700),
    titleSmall = style(16, 24, 700),
    bodyLarge = style(17, 26, 400), // peste 16sp: citire confortabilă pe mobil
    bodyMedium = style(16, 24, 400),
    bodySmall = style(14, 20, 400),
    labelLarge = style(16, 24, 500),
    labelMedium = style(14, 20, 500),
    labelSmall = style(12, 16, 500),
)

private val AppShapes = Shapes(
    extraSmall = androidx.compose.foundation.shape.RoundedCornerShape(8.dp),
    small = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
    medium = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
    large = androidx.compose.foundation.shape.RoundedCornerShape(20.dp),
    extraLarge = androidx.compose.foundation.shape.RoundedCornerShape(28.dp),
)

@Composable
fun UndeMergTheme(content: @Composable () -> Unit) {
    val colors: ColorScheme = if (isSystemInDarkTheme()) DarkColors else LightColors
    MaterialTheme(
        colorScheme = colors,
        typography = AppTypography,
        shapes = AppShapes,
        content = content,
    )
}
