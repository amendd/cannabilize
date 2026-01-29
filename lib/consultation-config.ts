import { prisma } from '@/lib/prisma';

export const CONSULTATION_DEFAULT_DURATION_MINUTES_KEY =
  'CONSULTATION_DEFAULT_DURATION_MINUTES';

export const MIN_ADVANCE_BOOKING_MINUTES_ONLINE_KEY =
  'MIN_ADVANCE_BOOKING_MINUTES_ONLINE';

export const MIN_ADVANCE_BOOKING_MINUTES_OFFLINE_KEY =
  'MIN_ADVANCE_BOOKING_MINUTES_OFFLINE';

export async function getDefaultConsultationDurationMinutes(): Promise<number> {
  try {
    const entry = await prisma.systemConfig.findUnique({
      where: { key: CONSULTATION_DEFAULT_DURATION_MINUTES_KEY },
    });

    if (!entry?.value) return 20;

    const parsed = Number(entry.value);
    if (!Number.isFinite(parsed) || parsed <= 0) return 20;

    // Guard rails
    return Math.max(10, Math.min(120, Math.round(parsed)));
  } catch {
    return 20;
  }
}

/**
 * Retorna a antecedência mínima (em minutos) para agendamentos quando médico está online
 * Padrão: 5 minutos
 */
export async function getMinAdvanceBookingMinutesOnline(): Promise<number> {
  try {
    const entry = await prisma.systemConfig.findUnique({
      where: { key: MIN_ADVANCE_BOOKING_MINUTES_ONLINE_KEY },
    });

    if (!entry?.value) return 5; // Padrão: 5 minutos

    const parsed = Number(entry.value);
    if (!Number.isFinite(parsed) || parsed < 0) return 5;

    // Guard rails: mínimo 0, máximo 1440 (24 horas)
    return Math.max(0, Math.min(1440, Math.round(parsed)));
  } catch {
    return 5;
  }
}

/**
 * Retorna a antecedência mínima (em minutos) para agendamentos quando médico está offline
 * Padrão: 120 minutos (2 horas)
 */
export async function getMinAdvanceBookingMinutesOffline(): Promise<number> {
  try {
    const entry = await prisma.systemConfig.findUnique({
      where: { key: MIN_ADVANCE_BOOKING_MINUTES_OFFLINE_KEY },
    });

    if (!entry?.value) return 120; // Padrão: 2 horas

    const parsed = Number(entry.value);
    if (!Number.isFinite(parsed) || parsed < 0) return 120;

    // Guard rails: mínimo 0, máximo 10080 (7 dias)
    return Math.max(0, Math.min(10080, Math.round(parsed)));
  } catch {
    return 120;
  }
}

