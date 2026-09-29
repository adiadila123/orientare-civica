import type { NeonQueryFunction } from '@neondatabase/serverless';
import { TriageFeedbackSchema } from './schema';
import type { TriageFeedback } from './types';

export interface CreateTriageFeedbackInput {
  userDescription: string;
  aiAnalysis: unknown;
  suggestedInstitutionCode: string | null;
  isHelpful: boolean;
  correction: string | null;
}

export async function createTriageFeedback(
  sql: NeonQueryFunction<false, false>,
  input: CreateTriageFeedbackInput
): Promise<TriageFeedback> {
  const rows = await sql`
    INSERT INTO triage_feedback (user_description, ai_analysis, suggested_institution_code, is_helpful, correction)
    VALUES (
      ${input.userDescription},
      ${JSON.stringify(input.aiAnalysis)},
      ${input.suggestedInstitutionCode},
      ${input.isHelpful},
      ${input.correction}
    )
    RETURNING *
  `;
  return TriageFeedbackSchema.parse(rows[0]);
}
