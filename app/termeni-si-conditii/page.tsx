import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termeni și condiții — Unde Merg?',
  description: 'Termenii și condițiile de utilizare a serviciului Unde Merg? – Orientare Civică.',
};

export default function TermeniSiConditiiPage() {
  return (
    <div className="max-w-3xl mx-auto px-margin py-space-xl flex flex-col gap-space-lg">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">Termeni și condiții</h1>

      <section className="flex flex-col gap-space-xs">
        <h2 className="font-title-md text-title-md text-on-surface">1. Obiectul serviciului</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Unde merg? – Orientare Civică este un serviciu informativ, gratuit, care te ajută să
          identifici instituția publică potrivită pentru o problemă administrativă, pe baza unei
          descrieri în limbaj natural analizate automat. Serviciul nu este operat de o instituție
          publică și nu înlocuiește canalele oficiale de comunicare cu autoritățile.
        </p>
      </section>

      <section className="flex flex-col gap-space-xs">
        <h2 className="font-title-md text-title-md text-on-surface">2. Natura recomandărilor</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Recomandările afișate (instituție, documente necesare, pași următori, eventualul document
          de contestație generat) sunt produse automat, cu ajutorul unui model de inteligență
          artificială, pe baza textului introdus de tine. Acestea au scop strict orientativ și nu
          constituie consultanță juridică. Îți recomandăm să confirmi orice informație direct cu
          instituția vizată înainte de a acționa pe baza ei.
        </p>
      </section>

      <section className="flex flex-col gap-space-xs">
        <h2 className="font-title-md text-title-md text-on-surface">3. Limitarea răspunderii</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Serviciul este oferit &bdquo;așa cum este&rdquo;, fără garanții privind exactitatea,
          caracterul complet sau actualitatea informațiilor generate. Nu răspundem pentru decizii
          luate exclusiv pe baza recomandărilor primite, pentru eventuale erori ale modelului de
          inteligență artificială sau pentru consecințele depunerii unui document generat prin acest
          serviciu la o instituție publică.
        </p>
      </section>

      <section className="flex flex-col gap-space-xs">
        <h2 className="font-title-md text-title-md text-on-surface">4. Utilizare acceptabilă</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Folosești acest serviciu doar pentru identificarea instituțiilor și generarea de documente
          pentru propriile tale situații administrative. Nu introduce date ale altor persoane fără
          acordul acestora și nu folosi serviciul în scopuri ilegale.
        </p>
      </section>

      <section className="flex flex-col gap-space-xs">
        <h2 className="font-title-md text-title-md text-on-surface">5. Modificări</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Acești termeni pot fi actualizați periodic. Continuarea folosirii serviciului după o
          modificare reprezintă acceptarea noii versiuni.
        </p>
      </section>

      <section className="flex flex-col gap-space-xs">
        <h2 className="font-title-md text-title-md text-on-surface">6. Legea aplicabilă</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Acești termeni sunt guvernați de legislația română și, după caz, de dreptul Uniunii
          Europene.
        </p>
      </section>
    </div>
  );
}
