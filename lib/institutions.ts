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

export async function listInstitutions(
  sql: NeonQueryFunction<false, false>
): Promise<Institution[]> {
  const rows = await sql`SELECT * FROM institutions ORDER BY name`;
  const institutions: Institution[] = [];
  for (const row of rows) {
    const result = InstitutionSchema.safeParse(row);
    if (result.success) {
      institutions.push(result.data);
    } else {
      console.warn('Skipping institution row that failed schema validation', result.error.message);
    }
  }
  return institutions;
}
