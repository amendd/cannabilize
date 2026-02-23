import { prisma } from '@/lib/prisma';

export const CONSULTATION_DEFAULT_DURATION_MINUTES_KEY =
  'CONSULTATION_DEFAULT_DURATION_MINUTES';

export const MIN_ADVANCE_BOOKING_MINUTES_ONLINE_KEY =
  'MIN_ADVANCE_BOOKING_MINUTES_ONLINE';

export const MIN_ADVANCE_BOOKING_MINUTES_OFFLINE_KEY =
  'MIN_ADVANCE_BOOKING_MINUTES_OFFLINE';

/** Ativar/desativar a ferramenta de antecedência mínima para agendamentos */
export const MIN_ADVANCE_BOOKING_ENABLED_KEY = 'MIN_ADVANCE_BOOKING_ENABLED';

/** Ativar/desativar a ferramenta de adiantamento de consultas (convites) */
export const RESCHEDULE_INVITES_ENABLED_KEY = 'RESCHEDULE_INVITES_ENABLED';

/** Validade do convite de adiantamento em horas (ex: 24 = 24h) — usado se minutos não estiver definido */
export const RESCHEDULE_INVITE_EXPIRY_HOURS_KEY = 'RESCHEDULE_INVITE_EXPIRY_HOURS';

/** Validade do convite de adiantamento em minutos (ex: 5 = 5 min). Padrão: 5. Tem prioridade sobre horas. */
export const RESCHEDULE_INVITE_EXPIRY_MINUTES_KEY = 'RESCHEDULE_INVITE_EXPIRY_MINUTES';

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
 * Retorna se a ferramenta de antecedência mínima está ativada.
 * Quando desativada, o sistema não exige antecedência mínima.
 */
export async function getMinAdvanceBookingEnabled(): Promise<boolean> {
  try {
    const entry = await prisma.systemConfig.findUnique({
      where: { key: MIN_ADVANCE_BOOKING_ENABLED_KEY },
    });
    if (!entry?.value) return true; // Padrão: ativado
    return entry.value === 'true' || entry.value === '1';
  } catch {
    return true;
  }
}

/**
 * Retorna a antecedência mínima (em minutos) para agendamentos quando médico está online.
 * Se a ferramenta estiver desativada, retorna 0 (sem restrição).
 * Padrão: 30 minutos (médico online e aceita agendamento com 30 min)
 */
export async function getMinAdvanceBookingMinutesOnline(): Promise<number> {
  try {
    const enabled = await getMinAdvanceBookingEnabled();
    if (!enabled) return 0;

    const entry = await prisma.systemConfig.findUnique({
      where: { key: MIN_ADVANCE_BOOKING_MINUTES_ONLINE_KEY },
    });

    if (!entry?.value) return 30; // Padrão: 30 minutos

    const parsed = Number(entry.value);
    if (!Number.isFinite(parsed) || parsed < 0) return 30;

    // Guard rails: mínimo 0, máximo 1440 (24 horas)
    return Math.max(0, Math.min(1440, Math.round(parsed)));
  } catch {
    return 30;
  }
}

/**
 * Retorna a antecedência mínima (em minutos) para agendamentos quando médico está offline.
 * Se a ferramenta estiver desativada, retorna 0 (sem restrição).
 * Padrão: 120 minutos (2 horas)
 */
export async function getMinAdvanceBookingMinutesOffline(): Promise<number> {
  try {
    const enabled = await getMinAdvanceBookingEnabled();
    if (!enabled) return 0;

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

/**
 * Retorna se a ferramenta de adiantamento de consultas (convites) está ativada.
 */
export async function getRescheduleInvitesEnabled(): Promise<boolean> {
  try {
    const entry = await prisma.systemConfig.findUnique({
      where: { key: RESCHEDULE_INVITES_ENABLED_KEY },
    });
    if (!entry?.value) return true; // Padrão: ativado
    return entry.value === 'true' || entry.value === '1';
  } catch {
    return true;
  }
}

/**
 * Retorna a validade do convite de adiantamento em horas (ex: 24 = 24h).
 * Guard rails: mínimo 1h, máximo 168h (7 dias). Padrão: 24.
 */
export async function getRescheduleInviteExpiryHours(): Promise<number> {
  try {
    const entry = await prisma.systemConfig.findUnique({
      where: { key: RESCHEDULE_INVITE_EXPIRY_HOURS_KEY },
    });
    if (!entry?.value) return 24;
    const parsed = Number(entry.value);
    if (!Number.isFinite(parsed) || parsed <= 0) return 24;
    return Math.max(1, Math.min(168, Math.round(parsed)));
  } catch {
    return 24;
  }
}

/**
 * Retorna a validade do convite de adiantamento em minutos (ex: 5 = 5 min).
 * Se RESCHEDULE_INVITE_EXPIRY_MINUTES estiver definido, usa esse valor; senão 5 (alinhado à mensagem "5 minutos para responder").
 * Para manter compatibilidade: se existir apenas RESCHEDULE_INVITE_EXPIRY_HOURS (e não minutos), converte horas em minutos.
 */
export async function getRescheduleInviteExpiryMinutes(): Promise<number> {
  try {
    const entryMin = await prisma.systemConfig.findUnique({
      where: { key: RESCHEDULE_INVITE_EXPIRY_MINUTES_KEY },
    });
    if (entryMin?.value) {
      const parsed = Number(entryMin.value);
      if (Number.isFinite(parsed) && parsed > 0) {
        return Math.max(1, Math.min(10080, Math.round(parsed))); // 1 min a 7 dias
      }
    }
    // Padrão 5 minutos (mensagem do modal: "O paciente terá 5 minutos para responder")
    return 5;
  } catch {
    return 5;
  }
}

