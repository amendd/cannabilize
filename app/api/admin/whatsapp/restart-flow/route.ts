import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST - Reinicia o fluxo de cadastro WhatsApp para um número (volta para pedido de nome).
 * Body: { phone: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const phoneParam = body?.phone ?? request.nextUrl.searchParams.get('phone');
    if (!phoneParam || typeof phoneParam !== 'string') {
      return NextResponse.json({ error: 'Informe o número (phone).' }, { status: 400 });
    }

    const digits = phoneParam.replace(/\D/g, '');
    if (digits.length < 10) {
      return NextResponse.json({ error: 'Número inválido.' }, { status: 400 });
    }

    const withPlus = digits.startsWith('55') ? `+${digits}` : `+55${digits}`;

    const updated = await prisma.whatsAppLead.updateMany({
      where: {
        OR: [
          { phone: { contains: digits } },
          { phone: withPlus },
          { phone: digits },
        ],
      },
      data: {
        flowState: 'ASK_NAME',
        lastMessageAt: new Date(),
        metadata: null,
        pendingFollowUpMessage: null,
        pendingFollowUpSendAt: null,
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum lead encontrado para este número. Na próxima mensagem do contato será iniciado um novo fluxo.',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Fluxo reiniciado. O contato voltará a receber o pedido de nome completo na próxima interação.',
    });
  } catch (error) {
    console.error('[WhatsApp restart-flow]', error);
    return NextResponse.json(
      { error: 'Erro ao reiniciar fluxo' },
      { status: 500 }
    );
  }
}
