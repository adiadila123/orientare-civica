# Unde Merg M2 — Institution Catalog Search/Filter + Step-by-Step Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the plain `/institutii` listing (built as a stopgap in M1) into a searchable/filterable catalog per catalog screen #4, and add a per-institution step-by-step guide page (catalog screen #5) that tells a citizen the legal deadline, resolution paths, concrete steps (including real payment details when known), and required documents for dealing with that institution — without yet building a live, personalized case/document system (that's M3's `cases`/petitioner/PV data model).

**Architecture:** `/institutii` stays a Server Component that fetches all institutions, but now delegates rendering to a new client component (`InstitutionCatalog`) that owns search-text and category-filter state client-side (the dataset is small — under a dozen rows — so no server-side search/pagination is needed). A new dynamic route `/institutii/[code]` is the step-by-step guide screen, a Server Component reusing `findInstitution` (already built in M1). `InstitutionCard` (shared between the triage-result flow and the catalog) gains a link into the guide page, connecting Flow A's AI-triage result and the manual catalog into Flow B's guidance content. The institution data model gains 5 new nullable columns (associated court, IBAN, cod venit, CUI, simulated wait time) needed by the guide page.

**Tech Stack:** Same as M1 — Next.js (TypeScript, App Router), Tailwind v4 civic design tokens, `@neondatabase/serverless`, Zod, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-27-unde-merg-v2-roadmap.md` (M2's scope statement and the ruling that case/petitioner/PV/document-generation belongs to M3, not M2), `.superpowers/sdd/2026-09-27-unde-merg-mvp/stitch-screen-catalog.md` (screens #4-#5 detail, shared-component patterns #7 card / #8 stepper / #9 institution card / #14 deadline), `.superpowers/sdd/2026-09-27-unde-merg-m1-neon-groq-reskin/progress.md` (M1's final reviews — in particular the second review's Recommendation #3: "M2 planning must treat `/institutii` as existing-to-extend, not new").

## Global Constraints

- All user-facing text is in Romanian, matching the exact copy quoted in this plan.
- Next.js App Router, Tailwind v4 civic design tokens from `app/globals.css` (already fixed in M1 — no new tokens needed for M2).
- Dynamic route pages use this codebase's existing typed-helper convention (`PageProps<'/institutii/[code]'>`, matching `app/layout.tsx`'s existing `LayoutProps<"/">"` usage) — these types are generated into `.next/types/routes.d.ts` by `next build`/`next dev`, so a brand-new dynamic route may show a transient type error in an editor until the first `npm run build` regenerates them. This is expected, not a bug — the same thing was true when `LayoutProps<"/">` was first introduced in M1 Task 3.
- **The 5 new institution columns (`associated_court`, `iban`, `cod_venit`, `cui`, `wait_time_minutes`) are added to `lib/schema.ts`'s `InstitutionSchema` as `.nullable().optional()`, not just `.nullable()`.** This is deliberate: every existing test fixture across 6 files (`tests/lib/schema.test.ts`, `tests/lib/institutions.test.ts`, `tests/api/triage.test.ts`, `tests/components/AnalysisResult.test.tsx`, `tests/components/InstitutionCard.test.tsx`, `tests/app/institutii.test.tsx`) constructs an `Institution` object literal without these fields. A real Postgres row always returns the column (value `null` if unset), which satisfies `.nullable()` alone — but making the Zod field merely `.nullable()` (not also `.optional()`) would additionally require the *key* to be present, breaking all 6 fixtures for a change none of those tests care about. `.optional()` costs nothing at runtime (a real DB row is never missing the key) and avoids polluting 6 unrelated test files with irrelevant fixture noise. Do not touch those 6 files in this plan — if a task's own review finds one of them broken, that means this constraint was violated somewhere, not that the fixtures needed updating.
- Every task must leave `npm test` and `npm run build` green.
- **Explicitly out of scope for M2** (per the roadmap, deferred to M3): a `cases`/petitioner/PV data model, CNP validation, real templated document generation/download, and any per-citizen personalization of the guide page. The step-by-step guide built in Task 3 is generic informational content about *how to deal with a given institution*, not a live tracker for a specific citizen's case. Pagination on the catalog is also out of scope — the dataset (8-12 rows) doesn't need it yet; add it in a later milestone if the institution list grows materially.

---

### Task 1: Expand the institution data model

**Files:**
- Create: `db/migrations/0002_institution_guide_fields.sql`
- Modify: `db/seed.sql`
- Modify: `lib/schema.ts`
- Modify: `tests/lib/schema.test.ts`
- Modify: `tests/lib/institutions.test.ts`

**Interfaces:**
- Produces: `InstitutionSchema` (and therefore the `Institution` type via `z.infer`) gains 5 new optional/nullable fields: `associated_court: string | null | undefined`, `iban: string | null | undefined`, `cod_venit: string | null | undefined`, `cui: string | null | undefined`, `wait_time_minutes: number | null | undefined`. Tasks 2 and 3 consume these.
- Consumes: nothing new — `findInstitution`/`listInstitutions` already do `SELECT *`, so no query changes are needed; the new columns flow through automatically once the schema accepts them.

- [ ] **Step 1: Create the migration**

Create `db/migrations/0002_institution_guide_fields.sql`:

```sql
alter table institutions
  add column associated_court text,
  add column iban text,
  add column cod_venit text,
  add column cui text,
  add column wait_time_minutes integer;
```

- [ ] **Step 2: Update the seed data with the new fields**

Replace the entire contents of `db/seed.sql` with (note the switch from `on conflict (code) do nothing` to `on conflict (code) do update set ...` — this makes the seed idempotent for existing rows too, so re-running it against an already-seeded database backfills the new columns instead of silently skipping them):

