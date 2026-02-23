import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Buscar médico se for DOCTOR
    let doctorId: string | undefined;
    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
      });

      if (!doctor) {
        return NextResponse.json(
          { error: 'Médico não encontrado' },
          { status: 404 }
        );
      }

      doctorId = doctor.id;
    }

    const where: any = {};
    if (doctorId) {
      where.doctorId = doctorId;
    }
    if (status) {
      where.status = status;
    }

    const invites = await prisma.consultationRescheduleInvite.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        consultation: {
          select: {
            id: true,
            status: true,
            scheduledAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({
      invites: invites.map(invite => ({
        id: invite.id,
        consultationId: invite.consultationId,
        patient: invite.patient,
        currentScheduledAt: invite.currentScheduledAt.toISOString(),
        newScheduledAt: invite.newScheduledAt.toISOString(),
        newScheduledDate: invite.newScheduledDate,
        newScheduledTime: invite.newScheduledTime,
        status: invite.status,
        expiresAt: invite.expiresAt.toISOString(),
        respondedAt: invite.respondedAt?.toISOString() || null,
        createdAt: invite.createdAt.toISOString(),
        consultation: invite.consultation,
      })),
    });
  } catch (error) {
    console.error('Erro ao buscar convites do médico:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar convites' },
      { status: 500 }
    );
  }
}
