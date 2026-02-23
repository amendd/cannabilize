import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canAccessIfp, canCreateCharge } from '@/lib/ifp-permissions';
import { createAuditLog, AuditAction, AuditEntity } from '@/lib/audit';
import { getOrderCreationBlockReasons } from '@/lib/compliance-gates';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canAccessIfp(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {};
    if (status && status !== 'ALL') where.status = status;

    const [charges, total] = await Promise.all([
      prisma.charge.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          patient: { select: { id: true, name: true, email: true } },
          consultation: { select: { id: true, scheduledAt: true } },
          erpOrder: { select: { id: true, status: true } },
          prescription: { select: { id: true } },
        },
      }),
      prisma.charge.count({ where }),
    ]);

    return NextResponse.json({ charges, total, limit, offset });
  } catch (error) {
    console.error('IFP CANNA charges GET:', error);
    return NextResponse.json(
      { error: 'Erro ao listar cobranças' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canCreateCharge(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const {
      patientId,
      consultationId,
      prescriptionId,
      erpOrderId,
      amount,
      description,
      dueDate,
      chargeType,
      allowedPaymentMethods,
    } = body as {
      patientId: string;
      consultationId?: string;
      prescriptionId?: string;
      erpOrderId?: string;
      amount: number;
      description?: string;
      dueDate: string;
      chargeType?: string;
      allowedPaymentMethods?: string[];
    };

    if (!patientId || amount == null || !dueDate) {
      return NextResponse.json(
        { error: 'patientId, amount e dueDate são obrigatórios' },
        { status: 400 }
      );
    }

    const patient = await prisma.user.findUnique({
      where: { id: patientId },
    });
    if (!patient) {
      return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 });
    }

    if (erpOrderId) {
      const existing = await prisma.charge.findUnique({
        where: { erpOrderId },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'Já existe uma cobrança para este pedido' },
          { status: 400 }
        );
      }
      const order = await prisma.erpOrder.findUnique({
        where: { id: erpOrderId },
        select: { patientId: true, prescriptionId: true },
      });
      if (order) {
        const blockReasons = await getOrderCreationBlockReasons(
          order.patientId,
          order.prescriptionId || null
        );
        if (blockReasons.length > 0) {
          return NextResponse.json(
            {
              error:
                'Não é possível criar cobrança para este pedido: requisitos de compliance não atendidos.',
              blockReasons,
            },
            { status: 400 }
          );
        }
      }
    }

    const charge = await prisma.charge.create({
      data: {
        patientId,
        consultationId: consultationId || undefined,
        prescriptionId: prescriptionId || undefined,
        erpOrderId: erpOrderId || undefined,
        amount: Number(amount),
        description: description || null,
        dueDate: new Date(dueDate),
        chargeType: chargeType === 'RECURRING' ? 'RECURRING' : 'ONE_TIME',
        allowedPaymentMethods: allowedPaymentMethods
          ? JSON.stringify(allowedPaymentMethods)
          : null,
        status: 'CREATED',
      },
      include: {
        patient: { select: { id: true, name: true, email: true } },
        erpOrder: { select: { id: true, status: true } },
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditAction.CREATE,
      entity: AuditEntity.CHARGE,
      entityId: charge.id,
      metadata: { amount: charge.amount, patientId },
    });

    return NextResponse.json(charge);
  } catch (error) {
    console.error('IFP CANNA charges POST:', error);
    return NextResponse.json(
      { error: 'Erro ao criar cobrança' },
      { status: 500 }
    );
  }
}
