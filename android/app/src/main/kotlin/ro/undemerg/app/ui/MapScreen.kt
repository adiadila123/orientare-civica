package ro.undemerg.app.ui

import android.content.Intent
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Directions
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import ro.undemerg.app.data.Institution
import ro.undemerg.app.data.Localities
import ro.undemerg.app.data.TownhallResult

/** Câmp care arată valoarea aleasă și deschide o listă cu căutare. */
@Composable
private fun PickerField(
    label: String,
    value: String,
    placeholder: String,
    options: List<String>,
    enabled: Boolean,
    modifier: Modifier = Modifier,
    onSelect: (String) -> Unit,
) {
    var open by remember { mutableStateOf(false) }

    Box(modifier) {
        OutlinedTextField(
            value = value,
            onValueChange = {},
            readOnly = true,
            enabled = enabled,
            label = { Text(label) },
            placeholder = { Text(placeholder) },
            trailingIcon = { Icon(Icons.Filled.ExpandMore, contentDescription = null) },
            singleLine = true,
            shape = MaterialTheme.shapes.medium,
            modifier = Modifier.fillMaxWidth(),
        )
        // Zonă transparentă peste câmp: un OutlinedTextField readOnly nu primește click singur.
        if (enabled) {
            Box(
                Modifier
                    .matchParentSize()
                    .clickable(onClickLabel = "Alege $label") { open = true }
                    .semantics {
                        role = Role.Button
                        contentDescription = "$label: ${value.ifEmpty { placeholder }}"
                    },
            )
        }
    }

    if (open) {
        OptionDialog(
            title = label,
            options = options,
            onDismiss = { open = false },
            onSelect = { open = false; onSelect(it) },
        )
    }
}

@Composable
private fun OptionDialog(
    title: String,
    options: List<String>,
    onDismiss: () -> Unit,
    onSelect: (String) -> Unit,
) {
    var query by remember { mutableStateOf("") }
    val filtered = remember(options, query) {
        val q = Localities.fixDiacritics(query.trim()).lowercase()
        if (q.isEmpty()) options else options.filter { it.lowercase().contains(q) }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                OutlinedTextField(
                    value = query,
                    onValueChange = { query = it },
                    label = { Text("Caută") },
                    leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null) },
                    singleLine = true,
                    shape = MaterialTheme.shapes.medium,
                    modifier = Modifier.fillMaxWidth(),
                )
                if (filtered.isEmpty()) {
                    Text("Niciun rezultat.", style = MaterialTheme.typography.bodyMedium)
                }
                LazyColumn(Modifier.heightIn(max = 320.dp)) {
                    items(filtered) { option ->
                        Text(
                            option,
                            style = MaterialTheme.typography.bodyLarge,
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(min = MinTouch)
                                .clickable { onSelect(option) }
                                .padding(vertical = 12.dp, horizontal = Spacing.xs),
                        )
                        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                    }
                }
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text("Anulează") } },
    )
}

@Composable
private fun TownhallCard(townhall: TownhallResult, onClose: () -> Unit) {
    val context = LocalContext.current
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerLowest),
        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp),
        shape = MaterialTheme.shapes.large,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(Modifier.padding(Spacing.md), verticalArrangement = Arrangement.spacedBy(Spacing.sm)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconBadge(Icons.Filled.AccountBalance)
                Column(Modifier.weight(1f).padding(horizontal = 12.dp)) {
                    Text("Primăria cea mai apropiată", style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary)
                    Text(townhall.name, style = MaterialTheme.typography.titleSmall)
                }
                IconButton(onClick = onClose, modifier = Modifier.size(MinTouch)) {
                    Icon(Icons.Filled.Close, contentDescription = "Închide")
                }
            }
            townhall.address?.let { Text(it, style = MaterialTheme.typography.bodyMedium) }
            Text(
                "~${"%.1f".format(townhall.distanceKm)} km de centrul localității · date OpenStreetMap, neverificate",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Button(
                onClick = {
                    context.open("geo:${townhall.lat},${townhall.lon}?q=${townhall.lat},${townhall.lon}(${townhall.name})",
                        Intent.ACTION_VIEW)
                },
                modifier = Modifier.fillMaxWidth().heightIn(min = MinTouch),
            ) {
                Icon(Icons.Filled.Directions, contentDescription = null, modifier = Modifier.size(18.dp))
                Text("  Deschide în hărți")
            }
        }
    }
}

