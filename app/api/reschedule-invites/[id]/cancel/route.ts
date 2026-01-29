import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar convite
    const invite = await prisma.consultationRescheduleInvite.findUnique({
      where: { id: params.id },
      include: {
        doctor: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: 'Convite não encontrado' },
        { status: 404 }
      );
    }

    // Verificar permissão
    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
      });

      if (!doctor || invite.doctorId !== doctor.id) {
        return NextResponse.json(
          { error: 'Você não tem permissão para cancelar este convite' },
          { status: 403 }
        );
      }
    }

    // Verificar se está pendente
    if (invite.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Apenas convites pendentes podem ser cancelados' },
        { status: 400 }
      );
    }

    // Cancelar convite
    await prisma.consultationRescheduleInvite.update({
      where: { id: invite.id },
      data: {
        status: 'CANCELLED',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Convite cancelado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao cancelar convite:', error);
    return NextResponse.json(
      { error: 'Erro ao cancelar convite' },
      { status: 500 }
    );
  }
}
