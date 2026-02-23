import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST - Pausa ou despausa o robô/fluxo automático para um número.
 * Enquanto pausado, o webhook não envia respostas automáticas (IA, fluxo, FAQ).
 * Body: { phone: string, paused: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const phoneParam = body?.phone ?? request.nextUrl.searchParams.get('phone');
    const paused = body?.paused ?? request.nextUrl.searchParams.get('paused') === 'true';
    if (!phoneParam || typeof phoneParam !== 'string') {
      return NextResponse.json({ error: 'Informe o número (phone).' }, { status: 400 });
    }

    const digits = phoneParam.replace(/\D/g, '');
    if (digits.length < 10) {
      return NextResponse.json({ error: 'Número inválido.' }, { status: 400 });
    }

    const lead = await prisma.whatsAppLead.findFirst({
      where: {
        OR: [
          { phone: { contains: digits } },
          { phone: digits.startsWith('55') ? `+${digits}` : `+55${digits}` },
          { phone: digits },
        ],
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    if (!lead) {
      return NextResponse.json({
        success: false,
        error: 'Nenhuma conversa encontrada para este número. Envie uma mensagem primeiro ou selecione outra conversa.',
      }, { status: 404 });
    }

    await prisma.whatsAppLead.update({
      where: { id: lead.id },
      data: { robotPaused: !!paused },
    });

    return NextResponse.json({
      success: true,
      paused: !!paused,
      message: paused
        ? 'Robô pausado. Respostas automáticas estão desativadas para este número até você despausar.'
        : 'Robô ativado. Respostas automáticas voltaram para este número.',
    });
  } catch (error) {
    console.error('[WhatsApp pause-robot]', error);
    return NextResponse.json(
      { error: 'Erro ao pausar/despausar robô' },
      { status: 500 }
    );
  }
}
