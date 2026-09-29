import { describe, expect, it, vi } from 'vitest';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import { createTriageFeedback } from '@/lib/triageFeedback';
import type { TriageFeedback } from '@/lib/types';

function createFakeSql(rows: unknown[]) {
  const sql = vi.fn().mockResolvedValue(rows);
  return sql as unknown as NeonQueryFunction<false, false>;
}

const sampleFeedback: TriageFeedback = {
  id: '1',
  user_description: 'Am primit o amendă de la primărie.',
  ai_analysis: { primary_intent: 'contestatie_amenda' },
  suggested_institution_code: 'PRIMARIE',
  is_helpful: true,
  correction: null,
  created_at: '2026-09-28T10:00:00.000Z',
};

describe('createTriageFeedback', () => {
  it('inserts and returns the new feedback row', async () => {
    const rawRow = { ...sampleFeedback, created_at: new Date('2026-09-28T10:00:00.000Z') };
    const sql = createFakeSql([rawRow]);

    const result = await createTriageFeedback(sql, {
      userDescription: sampleFeedback.user_description,
      aiAnalysis: sampleFeedback.ai_analysis,
      suggestedInstitutionCode: 'PRIMARIE',
      isHelpful: true,
      correction: null,
    });

    expect(result).toEqual(sampleFeedback);
    expect(sql).toHaveBeenCalledTimes(1);
  });

  it('stores a correction when the recommendation was not helpful', async () => {
    const rawRow = {
      ...sampleFeedback,
      is_helpful: false,
      correction: 'Ar fi trebuit să fie ANAF',
      created_at: new Date('2026-09-28T10:00:00.000Z'),
    };
    const sql = createFakeSql([rawRow]);

    const result = await createTriageFeedback(sql, {
      userDescription: sampleFeedback.user_description,
      aiAnalysis: sampleFeedback.ai_analysis,
      suggestedInstitutionCode: 'PRIMARIE',
      isHelpful: false,
      correction: 'Ar fi trebuit să fie ANAF',
    });

    expect(result.is_helpful).toBe(false);
    expect(result.correction).toBe('Ar fi trebuit să fie ANAF');
  });
});
