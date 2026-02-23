import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { validateSetupToken, setupPasswordWithToken } from '@/lib/account-setup';

const setupPasswordSchema = z.object({
  token: z.string().min(1),
  email: z
    .string()
    .optional()
    .refine(v => !v || v.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), 'Informe um e-mail válido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token é obrigatório' },
        { status: 400 }
      );
    }

    const validation = await validateSetupToken(token);

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Token inválido' },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Erro ao validar token de setup:', error);
    return NextResponse.json(
      { error: 'Erro ao validar token' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = setupPasswordSchema.parse(body);
    const { token, password } = parsed;
    const email = typeof parsed.email === 'string' && parsed.email.trim() ? parsed.email.trim() : undefined;

    const result = await setupPasswordWithToken(token, password, email);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro ao definir senha' },
        { status: 400 }
      );
    }

    // Próxima consulta agendada do paciente para redirecionar à página da consulta
    let consultationId: string | null = null;
    if (result.userId) {
      const nextConsultation = await prisma.consultation.findFirst({
        where: {
          patientId: result.userId,
          status: 'SCHEDULED',
          scheduledAt: { gte: new Date() },
        },
        orderBy: { scheduledAt: 'asc' },
        select: { id: true },
      });
      consultationId = nextConsultation?.id ?? null;
    }

    return NextResponse.json({
      success: true,
      message: 'Senha definida com sucesso! Redirecionando...',
      email: result.email,
      consultationId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao definir senha:', error);
    return NextResponse.json(
      { error: 'Erro ao definir senha' },
      { status: 500 }
    );
  }
}
