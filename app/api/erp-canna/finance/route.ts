import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);

  try {
    const where = status && status !== 'ALL' ? { status } : {};
    const [payments, paidSum, pendingSum, countPaid] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          patient: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.payment.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: { in: ['PENDING', 'PROCESSING'] } },
        _sum: { amount: true },
      }),
      prisma.payment.count({ where: { status: 'PAID' } }),
    ]);

    return NextResponse.json({
      payments,
      summary: {
        totalPaid: paidSum._sum.amount ?? 0,
        totalPending: pendingSum._sum.amount ?? 0,
        countPaid,
      },
    });
  } catch (e) {
    console.error('erp-canna finance:', e);
    return NextResponse.json({ error: 'Erro ao listar financeiro' }, { status: 500 });
  }
}
