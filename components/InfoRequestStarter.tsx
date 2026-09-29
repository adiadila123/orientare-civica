'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { rememberRecord } from '@/lib/myRecordsStorage';

interface InfoRequestStarterProps {
  institutionCode: string;
  institutionName: string;
}

export function InfoRequestStarter({ institutionCode, institutionName }: InfoRequestStarterProps) {
  const router = useRouter();
  const [informationRequested, setInformationRequested] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (informationRequested.trim().length === 0) {
      setError('Descrie ce informație vrei să afli');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/info-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institutionCode, informationRequested }),
      });
      if (!response.ok) {
        throw new Error('create-failed');
      }
      const created = await response.json();
      rememberRecord({
        id: created.id,
        type: 'info-request',
        number: created.request_number,
        institutionName,
        createdAt: created.created_at ?? new Date().toISOString(),
      });
      router.push(`/solicitare-informatii/${created.id}`);
    } catch {
      setError('Nu am putut genera cererea. Încearcă din nou.');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-sm">
      <h2 className="font-title-md text-title-md text-on-surface">Solicită informații publice</h2>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Orice instituție publică trebuie să-ți răspundă în baza Legii nr. 544/2001. Descrie ce
        informație vrei să afli și generăm cererea.
      </p>
      <textarea
        value={informationRequested}
        onChange={(e) => setInformationRequested(e.target.value)}
        rows={3}
        placeholder="Ex: Câte sesizări privind câini fără stăpân au fost înregistrate în ultimul an?"
        aria-label="Ce informație vrei să afli"
        className="rounded-lg border border-outline-variant px-space-sm py-2 font-body-sm text-body-sm text-on-surface"
      />
      {error && (
        <p role="alert" className="font-label-sm text-label-sm text-error">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="bg-primary text-on-primary rounded-lg px-space-md py-2 font-label-lg text-label-lg disabled:opacity-50 self-start"
      >
        {isSubmitting ? 'Se generează...' : 'Generează cererea'}
      </button>
    </div>
  );
}
