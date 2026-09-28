'use client';

import dynamic from 'next/dynamic';
import type { MappableInstitution } from '@/components/InstitutionsMap';

const InstitutionsMap = dynamic(
  () => import('@/components/InstitutionsMap').then((mod) => mod.InstitutionsMap),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        aria-label="Se încarcă harta"
        className="h-[500px] w-full rounded-xl bg-surface-container-low animate-pulse"
      />
    ),
  }
);

interface InstitutionsMapLoaderProps {
  institutions: MappableInstitution[];
}

export function InstitutionsMapLoader({ institutions }: InstitutionsMapLoaderProps) {
  return <InstitutionsMap institutions={institutions} />;
}
