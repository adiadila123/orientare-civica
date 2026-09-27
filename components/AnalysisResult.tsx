import { Badge } from '@/components/ui/badge';
import { InstitutionCard } from '@/components/InstitutionCard';
import type { TriageResponse } from '@/lib/types';

const URGENCY_LABELS: Record<TriageResponse['urgency'], string> = {
  low: 'Prioritate scăzută',
  normal: 'Prioritate normală',
  high: 'Prioritate ridicată',
};

const LOW_CONFIDENCE_THRESHOLD = 0.7;

interface AnalysisResultProps {
  result: TriageResponse;
}

export function AnalysisResult({ result }: AnalysisResultProps) {
  return (
    <div
      className="space-y-4"
      aria-label="Rezultatul analizei"
      role="region"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <Badge>{URGENCY_LABELS[result.urgency]}</Badge>
        {result.confidence < LOW_CONFIDENCE_THRESHOLD && (
          <Badge variant="outline">Recomandăm verificare manuală</Badge>
        )}
      </div>

      <p>{result.explanation}</p>

      {result.required_documents.length > 0 && (
        <div>
          <h3 className="font-medium">Documente necesare</h3>
          <ul className="list-disc pl-5">
            {result.required_documents.map((doc, index) => (
              <li key={index}>{doc}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="font-medium">Pași următori</h3>
        <ol className="list-decimal pl-5">
          {result.next_steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </div>

      {result.institution ? (
        <InstitutionCard institution={result.institution} />
      ) : (
        <p role="alert">
          Nu am putut identifica exact instituția potrivită pentru această
          problemă. Verifică manual sau contactează primăria locală pentru
          îndrumare.
        </p>
      )}
    </div>
  );
}
