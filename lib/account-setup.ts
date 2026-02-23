import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendAccountSetupEmail } from '@/lib/email';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { getAccountSetupMessage } from '@/lib/whatsapp-templates';

/**
 * Gera um token seguro para conclusão de cadastro
 */
export function generateSetupToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Cria um token de conclusão de cadastro e envia email e WhatsApp (se tiver telefone)
 */
export async function createAndSendSetupToken(
  userId: string,
  userEmail: string,
  userName: string,
  origin: string,
  userPhone?: string
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

  // Enviar WhatsApp de conclusão de cadastro (se tiver telefone)
  if (userPhone) {
    try {
      const message = await getAccountSetupMessage({ patientName: userName, setupUrl });
      await sendWhatsAppMessage({ to: userPhone, message });
    } catch (error) {
      console.error('Erro ao enviar WhatsApp de conclusão de cadastro:', error);
    }
  }
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
 * Define a senha do usuário usando o token.
 * Se email for informado, atualiza o email do usuário (desde que não esteja em uso por outra conta).
 * Retorna email e userId em caso de sucesso para login automático e redirecionamento.
 */
export async function setupPasswordWithToken(
  token: string,
  password: string,
  email?: string | null
): Promise<{ success: boolean; email?: string; userId?: string; error?: string }> {
  const validation = await validateSetupToken(token);

  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const user = await prisma.user.findUnique({
    where: { id: validation.userId! },
    select: { email: true },
  });
  if (!user?.email) {
    return { success: false, error: 'Usuário não encontrado' };
  }

  const emailTrimmed = email?.trim().toLowerCase();
  if (emailTrimmed) {
    const existing = await prisma.user.findFirst({
      where: {
        email: emailTrimmed,
        id: { not: validation.userId! },
      },
    });
    if (existing) {
      return { success: false, error: 'Este e-mail já está em uso por outra conta.' };
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const updateData: any = {
    password: hashedPassword,
    passwordChangedAt: new Date(),
    ...(emailTrimmed && { email: emailTrimmed }),
  };

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: validation.userId! },
        data: updateData,
      }),
      prisma.accountSetupToken.update({
        where: { token },
        data: { used: true },
      }),
    ]);
  } catch (error: any) {
    if (error?.message?.includes('no such column') ||
        error?.message?.includes('password_changed_at') ||
        error?.code === 'P2021') {
      delete updateData.passwordChangedAt;
      await prisma.$transaction([
        prisma.user.update({
          where: { id: validation.userId! },
          data: updateData,
        }),
        prisma.accountSetupToken.update({
          where: { token },
          data: { used: true },
        }),
      ]);
    } else {
      throw error;
    }
  }

  const finalEmail = emailTrimmed || user.email;
  return { success: true, email: finalEmail, userId: validation.userId! };
}
