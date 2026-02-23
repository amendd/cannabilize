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

    const subscriptions = await prisma.subscription.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { id: true, name: true, email: true } },
        plan: { select: { id: true, name: true, amount: true, interval: true } },
      },
    });
    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error('IFP subscriptions GET:', error);
    return NextResponse.json(
      { error: 'Erro ao listar assinaturas' },
      { status: 500 }
    );
  }
}
