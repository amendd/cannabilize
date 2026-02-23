import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ALLOWED = ['ZAPI', 'META', 'TWILIO'] as const;

/**
 * GET - Retorna o provedor padrão atual.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const row = await prisma.systemConfig.findUnique({
      where: { key: 'whatsapp_default_provider' },
    });
    const value = (row?.value || 'ZAPI').toUpperCase();
    const defaultProvider = (ALLOWED as readonly string[]).includes(value) ? value : 'ZAPI';
    return NextResponse.json({ defaultProvider });
  } catch (error) {
    console.error('Erro ao buscar provedor padrão WhatsApp:', error);
    return NextResponse.json({ error: 'Erro ao buscar configuração' }, { status: 500 });
  }
}

/**
 * POST - Define o provedor padrão para envio (body: { defaultProvider: 'ZAPI' | 'META' | 'TWILIO' }).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const body = await request.json();
    const raw = String(body?.defaultProvider || 'ZAPI').toUpperCase();
    if (!(ALLOWED as readonly string[]).includes(raw)) {
      return NextResponse.json(
        { error: 'Provedor inválido. Use ZAPI, META ou TWILIO.' },
        { status: 400 }
      );
    }
    await prisma.systemConfig.upsert({
      where: { key: 'whatsapp_default_provider' },
      create: { key: 'whatsapp_default_provider', value: raw },
      update: { value: raw },
    });
    return NextResponse.json({ defaultProvider: raw });
  } catch (error) {
    console.error('Erro ao salvar provedor padrão WhatsApp:', error);
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 });
  }
}
