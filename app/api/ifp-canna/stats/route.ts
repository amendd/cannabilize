import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canAccessIfp } from '@/lib/ifp-permissions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canAccessIfp(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Total recebido (PAID)
    const paidAgg = await prisma.payment.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true },
      _count: { id: true },
    });
    const totalRecebido = paidAgg._sum.amount ?? 0;
    const totalTransacoesPagas = paidAgg._count.id ?? 0;

    // Pendente (PENDING + PROCESSING)
    const pendingAgg = await prisma.payment.aggregate({
      where: { status: { in: ['PENDING', 'PROCESSING'] } },
      _sum: { amount: true },
      _count: { id: true },
    });
    const totalPendente = pendingAgg._sum.amount ?? 0;
    const totalTransacoesPendentes = pendingAgg._count.id ?? 0;

    // Receita no mês
    const monthAgg = await prisma.payment.aggregate({
      where: {
        status: 'PAID',
        paidAt: { gte: startOfMonth, lte: now },
      },
      _sum: { amount: true },
      _count: { id: true },
    });
    const receitaMes = monthAgg._sum.amount ?? 0;
    const transacoesMes = monthAgg._count.id ?? 0;

    // Receita no ano
    const yearAgg = await prisma.payment.aggregate({
      where: {
        status: 'PAID',
        paidAt: { gte: startOfYear, lte: now },
      },
      _sum: { amount: true },
    });
    const receitaAno = yearAgg._sum.amount ?? 0;

    // Repasses: total pago aos médicos
    const payoutsPaid = await prisma.doctorPayout.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true },
    });
    const totalRepassesEfetuados = payoutsPaid._sum.amount ?? 0;

    // Repasses pendentes (REQUESTED, PROCESSING)
    const payoutsPending = await prisma.doctorPayout.aggregate({
      where: { status: { in: ['REQUESTED', 'PROCESSING'] } },
      _sum: { amount: true },
      _count: { id: true },
    });
    const repassesPendentesValor = payoutsPending._sum.amount ?? 0;
    const repassesPendentesQtd = payoutsPending._count.id ?? 0;

    // Pedidos sem pagamento vinculado (para reconciliação)
    const ordersCount = await prisma.erpOrder.count();
    const ordersWithPayment = await prisma.erpOrder.count({
      where: { payment: { isNot: null } },
    });
    const ordersSemPagamento = ordersCount - ordersWithPayment;

    // Pagamentos com status CHARGEBACK ou falha (para alertas)
    const chargebackCount = await prisma.payment.count({
      where: { status: 'CHARGEBACK' },
    });
    const failedCount = await prisma.payment.count({
      where: { status: 'FAILED' },
    });
    const unreconciledCount = await prisma.payment.count({
      where: { status: 'PAID', reconciliationStatus: { not: 'RECONCILED' } },
    });

    return NextResponse.json({
      totalRecebido,
      totalTransacoesPagas,
      totalPendente,
      totalTransacoesPendentes,
      receitaMes,
      transacoesMes,
      receitaAno,
      totalRepassesEfetuados,
      repassesPendentesValor,
      repassesPendentesQtd,
      ordersCount,
      ordersWithPayment,
      ordersSemPagamento,
      chargebackCount,
      failedCount,
      unreconciledCount,
    });
  } catch (error) {
    console.error('IFP CANNA stats:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas IFP' },
      { status: 500 }
    );
  }
}
