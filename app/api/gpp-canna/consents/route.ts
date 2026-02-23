import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog, AuditAction, AuditEntity } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const type = searchParams.get('type');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: { patientId?: string; type?: string; revokedAt?: null } = {};
    if (patientId) where.patientId = patientId;
    if (type) where.type = type;
    if (activeOnly) where.revokedAt = null;

    const consents = await prisma.patientConsent.findMany({
      where,
      include: { patient: { select: { id: true, name: true, email: true } } },
      orderBy: { consentedAt: 'desc' },
    });
    return NextResponse.json(consents);
  } catch (e) {
    console.error('GPP consents GET:', e);
    return NextResponse.json({ error: 'Erro ao listar consentimentos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }
    const body = await request.json();
    const { patientId, type, version } = body as { patientId: string; type: string; version?: string };
    if (!patientId || !type) {
      return NextResponse.json({ error: 'patientId e type são obrigatórios' }, { status: 400 });
    }

    const consent = await prisma.patientConsent.create({
      data: {
        patientId,
        type,
        version: version || '1.0',
        consentedAt: new Date(),
        metadata: JSON.stringify({ createdBy: session.user.id, source: 'GPP_ADMIN' }),
      },
      include: { patient: { select: { id: true, name: true, email: true } } },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditAction.CREATE,
      entity: AuditEntity.PATIENT_CONSENT,
      entityId: consent.id,
      metadata: { patientId, type },
    });

    return NextResponse.json(consent);
  } catch (e) {
    console.error('GPP consents POST:', e);
    return NextResponse.json({ error: 'Erro ao registrar consentimento' }, { status: 500 });
  }
}
