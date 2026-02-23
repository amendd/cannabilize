import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      console.log('Acesso negado - sem sessão');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Permitir acesso se for PATIENT ou ADMIN (modo impersonação)
    let patientId: string;
    
    if (session.user.role === 'PATIENT') {
      patientId = session.user.id;
    } else if (session.user.role === 'ADMIN') {
      // Se for admin, verificar se há um patientId nos query params (impersonação)
      const { searchParams } = new URL(request.url);
      const impersonatedPatientId = searchParams.get('patientId');
      
      if (impersonatedPatientId) {
        patientId = impersonatedPatientId;
        console.log('Admin visualizando convites do paciente:', patientId);
      } else {
        // Se admin não está impersonando, usar seu próprio ID (caso seja também paciente)
        patientId = session.user.id;
      }
    } else {
      console.log('Acesso negado - role:', session.user.role);
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    console.log('Buscando convites para paciente:', patientId);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // PENDING, ACCEPTED, REJECTED, EXPIRED

    const where: any = {
      patientId: patientId,
    };

    if (status) {
      where.status = status;
    } else {
      // Por padrão, mostrar apenas pendentes e não expirados
      where.status = 'PENDING';
      where.expiresAt = {
        gt: new Date(),
      };
    }

    console.log('Query where:', JSON.stringify(where, null, 2));

    const invites = await prisma.consultationRescheduleInvite.findMany({
      where,
      include: {
        consultation: {
          select: {
            id: true,
            status: true,
            scheduledAt: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Encontrados ${invites.length} convites para paciente ${patientId}`);

    return NextResponse.json({
      invites: invites.map(invite => ({
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
      })),
    });
  } catch (error) {
    console.error('Erro ao buscar convites do paciente:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar convites' },
      { status: 500 }
    );
  }
}
