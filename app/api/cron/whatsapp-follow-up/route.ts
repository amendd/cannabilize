import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { requireCronAuth } from '@/lib/cron-auth';

/**
 * Envia mensagens de retorno ao fluxo (agendadas ~10s após resposta da IA/FAQ).
 * Deve ser chamado a cada minuto (ex: Vercel Cron / crontab na VPS).
 * Em produção, CRON_SECRET é obrigatório (Authorization: Bearer CRON_SECRET).
 */
export async function GET(request: NextRequest) {
  try {
    const authError = requireCronAuth(request);
    if (authError) return authError;

    const now = new Date();
    const leads = await prisma.whatsAppLead.findMany({
      where: {
        pendingFollowUpMessage: { not: null },
        pendingFollowUpSendAt: { lte: now },
        robotPaused: false,
      },
      select: { id: true, phone: true, pendingFollowUpMessage: true },
    });

    let sent = 0;
    for (const lead of leads) {
      const message = lead.pendingFollowUpMessage?.trim();
      if (!message) continue;
      const result = await sendWhatsAppMessage({ to: lead.phone, message });
      if (result.success) sent++;
      else console.warn('[Cron WhatsApp follow-up] Falha ao enviar para', lead.phone, result.error);
      await prisma.whatsAppLead.update({
        where: { id: lead.id },
        data: { pendingFollowUpMessage: null, pendingFollowUpSendAt: null },
      });
    }

    return NextResponse.json({ ok: true, processed: leads.length, sent });
  } catch (err) {
    console.error('[Cron WhatsApp follow-up]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao processar' },
      { status: 500 }
    );
  }
}
