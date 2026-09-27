# Unde Merg?

Aplicație civică în limba română: cetățeanul descrie o problemă în text liber, Groq o clasifică, iar aplicația afișează instituția publică potrivită, documentele necesare și pașii următori.

Stack: Next.js (App Router, TypeScript), Tailwind CSS, shadcn/ui, Zod, Groq (`groq-sdk`), Neon (`@neondatabase/serverless`), Vitest + Testing Library.

## Configurare

### 1. Variabile de mediu

Creează un fișier `.env.local` în rădăcina proiectului cu:

```bash
DATABASE_URL=your-neon-connection-string
GROQ_API_KEY=your-groq-key
```

- `DATABASE_URL` — șirul de conectare PostgreSQL de la Neon Console → Connection Details. Formatul: `postgresql://user:password@host/dbname`
- `GROQ_API_KEY` — se obține din [console.groq.com/keys](https://console.groq.com/keys).

### 2. Baza de date

În Neon Console, deschide **SQL Editor** pentru baza de date și rulează, în ordine:

1. `db/migrations/0001_init.sql` — creează tabelele.
2. `db/seed.sql` — populează instituțiile publice de bază (ANPC, ANAF, primărie, poliția locală, ANRE, ANCOM, CNAS, ITM).

### 3. Instalare și rulare

```bash
npm install
npm test
npm run build
npm run dev
```

Aplicația pornește la [http://localhost:3000](http://localhost:3000).
