import type { SupabaseClient } from '@supabase/supabase-js';
import { InstitutionSchema } from './schema';
import type { Institution } from './types';

export async function findInstitution(
  supabase: SupabaseClient,
  institutionType: string
): Promise<Institution | null> {
  const { data, error } = await supabase
    .from('institutions')
    .select('*')
    .eq('code', institutionType.toUpperCase())
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to look up institution: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const parsed = InstitutionSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}
