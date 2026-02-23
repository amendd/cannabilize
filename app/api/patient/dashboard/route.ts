import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const CONSULTATIONS_LIMIT = 100;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    let patientId: string;

    if (session.user.role === 'PATIENT') {
      patientId = session.user.id;
    } else if (session.user.role === 'ADMIN') {
      const { searchParams } = new URL(request.url);
      const impersonatedPatientId = searchParams.get('patientId');
      patientId = impersonatedPatientId || session.user.id;
    } else {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    if (session.user.role === 'PATIENT' && patientId !== session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const [consultations, invitesResult] = await Promise.all([
      prisma.consultation.findMany({
        where: { patientId },
        include: {
          doctor: true,
          prescription: true,
          payment: true,
        },
        orderBy: { scheduledAt: 'desc' },
        take: CONSULTATIONS_LIMIT,
      }),
      prisma.consultationRescheduleInvite.findMany({
        where: {
          patientId,
          status: 'PENDING',
          expiresAt: { gt: new Date() },
        },
        include: {
          consultation: {
            select: { id: true, status: true, scheduledAt: true },
          },
          doctor: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const invites = invitesResult.map((invite) => ({
      id: invite.id,
      consultationId: invite.consultationId,
      currentScheduledAt: invite.currentScheduledAt.toISOString(),
      newScheduledAt: invite.newScheduledAt.toISOString(),
      newScheduledDate: invite.newScheduledDate,
      newScheduledTime: invite.newScheduledTime,
      message: invite.message,
      status: invite.status,
      expiresAt: invite.expiresAt.toISOString(),
      respondedAt: invite.respondedAt?.toISOString() || null,
      createdAt: invite.createdAt.toISOString(),
      doctor: invite.doctor,
      consultation: invite.consultation,
    }));

    return NextResponse.json(
      { consultations, invites },
      {
        headers: {
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=15',
        },
      }
    );
  } catch (error) {
    console.error('Erro ao buscar dashboard do paciente:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar dashboard' },
      { status: 500 }
    );
  }
}
