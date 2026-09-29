'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const QUICK_CATEGORIES = [
  { emoji: '📄', label: 'Amenzi', value: 'Am primit o amendă de parcare de la primărie și vreau să o contest oficial.' },
  { emoji: '⚡', label: 'Facturi utilități', value: 'Am fost facturat eronat la energie electrică și furnizorul refuză recalcularea.' },
  { emoji: '🏛️', label: 'Probleme cu ANAF', value: 'Am o poprire pe cont de la ANAF și vreau să aflu baza legală și să depun declarația unică.' },
  { emoji: '⚖️', label: 'Reclamații ANPC', value: 'Comerciantul refuză returnarea produsului în 14 zile. Doresc reclamație ANPC.' },
  { emoji: '🏢', label: 'Sesizări primărie', value: 'Groapă adâncă pe carosabil și copac căzut pe alee publică.' },
];

const MIN_DESCRIPTION_LENGTH = 15;
const MAX_DESCRIPTION_LENGTH = 2000;
const TOO_SHORT_MESSAGE = 'Descrierea este prea scurtă (minim 15 caractere)';

interface ProblemInputProps {
  onSubmit: (description: string) => void;
  isLoading?: boolean;
}

export function ProblemInput({ onSubmit, isLoading = false }: ProblemInputProps) {
  const [description, setDescription] = useState('');
  const trimmedLength = description.trim().length;
  const isTooShort = trimmedLength > 0 && trimmedLength < MIN_DESCRIPTION_LENGTH;
  const canSubmit = trimmedLength >= MIN_DESCRIPTION_LENGTH && !isLoading;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = description.trim();
    if (trimmed.length < MIN_DESCRIPTION_LENGTH) return;
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Descrie problema ta" className="space-y-space-md">
      <Textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Ex: Am primit o amendă de la primărie și nu știu cum să o contest..."
        aria-label="Descrierea problemei"
        aria-invalid={isTooShort ? true : undefined}
        aria-describedby={isTooShort ? 'description-error' : undefined}
        maxLength={MAX_DESCRIPTION_LENGTH}
        rows={10}
        className="min-h-40"
      />
      {isTooShort && (
        <p id="description-error" role="alert" className="font-label-sm text-label-sm text-error">
          {TOO_SHORT_MESSAGE}
        </p>
      )}
      <div role="group" aria-label="Situații frecvente" className="flex flex-wrap gap-space-sm">
        {QUICK_CATEGORIES.map((category) => (
          <button
            key={category.label}
            type="button"
            onClick={() => setDescription(category.value)}
            className="rounded-lg bg-surface-container-high px-space-sm py-1.5 text-label-sm font-label-sm flex items-center gap-1.5"
          >
            <span>{category.emoji}</span>
            <span>{category.label}</span>
          </button>
        ))}
      </div>
      <Button type="submit" disabled={!canSubmit} className="w-full">
        {isLoading ? 'Se analizează...' : 'Analizează situația'}
      </Button>
    </form>
  );
}
