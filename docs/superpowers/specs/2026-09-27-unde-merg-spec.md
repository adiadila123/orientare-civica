# Unde Merg — Spec (as provided by user, 2026-09-27)

> Pasted verbatim from the user. This is the source spec; the implementation
> plan at `docs/superpowers/plans/2026-09-27-unde-merg-mvp.md` argues from it.

## Faza 1: Setup și fundația (Săptămâna 1)

Scop: Pregătești toate conturile și scheletul aplicației.

| Pas | Acțiune | Tool gratuit |
|---|---|---|
| 1.1 | Creează cont pe GitHub | GitHub |
| 1.2 | Creează cont pe Vercel (hosting) | Vercel (100GB bandwidth gratuit) |
| 1.3 | Creează cont pe Supabase (bază de date + auth) | Supabase (500MB DB, 50K utilizatori activi lunari) |
| 1.4 | Obține cheie API Gemini | Google AI Studio (free tier, fără card) |
| 1.5 | Inițializează proiect Next.js cu Tailwind + shadcn/ui | Terminal local |
| 1.6 | Conectează proiectul la Vercel și Supabase | Documentație oficială |

Comandă de start:

```bash
npx create-next-app@latest unde-merg --typescript --tailwind --app
cd unde-merg
npx shadcn@latest init
npm install @supabase/supabase-js @supabase/ssr
```

## Faza 2: Modelarea datelor (Săptămâna 1-2)

Scop: Definești structura bazei de date pentru a stoca instituțiile, categoriile de probleme și cazurile utilizatorilor.

Schema bazei de date (Supabase/PostgreSQL):

```sql
-- Instituții (ANPC, ANAF, primării, etc.)
CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'protectia_consumatorului', 'fiscal', 'administratie_locala'
  website_url TEXT,
  contact_form_url TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Categorii de probleme (predefinite)
CREATE TABLE problem_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- 'Amenzi', 'Facturi', 'ANAF', etc.
  description TEXT,
  keywords TEXT[], -- pentru matching rapid
  institution_id UUID REFERENCES institutions(id)
);

-- Cazurile utilizatorilor (opțional, pentru urmărire)
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_description TEXT NOT NULL,
  ai_analysis JSONB, -- rezultatul complet de la Gemini
  recommended_institution_id UUID REFERENCES institutions(id),
  status TEXT DEFAULT 'new', -- 'new', 'in_progress', 'resolved'
  created_at TIMESTAMPTZ DEFAULT now(),
  session_id TEXT -- pentru utilizatori fără cont
);
```

Popularea inițială: Începe cu 10-15 instituții esențiale: ANPC, ANAF,
Primăria (generic), Poliția Locală, ANRE, ANCOM, CNAS, Inspectoratul
Teritorial de Muncă.

## Faza 3: Integrarea AI (Săptămâna 2-3)

Scop: Construiești inima aplicației – motorul de triaj bazat pe Gemini.

Arhitectura fluxului:

```text
Utilizator descrie problema (text liber)
        ↓
Next.js API Route /api/triage
        ↓
Gemini 2.5 Flash (clasificare + extragere entități)
        ↓
Validare JSON schema (Zod)
        ↓
Aplicare reguli business (matching cu instituții)
        ↓
Returnare rezultat structurat către frontend
```

Prompt-ul pentru Gemini (sistem):

```text
Ești un asistent specializat în direcționarea cetățenilor români către instituțiile publice corecte.

Utilizatorul va descrie o problemă în limbaj natural. Analizează textul și returnează un JSON cu următoarea structură:

{
  "primary_intent": "contestatie_amenda | reclamatie_anpc | problema_anaf | sesizare_primarie | factura_utilitati | alta",
  "urgency": "low | normal | high",
  "institution_type": "ANPC | ANAF | primarie | politie_locala | ANRE | ANCOM | CNAS | ITM | alta",
  "required_documents": ["document1", "document2"],
  "recommended_channel": "online | telefon | fizic",
  "next_steps": ["pas1", "pas2", "pas3"],
  "explanation": "Explicație scurtă în limbaj simplu pentru utilizator",
  "confidence": 0.0
}

Fii precis. Dacă nu ești sigur, setează confidence sub 0.7 și recomandă verificarea manuală.
```

