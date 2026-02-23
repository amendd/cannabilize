import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { formatPhoneNumber } from '@/lib/whatsapp';
import { getWhatsAppWelcomeMessage, getWhatsAppNextStepsMessage } from '@/lib/capture-funnel';
import { processIncomingMessage } from '@/lib/whatsapp-capture-flow';

/**
 * POST - Simula uma mensagem recebida no WhatsApp (fluxo de captação: nome, CPF, data, patologias, anamnese).
 * Só ADMIN. Body: { phone: string, messageBody?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const phoneRaw = body.phone;
    const messageBody = typeof body.messageBody === 'string' ? body.messageBody.trim() : 'Olá, gostaria de agendar';

    if (!phoneRaw || typeof phoneRaw !== 'string') {
      return NextResponse.json(
        { error: 'Envie "phone" no body (ex: +5579991269833)' },
        { status: 400 }
      );
    }

    const phone = formatPhoneNumber(phoneRaw);
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      process.env.APP_URL ||
      null;
    const { messagesToSend } = await processIncomingMessage(phone, messageBody, {
      getWelcomeMessage: getWhatsAppWelcomeMessage,
      getNextStepsMessage: getWhatsAppNextStepsMessage,
      origin: origin || undefined,
    });

    let sent = 0;
    let lastError: string | null = null;
    for (const m of messagesToSend) {
      if (m) {
        const result = await sendWhatsAppMessage({ to: phone, message: m });
        if (result.success) sent++; else lastError = result.error || null;
      }
    }

    return NextResponse.json({
      success: true,
      phone,
      messagesSent: sent,
      totalMessages: messagesToSend.length,
      error: lastError || undefined,
      message: sent === messagesToSend.length
        ? 'Fluxo executado: mensagens de captação enviadas. Verifique o WhatsApp.'
        : lastError
          ? `Enviadas ${sent}/${messagesToSend.length}. Erro: ${lastError}`
          : `Enviadas ${sent}/${messagesToSend.length}.`,
    });
  } catch (error) {
    console.error('[WhatsApp Simulate] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao simular' },
      { status: 500 }
    );
  }
}
