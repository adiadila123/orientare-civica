'use client';

import { useMemo, useState } from 'react';
import { InstitutionCard } from '@/components/InstitutionCard';
import { LocationSelector, type LocationSelection } from '@/components/LocationSelector';
import type { Institution } from '@/lib/types';

const LOCALITY_PERSONALIZED_CODES = new Set(['PRIMARIE', 'POLITIE_LOCALA']);

function personalizeForLocation(institution: Institution, location: LocationSelection | null): Institution {
  if (!location?.localitate || !LOCALITY_PERSONALIZED_CODES.has(institution.code)) {
    return institution;
  }
  const baseName = institution.name.replace(/\s*\(generică, locală\)\s*$/, '');
  return {
    ...institution,
    name: `${baseName} — ${location.localitate}, jud. ${location.judet}`,
    description: `${institution.description ?? ''} Caută online „${institution.name.split(' (')[0]} ${location.localitate}” pentru datele de contact oficiale.`.trim(),
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  protectia_consumatorului: 'Protecția consumatorilor',
  fiscal: 'Fiscal',
  administratie_locala: 'Administrație locală',
  ordine_publica: 'Ordine publică',
  energie: 'Energie',
  telecomunicatii: 'Telecomunicații',
  sanatate: 'Sănătate',
  munca: 'Muncă',
  discriminare: 'Discriminare',
  ombudsman: 'Ombudsman',
  circulatie_rutiera: 'Circulație rutieră',
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
  const [location, setLocation] = useState<LocationSelection | null>(null);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    for (const institution of institutions) {
      if (institution.category) {
        seen.add(institution.category);
      }
    }
    return Array.from(seen).sort((a, b) =>
      (CATEGORY_LABELS[a] ?? a).localeCompare(CATEGORY_LABELS[b] ?? b, 'ro')
    );
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
        <LocationSelector onChange={setLocation} />
        <div className="flex flex-col gap-1 sm:w-64">
          <label htmlFor="category-filter" className="font-label-sm text-label-sm text-on-surface-variant">
            Categorie
          </label>
          <select
            id="category-filter"
            value={activeCategory}
            onChange={(event) => setActiveCategory(event.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-space-sm py-2 font-body-sm text-body-sm text-on-surface focus-visible:outline-2 focus-visible:outline-secondary"
          >
            <option value={ALL_CATEGORY}>Toate</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category] ?? category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Nicio instituție nu corespunde căutării tale.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
          {filtered.map((institution) => (
            <InstitutionCard
              key={institution.code}
              institution={personalizeForLocation(institution, location)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
