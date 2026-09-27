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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(description: string) {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });

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

  return (
    <div className="max-w-7xl mx-auto px-margin py-space-xl">
      <section className="text-center flex flex-col items-center mb-space-xl">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
          <ProblemInput onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-7">
          {!isLoading && !error && !result && <HowItWorks />}
          {isLoading && <AnalysisProgress />}
          {error && (
            <p role="alert" className="font-body-sm text-body-sm text-error">
              {error}
            </p>
          )}
          {result && <AnalysisResult result={result} />}
        </div>
      </div>
    </div>
  );
}
