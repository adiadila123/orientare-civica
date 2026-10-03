import { NextResponse } from 'next/server';
import { createDb } from '@/lib/db';
import { listInstitutions } from '@/lib/institutions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = createDb();
    const institutions = await listInstitutions(sql);
    return NextResponse.json(institutions);
  } catch (error) {
    console.error('Institutions listing failed', error);
    return NextResponse.json(
      { error: 'Nu am putut încărca instituțiile. Încearcă din nou.' },
      { status: 500 }
    );
  }
}
