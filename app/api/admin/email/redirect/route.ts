import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const redirectConfigSchema = z.object({
  enabled: z.boolean(),
  email: z.string().email().optional(),
});

// GET - Buscar configuração de redirecionamento
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const redirectConfig = await prisma.systemConfig.findUnique({
      where: { key: 'EMAIL_REDIRECT_TO' },
    });

    const enabled = redirectConfig !== null && redirectConfig.value.trim() !== '';
    const email = enabled ? redirectConfig.value.trim() : null;

    return NextResponse.json({
      enabled,
      email,
    });
  } catch (error) {
    console.error('Erro ao buscar configuração de redirecionamento:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configuração' },
      { status: 500 }
    );
  }
}

// POST - Salvar configuração de redirecionamento
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
    const { enabled, email } = redirectConfigSchema.parse(body);

    if (enabled && !email) {
      return NextResponse.json(
        { error: 'Email é obrigatório quando o redirecionamento está ativado' },
        { status: 400 }
      );
    }

    if (enabled && email) {
      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Email inválido' },
          { status: 400 }
        );
      }

      await prisma.systemConfig.upsert({
        where: { key: 'EMAIL_REDIRECT_TO' },
        update: { value: email.trim() },
        create: {
          key: 'EMAIL_REDIRECT_TO',
          value: email.trim(),
        },
      });
    } else {
      // Desabilitar: remover configuração
      await prisma.systemConfig.deleteMany({
        where: { key: 'EMAIL_REDIRECT_TO' },
      });
    }

    return NextResponse.json({
      success: true,
      message: enabled 
        ? `Todos os emails serão redirecionados para ${email}`
        : 'Redirecionamento de emails desativado',
      enabled,
      email: enabled ? email : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao salvar configuração de redirecionamento:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar configuração' },
      { status: 500 }
    );
  }
}
