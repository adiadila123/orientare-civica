import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';
import { TriageResultSchema } from '@/lib/schema';
import { TRIAGE_SYSTEM_PROMPT, extractTriageJson } from '@/lib/triage';
import { findInstitution } from '@/lib/institutions';
import { createDb } from '@/lib/db';
import { isRateLimited, getClientIp } from '@/lib/rateLimit';

const MAX_DESCRIPTION_LENGTH = 2000;

export async function POST(req: Request) {
  if (isRateLimited(getClientIp(req))) {
    return NextResponse.json(
      { error: 'Prea multe cereri. Încearcă din nou peste un minut.' },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const description = typeof body?.description === 'string' ? body.description.trim() : '';

  if (description.length === 0) {
    return NextResponse.json({ error: 'description is required' }, { status: 400 });
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return NextResponse.json({ error: 'description is too long' }, { status: 400 });
  }

  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('Missing GROQ_API_KEY environment variable');
    }
    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: TRIAGE_SYSTEM_PROMPT },
        { role: 'user', content: `Problema utilizatorului: ${description}` },
      ],
      model: 'openai/gpt-oss-120b',
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const rawText = completion.choices[0]?.message?.content ?? '';
    const parsed = TriageResultSchema.parse(extractTriageJson(rawText));

    const sql = createDb();
    const institution = await findInstitution(sql, parsed.institution_type);

    return NextResponse.json({ ...parsed, institution });
  } catch (error) {
    console.error('Triage failed', error);
    return NextResponse.json(
      { error: 'Nu am putut analiza problema. Încearcă din nou.' },
      { status: 500 }
    );
  }
}