```sql
insert into institutions (code, name, description, category, website_url, associated_court, iban, cod_venit, cui, wait_time_minutes) values
  ('ANPC', 'Autoritatea Națională pentru Protecția Consumatorilor', 'Instituția responsabilă pentru protecția drepturilor consumatorilor.', 'protectia_consumatorului', 'https://anpc.ro', null, 'RO49AAAA1B31007593840000', '20.03.01.02', '11111111', 15),
  ('ANAF', 'Agenția Națională de Administrare Fiscală', 'Administrează impozitele, taxele și contribuțiile sociale.', 'fiscal', 'https://www.anaf.ro', null, 'RO49AAAA1B31007593840001', '20.01.01.01', '22222222', 25),
  ('PRIMARIE', 'Primăria (generică, locală)', 'Sesizări și amenzi la nivel local; site-ul variază în funcție de localitate.', 'administratie_locala', null, 'Judecătoria de sector/localitate', 'RO49AAAA1B31007593840002', '21.02.05.02', '33333333', 40),
  ('POLITIE_LOCALA', 'Poliția Locală', 'Sesizări stradale și contravenții locale; site-ul variază în funcție de localitate.', 'ordine_publica', null, 'Judecătoria de sector/localitate', 'RO49AAAA1B31007593840003', '21.02.05.03', '44444444', 20),
  ('ANRE', 'Autoritatea Națională de Reglementare în Domeniul Energiei', 'Reglementează piața de energie electrică și gaze naturale.', 'energie', 'https://www.anre.ro', null, null, null, null, 10),
  ('ANCOM', 'Autoritatea Națională pentru Administrare și Reglementare în Comunicații', 'Reglementează piața de telecomunicații.', 'telecomunicatii', 'https://www.ancom.ro', null, null, null, null, 10),
  ('CNAS', 'Casa Națională de Asigurări de Sănătate', 'Administrează sistemul de asigurări sociale de sănătate.', 'sanatate', 'https://cnas.ro', null, null, null, null, 30),
  ('ITM', 'Inspecția Muncii', 'Controlează respectarea legislației muncii.', 'munca', 'https://www.inspectiamuncii.ro', null, null, null, null, 15)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  website_url = excluded.website_url,
  associated_court = excluded.associated_court,
  iban = excluded.iban,
  cod_venit = excluded.cod_venit,
  cui = excluded.cui,
  wait_time_minutes = excluded.wait_time_minutes;
```

(Only the 4 fine-issuing/contestable institutions — ANPC, ANAF, PRIMARIE, POLITIE_LOCALA — get a full IBAN/cod_venit/cui/court; the 4 purely-regulatory bodies get only a plausible wait time, since the guide page in Task 3 must already handle nulls gracefully for institutions with no payment/court data.)

- [ ] **Step 3: Write a failing test for the extended schema**

Add to `tests/lib/schema.test.ts`, inside the existing `describe('InstitutionSchema', ...)` block:

```typescript
  it('accepts an institution without the M2 guide fields (existing DB rows / fixtures)', () => {
    const result = InstitutionSchema.safeParse({
      id: '1',
      code: 'ANPC',
      name: 'ANPC',
      description: null,
      category: null,
      website_url: null,
      contact_form_url: null,
      phone: null,
      email: null,
      address: null,
    });
    expect(result.success).toBe(true);
  });

  it('parses and keeps the M2 guide fields when present', () => {
    const result = InstitutionSchema.safeParse({
      id: '1',
      code: 'ANAF',
      name: 'ANAF',
      description: null,
      category: null,
      website_url: null,
      contact_form_url: null,
      phone: null,
      email: null,
      address: null,
      associated_court: 'Judecătoria Sectorului 3',
      iban: 'RO49AAAA1B31007593840001',
      cod_venit: '20.01.01.01',
      cui: '22222222',
      wait_time_minutes: 25,
    });
    expect(result.success && result.data.wait_time_minutes).toBe(25);
  });
```

- [ ] **Step 4: Run the test and verify the second case fails**

Run: `npm test -- tests/lib/schema.test.ts`
Expected: the first new test passes already (existing fields are all still valid on their own, with or without the schema change). The second FAILS: Zod's default behavior is to silently strip unrecognized keys rather than error, so with the schema unchanged `result.success` is `true` but `result.data.wait_time_minutes` is `undefined` (stripped) — `undefined === 25` is `false`, so the assertion fails as intended.

- [ ] **Step 5: Add the 5 new fields to `InstitutionSchema` in `lib/schema.ts`**

```typescript
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
  associated_court: z.string().nullable().optional(),
  iban: z.string().nullable().optional(),
  cod_venit: z.string().nullable().optional(),
  cui: z.string().nullable().optional(),
  wait_time_minutes: z.number().int().nullable().optional(),
});
```

- [ ] **Step 6: Run the test and verify it passes**

Run: `npm test -- tests/lib/schema.test.ts`
Expected: PASS, 4 tests (2 existing + 2 new).

- [ ] **Step 7: Add a regression test proving the new fields pass through `findInstitution`**

This test doesn't need its own red phase — Step 5 already implemented the schema change it exercises; it exists to lock in the passthrough behavior against future regressions. Add to `tests/lib/institutions.test.ts`, inside the existing `describe('findInstitution', ...)` block:

```typescript
  it('passes through the M2 guide fields when present on the row', async () => {
    const sql = createFakeSql([{ ...sampleInstitution, wait_time_minutes: 25, iban: 'RO49AAAA1B31007593840001' }]);
    const result = await findInstitution(sql, 'anpc');
    expect(result?.wait_time_minutes).toBe(25);
    expect(result?.iban).toBe('RO49AAAA1B31007593840001');
  });
```

- [ ] **Step 8: Run the test and confirm it passes**

