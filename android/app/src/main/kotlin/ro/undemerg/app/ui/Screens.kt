package ro.undemerg.app.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.Balance
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.FolderOpen
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import java.text.DateFormat
import java.util.Date
import java.util.Locale
import ro.undemerg.app.data.Institution

private val ScreenPadding = PaddingValues(horizontal = Spacing.md, vertical = Spacing.md)

@Composable
private fun InstitutionCard(institution: Institution, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerLowest),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        modifier = Modifier.fillMaxWidth().heightIn(min = 72.dp),
    ) {
        Row(
            Modifier.padding(Spacing.md),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            CategoryBadge(institution.category)
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(institution.name, style = MaterialTheme.typography.titleSmall)
                institution.category?.let {
                    Text(
                        categoryLabel(it),
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary,
                    )
                }
            }
            Icon(
                Icons.AutoMirrored.Filled.KeyboardArrowRight,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
fun InstitutionsScreen(vm: AppViewModel, onOpenInstitution: (String) -> Unit) {
    val state by vm.institutions.collectAsState()
    var query by rememberSaveable { mutableStateOf("") }
    val filtered = remember(state.items, query) {
        val q = query.trim().lowercase()
        if (q.isEmpty()) state.items
        else state.items.filter {
            it.name.lowercase().contains(q) ||
                it.code.lowercase().contains(q) ||
                (it.category?.let { c -> categoryLabel(c).lowercase().contains(q) } ?: false)
        }
    }

    Column(
        Modifier.fillMaxSize().padding(ScreenPadding),
        verticalArrangement = Arrangement.spacedBy(Spacing.md),
    ) {
        ScreenHeader("Instituții", "Găsește rapid datele de contact ale instituțiilor publice.")
        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            label = { Text("Caută după nume sau domeniu") },
            leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null) },
            singleLine = true,
            shape = MaterialTheme.shapes.medium,
            modifier = Modifier.fillMaxWidth(),
        )
        when {
            state.loading -> LinearProgressIndicator(Modifier.fillMaxWidth())
            state.error != null -> ErrorBanner(state.error!!, onRetry = vm::loadInstitutions)
            filtered.isEmpty() -> EmptyState(
                Icons.Filled.Search,
                "Nicio instituție găsită",
                "Încearcă un alt cuvânt, de exemplu „fiscal” sau „primărie”.",
            )
            else -> LazyColumn(
                verticalArrangement = Arrangement.spacedBy(Spacing.sm),
                contentPadding = PaddingValues(bottom = Spacing.md),
            ) {
                items(filtered, key = { it.id }) { institution ->
                    InstitutionCard(institution) { onOpenInstitution(institution.code) }
                }
            }
        }
    }
}

