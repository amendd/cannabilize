import { NextRequest, NextResponse } from 'next/server';
import { expirePendingInvites } from '@/lib/reschedule-invites';
import { sendRescheduleInviteExpiredEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { requireCronAuth } from '@/lib/cron-auth';

/**
 * Job para expirar convites pendentes que passaram de 5 minutos
 * Deve ser chamado periodicamente (ex: a cada minuto via cron)
 * Em produção, CRON_SECRET é obrigatório (Authorization: Bearer CRON_SECRET).
 *
 * Vercel: vercel.json crons. VPS: crontab com curl -H "Authorization: Bearer $CRON_SECRET"
 */
export async function POST(request: NextRequest) {
  try {
    const authError = requireCronAuth(request);
    if (authError) return authError;

    // Expirar convites pendentes
    const expiredCount = await expirePendingInvites();

    // Buscar convites que acabaram de expirar para notificar médicos
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const expiredInvites = await prisma.consultationRescheduleInvite.findMany({
      where: {
        status: 'EXPIRED',
        expiresAt: {
          gte: fiveMinutesAgo,
          lt: now,
        },
      },
      include: {
        consultation: {
          include: {
            patient: true,
            doctor: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    // Enviar emails de notificação aos médicos (não bloqueia)
    for (const invite of expiredInvites) {
      if (invite.consultation.doctor?.user?.email) {
        sendRescheduleInviteExpiredEmail({
          to: invite.consultation.doctor.user.email,
          doctorName: invite.consultation.doctor.name,
          patientName: invite.consultation.patient.name,
          newDateTime: invite.newScheduledAt,
        }).catch(error => {
          console.error('Erro ao enviar email de convite expirado:', error);
        });
      }
    }

    return NextResponse.json({
      success: true,
      expiredCount,
      notifiedDoctors: expiredInvites.length,
    });
  } catch (error) {
    console.error('Erro ao expirar convites:', error);
    return NextResponse.json(
      { error: 'Erro ao expirar convites' },
      { status: 500 }
    );
  }
}

// GET para permitir chamada manual (útil para testes)
export async function GET(request: NextRequest) {
  return POST(request);
}
