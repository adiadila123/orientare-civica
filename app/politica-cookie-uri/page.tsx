import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politica de cookie-uri — Unde Merg?',
  description: 'Ce cookie-uri folosește (sau nu) Unde Merg? – Orientare Civică.',
};

export default function PoliticaCookieUriPage() {
  return (
    <div className="max-w-3xl mx-auto px-margin py-space-xl flex flex-col gap-space-lg">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">Politica de cookie-uri</h1>

      <section className="flex flex-col gap-space-xs">
        <h2 className="font-title-md text-title-md text-on-surface">Acest site nu folosește cookie-uri de urmărire</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Unde merg? – Orientare Civică nu plasează cookie-uri de analiză (analytics), publicitate sau
          urmărire (tracking) și nu folosește stocare locală în browser (local storage) pentru a te
          identifica sau a-ți urmări activitatea.
        </p>
      </section>

      <section className="flex flex-col gap-space-xs">
        <h2 className="font-title-md text-title-md text-on-surface">Cookie-uri strict tehnice</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Furnizorul de găzduire poate seta cookie-uri strict necesare pentru funcționarea de bază a
          infrastructurii (de exemplu, pentru echilibrarea traficului). Acestea nu sunt folosite pentru
          a te identifica și nu necesită consimțământ conform legislației aplicabile.
        </p>
      </section>

      <section className="flex flex-col gap-space-xs">
        <h2 className="font-title-md text-title-md text-on-surface">Modificări</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Dacă vom introduce vreodată cookie-uri de analiză sau publicitate, vom actualiza această
          pagină și vom cere consimțământul tău înainte de a le folosi.
        </p>
      </section>
    </div>
  );
}
