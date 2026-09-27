# Unde Merg — MVP Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working local MVP of "Unde Merg" — a Romanian-language app where a citizen describes a problem in free text, Gemini classifies it, and the app shows which public institution to contact, what documents are needed, and the next steps.

**Architecture:** Next.js 15 App Router with a single API route (`/api/triage`) that calls Gemini, validates its JSON output with Zod, looks up the matching institution in Supabase, and returns a merged result. The frontend is a single page with a problem-input form and a result view built from small, independently-testable components.

**Tech Stack:** Next.js (TypeScript, App Router), Tailwind CSS, shadcn/ui, Zod, `@google/generative-ai`, `@supabase/supabase-js` + `@supabase/ssr`, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-27-unde-merg-spec.md`

## Global Constraints

- All user-facing text is in Romanian.
- Frontend uses Next.js 15+ App Router, Tailwind CSS, and shadcn/ui components (accessible by default).
- Accessibility: minimum 4.5:1 text contrast, visible focus states, ARIA labels on interactive elements, full keyboard navigation.
- AI model: `gemini-2.5-flash` via `@google/generative-ai`, free tier.
- All Gemini output is validated with a Zod schema before use — never trust raw model JSON.
- Every task in this plan must leave `npm test` and `npm run build` passing before it is considered done.

## Prerequisites (manual — you do these, not the agent)

These require accounts and credentials that can't be created from the terminal. Do them before Task 1:

1. Create a [Supabase](https://supabase.com) project. From Project Settings → API, note:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (keep secret, server-only)
2. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey) → `GEMINI_API_KEY`.
3. (Optional at this stage, needed before deploying) Create GitHub and Vercel accounts.

This plan builds and tests everything locally against mocked Gemini/Supabase calls, so the app can be fully developed and tested before you deploy. You'll need the real keys for Task 1's `.env.local` and to manually apply the Task 2 migration to your live Supabase project.

## Out of scope for this plan (spec Phases 5–7, follow-up work)

- Researching and entering real contact-form URLs / phone numbers for every institution (spec Phase 5) — this plan seeds 8 institutions with verified website domains only; `contact_form_url`, `phone`, and `email` are left `NULL` for you to fill in later.
- Deploying to Vercel, custom domain, Search Console submission (spec Phase 6 launch steps).
- Supabase Auth, saved cases/session tracking, the `cases` table's actual usage, a "was this useful?" feedback button, Open311 integration (spec Phase 7).

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css` (via `create-next-app`)
- Create: `components/ui/button.tsx`, `components/ui/textarea.tsx`, `components/ui/card.tsx`, `components/ui/badge.tsx` (via `shadcn` CLI)
- Create: `vitest.config.ts`, `vitest.setup.ts`
- Create: `tests/smoke.test.ts`
- Modify: `package.json` (add `test`/`test:watch` scripts)

**Interfaces:**
- Produces: a working `npm run dev`, `npm run build`, and `npm test` in this directory, plus the `@/*` path alias resolving to the project root, for every later task to build on.

- [ ] **Step 1: Scaffold the Next.js app**

Run from `/Users/adrian/Downloads/Unde Merg` (this directory is currently empty and not a git repo):

```bash
npx create-next-app@latest . --typescript --tailwind --app --eslint --no-src-dir --import-alias "@/*" --use-npm
```

When prompted, accept defaults. This also runs `git init` and an initial commit for you.

- [ ] **Step 2: Add shadcn/ui and the components this plan needs**

```bash
npx shadcn@latest init -d
npx shadcn@latest add button textarea card badge
```

- [ ] **Step 3: Install runtime dependencies**

```bash
npm install zod @google/generative-ai @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 4: Install test dependencies**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 5: Configure Vitest**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

Create `vitest.setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest';
```

Add to `package.json` `scripts`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Write a smoke test**

Create `tests/smoke.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

