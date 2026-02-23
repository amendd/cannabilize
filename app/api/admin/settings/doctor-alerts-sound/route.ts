import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const KEY = 'doctor_alerts_sound_enabled';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const config = await prisma.systemConfig.findUnique({
      where: { key: KEY },
    });

    const enabled = config?.value === 'true';
    return NextResponse.json({ enabled });
  } catch (error) {
    console.error('Erro ao buscar configuração de alertas sonoros:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configuração' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const enabled = body.enabled === true;

    await prisma.systemConfig.upsert({
      where: { key: KEY },
      update: { value: enabled ? 'true' : 'false' },
      create: { key: KEY, value: enabled ? 'true' : 'false' },
    });

    return NextResponse.json({ enabled });
  } catch (error) {
    console.error('Erro ao salvar configuração de alertas sonoros:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar configuração' },
      { status: 500 }
    );
  }
}
