import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canAccessIfp, canCancelCharge } from '@/lib/ifp-permissions';
import { createAuditLog, AuditAction, AuditEntity } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canAccessIfp(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const charge = await prisma.charge.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, name: true, email: true, phone: true } },
        consultation: { select: { id: true, scheduledAt: true, status: true } },
        erpOrder: { select: { id: true, status: true, totalAmount: true }, include: { organization: { select: { name: true } } } },
        prescription: { select: { id: true, status: true } },
        payments: true,
      },
    });

    if (!charge) {
      return NextResponse.json({ error: 'Cobrança não encontrada' }, { status: 404 });
    }

    return NextResponse.json(charge);
  } catch (error) {
    console.error('IFP CANNA charge GET:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar cobrança' },
      { status: 500 }
    );
  }
}

/** PATCH: Cancelar cobrança (gera log imutável) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canCancelCharge(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body as { action?: string };

    if (action !== 'cancel') {
      return NextResponse.json({ error: 'Ação inválida. Use action: "cancel"' }, { status: 400 });
    }

    const charge = await prisma.charge.findUnique({
      where: { id },
      include: { payments: { where: { status: 'PAID' } } },
    });

    if (!charge) {
      return NextResponse.json({ error: 'Cobrança não encontrada' }, { status: 404 });
    }

    if (charge.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Cobrança já está cancelada' }, { status: 400 });
    }

    if (charge.payments?.length) {
      return NextResponse.json(
        { error: 'Cobrança já possui pagamento pago; não pode ser cancelada' },
        { status: 400 }
      );
    }

    await prisma.charge.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledById: session.user.id!,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditAction.CHARGE_CANCEL,
      entity: AuditEntity.CHARGE,
      entityId: charge.id,
      metadata: { amount: charge.amount, patientId: charge.patientId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('IFP CANNA charge PATCH:', error);
    return NextResponse.json(
      { error: 'Erro ao cancelar cobrança' },
      { status: 500 }
    );
  }
}
