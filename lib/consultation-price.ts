import { prisma } from './prisma';

export const CONSULTATION_DEFAULT_AMOUNT_KEY = 'CONSULTATION_DEFAULT_AMOUNT';

/**
 * Retorna o valor padrão da consulta (em reais).
 * Configurável via SystemConfig; fallback 50.0.
 */
export async function getConsultationDefaultAmount(): Promise<number> {
  try {
    const entry = await prisma.systemConfig.findUnique({
      where: { key: CONSULTATION_DEFAULT_AMOUNT_KEY },
    });
    if (!entry?.value) return 50;
    const parsed = Number(entry.value.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed < 0) return 50;
    return Math.round(parsed * 100) / 100;
  } catch {
    return 50;
  }
}
