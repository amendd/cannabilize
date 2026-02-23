import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canAccessIfp } from '@/lib/ifp-permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canAccessIfp(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const period = searchParams.get('period') || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {};
    if (status && status !== 'ALL') where.status = status;

    if (period && period !== 'all') {
      const now = new Date();
      let dateFrom: Date;
      if (period === 'month') {
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (period === 'year') {
        dateFrom = new Date(now.getFullYear(), 0, 1);
      } else {
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      where.OR = [
        { paidAt: { gte: dateFrom, lte: now } },
        { createdAt: { gte: dateFrom, lte: now } },
      ];
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          patient: { select: { id: true, name: true, email: true } },
          consultation: { select: { id: true, scheduledAt: true, status: true } },
          erpOrder: {
            select: { id: true, status: true, createdAt: true },
            include: { organization: { select: { name: true } } },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return NextResponse.json({
      transactions: payments,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('IFP CANNA transactions:', error);
    return NextResponse.json(
      { error: 'Erro ao listar transações' },
      { status: 500 }
    );
  }
}
