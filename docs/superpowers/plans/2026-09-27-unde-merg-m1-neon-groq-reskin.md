# Unde Merg M1 — Neon+Groq Stack Swap & Flow A Reskin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the working v1 MVP's backend (Supabase → Neon, Gemini → Groq) and rebuild its home-screen UI using the real "Civic Direction & Clarity" design system and Stitch markup (catalog screens #1 initial state, #2 too-short validation, #3 analysis-in-progress), while keeping the exact same triage behavior: describe a problem → get an institution, required documents, and next steps.

**Architecture:** Same shape as v1 — a single `/api/triage` route composes a prompt/schema module, an AI SDK call, and a DB lookup, now backed by Groq (`groq-sdk`) and Neon (`@neondatabase/serverless`) instead of Gemini and Supabase. The UI is rebuilt as focused components (`Logo`, `Header`, `Footer`, redesigned `ProblemInput`, new `AnalysisProgress`, redesigned `AnalysisResult`) driven by a Tailwind v4 `@theme` block holding the full design-system token set, so later milestones (M2+) can reuse the same tokens and shared components without re-deriving them.

**Tech Stack:** Next.js (TypeScript, App Router), Tailwind CSS v4, `@neondatabase/serverless`, `groq-sdk`, Zod, Vitest + Testing Library, Plus Jakarta Sans + Material Symbols Outlined (Google Fonts).

**Spec:** `docs/superpowers/specs/2026-09-27-unde-merg-v2-roadmap.md` (roadmap and rulings), `.superpowers/sdd/2026-09-27-unde-merg-mvp/stitch-screen-catalog.md` (screens #1–#3 detail, shared-component patterns #1/#3/#7/#17/#18), `unde_merg_public_guide/civic_direction_clarity/DESIGN.md` (full token values).

## Prerequisites (manual — you do these, not the agent)

1. Create a [Neon](https://neon.tech) project. From the Neon Console → Connection Details, copy the pooled connection string → `DATABASE_URL` in `.env.local`.
2. Get a Groq API key from [console.groq.com/keys](https://console.groq.com/keys) → `GROQ_API_KEY` in `.env.local`.
3. Apply `db/migrations/0001_init.sql` then `db/seed.sql` against your Neon database (via the Neon SQL Editor, or `psql "$DATABASE_URL" -f db/migrations/0001_init.sql` from a terminal with `psql` installed).

As with v1, every task's automated tests mock Groq/Neon entirely, so `npm test` never needs real credentials — only the manual check in Task 7 Step 9 does.

## Global Constraints

- All user-facing text is in Romanian, matching the exact copy quoted in this plan (don't paraphrase quoted strings).
- Next.js App Router, Tailwind v4 CSS-first config (`@theme` in `app/globals.css`, no `tailwind.config.ts`), shadcn/ui primitives from v1 stay in use where they already fit (`Button`, `Textarea`, `Card`, `Badge`).
- Accessibility: ARIA labels, keyboard navigation, visible focus states, 4.5:1 contrast minimum — the v1 fixes (role="alert"/"region", aria-live) carry forward into the redesigned components.
- Every task must leave `npm test` and `npm run build` green.
- **Descoped from M1 (explicitly, not silently dropped):** the decorative ambient gradient-blob background divs from screen #1's hero, the "Ai o urgență civică?" contact box, the "Exemple de cazuri rezolvate" examples panel, and voice-input (`mic`) button are visual/informational polish with no functional or test surface — they may be added in a later pass but are not required for M1 to be considered complete. Everything else in screens #1–#3 (hero headline/subtitle, trust indicators, the 2-column workspace, situation chips, textarea, validation, the "how it works" panel, submit → loading stepper → result) is in scope.
- **`font-{name}` classes (e.g. `font-title-md`, `font-label-sm`) that appear in this plan's example JSX are inert under the Task 3 token set as written** — Task 3 defines only a single global `--font-sans` (Plus Jakarta Sans applies everywhere by default) plus `--text-{name}` tokens for size/line-height/weight/letter-spacing, not a matching `--font-{name}` per named size the way the original Stitch export did (which would be pure duplication, since every named style uses the same one font family). Implementers may omit `font-{name}` classes entirely when writing/adapting this plan's components — dropping them changes nothing visually, since `--font-sans` already applies. Do not add 13 redundant `--font-{name}` tokens to `app/globals.css` to make them "work" — that would violate DRY for no visual benefit.
- **RLS is dropped, not ported.** Neon is reached only via `DATABASE_URL` from server code — there is no PostgREST/anon-key client-side path the way Supabase had, so Postgres Row Level Security (relevant to v1's Supabase setup) doesn't apply here and should not be added to the migration.

---

### Task 1: Neon database layer

**Files:**
- Create: `db/migrations/0001_init.sql` (moved from `supabase/migrations/0001_init.sql`, RLS statements removed)
- Create: `db/seed.sql` (moved from `supabase/seed.sql`, unchanged content)
- Delete: `supabase/migrations/0001_init.sql`, `supabase/seed.sql`, `lib/supabase/server.ts`, `lib/supabase/client.ts`
- Create: `lib/db.ts`
- Modify: `lib/institutions.ts`
- Modify: `tests/lib/institutions.test.ts`
- Modify: `package.json` (remove `@supabase/supabase-js`, `@supabase/ssr`; add `@neondatabase/serverless`)
- Modify: `.env.local.example`, `README.md` (swap Supabase env vars/instructions for `DATABASE_URL`)

**Interfaces:**
- Consumes: `Institution`, `InstitutionSchema` (unchanged, from `lib/types.ts`/`lib/schema.ts`).
- Produces: `createDb(): NeonQueryFunction<false, false>` and `findInstitution(sql: NeonQueryFunction<false, false>, institutionType: string): Promise<Institution | null>` — same call shape as v1's Supabase version, consumed by Task 2's route.

- [ ] **Step 1: Install/remove dependencies**

```bash
npm install @neondatabase/serverless
npm uninstall @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Move the migration and seed files, drop RLS**

```bash
mkdir -p db
git mv supabase/migrations/0001_init.sql db/migrations/0001_init.sql
git mv supabase/seed.sql db/seed.sql
rmdir supabase/migrations supabase 2>/dev/null || true
```

Edit `db/migrations/0001_init.sql` to remove the three `alter table ... enable row level security` lines and the `institutions are publicly readable` policy (Neon has no anon/PostgREST role for RLS to gate) — everything else (the three `create table` statements and the two indexes) stays identical.

- [ ] **Step 3: Write the failing test for the Neon-backed `findInstitution`**

Replace `tests/lib/institutions.test.ts` with:

```typescript
import { describe, expect, it, vi } from 'vitest';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import { findInstitution } from '@/lib/institutions';
import type { Institution } from '@/lib/types';

function createFakeSql(rows: unknown[]) {
  const sql = vi.fn().mockResolvedValue(rows);
  return sql as unknown as NeonQueryFunction<false, false>;
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
  it('returns the matched institution', async () => {
    const sql = createFakeSql([sampleInstitution]);
    const result = await findInstitution(sql, 'anpc');
    expect(result).toEqual(sampleInstitution);
    expect(sql).toHaveBeenCalledTimes(1);
  });

  it('returns null when nothing matches', async () => {
    const sql = createFakeSql([]);
    expect(await findInstitution(sql, 'necunoscut')).toBeNull();
  });

  it('returns null when the row fails schema validation', async () => {
    const sql = createFakeSql([{ ...sampleInstitution, website_url: 'not-a-url' }]);
    expect(await findInstitution(sql, 'ANPC')).toBeNull();
  });
});
```

- [ ] **Step 4: Run the test and verify it fails**

Run: `npm test -- tests/lib/institutions.test.ts`
Expected: FAIL — `lib/institutions.ts` still imports `@supabase/supabase-js`, which is now uninstalled, or the old signature doesn't match.

- [ ] **Step 5: Write `lib/db.ts`**

```typescript
import { neon } from '@neondatabase/serverless';

export function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('Missing DATABASE_URL environment variable');
  }
  return neon(url);
}
```

- [ ] **Step 6: Rewrite `lib/institutions.ts`**

```typescript
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
```

- [ ] **Step 7: Delete the Supabase client files**

```bash
rm -rf lib/supabase
```

- [ ] **Step 8: Run the test and verify it passes**

Run: `npm test -- tests/lib/institutions.test.ts`
Expected: PASS, 3 tests. (The rest of the suite will still fail at this point — Task 2 fixes the route — that's expected mid-task.)

- [ ] **Step 9: Update env var docs**

In `.env.local.example`, replace `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` with a single `DATABASE_URL=`. Update `README.md`'s setup section accordingly (Neon connection string from Neon Console → Connection Details, no separate anon/service-role keys).

- [ ] **Step 10: Commit**

```bash
git add db lib/db.ts lib/institutions.ts tests/lib/institutions.test.ts package.json package-lock.json .env.local.example README.md
git commit -m "feat: replace Supabase with Neon for institution lookup"
```

(`lib/supabase/` deletion and the `supabase/` directory removal are captured by `git add -A` if you prefer one commit — either is fine, but do not leave deleted files unstaged.)

---

### Task 2: Groq AI layer and route rewrite

**Files:**
- Rename: `lib/gemini.ts` → `lib/triage.ts` (content unchanged — it has never imported any Gemini SDK; only the name was misleading)
- Rename: `tests/lib/gemini.test.ts` → `tests/lib/triage.test.ts` (update the import path inside, content otherwise unchanged)
- Modify: `app/api/triage/route.ts`
- Modify: `tests/api/triage.test.ts`
- Modify: `package.json` (remove `@google/generative-ai`; add `groq-sdk`)
- Modify: `.env.local.example`, `README.md` (swap `GEMINI_API_KEY` for `GROQ_API_KEY`, sourced from console.groq.com)

**Interfaces:**
- Consumes: `TRIAGE_SYSTEM_PROMPT`, `extractTriageJson` (from renamed `lib/triage.ts`), `TriageResultSchema` (`lib/schema.ts`, unchanged), `findInstitution`, `createDb` (Task 1).
- Produces: `POST(req: Request): Promise<Response>` at `/api/triage` — same response shape as v1, consumed by the (currently unchanged) home page.

- [ ] **Step 1: Rename the prompt/extraction module**

```bash
git mv lib/gemini.ts lib/triage.ts
git mv tests/lib/gemini.test.ts tests/lib/triage.test.ts
```

Edit `tests/lib/triage.test.ts`: change `from '@/lib/gemini'` to `from '@/lib/triage'` (the two import lines at the top). No other content changes — `TRIAGE_SYSTEM_PROMPT` and `extractTriageJson` are unchanged.

- [ ] **Step 2: Install/remove dependencies**

```bash
npm install groq-sdk
npm uninstall @google/generative-ai
```

- [ ] **Step 3: Write the failing test for the Groq-backed route**

Replace `tests/api/triage.test.ts` with:

```typescript
// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest';

const createCompletionMock = vi.fn();

vi.mock('groq-sdk', () => ({
  default: vi.fn().mockImplementation(function Groq() {
    return { chat: { completions: { create: createCompletionMock } } };
  }),
}));

vi.mock('@/lib/db', () => ({
  createDb: vi.fn().mockReturnValue({}),
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
  process.env.GROQ_API_KEY = 'test-key';
  process.env.DATABASE_URL = 'postgres://test';
});

describe('POST /api/triage', () => {
  it('returns 400 when description is missing', async () => {
    const response = await POST(makeRequest({}));
    expect(response.status).toBe(400);
  });

  it('returns 400 when description is too long', async () => {
    const response = await POST(makeRequest({ description: 'a'.repeat(2001) }));
    expect(response.status).toBe(400);
  });

  it('returns the triage result merged with the matched institution', async () => {
    createCompletionMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(validTriageResult) } }],
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
    expect(createCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'openai/gpt-oss-120b', response_format: { type: 'json_object' } })
    );
  });

  it('returns 500 when Groq responds with malformed JSON', async () => {
    createCompletionMock.mockResolvedValue({
      choices: [{ message: { content: 'nu pot răspunde' } }],
    });

    const response = await POST(makeRequest({ description: 'test' }));
    expect(response.status).toBe(500);
  });
});
```

- [ ] **Step 4: Run the test and verify it fails**

Run: `npm test -- tests/api/triage.test.ts`
Expected: FAIL — `app/api/triage/route.ts` still imports `@google/generative-ai` and `@/lib/supabase/server`, both now gone.

- [ ] **Step 5: Rewrite the route**

```typescript
import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';
import { TriageResultSchema } from '@/lib/schema';
import { TRIAGE_SYSTEM_PROMPT, extractTriageJson } from '@/lib/triage';
import { findInstitution } from '@/lib/institutions';
import { createDb } from '@/lib/db';

