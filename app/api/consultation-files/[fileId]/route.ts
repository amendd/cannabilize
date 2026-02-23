import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function parseDataUrl(dataUrl: string): { mimeType: string; bytes: Buffer } | null {
  const match = /^data:([^;]+);base64,([\s\S]*)$/.exec(dataUrl);
  if (!match) return null;
  const mimeType = match[1] || 'application/octet-stream';
  const base64 = match[2] || '';
  try {
    const bytes = Buffer.from(base64, 'base64');
    return { mimeType, bytes };
  } catch {
    return null;
  }
}

function buildContentDisposition(filename: string, asAttachment: boolean) {
  const type = asAttachment ? 'attachment' : 'inline';
  const safe = (filename || 'arquivo').replace(/[\r\n"]/g, '').trim() || 'arquivo';
  const encoded = encodeURIComponent(safe);
  // filename*=UTF-8''... ajuda com acentos
  return `${type}; filename="${safe}"; filename*=UTF-8''${encoded}`;
}

/**
 * GET - Baixar/visualizar arquivo por ID (stream)
 *
 * Query params:
 * - download=1 => força download (Content-Disposition: attachment)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const file = await prisma.consultationFile.findUnique({
      where: { id: params.fileId },
      include: {
        consultation: {
          select: {
            id: true,
            patientId: true,
            doctorId: true,
          },
        },
      },
    });

    if (!file || !file.consultation) {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 });
    }

    const isAdmin = session.user.role === 'ADMIN';
    const isPatient = session.user.id === file.consultation.patientId;
    let isDoctor = false;

    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      isDoctor = doctor ? (file.consultation.doctorId === doctor.id || !file.consultation.doctorId) : false;
    }

    if (!isAdmin && !isPatient && !isDoctor) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const url = file.fileUrl || '';

    // Caso futuro: URL http(s) salva no banco
    if (/^https?:\/\//i.test(url)) {
      return NextResponse.redirect(url);
    }

    const parsed = parseDataUrl(url);
    if (!parsed) {
      return NextResponse.json({ error: 'Arquivo inválido' }, { status: 500 });
    }

    const asAttachment = request.nextUrl.searchParams.get('download') === '1';
    const headers = new Headers();
    headers.set('Content-Type', parsed.mimeType);
    headers.set('Content-Disposition', buildContentDisposition(file.fileName, asAttachment));
    headers.set('Cache-Control', 'private, no-store, max-age=0');

    return new NextResponse(parsed.bytes, { status: 200, headers });
  } catch (error) {
    console.error('Erro ao servir arquivo:', error);
    return NextResponse.json({ error: 'Erro ao servir arquivo' }, { status: 500 });
  }
}

