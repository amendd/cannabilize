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
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {};
    if (status && status !== 'ALL') where.status = status;

    const [payouts, total] = await Promise.all([
      prisma.doctorPayout.findMany({
        where,
        orderBy: { requestedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          doctor: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.doctorPayout.count({ where }),
    ]);

    const agregado = await prisma.doctorPayout.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true },
    });

    return NextResponse.json({
      payouts,
      total,
      limit,
      offset,
      totalRepassesEfetuados: agregado._sum.amount ?? 0,
    });
  } catch (error) {
    console.error('IFP CANNA payouts:', error);
    return NextResponse.json(
      { error: 'Erro ao listar repasses' },
      { status: 500 }
    );
  }
}
