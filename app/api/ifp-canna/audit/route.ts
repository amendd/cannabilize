import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canAccessIfp, canViewAudit } from '@/lib/ifp-permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canViewAudit(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity') || ''; // Payment, Charge, Reconciliation
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {};
    const entities = ['Payment', 'Charge', 'Reconciliation'];
    if (entity && entities.includes(entity)) {
      where.entity = entity;
    } else if (entity === 'financial') {
      where.OR = [
        { entity: 'Payment' },
        { entity: 'Charge' },
        { entity: 'Reconciliation' },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({ logs, total, limit, offset });
  } catch (error) {
    console.error('IFP CANNA audit GET:', error);
    return NextResponse.json(
      { error: 'Erro ao listar logs de auditoria' },
      { status: 500 }
    );
  }
}
