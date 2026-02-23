/**
 * Traduções de status para exibição ao usuário (área do paciente e outras).
 */

export const consultationStatusLabel: Record<string, string> = {
  SCHEDULED: 'Agendada',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'Não compareceu',
};

export const paymentStatusLabel: Record<string, string> = {
  PENDING: 'Pendente',
  PROCESSING: 'Processando',
  PAID: 'Pago',
  FAILED: 'Falhou',
  REFUNDED: 'Reembolsado',
  CANCELLED: 'Cancelado',
};

export function getConsultationStatusLabel(status: string): string {
  return consultationStatusLabel[status] ?? status;
}

export function getPaymentStatusLabel(status: string): string {
  return paymentStatusLabel[status] ?? status;
}
