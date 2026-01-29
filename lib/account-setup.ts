import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendAccountSetupEmail } from '@/lib/email';

/**
 * Gera um token seguro para conclusão de cadastro
 */
export function generateSetupToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Cria um token de conclusão de cadastro e envia email
 */
export async function createAndSendSetupToken(
  userId: string,
  userEmail: string,
  userName: string,
  origin: string
): Promise<void> {
  // Invalidar tokens anteriores não usados
  await prisma.accountSetupToken.updateMany({
    where: {
      userId,
      used: false,
    },
    data: {
      used: true,
    },
  });

  // Criar novo token (válido por 7 dias)
  const token = generateSetupToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.accountSetupToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  // Enviar email com link de conclusão
  const setupUrl = `${origin}/concluir-cadastro?token=${token}`;

  await sendAccountSetupEmail({
    to: userEmail,
    patientName: userName,
    setupUrl,
  });
}

/**
 * Valida um token de conclusão de cadastro
 */
export async function validateSetupToken(
  token: string
): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const setupToken = await prisma.accountSetupToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!setupToken) {
    return { valid: false, error: 'Token inválido' };
  }

  if (setupToken.used) {
    return { valid: false, error: 'Este token já foi usado' };
  }

  if (new Date() > setupToken.expiresAt) {
    return { valid: false, error: 'Este token expirou' };
  }

  if (setupToken.user.password) {
    return { valid: false, error: 'Este usuário já possui senha cadastrada' };
  }

  return { valid: true, userId: setupToken.userId };
}

/**
 * Define a senha do usuário usando o token
 */
export async function setupPasswordWithToken(
  token: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const validation = await validateSetupToken(token);

  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Atualizar senha do usuário e marcar token como usado
  await prisma.$transaction([
    prisma.user.update({
      where: { id: validation.userId! },
      data: { password: hashedPassword },
    }),
    prisma.accountSetupToken.update({
      where: { token },
      data: { used: true },
    }),
  ]);

  return { success: true };
}