describe('test setup', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 7: Run the smoke test and verify it passes**

Run: `npm test`
Expected: 1 test file, 1 test, PASS.

- [ ] **Step 8: Create `.env.local` and `.env.local.example`**

Create `.env.local` (never commit this — `create-next-app`'s `.gitignore` already excludes `.env*.local`) with your real values from the Prerequisites section:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-key
```

Create `.env.local.example` with the same keys but empty values, and commit that file.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with shadcn/ui and Vitest"
```

---

### Task 2: Database schema, types, and Institution validation

**Files:**
- Create: `supabase/migrations/0001_init.sql`
- Create: `supabase/seed.sql`
- Create: `lib/schema.ts`
- Create: `lib/types.ts`
- Test: `tests/lib/schema.test.ts`

**Interfaces:**
- Produces: `InstitutionSchema` (Zod), `Institution` type (`lib/types.ts`), both consumed by every later task that touches institution data.

- [ ] **Step 1: Write the failing test**

Create `tests/lib/schema.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { InstitutionSchema } from '@/lib/schema';

describe('InstitutionSchema', () => {
  it('accepts a valid institution', () => {
    const result = InstitutionSchema.safeParse({
      id: '11111111-1111-1111-1111-111111111111',
      code: 'ANPC',
      name: 'Autoritatea Națională pentru Protecția Consumatorilor',
      description: 'Protecția consumatorilor',
      category: 'protectia_consumatorului',
      website_url: 'https://anpc.ro',
      contact_form_url: null,
      phone: null,
      email: null,
      address: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an institution with an invalid website url', () => {
    const result = InstitutionSchema.safeParse({
      id: '1',
      code: 'ANPC',
      name: 'ANPC',
      description: null,
      category: null,
      website_url: 'not-a-url',
      contact_form_url: null,
      phone: null,
      email: null,
      address: null,
    });
    expect(result.success).toBe(false);
  });
});

describe('seed data', () => {
  it('includes every core institution code', () => {
    const seedPath = path.join(process.cwd(), 'supabase', 'seed.sql');
    const seed = readFileSync(seedPath, 'utf-8');
    const expectedCodes = ['ANPC', 'ANAF', 'PRIMARIE', 'POLITIE_LOCALA', 'ANRE', 'ANCOM', 'CNAS', 'ITM'];
    for (const code of expectedCodes) {
      expect(seed).toContain(`'${code}'`);
    }
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- tests/lib/schema.test.ts`
Expected: FAIL — `Cannot find module '@/lib/schema'` (and `supabase/seed.sql` does not exist).

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/0001_init.sql`:

```sql
create table institutions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  category text,
  website_url text,
  contact_form_url text,
  phone text,
  email text,
  address text,
  created_at timestamptz not null default now()
);

create table problem_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  keywords text[] not null default '{}',
  institution_id uuid references institutions(id),
  created_at timestamptz not null default now()
);

create table cases (
  id uuid primary key default gen_random_uuid(),
  user_description text not null,
  ai_analysis jsonb,
  recommended_institution_id uuid references institutions(id),
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved')),
  session_id text,
  created_at timestamptz not null default now()
);

create index cases_session_id_idx on cases (session_id);
create index cases_status_idx on cases (status);
```

Note: `code` (e.g. `ANPC`, `ANAF`) is the stable identifier Gemini's `institution_type` field matches against — it is a separate column from the free-text `category`, so lookups don't depend on Gemini and the seed data agreeing on category wording.

- [ ] **Step 4: Write the seed data**

Create `supabase/seed.sql`:

```sql
insert into institutions (code, name, description, category, website_url) values
  ('ANPC', 'Autoritatea Națională pentru Protecția Consumatorilor', 'Instituția responsabilă pentru protecția drepturilor consumatorilor.', 'protectia_consumatorului', 'https://anpc.ro'),
  ('ANAF', 'Agenția Națională de Administrare Fiscală', 'Administrează impozitele, taxele și contribuțiile sociale.', 'fiscal', 'https://www.anaf.ro'),
  ('PRIMARIE', 'Primăria (generică, locală)', 'Sesizări și amenzi la nivel local; site-ul variază în funcție de localitate.', 'administratie_locala', null),
  ('POLITIE_LOCALA', 'Poliția Locală', 'Sesizări stradale și contravenții locale; site-ul variază în funcție de localitate.', 'ordine_publica', null),
  ('ANRE', 'Autoritatea Națională de Reglementare în Domeniul Energiei', 'Reglementează piața de energie electrică și gaze naturale.', 'energie', 'https://www.anre.ro'),
  ('ANCOM', 'Autoritatea Națională pentru Administrare și Reglementare în Comunicații', 'Reglementează piața de telecomunicații.', 'telecomunicatii', 'https://www.ancom.ro'),
  ('CNAS', 'Casa Națională de Asigurări de Sănătate', 'Administrează sistemul de asigurări sociale de sănătate.', 'sanatate', 'https://cnas.ro'),
  ('ITM', 'Inspecția Muncii', 'Controlează respectarea legislației muncii.', 'munca', 'https://www.inspectiamuncii.ro')
