package ro.undemerg.app.data

import kotlinx.serialization.Serializable

/** Oglinda lui `Institution` din lib/schema.ts. */
@Serializable
data class Institution(
    val id: String,
    val code: String,
    val name: String,
    val description: String? = null,
    val category: String? = null,
    val website_url: String? = null,
    val contact_form_url: String? = null,
    val phone: String? = null,
    val email: String? = null,
    val address: String? = null,
    val associated_court: String? = null,
    val wait_time_minutes: Int? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
)

/** Oglinda lui `TriageResponse` (TriageResult + institution) din lib/types.ts. */
@Serializable
data class TriageResponse(
    val primary_intent: String,
    val urgency: String,
    val institution_type: String,
    val required_documents: List<String> = emptyList(),
    val recommended_channel: String,
    val next_steps: List<String> = emptyList(),
    val explanation: String,
    val confidence: Double,
    val institution: Institution? = null,
)

/** O analiză salvată local pe telefon ("Dosarele mele"). */
@Serializable
data class SavedRecord(
    val id: String,
    val savedAtMillis: Long,
    val description: String,
    val result: TriageResponse,
)

@Serializable
data class TriageRequest(val description: String)

@Serializable
data class ApiError(val error: String? = null)
