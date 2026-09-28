import { NextResponse } from 'next/server';
import { createDb } from '@/lib/db';
import { createCase } from '@/lib/cases';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const description = typeof body?.description === 'string' ? body.description.trim() : '';
  const institutionCode = typeof body?.institutionCode === 'string' ? body.institutionCode : '';

  if (description.length === 0 || institutionCode.length === 0) {
    return NextResponse.json({ error: 'description and institutionCode are required' }, { status: 400 });
  }

  try {
    const sql = createDb();
    const created = await createCase(sql, {
      userDescription: description,
      aiAnalysis: body?.aiAnalysis ?? null,
      institutionCode,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Case creation failed', error);
    return NextResponse.json({ error: 'Nu am putut genera contestația. Încearcă din nou.' }, { status: 500 });
  }
}