Run: `npm test -- tests/lib/institutions.test.ts`
Expected: PASS immediately (see Step 7's note). If it fails, Step 5's schema edit is incomplete or mistyped — fix `lib/schema.ts`, not this test.

- [ ] **Step 9: Run the full suite and build**

Run: `npm test`
Expected: all test files pass — in particular, confirm none of the 6 files named in this plan's Global Constraints note (`tests/lib/schema.test.ts` aside, which this task modifies on purpose) show any new failures. If any of `tests/api/triage.test.ts`, `tests/components/AnalysisResult.test.tsx`, `tests/components/InstitutionCard.test.tsx`, or `tests/app/institutii.test.tsx` fail, the `.optional()` in Step 5 was dropped or mistyped — fix it, don't edit those test files.

Run: `npm run build`
Expected: succeeds with no type errors.

- [ ] **Step 10: Commit**

```bash
git add db/migrations/0002_institution_guide_fields.sql db/seed.sql lib/schema.ts tests/lib/schema.test.ts tests/lib/institutions.test.ts
git commit -m "feat: add associated court, payment, and wait-time fields to the institution model"
```

---

### Task 2: Institution catalog search & category filter

**Files:**
- Create: `components/InstitutionCatalog.tsx`
- Create: `tests/components/InstitutionCatalog.test.tsx`
- Modify: `app/institutii/page.tsx`

**Interfaces:**
- Consumes: `Institution[]` (from `listInstitutions`, unchanged from M1), `InstitutionCard({ institution })` (unchanged from M1/M1-fix-wave).
- Produces: `InstitutionCatalog({ institutions: Institution[] })` — a client component owning search/filter UI state. `app/institutii/page.tsx` no longer renders the grid or the empty-state message itself; it delegates both to `InstitutionCatalog`, which reproduces the exact same empty-state message M1 built (`/nu este disponibilă momentan/`) so the existing `tests/app/institutii.test.tsx` empty-state test keeps passing unmodified.

- [ ] **Step 1: Write failing tests for `InstitutionCatalog`**

Create `tests/components/InstitutionCatalog.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InstitutionCatalog } from '@/components/InstitutionCatalog';
import type { Institution } from '@/lib/types';

const anaf: Institution = {
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
};

const anpc: Institution = {
  id: '2',
  code: 'ANPC',
  name: 'Autoritatea Națională pentru Protecția Consumatorilor',
  description: null,
  category: 'protectia_consumatorului',
  website_url: 'https://anpc.ro',
  contact_form_url: null,
  phone: null,
  email: null,
  address: null,
};

describe('InstitutionCatalog', () => {
  it('renders every institution by default', () => {
    render(<InstitutionCatalog institutions={[anaf, anpc]} />);
    expect(screen.getByText(anaf.name)).toBeInTheDocument();
    expect(screen.getByText(anpc.name)).toBeInTheDocument();
  });

  it('filters by search text', async () => {
    const user = userEvent.setup();
    render(<InstitutionCatalog institutions={[anaf, anpc]} />);

    await user.type(screen.getByLabelText('Caută o instituție'), 'fiscală');

    expect(screen.getByText(anaf.name)).toBeInTheDocument();
    expect(screen.queryByText(anpc.name)).not.toBeInTheDocument();
  });

  it('shows a fallback message when the search matches nothing', async () => {
    const user = userEvent.setup();
    render(<InstitutionCatalog institutions={[anaf, anpc]} />);

    await user.type(screen.getByLabelText('Caută o instituție'), 'xyz-inexistent');

    expect(screen.getByText('Nicio instituție nu corespunde căutării tale.')).toBeInTheDocument();
  });

  it('filters by category pill', async () => {
    const user = userEvent.setup();
    render(<InstitutionCatalog institutions={[anaf, anpc]} />);

    await user.click(screen.getByRole('button', { name: 'Fiscal' }));

    expect(screen.getByText(anaf.name)).toBeInTheDocument();
    expect(screen.queryByText(anpc.name)).not.toBeInTheDocument();
  });

  it('shows the M1 fallback message when no institutions are provided at all', () => {
    render(<InstitutionCatalog institutions={[]} />);
    expect(screen.getByText(/nu este disponibilă momentan/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npm test -- tests/components/InstitutionCatalog.test.tsx`
Expected: FAIL — `@/components/InstitutionCatalog` doesn't exist yet.

- [ ] **Step 3: Create `components/InstitutionCatalog.tsx`**

```tsx
'use client';

import { useMemo, useState } from 'react';
import { InstitutionCard } from '@/components/InstitutionCard';
import type { Institution } from '@/lib/types';

const CATEGORY_LABELS: Record<string, string> = {
  protectia_consumatorului: 'Protecția consumatorilor',
  fiscal: 'Fiscal',
  administratie_locala: 'Administrație locală',
  ordine_publica: 'Ordine publică',
  energie: 'Energie',
  telecomunicatii: 'Telecomunicații',
  sanatate: 'Sănătate',
  munca: 'Muncă',
};

const ALL_CATEGORY = 'toate';

interface InstitutionCatalogProps {
  institutions: Institution[];
}

export function InstitutionCatalog({ institutions }: InstitutionCatalogProps) {
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    for (const institution of institutions) {
      if (institution.category) {
        seen.add(institution.category);
      }
    }
    return Array.from(seen);
  }, [institutions]);

  if (institutions.length === 0) {
    return (
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Lista instituțiilor nu este disponibilă momentan. Încearcă din nou mai târziu.
      </p>
    );
  }

  const filtered = institutions.filter((institution) => {
    const matchesCategory = activeCategory === ALL_CATEGORY || institution.category === activeCategory;
    const matchesSearch = institution.name.toLowerCase().includes(searchText.trim().toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex flex-col gap-space-sm">
        <input
          type="search"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Caută o instituție după nume"
          aria-label="Caută o instituție"
          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-space-sm py-2 font-body-sm text-body-sm text-on-surface focus-visible:outline-2 focus-visible:outline-secondary"
        />
        <div className="flex flex-wrap gap-space-sm" role="group" aria-label="Filtrează după categorie">
          <button
            type="button"
            onClick={() => setActiveCategory(ALL_CATEGORY)}
            aria-pressed={activeCategory === ALL_CATEGORY}
            className="rounded-full px-space-sm py-1 font-label-md text-label-md aria-pressed:bg-secondary aria-pressed:text-on-secondary bg-surface-container-low text-on-surface-variant"
          >
            Toate
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              aria-pressed={activeCategory === category}
              className="rounded-full px-space-sm py-1 font-label-md text-label-md aria-pressed:bg-secondary aria-pressed:text-on-secondary bg-surface-container-low text-on-surface-variant"
            >
              {CATEGORY_LABELS[category] ?? category}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Nicio instituție nu corespunde căutării tale.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
          {filtered.map((institution) => (
            <InstitutionCard key={institution.code} institution={institution} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `npm test -- tests/components/InstitutionCatalog.test.tsx`
Expected: PASS, 5 tests.

- [ ] **Step 5: Update `app/institutii/page.tsx` to delegate to `InstitutionCatalog`**

```tsx
import type { Metadata } from 'next';
import { createDb } from '@/lib/db';
import { listInstitutions } from '@/lib/institutions';
import { InstitutionCatalog } from '@/components/InstitutionCatalog';

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
      <InstitutionCatalog institutions={institutions} />
    </div>
  );
}
```

- [ ] **Step 6: Run the existing `/institutii` page test to confirm it still passes unmodified**

Run: `npm test -- tests/app/institutii.test.tsx`
Expected: PASS, both existing tests (renders every institution; shows the M1 empty-state fallback) still pass with zero changes to that test file — `InstitutionCatalog`'s default (empty search, "Toate" category) renders everything, and its empty-institutions-array branch reproduces the exact same fallback text M1 built.

- [ ] **Step 7: Run the full suite and build**

Run: `npm test`
Expected: all test files pass.

Run: `npm run build`
Expected: succeeds with no type errors.

- [ ] **Step 8: Commit**

```bash
git add components/InstitutionCatalog.tsx tests/components/InstitutionCatalog.test.tsx app/institutii/page.tsx
git commit -m "feat: add search and category filtering to the institution catalog"
```

---

### Task 3: Per-institution step-by-step guide page

**Files:**
- Create: `app/institutii/[code]/page.tsx`
- Create: `tests/app/institutii-code.test.tsx`
- Modify: `components/InstitutionCard.tsx`
- Modify: `tests/components/InstitutionCard.test.tsx`

**Interfaces:**
- Consumes: `findInstitution(sql, code)` (unchanged from M1), the 5 new `Institution` fields from Task 1.
- Produces: a new route `/institutii/[code]` — Tasks in future milestones (M3+) may link into this route from a live case once one exists, but nothing in M2 depends on that yet.

- [ ] **Step 1: Write a failing test for `InstitutionCard`'s new guide link**

Add to `tests/components/InstitutionCard.test.tsx` (keep the existing test), inside the `describe('InstitutionCard', ...)` block:

```tsx
  it('links to the institution guide page', () => {
    render(<InstitutionCard institution={institution} />);
    const link = screen.getByRole('link', { name: 'Vezi ghidul complet' });
    expect(link).toHaveAttribute('href', '/institutii/anaf');
  });
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- tests/components/InstitutionCard.test.tsx`
Expected: FAIL — no "Vezi ghidul complet" link exists yet.

- [ ] **Step 3: Add the guide link to `components/InstitutionCard.tsx`**

```tsx
import Link from 'next/link';
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
        <p>
          <Link
            href={`/institutii/${institution.code.toLowerCase()}`}
            className="text-secondary underline underline-offset-2"
          >
            Vezi ghidul complet
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npm test -- tests/components/InstitutionCard.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 5: Run the full suite to confirm no regressions from the new link**

