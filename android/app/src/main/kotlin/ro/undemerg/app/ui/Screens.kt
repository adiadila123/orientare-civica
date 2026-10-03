package ro.undemerg.app.ui

import android.content.Context
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import java.text.DateFormat
import java.util.Date
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import ro.undemerg.app.data.Institution

private val screenPadding = Modifier.padding(16.dp)

@Composable
fun TriageScreen(vm: AppViewModel, onOpenInstitution: (String) -> Unit) {
    val state by vm.triage.collectAsState()

    Column(
        modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).then(screenPadding),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("Unde merg?", style = MaterialTheme.typography.headlineMedium)
        Text("Descrie problema ta și îți spun la ce instituție să te adresezi, ce documente îți trebuie și ce pași urmezi.")

        OutlinedTextField(
            value = state.description,
            onValueChange = vm::onDescriptionChange,
            label = { Text("Ce problemă ai?") },
            supportingText = { Text("${state.description.length}/$MAX_DESCRIPTION_LENGTH") },
            minLines = 4,
            modifier = Modifier.fillMaxWidth(),
        )
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(
                onClick = vm::analyze,
                enabled = state.description.isNotBlank() && !state.loading,
            ) { Text("Analizează") }
            if (state.result != null || state.error != null) {
                OutlinedButton(onClick = vm::resetTriage) { Text("Problemă nouă") }
            }
        }

        if (state.loading) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                CircularProgressIndicator(Modifier.padding(4.dp))
                Text("Analizez problema…", Modifier.padding(top = 8.dp))
            }
        }
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }

        state.result?.let { result ->
            TriageResultView(result, onOpenInstitution)
            Button(
                onClick = vm::saveCurrentResult,
                enabled = state.savedId == null,
                modifier = Modifier.fillMaxWidth(),
            ) { Text(if (state.savedId == null) "Salvează în Dosarele mele" else "Salvat pe telefon") }
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
                (it.category?.lowercase()?.contains(q) ?: false)
        }
    }

    Column(Modifier.fillMaxSize().then(screenPadding), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Instituții", style = MaterialTheme.typography.headlineMedium)
        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            label = { Text("Caută instituție") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        when {
            state.loading -> CircularProgressIndicator()
            state.error != null -> {
                Text(state.error!!, color = MaterialTheme.colorScheme.error)
                OutlinedButton(onClick = vm::loadInstitutions) { Text("Reîncearcă") }
            }
            else -> LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(filtered, key = { it.id }) { institution ->
                    Card(Modifier.fillMaxWidth().clickable { onOpenInstitution(institution.code) }) {
                        Column(Modifier.padding(16.dp)) {
                            Text(institution.name, style = MaterialTheme.typography.titleMedium)
                            institution.category?.let {
                                Text(it, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                            }
                        }
                    }
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
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).then(screenPadding),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        if (institution == null) {
            Text("Instituția nu a fost găsită.")
        } else {
            Text(institution.name, style = MaterialTheme.typography.headlineMedium)
            institution.category?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
            institution.description?.let { Text(it) }
            institution.associated_court?.let { Text("Instanță competentă: $it") }
            InstitutionContact(institution)
        }
    }
}

@Composable
fun MapScreen(vm: AppViewModel, onOpenInstitution: (String) -> Unit) {
    val state by vm.institutions.collectAsState()
    val context = LocalContext.current
    remember {
        // OSM cere un user agent; cache-ul de tile-uri merge în storage-ul aplicației.
        Configuration.getInstance().apply {
            userAgentValue = context.packageName
            osmdroidBasePath = context.filesDir
            osmdroidTileCache = context.cacheDir.resolve("osm")
        }
    }
    val withCoordinates = state.items.filter { it.latitude != null && it.longitude != null }

    Column(Modifier.fillMaxSize()) {
        if (state.loading) {
            CircularProgressIndicator(screenPadding)
        } else if (state.error != null) {
            Column(screenPadding) {
                Text(state.error!!, color = MaterialTheme.colorScheme.error)
                OutlinedButton(onClick = vm::loadInstitutions) { Text("Reîncearcă") }
            }
        }
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                MapView(ctx).apply {
                    setTileSource(TileSourceFactory.MAPNIK)
                    setMultiTouchControls(true)
                    controller.setZoom(6.5)
                    controller.setCenter(GeoPoint(45.9432, 24.9668)) // centrul României
                }
            },
            update = { map ->
                map.overlays.clear()
                withCoordinates.forEach { institution -> map.overlays.add(marker(map, institution, onOpenInstitution)) }
                map.invalidate()
            },
        )
    }
}

private fun marker(map: MapView, institution: Institution, onOpen: (String) -> Unit) =
    Marker(map).apply {
        position = GeoPoint(institution.latitude!!, institution.longitude!!)
        title = institution.name
        snippet = institution.address
        setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
        setOnMarkerClickListener { m, _ ->
            if (m.isInfoWindowShown) onOpen(institution.code) else m.showInfoWindow()
            true
        }
    }

@Composable
fun RecordsScreen(vm: AppViewModel, onOpenRecord: (String) -> Unit) {
    val records by vm.records.collectAsState()
    val dateFormat = remember { DateFormat.getDateTimeInstance(DateFormat.MEDIUM, DateFormat.SHORT) }

    Column(Modifier.fillMaxSize().then(screenPadding), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Dosarele mele", style = MaterialTheme.typography.headlineMedium)
        Text("Analizele salvate rămân doar pe acest telefon.", style = MaterialTheme.typography.bodyMedium)
        if (records.isEmpty()) {
            Text("Nu ai nicio analiză salvată încă.")
        }
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(records, key = { it.id }) { record ->
                Card(Modifier.fillMaxWidth().clickable { onOpenRecord(record.id) }) {
                    Row(Modifier.padding(start = 16.dp, top = 8.dp, bottom = 8.dp, end = 4.dp)) {
                        Column(Modifier.weight(1f)) {
                            Text(
                                record.result.institution?.name ?: record.result.institution_type,
                                style = MaterialTheme.typography.titleMedium,
                            )
                            Text(record.description, maxLines = 2)
                            Text(
                                dateFormat.format(Date(record.savedAtMillis)),
                                style = MaterialTheme.typography.labelSmall,
                            )
                        }
                        IconButton(onClick = { vm.deleteRecord(record.id) }) {
                            Icon(Icons.Filled.Delete, contentDescription = "Șterge")
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
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).then(screenPadding),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        if (record == null) {
            Text("Analiza nu mai există.")
        } else {
            Text("Problema ta", style = MaterialTheme.typography.titleMedium)
            Text(record.description)
            TriageResultView(record.result, onOpenInstitution)
        }
    }
}
