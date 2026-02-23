import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ZoomService } from '@/lib/telemedicine/zoom';

/**
 * POST - Sincroniza gravação e transcrição do Zoom com a consulta (médico/admin).
 * Só funciona para consultas com meetingPlatform ZOOM e meetingId preenchido.
 * A gravação no Zoom pode levar alguns minutos após o fim da reunião para ficar disponível.
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

    const consultation = await prisma.consultation.findUnique({
      where: { id: params.id },
      include: { doctor: true },
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

    if (consultation.meetingPlatform !== 'ZOOM' || !consultation.meetingId) {
      return NextResponse.json(
        { error: 'Sincronização de gravação disponível apenas para reuniões Zoom. Esta consulta não usa Zoom ou não tem reunião criada.' },
        { status: 400 }
      );
    }

    const config = await prisma.telemedicineConfig.findFirst({
      where: { platform: 'ZOOM', enabled: true },
    });
    if (!config?.accountId || !config.clientId || !config.clientSecret) {
      return NextResponse.json(
        { error: 'Zoom não configurado ou desabilitado. Configure em Admin → Telemedicina.' },
        { status: 400 }
      );
    }

    const zoom = new ZoomService({
      accountId: config.accountId,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      accessToken: config.accessToken ?? undefined,
      tokenExpiresAt: config.tokenExpiresAt ?? undefined,
    });

    const recordings = await zoom.getMeetingRecordings(consultation.meetingId);

    let recordingUrl: string | null = recordings.recordingUrl ?? null;
    let transcriptText: string | null = null;

    if (recordings.transcriptUrl) {
      try {
        transcriptText = await zoom.downloadTranscriptFile(recordings.transcriptUrl);
      } catch (e) {
        console.warn('Transcrição Zoom não disponível ou falha no download:', e);
      }
    }

    // Se não houver share_url, usar o primeiro play_url de vídeo como link da gravação
    if (!recordingUrl && recordings.recordingFiles.length > 0) {
      const videoFile = recordings.recordingFiles.find(
        (f) => f.type === 'MP4' || f.type === 'M4A' || f.type === 'VIDEO'
      );
      if (videoFile?.downloadUrl) recordingUrl = videoFile.downloadUrl;
    }

    await prisma.consultation.update({
      where: { id: params.id },
      data: {
        recordingUrl,
        transcriptText,
        transcriptSyncedAt: transcriptText ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      recordingUrl,
      hasTranscript: !!transcriptText,
      message: recordingUrl
        ? 'Gravação e transcrição sincronizadas.'
        : 'Gravação ainda não disponível no Zoom. Tente novamente em alguns minutos.',
    });
  } catch (error) {
    console.error('Erro ao sincronizar gravação:', error);
    const message = error instanceof Error ? error.message : 'Erro ao sincronizar gravação';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
