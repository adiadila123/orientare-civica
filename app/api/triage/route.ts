import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { TriageResultSchema } from '@/lib/schema';
import { TRIAGE_SYSTEM_PROMPT, extractTriageJson } from '@/lib/gemini';
import { findInstitution } from '@/lib/institutions';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const description = typeof body?.description === 'string' ? body.description.trim() : '';

  if (description.length === 0) {
    return NextResponse.json({ error: 'description is required' }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent([
      { text: TRIAGE_SYSTEM_PROMPT },
      { text: `Problema utilizatorului: ${description}` },
    ]);

    const rawText = result.response.text();
    const parsed = TriageResultSchema.parse(extractTriageJson(rawText));

    const supabase = createServerSupabaseClient();
    const institution = await findInstitution(supabase, parsed.institution_type);

    return NextResponse.json({ ...parsed, institution });
  } catch (error) {
    console.error('Triage failed', error);
    return NextResponse.json(
      { error: 'Nu am putut analiza problema. Încearcă din nou.' },
      { status: 500 }
    );
  }
}