Run: `npm test`
Expected: all previously-passing tests still pass — `AnalysisResult`'s tests and `InstitutionCatalog`'s tests render `InstitutionCard` but only assert on institution-specific text/roles that remain unchanged; the new link doesn't collide with any existing query.

- [ ] **Step 6: Write failing tests for the guide page**

Create `tests/app/institutii-code.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/db', () => ({
  createDb: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/institutions', () => ({
  findInstitution: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

import InstitutionGuidePage from '@/app/institutii/[code]/page';
import { findInstitution } from '@/lib/institutions';
import type { Institution } from '@/lib/types';

const anaf: Institution = {
  id: '1',
  code: 'ANAF',
  name: 'Agenția Națională de Administrare Fiscală',
  description: null,
  category: 'fiscal',
  website_url: 'https://www.anaf.ro',
  contact_form_url: null,
  phone: '031 403 91 60',
  email: null,
  address: 'Str. Apolodor nr. 17, București',
  associated_court: null,
  iban: 'RO49AAAA1B31007593840001',
  cod_venit: '20.01.01.01',
  cui: '22222222',
  wait_time_minutes: 25,
};

describe('InstitutionGuidePage', () => {
  it('renders the institution guide with the legal deadline, steps, and documents', async () => {
    vi.mocked(findInstitution).mockResolvedValue(anaf);

    render(await InstitutionGuidePage({ params: Promise.resolve({ code: 'anaf' }) }));

    expect(screen.getByRole('heading', { name: anaf.name })).toBeInTheDocument();
    expect(screen.getByText(/Ai la dispoziție 15 zile calendaristice/)).toBeInTheDocument();
    expect(screen.getByText(/Achită taxa de timbru de 20,00 LEI către IBAN/)).toBeInTheDocument();
    expect(screen.getByText('Copie act de identitate')).toBeInTheDocument();
  });

  it('falls back to a generic payment step when IBAN/cod venit/CUI are unknown', async () => {
    vi.mocked(findInstitution).mockResolvedValue({ ...anaf, iban: null, cod_venit: null, cui: null });

    render(await InstitutionGuidePage({ params: Promise.resolve({ code: 'anaf' }) }));

    expect(screen.getByText(/detaliile de plată se obțin de la instituție/)).toBeInTheDocument();
  });

  it('calls notFound when the institution does not exist', async () => {
    vi.mocked(findInstitution).mockResolvedValue(null);

    await expect(
      InstitutionGuidePage({ params: Promise.resolve({ code: 'necunoscut' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
```

- [ ] **Step 7: Run the tests and verify they fail**

Run: `npm test -- tests/app/institutii-code.test.tsx`
Expected: FAIL — `@/app/institutii/[code]/page` doesn't exist yet.

