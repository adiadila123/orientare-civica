'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { InstitutionCard } from '@/components/InstitutionCard';
import { StepNumber } from '@/components/StepNumber';
import type { TriageResponse } from '@/lib/types';

const URGENCY_LABELS: Record<TriageResponse['urgency'], string> = {
  low: 'Prioritate scăzută',
  normal: 'Prioritate normală',
  high: 'Prioritate ridicată',
};

const CHANNEL_LABELS: Record<TriageResponse['recommended_channel'], string> = {
  online: 'Online',
  telefon: 'Telefon',
  fizic: 'Fizic',
};

const LOW_CONFIDENCE_THRESHOLD = 0.7;

interface AnalysisResultProps {
  result: TriageResponse;
}

export function AnalysisResult({ result }: AnalysisResultProps) {
  const router = useRouter();
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [caseError, setCaseError] = useState<string | null>(null);

  const isContestable = Boolean(
    result.institution && (result.institution.iban || result.institution.associated_court)
  );

  async function handleGenerateContestation() {
    if (!result.institution) {
      return;
    }
    setIsCreatingCase(true);
    setCaseError(null);
    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: result.explanation,
          institutionCode: result.institution.code,
          aiAnalysis: result,
        }),
      });
      if (!response.ok) {
        throw new Error('create-failed');
      }
      const created = await response.json();
      router.push(`/dosare/${created.id}`);
    } catch {
      setCaseError('Nu am putut genera contestația. Încearcă din nou.');
      setIsCreatingCase(false);
    }
  }

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Rezultatul analizei"
      className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md"
    >
      <div className="flex items-center gap-space-sm flex-wrap">
        <Badge>{URGENCY_LABELS[result.urgency]}</Badge>
        <Badge variant="outline">{CHANNEL_LABELS[result.recommended_channel]}</Badge>
        {result.confidence < LOW_CONFIDENCE_THRESHOLD && (
          <Badge variant="outline">Recomandăm verificare manuală</Badge>
        )}
      </div>

      <p className="font-body-md text-body-md text-on-surface">{result.explanation}</p>

      {result.required_documents.length > 0 && (
        <div>
          <h3 className="font-title-md text-title-md text-on-surface mb-space-xs">
            Documente necesare
          </h3>
          <ul className="flex flex-col gap-space-xs">
            {result.required_documents.map((doc, index) => (
              <li key={index} className="flex items-center gap-space-xs font-body-sm text-body-sm">
                <span aria-hidden="true">✓</span>
                <span>{doc}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="font-title-md text-title-md text-on-surface mb-space-xs">Pași următori</h3>
        <ol className="flex flex-col gap-space-sm">
          {result.next_steps.map((step, index) => (
            <li key={index} className="flex items-center gap-space-sm">
              <StepNumber index={index + 1} />
              <span className="font-body-sm text-body-sm text-on-surface">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {result.institution ? (
        <InstitutionCard institution={result.institution} />
      ) : (
        <p role="alert" className="font-body-sm text-body-sm text-on-surface-variant">
          Nu am putut identifica exact instituția potrivită pentru această problemă. Verifică
          manual sau contactează primăria locală pentru îndrumare.
        </p>
      )}

      {isContestable && (
        <div className="flex flex-col gap-space-xs">
          <button
            type="button"
            onClick={handleGenerateContestation}
            disabled={isCreatingCase}
            className="bg-primary text-on-primary rounded-lg px-space-md py-2 font-label-lg text-label-lg disabled:opacity-50 self-start"
          >
            {isCreatingCase ? 'Se generează...' : 'Generează contestația'}
          </button>
          {caseError && (
            <p role="alert" className="font-label-sm text-label-sm text-error">
              {caseError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
