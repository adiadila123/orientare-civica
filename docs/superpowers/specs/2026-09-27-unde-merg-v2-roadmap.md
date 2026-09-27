# Unde Merg v2 — Roadmap (Neon + Groq + Stitch design)

> Supersedes the v1 MVP's stack (Supabase + Gemini + plain shadcn/ui), which
> remains shipped and working on `main`. This roadmap covers the pivot to
> the full "Unde merg? – Orientare Civică" product per:
> - `docs/superpowers/specs/2026-09-27-unde-merg-spec.md` (v1 spec, superseded)
> - `unde_merg_public_guide/prd_project_brief_unde_merg_orientare_civic.md` (PRD)
> - `unde_merg_public_guide/civic_direction_clarity/DESIGN.md` (design system)
> - `.superpowers/sdd/2026-09-27-unde-merg-mvp/stitch-screen-catalog.md` (full 32-screen catalog — the primary reference for every milestone plan below; read it before writing or executing any milestone plan)
> - The user's updated stack plan (Neon + Groq), pasted 2026-09-27

## Decisions made

- **Stack:** Neon (serverless Postgres, `@neondatabase/serverless`) replaces Supabase. Groq (`groq-sdk`, model `openai/gpt-oss-120b`, `response_format: { type: 'json_object' }`) replaces Gemini. Zod validation, Next.js App Router, Tailwind, shadcn/ui primitives stay.
- **Design:** the Stitch "Civic Direction & Clarity" design system and screens replace the plain shadcn/ui page from v1. Build real Next.js components from the exported Tailwind/HTML markup, not iframe/embed the static exports.
- **Ruling — e-Grefă and Ghișeul.ro/SNEP are simulated, not live-integrated.** The Stitch prototypes themselves implement these as fake JS (`simulatePayment()` with a `setTimeout`, no real Ghișeul.ro SNEP call; the e-Grefă filing confirmation is a static success screen with no real Ministerul Justiției API call). Real integration with e-Grefă/e-Just and Ghișeul.ro/SNEP requires formal institutional partnership/certification that is out of reach for this project — and the PRD's own roadmap lists "Milestone 2: plată integrată taxă de timbru via API Ghișeul.ro" as still "În plan" (not yet done), confirming even the product vision doesn't assume live integration is done today. Build these flows to look and behave exactly like the prototypes (realistic simulated success/failure states, real document/receipt generation client-side), so the UX is fully real and the swap to a genuine institutional API later is a backend-only change behind the same interface. Say so plainly in the UI copy is NOT required (the prototype doesn't disclose this to the citizen either) but the codebase must make the simulation boundary obvious (e.g. a single `lib/payments/ghiseul.ts` / `lib/filing/e-grefa.ts` module per integration, clearly named, easy to swap).
- **Data normalization** (the catalog's "Cross-screen data inconsistencies" section lists 6 issues to fix once, not carry forward): one canonical example petitioner for docs/demos, one canonical helpline number (`0800 008 123`), one canonical recipisa number format (pick one of `#REG-JUST-2026-77392-B3` or without the suffix and use it everywhere), and a single connection-status component driven by real state (never a hardcoded "Mod Offline Activ" banner on an online screen).
- **Milestones are built and planned one at a time**, each as its own bite-sized TDD plan under `docs/superpowers/plans/`, executed via subagent-driven-development before the next milestone is planned in full code-level detail. This roadmap fixes the sequence and scope of each; only the milestone actively being planned gets the full "no placeholders, real code per step" treatment.

## Milestone sequence

**M1 — Stack swap + Flow A reskin** *(next; full plan being written now)*
Replace Supabase→Neon and Gemini→Groq in the existing triage backend; rebuild the home screen (catalog screens #1, #2, #3: initial state, too-short validation, analysis-in-progress loading) with the real Stitch markup/design tokens, keeping the same triage logic (describe problem → institution + steps + documents). Ships a fully working, visually-real v2 of what v1 already does.

**M2 — Manual institution catalog + step-by-step guide (Flow A tail + Flow B)**
Catalog screens #4 (manual institution search/browse) and #5 (step-by-step guidance: legal deadline, resolution paths, payment amount, downloadable docs). Requires expanding the institution data model (internal codes, associated court, IBAN/Cod Venit/CUI for fee payments, simulated wait-time).

**M3 — Contestation document generation + edit/error flows (Flow B tail + Flow C)**
Catalog screens #6 (A4 legal document preview), #7 (edit modal/bottom-sheet: Petent/PV/Motive/Anexe), #8 (CNP validation error), #9 (network error with local JSON backup), #11 (save success). Introduces the `cases`/petitioner/PV data model, CNP checksum validation, and the `<LegalDocumentPreview>` templated-document component.

**M4 — Offline mode + cloud sync (Flow D)**
Catalog screens #10 (AI-triage timeout, actually Flow A but grouped here since it shares error-handling infra with offline), #12 (full offline editing, IndexedDB, local PDF export), #13 (sync success, conflict reconciliation, REV-N versioning). This is the PWA/service-worker milestone — largest infra lift.

**M5 — Payment (simulated) + e-Grefă filing (simulated) (Flow E)**
Catalog screens #14 (Ghișeul.ro payment UI, simulated), #15 (payment confirmation/receipt, simulated), #16 (e-Grefă filing confirmation, simulated). Per the ruling above, these are realistic simulations behind swappable integration modules, not real government API calls.

Each milestone plan will re-read the relevant catalog sections (already written) rather than re-deriving them, and will call out its own Global Constraints, file structure, and bite-sized TDD tasks the same way the v1 MVP plan did.

## What does NOT change from v1

The existing 8-task MVP (`docs/superpowers/plans/2026-09-27-unde-merg-mvp.md`) stays on `main`, fully working, as the fallback/reference implementation until M1 replaces its backend and UI. Nothing about it needs to be reverted or undone — M1 modifies/replaces its files in place.
