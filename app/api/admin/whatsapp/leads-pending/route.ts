import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET - Lista leads WhatsApp que ainda NÃO têm consulta (consultationId null).
 * Ou seja: iniciaram conversa mas pararam em alguma etapa antes de concluir agendamento/pagamento.
 * Query: flowState (opcional) - filtra por etapa do funil.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const flowState = request.nextUrl.searchParams.get('flowState')?.trim() || undefined;

    const where: { consultationId: null; flowState?: string } = {
      consultationId: null,
    };
    if (flowState) where.flowState = flowState;

    const leads = await prisma.whatsAppLead.findMany({
      where,
      select: {
        id: true,
        phone: true,
        name: true,
        flowState: true,
        lastMessageAt: true,
        createdAt: true,
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    return NextResponse.json({ leads });
  } catch (err) {
    console.error('[admin whatsapp leads-pending]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao listar leads' },
      { status: 500 }
    );
  }
}
