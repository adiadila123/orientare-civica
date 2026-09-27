import type { SupabaseClient } from '@supabase/supabase-js';
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

  return (data as Institution | null) ?? null;
}
