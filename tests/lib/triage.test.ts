import { describe, expect, it } from 'vitest';
import { extractTriageJson, TRIAGE_SYSTEM_PROMPT } from '@/lib/triage';
import { TriageResultSchema } from '@/lib/schema';

describe('extractTriageJson', () => {
  it('parses plain JSON', () => {
    const raw = '{"primary_intent": "problema_anaf", "urgency": "normal"}';
    expect(extractTriageJson(raw)).toEqual({ primary_intent: 'problema_anaf', urgency: 'normal' });
  });

  it('parses JSON wrapped in a markdown code fence', () => {
    const raw = '```json\n{"urgency": "high"}\n```';
    expect(extractTriageJson(raw)).toEqual({ urgency: 'high' });
  });

  it('throws when no JSON object is present', () => {
    expect(() => extractTriageJson('nu am putut analiza cererea')).toThrow(
      'No JSON object found in Groq response'
    );
  });
});

describe('TRIAGE_SYSTEM_PROMPT', () => {
  it('lists every supported institution code', () => {
    for (const code of [
      'ANPC',
      'ANAF',
      'PRIMARIE',
      'POLITIE_LOCALA',
      'ANRE',
      'ANCOM',
      'CNAS',
      'ITM',
      'CNCD',
      'AVOCATUL_POPORULUI',
      'CAZIER_JUDICIAR',
      'DGPCI',
    ]) {
      expect(TRIAGE_SYSTEM_PROMPT).toContain(code);
    }
  });
});

describe('TriageResultSchema', () => {
  const validResult = {
    primary_intent: 'problema_anaf',
    urgency: 'normal',
    institution_type: 'ANAF',
    required_documents: ['carte de identitate'],
    recommended_channel: 'online',
    next_steps: ['Depune cererea pe portalul SPV'],
    explanation: 'Trebuie să contactezi ANAF pentru această problemă.',
    confidence: 0.9,
  };

  it('accepts a well-formed triage result', () => {
    expect(TriageResultSchema.safeParse(validResult).success).toBe(true);
  });

  it('rejects an invalid urgency value', () => {
    expect(TriageResultSchema.safeParse({ ...validResult, urgency: 'urgent' }).success).toBe(false);
  });

  it('rejects a confidence value above 1', () => {
    expect(TriageResultSchema.safeParse({ ...validResult, confidence: 1.5 }).success).toBe(false);
  });
});
