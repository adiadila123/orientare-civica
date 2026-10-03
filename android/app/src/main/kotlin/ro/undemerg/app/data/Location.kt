package ro.undemerg.app.data

import android.content.Context
import java.text.Collator
import java.util.Locale
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer

/** Oglinda răspunsului lui /api/nearest-townhall. */
@Serializable
data class TownhallResult(
    val name: String,
    val address: String? = null,
    val distanceKm: Double,
    val lat: Double,
    val lon: Double,
)

@Serializable
data class LatLon(val lat: Double, val lon: Double)

/** Răspuns Nominatim; coordonatele vin ca șiruri. */
@Serializable
data class NominatimHit(val lat: String, val lon: String)

/** Selecția curentă de pe hartă. */
data class MapLocation(
    val judet: String = "",
    val localitate: String = "",
    val center: LatLon? = null,
    val zoom: Double = 7.3,
    val townhall: TownhallResult? = null,
    val loading: Boolean = false,
    val townhallError: String? = null,
    val error: String? = null,
)

/** Datele bazei locale cu județe și localități (aceeași sursă ca site-ul). */
object Localities {
    private var cache: Map<String, List<String>>? = null

    /** Datele sursă folosesc ş/ţ cu sedilă; afișăm și căutăm cu ș/ț (virgulă). */
    fun fixDiacritics(text: String): String =
        text.replace('ş', 'ș').replace('Ş', 'Ș').replace('ţ', 'ț').replace('Ţ', 'Ț')

    /** Numele curat pentru căutare: fără „Municipiul” / „Oraș”. */
    fun searchName(localitate: String): String =
        fixDiacritics(localitate).removePrefix("Municipiul ").removePrefix("Oraș ").trim()

    fun load(context: Context): Map<String, List<String>> {
        cache?.let { return it }
        val text = context.assets.open("localitati.json").bufferedReader(Charsets.UTF_8).use { it.readText() }
        val raw = Api.json.decodeFromString(
            MapSerializer(String.serializer(), ListSerializer(String.serializer())),
            text,
        )
        val collator = Collator.getInstance(Locale("ro", "RO"))
        val result = raw.mapKeys { fixDiacritics(it.key) }
            .toSortedMap(collator)
            .mapValues { (_, places) -> places.map(::fixDiacritics) }
        cache = result
        return result
    }
}
