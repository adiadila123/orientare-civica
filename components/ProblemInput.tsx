'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
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
const VOICE_INPUT_LANG = 'ro-RO';

interface SpeechRecognitionResultLike {
  [index: number]: { transcript: string };
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

interface ProblemInputProps {
  onSubmit: (description: string) => void;
  isLoading?: boolean;
}

export function ProblemInput({ onSubmit, isLoading = false }: ProblemInputProps) {
  const [description, setDescription] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const trimmedLength = description.trim().length;
  const isTooShort = trimmedLength > 0 && trimmedLength < MIN_DESCRIPTION_LENGTH;
  const canSubmit = trimmedLength >= MIN_DESCRIPTION_LENGTH && !isLoading;

  useEffect(() => {
    setIsVoiceSupported(getSpeechRecognitionConstructor() !== null);
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  function toggleVoiceInput() {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognitionCtor = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionCtor) {
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = VOICE_INPUT_LANG;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(' ')
        .trim();
      if (transcript.length === 0) {
        return;
      }
      setDescription((prev) => (prev.trim().length > 0 ? `${prev.trim()} ${transcript}` : transcript));
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = description.trim();
    if (trimmed.length < MIN_DESCRIPTION_LENGTH) return;
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Descrie problema ta" className="space-y-space-md">
      <div className="relative">
        <Textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Ex: Am primit o amendă de la primărie și nu știu cum să o contest..."
          aria-label="Descrierea problemei"
          aria-invalid={isTooShort ? true : undefined}
          aria-describedby={isTooShort ? 'description-error' : undefined}
          maxLength={MAX_DESCRIPTION_LENGTH}
          rows={10}
          className="min-h-40 pr-12"
        />
        {isVoiceSupported && (
          <button
            type="button"
            onClick={toggleVoiceInput}
            aria-pressed={isListening}
            aria-label={isListening ? 'Oprește dictarea vocală' : 'Descrie problema prin voce'}
            title={isListening ? 'Oprește dictarea vocală' : 'Descrie problema prin voce'}
            className={`absolute right-3 top-3 rounded-full p-2 text-lg leading-none ${
              isListening ? 'bg-error text-on-error animate-pulse' : 'bg-surface-container-high text-on-surface-variant'
            }`}
          >
            <span aria-hidden="true">{isListening ? '⏹' : '🎤'}</span>
          </button>
        )}
      </div>
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
