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
  const search = searchParams.get('search')?.trim();
  const limit = Math.min(Number(searchParams.get('limit')) || 100, 200);

  try {
    const where: Record<string, unknown> = {};
    if (status && status !== 'ALL') where.status = status;
    if (search) {
      where.OR = [
        { patient: { name: { contains: search } } },
        { patient: { email: { contains: search } } },
        { doctor: { name: { contains: search } } },
      ];
    }

    const prescriptions = await prisma.prescription.findMany({
      where,
      orderBy: { issuedAt: 'desc' },
      take: limit,
      include: {
        patient: { select: { id: true, name: true, email: true } },
        doctor: { select: { id: true, name: true } },
        consultation: { select: { id: true } },
      },
    });

    return NextResponse.json({ prescriptions });
  } catch (e) {
    console.error('erp-canna prescriptions:', e);
    return NextResponse.json({ error: 'Erro ao listar prescrições' }, { status: 500 });
  }
}
