import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET - Lista notificações do usuário (não lidas primeiro).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20', 10) || 20);

    const where: { userId: string; readAt?: null } = { userId: session.user.id };
    if (unreadOnly) where.readAt = null;

    const notifications = await (prisma as any).notification
      .findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
      .catch(() => []);

    const unreadCount = await (prisma as any).notification
      .count({ where: { userId: session.user.id, readAt: null } })
      .catch(() => 0);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('[notifications]', error);
    return NextResponse.json({ error: 'Erro ao listar notificações' }, { status: 500 });
  }
}
