package ro.undemerg.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.Explore
import androidx.compose.material.icons.filled.FolderOpen
import androidx.compose.material.icons.filled.Gavel
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material.icons.filled.Work
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp

private val HeroTop = Color(0xFF0B3A5B)
private val HeroBottom = Color(0xFF0369A1)

/** Un subiect frecvent: atingerea lui completează începutul descrierii. */
private data class Topic(
    val title: String,
    val hint: String,
    val starter: String,
    val icon: ImageVector,
    val lightTint: Color,
    val darkTint: Color,
)

private val Topics = listOf(
    Topic("Amenzi", "Contestă un proces-verbal", "Am primit o amendă de la Poliția Locală și nu sunt de acord.",
        Icons.Filled.Gavel, Color(0xFF0369A1), Color(0xFF7DD3FC)),
    Topic("Facturi", "Curent, gaz, internet", "Factura la curent este mult prea mare și nu înțeleg de ce.",
        Icons.Filled.Bolt, Color(0xFFB45309), Color(0xFFFCD34D)),
    Topic("Taxe și impozite", "ANAF și fiscalitate", "Am o problemă cu o taxă sau un impozit pe care îl datorez la ANAF.",
        Icons.Filled.Payments, Color(0xFF0F766E), Color(0xFF5EEAD4)),
    Topic("Cazier", "Certificat judiciar", "Am nevoie de un certificat de cazier judiciar pentru angajare.",
        Icons.Filled.Verified, Color(0xFF4338CA), Color(0xFFA5B4FC)),
    Topic("Cumpărături", "Produse și servicii", "Am cumpărat un produs online și nu am primit ce am comandat.",
        Icons.Filled.ShoppingCart, Color(0xFFBE123C), Color(0xFFFDA4AF)),
    Topic("Mașină și permis", "Înmatriculare, permis", "Vreau să preschimb permisul de conducere.",
        Icons.Filled.DirectionsCar, Color(0xFF15803D), Color(0xFF86EFAC)),
    Topic("Muncă", "Drepturi la locul de muncă", "Angajatorul meu nu îmi respectă drepturile din contract.",
        Icons.Filled.Work, Color(0xFF6D28D9), Color(0xFFC4B5FD)),
    Topic("Discriminare", "Tratament nedrept", "Am fost tratat diferit și nejustificat din cauza unui criteriu personal.",
        Icons.Filled.Groups, Color(0xFF475569), Color(0xFFCBD5E1)),
)

@Composable
private fun HeroCard() {
    Box(
        Modifier
            .fillMaxWidth()
            .clip(MaterialTheme.shapes.extraLarge)
            .background(Brush.linearGradient(listOf(HeroTop, HeroBottom))),
    ) {
        // Element decorativ discret, ascuns pentru cititoarele de ecran.
        Icon(
            Icons.Filled.AccountBalance,
            contentDescription = null,
            tint = Color.White,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .offset(x = 28.dp, y = 28.dp)
                .size(150.dp)
                .alpha(0.10f),
        )
        Column(Modifier.padding(Spacing.lg), verticalArrangement = Arrangement.spacedBy(Spacing.md)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Box(
                    Modifier.size(48.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.18f)),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Filled.Explore, contentDescription = null, tint = Color.White, modifier = Modifier.size(28.dp))
                }
                Text(
                    "Unde merg?",
                    style = MaterialTheme.typography.headlineMedium,
                    color = Color.White,
                )
            }
            Text(
                "Spune-ne problema ta. Îți arătăm instituția potrivită, documentele de care ai nevoie și pașii de urmat.",
                style = MaterialTheme.typography.bodyLarge,
                color = Color.White.copy(alpha = 0.92f),
            )
            @OptIn(ExperimentalLayoutApi::class)
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
                verticalArrangement = Arrangement.spacedBy(Spacing.sm),
            ) {
                HeroPill(Icons.Filled.AttachMoney, "Gratuit")
                HeroPill(Icons.Filled.Lock, "Fără cont")
                HeroPill(Icons.Filled.FolderOpen, "Datele rămân pe telefon")
            }
        }
    }
}