const MAX_DESCRIPTION_LENGTH = 2000;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const description = typeof body?.description === 'string' ? body.description.trim() : '';

  if (description.length === 0) {
    return NextResponse.json({ error: 'description is required' }, { status: 400 });
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return NextResponse.json({ error: 'description is too long' }, { status: 400 });
  }

  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('Missing GROQ_API_KEY environment variable');
    }
    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: TRIAGE_SYSTEM_PROMPT },
        { role: 'user', content: `Problema utilizatorului: ${description}` },
      ],
      model: 'openai/gpt-oss-120b',
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const rawText = completion.choices[0]?.message?.content ?? '';
    const parsed = TriageResultSchema.parse(extractTriageJson(rawText));

    const sql = createDb();
    const institution = await findInstitution(sql, parsed.institution_type);

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

- [ ] **Step 6: Run the test and verify it passes**

Run: `npm test -- tests/api/triage.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 7: Update env var docs**

In `.env.local.example` and `README.md`, replace `GEMINI_API_KEY` with `GROQ_API_KEY` (sourced from https://console.groq.com/keys).

- [ ] **Step 8: Run the full suite**

Run: `npm test`
Expected: all test files pass (smoke, schema, triage (prompt), institutions, api/triage, components, page — component/page tests are unaffected by this task).

- [ ] **Step 9: Commit**

```bash
git add lib/triage.ts tests/lib/triage.test.ts app/api/triage/route.ts tests/api/triage.test.ts package.json package-lock.json .env.local.example README.md
git commit -m "feat: replace Gemini with Groq for triage classification"
```

---

### Task 3: Design tokens and fonts

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: Tailwind utility classes for every color/typography/radius/spacing token below (e.g. `bg-primary`, `text-on-surface`, `text-display`, `rounded-xl`, `p-space-lg`, `gap-gutter`), consumed by Tasks 4–7's components. `font-sans` (global default) renders as Plus Jakarta Sans. `<span className="material-symbols-outlined">icon_name</span>` renders Material Symbols Outlined icons anywhere in the app.

- [ ] **Step 1: Add the design-system `@theme` block**

In `app/globals.css`, keep the existing `@import "tailwindcss";` line and any existing dark-mode/base styles, and add (values transcribed verbatim from `unde_merg_public_guide/civic_direction_clarity/DESIGN.md`):

```css
@theme {
  /* Colors */
  --color-surface: #faf8ff;
  --color-surface-dim: #d2d9f4;
  --color-surface-bright: #faf8ff;
  --color-surface-container-lowest: #ffffff;
  --color-surface-container-low: #f2f3ff;
  --color-surface-container: #eaedff;
  --color-surface-container-high: #e2e7ff;
  --color-surface-container-highest: #dae2fd;
  --color-on-surface: #131b2e;
  --color-on-surface-variant: #444651;
  --color-inverse-surface: #283044;
  --color-inverse-on-surface: #eef0ff;
  --color-outline: #757682;
  --color-outline-variant: #c5c5d3;
  --color-surface-tint: #4059aa;
  --color-primary: #00236f;
  --color-on-primary: #ffffff;
  --color-primary-container: #1e3a8a;
  --color-on-primary-container: #90a8ff;
  --color-inverse-primary: #b6c4ff;
  --color-secondary: #0051d5;
  --color-on-secondary: #ffffff;
  --color-secondary-container: #316bf3;
  --color-on-secondary-container: #fefcff;
  --color-tertiary: #003120;
  --color-on-tertiary: #ffffff;
  --color-tertiary-container: #004a32;
  --color-on-tertiary-container: #4ac08f;
  --color-error: #ba1a1a;
  --color-on-error: #ffffff;
  --color-error-container: #ffdad6;
  --color-on-error-container: #93000a;
  --color-primary-fixed: #dce1ff;
  --color-primary-fixed-dim: #b6c4ff;
  --color-on-primary-fixed: #00164e;
  --color-on-primary-fixed-variant: #264191;
  --color-secondary-fixed: #dbe1ff;
  --color-secondary-fixed-dim: #b4c5ff;
  --color-on-secondary-fixed: #00174b;
  --color-on-secondary-fixed-variant: #003ea8;
  --color-tertiary-fixed: #85f8c4;
  --color-tertiary-fixed-dim: #68dba9;
  --color-on-tertiary-fixed: #002114;
  --color-on-tertiary-fixed-variant: #005137;
  --color-background: #faf8ff;
  --color-on-background: #131b2e;
  --color-surface-variant: #dae2fd;

  /* Typography */
  --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;

  --text-display: 44px;
  --text-display--line-height: 52px;
  --text-display--font-weight: 800;
  --text-display--letter-spacing: -0.02em;

  --text-display-mobile: 32px;
  --text-display-mobile--line-height: 40px;
  --text-display-mobile--font-weight: 800;
  --text-display-mobile--letter-spacing: -0.01em;

  --text-headline-lg: 32px;
  --text-headline-lg--line-height: 40px;
  --text-headline-lg--font-weight: 700;
  --text-headline-lg--letter-spacing: -0.015em;

  --text-headline-lg-mobile: 26px;
  --text-headline-lg-mobile--line-height: 34px;
  --text-headline-lg-mobile--font-weight: 700;
  --text-headline-lg-mobile--letter-spacing: -0.01em;

  --text-headline-md: 24px;
  --text-headline-md--line-height: 32px;
  --text-headline-md--font-weight: 600;
  --text-headline-md--letter-spacing: -0.01em;

  --text-headline-sm: 20px;
  --text-headline-sm--line-height: 28px;
  --text-headline-sm--font-weight: 600;

  --text-title-md: 18px;
  --text-title-md--line-height: 26px;
  --text-title-md--font-weight: 600;

  --text-body-lg: 18px;
  --text-body-lg--line-height: 28px;

  --text-body-md: 16px;
  --text-body-md--line-height: 24px;

  --text-body-sm: 14px;
  --text-body-sm--line-height: 20px;

  --text-label-lg: 14px;
  --text-label-lg--line-height: 20px;
  --text-label-lg--font-weight: 600;
  --text-label-lg--letter-spacing: 0.01em;

  --text-label-md: 12px;
  --text-label-md--line-height: 16px;
  --text-label-md--font-weight: 600;
  --text-label-md--letter-spacing: 0.02em;

  --text-label-sm: 11px;
  --text-label-sm--line-height: 14px;
  --text-label-sm--font-weight: 700;
  --text-label-sm--letter-spacing: 0.04em;

  /* Shape */
  --radius-sm: 0.25rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;

  /* Spacing */
  --spacing-gutter: 1.5rem;
  --spacing-gutter-sm: 1rem;
  --spacing-margin: 2rem;
  --spacing-margin-sm: 1rem;
  --spacing-space-xs: 0.25rem;
  --spacing-space-sm: 0.5rem;
  --spacing-space-md: 1rem;
  --spacing-space-lg: 1.5rem;
  --spacing-space-xl: 2.5rem;
}
```

- [ ] **Step 2: Load Plus Jakarta Sans and Material Symbols Outlined**

In `app/layout.tsx`, replace the existing `next/font` import (whatever `create-next-app` scaffolded, e.g. Geist) with:

```typescript
import { Plus_Jakarta_Sans } from 'next/font/google';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta-sans',
});
```

Apply `plusJakartaSans.variable` (and drop the old font's class/variable) on the `<body>` (or `<html>`) className, and add the Material Symbols stylesheet link in the layout's `<head>`:

```tsx
<head>
  <link
    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
    rel="stylesheet"
  />
