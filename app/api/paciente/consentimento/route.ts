import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog, AuditAction, AuditEntity } from '@/lib/audit';
import { CONSENT_TYPE_LGPD } from '@/lib/compliance-gates';
import { headers } from 'next/headers';

const TERM_VERSION = '1.0';

/**
 * POST — Registra aceite do termo de consentimento LGPD pelo paciente.
 * Registra data/hora, IP e versão do termo (rastreabilidade).
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'PATIENT') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const accepted = body?.accepted === true;
    if (!accepted) {
      return NextResponse.json(
        { error: 'É necessário aceitar o termo de consentimento' },
        { status: 400 }
      );
    }

    const headersList = await headers();
    const ipAddress =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      null;
    const userAgent = headersList.get('user-agent') || null;

    const consent = await prisma.patientConsent.create({
      data: {
        patientId: session.user.id,
        type: CONSENT_TYPE_LGPD,
        version: TERM_VERSION,
        consentedAt: new Date(),
        ipAddress,
        userAgent,
        metadata: JSON.stringify({
          source: 'PACIENTE_CONSENTIMENTO',
          termVersion: TERM_VERSION,
        }),
      },
      include: {
        patient: { select: { id: true, name: true, email: true } },
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditAction.CREATE,
      entity: AuditEntity.PATIENT_CONSENT,
      entityId: consent.id,
      metadata: { type: CONSENT_TYPE_LGPD, version: TERM_VERSION },
      changes: { ipAddress: ipAddress || undefined, userAgent: userAgent || undefined },
    });

    return NextResponse.json({
      success: true,
      consentId: consent.id,
      version: TERM_VERSION,
    });
  } catch (e) {
    console.error('paciente consentimento POST:', e);
    return NextResponse.json(
      { error: 'Erro ao registrar consentimento' },
      { status: 500 }
    );
  }
}
