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

    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ plans });
  } catch (error) {
    console.error('IFP subscription-plans GET:', error);
    return NextResponse.json(
      { error: 'Erro ao listar planos' },
      { status: 500 }
    );
  }
}
