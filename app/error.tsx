'use client';

import { useEffect } from 'react';
import { TriangleAlert } from 'lucide-react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  retry: () => void;
}

export default function Error({ error, retry }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-lg mx-auto px-margin py-space-xl min-h-[60vh] flex flex-col items-center justify-center text-center gap-space-md">
      <TriangleAlert aria-hidden="true" className="text-error" size={48} />
      <h1 className="font-headline-lg text-headline-lg text-on-surface">Ceva nu a mers bine</h1>
      <p className="font-body-md text-body-md text-on-surface-variant">
        A apărut o eroare neașteptată. Poți încerca din nou sau te poți întoarce la pagina
        principală.
      </p>
      {error.digest && (
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          Cod de referință: {error.digest}
        </p>
      )}
      <div className="flex gap-space-sm">
        <button
          type="button"
          onClick={() => retry()}
          className="bg-primary text-on-primary rounded-lg px-space-md py-2 font-label-lg text-label-lg"
        >
          Încearcă din nou
        </button>
        <a
          href="/"
          className="rounded-lg border border-outline-variant px-space-md py-2 font-label-lg text-label-lg text-on-surface"
        >
          Înapoi acasă
        </a>
      </div>
    </div>
  );
}
