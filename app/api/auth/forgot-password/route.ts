import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAndSendResetToken } from '@/lib/password-reset';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

/**
 * POST /api/auth/forgot-password
 * Solicita recuperação de senha
 * 
 * Por segurança, sempre retorna sucesso mesmo se o email não existir
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    const origin = new URL(request.url).origin;
    const result = await createAndSendResetToken(email, origin);

    // Sempre retornar sucesso (não revelar se email existe)
    return NextResponse.json({
      success: true,
      message: 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha em breve.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao solicitar recuperação de senha:', error);
    // Por segurança, ainda retornar sucesso
    return NextResponse.json({
      success: true,
      message: 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha em breve.',
    });
  }
}
