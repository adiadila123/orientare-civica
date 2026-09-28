import { NextResponse } from 'next/server';
import { createDb } from '@/lib/db';
import { createInfoRequest } from '@/lib/infoRequests';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const informationRequested =
    typeof body?.informationRequested === 'string' ? body.informationRequested.trim() : '';
  const institutionCode = typeof body?.institutionCode === 'string' ? body.institutionCode : '';

  if (informationRequested.length === 0 || institutionCode.length === 0) {
    return NextResponse.json(
      { error: 'informationRequested and institutionCode are required' },
      { status: 400 }
    );
  }

  try {
    const sql = createDb();
    const created = await createInfoRequest(sql, { institutionCode, informationRequested });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Info request creation failed', error);
    return NextResponse.json({ error: 'Nu am putut genera cererea. Încearcă din nou.' }, { status: 500 });
  }
}
