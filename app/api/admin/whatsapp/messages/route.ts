import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

/**
 * GET - Listar mensagens WhatsApp com paginação e filtros
 * Query: page, limit, status, to (número parcial), fromDate, toDate
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const status = searchParams.get('status') || undefined;
    const to = searchParams.get('to') || undefined;
    const fromDate = searchParams.get('fromDate') || undefined;
    const toDate = searchParams.get('toDate') || undefined;

    const where: any = {};
    if (status) where.status = status;
    if (to) where.to = { contains: to.replace(/\D/g, '') };
    if (fromDate) where.createdAt = { ...(where.createdAt as object || {}), gte: new Date(fromDate) };
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { ...(where.createdAt as object || {}), lte: end };
    }

    const [messages, total] = await Promise.all([
      prisma.whatsAppMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.whatsAppMessage.count({ where }),
    ]);

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erro ao listar mensagens WhatsApp:', error);
    return NextResponse.json(
      { error: 'Erro ao listar mensagens' },
      { status: 500 }
    );
  }
}

/**
 * POST - Enviar nova mensagem ou reenviar por id
 * Body: { to: string, message: string } para enviar nova
 * Body: { messageId: string } para reenviar
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { messageId, to, message } = body;

    if (to != null && message != null) {
      const phone = String(to).replace(/\D/g, '');
      if (!phone.length) {
        return NextResponse.json({ error: 'Número inválido' }, { status: 400 });
      }
      const formatted = phone.startsWith('55') ? phone : `55${phone}`;
      const result = await sendWhatsAppMessage({
        to: formatted,
        message: String(message).trim(),
      });
      return NextResponse.json(result);
    }

    if (!messageId) {
      return NextResponse.json({ error: 'Informe messageId (reenviar) ou to e message (enviar nova)' }, { status: 400 });
    }

    const msg = await prisma.whatsAppMessage.findUnique({
      where: { id: messageId },
    });
    if (!msg) {
      return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 });
    }

    const result = await sendWhatsAppMessage({
      to: msg.to,
      message: msg.message,
      template: msg.template || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao enviar/reenviar mensagem WhatsApp:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao enviar' },
      { status: 500 }
    );
  }
}
