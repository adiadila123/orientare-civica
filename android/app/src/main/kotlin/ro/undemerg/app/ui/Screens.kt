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
            IconBadge(Icons.Filled.AccountBalance)
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

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(ScreenPadding),
        verticalArrangement = Arrangement.spacedBy(Spacing.md),
    ) {
        if (institution == null) {
            EmptyState(Icons.Filled.AccountBalance, "Instituția nu a fost găsită", "Întoarce-te la listă și încearcă din nou.")
        } else {
            ScreenHeader(institution.name)
            institution.category?.let {
                InfoPill(Icons.Filled.AccountBalance, categoryLabel(it),
                    container = MaterialTheme.colorScheme.primaryContainer,
                    content = MaterialTheme.colorScheme.onPrimaryContainer)
            }
            institution.description?.let { Text(it, style = MaterialTheme.typography.bodyLarge) }
            institution.associated_court?.let {
                Text("Instanță competentă: $it", style = MaterialTheme.typography.bodyMedium)
            }
            SectionTitle("Contact")
            InstitutionContact(institution)
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
