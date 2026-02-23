// Templates de mensagens WhatsApp
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { generateMessage } from './whatsapp-templates-service';

export interface ConsultationData {
  patientName: string;
  doctorName: string;
  date: Date | string;
  time: string;
  meetingLink?: string;
  platform?: string;
}

export interface PaymentData {
  patientName: string;
  amount: number;
  date: Date | string;
  transactionId?: string;
  /** Resumo completo pós-pagamento: data/hora da consulta, link concluir cadastro, link página consulta */
  consultationScheduledAt?: Date | string;
  setupUrl?: string;
  consultationPageUrl?: string;
}

export interface PrescriptionData {
  patientName: string;
  doctorName: string;
  date: Date | string;
  medications?: string[];
}

/**
 * Template: Confirmação de Consulta Agendada
 * Usa template do banco se disponível, senão usa fallback
 */
export async function getConsultationConfirmedMessage(data: ConsultationData): Promise<string> {
  const dateStr = typeof data.date === 'string' 
    ? new Date(data.date).toLocaleDateString('pt-BR')
    : format(data.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  
  const fallbackTemplate = `📅 *Consulta Agendada com Sucesso!*

Olá {{patientName}}! Sua consulta foi confirmada:

👨‍⚕️ *Médico:* Dr. {{doctorName}}
📅 *Data:* {{date}}
⏰ *Horário:* {{time}}
{{#meetingLink}}🔗 *Link:* {{meetingLink}}{{/meetingLink}}

{{#platform}}💻 A consulta será realizada via {{platform}}.{{/platform}}

Em caso de dúvidas, estamos à disposição.

CannabiLizi 💚`;

  return generateMessage('CONSULTATION_CONFIRMED', {
    patientName: data.patientName,
    doctorName: data.doctorName,
    date: dateStr,
    time: data.time,
    meetingLink: data.meetingLink,
    platform: data.platform,
  }, fallbackTemplate);
}

/**
 * Template: Lembrete de Consulta (24h antes)
 */
export function getConsultationReminder24hMessage(data: ConsultationData): string {
  const dateStr = typeof data.date === 'string' ? data.date : format(data.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return `⏰ *Lembrete de Consulta*

Olá ${data.patientName}! Sua consulta está agendada para:

📅 *Data:* ${dateStr}
⏰ *Horário:* ${data.time}
👨‍⚕️ *Médico:* Dr. ${data.doctorName}
${data.meetingLink ? `🔗 *Link:* ${data.meetingLink}` : ''}

⚠️ A consulta começa em 24 horas!

Não esqueça de estar em um local tranquilo e com boa conexão de internet.

CannabiLizi 💚`;
}

/**
 * Template: Lembrete de Consulta (2h antes)
 */
export function getConsultationReminder2hMessage(data: ConsultationData): string {
  const dateStr = typeof data.date === 'string' ? data.date : format(data.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return `⏰ *Lembrete de Consulta*

Olá ${data.patientName}! Sua consulta está agendada para daqui a 2 horas:

📅 *Data:* ${dateStr}
⏰ *Horário:* ${data.time}
👨‍⚕️ *Médico:* Dr. ${data.doctorName}
${data.meetingLink ? `🔗 *Link:* ${data.meetingLink}` : ''}

Por favor, esteja pronto para a consulta.

CannabiLizi 💚`;
}

/**
 * Template: Lembrete de Consulta (1h antes)
 */
export function getConsultationReminder1hMessage(data: ConsultationData): string {
  return `⏰ *Lembrete de Consulta*

Olá ${data.patientName}! Sua consulta começa em 1 hora!

👨‍⚕️ *Médico:* Dr. ${data.doctorName}
⏰ *Horário:* ${data.time}
${data.meetingLink ? `🔗 *Link:* ${data.meetingLink}` : ''}

Por favor, esteja pronto para a consulta.

CannabiLizi 💚`;
}

/**
 * Template: Lembrete de Consulta (10 min antes)
 */
export function getConsultationReminder10minMessage(data: ConsultationData): string {
  return `⏰ *Sua consulta começa em 10 minutos!*

Olá ${data.patientName}!

👨‍⚕️ *Médico:* Dr. ${data.doctorName}
⏰ *Horário:* ${data.time}
${data.meetingLink ? `🔗 *Link:* ${data.meetingLink}` : ''}

Entre na sala alguns minutos antes. Até já!

CannabiLizi 💚`;
}

/**
 * Template: Boas-vindas (paciente novo)
 */
export async function getAccountWelcomeMessage(data: { patientName: string }): Promise<string> {
  const fallbackTemplate = `👋 *Bem-vindo(a) ao CannabiLizi!*

Olá {{patientName}}!

Ficamos felizes em tê-lo(a) conosco. Aqui você terá acesso a:

✅ Consultas médicas especializadas em cannabis medicinal
✅ Receitas digitais seguras
✅ Acompanhamento do seu tratamento
✅ Carteirinha digital

Qualquer dúvida, estamos à disposição.

CannabiLizi 💚`;

  return generateMessage('ACCOUNT_WELCOME', { patientName: data.patientName }, fallbackTemplate);
}

/**
 * Template: Conclusão de cadastro (link para definir senha)
 */
export async function getAccountSetupMessage(data: { patientName: string; setupUrl: string }): Promise<string> {
  const fallbackTemplate = `🔐 *Conclua seu cadastro*

Olá {{patientName}}!

Para acessar sua conta no CannabiLizi e acompanhar consultas e receitas, defina sua senha:

🔗 {{setupUrl}}

⏰ Este link expira em 7 dias.

Se você não solicitou este link, ignore esta mensagem.

CannabiLizi 💚`;

  return generateMessage('ACCOUNT_SETUP', { patientName: data.patientName, setupUrl: data.setupUrl }, fallbackTemplate);
}

/**
 * Template: Confirmação de Pagamento (com resumo da consulta, link concluir cadastro e link da página da consulta)
 */
export async function getPaymentConfirmedMessage(data: PaymentData): Promise<string> {
  const dateStr = typeof data.date === 'string'
    ? new Date(data.date).toLocaleDateString('pt-BR')
    : format(data.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  if (data.consultationScheduledAt != null && (data.setupUrl || data.consultationPageUrl)) {
    const scheduledAt = typeof data.consultationScheduledAt === 'string'
      ? new Date(data.consultationScheduledAt)
      : data.consultationScheduledAt;
    const consultaDataStr = scheduledAt.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    const consultaHoraStr = scheduledAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const lines: string[] = [];

    // 1) Confirmação do pagamento — única e exclusivamente
    lines.push(
      '✅ *Confirmamos o recebimento do seu pagamento.*',
      '',
      `Olá ${data.patientName}! Seu pagamento no valor de R$ ${data.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} foi reconhecido e confirmado.`,
      ''
    );

    // 2) Na sequência: informações da consulta
    lines.push(
      '📋 *Dados da sua consulta:*',
      `📅 Data: ${consultaDataStr}`,
      `⏰ Horário: ${consultaHoraStr}`,
      ''
    );

    // 3) Link para concluir cadastro
    if (data.setupUrl) {
      lines.push('🔐 *Concluir seu cadastro* (definir senha e acessar a plataforma):', data.setupUrl, '');
    }
    if (data.consultationPageUrl) {
      lines.push('📄 *Sua página da consulta* (videochamada, anamnese e envio de documentos):', data.consultationPageUrl, '');
      lines.push('📎 Pelo link acima você pode enviar *exames, receitas e laudos anteriores*; eles ficam anexados à sua consulta para o médico.', '');
    }
    lines.push('Qualquer dúvida, estamos à disposição! 💚');
    return lines.join('\n');
  }

  const fallbackTemplate = `✅ *Pagamento Confirmado!*

Olá {{patientName}}! Seu pagamento foi processado:

💰 *Valor:* R$ {{amount}}
📅 *Data:* {{date}}
{{#transactionId}}📄 *ID:* {{transactionId}}{{/transactionId}}

Sua consulta está confirmada!

CannabiLizi 💚`;

  return generateMessage('PAYMENT_CONFIRMED', {
    patientName: data.patientName,
    amount: data.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
    date: dateStr,
    transactionId: data.transactionId,
  }, fallbackTemplate);
}

/**
 * Template: Lembrete de Pagamento Pendente
 */
export function getPaymentReminderMessage(data: PaymentData & { dueDate: Date | string }): string {
  const dueDateStr = typeof data.dueDate === 'string' 
    ? new Date(data.dueDate).toLocaleDateString('pt-BR')
    : format(data.dueDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  
  return `💳 *Pagamento Pendente*

Olá ${data.patientName}! Você possui um pagamento pendente:

💰 *Valor:* R$ ${data.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
📅 *Vencimento:* ${dueDateStr}

⚠️ Sua consulta será confirmada após o pagamento.

🔗 Acesse sua área do paciente para realizar o pagamento.

CannabiLizi 💚`;
}

/**
 * Template: Receita Emitida
 */
export async function getPrescriptionIssuedMessage(data: PrescriptionData): Promise<string> {
  const dateStr = typeof data.date === 'string' 
    ? new Date(data.date).toLocaleDateString('pt-BR')
    : format(data.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  
  const fallbackTemplate = `📋 *Receita Médica Emitida*

Olá {{patientName}}! Sua receita foi emitida:

👨‍⚕️ *Médico:* Dr. {{doctorName}}
📅 *Data:* {{date}}
{{#medications}}💊 *Medicamentos:* {{medications}}{{/medications}}

📄 Acesse sua área do paciente para visualizar e baixar a receita.

CannabiLizi 💚`;

  return generateMessage('PRESCRIPTION_ISSUED', {
    patientName: data.patientName,
    doctorName: data.doctorName,
    date: dateStr,
    medications: data.medications?.join(', '),
  }, fallbackTemplate);
}

/**
 * Template: Convite para Adiantar Consulta
 */
export async function getRescheduleInviteMessage(data: {
  patientName: string;
  doctorName: string;
  currentDate: string;
  currentTime: string;
  newDate: string;
  newTime: string;
  acceptLink: string;
  rejectLink: string;
}): Promise<string> {
  const fallbackTemplate = `🎯 *Oportunidade de Adiantar Consulta!*

Olá {{patientName}}! O Dr. {{doctorName}} tem disponibilidade para adiantar sua consulta:

📅 *Data Atual:* {{currentDate}} às {{currentTime}}
📅 *Nova Data:* {{newDate}} às {{newTime}}

✅ *Aceitar:* {{acceptLink}}
❌ *Recusar:* {{rejectLink}}

⏱️ Este convite é válido por 24 horas.

CannabiLizi 💚`;

  return generateMessage('RESCHEDULE_INVITE', data, fallbackTemplate);
}

/**
 * Template: Autorização ANVISA Aprovada
 */
export function getAnvisaApprovedMessage(data: {
  patientName: string;
  anvisaNumber: string;
  approvedDate: Date | string;
  expiresAt?: Date | string;
}): string {
  const approvedDateStr = typeof data.approvedDate === 'string' 
    ? new Date(data.approvedDate).toLocaleDateString('pt-BR')
    : format(data.approvedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  
  const expiresDateStr = data.expiresAt 
    ? (typeof data.expiresAt === 'string' 
      ? new Date(data.expiresAt).toLocaleDateString('pt-BR')
      : format(data.expiresAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }))
    : 'N/A';
  
  return `✅ *Autorização ANVISA Aprovada!*

Olá ${data.patientName}! Sua autorização foi aprovada:

📄 *Número:* ${data.anvisaNumber}
📅 *Aprovada em:* ${approvedDateStr}
⏰ *Válida até:* ${expiresDateStr}

📋 Acesse sua área do paciente para ver detalhes.

CannabiLizi 💚`;
}

/**
 * Template: Nova Consulta Designada (para Médico)
 * consultationLink: link para o médico ver a consulta (anamnese, documentos anexados, etc.)
 */
export async function getDoctorConsultationAssignedMessage(data: {
  doctorName: string;
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  date: string;
  time: string;
  consultationId: string;
  /** Link para a página da consulta do médico (anamnese, documentos). */
  consultationLink?: string | null;
}): Promise<string> {
  const fallbackTemplate = `🔔 *Nova Consulta Designada*

Dr. {{doctorName}}! Você foi designado para uma nova consulta:

👤 *Paciente:* {{patientName}}
📧 Email: {{patientEmail}}
{{#patientPhone}}📱 Telefone: {{patientPhone}}{{/patientPhone}}
📅 *Data:* {{date}}
⏰ *Horário:* {{time}}

{{#consultationLink}}📋 Ver consulta (anamnese, documentos): {{consultationLink}}{{/consultationLink}}

CannabiLizi 💚`;

  return generateMessage('DOCTOR_CONSULTATION_ASSIGNED', data, fallbackTemplate);
}

/** Formata método de pagamento para exibição (PIX, Cartão, Boleto, Aguardando pagamento). */
export function formatPaymentMethodLabel(method: string | null | undefined): string {
  if (!method || !method.trim()) return 'Aguardando pagamento';
  const m = method.toUpperCase().replace(/-/g, '_');
  if (m === 'PIX') return 'PIX';
  if (m === 'BOLETO') return 'Boleto';
  if (m === 'CREDIT_CARD' || m === 'CARD' || m === 'CARTAO') return 'Cartão de crédito';
  return method;
}

/**
 * Template: Nova Consulta Agendada (para Admin)
 */
export async function getAdminConsultationScheduledMessage(data: {
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  amount: number;
  consultationId: string;
  /** Forma de pagamento (opcional). Se vazio, exibe "Aguardando pagamento". */
  paymentMethod?: string | null;
}): Promise<string> {
  const fallbackTemplate = `🔔 *Nova Consulta Agendada*

Nova consulta no sistema:

👤 *Paciente:* {{patientName}}
👨‍⚕️ *Médico:* {{doctorName}}
📅 *Data:* {{date}}
⏰ *Horário:* {{time}}
💰 *Valor:* R$ {{amount}}
💳 *Forma de pagamento:* {{paymentMethod}}

📋 Ver: [Link Admin]

CannabiLizi 💚`;

  const paymentMethodLabel = formatPaymentMethodLabel(data.paymentMethod);
  return generateMessage('ADMIN_CONSULTATION_SCHEDULED', {
    ...data,
    amount: data.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
    paymentMethod: paymentMethodLabel,
  }, fallbackTemplate);
}