- [ ] **Step 8: Create `app/institutii/[code]/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createDb } from '@/lib/db';
import { findInstitution } from '@/lib/institutions';

const STAMP_DUTY_AMOUNT = '20,00 LEI';
const LEGAL_DEADLINE_DAYS = 15;

const REQUIRED_DOCUMENTS = [
  'Copie act de identitate',
  'Copie procesul-verbal de contravenție',
  'Dovada plății taxei de timbru (dacă este cazul)',
];

export const dynamic = 'force-dynamic';

export async function generateMetadata(
  props: PageProps<'/institutii/[code]'>
): Promise<Metadata> {
  const { code } = await props.params;
  const sql = createDb();
  const institution = await findInstitution(sql, code);

  return {
    title: institution ? `${institution.name} — Ghid — Unde Merg?` : 'Instituție negăsită — Unde Merg?',
  };
}

export default async function InstitutionGuidePage(props: PageProps<'/institutii/[code]'>) {
  const { code } = await props.params;
  const sql = createDb();
  const institution = await findInstitution(sql, code);

  if (!institution) {
    notFound();
  }

  const resolutionPaths = [
    {
      title: 'Online',
      description: institution.contact_form_url
        ? 'Depune cererea prin formularul online al instituției.'
        : institution.website_url
          ? 'Verifică site-ul instituției pentru depunere online.'
          : 'Depunerea online nu este disponibilă pentru această instituție.',
    },
    {
      title: 'Telefon',
      description: institution.phone
        ? `Sună la ${institution.phone} pentru îndrumare.`
        : 'Numărul de telefon nu este disponibil pentru această instituție.',
    },
    {
      title: 'În persoană',
      description: institution.address
        ? `Depune cererea la sediul: ${institution.address}.`
        : 'Adresa sediului nu este disponibilă pentru această instituție.',
    },
  ];

  const steps = [
    'Completează cererea de contestație folosind modelul recomandat.',
    institution.iban && institution.cod_venit && institution.cui
      ? `Achită taxa de timbru de ${STAMP_DUTY_AMOUNT} către IBAN ${institution.iban}, Cod Venit ${institution.cod_venit}, CUI ${institution.cui}.`
      : `Achită taxa de timbru de ${STAMP_DUTY_AMOUNT} (detaliile de plată se obțin de la instituție).`,
    `Depune cererea și dovada plății la ${institution.name}, prin canalul ales mai sus.`,
    'Așteaptă răspunsul instituției în termenul legal.',
  ];

  return (
    <div className="max-w-5xl mx-auto px-margin py-space-xl flex flex-col gap-space-lg">
      <div className="flex flex-col gap-space-xs">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">{institution.name}</h1>
        {institution.associated_court && (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Instanța competentă: {institution.associated_court}
          </p>
        )}
        {typeof institution.wait_time_minutes === 'number' && (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Timp estimat de așteptare: ~{institution.wait_time_minutes} minute
          </p>
        )}
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
        <h2 className="font-title-md text-title-md text-on-surface mb-space-xs">Termen legal</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Ai la dispoziție {LEGAL_DEADLINE_DAYS} zile calendaristice de la comunicarea procesului-verbal
          pentru a depune contestația, conform O.G. nr. 2/2001.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
        {resolutionPaths.map((path) => (
          <div key={path.title} className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
            <h3 className="font-title-md text-title-md text-on-surface mb-space-xs">{path.title}</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{path.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
        <h2 className="font-title-md text-title-md text-on-surface mb-space-xs">Pașii de urmat</h2>
        <ol className="flex flex-col gap-space-sm">
          {steps.map((step, index) => (
            <li key={index} className="flex items-center gap-space-sm">
              <span className="w-6 h-6 rounded-full bg-secondary text-on-secondary text-label-sm font-label-sm flex items-center justify-center shrink-0">
                {index + 1}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
        <h2 className="font-title-md text-title-md text-on-surface mb-space-xs">Documente necesare</h2>
        <ul className="flex flex-col gap-space-xs">
          {REQUIRED_DOCUMENTS.map((doc, index) => (
            <li key={index} className="flex items-center gap-space-xs font-body-sm text-body-sm">
              <span aria-hidden="true">✓</span>
              <span>{doc}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
        <h2 className="font-title-md text-title-md text-on-surface mb-space-xs">Date de contact</h2>
        <div className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
          {institution.address && <p>{institution.address}</p>}
          {institution.phone && <p>Telefon: {institution.phone}</p>}
          {institution.email && <p>Email: {institution.email}</p>}
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
        </div>
      </div>
    </div>
  );
}
```

(`generateMetadata` and the page body both call `findInstitution` — two DB queries per request instead of one. At 8-12 seed rows this is not worth the complexity of a per-request memoization wrapper; revisit only if the institution table grows large enough for it to matter.)

- [ ] **Step 9: Run the tests and verify they pass**

Run: `npm test -- tests/app/institutii-code.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 10: Run the full suite and build**

Run: `npm test`
Expected: all test files pass.

Run: `npm run build`
Expected: succeeds with no type errors (a new dynamic route `/institutii/[code]` is emitted).

- [ ] **Step 11: Manual check (recommended, not required for automated tests to pass)**

Run `npm run dev` with real `DATABASE_URL`, visit `/institutii`, use the search box and category pills, click "Vezi ghidul complet" on a card, and confirm the guide page renders correctly for both a fully-populated institution (ANAF) and a partially-populated one (ANRE, no IBAN/court).

- [ ] **Step 12: Commit**

```bash
git add app/institutii/[code] tests/app/institutii-code.test.tsx components/InstitutionCard.tsx tests/components/InstitutionCard.test.tsx
git commit -m "feat: add the per-institution step-by-step guide page and link it from InstitutionCard"
```

---

---

### Task 4: Final fix wave — sparse real-data handling, contestable-vs-regulatory guide variants, CTA styling, search normalization, branded 404, shared step-number component

Added after the M2 final review (opus) found one Critical issue and several Important/Minor issues. See the ledger for the full report and the rulings on each finding, including one deliberate departure from the review's literal suggestion (backfilling fake phone/email/address for real institutions in the seed) in favor of a safer fix (hardening the guide page to degrade gracefully instead of fabricating unverifiable contact details attributed to real government agencies).

**Files:**
- Modify: `app/institutii/[code]/page.tsx`
- Modify: `components/InstitutionCard.tsx`
- Modify: `tests/components/InstitutionCard.test.tsx`
- Modify: `components/InstitutionCatalog.tsx`
- Modify: `tests/components/InstitutionCatalog.test.tsx`
- Modify: `tests/app/institutii-code.test.tsx`
- Create: `components/StepNumber.tsx`
- Create: `tests/components/StepNumber.test.tsx`
- Modify: `components/AnalysisResult.tsx`
- Modify: `components/AnalysisProgress.tsx`
- Modify: `components/HowItWorks.tsx`
- Create: `app/not-found.tsx`
- Create: `tests/app/not-found.test.tsx`

- [ ] **Step 1: Write a failing test for `StepNumber`**

Create `tests/components/StepNumber.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepNumber } from '@/components/StepNumber';