</head>
```

Since `--font-sans` in the `@theme` block already names `'Plus Jakarta Sans'` directly (not the CSS variable), the `next/font` `variable` is optional polish for FOUT control — if you'd rather wire it through properly, set `--font-sans: var(--font-plus-jakarta-sans), ui-sans-serif, system-ui, sans-serif;` in the `@theme` block instead of the hardcoded family name, and keep the `variable` class on `<body>`. Either approach is acceptable; pick one and be consistent.

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: succeeds (no test coverage needed for this task — it's pure CSS/font config with no runtime logic; verify via `npm run dev` and visually inspecting `http://localhost:3000` that a `bg-primary` test element renders as `#00236f` and text renders in Plus Jakarta Sans, then remove the test element before committing).

- [ ] **Step 4: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat: add Civic Direction & Clarity design tokens and fonts"
```

---

### Task 4: Logo, Header, Footer components

**Files:**
- Create: `components/Logo.tsx`
- Create: `components/Header.tsx`
- Create: `components/Footer.tsx`
- Create: `tests/components/Header.test.tsx`
- Create: `tests/components/Footer.test.tsx`

**Interfaces:**
- Produces: `Logo()`, `Header()`, `Footer()` — no props needed for M1 (static content), consumed by Task 7's `app/layout.tsx` or `app/page.tsx` wiring.

- [ ] **Step 1: Write the failing tests**

Create `tests/components/Header.test.tsx`:

```typescript
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '@/components/Header';

