package ro.undemerg.app.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import java.util.UUID
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import ro.undemerg.app.data.Api
import ro.undemerg.app.data.ApiException
import ro.undemerg.app.data.Institution
import ro.undemerg.app.data.MapLocation
import ro.undemerg.app.data.RecordsStore
import ro.undemerg.app.data.SavedRecord
import ro.undemerg.app.data.TriageResponse

const val MAX_DESCRIPTION_LENGTH = 2000 // la fel ca în app/api/triage/route.ts

data class TriageState(
    val description: String = "",
    val loading: Boolean = false,
    val result: TriageResponse? = null,
    val analyzedDescription: String = "",
    val savedId: String? = null,
    val error: String? = null,
)

data class InstitutionsState(
    val loading: Boolean = false,
    val items: List<Institution> = emptyList(),
    val error: String? = null,
)

class AppViewModel(app: Application) : AndroidViewModel(app) {
    private val store = RecordsStore(app)

    private val _triage = MutableStateFlow(TriageState())
    val triage: StateFlow<TriageState> = _triage

    private val _institutions = MutableStateFlow(InstitutionsState())
    val institutions: StateFlow<InstitutionsState> = _institutions

    private val _location = MutableStateFlow(MapLocation())
    val location: StateFlow<MapLocation> = _location

    private var locationJob: kotlinx.coroutines.Job? = null

    val records: StateFlow<List<SavedRecord>> =
        store.records.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    init {
        loadInstitutions()
    }

    fun onDescriptionChange(value: String) {
        _triage.update { it.copy(description = value.take(MAX_DESCRIPTION_LENGTH)) }
    }

    fun analyze() {
        val description = _triage.value.description.trim()
        if (description.isEmpty() || _triage.value.loading) return
        _triage.update { it.copy(loading = true, error = null, result = null, savedId = null) }
        viewModelScope.launch {
            try {
                val result = Api.triage(description)
                _triage.update {
                    it.copy(loading = false, result = result, analyzedDescription = description)
                }
            } catch (e: ApiException) {
                _triage.update { it.copy(loading = false, error = e.message) }
            }
        }
    }

    fun resetTriage() {
        _triage.value = TriageState()
    }

    fun saveCurrentResult() {
        val state = _triage.value
        val result = state.result ?: return
        if (state.savedId != null) return
        val id = UUID.randomUUID().toString()
        _triage.update { it.copy(savedId = id) }
        viewModelScope.launch {
            store.save(SavedRecord(id, System.currentTimeMillis(), state.analyzedDescription, result))
        }
    }

    fun deleteRecord(id: String) {
        viewModelScope.launch { store.delete(id) }
    }

    fun loadInstitutions() {
        if (_institutions.value.loading) return
        _institutions.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            try {
                _institutions.value = InstitutionsState(items = Api.institutions())
            } catch (e: ApiException) {
                _institutions.update { it.copy(loading = false, error = e.message) }
            }
        }
    }

    // ---------- Selecția de pe hartă ----------

    fun selectJudet(judet: String) {
        locationJob?.cancel()
        _location.value = MapLocation(judet = judet, loading = true)
        locationJob = viewModelScope.launch {
            try {
                val point = Api.geocodeCounty(judet)
                _location.update {
                    it.copy(loading = false, center = point, zoom = if (point != null) 9.0 else it.zoom,
                        error = if (point == null) "Nu am găsit județul pe hartă." else null)
                }
            } catch (e: ApiException) {
                _location.update { it.copy(loading = false, error = e.message) }
            }
        }
    }

    fun selectLocalitate(localitate: String) {
        val judet = _location.value.judet
        if (judet.isEmpty()) return
        locationJob?.cancel()
        _location.value = MapLocation(judet = judet, localitate = localitate, loading = true,
            center = _location.value.center, zoom = _location.value.zoom)
        locationJob = viewModelScope.launch {
            try {
                val point = Api.geocode(localitate, judet)
                if (point == null) {
                    _location.update { it.copy(loading = false, error = "Nu am găsit localitatea pe hartă.") }
                    return@launch
                }
                _location.update { it.copy(center = point, zoom = 13.0) }
                loadTownhall(point.lat, point.lon)
            } catch (e: ApiException) {
                _location.update { it.copy(loading = false, error = e.message) }
            }
        }
    }

    /** Caută primăria; serviciul OpenStreetMap e uneori ocupat, așa că mai încercăm o dată. */
    private suspend fun loadTownhall(lat: Double, lon: Double) {
        var lastError: String? = null
        repeat(2) { attempt ->
            try {
                val townhall = Api.nearestTownhall(lat, lon)
                _location.update { it.copy(loading = false, townhall = townhall, townhallError = null) }
                return
            } catch (e: ApiException) {
                lastError = e.message
                if (attempt == 0) kotlinx.coroutines.delay(2_000)
            }
        }
        // Localitatea s-a găsit; doar primăria nu. Nu blocăm harta.
        _location.update { it.copy(loading = false, townhallError = lastError) }
    }

    fun retryTownhall() {
        val center = _location.value.center ?: return
        locationJob?.cancel()
        _location.update { it.copy(loading = true, townhallError = null) }
        locationJob = viewModelScope.launch { loadTownhall(center.lat, center.lon) }
    }

    fun clearLocation() {
        locationJob?.cancel()
        _location.value = MapLocation()
    }
}
