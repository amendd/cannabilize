import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendConsultationReminderEmail } from '@/lib/email';

/**
 * API route para processar lembretes de consulta.
 * Deve ser chamada por um cron job (ex: Vercel Cron, GitHub Actions, etc.)
 * ou agendada via sistema de filas.
 *
 * GET /api/admin/email/reminders?type=24H, ?type=2H ou ?type=NOW
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação (pode ser via API key em produção)
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const reminderType = searchParams.get('type') as '24H' | '2H' | 'NOW' | null;

    // Em produção, você pode usar uma API key em vez de sessão
    // const apiKey = request.headers.get('x-api-key');
    // if (apiKey !== process.env.CRON_SECRET) {
    //   return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    // }

    if (!reminderType || (reminderType !== '24H' && reminderType !== '2H' && reminderType !== 'NOW')) {
      return NextResponse.json(
        { error: 'Tipo de lembrete inválido. Use ?type=24H, ?type=2H ou ?type=NOW' },
        { status: 400 }
      );
    }

    const now = new Date();
    let targetTime: Date;
    let marginMs: number;

    if (reminderType === '24H') {
      // Consultas que acontecem em 24 horas (com margem de 1 hora)
      targetTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      marginMs = 60 * 60 * 1000; // 1h
    } else if (reminderType === '2H') {
      // Consultas que acontecem em 2 horas (com margem de 30 minutos)
      targetTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      marginMs = 30 * 60 * 1000; // 30min
    } else {
      // Consultas que acontecem agora (com margem de 15 minutos)
      targetTime = now;
      marginMs = 15 * 60 * 1000; // 15min
    }

    // Buscar consultas agendadas próximas ao horário alvo
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
      },
    });

    const results = {
      processed: 0,
      errors: 0,
      consultations: [] as Array<{ id: string; email: string; status: string }>,
    };

    for (const consultation of consultations) {
      if (!consultation.patient.email) {
        results.errors++;
        results.consultations.push({
          id: consultation.id,
          email: consultation.patient.email || 'sem email',
          status: 'skipped_no_email',
        });
        continue;
      }

      try {
        await sendConsultationReminderEmail({
          to: consultation.patient.email,
          patientName: consultation.patient.name,
          consultationDateTime: consultation.scheduledAt,
          meetingLink: consultation.meetingLink || null,
          reminderType,
        });

        results.processed++;
        results.consultations.push({
          id: consultation.id,
          email: consultation.patient.email,
          status: 'sent',
        });
      } catch (error) {
        results.errors++;
        results.consultations.push({
          id: consultation.id,
          email: consultation.patient.email,
          status: `error: ${error instanceof Error ? error.message : 'unknown'}`,
        });
        console.error(
          `Erro ao enviar lembrete para consulta ${consultation.id}:`,
          error
        );
      }
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
