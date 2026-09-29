import { NextResponse } from 'next/server';
import { createDb } from '@/lib/db';
import { createTriageFeedback } from '@/lib/triageFeedback';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const userDescription = typeof body?.description === 'string' ? body.description.trim() : '';
  const isHelpful = typeof body?.isHelpful === 'boolean' ? body.isHelpful : null;

  if (userDescription.length === 0 || isHelpful === null) {
    return NextResponse.json({ error: 'description and isHelpful are required' }, { status: 400 });
  }

  try {
    const sql = createDb();
    const created = await createTriageFeedback(sql, {
      userDescription,
      aiAnalysis: body?.aiAnalysis ?? null,
      suggestedInstitutionCode:
        typeof body?.suggestedInstitutionCode === 'string' ? body.suggestedInstitutionCode : null,
      isHelpful,
      correction:
        typeof body?.correction === 'string' && body.correction.trim().length > 0
          ? body.correction.trim()
          : null,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Triage feedback creation failed', error);
    return NextResponse.json({ error: 'Nu am putut salva feedback-ul.' }, { status: 500 });
  }
}
