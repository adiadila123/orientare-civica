import type { NeonQueryFunction } from '@neondatabase/serverless';
import { CaseSchema } from './schema';
import type { Case } from './types';

export interface CreateCaseInput {
  userDescription: string;
  aiAnalysis: unknown;
  institutionCode: string;
  grounds: string | null;
}

export async function createCase(
  sql: NeonQueryFunction<false, false>,
  input: CreateCaseInput
): Promise<Case> {
  const rows = await sql`
    INSERT INTO cases (user_description, ai_analysis, institution_code, grounds)
    VALUES (${input.userDescription}, ${JSON.stringify(input.aiAnalysis)}, ${input.institutionCode}, ${input.grounds})
    RETURNING *
  `;
  return CaseSchema.parse(rows[0]);
}

export async function findCase(
  sql: NeonQueryFunction<false, false>,
  id: string
): Promise<Case | null> {
  const rows = await sql`SELECT * FROM cases WHERE id = ${id} LIMIT 1`;
  const row = rows[0];
  if (!row) {
    return null;
  }
  const parsed = CaseSchema.safeParse(row);
  return parsed.success ? parsed.data : null;
}

export async function findCaseByCaseNumber(
  sql: NeonQueryFunction<false, false>,
  caseNumber: string
): Promise<Case | null> {
  const rows = await sql`SELECT * FROM cases WHERE case_number = ${caseNumber} LIMIT 1`;
  const row = rows[0];
  if (!row) {
    return null;
  }
  const parsed = CaseSchema.safeParse(row);
  return parsed.success ? parsed.data : null;
}

// Merges two case groups by repointing every case that currently belongs to
// mergeFromGroupId onto keepGroupId — not just a single row — so linking two
// cases that each already have group-mates bundles everyone together instead
// of orphaning them.
export async function mergeCaseGroups(
  sql: NeonQueryFunction<false, false>,
  keepGroupId: string,
  mergeFromGroupId: string
): Promise<void> {
  await sql`UPDATE cases SET case_group_id = ${keepGroupId} WHERE case_group_id = ${mergeFromGroupId}`;
}

export async function findCasesByGroupId(
  sql: NeonQueryFunction<false, false>,
  groupId: string
): Promise<Case[]> {
  const rows = await sql`SELECT * FROM cases WHERE case_group_id = ${groupId} ORDER BY created_at ASC`;
  return rows
    .map((row) => CaseSchema.safeParse(row))
    .filter((parsed): parsed is { success: true; data: Case } => parsed.success)
    .map((parsed) => parsed.data);
}

export interface UpdateCaseInput {
  petitionerName: string;
  petitionerCnp: string;
  petitionerAddress: string;
  petitionerEmail: string | null;
  petitionerPhone: string | null;
  pvSeries: string;
  pvNumber: string;
  pvIssueDate: string | null;
  pvAmount: number;
  pvPenaltyPoints: number | null;
  pvIssuingAgent: string | null;
  grounds: string;
  annexes: string[];
}

export async function updateCase(
  sql: NeonQueryFunction<false, false>,
  id: string,
  input: UpdateCaseInput
): Promise<Case | null> {
  const rows = await sql`
    UPDATE cases SET
      petitioner_name = ${input.petitionerName},
      petitioner_cnp = ${input.petitionerCnp},
      petitioner_address = ${input.petitionerAddress},
      petitioner_email = ${input.petitionerEmail},
      petitioner_phone = ${input.petitionerPhone},
      pv_series = ${input.pvSeries},
      pv_number = ${input.pvNumber},
      pv_issue_date = ${input.pvIssueDate},
      pv_amount = ${input.pvAmount},
      pv_penalty_points = ${input.pvPenaltyPoints},
      pv_issuing_agent = ${input.pvIssuingAgent},
      grounds = ${input.grounds},
      annexes = ${JSON.stringify(input.annexes)},
      revision = revision + 1,
      updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;
  const row = rows[0];
  if (!row) {
    return null;
  }
  const parsed = CaseSchema.safeParse(row);
  return parsed.success ? parsed.data : null;
}
