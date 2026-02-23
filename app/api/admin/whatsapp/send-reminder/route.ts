import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { getReminderMessageForState } from '@/lib/whatsapp-reminder-messages';
import { loadReminderMessages } from '@/lib/whatsapp-reminder-config';

/**
 * POST - Envia lembrete por WhatsApp para um ou mais leads (que ainda não têm consulta).
 * Body:
 *   - leadIds: string[] (obrigatório)
 *   - message?: string — se informado, envia esta mensagem para todos
 *   - useTemplateByStage?: boolean — se true e message não informado, usa mensagem padrão por etapa
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const leadIds = body?.leadIds;
    const customMessage = typeof body?.message === 'string' ? body.message.trim() : undefined;
    const useTemplateByStage = Boolean(body?.useTemplateByStage);

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: 'Informe leadIds (array de IDs).' },
        { status: 400 }
      );
    }

    const leads = await prisma.whatsAppLead.findMany({
      where: {
        id: { in: leadIds },
        consultationId: null,
      },
      select: {
        id: true,
        phone: true,
        name: true,
        flowState: true,
      },
    });

    if (leads.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum lead encontrado ou todos já possuem consulta.' },
        { status: 400 }
      );
    }

    const reminderMessages = useTemplateByStage ? await loadReminderMessages() : null;

    let sent = 0;
    const errors: { leadId: string; error: string }[] = [];

    for (const lead of leads) {
      const text = customMessage
        ? customMessage
        : useTemplateByStage && reminderMessages
        ? getReminderMessageForState(
            lead.flowState || 'WELCOME',
            lead.name,
            reminderMessages
          )
        : getReminderMessageForState('WELCOME', lead.name);

      const result = await sendWhatsAppMessage({
        to: lead.phone,
        message: text,
      });

      if (result.success) {
        sent++;
      } else {
        errors.push({ leadId: lead.id, error: result.error || 'Falha ao enviar' });
      }
    }

    return NextResponse.json({
      ok: true,
      total: leads.length,
      sent,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error('[admin whatsapp send-reminder]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao enviar lembretes' },
      { status: 500 }
    );
  }
}
