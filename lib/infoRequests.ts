import type { NeonQueryFunction } from '@neondatabase/serverless';
import { InfoRequestSchema } from './schema';
import type { InfoRequest } from './types';

export interface CreateInfoRequestInput {
  institutionCode: string;
  informationRequested: string;
}

export async function createInfoRequest(
  sql: NeonQueryFunction<false, false>,
  input: CreateInfoRequestInput
): Promise<InfoRequest> {
  const rows = await sql`
    INSERT INTO info_requests (institution_code, information_requested)
    VALUES (${input.institutionCode}, ${input.informationRequested})
    RETURNING *
  `;
  return InfoRequestSchema.parse(rows[0]);
}

export async function findInfoRequest(
  sql: NeonQueryFunction<false, false>,
  id: string
): Promise<InfoRequest | null> {
  const rows = await sql`SELECT * FROM info_requests WHERE id = ${id} LIMIT 1`;
  const row = rows[0];
  if (!row) {
    return null;
  }
  const parsed = InfoRequestSchema.safeParse(row);
  return parsed.success ? parsed.data : null;
}

export interface UpdateInfoRequestInput {
  requesterName: string | null;
  requesterAddress: string | null;
  requesterEmail: string | null;
  requesterPhone: string | null;
  informationRequested: string;
}

export async function updateInfoRequest(
  sql: NeonQueryFunction<false, false>,
  id: string,
  input: UpdateInfoRequestInput
): Promise<InfoRequest | null> {
  const rows = await sql`
    UPDATE info_requests SET
      requester_name = ${input.requesterName},
      requester_address = ${input.requesterAddress},
      requester_email = ${input.requesterEmail},
      requester_phone = ${input.requesterPhone},
      information_requested = ${input.informationRequested},
      revision = revision + 1,
      updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;
  const row = rows[0];
  if (!row) {
    return null;
  }
  const parsed = InfoRequestSchema.safeParse(row);
  return parsed.success ? parsed.data : null;
}
