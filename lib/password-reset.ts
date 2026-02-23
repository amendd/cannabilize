import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendPasswordResetEmail } from '@/lib/email';

/**
 * Gera um token seguro para recuperação de senha
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Cria um token de recuperação de senha e envia email
 */
export async function createAndSendResetToken(
  userEmail: string,
  origin: string
): Promise<{ success: boolean; error?: string }> {
  // Buscar usuário pelo email
  const user = await prisma.user.findUnique({
    where: { email: userEmail.toLowerCase() },
  });

  // Por segurança, sempre retornar sucesso (não revelar se email existe)
  if (!user) {
    return { success: true };
  }

  // Só permitir reset se o usuário já tem senha
  if (!user.password) {
    return { success: true }; // Não revelar que não tem senha
  }

  // Invalidar tokens anteriores não usados
  await prisma.passwordResetToken.updateMany({
    where: {
      userId: user.id,
      used: false,
    },
    data: {
      used: true,
    },
  });

  // Criar novo token (válido por 1 hora)
  const token = generateResetToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  // Enviar email com link de recuperação
  const resetUrl = `${origin}/recuperar-senha/${token}`;

  await sendPasswordResetEmail({
    to: user.email,
    userName: user.name,
    resetUrl,
  });

  return { success: true };
}

/**
 * Valida um token de recuperação de senha
 */
export async function validateResetToken(
  token: string
): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken) {
    return { valid: false, error: 'Token inválido' };
  }

  if (resetToken.used) {
    return { valid: false, error: 'Este link já foi usado' };
  }

  if (new Date() > resetToken.expiresAt) {
    return { valid: false, error: 'Este link expirou. Solicite um novo.' };
  }

  return { valid: true, userId: resetToken.userId };
}

/**
 * Define uma nova senha usando o token de recuperação
 */
export async function resetPasswordWithToken(
  token: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const validation = await validateResetToken(token);

  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Atualizar senha do usuário e marcar token como usado
  const updateData: any = {
    password: hashedPassword,
    passwordChangedAt: new Date(), // Será ignorado se campo não existir
  };
  
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: validation.userId! },
        data: updateData,
      }),
      prisma.passwordResetToken.update({
        where: { token },
        data: { used: true },
      }),
    ]);
  } catch (error: any) {
    // Se der erro de coluna não encontrada (passwordChangedAt), tentar sem ele
    if (error?.message?.includes('no such column') || 
        error?.message?.includes('password_changed_at') ||
        error?.code === 'P2021') {
      delete updateData.passwordChangedAt;
      await prisma.$transaction([
        prisma.user.update({
          where: { id: validation.userId! },
          data: updateData,
        }),
        prisma.passwordResetToken.update({
          where: { token },
          data: { used: true },
        }),
      ]);
    } else {
      throw error; // Re-lançar outros erros
    }
  }

  return { success: true };
}
