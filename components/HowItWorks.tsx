import { StepNumber } from '@/components/StepNumber';

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
            <StepNumber index={index + 1} />
            <span className="font-body-sm text-body-sm text-on-surface">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
