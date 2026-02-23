import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getOrderCreationBlockReasons } from '@/lib/compliance-gates';
import { createAuditLog, AuditAction, AuditEntity } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);
  const offset = Number(searchParams.get('offset')) || 0;
  try {
    const where = status && status !== 'ALL' ? { status } : {};
    const [orders, total] = await Promise.all([
      prisma.erpOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          patient: { select: { id: true, name: true, email: true } },
          prescription: { select: { id: true } },
          consultation: { select: { id: true } },
          organization: { select: { id: true, name: true } },
        },
      }),
      prisma.erpOrder.count({ where }),
    ]);
    return NextResponse.json({ orders, total });
  } catch (e) {
    console.error('erp-canna orders list:', e);
    return NextResponse.json({ error: 'Erro ao listar pedidos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const { patientId, organizationId, prescriptionId, consultationId, notes } = body;
    if (!patientId) return NextResponse.json({ error: 'patientId é obrigatório' }, { status: 400 });

    // Compliance: nada anda sem consentimento LGPD, prescrição válida e rastreabilidade
    const blockReasons = await getOrderCreationBlockReasons(patientId, prescriptionId || null);
    if (blockReasons.length > 0) {
      return NextResponse.json(
        {
          error: 'Não é possível criar pedido: requisitos de compliance não atendidos.',
          blockReasons,
        },
        { status: 400 }
      );
    }

    const order = await prisma.erpOrder.create({
      data: {
        patientId,
        organizationId: organizationId || null,
        prescriptionId: prescriptionId || null,
        consultationId: consultationId || null,
        notes: notes?.trim() || null,
        status: 'PENDING',
      },
      include: {
        patient: { select: { id: true, name: true, email: true } },
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditAction.CREATE,
      entity: AuditEntity.ERP_ORDER,
      entityId: order.id,
      metadata: { patientId, prescriptionId: prescriptionId || null, organizationId: organizationId || null },
    });

    return NextResponse.json(order);
  } catch (e) {
    console.error('erp-canna order create:', e);
    return NextResponse.json({ error: 'Erro ao criar pedido' }, { status: 500 });
  }
}
