# Unde Merg M3 — Contestation Document Generation + Edit/Error Flows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a citizen who received a contestable-institution result from the AI triage flow generate a real contestation document (a "plângere contravențională"), review it as a formatted A4 preview, edit the petitioner/PV/grounds/annexe data behind it (with real CNP validation), and save those edits — including graceful handling of an invalid CNP and of a network failure during save (with a local JSON backup so nothing is lost).

**Architecture:** A new `cases` record (schema already exists from v1, unused until now) is created via `POST /api/cases` when the citizen clicks "Generează contestația" on a contestable triage result. `/dosare/[id]` renders the case as a `<LegalDocumentPreview>` A4 document plus an "Editează" button opening `<EditCaseForm>`, a client-side modal covering the 4 catalog sections (Petent/PV/Motive/Anexe). Saving calls `PUT /api/cases/[id]`, which re-validates the CNP server-side and persists via `lib/cases.ts`. Network failures during save surface a distinct error state with a client-side JSON backup download, never a lost edit.

**Tech Stack:** Same as M1/M2 — Next.js (TypeScript, App Router), Tailwind v4 civic design tokens, `@neondatabase/serverless`, Zod, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-27-unde-merg-v2-roadmap.md` (M3's scope statement), `.superpowers/sdd/2026-09-27-unde-merg-mvp/stitch-screen-catalog.md` (screens #6-#9, #11 detail; the "Data model implications" section for Case/PV/Petitioner/Contestation-document fields).

## Global Constraints

- All user-facing text is in Romanian, matching the exact copy quoted in this plan.
- Next.js App Router, Tailwind v4 civic design tokens from `app/globals.css` (already fixed in M1/M2 — no new tokens needed). Dynamic routes use `PageProps<'/route/[param]'>` and Route Handlers use `RouteContext<'/api/route/[param]'>` — this codebase's established typed-helper convention (confirmed against `node_modules/next/dist/docs/`), generated into `.next/types/routes.d.ts` by `next build`/`next dev`.
- Every task must leave `npm test` and `npm run build` green.
- **No AI extraction of petitioner/PV data.** The Groq triage call is not extended to guess a citizen's CNP, PV series/number, or fine amount from free text. A case is created with the AI's own explanation as a starting point for "Motivele" and everything petitioner/PV-specific left blank for the citizen to fill in themselves via the edit form. Ruling: an LLM hallucinating a wrong CNP or fine amount onto a document meant to be filed with a court is a real-world harm a fake IBAN never was — this is a deliberate safety boundary for this milestone, not an oversight to fix later.
- **No real file upload/storage.** "Anexe" (attachments) are a client-managed list of document *names* the citizen types in, not real file uploads — there is no blob/object storage configured in this stack. Descoped explicitly, matching the pattern M1/M2 used for other visual-only polish items.
- **No authentication or access control on cases.** `/dosare/[id]` is reachable by anyone with the link, same security model (none) as every other route in this MVP. Not a new gap — the whole app has no auth yet.
- CNP validation is checksum/format-only (13 digits, correct Luhn-style control digit per the official algorithm) — not full semantic validation (birth-date plausibility, county-code lookup). The catalog's own documented test case (an 11-digit truncated CNP) is a format failure the regex alone catches.
- The 20,00 LEI stamp-duty figure and O.G. nr. 2/2001 citation already shown on `/institutii/[code]` (M2) are reused verbatim on the generated document — their legal accuracy is a standing open item flagged to the user in M2, not re-litigated here.

---

### Task 1: Case, petitioner, and PV data model

**Files:**
- Create: `db/migrations/0003_case_contestation_fields.sql`
- Create: `lib/cases.ts`
- Create: `tests/lib/cases.test.ts`
- Modify: `lib/schema.ts`
- Modify: `lib/types.ts`

**Interfaces:**
- Produces: `CaseSchema`/`Case` type (via `z.infer`), `createCase(sql, input)`, `findCase(sql, id)`, `updateCase(sql, id, input)` in `lib/cases.ts`. Tasks 3-5 consume all three.

- [ ] **Step 1: Create the migration**

Create `db/migrations/0003_case_contestation_fields.sql`:

```sql
create sequence if not exists case_number_seq;

alter table cases
  add column case_number text unique default (
    'GD-' || extract(year from now())::text || '-' || lpad(nextval('case_number_seq')::text, 4, '0')
  ),
  add column institution_code text,
  add column petitioner_name text,
  add column petitioner_cnp text,
  add column petitioner_address text,
  add column petitioner_email text,
  add column petitioner_phone text,
  add column pv_series text,
  add column pv_number text,
  add column pv_issue_date date,
  add column pv_amount integer,
  add column pv_penalty_points integer,
  add column pv_issuing_agent text,
  add column grounds text,
  add column annexes jsonb not null default '[]'::jsonb,
  add column revision integer not null default 1,
  add column updated_at timestamptz not null default now();
