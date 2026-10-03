package ro.undemerg.app.ui

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import ro.undemerg.app.data.Institution
import ro.undemerg.app.data.TriageResponse

fun Context.open(uri: String, action: String = Intent.ACTION_VIEW) {
    runCatching {
        startActivity(Intent(action, Uri.parse(uri)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
}

private fun channelLabel(channel: String) = when (channel) {
    "online" -> "Online"
    "telefon" -> "Telefon"
    "fizic" -> "La ghișeu"
    else -> channel
}

private fun urgencyLabel(urgency: String) = when (urgency) {
    "high" -> "Urgent"
    "low" -> "Fără grabă"
    else -> "Normal"
}

@Composable
fun SectionTitle(text: String) {
    Text(text, style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(top = 8.dp))
}

@Composable
fun NumberedList(items: List<String>) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        items.forEachIndexed { index, item -> Text("${index + 1}. $item") }
    }
}

@Composable
fun TriageResultView(result: TriageResponse, onOpenInstitution: (String) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Card(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(result.institution?.name ?: result.institution_type, style = MaterialTheme.typography.titleLarge)
                Text(
                    "${urgencyLabel(result.urgency)} · ${channelLabel(result.recommended_channel)} · " +
                        "încredere ${(result.confidence * 100).toInt()}%",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.primary,
                )
                Text(result.explanation)
                if (result.confidence < 0.7) {
                    Text(
                        "Încrederea e scăzută — verifică direct cu instituția.",
                        color = MaterialTheme.colorScheme.error,
                    )
                }
            }
        }
        if (result.next_steps.isNotEmpty()) {
            SectionTitle("Pașii de urmat")
            NumberedList(result.next_steps)
        }
        if (result.required_documents.isNotEmpty()) {
            SectionTitle("Documente necesare")
            NumberedList(result.required_documents)
        }
        result.institution?.let { institution ->
            SectionTitle("Contact")
            InstitutionContact(institution)
            OutlinedButton(onClick = { onOpenInstitution(institution.code) }, modifier = Modifier.fillMaxWidth()) {
                Text("Vezi detalii instituție")
            }
        }
    }
}

@Composable
fun InstitutionContact(institution: Institution) {
    val context = LocalContext.current
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        institution.address?.let { Text(it) }
        institution.wait_time_minutes?.let { Text("Timp de așteptare estimat: $it min") }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
            institution.phone?.let { phone ->
                OutlinedButton(onClick = { context.open("tel:$phone", Intent.ACTION_DIAL) }) { Text("Sună") }
            }
            institution.email?.let { email ->
                OutlinedButton(onClick = { context.open("mailto:$email", Intent.ACTION_SENDTO) }) { Text("E-mail") }
            }
            (institution.contact_form_url ?: institution.website_url)?.let { url ->
                OutlinedButton(onClick = { context.open(url) }) { Text("Site") }
            }
        }
    }
}
