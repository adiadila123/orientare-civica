import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politica de confidențialitate — Unde Merg?',
  description: 'Cum sunt colectate, folosite și protejate datele tale pe Unde Merg? – Orientare Civică.',
  alternates: { canonical: '/confidentialitate' },
};

export default function ConfidentialitatePage() {
  return (
    <div className="max-w-3xl mx-auto px-margin py-space-xl flex flex-col gap-space-lg">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">Politica de confidențialitate</h1>

      <div className="bg-error-container rounded-xl p-space-lg">
        <p className="font-body-sm text-body-sm text-on-error-container">
          Această pagină descrie exact datele pe care aplicația le colectează în prezent, dar nu a
          fost verificată de un avocat specializat în protecția datelor. Înainte de utilizare reală
          de către cetățeni — mai ales pentru funcția de generare a contestației, care implică CNP-ul
          tău — recomandăm o verificare juridică formală și completarea datelor de contact ale
          operatorului mai jos.
        </p>
      </div>

      <section className="flex flex-col gap-space-xs">
        <h2 className="font-title-md text-title-md text-on-surface">1. Operatorul de date</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Operatorul serviciului Unde merg? – Orientare Civică este [de completat: nume/entitate și
          date de contact]. Pentru orice întrebare legată de datele tale, ne poți scrie la [de
          completat: adresă de e-mail de contact].
        </p>
      </section>

      <section className="flex flex-col gap-space-xs">
        <h2 className="font-title-md text-title-md text-on-surface">2. Ce date colectăm</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Când descrii o problemă, colectăm textul descrierii pe care îl introduci. Dacă alegi să
          generezi o contestație pentru o instituție, colectăm suplimentar: nume și prenume, CNP,
          adresă, opțional email și telefon, precum și datele procesului-verbal (serie, număr, dată,
          sumă, agent emitent) și motivele contestației pe care le introduci.
        </p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Nu folosim cookie-uri sau tehnologii de urmărire — vezi{' '}
          <a href="/politica-cookie-uri" className="text-secondary underline underline-offset-2">
            politica de cookie-uri
          </a>
          .
        </p>
      </section>

      <section className="flex flex-col gap-space-xs">
        <h2 className="font-title-md text-title-md text-on-surface">3. Scopul prelucrării</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Folosim descrierea problemei tale pentru a identifica, printr-un model de inteligență
          artificială, instituția publică potrivită și pașii necesari. Dacă alegi să generezi o
          contestație, folosim datele de petent și de proces-verbal exclusiv pentru a completa
          documentul pe care îl poți descărca sau edita.
        </p>
      </section>

      <section className="flex flex-col gap-space-xs">
        <h2 className="font-title-md text-title-md text-on-surface">4. Temeiul legal</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Prelucrăm descrierea problemei tale în baza consimțământului acordat prin folosirea
          serviciului (art. 6 alin. (1) lit. a din Regulamentul (UE) 2016/679 — GDPR). Datele de
          petent și de proces-verbal sunt prelucrate în baza cererii tale exprese, la momentul
          generării contestației (art. 6 alin. (1) lit. b GDPR).
        </p>
      </section>

      <section className="flex flex-col gap-space-xs">
        <h2 className="font-title-md text-title-md text-on-surface">5. Cui transmitem datele</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Descrierea problemei este transmisă către Groq, furnizorul modelului de inteligență
          artificială folosit pentru analiză — acest furnizor poate procesa datele în afara Spațiului
          Economic European. Datele salvate (inclusiv, dacă e cazul, cele de petent) sunt stocate
          într-o bază de date găzduită de Neon. Nu vindem și nu distribuim datele tale în alte scopuri.
        </p>
      </section>

      <section className="flex flex-col gap-space-xs">
        <h2 className="font-title-md text-title-md text-on-surface">6. Perioada de stocare</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          În prezent, aplicația nu are implementat un mecanism automat de ștergere a datelor după o
          perioadă fixă. Poți solicita oricând ștergerea datelor tale conform secțiunii de mai jos.
        </p>
      </section>

      <section className="flex flex-col gap-space-xs">
        <h2 className="font-title-md text-title-md text-on-surface">7. Drepturile tale</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Conform GDPR (Regulamentul (UE) 2016/679), ai dreptul de acces (art. 15), rectificare
          (art. 16), ștergere (art. 17), restricționare a prelucrării (art. 18), portabilitate a
          datelor (art. 20) și opoziție (art. 21). Pentru a-ți exercita oricare dintre aceste
          drepturi, folosește datele de contact din secțiunea 1.
        </p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Ai dreptul de a depune o plângere la Autoritatea Națională de Supraveghere a Prelucrării
          Datelor cu Caracter Personal (ANSPDCP):{' '}
          <a
            href="https://www.dataprotection.ro/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary underline underline-offset-2"
          >
            www.dataprotection.ro
          </a>
          , e-mail{' '}
          <a href="mailto:anspdcp@dataprotection.ro" className="text-secondary underline underline-offset-2">
            anspdcp@dataprotection.ro
          </a>
          , B-dul G-ral. Gheorghe Magheru 28-30, Sector 1, București.
        </p>
      </section>
    </div>
  );
}
