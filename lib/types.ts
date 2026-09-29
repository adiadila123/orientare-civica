import type { z } from 'zod';
import type {
  InstitutionSchema,
  TriageResultSchema,
  CaseSchema,
  InfoRequestSchema,
  TriageFeedbackSchema,
} from './schema';

export type Institution = z.infer<typeof InstitutionSchema>;
export type TriageResult = z.infer<typeof TriageResultSchema>;
export type TriageResponse = TriageResult & { institution: Institution | null };
export type Case = z.infer<typeof CaseSchema>;
export type InfoRequest = z.infer<typeof InfoRequestSchema>;
export type TriageFeedback = z.infer<typeof TriageFeedbackSchema>;