on conflict (code) do nothing;
```

`website_url` values are the well-known root domains; `contact_form_url`, `phone`, and `email` are left out (NULL) — verify and fill those in before relying on them in production (spec Phase 5).

- [ ] **Step 5: Write the schema and types**

Create `lib/schema.ts`:

```typescript
import { z } from 'zod';

export const InstitutionSchema = z.object({
  id: z.string(),
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  category: z.string().nullable(),
  website_url: z.string().url().nullable(),
  contact_form_url: z.string().url().nullable(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  address: z.string().nullable(),
});
```

Create `lib/types.ts`:

```typescript
import type { z } from 'zod';
import type { InstitutionSchema } from './schema';

export type Institution = z.infer<typeof InstitutionSchema>;
```

- [ ] **Step 6: Run the test and verify it passes**

Run: `npm test -- tests/lib/schema.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 7 (manual): Apply the migration to your real Supabase project**

In the Supabase dashboard → SQL Editor, paste and run `supabase/migrations/0001_init.sql`, then `supabase/seed.sql`. (Or, if you install the Supabase CLI and link the project, `supabase db push` followed by running the seed file.)

- [ ] **Step 8: Commit**

```bash
git add supabase lib/schema.ts lib/types.ts tests/lib/schema.test.ts
git commit -m "feat: add institution schema, migration, and seed data"
```

---

### Task 3: Triage result schema and Gemini JSON extraction

**Files:**
- Modify: `lib/schema.ts` (add `TriageResultSchema`)
- Modify: `lib/types.ts` (add `TriageResult`, `TriageResponse`)
- Create: `lib/gemini.ts`
- Test: `tests/lib/gemini.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `TRIAGE_SYSTEM_PROMPT: string`, `extractTriageJson(rawText: string): unknown`, `TriageResultSchema` (Zod), `TriageResult`/`TriageResponse` types — all consumed by Task 5 (API route) and Tasks 7–8 (UI).

- [ ] **Step 1: Write the failing test**

Create `tests/lib/gemini.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { extractTriageJson, TRIAGE_SYSTEM_PROMPT } from '@/lib/gemini';
import { TriageResultSchema } from '@/lib/schema';

describe('extractTriageJson', () => {
  it('parses plain JSON', () => {
    const raw = '{"primary_intent": "problema_anaf", "urgency": "normal"}';
    expect(extractTriageJson(raw)).toEqual({ primary_intent: 'problema_anaf', urgency: 'normal' });
  });

  it('parses JSON wrapped in a markdown code fence', () => {
    const raw = '```json\n{"urgency": "high"}\n```';
    expect(extractTriageJson(raw)).toEqual({ urgency: 'high' });
  });

  it('throws when no JSON object is present', () => {
    expect(() => extractTriageJson('nu am putut analiza cererea')).toThrow(
      'No JSON object found in Gemini response'
    );
  });
});

describe('TRIAGE_SYSTEM_PROMPT', () => {
  it('lists every supported institution code', () => {
    for (const code of ['ANPC', 'ANAF', 'PRIMARIE', 'POLITIE_LOCALA', 'ANRE', 'ANCOM', 'CNAS', 'ITM']) {
      expect(TRIAGE_SYSTEM_PROMPT).toContain(code);
    }
  });
});

describe('TriageResultSchema', () => {
  const validResult = {
    primary_intent: 'problema_anaf',
    urgency: 'normal',
    institution_type: 'ANAF',
    required_documents: ['carte de identitate'],
    recommended_channel: 'online',
    next_steps: ['Depune cererea pe portalul SPV'],
    explanation: 'Trebuie să contactezi ANAF pentru această problemă.',
    confidence: 0.9,
  };

  it('accepts a well-formed triage result', () => {
    expect(TriageResultSchema.safeParse(validResult).success).toBe(true);
  });

  it('rejects an invalid urgency value', () => {
    expect(TriageResultSchema.safeParse({ ...validResult, urgency: 'urgent' }).success).toBe(false);
  });

  it('rejects a confidence value above 1', () => {
    expect(TriageResultSchema.safeParse({ ...validResult, confidence: 1.5 }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- tests/lib/gemini.test.ts`
Expected: FAIL — `Cannot find module '@/lib/gemini'`, `TriageResultSchema` undefined.

- [ ] **Step 3: Add `TriageResultSchema` to `lib/schema.ts`**

Append to `lib/schema.ts`:

```typescript
export const TriageResultSchema = z.object({
  primary_intent: z.string(),
  urgency: z.enum(['low', 'normal', 'high']),
  institution_type: z.string(),
  required_documents: z.array(z.string()),
  recommended_channel: z.enum(['online', 'telefon', 'fizic']),
  next_steps: z.array(z.string()),
  explanation: z.string(),
  confidence: z.number().min(0).max(1),
});
```

- [ ] **Step 4: Add `TriageResult`/`TriageResponse` to `lib/types.ts`**

Append to `lib/types.ts`:

```typescript
import type { TriageResultSchema } from './schema';

export type TriageResult = z.infer<typeof TriageResultSchema>;
export type TriageResponse = TriageResult & { institution: Institution | null };
```

(Merge this import with the existing `import type { z } from 'zod'; import type { InstitutionSchema } from './schema';` line at the top of the file rather than duplicating it.)

- [ ] **Step 5: Write `lib/gemini.ts`**

```typescript
export const TRIAGE_SYSTEM_PROMPT = `Ești un asistent specializat în direcționarea cetățenilor români către instituțiile publice corecte.

Utilizatorul va descrie o problemă în limbaj natural. Analizează textul și returnează DOAR un obiect JSON, fără text suplimentar, cu următoarea structură:

{
  "primary_intent": "contestatie_amenda | reclamatie_anpc | problema_anaf | sesizare_primarie | factura_utilitati | alta",
  "urgency": "low | normal | high",
  "institution_type": "ANPC | ANAF | PRIMARIE | POLITIE_LOCALA | ANRE | ANCOM | CNAS | ITM | ALTA",
  "required_documents": ["document1", "document2"],
  "recommended_channel": "online | telefon | fizic",
  "next_steps": ["pas1", "pas2", "pas3"],
  "explanation": "Explicație scurtă în limbaj simplu pentru utilizator",
  "confidence": 0.0
}

Fii precis. Dacă nu ești sigur, setează confidence sub 0.7 și recomandă verificarea manuală.`;

export function extractTriageJson(rawText: string): unknown {
  const match = rawText.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('No JSON object found in Gemini response');
  }
  return JSON.parse(match[0]);
}
```

- [ ] **Step 6: Run the test and verify it passes**

Run: `npm test -- tests/lib/gemini.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 7: Commit**

```bash
git add lib/schema.ts lib/types.ts lib/gemini.ts tests/lib/gemini.test.ts
git commit -m "feat: add triage schema and Gemini JSON extraction"
```

---

### Task 4: Institution lookup against Supabase

**Files:**
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/client.ts`
- Create: `lib/institutions.ts`
- Test: `tests/lib/institutions.test.ts`

**Interfaces:**
- Consumes: `Institution` type from Task 2.
- Produces: `findInstitution(supabase: SupabaseClient, institutionType: string): Promise<Institution | null>`, `createServerSupabaseClient(): SupabaseClient` — both consumed by Task 5.

- [ ] **Step 1: Write the failing test**

Create `tests/lib/institutions.test.ts`:

```typescript
import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { findInstitution } from '@/lib/institutions';
import type { Institution } from '@/lib/types';

function createFakeSupabase(response: { data: Institution | null; error: { message: string } | null }) {
  const maybeSingle = vi.fn().mockResolvedValue(response);
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return { client: { from } as unknown as SupabaseClient, from, select, eq };
}

const sampleInstitution: Institution = {
  id: '1',
  code: 'ANPC',
  name: 'ANPC',
  description: null,
  category: 'protectia_consumatorului',
  website_url: 'https://anpc.ro',
  contact_form_url: null,
  phone: null,
  email: null,
  address: null,
};

describe('findInstitution', () => {
  it('returns the matched institution and normalizes the code to uppercase', async () => {
    const { client, from, select, eq } = createFakeSupabase({ data: sampleInstitution, error: null });
    const result = await findInstitution(client, 'anpc');
    expect(result).toEqual(sampleInstitution);
    expect(from).toHaveBeenCalledWith('institutions');
    expect(select).toHaveBeenCalledWith('*');
    expect(eq).toHaveBeenCalledWith('code', 'ANPC');
  });

  it('returns null when nothing matches', async () => {
    const { client } = createFakeSupabase({ data: null, error: null });
    expect(await findInstitution(client, 'necunoscut')).toBeNull();
  });

  it('throws when supabase returns an error', async () => {
    const { client } = createFakeSupabase({ data: null, error: { message: 'connection failed' } });
    await expect(findInstitution(client, 'ANPC')).rejects.toThrow('connection failed');
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- tests/lib/institutions.test.ts`
Expected: FAIL — `Cannot find module '@/lib/institutions'`.

- [ ] **Step 3: Write the Supabase client factories**

Create `lib/supabase/server.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase server environment variables');
  }

  return createClient(url, serviceRoleKey);
}
```

Create `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing Supabase browser environment variables');
  }

  return createBrowserClient(url, anonKey);
}
```

- [ ] **Step 4: Write `lib/institutions.ts`**

```typescript
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
```

- [ ] **Step 5: Run the test and verify it passes**

Run: `npm test -- tests/lib/institutions.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**

```bash
git add lib/supabase lib/institutions.ts tests/lib/institutions.test.ts
git commit -m "feat: add Supabase clients and institution lookup"
```

---

### Task 5: Triage API route

**Files:**
- Create: `app/api/triage/route.ts`
- Test: `tests/api/triage.test.ts`

**Interfaces:**
- Consumes: `TRIAGE_SYSTEM_PROMPT`, `extractTriageJson` (Task 3), `TriageResultSchema` (Task 3), `findInstitution`, `createServerSupabaseClient` (Task 4).
- Produces: `POST(req: Request): Promise<Response>` at `/api/triage`, consumed by Task 8 (page integration).

- [ ] **Step 1: Write the failing test**

Create `tests/api/triage.test.ts`:

```typescript
// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest';

const generateContentMock = vi.fn();

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: () => ({ generateContent: generateContentMock }),
  })),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/institutions', () => ({
  findInstitution: vi.fn(),
}));

import { POST } from '@/app/api/triage/route';
import { findInstitution } from '@/lib/institutions';

const validTriageResult = {
  primary_intent: 'problema_anaf',
  urgency: 'normal',
  institution_type: 'ANAF',
  required_documents: ['carte de identitate'],
  recommended_channel: 'online',
  next_steps: ['Depune cererea pe portalul SPV'],
  explanation: 'Trebuie să contactezi ANAF.',
  confidence: 0.9,
};

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/triage', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.GEMINI_API_KEY = 'test-key';
});

describe('POST /api/triage', () => {
  it('returns 400 when description is missing', async () => {
    const response = await POST(makeRequest({}));
    expect(response.status).toBe(400);
  });

  it('returns the triage result merged with the matched institution', async () => {
    generateContentMock.mockResolvedValue({
      response: { text: () => JSON.stringify(validTriageResult) },
    });
    vi.mocked(findInstitution).mockResolvedValue({
      id: '1',
      code: 'ANAF',
      name: 'ANAF',
      description: null,
      category: 'fiscal',
      website_url: 'https://www.anaf.ro',
      contact_form_url: null,
      phone: null,
      email: null,
      address: null,
    });

    const response = await POST(makeRequest({ description: 'Am o problemă cu declarația fiscală' }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.institution_type).toBe('ANAF');
    expect(json.institution.code).toBe('ANAF');
  });

  it('returns 500 when Gemini responds with malformed JSON', async () => {
    generateContentMock.mockResolvedValue({
      response: { text: () => 'nu pot răspunde' },
    });

    const response = await POST(makeRequest({ description: 'test' }));
    expect(response.status).toBe(500);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- tests/api/triage.test.ts`
Expected: FAIL — `Cannot find module '@/app/api/triage/route'`.

- [ ] **Step 3: Write the route**

Create `app/api/triage/route.ts`:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { TriageResultSchema } from '@/lib/schema';
import { TRIAGE_SYSTEM_PROMPT, extractTriageJson } from '@/lib/gemini';
import { findInstitution } from '@/lib/institutions';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const description = typeof body?.description === 'string' ? body.description.trim() : '';

  if (description.length === 0) {
    return NextResponse.json({ error: 'description is required' }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent([
      { text: TRIAGE_SYSTEM_PROMPT },
      { text: `Problema utilizatorului: ${description}` },
    ]);

    const rawText = result.response.text();
    const parsed = TriageResultSchema.parse(extractTriageJson(rawText));

    const supabase = createServerSupabaseClient();
    const institution = await findInstitution(supabase, parsed.institution_type);

    return NextResponse.json({ ...parsed, institution });
  } catch (error) {
    console.error('Triage failed', error);
    return NextResponse.json(
      { error: 'Nu am putut analiza problema. Încearcă din nou.' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npm test -- tests/api/triage.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add app/api/triage/route.ts tests/api/triage.test.ts
git commit -m "feat: add /api/triage route"
```

---

### Task 6: ProblemInput component

**Files:**
- Create: `components/ProblemInput.tsx`
- Test: `tests/components/ProblemInput.test.tsx`

**Interfaces:**
- Produces: `ProblemInput({ onSubmit: (description: string) => void, isLoading?: boolean })`, consumed by Task 8.

- [ ] **Step 1: Write the failing test**

Create `tests/components/ProblemInput.test.tsx`:

```typescript
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProblemInput } from '@/components/ProblemInput';

describe('ProblemInput', () => {
  it('keeps the submit button disabled until text is entered', async () => {
    const user = userEvent.setup();
    render(<ProblemInput onSubmit={vi.fn()} />);

    const submitButton = screen.getByRole('button', { name: 'Analizează' });
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByLabelText('Descrierea problemei'), 'Am primit o amendă');
    expect(submitButton).toBeEnabled();
  });

  it('calls onSubmit with the trimmed description', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(<ProblemInput onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText('Descrierea problemei'), '  Am o amendă  ');
    await user.click(screen.getByRole('button', { name: 'Analizează' }));

    expect(handleSubmit).toHaveBeenCalledWith('Am o amendă');
  });

  it('fills the textarea when a quick category is clicked', async () => {
    const user = userEvent.setup();
    render(<ProblemInput onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Problemă ANAF' }));
    expect(screen.getByLabelText('Descrierea problemei')).toHaveValue('Problemă ANAF');
  });

  it('disables the button and shows a loading label while isLoading is true', () => {
    render(<ProblemInput onSubmit={vi.fn()} isLoading />);
    expect(screen.getByRole('button', { name: 'Se analizează...' })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- tests/components/ProblemInput.test.tsx`
Expected: FAIL — `Cannot find module '@/components/ProblemInput'`.

- [ ] **Step 3: Write the component**

Create `components/ProblemInput.tsx`:

```typescript
'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const QUICK_CATEGORIES = ['Amendă', 'Factură utilități', 'Problemă ANAF', 'Sesizare primărie'];

interface ProblemInputProps {
  onSubmit: (description: string) => void;
  isLoading?: boolean;
}

export function ProblemInput({ onSubmit, isLoading = false }: ProblemInputProps) {
  const [description, setDescription] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = description.trim();
    if (trimmed.length === 0) return;
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Descrie problema ta" className="space-y-4">
      <Textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Descrie problema ta în cuvinte simple..."
        aria-label="Descrierea problemei"
      />
      <div role="group" aria-label="Categorii rapide" className="flex flex-wrap gap-2">
        {QUICK_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setDescription(category)}
            className="rounded-full border px-3 py-1 text-sm"
          >
            {category}
          </button>
        ))}
      </div>
      <Button type="submit" disabled={isLoading || description.trim().length === 0}>
        {isLoading ? 'Se analizează...' : 'Analizează'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npm test -- tests/components/ProblemInput.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add components/ProblemInput.tsx tests/components/ProblemInput.test.tsx
git commit -m "feat: add ProblemInput component"
```

---

### Task 7: InstitutionCard and AnalysisResult components

**Files:**
- Create: `components/InstitutionCard.tsx`
- Create: `components/AnalysisResult.tsx`
- Test: `tests/components/AnalysisResult.test.tsx`

**Interfaces:**
- Consumes: `Institution`, `TriageResponse` types (Tasks 2–3).
- Produces: `AnalysisResult({ result: TriageResponse })`, consumed by Task 8.

- [ ] **Step 1: Write the failing test**

Create `tests/components/AnalysisResult.test.tsx`:

```typescript
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalysisResult } from '@/components/AnalysisResult';
import type { TriageResponse } from '@/lib/types';

const baseResult: TriageResponse = {
  primary_intent: 'problema_anaf',
  urgency: 'normal',
  institution_type: 'ANAF',
  required_documents: ['carte de identitate'],
  recommended_channel: 'online',
  next_steps: ['Depune cererea pe portalul SPV'],
  explanation: 'Trebuie să contactezi ANAF pentru această problemă.',
  confidence: 0.9,
  institution: {
    id: '1',
    code: 'ANAF',
    name: 'Agenția Națională de Administrare Fiscală',
    description: null,
    category: 'fiscal',
    website_url: 'https://www.anaf.ro',
    contact_form_url: null,
    phone: null,
    email: null,
    address: null,
  },
};

describe('AnalysisResult', () => {
  it('renders the explanation, documents, next steps and institution', () => {
    render(<AnalysisResult result={baseResult} />);

    expect(screen.getByText(baseResult.explanation)).toBeInTheDocument();
    expect(screen.getByText('carte de identitate')).toBeInTheDocument();
    expect(screen.getByText('Depune cererea pe portalul SPV')).toBeInTheDocument();
    expect(screen.getByText('Agenția Națională de Administrare Fiscală')).toBeInTheDocument();
  });

  it('shows a manual-review notice when confidence is low', () => {
    render(<AnalysisResult result={{ ...baseResult, confidence: 0.4 }} />);
    expect(screen.getByText('Recomandăm verificare manuală')).toBeInTheDocument();
  });

  it('does not show the manual-review notice when confidence is high', () => {
    render(<AnalysisResult result={{ ...baseResult, confidence: 0.9 }} />);
    expect(screen.queryByText('Recomandăm verificare manuală')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- tests/components/AnalysisResult.test.tsx`
Expected: FAIL — `Cannot find module '@/components/AnalysisResult'`.

- [ ] **Step 3: Write the components**

Create `components/InstitutionCard.tsx`:

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Institution } from '@/lib/types';

interface InstitutionCardProps {
  institution: Institution;
}

export function InstitutionCard({ institution }: InstitutionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{institution.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        {institution.description && <p>{institution.description}</p>}
        {institution.website_url && (
          <p>
            <a href={institution.website_url} target="_blank" rel="noreferrer">
              {institution.website_url}
            </a>
          </p>
        )}
        {institution.phone && <p>Telefon: {institution.phone}</p>}
        {institution.email && <p>Email: {institution.email}</p>}
      </CardContent>
    </Card>
  );
}
```

Create `components/AnalysisResult.tsx`:

```typescript
import { Badge } from '@/components/ui/badge';
import { InstitutionCard } from '@/components/InstitutionCard';
import type { TriageResponse } from '@/lib/types';

const URGENCY_LABELS: Record<TriageResponse['urgency'], string> = {
  low: 'Prioritate scăzută',
  normal: 'Prioritate normală',
  high: 'Prioritate ridicată',
};

const LOW_CONFIDENCE_THRESHOLD = 0.7;

interface AnalysisResultProps {
  result: TriageResponse;
}

export function AnalysisResult({ result }: AnalysisResultProps) {
  return (
    <div className="space-y-4" aria-label="Rezultatul analizei">
      <div className="flex items-center gap-2">
        <Badge>{URGENCY_LABELS[result.urgency]}</Badge>
        {result.confidence < LOW_CONFIDENCE_THRESHOLD && (
          <Badge variant="outline">Recomandăm verificare manuală</Badge>
        )}
      </div>

      <p>{result.explanation}</p>

      {result.required_documents.length > 0 && (
        <div>
          <h3 className="font-medium">Documente necesare</h3>
          <ul className="list-disc pl-5">
            {result.required_documents.map((document) => (
              <li key={document}>{document}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="font-medium">Pași următori</h3>
        <ol className="list-decimal pl-5">
          {result.next_steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      {result.institution && <InstitutionCard institution={result.institution} />}
    </div>
  );
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npm test -- tests/components/AnalysisResult.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add components/InstitutionCard.tsx components/AnalysisResult.tsx tests/components/AnalysisResult.test.tsx
git commit -m "feat: add AnalysisResult and InstitutionCard components"
```

---

### Task 8: Home page integration

**Files:**
- Modify: `app/page.tsx`
- Test: `tests/app/page.test.tsx`

**Interfaces:**
- Consumes: `ProblemInput` (Task 6), `AnalysisResult` (Task 7), `TriageResponse` type (Task 3), `POST /api/triage` (Task 5, called via `fetch` — not imported directly).

- [ ] **Step 1: Write the failing test**

Create `tests/app/page.test.tsx`:

```typescript
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from '@/app/page';

const sampleResponse = {
  primary_intent: 'problema_anaf',
  urgency: 'normal',
  institution_type: 'ANAF',
  required_documents: [],
  recommended_channel: 'online',
  next_steps: ['Depune cererea pe portalul SPV'],
  explanation: 'Trebuie să contactezi ANAF pentru această problemă.',
  confidence: 0.9,
  institution: null,
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('HomePage', () => {
  it('submits the description and renders the analysis result', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(sampleResponse),
      })
    );

    render(<HomePage />);
    await user.type(screen.getByLabelText('Descrierea problemei'), 'Am o problemă cu ANAF');
    await user.click(screen.getByRole('button', { name: 'Analizează' }));

    expect(await screen.findByText(sampleResponse.explanation)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      '/api/triage',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ description: 'Am o problemă cu ANAF' }),
      })
    );
  });

  it('shows an error message when the request fails', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) }));

    render(<HomePage />);
    await user.type(screen.getByLabelText('Descrierea problemei'), 'Am o problemă cu ANAF');
    await user.click(screen.getByRole('button', { name: 'Analizează' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Nu am putut analiza problema');
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- tests/app/page.test.tsx`
Expected: FAIL — the default scaffolded `app/page.tsx` doesn't render a "Descrierea problemei" field or call `/api/triage`.

- [ ] **Step 3: Rewrite the page**

Replace the contents of `app/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { ProblemInput } from '@/components/ProblemInput';
import { AnalysisResult } from '@/components/AnalysisResult';
import type { TriageResponse } from '@/lib/types';

export default function HomePage() {
  const [result, setResult] = useState<TriageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(description: string) {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        throw new Error('request-failed');
      }

      const data = (await response.json()) as TriageResponse;
      setResult(data);
    } catch {
      setError('Nu am putut analiza problema. Încearcă din nou.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Unde Merg?</h1>
      <ProblemInput onSubmit={handleSubmit} isLoading={isLoading} />
      {error && <p role="alert">{error}</p>}
      {result && <AnalysisResult result={result} />}
    </main>
  );
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npm test -- tests/app/page.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 5: Run the full test suite and build**

Run: `npm test`
Expected: all test files pass (smoke, schema, gemini, institutions, triage route, ProblemInput, AnalysisResult, page).

Run: `npm run build`
Expected: build succeeds with no type errors.

- [ ] **Step 6: Manual check**

Run: `npm run dev`, open `http://localhost:3000`, type a real problem description in Romanian (e.g. "Am primit o amendă de la primărie și cred că e greșită"), submit, and confirm the analysis result renders. This call hits the real Gemini API and your real Supabase project, so it needs the real values in `.env.local` from Task 1 Step 8 and the migration applied in Task 2 Step 7.

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx tests/app/page.test.tsx
git commit -m "feat: wire problem input and analysis result into the home page"
```

---

## Self-review notes

- Spec coverage: Phase 1 → Task 1 (minus manual account creation, listed under Prerequisites); Phase 2 → Task 2; Phase 3 → Tasks 3–5; Phase 4 → Tasks 6–8; Phase 5 → partially covered (8 seeded institutions, contact details deliberately left for manual follow-up); Phases 6–7 → explicitly out of scope, listed above.
- Fixed one inconsistency in the original spec: the spec matched Gemini's `institution_type` (e.g. `"ANPC"`, `"politie_locala"`) against the `institutions.category` column (e.g. `"protectia_consumatorului"`), which would never match. This plan adds a dedicated `code` column to `institutions` that mirrors Gemini's `institution_type` vocabulary, and `findInstitution` matches on that.
- Type consistency checked: `Institution` (Task 2) and `TriageResult`/`TriageResponse` (Task 3) are defined once via `z.infer` and reused as-is by Tasks 4, 5, 7, and 8 — no duplicate/divergent type definitions.
