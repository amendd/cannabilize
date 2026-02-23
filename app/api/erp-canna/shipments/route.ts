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
    const shipments = await prisma.orderShipment.findMany({
      where,
      orderBy: { requestedAt: 'desc' },
      take: limit,
      include: {
        order: {
          select: {
            id: true,
            status: true,
            trackingCode: true,
            patient: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
    return NextResponse.json({ shipments });
  } catch (e) {
    console.error('erp-canna shipments:', e);
    return NextResponse.json({ error: 'Erro ao listar envios' }, { status: 500 });
  }
}
