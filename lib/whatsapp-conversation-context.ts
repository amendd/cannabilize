/**
 * Contexto da conversa WhatsApp para o atendente: últimas mensagens do paciente.
 * Usado quando o atendente aceita o chamado (SIM) para que ele receba o histórico.
 */
import { prisma } from './prisma';

const DEFAULT_LIMIT = 10;

/**
 * Retorna as últimas N mensagens recebidas do paciente (logs do webhook com messageText).
 * Ordenadas da mais antiga para a mais recente (ordem cronológica para leitura).
 */
export async function getLastPatientMessages(
  patientPhone: string,
  limit: number = DEFAULT_LIMIT
): Promise<{ text: string; createdAt: Date }[]> {
  if (!patientPhone?.trim()) return [];
  const digits = patientPhone.replace(/\D/g, '');
  if (digits.length < 10) return [];

  const logs = await prisma.whatsAppWebhookLog.findMany({
    where: {
      fromMe: false,
      messageText: { not: null },
      phone: { in: [patientPhone, patientPhone.replace(/^\+/, ''), digits, `+${digits}`] },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { messageText: true, createdAt: true },
  });

  const list = logs
    .filter((l) => l.messageText && l.messageText.trim())
    .map((l) => ({ text: (l.messageText || '').trim(), createdAt: l.createdAt }));
  list.reverse();
  return list;
}

/**
 * Formata as últimas mensagens do paciente em um único texto para enviar ao atendente.
 */
export function formatConversationContext(messages: { text: string; createdAt: Date }[]): string {
  if (messages.length === 0) return '';
  const lines = messages.map((m, i) => {
    const time = m.createdAt.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${i + 1}. [${time}] Paciente: ${m.text}`;
  });
  return '📋 *Contexto da conversa* (últimas mensagens do paciente):\n\n' + lines.join('\n');
}
