import type { z } from 'zod';
import type { InstitutionSchema, TriageResultSchema } from './schema';

export type Institution = z.infer<typeof InstitutionSchema>;
export type TriageResult = z.infer<typeof TriageResultSchema>;
export type TriageResponse = TriageResult & { institution: Institution | null };
