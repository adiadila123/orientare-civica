'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const QUICK_CATEGORIES = ['Amendă', 'Factură utilități', 'Problemă ANAF', 'Sesizare primărie'];

interface ProblemInputProps {
  onSubmit: (description: string) => void;
  isLoading?: boolean;
}

export function ProblemInput({ onSubmit, isLoading = false }: ProblemInputProps) {
  const [description, setDescription] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = description.trim();
    if (trimmed.length === 0) return;
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Descrie problema ta" className="space-y-4">
      <Textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Descrie problema ta în cuvinte simple..."
        aria-label="Descrierea problemei"
      />
      <div role="group" aria-label="Categorii rapide" className="flex flex-wrap gap-2">
        {QUICK_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setDescription(category)}
            className="rounded-full border px-3 py-1 text-sm"
          >
            {category}
          </button>
        ))}
      </div>
      <Button type="submit" disabled={isLoading || description.trim().length === 0}>
        {isLoading ? 'Se analizează...' : 'Analizează'}
      </Button>
    </form>
  );
}