describe('Header', () => {
  it('renders the wordmark and primary nav links', () => {
    render(<Header />);
    expect(screen.getByText('Unde merg?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Acasă' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cum funcționează' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Instituții' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Întrebări frecvente' })).toBeInTheDocument();
  });
});
```

Create `tests/components/Footer.test.tsx`:

```typescript
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/Footer';

describe('Footer', () => {
  it('renders the civic helpline and legal disclaimer', () => {
    render(<Footer />);
    expect(screen.getByText(/0800 008 123/)).toBeInTheDocument();
    expect(screen.getByText(/nu constituie consultanță juridică/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npm test -- tests/components/Header.test.tsx tests/components/Footer.test.tsx`
Expected: FAIL — `@/components/Header` and `@/components/Footer` don't exist yet.

- [ ] **Step 3: Write `components/Logo.tsx`**

Per the catalog's logo spec (`logo_unde_merg/code.html`): a rounded-square navy badge with a mountain/triangle glyph and accent line, plus the wordmark.

```tsx
interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={`flex items-center gap-space-sm ${className ?? ''}`}>
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#1E3A8A" />
        <path d="M6 22L13 10L18 17L21 12L26 22Z" fill="#38BDF8" />
        <circle cx="21" cy="12" r="1.5" fill="#ffffff" />
        <path d="M6 22C10 19 18 19 26 22" stroke="#60A5FA" strokeWidth="1.5" fill="none" />
      </svg>
      <span className="flex flex-col text-left">
        <span className="font-title-md text-title-md text-primary leading-tight tracking-tight">
          Unde merg?
        </span>
        <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
          Orientare Civică
        </span>
      </span>
    </div>
  );
}
```

- [ ] **Step 4: Write `components/Header.tsx`**

```tsx
import Link from 'next/link';
import { Logo } from '@/components/Logo';

const NAV_LINKS = [
  { href: '/', label: 'Acasă' },
  { href: '/cum-functioneaza', label: 'Cum funcționează' },
  { href: '/institutii', label: 'Instituții' },
  { href: '/intrebari-frecvente', label: 'Întrebări frecvente' },
];

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md shadow-sm">
      <div className="h-20 max-w-7xl mx-auto px-margin flex items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden md:flex items-center gap-space-lg" aria-label="Navigare principală">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Write `components/Footer.tsx`**

```tsx
export function Footer() {
  return (
    <footer className="w-full bg-surface-container-low mt-space-xl">
      <div className="max-w-7xl mx-auto px-margin py-space-xl flex flex-col gap-space-md">
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Dispecerat Civic Gratuit: <strong className="text-on-surface">0800 008 123</strong>{' '}
          (Luni – Vineri: 08:00 – 18:00)
        </p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          © 2026 Unde merg? – Orientare Civică. Acest serviciu civic nu constituie consultanță
          juridică autorizată. Informațiile prezentate au scop strict orientativ.
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 6: Run the tests and verify they pass**

Run: `npm test -- tests/components/Header.test.tsx tests/components/Footer.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 7: Commit**

```bash
git add components/Logo.tsx components/Header.tsx components/Footer.tsx tests/components/Header.test.tsx tests/components/Footer.test.tsx
git commit -m "feat: add Logo, Header, and Footer components"
```

---

### Task 5: Redesigned ProblemInput with too-short validation

**Files:**
- Modify: `components/ProblemInput.tsx`
- Modify: `tests/components/ProblemInput.test.tsx`

**Interfaces:**
- Keeps the existing `ProblemInput({ onSubmit: (description: string) => void, isLoading?: boolean })` contract from v1 — Task 7 still wires it the same way.

- [ ] **Step 1: Write the new/changed tests**

Add these cases to `tests/components/ProblemInput.test.tsx` (keep the 4 existing v1 tests — trimmed submit, quick-category fill, loading-disables — and add):

```typescript
  it('shows the too-short validation message under 15 characters and disables submit', async () => {
    const user = userEvent.setup();
    render(<ProblemInput onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText('Descrierea problemei'), 'am o problema');

    expect(screen.getByText('Descrierea este prea scurtă (minim 15 caractere)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analizează situația' })).toBeDisabled();
  });

  it('clears the too-short message and enables submit at 15+ characters', async () => {
    const user = userEvent.setup();
    render(<ProblemInput onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText('Descrierea problemei'), 'Am primit o amendă');

    expect(
      screen.queryByText('Descrierea este prea scurtă (minim 15 caractere)')
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analizează situația' })).toBeEnabled();
  });
```

Update the existing tests' button-name queries from `'Analizează'` to `'Analizează situația'` and the loading label from `'Se analizează...'` to whatever Step 3 below sets (keep it `'Se analizează...'` — only the idle-state label changes).

- [ ] **Step 2: Run the tests and verify the new ones fail**

Run: `npm test -- tests/components/ProblemInput.test.tsx`
Expected: FAIL — no too-short validation message exists yet, and the button is still named "Analizează".

- [ ] **Step 3: Rewrite `components/ProblemInput.tsx`**

```tsx
'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const QUICK_CATEGORIES = [
  { emoji: '📄', label: 'Amenzi', value: 'Am primit o amendă de parcare de la primărie și vreau să o contest oficial.' },
  { emoji: '⚡', label: 'Facturi utilități', value: 'Am fost facturat eronat la energie electrică și furnizorul refuză recalcularea.' },
  { emoji: '🏛️', label: 'Probleme cu ANAF', value: 'Am o poprire pe cont de la ANAF și vreau să aflu baza legală și să depun declarația unică.' },
  { emoji: '⚖️', label: 'Reclamații ANPC', value: 'Comerciantul refuză returnarea produsului în 14 zile. Doresc reclamație ANPC.' },
  { emoji: '🏢', label: 'Sesizări primărie', value: 'Groapă adâncă pe carosabil și copac căzut pe alee publică.' },
];

const MIN_DESCRIPTION_LENGTH = 15;
const MAX_DESCRIPTION_LENGTH = 2000;
const TOO_SHORT_MESSAGE = 'Descrierea este prea scurtă (minim 15 caractere)';

interface ProblemInputProps {
  onSubmit: (description: string) => void;
  isLoading?: boolean;
}

export function ProblemInput({ onSubmit, isLoading = false }: ProblemInputProps) {
  const [description, setDescription] = useState('');
  const trimmedLength = description.trim().length;
  const isTooShort = trimmedLength > 0 && trimmedLength < MIN_DESCRIPTION_LENGTH;
  const canSubmit = trimmedLength >= MIN_DESCRIPTION_LENGTH && !isLoading;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = description.trim();
    if (trimmed.length < MIN_DESCRIPTION_LENGTH) return;
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Descrie problema ta" className="space-y-space-md">
      <Textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Ex: Am primit o amendă de la primărie și nu știu cum să o contest..."
        aria-label="Descrierea problemei"
        maxLength={MAX_DESCRIPTION_LENGTH}
        rows={5}
      />
      {isTooShort && (
        <p role="alert" className="font-label-sm text-label-sm text-error">
          {TOO_SHORT_MESSAGE}
        </p>
      )}
      <div role="group" aria-label="Situații frecvente" className="flex flex-wrap gap-space-sm">
        {QUICK_CATEGORIES.map((category) => (
          <button
            key={category.label}
            type="button"
            onClick={() => setDescription(category.value)}
            className="rounded-lg bg-surface-container-high px-space-sm py-1.5 text-label-sm font-label-sm flex items-center gap-1.5"
          >
            <span>{category.emoji}</span>
            <span>{category.label}</span>
          </button>
        ))}
      </div>
      <Button type="submit" disabled={!canSubmit} className="w-full">
        {isLoading ? 'Se analizează...' : 'Analizează situația'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `npm test -- tests/components/ProblemInput.test.tsx`
Expected: PASS, 6 tests (4 updated + 2 new).

- [ ] **Step 5: Commit**

```bash
git add components/ProblemInput.tsx tests/components/ProblemInput.test.tsx
git commit -m "feat: redesign ProblemInput with situation chips and too-short validation"
```

---

### Task 6: Analysis-in-progress loading stepper

**Files:**
- Create: `components/AnalysisProgress.tsx`
- Create: `tests/components/AnalysisProgress.test.tsx`

**Interfaces:**
- Produces: `AnalysisProgress()` (no props for M1 — a static 4-step visual sequence with a self-contained CSS animation, not driven by real backend progress events, matching the catalog's screen #3 which is itself a simulated/animated progress bar, not real telemetry), consumed by Task 7's page wiring (rendered instead of the plain button label while `isLoading` is true).

- [ ] **Step 1: Write the failing test**

Create `tests/components/AnalysisProgress.test.tsx`:

```typescript
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalysisProgress } from '@/components/AnalysisProgress';

describe('AnalysisProgress', () => {
  it('renders all four pipeline steps', () => {
    render(<AnalysisProgress />);
    expect(screen.getByText('Se analizează textul')).toBeInTheDocument();
    expect(screen.getByText('Se identifică domeniul')).toBeInTheDocument();
    expect(screen.getByText('Se caută instituția potrivită')).toBeInTheDocument();
    expect(screen.getByText('Se pregătește recomandarea')).toBeInTheDocument();
  });

  it('has an accessible status role so screen readers announce progress', () => {
    render(<AnalysisProgress />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- tests/components/AnalysisProgress.test.tsx`
Expected: FAIL — `@/components/AnalysisProgress` doesn't exist.

- [ ] **Step 3: Write `components/AnalysisProgress.tsx`**

```tsx
const STEPS = [
  'Se analizează textul',
  'Se identifică domeniul',
  'Se caută instituția potrivită',
  'Se pregătește recomandarea',
];

export function AnalysisProgress() {
  return (
    <div role="status" aria-label="Analiză în curs" className="flex flex-col gap-space-sm">
      {STEPS.map((step, index) => (
        <div key={step} className="flex items-center gap-space-sm">
          <span className="w-8 h-8 rounded-full bg-primary text-on-primary font-label-md text-label-md flex items-center justify-center shrink-0">
            {index + 1}
          </span>
          <span className="font-body-md text-body-md text-on-surface">{step}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npm test -- tests/components/AnalysisProgress.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add components/AnalysisProgress.tsx tests/components/AnalysisProgress.test.tsx
git commit -m "feat: add AnalysisProgress loading stepper"
```

---

### Task 7: Redesigned AnalysisResult and home page wiring

**Files:**
- Modify: `components/AnalysisResult.tsx`
- Modify: `tests/components/AnalysisResult.test.tsx`
- Modify: `app/page.tsx`
- Modify: `tests/app/page.test.tsx`
- Modify: `app/layout.tsx` (render `<Header>`/`<Footer>` around `{children}` if not already wired there)

**Interfaces:**
- Keeps `AnalysisResult({ result: TriageResponse })` from v1 (institution-null fallback and a11y attrs from the final review carry forward unchanged in behavior, only visual structure changes).
- Consumes `AnalysisProgress` (Task 6), `Header`/`Footer` (Task 4).
- **`app/layout.tsx` was already modified once in Task 3** (font setup: `Plus_Jakarta_Sans` import, `<head>` Material Symbols link). Step 5 below modifies it again, additively — preserve every existing line from Task 3's edit; only add the `Header`/`Footer` import and JSX wrapping around `{children}`.

- [ ] **Step 1: Update `tests/components/AnalysisResult.test.tsx`**

Keep the existing 4 v1 tests (renders explanation/documents/next-steps/institution; low-confidence badge shown/hidden; null-institution fallback) — they assert on text content and roles that don't need to change. Add one new case for the recommended-channel badge:

```typescript
  it('shows the recommended channel as a badge', () => {
    render(<AnalysisResult result={baseResult} />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });
```

(`baseResult.recommended_channel` is `'online'` in the existing fixture — add a channel-label lookup in the component that maps `'online' | 'telefon' | 'fizic'` to `'Online' | 'Telefon' | 'Fizic'`.)

- [ ] **Step 2: Run the test and verify the new case fails**

Run: `npm test -- tests/components/AnalysisResult.test.tsx`
Expected: FAIL on the new channel-badge assertion only; the other 4 still pass against the current component.

- [ ] **Step 3: Update `components/AnalysisResult.tsx`**

Add a `CHANNEL_LABELS` map and a channel badge alongside the existing urgency/low-confidence badges, restyle the containers to use the new `Card`-equivalent surface classes (`bg-surface-container-lowest rounded-xl shadow-sm p-space-lg`) instead of any leftover default shadcn spacing, and restyle `required_documents` as a checklist (icon + text per item) and `next_steps` as the numbered stepper pattern shared with `AnalysisProgress`'s visual language (a filled circle number + text row), while preserving every existing prop, conditional-rendering rule, and accessibility attribute (`role="region"`, `aria-live="polite"`, the null-institution `role="alert"` fallback) exactly as v1 built them:

```tsx
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
    </div>
  );
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npm test -- tests/components/AnalysisResult.test.tsx`
Expected: PASS, 5 tests.

- [ ] **Step 5: Wire `Header`/`Footer` into the layout**

In `app/layout.tsx`, import `Header` and `Footer` from `@/components/Header` and `@/components/Footer`, and wrap `{children}` inside `<body>`:

```tsx
<body className={/* ...existing font class(es) */}>
  <Header />
  <main className="pt-20">{children}</main>
  <Footer />
</body>
```

(The `pt-20` on `<main>` offsets the fixed 80px-tall header from Task 4 so content doesn't render underneath it.)

- [ ] **Step 6: Update `app/page.tsx`**

Add the hero section above the existing `ProblemInput`/`AnalysisResult` wiring, and swap the loading affordance to use `AnalysisProgress`:

```tsx
'use client';

import { useState } from 'react';
import { ProblemInput } from '@/components/ProblemInput';
import { AnalysisResult } from '@/components/AnalysisResult';
import { AnalysisProgress } from '@/components/AnalysisProgress';
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
    <div className="max-w-7xl mx-auto px-margin py-space-xl">
      <section className="text-center flex flex-col items-center mb-space-xl">
        <h1 className="font-display text-display text-on-surface max-w-4xl">
          Nu știi unde să te adresezi?{' '}
          <span className="text-secondary">Spune-ne problema ta.</span>
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mt-space-sm">
          Descrie situația ta în cuvinte simple și te direcționăm către instituția potrivită, cu
          documentele și pașii necesari.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
          <ProblemInput onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-7">
          {isLoading && <AnalysisProgress />}
          {error && (
            <p role="alert" className="font-body-sm text-body-sm text-error">
              {error}
            </p>
          )}
          {result && <AnalysisResult result={result} />}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Update `tests/app/page.test.tsx`**

The two existing v1 tests still exercise the same `fetch`/submit/result-render/error-alert flow and should pass unchanged against the new markup, since all queries are by `aria-label`/`role`/text content rather than layout structure. Add one new case:

```typescript
  it('shows the analysis-progress stepper while loading', async () => {
    const user = userEvent.setup();
    let resolveFetch: (value: unknown) => void = () => {};
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(new Promise((resolve) => { resolveFetch = resolve; }))
    );

    render(<HomePage />);
    await user.type(screen.getByLabelText('Descrierea problemei'), 'Am o problemă cu ANAF');
    await user.click(screen.getByRole('button', { name: 'Analizează situația' }));

    expect(screen.getByRole('status', { name: 'Analiză în curs' })).toBeInTheDocument();

    resolveFetch({ ok: true, json: () => Promise.resolve(sampleResponse) });
  });
```

Update the two existing tests' button-name queries from `'Analizează'` to `'Analizează situația'` (matching Task 5's rename).

- [ ] **Step 8: Run the full suite and build**

Run: `npm test`
Expected: all test files pass.

Run: `npm run build`
Expected: succeeds with no type errors.

- [ ] **Step 9: Manual check**

Run: `npm run dev`, open `http://localhost:3000` with real `DATABASE_URL`/`GROQ_API_KEY` values in `.env.local`, submit a real Romanian problem description, and confirm the hero/workspace/loading-stepper/result flow renders correctly end-to-end against live Neon + Groq.

- [ ] **Step 10: Commit**

```bash
git add components/AnalysisResult.tsx tests/components/AnalysisResult.test.tsx app/page.tsx tests/app/page.test.tsx app/layout.tsx
git commit -m "feat: redesign AnalysisResult and wire Header/Footer/AnalysisProgress into the home page"
```

---

## Post-final-review addendum (Tasks 8-10)

Added after the whole-branch final review (opus) found two Critical and two Important issues, and after the user directly instructed building the missing pages ("implementa toate paginile necesare") rather than stubbing/descoping them. See `.superpowers/sdd/2026-09-27-unde-merg-m1-neon-groq-reskin/progress.md` for the full review report and rulings.

### Task 8: Fix wave — design-token bridge, dead-code cleanup, test coverage

**Files:**
- Modify: `app/globals.css`
- Modify: `components/ui/button.tsx`
- Modify: `components/Logo.tsx`
- Modify: `lib/triage.ts`
- Modify: `tests/lib/triage.test.ts`
- Modify: `app/layout.tsx`
- Modify: `tests/api/triage.test.ts`

**Context:** Task 3 replaced the shadcn-scaffolded `@theme inline { --color-primary: var(--primary); ... }` alias bridge with the civic `@theme` token block, but never re-added an alias bridge — so shadcn primitives (`Button`, `Badge`, `Card`, `Textarea`) reference `--color-primary-foreground`, `--color-ring`, `--color-border`, `--color-card`, etc., which now resolve to nothing. Confirmed in the built CSS: the primary CTA's text is unreadable (~1.2:1 contrast) and there is no visible keyboard focus ring anywhere in the app — both violate this plan's own accessibility Global Constraint.

- [ ] **Step 1: Add the missing `@theme inline` alias bridge to `app/globals.css`**

Insert this block immediately after the closing `}` of the existing `@theme { ... }` block (i.e. right before the `:root {` line):

```css
@theme inline {
  --color-foreground: var(--color-on-surface);
  --color-primary-foreground: var(--color-on-primary);
  --color-secondary-foreground: var(--color-on-secondary);
  --color-muted: var(--color-surface-container);
  --color-muted-foreground: var(--color-on-surface-variant);
  --color-card: var(--color-surface-container-lowest);
  --color-card-foreground: var(--color-on-surface);
  --color-destructive: var(--color-error);
  --color-border: var(--color-outline-variant);
  --color-input: var(--color-outline-variant);
  --color-ring: var(--color-secondary);
}
```

- [ ] **Step 2: Delete the dead `:root { ... }` and `.dark { ... }` blocks from `app/globals.css`**

These are the two blocks immediately following the new `@theme inline` block (the ones starting `--background: oklch(1 0 0);` and `--foreground: oklch(0.985 0 0);` respectively) — roughly 70 lines total. They hold bare (non-`--color-`-prefixed) shadcn variables now fully superseded by the alias bridge above; nothing in the app sets a `.dark` class, so removing them changes no current behavior. Leave `@custom-variant dark (&:is(.dark *));` and the `@layer base { ... }` block at the end untouched.

- [ ] **Step 3: Fix `components/ui/button.tsx`'s hover color-mix to use live tokens**

Find this line (the `secondary` button variant):
```
"bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
```
Change `var(--secondary)` → `var(--color-secondary)` and `var(--foreground)` → `var(--color-foreground)` (the bare names no longer resolve to anything after Step 2 — this variant isn't used yet in app code, but leaving it referencing dead variables is a landmine for whoever uses it next):
```
"bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--color-secondary),var(--color-foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
```

- [ ] **Step 4: Fix `components/Logo.tsx`'s conflicting font-weight utility**

The subtitle span combines `text-label-sm` (whose token sets `font-weight: 700`) with a `font-medium` class that overrides it to 500. Remove `font-medium`:
```tsx
<span className="font-label-sm text-label-sm text-on-surface-variant">
```

- [ ] **Step 5: Run the full suite and build to confirm the CSS/token fix introduces no regressions**

Run: `npm test`
Expected: all existing tests still pass (this is a pure CSS/token change, no component behavior changes).

Run: `npm run build`
Expected: succeeds with no type errors.

- [ ] **Step 6: Rename the stale Gemini reference**

In `lib/triage.ts`, change:
```typescript
throw new Error('No JSON object found in Gemini response');
```
to:
```typescript
throw new Error('No JSON object found in Groq response');
```
In `tests/lib/triage.test.ts`, update the matching assertion string from `'No JSON object found in Gemini response'` to `'No JSON object found in Groq response'`.

- [ ] **Step 7: Remove the unused Material Symbols font link**

In `app/layout.tsx`, no component uses `material-symbols-outlined` classes (M1's icons are emoji and a `✓` character) — the font link only costs a render-blocking request and produces 2 lint warnings. Remove the `<head>` element entirely (it currently contains only this one `<link>`):
```tsx
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
```
becomes: delete this whole block, so `<html>` goes straight to `<body>`.

- [ ] **Step 8: Add 4 test-coverage cases to `tests/api/triage.test.ts`**

Add inside the existing `describe('POST /api/triage', ...)` block:

```typescript
  it('returns 500 when GROQ_API_KEY is missing', async () => {
    delete process.env.GROQ_API_KEY;

    const response = await POST(makeRequest({ description: 'Am o problemă cu ANAF' }));
    expect(response.status).toBe(500);
  });

  it('sends the user description to Groq in the user message', async () => {
    createCompletionMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(validTriageResult) } }],
    });
    vi.mocked(findInstitution).mockResolvedValue(null);

    await POST(makeRequest({ description: 'Am o problemă cu declarația fiscală' }));

    expect(createCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('Am o problemă cu declarația fiscală'),
          }),
        ]),
      })
    );
  });

  it('passes the parsed institution_type to findInstitution', async () => {
    createCompletionMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(validTriageResult) } }],
    });
    vi.mocked(findInstitution).mockResolvedValue(null);

    await POST(makeRequest({ description: 'Am o problemă cu declarația fiscală' }));

    expect(findInstitution).toHaveBeenCalledWith(expect.anything(), validTriageResult.institution_type);
  });

  it('returns institution: null end-to-end when no match is found', async () => {
    createCompletionMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(validTriageResult) } }],
    });
    vi.mocked(findInstitution).mockResolvedValue(null);

    const response = await POST(makeRequest({ description: 'Am o problemă cu declarația fiscală' }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.institution).toBeNull();
  });
```

- [ ] **Step 9: Run the full suite and build one more time**

Run: `npm test`
Expected: all test files pass (4 more tests than before).

Run: `npm run build`
Expected: succeeds with no type errors.

- [ ] **Step 10: Manual visual check (recommended, not required for automated tests to pass)**

Run `npm run dev`, open `http://localhost:3000`, and confirm: the "Analizează situația" button text is clearly readable (white on navy), and pressing Tab shows a visible focus ring on the textarea/button/nav links.

- [ ] **Step 11: Commit**

```bash
git add app/globals.css components/ui/button.tsx components/Logo.tsx lib/triage.ts tests/lib/triage.test.ts app/layout.tsx tests/api/triage.test.ts
git commit -m "fix: restore shadcn color-alias bridge, remove dead theme/font cruft, add triage route test coverage"
```

---

### Task 9: Trust indicators + "Cum funcționează" panel

**Files:**
- Create: `components/HowItWorks.tsx`
- Create: `tests/components/HowItWorks.test.tsx`
- Create: `app/cum-functioneaza/page.tsx`
- Create: `tests/app/cum-functioneaza.test.tsx`
- Modify: `app/page.tsx`
- Modify: `tests/app/page.test.tsx`

**Context:** Global Constraints name "trust indicators" and "the 'how it works' panel" as explicitly in-scope for M1 (screens #1-3), but no task built them — `app/page.tsx`'s right column currently renders nothing until the user submits. The catalog describes screen #1's mobile variant as showing a "Cum funcționează" 3-4-step explainer in place of results before submission; this task builds that as a shared component used both as the page's idle state (all viewports, simpler than replicating desktop/mobile divergent behavior) and as a standalone page for the Header's `/cum-functioneaza` nav link.

- [ ] **Step 1: Write `tests/components/HowItWorks.test.tsx`**

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HowItWorks } from '@/components/HowItWorks';

describe('HowItWorks', () => {
  it('renders the heading and all three steps', () => {
    render(<HowItWorks />);
    expect(screen.getByText('Cum funcționează')).toBeInTheDocument();
    expect(screen.getByText(/Descrii problema ta/)).toBeInTheDocument();
    expect(screen.getByText(/Inteligența artificială analizează/)).toBeInTheDocument();
    expect(screen.getByText(/Primești instituția potrivită/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- tests/components/HowItWorks.test.tsx`
Expected: FAIL — `@/components/HowItWorks` does not exist yet.

- [ ] **Step 3: Create `components/HowItWorks.tsx`**

```tsx
const HOW_IT_WORKS_STEPS = [
  'Descrii problema ta în cuvinte simple, fără termeni juridici.',
  'Inteligența artificială analizează situația și identifică domeniul potrivit.',
  'Primești instituția potrivită, documentele necesare și pașii următori.',
];

export function HowItWorks() {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md">
      <h2 className="font-title-md text-title-md text-on-surface">Cum funcționează</h2>
      <ol className="flex flex-col gap-space-sm">
        {HOW_IT_WORKS_STEPS.map((step, index) => (
          <li key={step} className="flex items-center gap-space-sm">
            <span className="w-6 h-6 rounded-full bg-secondary text-on-secondary text-label-sm font-label-sm flex items-center justify-center shrink-0">
              {index + 1}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npm test -- tests/components/HowItWorks.test.tsx`
Expected: PASS, 1 test.

- [ ] **Step 5: Wire the trust-indicator row and `HowItWorks` into `app/page.tsx`**

Add a trust-indicator row below the hero subtitle, and render `<HowItWorks />` in the right column whenever there's no loading/error/result state (the idle state). Full updated component:

```tsx
'use client';

import { useState } from 'react';
import { ProblemInput } from '@/components/ProblemInput';
import { AnalysisResult } from '@/components/AnalysisResult';
import { AnalysisProgress } from '@/components/AnalysisProgress';
import { HowItWorks } from '@/components/HowItWorks';
import type { TriageResponse } from '@/lib/types';

const TRUST_INDICATORS = ['100% Gratuit', 'Fără cont necesar', 'Confidențial'];

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
    <div className="max-w-7xl mx-auto px-margin py-space-xl">
      <section className="text-center flex flex-col items-center mb-space-xl">
        <h1 className="font-display text-display text-on-surface max-w-4xl">
          Nu știi unde să te adresezi?{' '}
          <span className="text-secondary">Spune-ne problema ta.</span>
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mt-space-sm">
          Descrie situația ta în cuvinte simple și te direcționăm către instituția potrivită, cu
          documentele și pașii necesari.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-space-sm mt-space-md">
          {TRUST_INDICATORS.map((indicator) => (
            <span
              key={indicator}
              className="font-label-md text-label-md text-on-surface-variant bg-surface-container-low rounded-full px-space-sm py-1"
            >
              {indicator}
            </span>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
          <ProblemInput onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-7">
          {!isLoading && !error && !result && <HowItWorks />}
          {isLoading && <AnalysisProgress />}
          {error && (
            <p role="alert" className="font-body-sm text-body-sm text-error">
              {error}
            </p>
          )}
          {result && <AnalysisResult result={result} />}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Add a page-level test asserting the idle state, and update `tests/app/page.test.tsx`**

Add this test to the existing `describe('HomePage', ...)` block:

```typescript
  it('shows the how-it-works panel before any submission', () => {
    render(<HomePage />);
    expect(screen.getByText('Cum funcționează')).toBeInTheDocument();
  });
```

- [ ] **Step 7: Run the page tests and verify everything passes**

Run: `npm test -- tests/app/page.test.tsx`
Expected: PASS, 5 tests (4 existing + 1 new).

- [ ] **Step 8: Write `tests/app/cum-functioneaza.test.tsx`**

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import CumFunctioneazaPage from '@/app/cum-functioneaza/page';

describe('CumFunctioneazaPage', () => {
  it('renders the page heading and the how-it-works steps', () => {
    render(<CumFunctioneazaPage />);
    expect(screen.getByRole('heading', { name: 'Cum funcționează Unde Merg?' })).toBeInTheDocument();
    expect(screen.getByText('Cum funcționează')).toBeInTheDocument();
  });
});
```

- [ ] **Step 9: Run the test and verify it fails**

Run: `npm test -- tests/app/cum-functioneaza.test.tsx`
Expected: FAIL — `@/app/cum-functioneaza/page` does not exist yet.

- [ ] **Step 10: Create `app/cum-functioneaza/page.tsx`**

```tsx
import { HowItWorks } from '@/components/HowItWorks';

export default function CumFunctioneazaPage() {
  return (
    <div className="max-w-3xl mx-auto px-margin py-space-xl flex flex-col gap-space-lg">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">Cum funcționează Unde Merg?</h1>
      <p className="font-body-lg text-body-lg text-on-surface-variant">
        Unde Merg? te ajută să afli rapid la ce instituție publică trebuie să te adresezi pentru
        problema ta, fără să cauți singur prin zeci de site-uri guvernamentale.
      </p>
      <HowItWorks />
    </div>
  );
}
```

- [ ] **Step 11: Run the test and verify it passes**

Run: `npm test -- tests/app/cum-functioneaza.test.tsx`
Expected: PASS, 1 test.

- [ ] **Step 12: Run the full suite and build**

Run: `npm test`
Expected: all test files pass.

Run: `npm run build`
Expected: succeeds with no type errors (a new static route `/cum-functioneaza` is emitted).

- [ ] **Step 13: Commit**

```bash
git add components/HowItWorks.tsx tests/components/HowItWorks.test.tsx app/cum-functioneaza tests/app/cum-functioneaza.test.tsx app/page.tsx tests/app/page.test.tsx
git commit -m "feat: add trust indicators, how-it-works panel, and /cum-functioneaza page"
```

---

### Task 10: Institutions catalog page + FAQ page

**Files:**
- Modify: `lib/institutions.ts`
- Modify: `tests/lib/institutions.test.ts`
- Create: `app/institutii/page.tsx`
- Create: `tests/app/institutii.test.tsx`
- Create: `app/intrebari-frecvente/page.tsx`
- Create: `tests/app/intrebari-frecvente.test.tsx`

**Context:** The Header's remaining two dead nav links. `/institutii` needs a real (if basic) institution listing — this is a cut-down version of M2's fuller manual-catalog screen (#4, which adds search/filter/category grouping); M1's version is a plain list using the institution data and `InstitutionCard` that already exist, so M2 can layer search/filter on top rather than building the page from scratch. `/intrebari-frecvente` is static content, no DB.

- [ ] **Step 1: Write a failing test for `listInstitutions` in `tests/lib/institutions.test.ts`**

Add this `describe` block to the existing file (keep the existing `findInstitution` tests untouched):

```typescript
describe('listInstitutions', () => {
  it('returns every institution parsed from the rows', async () => {
    const sql = createFakeSql([sampleInstitution]);
    const result = await listInstitutions(sql);
    expect(result).toEqual([sampleInstitution]);
  });

  it('filters out rows that fail schema validation', async () => {
    const sql = createFakeSql([sampleInstitution, { ...sampleInstitution, website_url: 'not-a-url' }]);
    const result = await listInstitutions(sql);
    expect(result).toEqual([sampleInstitution]);
  });
});
```

Add `listInstitutions` to the existing import line: `import { findInstitution, listInstitutions } from '@/lib/institutions';`

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- tests/lib/institutions.test.ts`
Expected: FAIL — `listInstitutions` is not exported yet.

- [ ] **Step 3: Add `listInstitutions` to `lib/institutions.ts`**

```typescript
export async function listInstitutions(
  sql: NeonQueryFunction<false, false>
): Promise<Institution[]> {
  const rows = await sql`SELECT * FROM institutions ORDER BY name`;
  return rows
    .map((row) => InstitutionSchema.safeParse(row))
    .filter((result): result is { success: true; data: Institution } => result.success)
    .map((result) => result.data);
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npm test -- tests/lib/institutions.test.ts`
Expected: PASS, 5 tests (3 existing `findInstitution` + 2 new `listInstitutions`).

- [ ] **Step 5: Write `tests/app/institutii.test.tsx`**

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/db', () => ({
  createDb: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/institutions', () => ({
  listInstitutions: vi.fn(),
}));

import InstitutiiPage from '@/app/institutii/page';
import { listInstitutions } from '@/lib/institutions';

describe('InstitutiiPage', () => {
  it('renders every institution returned by listInstitutions', async () => {
    vi.mocked(listInstitutions).mockResolvedValue([
      {
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
    ]);

    render(await InstitutiiPage());

    expect(screen.getByText('Agenția Națională de Administrare Fiscală')).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run the test and verify it fails**

Run: `npm test -- tests/app/institutii.test.tsx`
Expected: FAIL — `@/app/institutii/page` does not exist yet.

- [ ] **Step 7: Create `app/institutii/page.tsx`** (an async Server Component — no `'use client'`)

```tsx
import { createDb } from '@/lib/db';
import { listInstitutions } from '@/lib/institutions';
import { InstitutionCard } from '@/components/InstitutionCard';

export default async function InstitutiiPage() {
  const sql = createDb();
  const institutions = await listInstitutions(sql);

  return (
    <div className="max-w-5xl mx-auto px-margin py-space-xl flex flex-col gap-space-lg">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">Instituții</h1>
      <p className="font-body-lg text-body-lg text-on-surface-variant">
        Lista instituțiilor publice către care te putem direcționa.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
        {institutions.map((institution) => (
          <InstitutionCard key={institution.code} institution={institution} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Run the test and verify it passes**

Run: `npm test -- tests/app/institutii.test.tsx`
Expected: PASS, 1 test.

- [ ] **Step 9: Write `tests/app/intrebari-frecvente.test.tsx`**

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import IntrebariFrecventePage from '@/app/intrebari-frecvente/page';

describe('IntrebariFrecventePage', () => {
  it('renders the page heading and all FAQ questions', () => {
    render(<IntrebariFrecventePage />);
    expect(screen.getByRole('heading', { name: 'Întrebări frecvente' })).toBeInTheDocument();
    expect(screen.getByText('Este gratuit acest serviciu?')).toBeInTheDocument();
    expect(screen.getByText('Ce fac dacă nu găsesc instituția potrivită?')).toBeInTheDocument();
  });
});
```

- [ ] **Step 10: Run the test and verify it fails**

Run: `npm test -- tests/app/intrebari-frecvente.test.tsx`
Expected: FAIL — `@/app/intrebari-frecvente/page` does not exist yet.

- [ ] **Step 11: Create `app/intrebari-frecvente/page.tsx`**

```tsx
const FAQ_ITEMS = [
  {
    question: 'Este gratuit acest serviciu?',
    answer: 'Da, Unde Merg? este complet gratuit și nu necesită niciun abonament.',
  },
  {
    question: 'Este nevoie de cont pentru a folosi serviciul?',
    answer: 'Nu. Poți descrie problema ta și primi o recomandare fără să creezi un cont.',
  },
  {
    question: 'Ce se întâmplă cu datele mele?',
    answer:
      'Descrierea problemei este trimisă către un serviciu de inteligență artificială pentru analiză și nu este asociată cu identitatea ta.',
  },
  {
    question: 'Cât de precisă este recomandarea?',
    answer:
      'Recomandarea este generată automat pe baza descrierii tale. Pentru cazuri complexe, îți recomandăm să confirmi informațiile direct cu instituția indicată.',
  },
  {
    question: 'Ce fac dacă nu găsesc instituția potrivită?',
    answer:
      'Poți contacta linia civică gratuită 0800 008 123 sau te poți adresa primăriei locale pentru îndrumare.',
  },
];

export default function IntrebariFrecventePage() {
  return (
    <div className="max-w-3xl mx-auto px-margin py-space-xl flex flex-col gap-space-lg">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">Întrebări frecvente</h1>
      <dl className="flex flex-col gap-space-md">
        {FAQ_ITEMS.map((item) => (
          <div key={item.question} className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
            <dt className="font-title-md text-title-md text-on-surface mb-space-xs">{item.question}</dt>
            <dd className="font-body-sm text-body-sm text-on-surface-variant">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
```

- [ ] **Step 12: Run the test and verify it passes**

Run: `npm test -- tests/app/intrebari-frecvente.test.tsx`
Expected: PASS, 1 test.

- [ ] **Step 13: Run the full suite and build**

Run: `npm test`
Expected: all test files pass.

Run: `npm run build`
Expected: succeeds with no type errors (two new static/dynamic routes emitted: `/institutii`, `/intrebari-frecvente`).

- [ ] **Step 14: Commit**

```bash
git add lib/institutions.ts tests/lib/institutions.test.ts app/institutii tests/app/institutii.test.tsx app/intrebari-frecvente tests/app/intrebari-frecvente.test.tsx
git commit -m "feat: add institutions catalog page and FAQ page"
```

---

### Task 11: Consolidated final fix wave — metadata, InstitutionCard styling, mobile footer nav, empty state, FAQ specificity

Added after a second, consolidated final review (opus) of the Tasks 8-10 addendum found 3 Important cross-page findings invisible to per-task review (identical `<title>` on every route; `InstitutionCard`'s website link rendering as unstyled plain text now that it's `/institutii`'s sole call-to-action; three real content pages unreachable on mobile since `Header`'s nav is desktop-only) plus two cheap Minor findings worth folding into the same pass (silent-drop of schema-invalid institution rows with no empty-state message; the FAQ's privacy answer not naming the AI processor). See the ledger for the full report and which Minor findings were deliberately parked instead (dead `font-{name}` growth, container-width inconsistency, loading/error boundaries, a `<StepNumber>` extraction, heading redundancy on `/cum-functioneaza`) — those are lower-value or larger-scope and don't belong in a fix wave.

**Files:**
- Modify: `components/InstitutionCard.tsx`
- Create: `tests/components/InstitutionCard.test.tsx`
- Modify: `lib/institutions.ts`
- Modify: `tests/lib/institutions.test.ts`
- Modify: `app/institutii/page.tsx`
- Modify: `tests/app/institutii.test.tsx`
- Modify: `app/cum-functioneaza/page.tsx`
- Modify: `app/intrebari-frecvente/page.tsx`
- Modify: `components/Footer.tsx`
- Modify: `tests/components/Footer.test.tsx`

- [ ] **Step 1: Write a failing test for `InstitutionCard`'s link styling**

Create `tests/components/InstitutionCard.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InstitutionCard } from '@/components/InstitutionCard';
import type { Institution } from '@/lib/types';

const institution: Institution = {
  id: '1',
  code: 'ANAF',
  name: 'Agenția Națională de Administrare Fiscală',
  description: 'Administrează impozitele și taxele.',
  category: 'fiscal',
  website_url: 'https://www.anaf.ro',
  contact_form_url: null,
  phone: null,
  email: null,
  address: null,
};

describe('InstitutionCard', () => {
  it('renders the website link with a visible, styled affordance', () => {
    render(<InstitutionCard institution={institution} />);
    const link = screen.getByRole('link', { name: 'https://www.anaf.ro' });
    expect(link).toHaveClass('underline');
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- tests/components/InstitutionCard.test.tsx`
Expected: FAIL — the current `<a>` has no `className`, so `toHaveClass('underline')` fails.

- [ ] **Step 3: Restyle `components/InstitutionCard.tsx` onto civic tokens with a visible link**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Institution } from '@/lib/types';

interface InstitutionCardProps {
  institution: Institution;
}

export function InstitutionCard({ institution }: InstitutionCardProps) {
  return (
    <Card className="shadow-sm ring-0">
      <CardHeader>
        <CardTitle className="font-title-md text-title-md text-on-surface">
          {institution.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
        {institution.description && <p>{institution.description}</p>}
        {institution.website_url && (
          <p>
            <a
              href={institution.website_url}
              target="_blank"
              rel="noreferrer"
              className="text-secondary underline underline-offset-2"
            >
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

(`shadow-sm ring-0` overrides the shadcn `Card`'s default `ring-1 ring-foreground/10` with no shadow, matching the `shadow-sm`-with-no-ring treatment every other panel in the app already uses — `HowItWorks`, the FAQ items, `AnalysisResult`'s container.)

- [ ] **Step 4: Run the test and verify it passes**

Run: `npm test -- tests/components/InstitutionCard.test.tsx`
Expected: PASS, 1 test.

- [ ] **Step 5: Run the existing suite to confirm no regressions from the restyle**

Run: `npm test`
Expected: all previously-passing tests still pass (this is a styling-only change; no test elsewhere asserts on `InstitutionCard`'s classes or the `Card`'s default ring/shadow).

- [ ] **Step 6: Add a failing test for `listInstitutions` warning on invalid rows**

Add to the existing `describe('listInstitutions', ...)` block in `tests/lib/institutions.test.ts`:

```typescript
  it('warns when a row fails schema validation', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const sql = createFakeSql([{ ...sampleInstitution, website_url: 'not-a-url' }]);

    await listInstitutions(sql);

    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
```

- [ ] **Step 7: Run the test and verify it fails**

Run: `npm test -- tests/lib/institutions.test.ts`
Expected: FAIL — `listInstitutions` doesn't call `console.warn` yet.

- [ ] **Step 8: Update `listInstitutions` in `lib/institutions.ts` to warn on invalid rows**

Replace the function body with:

```typescript
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
```

- [ ] **Step 9: Run the test and verify it passes**

Run: `npm test -- tests/lib/institutions.test.ts`
Expected: PASS, 6 tests (3 `findInstitution` + 3 `listInstitutions`).

- [ ] **Step 10: Write a failing test for `/institutii`'s empty state**

Add to `tests/app/institutii.test.tsx`, inside the existing `describe('InstitutiiPage', ...)` block:

```typescript
  it('shows a fallback message when no institutions are returned', async () => {
    vi.mocked(listInstitutions).mockResolvedValue([]);

    render(await InstitutiiPage());

    expect(screen.getByText(/nu este disponibilă momentan/)).toBeInTheDocument();
  });
```

- [ ] **Step 11: Run the test and verify it fails**

Run: `npm test -- tests/app/institutii.test.tsx`
Expected: FAIL — no empty-state branch exists yet.

- [ ] **Step 12: Update `app/institutii/page.tsx` with an empty-state branch and page metadata**

```tsx
import type { Metadata } from 'next';
import { createDb } from '@/lib/db';
import { listInstitutions } from '@/lib/institutions';
import { InstitutionCard } from '@/components/InstitutionCard';

export const metadata: Metadata = {
  title: 'Instituții — Unde Merg?',
  description: 'Lista instituțiilor publice către care Unde Merg? te poate direcționa.',
};

// Institution data is fetched live from the DB on every request rather than
// baked into the static shell at build time (which would require DB access
// during `next build`).
export const dynamic = 'force-dynamic';

export default async function InstitutiiPage() {
  const sql = createDb();
  const institutions = await listInstitutions(sql);

  return (
    <div className="max-w-5xl mx-auto px-margin py-space-xl flex flex-col gap-space-lg">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">Instituții</h1>
      <p className="font-body-lg text-body-lg text-on-surface-variant">
        Lista instituțiilor publice către care te putem direcționa.
      </p>
      {institutions.length === 0 ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Lista instituțiilor nu este disponibilă momentan. Încearcă din nou mai târziu.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
          {institutions.map((institution) => (
            <InstitutionCard key={institution.code} institution={institution} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 13: Run the test and verify it passes**

Run: `npm test -- tests/app/institutii.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 14: Add metadata to `app/cum-functioneaza/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { HowItWorks } from '@/components/HowItWorks';

export const metadata: Metadata = {
  title: 'Cum funcționează — Unde Merg?',
  description:
    'Află în trei pași simpli cum te ajută Unde Merg? să identifici instituția publică potrivită pentru problema ta.',
};

export default function CumFunctioneazaPage() {
  return (
    <div className="max-w-3xl mx-auto px-margin py-space-xl flex flex-col gap-space-lg">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">Cum funcționează Unde Merg?</h1>
      <p className="font-body-lg text-body-lg text-on-surface-variant">
        Unde Merg? te ajută să afli rapid la ce instituție publică trebuie să te adresezi pentru
        problema ta, fără să cauți singur prin zeci de site-uri guvernamentale.
      </p>
      <HowItWorks />
    </div>
  );
}
```

- [ ] **Step 15: Add metadata to `app/intrebari-frecvente/page.tsx` and name Groq in the privacy answer**

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Întrebări frecvente — Unde Merg?',
  description: 'Răspunsuri la cele mai frecvente întrebări despre Unde Merg?.',
};

const FAQ_ITEMS = [
  {
    question: 'Este gratuit acest serviciu?',
    answer: 'Da, Unde Merg? este complet gratuit și nu necesită niciun abonament.',
  },
  {
    question: 'Este nevoie de cont pentru a folosi serviciul?',
    answer: 'Nu. Poți descrie problema ta și primi o recomandare fără să creezi un cont.',
  },
  {
    question: 'Ce se întâmplă cu datele mele?',
    answer:
      'Descrierea problemei este trimisă către Groq, un furnizor de inteligență artificială, pentru analiză și nu este asociată cu identitatea ta.',
  },
  {
    question: 'Cât de precisă este recomandarea?',
    answer:
      'Recomandarea este generată automat pe baza descrierii tale. Pentru cazuri complexe, îți recomandăm să confirmi informațiile direct cu instituția indicată.',
  },
  {
    question: 'Ce fac dacă nu găsesc instituția potrivită?',
    answer:
      'Poți contacta linia civică gratuită 0800 008 123 sau te poți adresa primăriei locale pentru îndrumare.',
  },
];

export default function IntrebariFrecventePage() {
  return (
    <div className="max-w-3xl mx-auto px-margin py-space-xl flex flex-col gap-space-lg">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">Întrebări frecvente</h1>
      <dl className="flex flex-col gap-space-md">
        {FAQ_ITEMS.map((item) => (
          <div key={item.question} className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
            <dt className="font-title-md text-title-md text-on-surface mb-space-xs">{item.question}</dt>
            <dd className="font-body-sm text-body-sm text-on-surface-variant">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
```

- [ ] **Step 16: Write a failing test for the mobile footer nav**

Add to `tests/components/Footer.test.tsx`, inside the existing `describe('Footer', ...)` block:

```typescript
  it('renders navigation links to every page', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: 'Acasă' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cum funcționează' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Instituții' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Întrebări frecvente' })).toBeInTheDocument();
  });
```

- [ ] **Step 17: Run the test and verify it fails**

Run: `npm test -- tests/components/Footer.test.tsx`
Expected: FAIL — `Footer` renders no links yet.

- [ ] **Step 18: Add a mobile-only nav to `components/Footer.tsx`**

```tsx
import Link from 'next/link';

const FOOTER_LINKS = [
  { href: '/', label: 'Acasă' },
  { href: '/cum-functioneaza', label: 'Cum funcționează' },
  { href: '/institutii', label: 'Instituții' },
  { href: '/intrebari-frecvente', label: 'Întrebări frecvente' },
];

export function Footer() {
  return (
    <footer className="w-full bg-surface-container-low mt-space-xl">
      <div className="max-w-7xl mx-auto px-margin py-space-xl flex flex-col gap-space-md">
        <nav aria-label="Navigare footer" className="flex flex-wrap gap-space-md md:hidden">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Dispecerat Civic Gratuit: <strong className="text-on-surface">0800 008 123</strong>{' '}
          (Luni – Vineri: 08:00 – 18:00)
        </p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          © 2026 Unde merg? – Orientare Civică. Acest serviciu civic nu constituie consultanță
          juridică autorizată. Informațiile prezentate au scop strict orientativ.
        </p>
      </div>
    </footer>
  );
}
```

(`md:hidden` keeps this nav mobile-only, since `Header`'s own nav already covers desktop at `md:` and up — this avoids two visible navs on wide viewports.)

- [ ] **Step 19: Run the test and verify it passes**

Run: `npm test -- tests/components/Footer.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 20: Run the full suite and build**

Run: `npm test`
Expected: all test files pass.

Run: `npm run build`
Expected: succeeds with no type errors.

- [ ] **Step 21: Commit**

```bash
git add components/InstitutionCard.tsx tests/components/InstitutionCard.test.tsx lib/institutions.ts tests/lib/institutions.test.ts app/institutii/page.tsx tests/app/institutii.test.tsx app/cum-functioneaza/page.tsx app/intrebari-frecvente/page.tsx components/Footer.tsx tests/components/Footer.test.tsx
git commit -m "fix: add page metadata, style InstitutionCard's link, add mobile footer nav, institutii empty state, and name Groq in the FAQ"
```

---

## Self-review notes

- Spec coverage: catalog screens #1 (hero/workspace → Task 5/7), #2 (too-short validation → Task 5), #3 (analysis-in-progress → Task 6) are all covered; the roadmap's stack-swap decisions (Task 1: Neon, Task 2: Groq) are covered; the roadmap's RLS-drop ruling is applied in Task 1 Step 2; the descope list (ambient decoration, urgency contact box, examples panel, voice input) is stated once in Global Constraints rather than repeated per task.
- Type consistency checked: `findInstitution`'s signature changes from `(SupabaseClient, string)` to `(NeonQueryFunction<false, false>, string)` consistently across Task 1's rewrite and Task 2's route usage; `ProblemInput`/`AnalysisResult`'s public props are unchanged from v1 across Tasks 5–7, so no other file needs prop-shape updates.
- Placeholder scan: no "TBD"/"add appropriate styling" found; every step has runnable code or an exact command.

### Self-review notes — Tasks 8-10 addendum

- Spec coverage: Critical #1 (design-token bridge) and Minors #6/#7/#9 from the final review → Task 8. Important #3 (trust indicators + how-it-works panel) → Task 9. Important #4 (dead nav links) → Tasks 9 (`/cum-functioneaza`) and 10 (`/institutii`, `/intrebari-frecvente`). Minor #5 (dead `font-{name}` classes) and the mobile-hamburger-nav half of Important #4 are deliberately NOT included — the plan's own Global Constraints already say implementers "may omit" the dead classes (not "must remove"), and no mobile nav was requested; both are parked in the ledger as low-value/out-of-scope-for-now rather than silently dropped.
- Type consistency checked: `listInstitutions` reuses `NeonQueryFunction<false, false>` and `Institution` exactly as `findInstitution` already does; `HowItWorks` takes no props (matching its use both inline and as a full page); `app/institutii/page.tsx` is the first Server Component page in the app (no `'use client'`) — its test calls the async function directly and awaits it before passing to `render()`, which works with the existing Vitest + Testing Library setup without additional config.
- Placeholder scan: no "TBD"/"add appropriate styling" found; every step has runnable code or an exact command.
