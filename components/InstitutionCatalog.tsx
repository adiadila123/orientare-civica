'use client';

import { useMemo, useState } from 'react';
import { InstitutionCard } from '@/components/InstitutionCard';
import type { Institution } from '@/lib/types';

const CATEGORY_LABELS: Record<string, string> = {
  protectia_consumatorului: 'Protecția consumatorilor',
  fiscal: 'Fiscal',
  administratie_locala: 'Administrație locală',
  ordine_publica: 'Ordine publică',
  energie: 'Energie',
  telecomunicatii: 'Telecomunicații',
  sanatate: 'Sănătate',
  munca: 'Muncă',
};

const ALL_CATEGORY = 'toate';

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

interface InstitutionCatalogProps {
  institutions: Institution[];
}

export function InstitutionCatalog({ institutions }: InstitutionCatalogProps) {
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    for (const institution of institutions) {
      if (institution.category) {
        seen.add(institution.category);
      }
    }
    return Array.from(seen);
  }, [institutions]);

  if (institutions.length === 0) {
    return (
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Lista instituțiilor nu este disponibilă momentan. Încearcă din nou mai târziu.
      </p>
    );
  }

  const filtered = institutions.filter((institution) => {
    const matchesCategory = activeCategory === ALL_CATEGORY || institution.category === activeCategory;
    const haystack = normalize(
      [institution.name, institution.code, institution.description ?? ''].join(' ')
    );
    const matchesSearch = haystack.includes(normalize(searchText.trim()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex flex-col gap-space-sm">
        <input
          type="search"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Caută o instituție după nume"
          aria-label="Caută o instituție"
          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-space-sm py-2 font-body-sm text-body-sm text-on-surface focus-visible:outline-2 focus-visible:outline-secondary"
        />
        <div className="flex flex-wrap gap-space-sm" role="group" aria-label="Filtrează după categorie">
          <button
            type="button"
            onClick={() => setActiveCategory(ALL_CATEGORY)}
            aria-pressed={activeCategory === ALL_CATEGORY}
            className="rounded-full px-space-sm py-1 font-label-md text-label-md aria-pressed:bg-secondary aria-pressed:text-on-secondary bg-surface-container-low text-on-surface-variant"
          >
            Toate
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              aria-pressed={activeCategory === category}
              className="rounded-full px-space-sm py-1 font-label-md text-label-md aria-pressed:bg-secondary aria-pressed:text-on-secondary bg-surface-container-low text-on-surface-variant"
            >
              {CATEGORY_LABELS[category] ?? category}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Nicio instituție nu corespunde căutării tale.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
          {filtered.map((institution) => (
            <InstitutionCard key={institution.code} institution={institution} />
          ))}
        </div>
      )}
    </div>
  );
}
