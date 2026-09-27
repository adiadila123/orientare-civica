import type { NeonQueryFunction } from '@neondatabase/serverless';
import { InstitutionSchema } from './schema';
import type { Institution } from './types';

export async function findInstitution(
  sql: NeonQueryFunction<false, false>,
  institutionType: string
): Promise<Institution | null> {
  const rows = await sql`
    SELECT * FROM institutions WHERE code = ${institutionType.toUpperCase()} LIMIT 1
  `;
  const row = rows[0];
  if (!row) {
    return null;
  }
  const parsed = InstitutionSchema.safeParse(row);
  return parsed.success ? parsed.data : null;
}
