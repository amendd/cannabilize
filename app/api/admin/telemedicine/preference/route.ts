import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const preferenceSchema = z.object({
  preferredPlatform: z.enum(['ZOOM', 'GOOGLE_MEET']).optional(),
});

// GET - Obter preferência de plataforma
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const config = await prisma.systemConfig.findUnique({
      where: { key: 'telemedicine_preferred_platform' },
    });

    return NextResponse.json({
      preferredPlatform: config?.value || null,
    });
  } catch (error) {
    console.error('Erro ao buscar preferência:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar preferência' },
      { status: 500 }
    );
  }
}

// POST - Salvar preferência de plataforma
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = preferenceSchema.parse(body);

    if (!data.preferredPlatform) {
      // Remover preferência se não fornecida
      await prisma.systemConfig.deleteMany({
        where: { key: 'telemedicine_preferred_platform' },
      });

      return NextResponse.json({
        message: 'Preferência removida',
        preferredPlatform: null,
      });
    }

    // Criar ou atualizar preferência
    const config = await prisma.systemConfig.upsert({
      where: { key: 'telemedicine_preferred_platform' },
      update: { value: data.preferredPlatform },
      create: {
        key: 'telemedicine_preferred_platform',
        value: data.preferredPlatform,
      },
    });

    return NextResponse.json({
      message: 'Preferência salva com sucesso',
      preferredPlatform: config.value,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao salvar preferência:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar preferência' },
      { status: 500 }
    );
  }
}