Exemplu de cod pentru API Route:

```typescript
// app/api/triage/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const TriageSchema = z.object({
  primary_intent: z.string(),
  urgency: z.enum(['low', 'normal', 'high']),
  institution_type: z.string(),
  required_documents: z.array(z.string()),
  recommended_channel: z.enum(['online', 'telefon', 'fizic']),
  next_steps: z.array(z.string()),
  explanation: z.string(),
  confidence: z.number().min(0).max(1),
});

export async function POST(req: Request) {
  const { description } = await req.json();

  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    { text: `Problema utilizatorului: ${description}` },
  ]);

  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid JSON from Gemini');

  const parsed = TriageSchema.parse(JSON.parse(jsonMatch[0]));

  // Aplică reguli business: match cu instituția reală din DB
  const institution = await findInstitution(parsed.institution_type);

  return Response.json({ ...parsed, institution });
}
```

Important: Free tier-ul Gemini oferă acces la modele Flash fără costuri,
cu limite generoase pentru un MVP.

## Faza 4: Construirea interfeței (Săptămâna 3-4)

Componente principale: ProblemInput (textarea + chips categorii rapide),
AnalysisResult (card cu instituția, documentele, pașii), InstitutionCard,
TrustBadges, Footer.

Tehnologii frontend: Next.js 15+ (App Router, Server Components), Tailwind
CSS, shadcn/ui, Lucide Icons, Framer Motion (opțional).

Accesibilitate (obligatoriu pentru 2027): componente shadcn/ui accesibile
by default, contrast minim 4.5:1, focus states vizibile, ARIA labels,
navigare completă cu tastatura.

## Faza 5: Popularea bazei de date (Săptămâna 4)

Surse: ANPC (formular online), ANAF (formular + SPV), Primării (unele au
API-uri publice, ex. Primăria Arad), portaluri de date deschise.

Format pentru fiecare instituție:

```json
{
  "name": "ANPC - Autoritatea Națională pentru Protecția Consumatorilor",
  "category": "protectia_consumatorului",
  "website_url": "https://anpc.ro",
  "contact_form_url": "https://anpc.ro/formular-sesizare",
  "phone": "0219551",
  "description": "Instituția responsabilă pentru protecția drepturilor consumatorilor."
}
```

## Faza 6: Testare și lansare (Săptămâna 4-5)

Checklist: funcțional (flux complet), accesibilitate (NVDA/VoiceOver,
tastatură, contrast), performanță (Lighthouse > 90), erori (cazuri
limită), mobile (responsive).

Lansare: deploy pe Vercel (conectat la GitHub), domeniu gratuit
`unde-merg.vercel.app`, submit la Google Search Console, postare în
comunități relevante.

## Faza 7: Monitorizare și iterare (Continuu)

Metrici: număr de analize, rata de confidence > 0.8, feedback utilizatori
("A fost util?"), instituții cele mai solicitate.

Iterații planificate: instituții noi, prompt Gemini îmbunătățit, salvare
cazuri (autentificare), integrare Open311.

## Rezumatul stack-ului gratuit

| Componentă | Tool | Limită gratuită |
|---|---|---|
| Frontend | Next.js + Tailwind + shadcn/ui | Open source |
| Hosting | Vercel | 100GB bandwidth/lună |
| Bază de date | Supabase | 500MB, 50K utilizatori activi |
| AI | Gemini 2.5 Flash | Free tier, fără card |
| Autentificare | Supabase Auth | Inclus în planul gratuit |
| Email | Resend | 3000 emailuri/lună |
| Design | Google Stitch | Gratuit în beta |
