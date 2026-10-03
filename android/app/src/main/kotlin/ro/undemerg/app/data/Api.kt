package ro.undemerg.app.data

import java.io.IOException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import ro.undemerg.app.BuildConfig
import java.util.concurrent.TimeUnit

class ApiException(message: String) : IOException(message)

object Api {
    val json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
    }

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        // Triajul apelează un LLM, poate dura.
        .readTimeout(60, TimeUnit.SECONDS)
        .build()

    private val jsonType = "application/json; charset=utf-8".toMediaType()

    suspend fun triage(description: String): TriageResponse = withContext(Dispatchers.IO) {
        val body = json.encodeToString(TriageRequest.serializer(), TriageRequest(description.trim()))
            .toRequestBody(jsonType)
        val request = Request.Builder()
            .url("${BuildConfig.API_BASE_URL}/api/triage")
            .post(body)
            .build()
        json.decodeFromString(TriageResponse.serializer(), execute(request))
    }

    suspend fun institutions(): List<Institution> = withContext(Dispatchers.IO) {
        val request = Request.Builder()
            .url("${BuildConfig.API_BASE_URL}/api/institutions")
            .get()
            .build()
        json.decodeFromString(
            kotlinx.serialization.builtins.ListSerializer(Institution.serializer()),
            execute(request),
        )
    }


    /** Caută o localitate în OpenStreetMap (Nominatim) și întoarce coordonatele ei. */
    suspend fun geocode(localitate: String, judet: String): LatLon? {
        val name = Localities.searchName(localitate)
        val query = if (judet == "București") "$name, România" else "$name, $judet, România"
        return nominatim("q" to query)
    }

    /** Centrul unui județ întreg. */
    suspend fun geocodeCounty(judet: String): LatLon? = nominatim("county" to judet)

    private suspend fun nominatim(param: Pair<String, String>): LatLon? = withContext(Dispatchers.IO) {
        val url = "https://nominatim.openstreetmap.org/search".toHttpUrl().newBuilder()
            .addQueryParameter(param.first, param.second)
            .addQueryParameter("format", "json")
            .addQueryParameter("limit", "1")
            .addQueryParameter("countrycodes", "ro")
            .build()
        val request = Request.Builder()
            .url(url)
            // Politica Nominatim cere un User-Agent care identifică aplicația.
            .header("User-Agent", "UndeMerg-Android/${BuildConfig.VERSION_NAME}")
            .header("Accept-Language", "ro")
            .get()
            .build()
        val hits = json.decodeFromString(
            kotlinx.serialization.builtins.ListSerializer(NominatimHit.serializer()),
            execute(request),
        )
        hits.firstOrNull()?.let { hit ->
            val lat = hit.lat.toDoubleOrNull()
            val lon = hit.lon.toDoubleOrNull()
            if (lat != null && lon != null) LatLon(lat, lon) else null
        }
    }

    suspend fun nearestTownhall(lat: Double, lon: Double): TownhallResult = withContext(Dispatchers.IO) {
        val request = Request.Builder()
            .url("${BuildConfig.API_BASE_URL}/api/nearest-townhall?lat=$lat&lon=$lon")
            .get()
            .build()
        json.decodeFromString(TownhallResult.serializer(), execute(request))
    }

    private fun execute(request: Request): String {
        try {
            client.newCall(request).execute().use { response ->
                val text = response.body.string()
                if (!response.isSuccessful) {
                    val message = runCatching {
                        json.decodeFromString(ApiError.serializer(), text).error
                    }.getOrNull()
                    throw ApiException(message ?: "Eroare ${response.code}. Încearcă din nou.")
                }
                return text
            }
        } catch (e: ApiException) {
            throw e
        } catch (e: IOException) {
            throw ApiException("Nu mă pot conecta la server. Verifică conexiunea la internet.")
        }
    }
}
