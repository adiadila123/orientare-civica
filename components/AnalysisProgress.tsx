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
          <span className="w-8 h-8 rounded-full bg-primary text-on-primary font-label-md text-label-md flex items-center justify-center shrink-0">
            {index + 1}
          </span>
          <span className="font-body-md text-body-md text-on-surface">{step}</span>
        </div>
      ))}
    </div>
  );
}
