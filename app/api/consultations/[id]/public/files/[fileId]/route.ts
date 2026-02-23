import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function parseDataUrl(dataUrl: string): { mimeType: string; bytes: Buffer } | null {
  const match = /^data:([^;]+);base64,([\s\S]*)$/.exec(dataUrl);
  if (!match) return null;
  const mimeType = match[1] || 'application/octet-stream';
  const base64 = match[2] || '';
  try {
    return { mimeType, bytes: Buffer.from(base64, 'base64') };
  } catch {
    return null;
  }
}

function buildContentDisposition(filename: string, asAttachment: boolean) {
  const type = asAttachment ? 'attachment' : 'inline';
  const safe = (filename || 'arquivo').replace(/[\r\n"]/g, '').trim() || 'arquivo';
  const encoded = encodeURIComponent(safe);
  return `${type}; filename="${safe}"; filename*=UTF-8''${encoded}`;
}

/**
 * GET - Visualizar/baixar arquivo público da consulta (pós-pagamento).
 * Sem autenticação, mas valida: consulta existe e pagamento está PAID.
 *
 * Query params:
 * - download=1 => força download
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const consultation = await prisma.consultation.findUnique({
      where: { id: params.id },
      include: { payment: true },
    });

    if (!consultation) {
      return NextResponse.json({ error: 'Consulta não encontrada' }, { status: 404 });
    }

    if (!consultation.payment || consultation.payment.status !== 'PAID') {
      return NextResponse.json({ error: 'Pagamento não confirmado' }, { status: 403 });
    }

    const file = await prisma.consultationFile.findUnique({
      where: { id: params.fileId },
      select: {
        id: true,
        consultationId: true,
        fileName: true,
        fileUrl: true,
      },
    });

    if (!file || file.consultationId !== consultation.id) {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 });
    }

    const parsed = parseDataUrl(file.fileUrl || '');
    if (!parsed) {
      return NextResponse.json({ error: 'Arquivo inválido' }, { status: 500 });
    }

    const asAttachment = request.nextUrl.searchParams.get('download') === '1';
    const headers = new Headers();
    headers.set('Content-Type', parsed.mimeType);
    headers.set('Content-Disposition', buildContentDisposition(file.fileName, asAttachment));
    headers.set('Cache-Control', 'private, no-store, max-age=0');

    return new NextResponse(new Uint8Array(parsed.bytes), { status: 200, headers });
  } catch (error) {
    console.error('Erro ao servir arquivo público:', error);
    return NextResponse.json({ error: 'Erro ao servir arquivo' }, { status: 500 });
  }
}

