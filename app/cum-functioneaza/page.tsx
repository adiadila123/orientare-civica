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
