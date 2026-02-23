import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canAccessIfp, canReconcile } from '@/lib/ifp-permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canAccessIfp(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') || 'todos'; // 'todos' | 'com_vinculo' | 'sem_vinculo'

    // Pagamentos com paciente e vínculo consulta/pedido
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { id: true, name: true, email: true } },
        consultation: { select: { id: true, scheduledAt: true, status: true } },
        erpOrder: {
          select: { id: true, status: true, createdAt: true },
          include: { organization: { select: { name: true } } },
        },
      },
    });

    const comVinculoConsulta = payments.filter((p) => p.consultationId);
    const comVinculoPedido = payments.filter((p) => p.erpOrderId);
    const semVinculoPedido = payments.filter((p) => !p.erpOrderId && p.consultationId);

    // Pedidos sem pagamento vinculado
    const ordersSemPagamento = await prisma.erpOrder.findMany({
      where: { payment: null },
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { id: true, name: true, email: true } },
        consultation: { select: { id: true, scheduledAt: true } },
        organization: { select: { name: true } },
      },
    });

    let list: unknown[];
    if (tipo === 'sem_vinculo') {
      list = ordersSemPagamento.map((o) => ({
        tipo: 'pedido_sem_pagamento' as const,
        id: o.id,
        patient: o.patient,
        consultation: o.consultation,
        organization: o.organization,
        status: o.status,
        createdAt: o.createdAt,
      }));
    } else if (tipo === 'com_vinculo') {
      list = payments.filter((p) => p.erpOrderId || p.consultationId).map((p) => ({
        tipo: 'pagamento' as const,
        payment: p,
        patient: p.patient,
        consultation: p.consultation,
        erpOrder: p.erpOrder,
      }));
    } else {
      list = [
        ...payments.map((p) => ({
          tipo: 'pagamento' as const,
          payment: p,
          patient: p.patient,
          consultation: p.consultation,
          erpOrder: p.erpOrder,
        })),
        ...ordersSemPagamento.map((o) => ({
          tipo: 'pedido_sem_pagamento' as const,
          order: o,
          patient: o.patient,
          consultation: o.consultation,
          organization: o.organization,
          status: o.status,
          createdAt: o.createdAt,
        })),
      ];
    }

    return NextResponse.json({
      payments,
      ordersSemPagamento,
      resumo: {
        totalPagamentos: payments.length,
        comVinculoConsulta: comVinculoConsulta.length,
        comVinculoPedido: comVinculoPedido.length,
        pedidosSemPagamento: ordersSemPagamento.length,
      },
      list,
    });
  } catch (error) {
    console.error('IFP CANNA reconciliation:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar reconciliação' },
      { status: 500 }
    );
  }
}

/** POST: Conciliação manual — vincular pagamento a pedido/cobrança */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canReconcile(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { paymentId, erpOrderId } = body as { paymentId?: string; erpOrderId?: string };
    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId é obrigatório' }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { erpOrder: true },
    });
    if (!payment) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
    }
    if (payment.status !== 'PAID') {
      return NextResponse.json({ error: 'Apenas pagamentos com status PAID podem ser conciliados' }, { status: 400 });
    }

    const updateData: { erpOrderId?: string | null; reconciliationStatus: string; reconciledAt: Date; reconciledById: string } = {
      reconciliationStatus: 'RECONCILED',
      reconciledAt: new Date(),
      reconciledById: session.user.id!,
    };
    if (erpOrderId !== undefined) {
      if (erpOrderId) {
        const order = await prisma.erpOrder.findUnique({ where: { id: erpOrderId } });
        if (!order) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
        const existing = await prisma.payment.findFirst({ where: { erpOrderId } });
        if (existing && existing.id !== paymentId) {
          return NextResponse.json({ error: 'Este pedido já possui um pagamento vinculado' }, { status: 400 });
        }
        updateData.erpOrderId = erpOrderId;
      } else {
        updateData.erpOrderId = null;
      }
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: updateData,
    });

    const { createAuditLog, AuditAction, AuditEntity } = await import('@/lib/audit');
    await createAuditLog({
      userId: session.user.id,
      action: AuditAction.RECONCILE,
      entity: AuditEntity.RECONCILIATION,
      entityId: paymentId,
      metadata: { erpOrderId: updateData.erpOrderId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('IFP CANNA reconciliation POST:', error);
    return NextResponse.json(
      { error: 'Erro ao conciliar' },
      { status: 500 }
    );
  }
}
