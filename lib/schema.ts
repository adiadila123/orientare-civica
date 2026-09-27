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
