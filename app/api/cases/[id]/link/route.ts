import { NextResponse } from 'next/server';
import { createDb } from '@/lib/db';
import { findCase, findCaseByCaseNumber, mergeCaseGroups, findCasesByGroupId } from '@/lib/cases';

export async function POST(req: Request, props: RouteContext<'/api/cases/[id]/link'>) {
  const { id } = await props.params;
  const body = await req.json().catch(() => null);
  const targetCaseNumber = typeof body?.caseNumber === 'string' ? body.caseNumber.trim() : '';

  if (targetCaseNumber.length === 0) {
    return NextResponse.json({ error: 'Numărul dosarului este obligatoriu' }, { status: 400 });
  }

  try {
    const sql = createDb();

    const current = await findCase(sql, id);
    if (!current) {
      return NextResponse.json({ error: 'Dosarul curent nu a fost găsit' }, { status: 404 });
    }

    const target = await findCaseByCaseNumber(sql, targetCaseNumber);
    if (!target) {
      return NextResponse.json({ error: 'Nu am găsit niciun dosar cu acest număr' }, { status: 404 });
    }

    if (target.id === current.id) {
      return NextResponse.json({ error: 'Nu poți lega un dosar de el însuși' }, { status: 400 });
    }

    if (!current.case_group_id || !target.case_group_id) {
      return NextResponse.json({ error: 'Nu am putut lega dosarele.' }, { status: 500 });
    }

    await mergeCaseGroups(sql, current.case_group_id, target.case_group_id);
    const group = await findCasesByGroupId(sql, current.case_group_id);

    return NextResponse.json({ group });
  } catch (error) {
    console.error('Case linking failed', error);
    return NextResponse.json({ error: 'Nu am putut lega dosarele.' }, { status: 500 });
  }
}
