import { z } from 'zod';

export const InstitutionSchema = z.object({
  id: z.string(),
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  category: z.string().nullable(),
  website_url: z.string().url().nullable(),
  contact_form_url: z.string().url().nullable(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  address: z.string().nullable(),
  associated_court: z.string().nullable().optional(),
  iban: z.string().nullable().optional(),
  cod_venit: z.string().nullable().optional(),
  cui: z.string().nullable().optional(),
  wait_time_minutes: z.number().int().nullable().optional(),
});

export const TriageResultSchema = z.object({
  primary_intent: z.string(),
  urgency: z.enum(['low', 'normal', 'high']),
  institution_type: z.string(),
  required_documents: z.array(z.string()),
  recommended_channel: z.enum(['online', 'telefon', 'fizic']),
  next_steps: z.array(z.string()),
  explanation: z.string(),
  confidence: z.number().min(0).max(1),
});

const dateAsIsoString = z.preprocess(
  (val) => (val instanceof Date ? val.toISOString() : val),
  z.string()
);

// Postgres `date` columns have no time component - extracting the calendar
// day via UTC getters (rather than toISOString(), which is fine for
// timestamptz but can drift a day depending on local render timezone)
// keeps this exact, and produces the YYYY-MM-DD shape <input type="date"> needs.
const dateOnlyAsIsoDate = z.preprocess((val) => {
  if (val instanceof Date) {
    const year = val.getUTCFullYear();
    const month = String(val.getUTCMonth() + 1).padStart(2, '0');
    const day = String(val.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return val;
}, z.string());

export const CaseSchema = z.object({
  id: z.string(),
  case_number: z.string(),
  user_description: z.string(),
  ai_analysis: z.unknown().nullable(),
  recommended_institution_id: z.string().nullable(),
  institution_code: z.string().nullable(),
  status: z.string(),
  session_id: z.string().nullable(),
  created_at: dateAsIsoString,
  petitioner_name: z.string().nullable(),
  petitioner_cnp: z.string().nullable(),
  petitioner_address: z.string().nullable(),
  petitioner_email: z.string().nullable(),
  petitioner_phone: z.string().nullable(),
  pv_series: z.string().nullable(),
  pv_number: z.string().nullable(),
  pv_issue_date: dateOnlyAsIsoDate.nullable(),
  pv_amount: z.number().int().nullable(),
  pv_penalty_points: z.number().int().nullable(),
  pv_issuing_agent: z.string().nullable(),
  grounds: z.string().nullable(),
  annexes: z.array(z.string()),
  revision: z.number().int(),
  updated_at: dateAsIsoString,
});

export const InfoRequestSchema = z.object({
  id: z.string(),
  request_number: z.string(),
  institution_code: z.string(),
  requester_name: z.string().nullable(),
  requester_address: z.string().nullable(),
  requester_email: z.string().nullable(),
  requester_phone: z.string().nullable(),
  information_requested: z.string(),
  revision: z.number().int(),
  created_at: dateAsIsoString,
  updated_at: dateAsIsoString,
});