@Composable
fun InstitutionDetailScreen(vm: AppViewModel, code: String) {
    val state by vm.institutions.collectAsState()
    val institution = state.items.firstOrNull { it.code.equals(code, ignoreCase = true) }
    val context = androidx.compose.ui.platform.LocalContext.current

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(ScreenPadding),
        verticalArrangement = Arrangement.spacedBy(Spacing.md),
    ) {
        if (institution == null) {
            EmptyState(Icons.Filled.AccountBalance, "Instituția nu a fost găsită", "Întoarce-te la listă și încearcă din nou.")
            return@Column
        }

        // Antet: domeniul, numele și descrierea.
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
            shape = MaterialTheme.shapes.large,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(Modifier.padding(Spacing.md), verticalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                CategoryBadge(institution.category, size = 56)
                Text(
                    institution.name,
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                )
                institution.category?.let {
                    InfoPill(
                        categoryStyle(it).icon,
                        categoryLabel(it),
                        container = MaterialTheme.colorScheme.surfaceContainerLowest,
                        content = MaterialTheme.colorScheme.onSurface,
                    )
                }
                institution.description?.let {
                    Text(it, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onPrimaryContainer)
                }
            }
        }

        // Acțiuni rapide.
        InstitutionContact(institution, showAddress = false, showWait = false)

        val hasContactRows = institution.address != null || institution.phone != null ||
            institution.email != null || institution.website_url != null
        if (hasContactRows) {
            GroupedCard("Contact") {
                val rows = buildList<@Composable () -> Unit> {
                    institution.address?.let { address ->
                        add {
                            DetailRow(Icons.Filled.Place, "Adresă", address) {
                                context.open("geo:0,0?q=${android.net.Uri.encode(address)}")
                            }
                        }
                    }
                    institution.phone?.let { phone ->
                        add { DetailRow(Icons.Filled.Phone, "Telefon", phone) { context.open("tel:$phone", android.content.Intent.ACTION_DIAL) } }
                    }
                    institution.email?.let { email ->
                        add { DetailRow(Icons.Filled.Email, "E-mail", email) { context.open("mailto:$email", android.content.Intent.ACTION_SENDTO) } }
                    }
                    institution.website_url?.let { url ->
                        add { DetailRow(Icons.Filled.Public, "Site", url.removePrefix("https://").removePrefix("http://").trimEnd('/')) { context.open(url) } }
                    }
                }
                rows.forEachIndexed { index, row ->
                    if (index > 0) RowDivider()
                    row()
                }
            }
        }

        val infoRows = buildList<@Composable () -> Unit> {
            institution.wait_time_minutes?.let { add { DetailRow(Icons.Filled.Schedule, "Timp de așteptare estimat", "$it minute") } }
            institution.associated_court?.let { add { DetailRow(Icons.Filled.Balance, "Instanță competentă", it) } }
        }
        if (infoRows.isNotEmpty()) {
            GroupedCard("Bine de știut") {
                infoRows.forEachIndexed { index, row ->
                    if (index > 0) RowDivider()
                    row()
                }
            }
        }

        val paymentRows = buildList<@Composable () -> Unit> {
            institution.iban?.let { add { DetailRow(Icons.Filled.Payments, "IBAN", it) } }
            institution.cod_venit?.let { add { DetailRow(Icons.Filled.Payments, "Cod venit", it) } }
            institution.cui?.let { add { DetailRow(Icons.Filled.Payments, "CUI", it) } }
        }
        if (paymentRows.isNotEmpty()) {
            GroupedCard("Date pentru plăți") {
                paymentRows.forEachIndexed { index, row ->
                    if (index > 0) RowDivider()
                    row()
                }
            }
        }
    }
}

@Composable
fun RecordsScreen(vm: AppViewModel, onOpenRecord: (String) -> Unit) {
    val records by vm.records.collectAsState()
    val dateFormat = remember { DateFormat.getDateTimeInstance(DateFormat.MEDIUM, DateFormat.SHORT, Locale("ro", "RO")) }

    Column(
        Modifier.fillMaxSize().padding(ScreenPadding),
        verticalArrangement = Arrangement.spacedBy(Spacing.md),
    ) {
        ScreenHeader("Dosarele mele", "Analizele salvate rămân doar pe acest telefon.")
        if (records.isEmpty()) {
            EmptyState(
                Icons.Filled.FolderOpen,
                "Nu ai nicio analiză salvată",
                "După o analiză, apasă „Salvează în Dosarele mele” ca să o găsești aici.",
            )
        }
        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(Spacing.sm),
            contentPadding = PaddingValues(bottom = Spacing.md),
        ) {
            items(records, key = { it.id }) { record ->
                Card(
                    onClick = { onOpenRecord(record.id) },
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerLowest),
                    border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Row(
                        Modifier.padding(start = Spacing.md, top = Spacing.sm, bottom = Spacing.sm, end = Spacing.xs),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text(
                                record.result.institution?.name ?: record.result.institution_type,
                                style = MaterialTheme.typography.titleSmall,
                            )
                            Text(
                                record.description,
                                style = MaterialTheme.typography.bodyMedium,
                                maxLines = 2,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            Text(
                                dateFormat.format(Date(record.savedAtMillis)),
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                        IconButton(onClick = { vm.deleteRecord(record.id) }, modifier = Modifier.heightIn(min = MinTouch)) {
                            Icon(Icons.Filled.Delete, contentDescription = "Șterge analiza")
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun RecordDetailScreen(vm: AppViewModel, id: String, onOpenInstitution: (String) -> Unit) {
    val records by vm.records.collectAsState()
    val record = records.firstOrNull { it.id == id }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(ScreenPadding),
        verticalArrangement = Arrangement.spacedBy(Spacing.md),
    ) {
        if (record == null) {
            EmptyState(Icons.Filled.FolderOpen, "Analiza nu mai există", "A fost ștearsă din Dosarele mele.")
        } else {
            SectionTitle("Problema ta")
            Text(record.description, style = MaterialTheme.typography.bodyLarge)
            TriageResultView(record.result, onOpenInstitution)
        }
    }
}
