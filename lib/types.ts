import type { z } from 'zod';
import type { InstitutionSchema } from './schema';

export type Institution = z.infer<typeof InstitutionSchema>;
