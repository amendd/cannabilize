// Integração com WhatsApp Business API
// Em produção, usar Evolution API, Twilio, ou WhatsApp Business API oficial

export interface WhatsAppMessage {
  to: string;
  message: string;
  template?: string;
  parameters?: string[];
}

export async function sendWhatsAppMessage(data: WhatsAppMessage): Promise<void> {
  // Em produção, implementar integração real
  console.log('WhatsApp enviado:', data);
  
  // Exemplo com Evolution API:
  // await fetch(`${WHATSAPP_API_URL}/message/sendText`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'apikey': process.env.WHATSAPP_API_KEY,
  //   },
  //   body: JSON.stringify({
  //     number: data.to,
  //     text: data.message,
  //   }),
  // });
}

export function getConsultationReminderMessage(
  patientName: string,
  consultationDate: Date,
  meetingLink?: string
): string {
  return `Olá ${patientName}! 

Lembrete: Sua consulta está agendada para ${new Date(consultationDate).toLocaleString('pt-BR')}.

${meetingLink ? `Link da consulta: ${meetingLink}` : ''}

Em caso de dúvidas, estamos à disposição.

CannaLize 💚`;
}

export function getPrescriptionNotificationMessage(patientName: string): string {
  return `Olá ${patientName}!

Sua receita médica foi emitida e está disponível na sua área do paciente.

Acesse: https://cannalize.com/paciente/receitas

CannaLize 💚`;
}

export function getPaymentReminderMessage(patientName: string, amount: number): string {
  return `Olá ${patientName}!

Você possui um pagamento pendente de R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.

Acesse sua área do paciente para realizar o pagamento: https://cannalize.com/paciente

CannaLize 💚`;
}
