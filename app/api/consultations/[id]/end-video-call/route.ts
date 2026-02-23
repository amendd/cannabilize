import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST - Marcar que a chamada por vídeo foi encerrada (médico/admin).
 * Libera o botão de emitir receita para consultas com reunião por vídeo.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const consultation = await prisma.consultation.findUnique({
      where: { id: params.id },
      select: { id: true, doctorId: true, videoCallEndedAt: true },
    });

    if (!consultation) {
      return NextResponse.json({ error: 'Consulta não encontrada' }, { status: 404 });
    }

    if (session.user.role !== 'ADMIN') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });

      if (!doctor) {
        return NextResponse.json(
          { error: 'Médico não encontrado. Verifique se sua conta está vinculada a um médico.' },
          { status: 403 }
        );
      }

      if (consultation.doctorId && consultation.doctorId !== doctor.id) {
        return NextResponse.json(
          { error: 'Não autorizado a atualizar esta consulta.' },
          { status: 403 }
        );
      }
    }

    const updated = await prisma.consultation.update({
      where: { id: params.id },
      data: { videoCallEndedAt: new Date() },
      select: { id: true, videoCallEndedAt: true },
    });

    return NextResponse.json({
      success: true,
      videoCallEndedAt: updated.videoCallEndedAt,
      message: 'Chamada por vídeo marcada como encerrada. Você já pode emitir a receita.',
    });
  } catch (error: unknown) {
    console.error('Erro ao marcar chamada como encerrada:', error);

    const message = error instanceof Error ? error.message : '';
    const isMissingColumn =
      message.includes('video_call_ended_at') ||
      message.includes('no such column') ||
      message.includes('Unknown column');

    if (isMissingColumn) {
      return NextResponse.json(
        {
          error:
            'O banco de dados ainda não tem o campo de chamada encerrada. Execute no projeto: npx prisma db push',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Erro ao marcar chamada como encerrada',
        details: process.env.NODE_ENV === 'development' ? message : undefined,
      },
      { status: 500 }
    );
  }
}
