import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { createAuditLog, AuditAction, AuditEntity } from '@/lib/audit';

const feedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

/**
 * GET - Verifica se o paciente já enviou feedback para esta consulta.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const feedback = await prisma.consultationFeedback.findUnique({
      where: { consultationId: params.id },
    });

    if (!feedback) {
      return NextResponse.json({ submitted: false });
    }

    if (feedback.patientId !== session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    return NextResponse.json({
      submitted: true,
      rating: feedback.rating,
      comment: feedback.comment,
      createdAt: feedback.createdAt,
    });
  } catch (error) {
    console.error('Erro ao buscar feedback:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar feedback' },
      { status: 500 }
    );
  }
}

/**
 * POST - Paciente envia avaliação de qualidade do atendimento (após consulta finalizada).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const consultation = await prisma.consultation.findUnique({
      where: { id: params.id },
      include: { feedback: true },
    });

    if (!consultation) {
      return NextResponse.json({ error: 'Consulta não encontrada' }, { status: 404 });
    }

    if (consultation.patientId !== session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    if (consultation.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Só é possível avaliar após a consulta ser finalizada.' },
        { status: 400 }
      );
    }

    if (consultation.feedback) {
      return NextResponse.json(
        { error: 'Você já enviou sua avaliação para esta consulta.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.errors },
        { status: 400 }
      );
    }

    await prisma.consultationFeedback.create({
      data: {
        consultationId: params.id,
        patientId: session.user.id,
        rating: parsed.data.rating,
        comment: parsed.data.comment || null,
      },
    });

    createAuditLog({
      userId: session.user.id,
      action: AuditAction.FEEDBACK,
      entity: 'ConsultationFeedback',
      entityId: params.id,
      metadata: { rating: parsed.data.rating },
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar feedback:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar avaliação' },
      { status: 500 }
    );
  }
}
