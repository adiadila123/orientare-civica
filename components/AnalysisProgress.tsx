import { StepNumber } from '@/components/StepNumber';

const STEPS = [
  'Se analizează textul',
  'Se identifică domeniul',
  'Se caută instituția potrivită',
  'Se pregătește recomandarea',
];

export function AnalysisProgress() {
  return (
    <div role="status" aria-label="Analiză în curs" className="flex flex-col gap-space-sm">
      {STEPS.map((step, index) => (
        <div key={step} className="flex items-center gap-space-sm">
          <StepNumber index={index + 1} size="lg" />
          <span className="font-body-md text-body-md text-on-surface">{step}</span>
        </div>
      ))}
    </div>
  );
}
