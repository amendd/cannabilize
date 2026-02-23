import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { getReminderMessageForState } from '@/lib/whatsapp-reminder-messages';
import {
  loadReminderMessages,
  loadAutoReminderConfig,
} from '@/lib/whatsapp-reminder-config';
import { requireCronAuth } from '@/lib/cron-auth';

/**
 * Cron: envia lembretes automáticos para leads que estão inativos há X horas
 * e ainda não têm consulta. Respeita intervalo mínimo entre lembretes (dias).
 * Chamar periodicamente (ex.: a cada hora) com Authorization: Bearer CRON_SECRET.
 * Em produção, CRON_SECRET é obrigatório.
 */
export async function GET(request: NextRequest) {
  try {
    const authError = requireCronAuth(request);
    if (authError) return authError;

    const config = await loadAutoReminderConfig();
    if (!config.enabled) {
      return NextResponse.json({
        ok: true,
        sent: 0,
        reason: 'auto_reminder_disabled',
      });
    }

    const now = new Date();
    const inactivityCutoff = new Date(
      now.getTime() - config.inactivityHours * 60 * 60 * 1000
    );
    const minIntervalCutoff = new Date(
      now.getTime() - config.minIntervalDays * 24 * 60 * 60 * 1000
    );

    const leads = await prisma.whatsAppLead.findMany({
      where: {
        consultationId: null,
        lastMessageAt: { not: null, lt: inactivityCutoff },
        OR: [
          { lastReminderAt: null },
          { lastReminderAt: { lt: minIntervalCutoff } },
        ],
      },
      select: {
        id: true,
        phone: true,
        name: true,
        flowState: true,
      },
    });

    if (leads.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, eligible: 0 });
    }

    const reminderMessages = await loadReminderMessages();
    let sent = 0;

    for (const lead of leads) {
      const text = getReminderMessageForState(
        lead.flowState || 'WELCOME',
        lead.name,
        reminderMessages
      );
      const result = await sendWhatsAppMessage({
        to: lead.phone,
        message: text,
      });
      if (result.success) {
        sent++;
        await prisma.whatsAppLead.update({
          where: { id: lead.id },
          data: { lastReminderAt: now },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      eligible: leads.length,
      sent,
    });
  } catch (err) {
    console.error('[Cron WhatsApp reminder-auto]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao processar' },
      { status: 500 }
    );
  }
}