describe('StepNumber', () => {
  it('renders the given index', () => {
    render(<StepNumber index={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders the larger primary variant when size is lg', () => {
    render(<StepNumber index={1} size="lg" />);
    expect(screen.getByText('1')).toHaveClass('w-8', 'h-8', 'bg-primary');
  });

  it('renders the default smaller secondary variant', () => {
    render(<StepNumber index={2} />);
    expect(screen.getByText('2')).toHaveClass('w-6', 'h-6', 'bg-secondary');
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- tests/components/StepNumber.test.tsx`
Expected: FAIL — `@/components/StepNumber` doesn't exist yet.

- [ ] **Step 3: Create `components/StepNumber.tsx`**

This extracts the numbered-circle pattern that had, by this point, been copy-pasted 4 times across the codebase (`AnalysisResult`, `AnalysisProgress`, `HowItWorks`, and the guide page):

```tsx
interface StepNumberProps {
  index: number;
  size?: 'sm' | 'lg';
}

export function StepNumber({ index, size = 'sm' }: StepNumberProps) {
  if (size === 'lg') {
    return (
      <span className="w-8 h-8 rounded-full bg-primary text-on-primary font-label-md text-label-md flex items-center justify-center shrink-0">
        {index}
      </span>
    );
  }

  return (
    <span className="w-6 h-6 rounded-full bg-secondary text-on-secondary text-label-sm font-label-sm flex items-center justify-center shrink-0">
      {index}
    </span>
  );
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npm test -- tests/components/StepNumber.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 5: Use `StepNumber` in `components/AnalysisResult.tsx`**

Replace the inline numbered-circle `<span>` inside the "Pași următori" `<ol>` with `<StepNumber index={index + 1} />`, and add `import { StepNumber } from '@/components/StepNumber';` to the imports. Every other line stays the same.

- [ ] **Step 6: Use `StepNumber` in `components/AnalysisProgress.tsx`**

Replace the inline numbered-circle `<span>` with `<StepNumber index={index + 1} size="lg" />`, and add the import. Every other line stays the same.

- [ ] **Step 7: Use `StepNumber` in `components/HowItWorks.tsx`**

Replace the inline numbered-circle `<span>` with `<StepNumber index={index + 1} />`, and add the import. Every other line stays the same.

- [ ] **Step 8: Run the full suite to confirm the extraction changed nothing observable**

Run: `npm test`
Expected: all test files pass unchanged — `tests/components/AnalysisResult.test.tsx`, `tests/components/AnalysisProgress.test.tsx`, and `tests/components/HowItWorks.test.tsx` all query by text/role, never by the numbered-circle's classes, so none need edits.

- [ ] **Step 9: Rewrite `app/institutii/[code]/page.tsx` to handle sparse real data and to branch fine-contestable vs. regulatory-complaint institutions**

This step fixes three things at once (they're entangled in the same render logic): (1) **Critical** — against real seed data, 2 of 8 institutions (`PRIMARIE`, `POLITIE_LOCALA`) have no `phone`/`email`/`address`/`website_url`/`contact_form_url` at all, so the old code rendered 3 side-by-side "not available" resolution-path cards, an empty "Date de contact" card, and a step 3 that told the citizen to use "the channel chosen above" when none existed; (2) the page applied fine-contestation framing (15-day deadline, stamp duty, PV documents) to all 8 institutions including the 4 that are regulators, not fine-issuers (`ANRE`, `ANCOM`, `CNAS`, `ITM`), for whom that framing is simply wrong; (3) adds a `description` to `generateMetadata` (every other page in the app has one; this route didn't).

Replace the entire file:

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createDb } from '@/lib/db';
import { findInstitution } from '@/lib/institutions';
import { StepNumber } from '@/components/StepNumber';

const STAMP_DUTY_AMOUNT = '20,00 LEI';
const LEGAL_DEADLINE_DAYS = 15;

const CONTESTATION_DOCUMENTS = [
  'Copie act de identitate',
  'Copie procesul-verbal de contravenție',
  'Dovada plății taxei de timbru (dacă este cazul)',
];

const COMPLAINT_DOCUMENTS = [
  'Copie act de identitate',
  'Orice document care susține sesizarea (facturi, corespondență, fotografii etc.)',
];

export const dynamic = 'force-dynamic';

export async function generateMetadata(
  props: PageProps<'/institutii/[code]'>
): Promise<Metadata> {
  const { code } = await props.params;
  const sql = createDb();
  const institution = await findInstitution(sql, code);

  if (!institution) {
    return { title: 'Instituție negăsită — Unde Merg?' };
  }

  return {
    title: `${institution.name} — Ghid — Unde Merg?`,
    description: `Ghid pas cu pas pentru ${institution.name}: termen legal, pași și documente necesare.`,
  };
}

export default async function InstitutionGuidePage(props: PageProps<'/institutii/[code]'>) {
  const { code } = await props.params;
  const sql = createDb();
  const institution = await findInstitution(sql, code);

  if (!institution) {
    notFound();
  }

  const isContestable = Boolean(institution.iban || institution.associated_court);

  const resolutionPaths = [
    institution.contact_form_url
      ? { title: 'Online', description: 'Depune cererea prin formularul online al instituției.' }
      : institution.website_url
        ? { title: 'Online', description: 'Verifică site-ul instituției pentru depunere online.' }
        : null,
    institution.phone
      ? { title: 'Telefon', description: `Sună la ${institution.phone} pentru îndrumare.` }
      : null,
    institution.address
      ? { title: 'În persoană', description: `Depune cererea la sediul: ${institution.address}.` }
      : null,
  ].filter((path): path is { title: string; description: string } => path !== null);

  const hasResolutionPath = resolutionPaths.length > 0;

  const steps = isContestable
    ? [
        'Completează cererea de contestație folosind modelul recomandat.',
        institution.iban && institution.cod_venit && institution.cui
          ? `Achită taxa de timbru de ${STAMP_DUTY_AMOUNT} către IBAN ${institution.iban}, Cod Venit ${institution.cod_venit}, CUI ${institution.cui}.`
          : `Achită taxa de timbru de ${STAMP_DUTY_AMOUNT} (detaliile de plată se obțin de la instituție).`,
        hasResolutionPath
          ? `Depune cererea și dovada plății la ${institution.name}, prin canalul ales mai sus.`
          : `Depune cererea și dovada plății la ${institution.name} — verifică site-ul oficial sau contactează primăria/poliția locală din zona ta pentru canalul de depunere.`,
        'Așteaptă răspunsul instituției în termenul legal.',
      ]
    : [
        'Completează o sesizare sau cerere către instituție, descriind clar problema.',
        hasResolutionPath
          ? 'Trimite sesizarea prin canalul ales mai sus.'
          : `Trimite sesizarea către ${institution.name} — verifică site-ul oficial pentru datele de contact.`,
        'Așteaptă răspunsul instituției.',
      ];

  const requiredDocuments = isContestable ? CONTESTATION_DOCUMENTS : COMPLAINT_DOCUMENTS;

  return (
    <div className="max-w-5xl mx-auto px-margin py-space-xl flex flex-col gap-space-lg">
      <div className="flex flex-col gap-space-xs">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">{institution.name}</h1>
        {institution.associated_court && (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Instanța competentă: {institution.associated_court}
          </p>
        )}
        {typeof institution.wait_time_minutes === 'number' && (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Timp estimat de așteptare: ~{institution.wait_time_minutes} minute
          </p>
        )}
      </div>

      {isContestable && (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
          <h2 className="font-title-md text-title-md text-on-surface mb-space-xs">Termen legal</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Ai la dispoziție {LEGAL_DEADLINE_DAYS} zile calendaristice de la comunicarea procesului-verbal
            pentru a depune contestația, conform O.G. nr. 2/2001. Cuantumul taxei de timbru poate varia —
            verifică suma actuală direct cu instituția înainte de plată.
          </p>
        </div>
      )}

      {hasResolutionPath ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
          {resolutionPaths.map((path) => (
            <div key={path.title} className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
              <h3 className="font-title-md text-title-md text-on-surface mb-space-xs">{path.title}</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{path.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
          <h3 className="font-title-md text-title-md text-on-surface mb-space-xs">Contact</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {institution.description ??
              'Datele de contact pentru această instituție nu sunt disponibile momentan în platforma noastră.'}
          </p>
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
        <h2 className="font-title-md text-title-md text-on-surface mb-space-xs">Pașii de urmat</h2>
        <ol className="flex flex-col gap-space-sm">
          {steps.map((step, index) => (
            <li key={index} className="flex items-center gap-space-sm">
              <StepNumber index={index + 1} />
              <span className="font-body-sm text-body-sm text-on-surface">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
        <h2 className="font-title-md text-title-md text-on-surface mb-space-xs">Documente necesare</h2>
        <ul className="flex flex-col gap-space-xs">
          {requiredDocuments.map((doc, index) => (
            <li key={index} className="flex items-center gap-space-xs font-body-sm text-body-sm">
              <span aria-hidden="true">✓</span>
              <span>{doc}</span>
            </li>
          ))}
        </ul>
      </div>

      {(institution.address || institution.phone || institution.email || institution.website_url) && (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
          <h2 className="font-title-md text-title-md text-on-surface mb-space-xs">Date de contact</h2>
          <div className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
            {institution.address && <p>{institution.address}</p>}
            {institution.phone && <p>Telefon: {institution.phone}</p>}
            {institution.email && <p>Email: {institution.email}</p>}
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
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 10: Update `tests/app/institutii-code.test.tsx` to cover the sparse-data and regulatory-variant branches**

Keep the 3 existing tests (they exercise the enriched-ANAF happy path, the null-payment-fields fallback, and `notFound()` — all still valid). Add these 2 new tests, using fixtures shaped like the *actual* seed data rather than the enriched test fixture (this is exactly the gap that let the Critical finding through task review — a fixture richer than any real row):

```tsx
  it('shows a single contact fallback instead of three unavailable paths when no channel exists', async () => {
    vi.mocked(findInstitution).mockResolvedValue({
      id: '3',
      code: 'PRIMARIE',
      name: 'Primăria (generică, locală)',
      description: 'Sesizări și amenzi la nivel local; site-ul variază în funcție de localitate.',
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
    });

    render(await InstitutionGuidePage({ params: Promise.resolve({ code: 'primarie' }) }));

    expect(screen.getByText('Sesizări și amenzi la nivel local; site-ul variază în funcție de localitate.')).toBeInTheDocument();
    expect(screen.queryByText('Depunerea online nu este disponibilă pentru această instituție.')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Date de contact' })).not.toBeInTheDocument();
  });

  it('shows the shorter complaint variant for a non-contestable regulatory institution', async () => {
    vi.mocked(findInstitution).mockResolvedValue({
      id: '5',
      code: 'ANRE',
      name: 'Autoritatea Națională de Reglementare în Domeniul Energiei',
      description: 'Reglementează piața de energie electrică și gaze naturale.',
      category: 'energie',
      website_url: 'https://www.anre.ro',
      contact_form_url: null,
      phone: null,
      email: null,
      address: null,
      associated_court: null,
      iban: null,
      cod_venit: null,
      cui: null,
      wait_time_minutes: 10,
    });

    render(await InstitutionGuidePage({ params: Promise.resolve({ code: 'anre' }), searchParams: Promise.resolve({}) }));

    expect(screen.queryByRole('heading', { name: 'Termen legal' })).not.toBeInTheDocument();
    expect(screen.getByText(/Completează o sesizare sau cerere/)).toBeInTheDocument();
    expect(screen.getByText('Orice document care susține sesizarea (facturi, corespondență, fotografii etc.)')).toBeInTheDocument();
  });
```

Also add `searchParams: Promise.resolve({})` to the 3 existing test call sites if not already present (Task 3 already added this; confirm it's still there).

- [ ] **Step 11: Run the tests and verify the 2 new cases fail, then pass after Step 9's rewrite**

Run: `npm test -- tests/app/institutii-code.test.tsx`
Expected: with Step 9 already applied (it comes first in this task), all 5 tests PASS immediately. If any fail, re-check Step 9's conditionals against the exact fixture shapes above.

- [ ] **Step 12: Promote `InstitutionCard`'s guide link to a visually distinct CTA, and harden the URL**

The website link and the "Vezi ghidul complet" link currently share the identical `text-secondary underline underline-offset-2` styling, making it unclear which is the in-app primary action and which leaves the site. Add a failing test first — update `tests/components/InstitutionCard.test.tsx`'s existing "links to the institution guide page" test (keep its assertion, it still holds) and add one more:

```tsx
  it('styles the guide link as a distinct call-to-action, not a plain text link', () => {
    render(<InstitutionCard institution={institution} />);
    const link = screen.getByRole('link', { name: 'Vezi ghidul complet' });
    expect(link.className).not.toContain('underline');
  });
```

- [ ] **Step 13: Run the test and verify it fails**

Run: `npm test -- tests/components/InstitutionCard.test.tsx`
Expected: FAIL — the guide link currently has `underline` in its class list.

- [ ] **Step 14: Update `components/InstitutionCard.tsx`**

```tsx
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
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
      <CardContent className="flex flex-col gap-space-sm font-body-sm text-body-sm text-on-surface-variant">
        {institution.description && <p>{institution.description}</p>}
        {institution.website_url && (
          <p>
            <a
              href={institution.website_url}
              target="_blank"
              rel="noreferrer"
              className="text-secondary underline underline-offset-2"
            >
              {institution.website_url} <span aria-hidden="true">↗</span>
            </a>
          </p>
        )}
        {institution.phone && <p>Telefon: {institution.phone}</p>}
        {institution.email && <p>Email: {institution.email}</p>}
        <Link
          href={`/institutii/${encodeURIComponent(institution.code.toLowerCase())}`}
          className={buttonVariants({ variant: 'outline', size: 'sm', className: 'self-start' })}
        >
          Vezi ghidul complet
        </Link>
      </CardContent>
    </Card>
  );
}
```

(`buttonVariants` is already exported from `components/ui/button.tsx` — this reuses the exact button visual language, distinct from the plain underlined website link, without needing to work through Base UI's polymorphic `render`-prop API.)

- [ ] **Step 15: Run the tests and verify they pass**

Run: `npm test -- tests/components/InstitutionCard.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 16: Run the full suite to confirm no regressions in `AnalysisResult`/`InstitutionCatalog`, which both render `InstitutionCard`**

Run: `npm test`
Expected: all test files pass — neither `tests/components/AnalysisResult.test.tsx` nor `tests/components/InstitutionCatalog.test.tsx` assert on `InstitutionCard`'s internal link styling, only on institution-specific text.

- [ ] **Step 17: Write failing tests for diacritic-insensitive, wider catalog search**

Add to `tests/components/InstitutionCatalog.test.tsx`, inside the existing `describe('InstitutionCatalog', ...)` block:

```tsx
  it('matches search text typed without diacritics', async () => {
    const user = userEvent.setup();
    render(<InstitutionCatalog institutions={[anaf, anpc]} />);

    await user.type(screen.getByLabelText('Caută o instituție'), 'protectia');

    expect(screen.getByText(anpc.name)).toBeInTheDocument();
    expect(screen.queryByText(anaf.name)).not.toBeInTheDocument();
  });

  it('matches search text against the institution code (acronym)', async () => {
    const user = userEvent.setup();
    render(<InstitutionCatalog institutions={[anaf, anpc]} />);

    await user.type(screen.getByLabelText('Caută o instituție'), 'anaf');

    expect(screen.getByText(anaf.name)).toBeInTheDocument();
    expect(screen.queryByText(anpc.name)).not.toBeInTheDocument();
  });
```

- [ ] **Step 18: Run the tests and verify they fail**

Run: `npm test -- tests/components/InstitutionCatalog.test.tsx`
Expected: FAIL — the current search only checks `institution.name` with plain (non-normalized) lowercasing, so "protectia" (no diacritic) doesn't match "Protecția..." and "anaf" doesn't match against `code` at all.

- [ ] **Step 19: Update `components/InstitutionCatalog.tsx`'s filter logic**

Add a `normalize` helper and widen the search haystack:

```typescript
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}
```

Replace the `filtered` computation's `matchesSearch` line with:

```typescript
    const haystack = normalize(
      [institution.name, institution.code, institution.description ?? ''].join(' ')
    );
    const matchesSearch = haystack.includes(normalize(searchText.trim()));
```

- [ ] **Step 20: Run the tests and verify they pass**

Run: `npm test -- tests/components/InstitutionCatalog.test.tsx`
Expected: PASS, 7 tests (5 existing + 2 new).

- [ ] **Step 21: Write a failing test for a branded 404 page**

Create `tests/app/not-found.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotFound from '@/app/not-found';

describe('NotFound', () => {
  it('renders a Romanian message and a link back into the app', () => {
    render(<NotFound />);
    expect(screen.getByRole('heading', { name: 'Pagina nu a fost găsită' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Vezi lista instituțiilor' })).toHaveAttribute(
      'href',
      '/institutii'
    );
  });
});
```

- [ ] **Step 22: Run the test and verify it fails**

Run: `npm test -- tests/app/not-found.test.tsx`
Expected: FAIL — `@/app/not-found` doesn't exist yet.

- [ ] **Step 23: Create `app/not-found.tsx`**

```tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-margin py-space-xl flex flex-col items-center text-center gap-space-md">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">Pagina nu a fost găsită</h1>
      <p className="font-body-lg text-body-lg text-on-surface-variant">
        Ne pare rău, pagina pe care o cauți nu există sau a fost mutată.
      </p>
      <Link href="/institutii" className="text-secondary underline underline-offset-2">
        Vezi lista instituțiilor
      </Link>
    </div>
  );
}
```

- [ ] **Step 24: Run the test and verify it passes**

Run: `npm test -- tests/app/not-found.test.tsx`
Expected: PASS, 1 test.

- [ ] **Step 25: Run the full suite and build**

Run: `npm test`
Expected: all test files pass.

Run: `npm run build`
Expected: succeeds with no type errors; the route table now also includes `app/not-found.tsx`'s effect on the default `/_not-found` route (Next uses this file automatically, no new route entry is expected beyond what already exists).

- [ ] **Step 26: Manual check (recommended, not required)**

Run `npm run dev` with a real `DATABASE_URL`, visit `/institutii/primarie` and `/institutii/anre` and confirm the sparse-data and regulatory-variant branches render sensibly (no empty cards, no self-contradictory step text), and visit a nonexistent path to confirm the new branded 404 renders.

- [ ] **Step 27: Commit**

```bash
git add app/institutii/[code]/page.tsx components/InstitutionCard.tsx tests/components/InstitutionCard.test.tsx components/InstitutionCatalog.tsx tests/components/InstitutionCatalog.test.tsx tests/app/institutii-code.test.tsx components/StepNumber.tsx tests/components/StepNumber.test.tsx components/AnalysisResult.tsx components/AnalysisProgress.tsx components/HowItWorks.tsx app/not-found.tsx tests/app/not-found.test.tsx
git commit -m "fix: handle sparse institution data gracefully, branch contestable-vs-regulatory guide content, style the guide CTA, normalize catalog search, and add a branded 404"
```

---

## Self-review notes

- Spec coverage: catalog screen #4 (manual institution search/browse) → Task 2; catalog screen #5 (step-by-step guidance: legal deadline, resolution paths, payment amount, downloadable docs) → Task 3, scoped down to informational/generic content per the roadmap's explicit M2/M3 split (no live case, no real document generation — those need M3's case/petitioner/PV model). Pagination (also mentioned in screen #4) is explicitly descoped per Global Constraints given the tiny dataset.
- Type consistency checked: `Institution` gains 5 fields via `InstitutionSchema` in Task 1; Tasks 2 and 3 both import `type { Institution }` and reference only fields that already exist after Task 1. `InstitutionCard`'s prop shape (`{ institution: Institution }`) is unchanged across Tasks 2-3, so `InstitutionCatalog` (Task 2) and `AnalysisResult` (unmodified, from M1) keep working with it without changes. `PageProps<'/institutii/[code]'>` matches this codebase's existing `LayoutProps<"/">` convention (`app/layout.tsx`).
- Placeholder scan: no "TBD"/"add appropriate styling" found; every step has runnable code or an exact command.
- Pre-flight conflict scan: Task 1 → Task 3 (new institution fields consumed) — consistent, no interface mismatch. Task 2 and Task 3 both touch `InstitutionCard`'s call sites but only Task 3 modifies `InstitutionCard.tsx` itself (adding the guide link); Task 2 only consumes the unchanged prop shape — sequential, non-conflicting. No task mandates a review-rubric defect (no empty assertions, no verbatim-duplicated logic blocks).
