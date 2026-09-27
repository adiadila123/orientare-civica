# Unde Merg?

Aplicație civică în limba română: cetățeanul descrie o problemă în text liber, Gemini o clasifică, iar aplicația afișează instituția publică potrivită, documentele necesare și pașii următori.

Stack: Next.js (App Router, TypeScript), Tailwind CSS, shadcn/ui, Zod, Gemini (`@google/generative-ai`), Supabase (`@supabase/supabase-js` + `@supabase/ssr`), Vitest + Testing Library.

## Configurare

### 1. Variabile de mediu

Creează un fișier `.env.local` în rădăcina proiectului cu:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-key
```

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` și `SUPABASE_SERVICE_ROLE_KEY` se obțin din proiectul tău Supabase, la **Project Settings → API**. `SUPABASE_SERVICE_ROLE_KEY` este secretă — nu o expune niciodată în client.
- `GEMINI_API_KEY` se obține din [Google AI Studio](https://aistudio.google.com/apikey).

### 2. Baza de date

În proiectul Supabase, deschide **SQL Editor** și rulează, în ordine:

1. `supabase/migrations/0001_init.sql` — creează tabelele și politicile de Row Level Security.
2. `supabase/seed.sql` — populează instituțiile publice de bază (ANPC, ANAF, primărie, poliția locală, ANRE, ANCOM, CNAS, ITM).

### 3. Instalare și rulare

```bash
npm install
npm test
npm run build
npm run dev
```

Aplicația pornește la [http://localhost:3000](http://localhost:3000).
