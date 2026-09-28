import { NextResponse } from 'next/server';
import { createDb } from '@/lib/db';
import { updateInfoRequest } from '@/lib/infoRequests';

export async function PUT(req: Request, props: RouteContext<'/api/info-requests/[id]'>) {
  const { id } = await props.params;
  const body = await req.json().catch(() => null);

  const informationRequested =
    typeof body?.informationRequested === 'string' ? body.informationRequested.trim() : '';

  if (!body || informationRequested.length === 0) {
    return NextResponse.json({ error: 'informationRequested este obligatoriu' }, { status: 400 });
  }

  try {
    const sql = createDb();
    const updated = await updateInfoRequest(sql, id, {
      requesterName: typeof body.requesterName === 'string' && body.requesterName.length > 0 ? body.requesterName : null,
      requesterAddress:
        typeof body.requesterAddress === 'string' && body.requesterAddress.length > 0 ? body.requesterAddress : null,
      requesterEmail:
        typeof body.requesterEmail === 'string' && body.requesterEmail.length > 0 ? body.requesterEmail : null,
      requesterPhone:
        typeof body.requesterPhone === 'string' && body.requesterPhone.length > 0 ? body.requesterPhone : null,
      informationRequested,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Cererea nu a fost găsită' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Info request update failed', error);
    return NextResponse.json({ error: 'Nu am putut salva modificările.' }, { status: 500 });
  }
}