@Composable
private fun HeroPill(icon: ImageVector, text: String) {
    Row(
        Modifier
            .clip(MaterialTheme.shapes.extraLarge)
            .background(Color.White.copy(alpha = 0.16f))
            .padding(horizontal = 12.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Icon(icon, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
        Text(text, style = MaterialTheme.typography.labelMedium, color = Color.White)
    }
}

@Composable
private fun TopicTile(topic: Topic, modifier: Modifier, onClick: () -> Unit) {
    val tint = if (isSystemInDarkTheme()) topic.darkTint else topic.lightTint
    Card(
        onClick = onClick,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerLowest),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        modifier = modifier.heightIn(min = 112.dp),
    ) {
        Column(Modifier.padding(Spacing.md), verticalArrangement = Arrangement.spacedBy(Spacing.sm)) {
            IconBadge(topic.icon, container = tint.copy(alpha = 0.16f), content = tint)
            Column {
                Text(topic.title, style = MaterialTheme.typography.titleSmall)
                Text(
                    topic.hint,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

@Composable
private fun HowItWorks() {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerLow),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(Modifier.padding(Spacing.md), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            StepRow(1, "Descrie pe scurt ce s-a întâmplat, cu cuvintele tale.")
            StepRow(2, "Primești instituția potrivită, cu telefon, e-mail și site.")
            StepRow(3, "Urmezi pașii și strângi documentele din listă.")
        }
    }
}

@Composable
fun TriageScreen(vm: AppViewModel, onOpenInstitution: (String) -> Unit) {
    val state by vm.triage.collectAsState()
    val showHome = state.result == null && !state.loading

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = Spacing.md, vertical = Spacing.md),
        verticalArrangement = Arrangement.spacedBy(Spacing.md),
    ) {
        HeroCard()

        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerLowest),
            border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            shape = MaterialTheme.shapes.large,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(Modifier.padding(Spacing.md), verticalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                OutlinedTextField(
                    value = state.description,
                    onValueChange = vm::onDescriptionChange,
                    label = { Text("Descrie problema ta") },
                    supportingText = { Text("${state.description.length}/$MAX_DESCRIPTION_LENGTH") },
                    minLines = 3,
                    shape = MaterialTheme.shapes.medium,
                    modifier = Modifier.fillMaxWidth(),
                )
                Row(horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                    Button(
                        onClick = vm::analyze,
                        enabled = state.description.isNotBlank() && !state.loading,
                        modifier = Modifier.weight(1f).heightIn(min = 52.dp),
                    ) {
                        Text("Află unde mergi")
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowForward,
                            contentDescription = null,
                            modifier = Modifier.padding(start = Spacing.sm),
                        )
                    }
                    if (state.result != null || state.error != null) {
                        OutlinedButton(onClick = vm::resetTriage, modifier = Modifier.heightIn(min = 52.dp)) {
                            Text("Nouă")
                        }
                    }
                }
            }
        }

        if (state.loading) {
            Column(verticalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                LinearProgressIndicator(Modifier.fillMaxWidth())
                Text(
                    "Analizez problema… poate dura câteva secunde.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        state.error?.let { ErrorBanner(it, onRetry = vm::analyze) }

        if (showHome) {
            SectionTitle("Alege un subiect")
            Column(verticalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                Topics.chunked(2).forEach { pair ->
                    Row(horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                        pair.forEach { topic ->
                            TopicTile(topic, Modifier.weight(1f)) { vm.onDescriptionChange(topic.starter) }
                        }
                    }
                }
            }
            SectionTitle("Cum funcționează")
            HowItWorks()
        }

        state.result?.let { result ->
            TriageResultView(result, onOpenInstitution)
            Button(
                onClick = vm::saveCurrentResult,
                enabled = state.savedId == null,
                modifier = Modifier.fillMaxWidth().heightIn(min = 52.dp),
            ) {
                Icon(Icons.Filled.FolderOpen, contentDescription = null)
                Text(if (state.savedId == null) "  Salvează în Dosarele mele" else "  Salvat pe telefon")
            }
        }
    }
}
