'use client';

import { useState } from 'react';
import { ProblemInput } from '@/components/ProblemInput';
import { AnalysisResult } from '@/components/AnalysisResult';
import { AnalysisProgress } from '@/components/AnalysisProgress';
import { HowItWorks } from '@/components/HowItWorks';
import type { TriageResponse } from '@/lib/types';

const TRUST_INDICATORS = ['100% Gratuit', 'Fără cont necesar', 'Confidențial'];

export default function HomePage() {
  const [result, setResult] = useState<TriageResponse | null>(null);
  const [lastDescription, setLastDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(description: string) {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setLastDescription(description);

    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });

      if (response.status === 429) {
        setError('Prea multe cereri într-un timp scurt. Așteaptă un minut și încearcă din nou.');
        return;
      }

      if (!response.ok) {
        throw new Error('request-failed');
      }

      const data = (await response.json()) as TriageResponse;
      setResult(data);
    } catch {
      setError('Nu am putut analiza problema. Încearcă din nou.');
    } finally {
      setIsLoading(false);
    }
  }

  const isIdle = !isLoading && !error && !result;

  return (
    <div
      className={`max-w-3xl mx-auto px-margin py-space-xl flex flex-col gap-space-lg ${
        isIdle ? 'min-h-[70vh] justify-center' : ''
      }`}
    >
      <section className="text-center flex flex-col items-center">
        <h1 className="font-display text-display text-on-surface max-w-4xl">
          Nu știi unde să te adresezi?{' '}
          <span className="text-secondary">Spune-ne problema ta.</span>
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mt-space-sm">
          Descrie situația ta în cuvinte simple și te direcționăm către instituția potrivită, cu
          documentele și pașii necesari.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-space-sm mt-space-md">
          {TRUST_INDICATORS.map((indicator) => (
            <span
              key={indicator}
              className="font-label-md text-label-md text-on-surface-variant bg-surface-container-low rounded-full px-space-sm py-1"
            >
              {indicator}
            </span>
          ))}
        </div>
      </section>

      <div className="w-full bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
        <ProblemInput onSubmit={handleSubmit} isLoading={isLoading} />
      </div>

      {isIdle && <HowItWorks />}
      {isLoading && <AnalysisProgress />}
      {error && (
        <p role="alert" className="font-body-sm text-body-sm text-error">
          {error}
        </p>
      )}
      {result && <AnalysisResult result={result} description={lastDescription} />}
    </div>
  );
}
