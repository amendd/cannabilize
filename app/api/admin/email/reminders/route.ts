import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendConsultationReminderEmail } from '@/lib/email';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import {
  getConsultationReminder24hMessage,
  getConsultationReminder2hMessage,
  getConsultationReminder1hMessage,
  getConsultationReminder10minMessage,
} from '@/lib/whatsapp-templates';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

const VALID_REMINDER_TYPES = ['24H', '2H', '1H', '10MIN', 'NOW'] as const;
type ReminderType = (typeof VALID_REMINDER_TYPES)[number];

function isCronAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  if (auth === `Bearer ${secret}`) return true;
  const url = new URL(request.url);
  return url.searchParams.get('secret') === secret;
}

/**
 * API route para processar lembretes de consulta (email e WhatsApp).
 * Pode ser chamada por cron (Authorization: Bearer CRON_SECRET) ou por admin logado.
 *
 * GET /api/admin/email/reminders?type=24H | 2H | 1H | 10MIN | NOW
 */
export async function GET(request: NextRequest) {
  try {
    const cronAuth = isCronAuthorized(request);
    const session = await getServerSession(authOptions);
    if (!cronAuth && (!session || session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reminderType = searchParams.get('type') as ReminderType | null;

    if (!reminderType || !VALID_REMINDER_TYPES.includes(reminderType)) {
      return NextResponse.json(
        { error: 'Tipo de lembrete inválido. Use ?type=24H, ?type=2H, ?type=1H, ?type=10MIN ou ?type=NOW' },
        { status: 400 }
      );
    }

    const now = new Date();
    let targetTime: Date;
    let marginMs: number;

    if (reminderType === '24H') {
      targetTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      marginMs = 60 * 60 * 1000;
    } else if (reminderType === '2H') {
      targetTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      marginMs = 30 * 60 * 1000;
    } else if (reminderType === '1H') {
      targetTime = new Date(now.getTime() + 60 * 60 * 1000);
      marginMs = 20 * 60 * 1000; // 20 min
    } else if (reminderType === '10MIN') {
      targetTime = new Date(now.getTime() + 10 * 60 * 1000);
      marginMs = 5 * 60 * 1000; // 5 min
    } else {
      targetTime = now;
      marginMs = 15 * 60 * 1000;
    }

    const startTime = new Date(targetTime.getTime() - marginMs);
    const endTime = new Date(targetTime.getTime() + marginMs);

    const consultations = await prisma.consultation.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: {
          gte: startTime,
          lte: endTime,
        },
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    const results = {
      processed: 0,
      errors: 0,
      consultations: [] as Array<{ id: string; email: string; status: string }>,
    };

    const consultationData = (c: (typeof consultations)[0]) => ({
      patientName: c.patient.name,
      doctorName: c.doctor?.name || 'Médico',
      date: format(c.scheduledAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
      time: c.scheduledTime || format(c.scheduledAt, 'HH:mm'),
      meetingLink: c.meetingLink ?? undefined,
      platform: c.meetingPlatform ?? undefined,
    });

    for (const consultation of consultations) {
      const statuses: string[] = [];

      if (consultation.patient.email) {
        try {
          await sendConsultationReminderEmail({
            to: consultation.patient.email,
            patientName: consultation.patient.name,
            consultationDateTime: consultation.scheduledAt,
            meetingLink: consultation.meetingLink || null,
            reminderType,
          });
          statuses.push('email:sent');
          results.processed++;
        } catch (error) {
          statuses.push(`email:${error instanceof Error ? error.message : 'error'}`);
          results.errors++;
          console.error(`Erro lembrete email consulta ${consultation.id}:`, error);
        }
      } else {
        statuses.push('email:skipped_no_email');
      }

      const sendWhatsAppForType = ['24H', '2H', '1H', '10MIN'].includes(reminderType);
      if (consultation.patient.phone && sendWhatsAppForType) {
        try {
          const data = consultationData(consultation);
          const message =
            reminderType === '24H'
              ? getConsultationReminder24hMessage(data)
              : reminderType === '2H'
              ? getConsultationReminder2hMessage(data)
              : reminderType === '1H'
              ? getConsultationReminder1hMessage(data)
              : getConsultationReminder10minMessage(data);
          await sendWhatsAppMessage({ to: consultation.patient.phone, message });
          statuses.push('whatsapp:sent');
          if (!statuses.includes('email:sent')) results.processed++;
        } catch (error) {
          statuses.push(`whatsapp:${error instanceof Error ? error.message : 'error'}`);
          results.errors++;
          console.error(`Erro lembrete WhatsApp consulta ${consultation.id}:`, error);
        }
      }

      results.consultations.push({
        id: consultation.id,
        email: consultation.patient.email || 'sem email',
        status: statuses.join(', '),
      });
    }

    return NextResponse.json({
      success: true,
      reminderType,
      total: consultations.length,
      ...results,
    });
  } catch (error) {
    console.error('Erro ao processar lembretes de consulta:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao processar lembretes de consulta',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
