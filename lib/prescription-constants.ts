/**
 * Status e constantes de prescrição - Gestão regulatória
 */

export const PRESCRIPTION_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  EXPIRING: 'EXPIRING',
  EXPIRED: 'EXPIRED',
  REPLACED: 'REPLACED',
  CANCELLED: 'CANCELLED',
  // Legado (mapear para exibição)
  ISSUED: 'ISSUED',
  USED: 'USED',
} as const;

export type PrescriptionStatusKey = keyof typeof PRESCRIPTION_STATUS;

export const PRESCRIPTION_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Ativa',
  EXPIRING: 'Vencendo',
  EXPIRED: 'Vencida',
  REPLACED: 'Substituída',
  CANCELLED: 'Cancelada',
  ISSUED: 'Emitida',
  USED: 'Utilizada',
};

/** Status que bloqueiam uso (pedido, etc.) */
export const BLOCKING_STATUSES = [PRESCRIPTION_STATUS.EXPIRED, PRESCRIPTION_STATUS.CANCELLED, PRESCRIPTION_STATUS.REPLACED];

/** Status considerados "ativas" para negócio */
export const ACTIVE_STATUSES = [PRESCRIPTION_STATUS.ACTIVE, PRESCRIPTION_STATUS.EXPIRING];

/** Dias para considerar "vencendo" (alertas) */
export const EXPIRING_DAYS = [7, 15, 30];