@Composable
fun MapScreen(vm: AppViewModel, onOpenInstitution: (String) -> Unit) {
    val institutions by vm.institutions.collectAsState()
    val location by vm.location.collectAsState()
    val context = LocalContext.current

    val localities = remember { Localities.load(context) }
    val judete = remember(localities) { localities.keys.toList() }
    val places = remember(location.judet, localities) { localities[location.judet].orEmpty() }

    remember {
        // OSM cere un user agent; cache-ul de tile-uri merge în storage-ul aplicației.
        Configuration.getInstance().apply {
            userAgentValue = context.packageName
            osmdroidBasePath = context.filesDir
            osmdroidTileCache = context.cacheDir.resolve("osm")
        }
    }
    val withCoordinates = institutions.items.filter { it.latitude != null && it.longitude != null }
    var mapView by remember { mutableStateOf<MapView?>(null) }
    var townhallDismissed by remember(location.townhall) { mutableStateOf(false) }

    // Mută harta când se alege un județ sau o localitate.
    LaunchedEffect(location.center, location.zoom) {
        val center = location.center ?: return@LaunchedEffect
        mapView?.controller?.apply {
            setZoom(location.zoom)
            animateTo(GeoPoint(center.lat, center.lon))
        }
    }

    Box(Modifier.fillMaxSize()) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                MapView(ctx).apply {
                    setTileSource(TileSourceFactory.MAPNIK)
                    setMultiTouchControls(true)
                    controller.setZoom(7.3)
                    controller.setCenter(GeoPoint(45.9432, 24.9668)) // centrul României
                    mapView = this
                }
            },
            update = { map ->
                map.overlays.clear()
                withCoordinates.forEach { map.overlays.add(institutionMarker(map, it, onOpenInstitution)) }
                location.townhall?.let { map.overlays.add(townhallMarker(map, it)) }
                map.invalidate()
            },
        )

        Column(
            Modifier.align(Alignment.TopStart).fillMaxWidth().padding(Spacing.md),
            verticalArrangement = Arrangement.spacedBy(Spacing.sm),
        ) {
            Surface(
                shape = MaterialTheme.shapes.large,
                color = MaterialTheme.colorScheme.surfaceContainerLowest,
                shadowElevation = 6.dp,
            ) {
                Column(Modifier.padding(Spacing.md), verticalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                    Text("Caută pe hartă", style = MaterialTheme.typography.titleSmall)
                    Row(horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                        PickerField(
                            label = "Județ",
                            value = location.judet,
                            placeholder = "Alege",
                            options = judete,
                            enabled = true,
                            modifier = Modifier.weight(1f),
                            onSelect = vm::selectJudet,
                        )
                        PickerField(
                            label = "Localitate",
                            value = Localities.searchName(location.localitate),
                            placeholder = if (location.judet.isEmpty()) "Alege județul" else "Alege",
                            options = places,
                            enabled = location.judet.isNotEmpty(),
                            modifier = Modifier.weight(1f),
                            onSelect = vm::selectLocalitate,
                        )
                    }
                    if (location.loading) {
                        LinearProgressIndicator(Modifier.fillMaxWidth())
                    }
                    val status = location.error ?: location.townhallError
                    when {
                        status != null -> Text(status, style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.error)
                        location.judet.isEmpty() -> Text(
                            "${withCoordinates.size} instituții naționale cu sediul în București. " +
                                "Alege județul și localitatea ca să găsești primăria din zona ta.",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    if (location.judet.isNotEmpty()) {
                        Row(horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                            if (location.townhallError != null && location.localitate.isNotEmpty()) {
                                Button(onClick = vm::retryTownhall, modifier = Modifier.heightIn(min = MinTouch)) {
                                    Text("Reîncearcă primăria")
                                }
                            }
                            TextButton(onClick = vm::clearLocation, modifier = Modifier.heightIn(min = MinTouch)) {
                                Text("Șterge selecția")
                            }
                        }
                    }
                }
            }
        }

        val townhall = location.townhall
        if (townhall != null && !townhallDismissed) {
            Box(Modifier.align(Alignment.BottomCenter).padding(Spacing.md)) {
                TownhallCard(townhall) { townhallDismissed = true }
            }
        }
    }
}

private fun institutionMarker(map: MapView, institution: Institution, onOpen: (String) -> Unit) =
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

/** Primăria găsită: același marcaj, dar colorat diferit ca să nu se confunde cu instituțiile naționale. */
private fun townhallMarker(map: MapView, townhall: TownhallResult) =
    Marker(map).apply {
        position = GeoPoint(townhall.lat, townhall.lon)
        title = townhall.name
        snippet = townhall.address
        setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
        icon = icon?.mutate()?.also { it.setTint(0xFF0369A1.toInt()) }
    }
