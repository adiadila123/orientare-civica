package ro.undemerg.app.ui

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.HorizontalDivider
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.Balance
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CellTower
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.HealthAndSafety
import androidx.compose.material.icons.filled.LocalPolice
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.filled.Work
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.PriorityHigh
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import ro.undemerg.app.data.Institution
import ro.undemerg.app.data.TriageResponse

fun Context.open(uri: String, action: String = Intent.ACTION_VIEW) {
    runCatching {
        startActivity(Intent(action, Uri.parse(uri)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
}

// ---------- Texte și etichete ----------

private val CategoryLabels = mapOf(
    "fiscal" to "Fiscal",
    "energie" to "Energie",
    "telecomunicatii" to "Telecomunicații",
    "protectia_consumatorului" to "Protecția consumatorului",
    "ombudsman" to "Avocatul Poporului",
    "sanatate" to "Sănătate",
    "ordine_publica" to "Ordine publică",
    "discriminare" to "Discriminare",
    "circulatie_rutiera" to "Circulație rutieră",
    "munca" to "Muncă",
    "administratie_locala" to "Administrație locală",
)

/** Transformă cheia din baza de date într-o etichetă citibilă în română. */
fun categoryLabel(raw: String): String =
    CategoryLabels[raw.lowercase()]
        ?: raw.replace('_', ' ').replaceFirstChar { it.uppercase() }

private fun channelLabel(channel: String) = when (channel) {
    "online" -> "Online"
    "telefon" -> "Telefon"
    "fizic" -> "La ghișeu"
    else -> channel
}

private fun channelIcon(channel: String) = when (channel) {
    "online" -> Icons.Filled.Language
    "telefon" -> Icons.Filled.Phone
    else -> Icons.Filled.Business
}

private fun urgencyLabel(urgency: String) = when (urgency) {
    "high" -> "Urgent"
    "low" -> "Fără grabă"
    else -> "Prioritate normală"
}

private fun urgencyIcon(urgency: String) = when (urgency) {
    "high" -> Icons.Filled.PriorityHigh
    "low" -> Icons.Filled.Check
    else -> Icons.Filled.Schedule
}

// ---------- Blocuri de bază ----------

@Composable
fun ScreenHeader(title: String, subtitle: String? = null) {
    Column(verticalArrangement = Arrangement.spacedBy(Spacing.sm)) {
        Text(
            title,
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onBackground,
            modifier = Modifier.semantics { heading() },
        )
        if (subtitle != null) {
            Text(
                subtitle,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
fun SectionTitle(text: String) {
    Text(
        text,
        style = MaterialTheme.typography.titleMedium,
        color = MaterialTheme.colorScheme.onBackground,
        modifier = Modifier.padding(top = Spacing.sm).semantics { heading() },
    )
}

/** Cerc tintat cu un icon, folosit în carduri și în stări goale. */
@Composable
fun IconBadge(
    icon: ImageVector,
    modifier: Modifier = Modifier,
    container: Color = MaterialTheme.colorScheme.primaryContainer,
    content: Color = MaterialTheme.colorScheme.onPrimaryContainer,
) {
    Box(
        modifier = modifier.size(44.dp),
        contentAlignment = Alignment.Center,
    ) {
        Surface(shape = CircleShape, color = container, modifier = Modifier.size(44.dp)) {}
        Icon(icon, contentDescription = null, tint = content, modifier = Modifier.size(24.dp))
    }
}

/** Etichetă informativă: întotdeauna icon + text, nu doar culoare. */
@Composable
fun InfoPill(
    icon: ImageVector,
    text: String,
    container: Color = MaterialTheme.colorScheme.secondaryContainer,
    content: Color = MaterialTheme.colorScheme.onSecondaryContainer,
) {
    Surface(shape = MaterialTheme.shapes.extraLarge, color = container, contentColor = content) {
        Row(
            Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Icon(icon, contentDescription = null, modifier = Modifier.size(18.dp))
            Text(text, style = MaterialTheme.typography.labelMedium)
        }
    }
}

@Composable
fun EmptyState(icon: ImageVector, title: String, message: String) {
    Column(
        Modifier.fillMaxWidth().padding(vertical = Spacing.xl),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(Spacing.sm),
    ) {
        IconBadge(icon)
        Text(title, style = MaterialTheme.typography.titleMedium)
        Text(
            message,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
fun ErrorBanner(message: String, onRetry: (() -> Unit)? = null) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.errorContainer,
            contentColor = MaterialTheme.colorScheme.onErrorContainer,
        ),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(Modifier.padding(Spacing.md), verticalArrangement = Arrangement.spacedBy(Spacing.sm)) {
            Row(horizontalArrangement = Arrangement.spacedBy(Spacing.sm), verticalAlignment = Alignment.Top) {
                Icon(Icons.Filled.ErrorOutline, contentDescription = null)
                Text(message, style = MaterialTheme.typography.bodyMedium)
            }
            if (onRetry != null) {
                OutlinedButton(
                    onClick = onRetry,
                    modifier = Modifier.heightIn(min = MinTouch),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.onErrorContainer),
                ) { Text("Reîncearcă", color = MaterialTheme.colorScheme.onErrorContainer) }
            }
        }
    }
}

@Composable
fun StepRow(number: Int, text: String) {
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Top) {
        Box(Modifier.size(32.dp), contentAlignment = Alignment.Center) {
            Surface(shape = CircleShape, color = MaterialTheme.colorScheme.primary, modifier = Modifier.size(32.dp)) {}
            Text(
                "$number",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onPrimary,
            )
        }
        Text(
            text,
            style = MaterialTheme.typography.bodyLarge,
            modifier = Modifier.weight(1f).padding(top = 3.dp),
        )
    }
}

@Composable
fun CheckRow(text: String) {
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Top) {
        Icon(
            Icons.Filled.CheckCircle,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.tertiary,
            modifier = Modifier.size(24.dp),
        )
        Text(text, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f))
    }
}

// ---------- Rezultatul triajului ----------

@Composable
fun TriageResultView(result: TriageResponse, onOpenInstitution: (String) -> Unit) {
    val percent = (result.confidence * 100).toInt()
    Column(verticalArrangement = Arrangement.spacedBy(Spacing.md)) {
        Card(
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.primaryContainer,
                contentColor = MaterialTheme.colorScheme.onPrimaryContainer,
            ),
            shape = MaterialTheme.shapes.large,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(Modifier.padding(Spacing.md), verticalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    IconBadge(
                        Icons.Filled.AccountBalance,
                        container = MaterialTheme.colorScheme.primary,
                        content = MaterialTheme.colorScheme.onPrimary,
                    )
                    Column(Modifier.weight(1f)) {
                        Text("Te adresezi la", style = MaterialTheme.typography.labelMedium)
                        Text(
                            result.institution?.name ?: result.institution_type,
                            style = MaterialTheme.typography.titleLarge,
                        )
                    }
                }
                Text(result.explanation, style = MaterialTheme.typography.bodyLarge)
                FlowPills {
                    InfoPill(
                        urgencyIcon(result.urgency),
                        urgencyLabel(result.urgency),
                        container = MaterialTheme.colorScheme.surfaceContainerLowest,
                        content = MaterialTheme.colorScheme.onSurface,
                    )
                    InfoPill(
                        channelIcon(result.recommended_channel),
                        channelLabel(result.recommended_channel),
                        container = MaterialTheme.colorScheme.surfaceContainerLowest,
                        content = MaterialTheme.colorScheme.onSurface,
                    )
                }
                Column(
                    verticalArrangement = Arrangement.spacedBy(4.dp),
                    modifier = Modifier.semantics { contentDescription = "Încredere analiză: $percent la sută" },
                ) {
                    Text("Încredere în analiză: $percent%", style = MaterialTheme.typography.labelMedium)
                    LinearProgressIndicator(
                        progress = { result.confidence.toFloat().coerceIn(0f, 1f) },
                        modifier = Modifier.fillMaxWidth().heightIn(min = 8.dp),
                        trackColor = MaterialTheme.colorScheme.surfaceContainerLowest,
                    )
                }
            }
        }

        if (result.confidence < 0.7) {
            Surface(
                shape = MaterialTheme.shapes.medium,
                color = MaterialTheme.colorScheme.errorContainer,
                contentColor = MaterialTheme.colorScheme.onErrorContainer,
            ) {
                Row(
                    Modifier.padding(Spacing.md),
                    horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
                    verticalAlignment = Alignment.Top,
                ) {
                    Icon(Icons.Filled.Info, contentDescription = null)
                    Text(
                        "Încrederea e scăzută. Verifică direct cu instituția înainte să faci pașii de mai jos.",
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
            }
        }

        if (result.next_steps.isNotEmpty()) {
            SectionTitle("Pașii de urmat")
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                result.next_steps.forEachIndexed { index, step -> StepRow(index + 1, step) }
            }
        }
        if (result.required_documents.isNotEmpty()) {
            SectionTitle("Documente necesare")
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                result.required_documents.forEach { CheckRow(it) }
            }
        }
        result.institution?.let { institution ->
            SectionTitle("Contact")
            InstitutionContact(institution)
            OutlinedButton(
                onClick = { onOpenInstitution(institution.code) },
                modifier = Modifier.fillMaxWidth().heightIn(min = MinTouch),
            ) { Text("Vezi toate detaliile instituției") }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun FlowPills(content: @Composable () -> Unit) {
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
        verticalArrangement = Arrangement.spacedBy(Spacing.sm),
    ) { content() }
}

@Composable
fun InstitutionContact(institution: Institution, showAddress: Boolean = true, showWait: Boolean = true) {
    val context = LocalContext.current
    Column(verticalArrangement = Arrangement.spacedBy(Spacing.sm)) {
        if (showAddress) institution.address?.let {
            Text(it, style = MaterialTheme.typography.bodyLarge)
        }
        if (showWait) institution.wait_time_minutes?.let {
            InfoPill(Icons.Filled.Schedule, "Așteptare estimată: $it min")
        }
        @OptIn(ExperimentalLayoutApi::class)
        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
            verticalArrangement = Arrangement.spacedBy(Spacing.sm),
        ) {
            institution.phone?.let { phone ->
                Button(
                    onClick = { context.open("tel:$phone", Intent.ACTION_DIAL) },
                    modifier = Modifier.heightIn(min = MinTouch),
                ) {
                    Icon(Icons.Filled.Phone, contentDescription = null, modifier = Modifier.size(18.dp))
                    Text("  Sună", fontWeight = FontWeight.Medium)
                }
            }
            institution.email?.let { email ->
                FilledTonalButton(
                    onClick = { context.open("mailto:$email", Intent.ACTION_SENDTO) },
                    modifier = Modifier.heightIn(min = MinTouch),
                ) {
                    Icon(Icons.Filled.Email, contentDescription = null, modifier = Modifier.size(18.dp))
                    Text("  E-mail")
                }
            }
            (institution.contact_form_url ?: institution.website_url)?.let { url ->
                FilledTonalButton(
                    onClick = { context.open(url) },
                    modifier = Modifier.heightIn(min = MinTouch),
                ) {
                    Icon(Icons.Filled.Public, contentDescription = null, modifier = Modifier.size(18.dp))
                    Text("  Site")
                }
            }
        }
    }
}


// ---------- Domenii: iconiță + culoare per categorie ----------

/** Aspectul unui domeniu (fiscal, energie…), folosit consecvent în liste, detalii și hartă. */
data class CategoryStyle(val icon: ImageVector, val light: Color, val dark: Color)

private val DefaultCategory = CategoryStyle(Icons.Filled.AccountBalance, Color(0xFF0369A1), Color(0xFF7DD3FC))

private val CategoryStyles = mapOf(
    "fiscal" to CategoryStyle(Icons.Filled.Payments, Color(0xFF0F766E), Color(0xFF5EEAD4)),
    "energie" to CategoryStyle(Icons.Filled.Bolt, Color(0xFFB45309), Color(0xFFFCD34D)),
    "telecomunicatii" to CategoryStyle(Icons.Filled.CellTower, Color(0xFF4338CA), Color(0xFFA5B4FC)),
    "protectia_consumatorului" to CategoryStyle(Icons.Filled.ShoppingCart, Color(0xFFBE123C), Color(0xFFFDA4AF)),
    "ombudsman" to CategoryStyle(Icons.Filled.Balance, Color(0xFF6D28D9), Color(0xFFC4B5FD)),
    "sanatate" to CategoryStyle(Icons.Filled.HealthAndSafety, Color(0xFF15803D), Color(0xFF86EFAC)),
    "ordine_publica" to CategoryStyle(Icons.Filled.LocalPolice, Color(0xFF1D4ED8), Color(0xFF93C5FD)),
    "discriminare" to CategoryStyle(Icons.Filled.Groups, Color(0xFF475569), Color(0xFFCBD5E1)),
    "circulatie_rutiera" to CategoryStyle(Icons.Filled.DirectionsCar, Color(0xFF15803D), Color(0xFF86EFAC)),
    "munca" to CategoryStyle(Icons.Filled.Work, Color(0xFF6D28D9), Color(0xFFC4B5FD)),
    "administratie_locala" to CategoryStyle(Icons.Filled.AccountBalance, Color(0xFF0369A1), Color(0xFF7DD3FC)),
)

fun categoryStyle(category: String?): CategoryStyle =
    category?.let { CategoryStyles[it.lowercase()] } ?: DefaultCategory

/** Iconița unui domeniu într-un cerc tintat cu culoarea lui. */
@Composable
fun CategoryBadge(category: String?, modifier: Modifier = Modifier, size: Int = 44) {
    val style = categoryStyle(category)
    val tint = if (isSystemInDarkTheme()) style.dark else style.light
    Box(modifier.size(size.dp), contentAlignment = Alignment.Center) {
        Surface(shape = CircleShape, color = tint.copy(alpha = 0.16f), modifier = Modifier.size(size.dp)) {}
        Icon(style.icon, contentDescription = null, tint = tint, modifier = Modifier.size((size * 0.55f).dp))
    }
}

// ---------- Rânduri de detalii ----------

/** Rând cu iconiță, etichetă și valoare; devine atingibil dacă are `onClick`. */
@Composable
fun DetailRow(icon: ImageVector, label: String, value: String, onClick: (() -> Unit)? = null) {
    Row(
        Modifier
            .fillMaxWidth()
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
            .heightIn(min = 60.dp)
            .padding(horizontal = Spacing.md, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(24.dp))
        Column(Modifier.weight(1f)) {
            Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(value, style = MaterialTheme.typography.bodyLarge)
        }
        if (onClick != null) {
            Icon(
                Icons.AutoMirrored.Filled.KeyboardArrowRight,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

/** Card care grupează rânduri, separate printr-o linie fină. */
@Composable
fun GroupedCard(title: String? = null, content: @Composable () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(Spacing.sm)) {
        if (title != null) SectionTitle(title)
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerLowest),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
            modifier = Modifier.fillMaxWidth(),
        ) { content() }
    }
}

@Composable
fun RowDivider() = HorizontalDivider(
    color = MaterialTheme.colorScheme.outlineVariant,
    modifier = Modifier.padding(start = 54.dp),
)
