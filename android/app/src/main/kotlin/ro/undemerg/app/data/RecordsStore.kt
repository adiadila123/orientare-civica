package ro.undemerg.app.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.builtins.ListSerializer

private val Context.dataStore by preferencesDataStore(name = "records")
private val RECORDS_KEY = stringPreferencesKey("records_v1")
private val serializer = ListSerializer(SavedRecord.serializer())

/** Păstrează analizele doar pe telefon, ca pe site (localStorage), fără cont. */
class RecordsStore(private val context: Context) {

    val records: Flow<List<SavedRecord>> = context.dataStore.data.map { prefs ->
        prefs[RECORDS_KEY]
            ?.let { runCatching { Api.json.decodeFromString(serializer, it) }.getOrNull() }
            .orEmpty()
    }

    suspend fun save(record: SavedRecord) {
        context.dataStore.edit { prefs ->
            val current = prefs[RECORDS_KEY]
                ?.let { runCatching { Api.json.decodeFromString(serializer, it) }.getOrNull() }
                .orEmpty()
            prefs[RECORDS_KEY] = Api.json.encodeToString(serializer, listOf(record) + current)
        }
    }

    suspend fun delete(id: String) {
        context.dataStore.edit { prefs ->
            val current = prefs[RECORDS_KEY]
                ?.let { runCatching { Api.json.decodeFromString(serializer, it) }.getOrNull() }
                .orEmpty()
            prefs[RECORDS_KEY] = Api.json.encodeToString(serializer, current.filterNot { it.id == id })
        }
    }
}
