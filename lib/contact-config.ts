import { prisma } from './prisma';

export const CONTACT_PHONE_KEY = 'CONTACT_PHONE';
export const CONTACT_EMAIL_KEY = 'CONTACT_EMAIL';

/**
 * Telefone de contato da clínica.
 * SystemConfig ou env CONTACT_PHONE; fallback "(00) 00000-0000" apenas para dev.
 */
export async function getContactPhone(): Promise<string> {
  try {
    const entry = await prisma.systemConfig.findUnique({
      where: { key: CONTACT_PHONE_KEY },
    });
    if (entry?.value?.trim()) return entry.value.trim();
    return process.env.CONTACT_PHONE?.trim() || '(11) 99999-9999';
  } catch {
    return process.env.CONTACT_PHONE?.trim() || '(11) 99999-9999';
  }
}

/**
 * Email de contato da clínica.
 * SystemConfig ou env CONTACT_EMAIL; fallback env ou genérico.
 */
export async function getContactEmail(): Promise<string> {
  try {
    const entry = await prisma.systemConfig.findUnique({
      where: { key: CONTACT_EMAIL_KEY },
    });
    if (entry?.value?.trim()) return entry.value.trim();
    return process.env.CONTACT_EMAIL?.trim() || 'contato@cannabilizi.com.br';
  } catch {
    return process.env.CONTACT_EMAIL?.trim() || 'contato@cannabilizi.com.br';
  }
}