```

(`institution_code` is nullable at the DB level for migration safety on an unknown-state table, but the application layer — `createCase` below — always sets it. `case_number` is generated automatically; nothing in the app ever sets it directly.)

- [ ] **Step 2: Write a failing test for `CaseSchema`**

Add to `tests/lib/schema.test.ts` a new top-level `describe` block:

```typescript
describe('CaseSchema', () => {
  it('accepts a freshly-created case with only the v1 fields populated', () => {
    const result = CaseSchema.safeParse({
      id: '1',
      case_number: 'GD-2026-0001',
      user_description: 'Am primit o amendă.',
      ai_analysis: null,
      recommended_institution_id: null,
      institution_code: 'PRIMARIE',
      status: 'new',
      session_id: null,
      created_at: '2026-09-28T10:00:00.000Z',
      petitioner_name: null,
      petitioner_cnp: null,
      petitioner_address: null,
      petitioner_email: null,
      petitioner_phone: null,
      pv_series: null,
      pv_number: null,
      pv_issue_date: null,
      pv_amount: null,
      pv_penalty_points: null,
      pv_issuing_agent: null,
      grounds: null,
      annexes: [],
      revision: 1,
      updated_at: '2026-09-28T10:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });
});
```

Add `CaseSchema` to the existing `import { InstitutionSchema } from '@/lib/schema';` line.

- [ ] **Step 3: Run the test and verify it fails**

Run: `npm test -- tests/lib/schema.test.ts`
Expected: FAIL — `CaseSchema` doesn't exist yet.

- [ ] **Step 4: Add `CaseSchema` to `lib/schema.ts`**

```typescript
export const CaseSchema = z.object({
  id: z.string(),
  case_number: z.string(),
  user_description: z.string(),
  ai_analysis: z.unknown().nullable(),
  recommended_institution_id: z.string().nullable(),
  institution_code: z.string().nullable(),
  status: z.string(),
  session_id: z.string().nullable(),
  created_at: z.string(),
  petitioner_name: z.string().nullable(),
  petitioner_cnp: z.string().nullable(),
  petitioner_address: z.string().nullable(),
  petitioner_email: z.string().nullable(),
  petitioner_phone: z.string().nullable(),
  pv_series: z.string().nullable(),
  pv_number: z.string().nullable(),
  pv_issue_date: z.string().nullable(),
  pv_amount: z.number().int().nullable(),
  pv_penalty_points: z.number().int().nullable(),
  pv_issuing_agent: z.string().nullable(),
  grounds: z.string().nullable(),
  annexes: z.array(z.string()),
  revision: z.number().int(),
  updated_at: z.string(),
});
```

- [ ] **Step 5: Run the test and verify it passes**

Run: `npm test -- tests/lib/schema.test.ts`
Expected: PASS.

- [ ] **Step 6: Add the `Case` type to `lib/types.ts`**

```typescript
import type { z } from 'zod';
import type { InstitutionSchema, TriageResultSchema, CaseSchema } from './schema';

export type Institution = z.infer<typeof InstitutionSchema>;
export type TriageResult = z.infer<typeof TriageResultSchema>;
export type TriageResponse = TriageResult & { institution: Institution | null };
export type Case = z.infer<typeof CaseSchema>;
```

- [ ] **Step 7: Write failing tests for `lib/cases.ts`**

Create `tests/lib/cases.test.ts`:

```typescript
import { describe, expect, it, vi } from 'vitest';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import { createCase, findCase, updateCase } from '@/lib/cases';
import type { Case } from '@/lib/types';

function createFakeSql(rows: unknown[]) {
  const sql = vi.fn().mockResolvedValue(rows);
  return sql as unknown as NeonQueryFunction<false, false>;
}

const sampleCase: Case = {
  id: '1',
  case_number: 'GD-2026-0001',
  user_description: 'Am primit o amendă.',
  ai_analysis: null,
  recommended_institution_id: null,
  institution_code: 'PRIMARIE',
  status: 'new',
  session_id: null,
  created_at: '2026-09-28T10:00:00.000Z',
  petitioner_name: null,
  petitioner_cnp: null,
  petitioner_address: null,
  petitioner_email: null,
  petitioner_phone: null,
  pv_series: null,
  pv_number: null,
  pv_issue_date: null,
  pv_amount: null,
  pv_penalty_points: null,
  pv_issuing_agent: null,
  grounds: null,
  annexes: [],
  revision: 1,
  updated_at: '2026-09-28T10:00:00.000Z',
};

describe('createCase', () => {
  it('inserts and returns the new case', async () => {
    const sql = createFakeSql([sampleCase]);
    const result = await createCase(sql, {
      userDescription: 'Am primit o amendă.',
      aiAnalysis: null,
      institutionCode: 'PRIMARIE',
    });
    expect(result).toEqual(sampleCase);
    expect(sql).toHaveBeenCalledTimes(1);
  });
});

describe('findCase', () => {
  it('returns the matched case', async () => {
    const sql = createFakeSql([sampleCase]);
    expect(await findCase(sql, '1')).toEqual(sampleCase);
  });

  it('returns null when nothing matches', async () => {
    const sql = createFakeSql([]);
    expect(await findCase(sql, 'missing')).toBeNull();
  });
});

describe('updateCase', () => {
  it('updates petitioner/PV fields and increments the revision', async () => {
    const updated = { ...sampleCase, petitioner_name: 'Ion Popescu', revision: 2 };
    const sql = createFakeSql([updated]);
    const result = await updateCase(sql, '1', {
      petitionerName: 'Ion Popescu',
      petitionerCnp: '1900010140017',
      petitionerAddress: 'Str. Exemplu nr. 1',
      petitionerEmail: null,
      petitionerPhone: null,
      pvSeries: 'ABC',
      pvNumber: '123',
      pvIssueDate: '2026-09-01',
      pvAmount: 500,
      pvPenaltyPoints: null,
      pvIssuingAgent: null,
      grounds: 'Nu am fost prezent la fața locului.',
      annexes: [],
    });
    expect(result?.petitioner_name).toBe('Ion Popescu');
    expect(result?.revision).toBe(2);
  });

  it('returns null when the case does not exist', async () => {
    const sql = createFakeSql([]);
    const result = await updateCase(sql, 'missing', {
      petitionerName: 'x',
      petitionerCnp: '1900010140017',
      petitionerAddress: 'x',
      petitionerEmail: null,
      petitionerPhone: null,
      pvSeries: 'x',
      pvNumber: 'x',
      pvIssueDate: '2026-09-01',
      pvAmount: 100,
      pvPenaltyPoints: null,
      pvIssuingAgent: null,
      grounds: 'x',
      annexes: [],
    });
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 8: Run the tests and verify they fail**

Run: `npm test -- tests/lib/cases.test.ts`
Expected: FAIL — `@/lib/cases` doesn't exist yet.

- [ ] **Step 9: Create `lib/cases.ts`**

```typescript
import type { NeonQueryFunction } from '@neondatabase/serverless';
import { CaseSchema } from './schema';
import type { Case } from './types';

export interface CreateCaseInput {
  userDescription: string;
  aiAnalysis: unknown;
  institutionCode: string;
}

export async function createCase(
  sql: NeonQueryFunction<false, false>,
  input: CreateCaseInput
): Promise<Case> {
  const rows = await sql`
    INSERT INTO cases (user_description, ai_analysis, institution_code)
    VALUES (${input.userDescription}, ${JSON.stringify(input.aiAnalysis)}, ${input.institutionCode})
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

export interface UpdateCaseInput {
  petitionerName: string;
  petitionerCnp: string;
  petitionerAddress: string;
  petitionerEmail: string | null;
  petitionerPhone: string | null;
  pvSeries: string;
  pvNumber: string;
  pvIssueDate: string;
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
```

- [ ] **Step 10: Run the tests and verify they pass**

Run: `npm test -- tests/lib/cases.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 11: Run the full suite and build**

Run: `npm test`
Expected: all test files pass.

Run: `npm run build`
Expected: succeeds with no type errors.

- [ ] **Step 12: Commit**

```bash
git add db/migrations/0003_case_contestation_fields.sql lib/cases.ts tests/lib/cases.test.ts lib/schema.ts lib/types.ts
git commit -m "feat: add case, petitioner, and PV data model"
```

---

### Task 2: CNP validation

**Files:**
- Create: `lib/cnp.ts`
- Create: `tests/lib/cnp.test.ts`

**Interfaces:**
- Produces: `isValidCnp(cnp: string): boolean`. Tasks 5 (client-side, in the edit form) and the `PUT /api/cases/[id]` route (server-side, defense in depth) both consume it.

- [ ] **Step 1: Write failing tests**

Create `tests/lib/cnp.test.ts`. The valid/invalid CNPs below were hand-computed against the real Romanian CNP control-digit algorithm (weights `[2,7,9,1,4,6,3,5,8,2,7,9]` applied to the first 12 digits, summed, mod 11; remainder 10 maps to check digit 1, otherwise the remainder itself is the check digit) — `1900010140017`'s first 12 digits sum to a weighted total of 117, and 117 mod 11 = 7, matching its final digit:

```typescript
import { describe, expect, it } from 'vitest';
import { isValidCnp } from '@/lib/cnp';

describe('isValidCnp', () => {
  it('accepts a CNP with a correct control digit', () => {
    expect(isValidCnp('1900010140017')).toBe(true);
  });

  it('rejects a CNP with an incorrect control digit', () => {
    expect(isValidCnp('1900010140010')).toBe(false);
  });

  it('rejects a truncated 11-digit CNP', () => {
    expect(isValidCnp('19000101400')).toBe(false);
  });

  it('rejects a CNP containing non-digit characters', () => {
    expect(isValidCnp('19000101400AB')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidCnp('')).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npm test -- tests/lib/cnp.test.ts`
Expected: FAIL — `@/lib/cnp` doesn't exist yet.

- [ ] **Step 3: Create `lib/cnp.ts`**

```typescript
const CONTROL_WEIGHTS = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];

export function isValidCnp(cnp: string): boolean {
  if (!/^\d{13}$/.test(cnp)) {
    return false;
  }

  const digits = cnp.split('').map(Number);
  const weightedSum = digits
    .slice(0, 12)
    .reduce((total, digit, index) => total + digit * CONTROL_WEIGHTS[index], 0);
  const remainder = weightedSum % 11;
  const controlDigit = remainder === 10 ? 1 : remainder;

  return controlDigit === digits[12];
}
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `npm test -- tests/lib/cnp.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Run the full suite and build**

Run: `npm test`
Expected: all test files pass.

Run: `npm run build`
Expected: succeeds with no type errors.

- [ ] **Step 6: Commit**

```bash
git add lib/cnp.ts tests/lib/cnp.test.ts
git commit -m "feat: add Romanian CNP checksum validation"
```

---

### Task 3: Case creation from a contestable triage result

**Files:**
- Create: `app/api/cases/route.ts`
- Create: `tests/api/cases.test.ts`
- Modify: `components/AnalysisResult.tsx`
- Modify: `tests/components/AnalysisResult.test.tsx`

**Interfaces:**
- Consumes: `createCase` (Task 1), `createDb` (M1).
- Produces: `POST /api/cases` — request `{ description: string, institutionCode: string, aiAnalysis: unknown }`, response `201` with the created `Case` (as JSON) or `400`/`500`. The "Generează contestația" button in `AnalysisResult` is shown only when `result.institution` exists and is contestable (`institution.iban || institution.associated_court` — the exact same predicate M2's guide page already uses), and on success navigates to `/dosare/{id}` (Task 4 builds that route; this task only needs the redirect target to exist by the time Task 4 lands, which it will since tasks run in plan order).

- [ ] **Step 1: Write failing tests for `POST /api/cases`**

Create `tests/api/cases.test.ts`:

```typescript
// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  createDb: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/cases', () => ({
  createCase: vi.fn(),
}));

import { POST } from '@/app/api/cases/route';
import { createCase } from '@/lib/cases';

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/cases', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DATABASE_URL = 'postgres://test';
});

describe('POST /api/cases', () => {
  it('returns 400 when description is missing', async () => {
    const response = await POST(makeRequest({ institutionCode: 'ANAF' }));
    expect(response.status).toBe(400);
  });

  it('returns 400 when institutionCode is missing', async () => {
    const response = await POST(makeRequest({ description: 'Am primit o amendă.' }));
    expect(response.status).toBe(400);
  });

  it('creates and returns the case on valid input', async () => {
    vi.mocked(createCase).mockResolvedValue({
      id: '1',
      case_number: 'GD-2026-0001',
      user_description: 'Am primit o amendă.',
      ai_analysis: null,
      recommended_institution_id: null,
      institution_code: 'PRIMARIE',
      status: 'new',
      session_id: null,
      created_at: '2026-09-28T10:00:00.000Z',
      petitioner_name: null,
      petitioner_cnp: null,
      petitioner_address: null,
      petitioner_email: null,
      petitioner_phone: null,
      pv_series: null,
      pv_number: null,
      pv_issue_date: null,
      pv_amount: null,
      pv_penalty_points: null,
      pv_issuing_agent: null,
      grounds: null,
      annexes: [],
      revision: 1,
      updated_at: '2026-09-28T10:00:00.000Z',
    });

    const response = await POST(makeRequest({ description: 'Am primit o amendă.', institutionCode: 'PRIMARIE' }));
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.case_number).toBe('GD-2026-0001');
  });

  it('returns 500 when case creation throws', async () => {
    vi.mocked(createCase).mockRejectedValue(new Error('db down'));
    const response = await POST(makeRequest({ description: 'x', institutionCode: 'ANAF' }));
    expect(response.status).toBe(500);
  });
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npm test -- tests/api/cases.test.ts`
Expected: FAIL — `@/app/api/cases/route` doesn't exist yet.

- [ ] **Step 3: Create `app/api/cases/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { createDb } from '@/lib/db';
import { createCase } from '@/lib/cases';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const description = typeof body?.description === 'string' ? body.description.trim() : '';
  const institutionCode = typeof body?.institutionCode === 'string' ? body.institutionCode : '';

  if (description.length === 0 || institutionCode.length === 0) {
    return NextResponse.json({ error: 'description and institutionCode are required' }, { status: 400 });
  }

  try {
    const sql = createDb();
    const created = await createCase(sql, {
      userDescription: description,
      aiAnalysis: body?.aiAnalysis ?? null,
      institutionCode,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Case creation failed', error);
    return NextResponse.json({ error: 'Nu am putut genera contestația. Încearcă din nou.' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `npm test -- tests/api/cases.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Write a failing test for the "Generează contestația" button**

Add to `tests/components/AnalysisResult.test.tsx`. First add a second fixture, `contestableResult`, that reuses `baseResult` but with an `institution` carrying `iban` (mirroring M2's `isContestable` predicate):

```tsx
const contestableResult: TriageResponse = {
  ...baseResult,
  institution: {
    ...baseResult.institution!,
    iban: 'RO49AAAA1B31007593840001',
  },
};
```

Then add these two tests inside the existing `describe('AnalysisResult', ...)` block:

```tsx
  it('shows the generate-contestation button when the institution is contestable', () => {
    render(<AnalysisResult result={contestableResult} />);
    expect(screen.getByRole('button', { name: 'Generează contestația' })).toBeInTheDocument();
  });

  it('does not show the generate-contestation button when the institution is not contestable', () => {
    render(<AnalysisResult result={baseResult} />);
    expect(screen.queryByRole('button', { name: 'Generează contestația' })).not.toBeInTheDocument();
  });
```

(`baseResult`'s institution has no `iban`/`associated_court`, so it stays non-contestable — no changes needed to the existing fixture.)

- [ ] **Step 6: Run the tests and verify they fail**

Run: `npm test -- tests/components/AnalysisResult.test.tsx`
Expected: FAIL — no such button exists yet.

- [ ] **Step 7: Update `components/AnalysisResult.tsx`**

Add `'use client'` at the top (required for the click handler and `useRouter`), add the imports, add the contestability check and handler, and render the button conditionally. The full updated file:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { InstitutionCard } from '@/components/InstitutionCard';
import type { TriageResponse } from '@/lib/types';

const URGENCY_LABELS: Record<TriageResponse['urgency'], string> = {
  low: 'Prioritate scăzută',
  normal: 'Prioritate normală',
  high: 'Prioritate ridicată',
};

const CHANNEL_LABELS: Record<TriageResponse['recommended_channel'], string> = {
  online: 'Online',
  telefon: 'Telefon',
  fizic: 'Fizic',
};

const LOW_CONFIDENCE_THRESHOLD = 0.7;

interface AnalysisResultProps {
  result: TriageResponse;
}

export function AnalysisResult({ result }: AnalysisResultProps) {
  const router = useRouter();
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [caseError, setCaseError] = useState<string | null>(null);

  const isContestable = Boolean(
    result.institution && (result.institution.iban || result.institution.associated_court)
  );

  async function handleGenerateContestation() {
    if (!result.institution) {
      return;
    }
    setIsCreatingCase(true);
    setCaseError(null);
    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: result.explanation,
          institutionCode: result.institution.code,
          aiAnalysis: result,
        }),
      });
      if (!response.ok) {
        throw new Error('create-failed');
      }
      const created = await response.json();
      router.push(`/dosare/${created.id}`);
    } catch {
      setCaseError('Nu am putut genera contestația. Încearcă din nou.');
      setIsCreatingCase(false);
    }
  }

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Rezultatul analizei"
      className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md"
    >
      <div className="flex items-center gap-space-sm flex-wrap">
        <Badge>{URGENCY_LABELS[result.urgency]}</Badge>
        <Badge variant="outline">{CHANNEL_LABELS[result.recommended_channel]}</Badge>
        {result.confidence < LOW_CONFIDENCE_THRESHOLD && (
          <Badge variant="outline">Recomandăm verificare manuală</Badge>
        )}
      </div>

      <p className="font-body-md text-body-md text-on-surface">{result.explanation}</p>

      {result.required_documents.length > 0 && (
        <div>
          <h3 className="font-title-md text-title-md text-on-surface mb-space-xs">
            Documente necesare
          </h3>
          <ul className="flex flex-col gap-space-xs">
            {result.required_documents.map((doc, index) => (
              <li key={index} className="flex items-center gap-space-xs font-body-sm text-body-sm">
                <span aria-hidden="true">✓</span>
                <span>{doc}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="font-title-md text-title-md text-on-surface mb-space-xs">Pași următori</h3>
        <ol className="flex flex-col gap-space-sm">
          {result.next_steps.map((step, index) => (
            <li key={index} className="flex items-center gap-space-sm">
              <span className="w-6 h-6 rounded-full bg-secondary text-on-secondary text-label-sm font-label-sm flex items-center justify-center shrink-0">
                {index + 1}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {result.institution ? (
        <InstitutionCard institution={result.institution} />
      ) : (
        <p role="alert" className="font-body-sm text-body-sm text-on-surface-variant">
          Nu am putut identifica exact instituția potrivită pentru această problemă. Verifică
          manual sau contactează primăria locală pentru îndrumare.
        </p>
      )}

      {isContestable && (
        <div className="flex flex-col gap-space-xs">
          <button
            type="button"
            onClick={handleGenerateContestation}
            disabled={isCreatingCase}
            className="bg-primary text-on-primary rounded-lg px-space-md py-2 font-label-lg text-label-lg disabled:opacity-50 self-start"
          >
            {isCreatingCase ? 'Se generează...' : 'Generează contestația'}
          </button>
          {caseError && (
            <p role="alert" className="font-label-sm text-label-sm text-error">
              {caseError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 8: Run the tests and verify they pass**

Run: `npm test -- tests/components/AnalysisResult.test.tsx`
Expected: PASS, 7 tests (5 existing + 2 new). Note: `useRouter` from `next/navigation` works in the existing jsdom test environment without extra mocking as long as the button click itself isn't exercised in these two tests (they only check presence/absence) — no router mock needed for this task's tests.

- [ ] **Step 9: Run the full suite and build**

Run: `npm test`
Expected: all test files pass.

Run: `npm run build`
Expected: succeeds with no type errors.

- [ ] **Step 10: Commit**

```bash
git add app/api/cases/route.ts tests/api/cases.test.ts components/AnalysisResult.tsx tests/components/AnalysisResult.test.tsx
git commit -m "feat: create a contestation case from a contestable triage result"
```

---

### Task 4: Legal document preview and the case page

**Files:**
- Create: `components/LegalDocumentPreview.tsx`
- Create: `tests/components/LegalDocumentPreview.test.tsx`
- Create: `app/dosare/[id]/page.tsx`
- Create: `tests/app/dosare-id.test.tsx`

**Interfaces:**
- Consumes: `findCase` (Task 1), `findInstitution` (M1), `Case`/`Institution` types.
- Produces: `<LegalDocumentPreview caseRecord institution />` and the `/dosare/[id]` route. Task 5 renders `<LegalDocumentPreview>` again (unchanged) alongside the edit form it adds to this same page.

- [ ] **Step 1: Write a failing test for `LegalDocumentPreview`**

Create `tests/components/LegalDocumentPreview.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LegalDocumentPreview } from '@/components/LegalDocumentPreview';
import type { Case, Institution } from '@/lib/types';

const caseRecord: Case = {
  id: '1',
  case_number: 'GD-2026-0001',
  user_description: 'Am primit o amendă.',
  ai_analysis: null,
  recommended_institution_id: null,
  institution_code: 'PRIMARIE',
  status: 'new',
  session_id: null,
  created_at: '2026-09-28T10:00:00.000Z',
  petitioner_name: 'Ion Popescu',
  petitioner_cnp: '1900010140017',
  petitioner_address: 'Str. Exemplu nr. 1, București',
  petitioner_email: null,
  petitioner_phone: null,
  pv_series: 'ABC',
  pv_number: '123',
  pv_issue_date: '2026-09-01',
  pv_amount: 500,
  pv_penalty_points: null,
  pv_issuing_agent: 'Poliția Locală Sector 1',
  grounds: 'Nu am fost prezent la fața locului în momentul constatării.',
  annexes: ['Copie carte de identitate'],
  revision: 1,
  updated_at: '2026-09-28T10:00:00.000Z',
};

const institution: Institution = {
  id: '1',
  code: 'PRIMARIE',
  name: 'Primăria (generică, locală)',
  description: null,
  category: 'administratie_locala',
  website_url: null,
  contact_form_url: null,
  phone: null,
  email: null,
  address: null,
  associated_court: 'Judecătoria de sector/localitate',
  iban: 'RO49AAAA1B31007593840002',
  cod_venit: '21.02.05.02',
  cui: '33333333',
  wait_time_minutes: 40,
};

describe('LegalDocumentPreview', () => {
  it('renders the petitioner, PV details, grounds, and annexes', () => {
    render(<LegalDocumentPreview caseRecord={caseRecord} institution={institution} />);

    expect(screen.getByText(/Ion Popescu/)).toBeInTheDocument();
    expect(screen.getByText(/1900010140017/)).toBeInTheDocument();
    expect(screen.getByText(/seria ABC nr\. 123/)).toBeInTheDocument();
    expect(screen.getByText(/500 LEI/)).toBeInTheDocument();
    expect(screen.getByText('Nu am fost prezent la fața locului în momentul constatării.')).toBeInTheDocument();
    expect(screen.getByText('Copie carte de identitate')).toBeInTheDocument();
  });

  it('renders placeholder text for unfilled petitioner/PV fields', () => {
    render(
      <LegalDocumentPreview
        caseRecord={{ ...caseRecord, petitioner_name: null, petitioner_cnp: null }}
        institution={institution}
      />
    );
    expect(screen.getByText(/\[Nume Prenume\]/)).toBeInTheDocument();
    expect(screen.getByText(/\[CNP\]/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- tests/components/LegalDocumentPreview.test.tsx`
Expected: FAIL — `@/components/LegalDocumentPreview` doesn't exist yet.

- [ ] **Step 3: Create `components/LegalDocumentPreview.tsx`**

```tsx
import type { Case, Institution } from '@/lib/types';

interface LegalDocumentPreviewProps {
  caseRecord: Case;
  institution: Institution;
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString('ro-RO') : '[Data]';
}

export function LegalDocumentPreview({ caseRecord, institution }: LegalDocumentPreviewProps) {
  return (
    <div className="bg-white text-black mx-auto max-w-[210mm] p-space-xl shadow-sm font-body-md text-body-md flex flex-col gap-space-md">
      <p className="text-right">{formatDate(caseRecord.pv_issue_date)}</p>
      <h1 className="text-center font-title-md text-title-md">PLÂNGERE CONTRAVENȚIONALĂ</h1>
      <p>
        Către: {institution.name}
        {institution.associated_court ? `, prin ${institution.associated_court}` : ''}
      </p>

      <section>
        <h2 className="font-title-md text-title-md mb-space-xs">I. Subsemnatul/Subsemnata</h2>
        <p>
          {caseRecord.petitioner_name || '[Nume Prenume]'}, CNP {caseRecord.petitioner_cnp || '[CNP]'}, domiciliat(ă)
          în {caseRecord.petitioner_address || '[Adresă]'}, formulez prezenta plângere contravențională împotriva
          procesului-verbal de contravenție seria {caseRecord.pv_series || '[Serie]'} nr.{' '}
          {caseRecord.pv_number || '[Număr]'}, încheiat la data de {formatDate(caseRecord.pv_issue_date)}.
        </p>
      </section>

      <section>
        <h2 className="font-title-md text-title-md mb-space-xs">II. Obiectul contestației</h2>
        <p>
          Prin procesul-verbal menționat mi s-a aplicat o amendă în cuantum de{' '}
          {caseRecord.pv_amount ?? '[Sumă]'} LEI
          {caseRecord.pv_penalty_points ? ` și ${caseRecord.pv_penalty_points} puncte de penalizare` : ''}, aplicată
          de {caseRecord.pv_issuing_agent || '[Agent emitent]'}.
        </p>
      </section>

      <section>
        <h2 className="font-title-md text-title-md mb-space-xs">III. Motivele contestației</h2>
        <p>{caseRecord.grounds || '[Motivele contestației]'}</p>
      </section>

      <p>
        Față de cele expuse, vă rog să dispuneți anularea procesului-verbal sus-menționat, conform O.G. nr. 2/2001
        privind regimul juridic al contravențiilor.
      </p>

      {caseRecord.annexes.length > 0 && (
        <section>
          <h2 className="font-title-md text-title-md mb-space-xs">Anexe</h2>
          <ul className="list-decimal list-inside">
            {caseRecord.annexes.map((annex, index) => (
              <li key={index}>{annex}</li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-space-lg">Data: {formatDate(caseRecord.updated_at)}</p>
      <p>Semnătura: ___________________</p>
    </div>
  );
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npm test -- tests/components/LegalDocumentPreview.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 5: Write failing tests for the `/dosare/[id]` page**

Create `tests/app/dosare-id.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/db', () => ({
  createDb: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/cases', () => ({
  findCase: vi.fn(),
}));

vi.mock('@/lib/institutions', () => ({
  findInstitution: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

import CasePage from '@/app/dosare/[id]/page';
import { findCase } from '@/lib/cases';
import { findInstitution } from '@/lib/institutions';
import type { Case, Institution } from '@/lib/types';

const caseRecord: Case = {
  id: '1',
  case_number: 'GD-2026-0001',
  user_description: 'Am primit o amendă.',
  ai_analysis: null,
  recommended_institution_id: null,
  institution_code: 'PRIMARIE',
  status: 'new',
  session_id: null,
  created_at: '2026-09-28T10:00:00.000Z',
  petitioner_name: null,
  petitioner_cnp: null,
  petitioner_address: null,
  petitioner_email: null,
  petitioner_phone: null,
  pv_series: null,
  pv_number: null,
  pv_issue_date: null,
  pv_amount: null,
  pv_penalty_points: null,
  pv_issuing_agent: null,
  grounds: null,
  annexes: [],
  revision: 1,
  updated_at: '2026-09-28T10:00:00.000Z',
};

const institution: Institution = {
  id: '1',
  code: 'PRIMARIE',
  name: 'Primăria (generică, locală)',
  description: null,
  category: 'administratie_locala',
  website_url: null,
  contact_form_url: null,
  phone: null,
  email: null,
  address: null,
  associated_court: 'Judecătoria de sector/localitate',
  iban: 'RO49AAAA1B31007593840002',
  cod_venit: '21.02.05.02',
  cui: '33333333',
  wait_time_minutes: 40,
};

describe('CasePage', () => {
  it('renders the case number and document preview', async () => {
    vi.mocked(findCase).mockResolvedValue(caseRecord);
    vi.mocked(findInstitution).mockResolvedValue(institution);

    render(
      await CasePage({ params: Promise.resolve({ id: '1' }), searchParams: Promise.resolve({}) })
    );

    expect(screen.getByText(/GD-2026-0001/)).toBeInTheDocument();
    expect(screen.getByText('PLÂNGERE CONTRAVENȚIONALĂ')).toBeInTheDocument();
  });

  it('calls notFound when the case does not exist', async () => {
    vi.mocked(findCase).mockResolvedValue(null);

    await expect(
      CasePage({ params: Promise.resolve({ id: 'missing' }), searchParams: Promise.resolve({}) })
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('calls notFound when the case has no resolvable institution', async () => {
    vi.mocked(findCase).mockResolvedValue(caseRecord);
    vi.mocked(findInstitution).mockResolvedValue(null);

    await expect(
      CasePage({ params: Promise.resolve({ id: '1' }), searchParams: Promise.resolve({}) })
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
```

- [ ] **Step 6: Run the tests and verify they fail**

Run: `npm test -- tests/app/dosare-id.test.tsx`
Expected: FAIL — `@/app/dosare/[id]/page` doesn't exist yet.

- [ ] **Step 7: Create `app/dosare/[id]/page.tsx`**

This task only renders the static preview (no edit button yet — Task 5 adds it, since the edit button needs client-side state this Server Component can't own directly):

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createDb } from '@/lib/db';
import { findCase } from '@/lib/cases';
import { findInstitution } from '@/lib/institutions';
import { LegalDocumentPreview } from '@/components/LegalDocumentPreview';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dosarul tău — Unde Merg?',
};

export default async function CasePage(props: PageProps<'/dosare/[id]'>) {
  const { id } = await props.params;
  const sql = createDb();
  const caseRecord = await findCase(sql, id);

  if (!caseRecord) {
    notFound();
  }

  const institution = caseRecord.institution_code
    ? await findInstitution(sql, caseRecord.institution_code)
    : null;

  if (!institution) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-margin py-space-xl flex flex-col gap-space-lg">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">Dosar {caseRecord.case_number}</h1>
      <LegalDocumentPreview caseRecord={caseRecord} institution={institution} />
    </div>
  );
}
```

- [ ] **Step 8: Run the tests and verify they pass**

Run: `npm test -- tests/app/dosare-id.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 9: Run the full suite and build**

Run: `npm test`
Expected: all test files pass.

Run: `npm run build`
Expected: succeeds with no type errors (a new dynamic route `/dosare/[id]` is emitted).

- [ ] **Step 10: Commit**

```bash
git add components/LegalDocumentPreview.tsx tests/components/LegalDocumentPreview.test.tsx app/dosare tests/app/dosare-id.test.tsx
git commit -m "feat: add the legal document preview and the case page"
```

---

### Task 5: Edit form — Petent/PV/Motive/Anexe, CNP validation error, network-error backup, save success

**Files:**
- Create: `components/EditCaseForm.tsx`
- Create: `tests/components/EditCaseForm.test.tsx`
- Create: `app/api/cases/[id]/route.ts`
- Create: `tests/api/cases-id.test.ts`
- Modify: `app/dosare/[id]/page.tsx`
- Modify: `tests/app/dosare-id.test.tsx`

**Interfaces:**
- Consumes: `isValidCnp` (Task 2), `updateCase` (Task 1), `Case` type.
- Produces: `PUT /api/cases/[id]` and `<EditCaseForm caseRecord onClose onSaved />`. `app/dosare/[id]/page.tsx` becomes a thin Server Component wrapper around a new client `CaseView` piece that owns the edit-modal/success-toast state — Server Components can't hold `useState`, so the interactive shell has to live in a client child.

- [ ] **Step 1: Write failing tests for `PUT /api/cases/[id]`**

Create `tests/api/cases-id.test.ts`:

```typescript
// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  createDb: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/cases', () => ({
  updateCase: vi.fn(),
}));

import { PUT } from '@/app/api/cases/[id]/route';
import { updateCase } from '@/lib/cases';

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/cases/1', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

const validBody = {
  petitionerName: 'Ion Popescu',
  petitionerCnp: '1900010140017',
  petitionerAddress: 'Str. Exemplu nr. 1',
  petitionerEmail: null,
  petitionerPhone: null,
  pvSeries: 'ABC',
  pvNumber: '123',
  pvIssueDate: '2026-09-01',
  pvAmount: 500,
  pvPenaltyPoints: null,
  pvIssuingAgent: null,
  grounds: 'Nu am fost prezent la fața locului.',
  annexes: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DATABASE_URL = 'postgres://test';
});

describe('PUT /api/cases/[id]', () => {
  it('returns 400 when the CNP is invalid', async () => {
    const response = await PUT(makeRequest({ ...validBody, petitionerCnp: '19000101400' }), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(response.status).toBe(400);
  });

  it('updates and returns the case on a valid CNP', async () => {
    vi.mocked(updateCase).mockResolvedValue({
      id: '1',
      case_number: 'GD-2026-0001',
      user_description: 'x',
      ai_analysis: null,
      recommended_institution_id: null,
      institution_code: 'PRIMARIE',
      status: 'new',
      session_id: null,
      created_at: '2026-09-28T10:00:00.000Z',
      petitioner_name: 'Ion Popescu',
      petitioner_cnp: '1900010140017',
      petitioner_address: 'Str. Exemplu nr. 1',
      petitioner_email: null,
      petitioner_phone: null,
      pv_series: 'ABC',
      pv_number: '123',
      pv_issue_date: '2026-09-01',
      pv_amount: 500,
      pv_penalty_points: null,
      pv_issuing_agent: null,
      grounds: 'Nu am fost prezent la fața locului.',
      annexes: [],
      revision: 2,
      updated_at: '2026-09-28T10:05:00.000Z',
    });

    const response = await PUT(makeRequest(validBody), { params: Promise.resolve({ id: '1' }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.revision).toBe(2);
  });

  it('returns 404 when the case does not exist', async () => {
    vi.mocked(updateCase).mockResolvedValue(null);
    const response = await PUT(makeRequest(validBody), { params: Promise.resolve({ id: 'missing' }) });
    expect(response.status).toBe(404);
  });

  it('returns 500 when the update throws', async () => {
    vi.mocked(updateCase).mockRejectedValue(new Error('db down'));
    const response = await PUT(makeRequest(validBody), { params: Promise.resolve({ id: '1' }) });
    expect(response.status).toBe(500);
  });
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npm test -- tests/api/cases-id.test.ts`
Expected: FAIL — `@/app/api/cases/[id]/route` doesn't exist yet.

- [ ] **Step 3: Create `app/api/cases/[id]/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { createDb } from '@/lib/db';
import { updateCase } from '@/lib/cases';
import { isValidCnp } from '@/lib/cnp';

export async function PUT(req: Request, props: RouteContext<'/api/cases/[id]'>) {
  const { id } = await props.params;
  const body = await req.json().catch(() => null);

  if (!body || typeof body.petitionerCnp !== 'string' || !isValidCnp(body.petitionerCnp)) {
    return NextResponse.json({ error: 'CNP invalid' }, { status: 400 });
  }

  try {
    const sql = createDb();
    const updated = await updateCase(sql, id, {
      petitionerName: typeof body.petitionerName === 'string' ? body.petitionerName : '',
      petitionerCnp: body.petitionerCnp,
      petitionerAddress: typeof body.petitionerAddress === 'string' ? body.petitionerAddress : '',
      petitionerEmail: typeof body.petitionerEmail === 'string' ? body.petitionerEmail : null,
      petitionerPhone: typeof body.petitionerPhone === 'string' ? body.petitionerPhone : null,
      pvSeries: typeof body.pvSeries === 'string' ? body.pvSeries : '',
      pvNumber: typeof body.pvNumber === 'string' ? body.pvNumber : '',
      pvIssueDate: typeof body.pvIssueDate === 'string' ? body.pvIssueDate : '',
      pvAmount: typeof body.pvAmount === 'number' ? body.pvAmount : 0,
      pvPenaltyPoints: typeof body.pvPenaltyPoints === 'number' ? body.pvPenaltyPoints : null,
      pvIssuingAgent: typeof body.pvIssuingAgent === 'string' ? body.pvIssuingAgent : null,
      grounds: typeof body.grounds === 'string' ? body.grounds : '',
      annexes: Array.isArray(body.annexes) ? body.annexes : [],
    });

    if (!updated) {
      return NextResponse.json({ error: 'Dosarul nu a fost găsit' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Case update failed', error);
    return NextResponse.json({ error: 'Nu am putut salva modificările.' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `npm test -- tests/api/cases-id.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Write failing tests for `EditCaseForm`**

Create `tests/components/EditCaseForm.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditCaseForm } from '@/components/EditCaseForm';
import type { Case } from '@/lib/types';

const caseRecord: Case = {
  id: '1',
  case_number: 'GD-2026-0001',
  user_description: 'x',
  ai_analysis: null,
  recommended_institution_id: null,
  institution_code: 'PRIMARIE',
  status: 'new',
  session_id: null,
  created_at: '2026-09-28T10:00:00.000Z',
  petitioner_name: null,
  petitioner_cnp: null,
  petitioner_address: null,
  petitioner_email: null,
  petitioner_phone: null,
  pv_series: null,
  pv_number: null,
  pv_issue_date: null,
  pv_amount: null,
  pv_penalty_points: null,
  pv_issuing_agent: null,
  grounds: null,
  annexes: [],
  revision: 1,
  updated_at: '2026-09-28T10:00:00.000Z',
};

describe('EditCaseForm', () => {
  it('blocks save and shows an inline error when the CNP is invalid', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    vi.stubGlobal('fetch', vi.fn());

    render(<EditCaseForm caseRecord={caseRecord} onClose={vi.fn()} onSaved={onSaved} />);
    await user.type(screen.getByLabelText('CNP'), '19000101400');
    await user.click(screen.getByRole('button', { name: 'Salvează' }));

    expect(screen.getByRole('alert')).toHaveTextContent('CNP invalid');
    expect(fetch).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('saves successfully with a valid CNP and calls onSaved', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const updated = { ...caseRecord, petitioner_name: 'Ion Popescu', revision: 2 };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(updated) })
    );

    render(<EditCaseForm caseRecord={caseRecord} onClose={vi.fn()} onSaved={onSaved} />);
    await user.type(screen.getByLabelText('Nume și prenume'), 'Ion Popescu');
    await user.type(screen.getByLabelText('CNP'), '1900010140017');
    await user.click(screen.getByRole('button', { name: 'Salvează' }));

    expect(await screen.findByRole('button')).toBeInTheDocument();
    expect(onSaved).toHaveBeenCalledWith(updated);
  });

  it('shows the network-error backup state when the save request fails, without losing entered data', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    render(<EditCaseForm caseRecord={caseRecord} onClose={vi.fn()} onSaved={vi.fn()} />);
    await user.type(screen.getByLabelText('CNP'), '1900010140017');
    await user.click(screen.getByRole('button', { name: 'Salvează' }));

    expect(await screen.findByText(/Datele tale NU au fost pierdute/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Descarcă backup' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reîncearcă' })).toBeInTheDocument();
    expect(screen.getByLabelText('CNP')).toHaveValue('1900010140017');
  });

  it('toggles CNP visibility', async () => {
    const user = userEvent.setup();
    render(<EditCaseForm caseRecord={caseRecord} onClose={vi.fn()} onSaved={vi.fn()} />);

    expect(screen.getByLabelText('CNP')).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Arată' }));
    expect(screen.getByLabelText('CNP')).toHaveAttribute('type', 'text');
  });

  it('adds and removes an annex', async () => {
    const user = userEvent.setup();
    render(<EditCaseForm caseRecord={caseRecord} onClose={vi.fn()} onSaved={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('Denumire document'), 'Copie carte de identitate');
    await user.click(screen.getByRole('button', { name: 'Adaugă' }));
    expect(screen.getByText('Copie carte de identitate')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Șterge Copie carte de identitate' }));
    expect(screen.queryByText('Copie carte de identitate')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run the tests and verify they fail**

Run: `npm test -- tests/components/EditCaseForm.test.tsx`
Expected: FAIL — `@/components/EditCaseForm` doesn't exist yet.

- [ ] **Step 7: Create `components/EditCaseForm.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { isValidCnp } from '@/lib/cnp';
import type { Case } from '@/lib/types';

interface EditCaseFormProps {
  caseRecord: Case;
  onClose: () => void;
  onSaved: (updated: Case) => void;
}

type SaveState = 'idle' | 'saving' | 'error';

export function EditCaseForm({ caseRecord, onClose, onSaved }: EditCaseFormProps) {
  const [petitionerName, setPetitionerName] = useState(caseRecord.petitioner_name ?? '');
  const [petitionerCnp, setPetitionerCnp] = useState(caseRecord.petitioner_cnp ?? '');
  const [cnpVisible, setCnpVisible] = useState(false);
  const [petitionerAddress, setPetitionerAddress] = useState(caseRecord.petitioner_address ?? '');
  const [petitionerEmail, setPetitionerEmail] = useState(caseRecord.petitioner_email ?? '');
  const [pvSeries, setPvSeries] = useState(caseRecord.pv_series ?? '');
  const [pvNumber, setPvNumber] = useState(caseRecord.pv_number ?? '');
  const [pvIssueDate, setPvIssueDate] = useState(caseRecord.pv_issue_date ?? '');
  const [pvAmount, setPvAmount] = useState(caseRecord.pv_amount?.toString() ?? '');
  const [grounds, setGrounds] = useState(caseRecord.grounds ?? '');
  const [annexes, setAnnexes] = useState<string[]>(caseRecord.annexes);
  const [newAnnex, setNewAnnex] = useState('');

  const [cnpError, setCnpError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastAttemptAt, setLastAttemptAt] = useState<number | null>(null);

  function addAnnex() {
    if (newAnnex.trim().length === 0) {
      return;
    }
    setAnnexes((current) => [...current, newAnnex.trim()]);
    setNewAnnex('');
  }

  function removeAnnex(annex: string) {
    setAnnexes((current) => current.filter((item) => item !== annex));
  }

  function buildPayload() {
    return {
      petitionerName,
      petitionerCnp,
      petitionerAddress,
      petitionerEmail: petitionerEmail || null,
      petitionerPhone: caseRecord.petitioner_phone,
      pvSeries,
      pvNumber,
      pvIssueDate,
      pvAmount: Number(pvAmount) || 0,
      pvPenaltyPoints: caseRecord.pv_penalty_points,
      pvIssuingAgent: caseRecord.pv_issuing_agent,
      grounds,
      annexes,
    };
  }

  function downloadBackup() {
    const payload = buildPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_contestatie_${caseRecord.case_number}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleSave() {
    if (!isValidCnp(petitionerCnp)) {
      setCnpError('CNP invalid (trebuie să conțină exact 13 cifre valide)');
      return;
    }
    setCnpError(null);
    setSaveState('saving');
    setLastAttemptAt(Date.now());

    try {
      const response = await fetch(`/api/cases/${caseRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });

      if (!response.ok) {
        throw new Error('save-failed');
      }

      const updated = (await response.json()) as Case;
      setSaveState('idle');
      onSaved(updated);
    } catch {
      setSaveState('error');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-space-md">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-lg">
        <div className="flex items-center justify-between">
          <h2 className="font-title-md text-title-md text-on-surface">Editează datele contestației</h2>
          <button type="button" onClick={onClose} aria-label="Închide" className="text-on-surface-variant">
            ✕
          </button>
        </div>

        {saveState === 'error' && (
          <div role="alert" className="bg-error-container rounded-lg p-space-md flex flex-col gap-space-sm">
            <p className="font-body-sm text-body-sm text-on-error-container">
              Datele tale NU au fost pierdute. A apărut o eroare de conexiune la salvare.
            </p>
            <p className="font-label-sm text-label-sm text-on-error-container">
              Ultima încercare: {lastAttemptAt ? new Date(lastAttemptAt).toLocaleTimeString('ro-RO') : '—'}
            </p>
            <div className="flex gap-space-sm">
              <button type="button" onClick={downloadBackup} className="text-secondary underline underline-offset-2">
                Descarcă backup
              </button>
              <button type="button" onClick={handleSave} className="text-secondary underline underline-offset-2">
                Reîncearcă
              </button>
            </div>
          </div>
        )}

        <fieldset className="flex flex-col gap-space-sm">
          <legend className="font-title-md text-title-md text-on-surface mb-space-xs">Petent</legend>
          <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
            Nume și prenume
            <input
              value={petitionerName}
              onChange={(e) => setPetitionerName(e.target.value)}
              className="rounded-lg border border-outline-variant px-space-sm py-2 font-body-sm text-body-sm text-on-surface"
            />
          </label>
          <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
            CNP
            <div className="flex gap-space-sm items-center">
              <input
                type={cnpVisible ? 'text' : 'password'}
                value={petitionerCnp}
                onChange={(e) => setPetitionerCnp(e.target.value)}
                className="rounded-lg border border-outline-variant px-space-sm py-2 font-body-sm text-body-sm text-on-surface flex-1"
              />
              <button
                type="button"
                onClick={() => setCnpVisible((visible) => !visible)}
                className="text-secondary underline underline-offset-2"
              >
                {cnpVisible ? 'Ascunde' : 'Arată'}
              </button>
            </div>
            {cnpError && (
              <p role="alert" className="font-label-sm text-label-sm text-error">
                {cnpError}
              </p>
            )}
          </label>
          <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
            Adresă
            <input
              value={petitionerAddress}
              onChange={(e) => setPetitionerAddress(e.target.value)}
              className="rounded-lg border border-outline-variant px-space-sm py-2 font-body-sm text-body-sm text-on-surface"
            />
          </label>
          <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
            Email
            <input
              type="email"
              value={petitionerEmail}
              onChange={(e) => setPetitionerEmail(e.target.value)}
              className="rounded-lg border border-outline-variant px-space-sm py-2 font-body-sm text-body-sm text-on-surface"
            />
          </label>
        </fieldset>

        <fieldset className="flex flex-col gap-space-sm">
          <legend className="font-title-md text-title-md text-on-surface mb-space-xs">PV & sancțiune</legend>
          <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
            Serie PV
            <input
              value={pvSeries}
              onChange={(e) => setPvSeries(e.target.value)}
              className="rounded-lg border border-outline-variant px-space-sm py-2 font-body-sm text-body-sm text-on-surface"
            />
          </label>
          <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
            Număr PV
            <input
              value={pvNumber}
              onChange={(e) => setPvNumber(e.target.value)}
              className="rounded-lg border border-outline-variant px-space-sm py-2 font-body-sm text-body-sm text-on-surface"
            />
          </label>
          <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
            Data emiterii
            <input
              type="date"
              value={pvIssueDate}
              onChange={(e) => setPvIssueDate(e.target.value)}
              className="rounded-lg border border-outline-variant px-space-sm py-2 font-body-sm text-body-sm text-on-surface"
            />
          </label>
          <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
            Suma amenzii (LEI)
            <input
              type="number"
              value={pvAmount}
              onChange={(e) => setPvAmount(e.target.value)}
              className="rounded-lg border border-outline-variant px-space-sm py-2 font-body-sm text-body-sm text-on-surface"
            />
          </label>
        </fieldset>

        <fieldset className="flex flex-col gap-space-sm">
          <legend className="font-title-md text-title-md text-on-surface mb-space-xs">Motivele</legend>
          <textarea
            value={grounds}
            onChange={(e) => setGrounds(e.target.value)}
            rows={4}
            className="rounded-lg border border-outline-variant px-space-sm py-2 font-body-sm text-body-sm text-on-surface"
          />
        </fieldset>

        <fieldset className="flex flex-col gap-space-sm">
          <legend className="font-title-md text-title-md text-on-surface mb-space-xs">Anexe</legend>
          <ul className="flex flex-col gap-space-xs">
            {annexes.map((annex) => (
              <li key={annex} className="flex items-center justify-between font-body-sm text-body-sm text-on-surface">
                <span>{annex}</span>
                <button
                  type="button"
                  onClick={() => removeAnnex(annex)}
                  aria-label={`Șterge ${annex}`}
                  className="text-error"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-space-sm">
            <input
              value={newAnnex}
              onChange={(e) => setNewAnnex(e.target.value)}
              placeholder="Denumire document"
              className="flex-1 rounded-lg border border-outline-variant px-space-sm py-2 font-body-sm text-body-sm text-on-surface"
            />
            <button type="button" onClick={addAnnex} className="text-secondary underline underline-offset-2">
              Adaugă
            </button>
          </div>
        </fieldset>

        <button
          type="button"
          onClick={handleSave}
          disabled={saveState === 'saving'}
          className="bg-primary text-on-primary rounded-lg px-space-md py-2 font-label-lg text-label-lg disabled:opacity-50"
        >
          {saveState === 'saving' ? 'Se salvează...' : 'Salvează'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Run the tests and verify they pass**

Run: `npm test -- tests/components/EditCaseForm.test.tsx`
Expected: PASS, 5 tests. (`URL.createObjectURL`/`URL.revokeObjectURL` exist in jsdom by default in this project's Vitest setup — if the backup test fails with a "not a function" error, that's the one thing worth checking first.)

- [ ] **Step 9: Wire the edit form into the case page — update `tests/app/dosare-id.test.tsx`**

The page needs client-side state (open/close the modal, swap in the saved case, show a success toast) that a Server Component can't hold directly, so this step splits it into a thin Server Component (`app/dosare/[id]/page.tsx`, unchanged data-fetching logic) rendering a new client component (`CaseView`) that owns that state. Add this test to `tests/app/dosare-id.test.tsx`:

```tsx
  it('opens the edit form, saves, and shows a success toast with the updated document', async () => {
    const user = userEvent.setup();
    vi.mocked(findCase).mockResolvedValue(caseRecord);
    vi.mocked(findInstitution).mockResolvedValue(institution);
    const updated = { ...caseRecord, petitioner_name: 'Ion Popescu', revision: 2 };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(updated) }));

    render(await CasePage({ params: Promise.resolve({ id: '1' }), searchParams: Promise.resolve({}) }));

    await user.click(screen.getByRole('button', { name: 'Editează' }));
    await user.type(screen.getByLabelText('Nume și prenume'), 'Ion Popescu');
    await user.type(screen.getByLabelText('CNP'), '1900010140017');
    await user.click(screen.getByRole('button', { name: 'Salvează' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Datele au fost salvate cu succes.');
    expect(screen.getByText(/Ion Popescu/)).toBeInTheDocument();
  });
```

Add `import userEvent from '@testing-library/user-event';` to the top of the test file.

- [ ] **Step 10: Run the test and verify it fails**

Run: `npm test -- tests/app/dosare-id.test.tsx`
Expected: FAIL — there's no "Editează" button yet.

- [ ] **Step 11: Create `components/CaseView.tsx` and update `app/dosare/[id]/page.tsx` to use it**

```tsx
'use client';

import { useState } from 'react';
import { LegalDocumentPreview } from '@/components/LegalDocumentPreview';
import { EditCaseForm } from '@/components/EditCaseForm';
import type { Case, Institution } from '@/lib/types';

interface CaseViewProps {
  initialCase: Case;
  institution: Institution;
}

export function CaseView({ initialCase, institution }: CaseViewProps) {
  const [caseRecord, setCaseRecord] = useState(initialCase);
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  function handleSaved(updated: Case) {
    setCaseRecord(updated);
    setIsEditing(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 4000);
  }

  return (
    <div className="max-w-5xl mx-auto px-margin py-space-xl flex flex-col gap-space-lg">
      {showSuccess && (
        <div
          role="status"
          className="bg-tertiary-container text-on-tertiary-container rounded-lg p-space-md font-body-sm text-body-sm"
        >
          Datele au fost salvate cu succes.
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Dosar {caseRecord.case_number}</h1>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="bg-primary text-on-primary rounded-lg px-space-md py-2 font-label-lg text-label-lg"
        >
          Editează
        </button>
      </div>

      <LegalDocumentPreview caseRecord={caseRecord} institution={institution} />

      {isEditing && (
        <EditCaseForm caseRecord={caseRecord} onClose={() => setIsEditing(false)} onSaved={handleSaved} />
      )}
    </div>
  );
}
```

Replace `app/dosare/[id]/page.tsx`'s return statement (everything is unchanged above the `return`):

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createDb } from '@/lib/db';
import { findCase } from '@/lib/cases';
import { findInstitution } from '@/lib/institutions';
import { CaseView } from '@/components/CaseView';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dosarul tău — Unde Merg?',
};

export default async function CasePage(props: PageProps<'/dosare/[id]'>) {
  const { id } = await props.params;
  const sql = createDb();
  const caseRecord = await findCase(sql, id);

  if (!caseRecord) {
    notFound();
  }

  const institution = caseRecord.institution_code
    ? await findInstitution(sql, caseRecord.institution_code)
    : null;

  if (!institution) {
    notFound();
  }

  return <CaseView initialCase={caseRecord} institution={institution} />;
}
```

(`LegalDocumentPreview` is no longer imported directly by the page — it's imported by `CaseView` now. Remove the now-unused import from the page file.)

- [ ] **Step 12: Run the tests and verify they pass**

Run: `npm test -- tests/app/dosare-id.test.tsx`
Expected: PASS, 4 tests (3 existing + 1 new).

- [ ] **Step 13: Run the full suite and build**

Run: `npm test`
Expected: all test files pass.

Run: `npm run build`
Expected: succeeds with no type errors.

- [ ] **Step 14: Manual check (recommended, not required)**

Run `npm run dev` with a real `DATABASE_URL` and a real `GROQ_API_KEY`, submit a triage description that matches an institution with `iban`/`associated_court` set (e.g. "Am primit o amendă de la Primărie"), click "Generează contestația", confirm the case page and document preview render, open the edit form, try an invalid then a valid CNP, save successfully, and (optionally, by disconnecting network briefly) trigger the backup/retry error state.

- [ ] **Step 15: Commit**

```bash
git add components/EditCaseForm.tsx tests/components/EditCaseForm.test.tsx app/api/cases/[id]/route.ts tests/api/cases-id.test.ts components/CaseView.tsx app/dosare/[id]/page.tsx tests/app/dosare-id.test.tsx
git commit -m "feat: add the contestation edit form with CNP validation, network-error backup, and save-success states"
```

---

## Self-review notes

- Spec coverage: catalog screen #6 (A4 document preview) → Task 4; screen #7 (edit modal, 4 sections) → Task 5; screen #8 (CNP validation error) → Task 5's inline CNP error, driven by the real Task 2 checksum utility rather than a stubbed length check; screen #9 (network error with local JSON backup) → Task 5's error state + `downloadBackup`; screen #11 (save success) → Task 5's success toast. Screen #10 (AI-triage timeout) is explicitly out of scope per the roadmap, which groups it with M4's offline-error infrastructure instead.
- Type consistency checked: `Case` (Task 1) flows unchanged through `createCase`/`findCase`/`updateCase` (Task 1), the `POST`/`PUT` routes (Tasks 3/5), `LegalDocumentPreview`/`EditCaseForm`/`CaseView` (Tasks 4/5) — no field renamed or reshaped between tasks. `isValidCnp` (Task 2) has one signature (`(cnp: string) => boolean`), consumed identically client-side (Task 5's form) and server-side (Task 5's route).
- Placeholder scan: no "TBD"/"add appropriate styling" found; every step has runnable code or an exact command.
- Pre-flight conflict scan: Task 1 → Tasks 3/4/5 (`Case` type, `lib/cases.ts` functions) — consistent, no interface drift. Task 2 → Task 5 (`isValidCnp`) — consistent. Task 3 → Task 4 (the "Generează contestația" redirect target `/dosare/[id]`) — Task 3's button code references a route Task 4 hasn't built yet at Task 3's dispatch time, but this is a forward reference resolved by plan-order execution (identical in shape to M1's Task 6→Task 7 dependency), not a real conflict. Task 4 → Task 5 (`app/dosare/[id]/page.tsx` is created by Task 4 and modified by Task 5 to delegate to a new `CaseView`) — sequential, non-overlapping edits, flagged here explicitly per the pre-flight scan's own requirement to call out every task that touches a file another task also touches.
