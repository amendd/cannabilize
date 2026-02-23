import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET - Retorna dados de gravação, transcrição e laudo da consulta (médico/admin).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const consultation = await prisma.consultation.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        doctorId: true,
        meetingPlatform: true,
        meetingId: true,
        recordingUrl: true,
        transcriptText: true,
        transcriptSyncedAt: true,
        laudoDraft: true,
        laudoGeneratedAt: true,
        anamnesis: true,
      },
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

    return NextResponse.json({
      recordingUrl: consultation.recordingUrl ?? null,
      transcriptText: consultation.transcriptText ?? null,
      transcriptSyncedAt: consultation.transcriptSyncedAt ?? null,
      laudoDraft: consultation.laudoDraft ?? null,
      laudoGeneratedAt: consultation.laudoGeneratedAt ?? null,
      hasRecording: !!consultation.recordingUrl,
      hasTranscript: !!consultation.transcriptText,
      hasLaudoDraft: !!consultation.laudoDraft,
      meetingPlatform: consultation.meetingPlatform,
      meetingId: consultation.meetingId,
    });
  } catch (error) {
    console.error('Erro ao obter gravação/transcrição:', error);
    return NextResponse.json(
      { error: 'Erro ao obter dados da gravação' },
      { status: 500 }
    );
  }
}
