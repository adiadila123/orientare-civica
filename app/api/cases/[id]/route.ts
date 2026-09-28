import { NextResponse } from 'next/server';
import { createDb } from '@/lib/db';
import { updateCase } from '@/lib/cases';
import { isValidCnp } from '@/lib/cnp';

export async function PUT(req: Request, props: RouteContext<'/api/cases/[id]'>) {
  const { id } = await props.params;
  const body = await req.json().catch(() => null);

  if (!body || typeof body.petitionerCnp !== 'string' || !isValidCnp(body.petitionerCnp)) {
    return NextResponse.json({ error: 'CNP invalid' }, { status: 400 });
  }

  try {
    const sql = createDb();
    const updated = await updateCase(sql, id, {
      petitionerName: typeof body.petitionerName === 'string' ? body.petitionerName : '',
      petitionerCnp: body.petitionerCnp,
      petitionerAddress: typeof body.petitionerAddress === 'string' ? body.petitionerAddress : '',
      petitionerEmail: typeof body.petitionerEmail === 'string' ? body.petitionerEmail : null,
      petitionerPhone: typeof body.petitionerPhone === 'string' ? body.petitionerPhone : null,
      pvSeries: typeof body.pvSeries === 'string' ? body.pvSeries : '',
      pvNumber: typeof body.pvNumber === 'string' ? body.pvNumber : '',
      pvIssueDate: typeof body.pvIssueDate === 'string' ? body.pvIssueDate : '',
      pvAmount: typeof body.pvAmount === 'number' ? body.pvAmount : 0,
      pvPenaltyPoints: typeof body.pvPenaltyPoints === 'number' ? body.pvPenaltyPoints : null,
      pvIssuingAgent: typeof body.pvIssuingAgent === 'string' ? body.pvIssuingAgent : null,
      grounds: typeof body.grounds === 'string' ? body.grounds : '',
      annexes: Array.isArray(body.annexes) ? body.annexes : [],
    });

    if (!updated) {
      return NextResponse.json({ error: 'Dosarul nu a fost găsit' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Case update failed', error);
    return NextResponse.json({ error: 'Nu am putut salva modificările.' }, { status: 500 });
  }
}
