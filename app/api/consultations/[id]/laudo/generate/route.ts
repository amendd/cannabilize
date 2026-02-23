import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateLaudoDraft, isLaudoAiAvailable } from '@/lib/laudo-ai';

/**
 * POST - Gera rascunho de laudo médico por IA a partir da transcrição da consulta (médico/admin).
 * Requer OPENAI_API_KEY. O laudo é um rascunho para o médico revisar e assinar.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (!isLaudoAiAvailable()) {
      return NextResponse.json(
        { error: 'Geração de laudo por IA não configurada. Configure OPENAI_API_KEY no servidor.' },
        { status: 503 }
      );
    }

    const consultation = await prisma.consultation.findUnique({
      where: { id: params.id },
      include: { patient: true, doctor: true },
    });

    if (!consultation) {
      return NextResponse.json({ error: 'Consulta não encontrada' }, { status: 404 });
    }

    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (!doctor || consultation.doctorId !== doctor.id) {
        return NextResponse.json({ error: 'Não autorizado a esta consulta' }, { status: 403 });
      }
    }

    const transcript = consultation.transcriptText?.trim();
    if (!transcript) {
      return NextResponse.json(
        { error: 'Não há transcrição para esta consulta. Encerre a chamada e sincronize a gravação (Zoom) primeiro.' },
        { status: 400 }
      );
    }

    const laudo = await generateLaudoDraft({
      transcript,
      patientName: consultation.patient?.name ?? consultation.name ?? undefined,
      doctorName: consultation.doctor?.name,
      anamnesisSummary: consultation.anamnesis ?? undefined,
    });

    await prisma.consultation.update({
      where: { id: params.id },
      data: {
        laudoDraft: laudo,
        laudoGeneratedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      laudoDraft: laudo,
      message: 'Rascunho do laudo gerado. Revise e edite antes de usar.',
    });
  } catch (error) {
    console.error('Erro ao gerar laudo:', error);
    const message = error instanceof Error ? error.message : 'Erro ao gerar laudo';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET - Verifica se a geração de laudo por IA está disponível.
 */
export async function GET() {
  return NextResponse.json({
    available: isLaudoAiAvailable(),
    message: isLaudoAiAvailable()
      ? 'OPENAI_API_KEY configurada.'
      : 'Configure OPENAI_API_KEY para gerar laudos por IA.',
  });
}
