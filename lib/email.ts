import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
}

export type EmailProvider = 'RESEND' | 'SENDGRID' | 'AWS_SES' | 'SMTP';

export type EmailTemplateType =
  | 'ACCOUNT_WELCOME'
  | 'ACCOUNT_SETUP'
  | 'PASSWORD_RESET'
  | 'CONSULTATION_CONFIRMED'
  | 'CONSULTATION_REMINDER_24H'
  | 'CONSULTATION_REMINDER_2H'
  | 'CONSULTATION_REMINDER_1H'
  | 'CONSULTATION_REMINDER_10MIN'
  | 'CONSULTATION_REMINDER_NOW'
  | 'CONSULTATION_FOLLOWUP'
  | 'PAYMENT_CONFIRMED'
  | 'PRESCRIPTION_ISSUED'
  | 'RESCHEDULE_INVITE'
  | 'RESCHEDULE_INVITE_ACCEPTED'
  | 'RESCHEDULE_INVITE_REJECTED'
  | 'RESCHEDULE_INVITE_EXPIRED';

export interface EmailTemplateConfig {
  id: EmailTemplateType;
  name: string;
  description: string;
  subject: string;
  html: string;
}

// ---------------------------------------------------------------------------
// Templates padrão (podem ser sobrescritos via painel do admin)
// ---------------------------------------------------------------------------

export const DEFAULT_EMAIL_TEMPLATES: Record<EmailTemplateType, EmailTemplateConfig> = {
  ACCOUNT_WELCOME: {
    id: 'ACCOUNT_WELCOME',
    name: 'Boas-vindas',
    description: 'Enviado ao paciente quando cria uma conta ou agenda a primeira consulta.',
    subject: 'Bem-vindo(a) ao CannabiLizi!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00A859;">Bem-vindo(a) ao CannabiLizi!</h2>
        <p>Olá {{patientName}},</p>
        <p>Ficamos felizes em tê-lo(a) conosco!</p>
        <p>No CannabiLizi, você terá acesso a:</p>
        <ul style="line-height: 1.8;">
          <li>Consultas médicas especializadas em cannabis medicinal</li>
          <li>Receitas digitais seguras e rastreáveis</li>
          <li>Acompanhamento completo do seu tratamento</li>
          <li>Carteirinha digital para acesso facilitado</li>
        </ul>
        <p>Se precisar de ajuda, nossa equipe está sempre disponível para você.</p>
        <p style="margin-top: 24px;">Atenciosamente,<br>Equipe CannabiLizi</p>
      </div>
    `,
  },
  ACCOUNT_SETUP: {
    id: 'ACCOUNT_SETUP',
    name: 'Conclusão de Cadastro',
    description: 'Enviado ao paciente para concluir o cadastro e definir uma senha de acesso.',
    subject: 'Conclua seu cadastro - CannabiLizi',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00A859;">Conclua seu cadastro</h2>
        <p>Olá {{patientName}},</p>
        <p>Para acessar sua conta no CannabiLizi e acompanhar suas consultas, receitas e histórico, você precisa definir uma senha de acesso.</p>
        <p style="margin: 24px 0;">
          <a href="{{setupUrl}}" style="background: #00A859; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Definir Minha Senha
          </a>
        </p>
        <p><strong>Este link expira em 7 dias.</strong></p>
        <p>Se você não solicitou este email, pode ignorá-lo com segurança.</p>
        <p style="margin-top: 24px;">Atenciosamente,<br>Equipe CannabiLizi</p>
      </div>
    `,
  },
  PASSWORD_RESET: {
    id: 'PASSWORD_RESET',
    name: 'Recuperação de Senha',
    description: 'Enviado ao usuário quando solicita recuperação de senha.',
    subject: 'Recuperar sua senha - CannabiLizi',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00A859;">Recuperar Senha</h2>
        <p>Olá {{userName}},</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta no CannabiLizi.</p>
        <p style="margin: 24px 0;">
          <a href="{{resetUrl}}" style="background: #00A859; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Redefinir Minha Senha
          </a>
        </p>
        <p><strong>Este link expira em 1 hora.</strong></p>
        <p>Se você não solicitou esta recuperação de senha, pode ignorar este email com segurança. Sua senha não será alterada.</p>
        <p style="margin-top: 24px;">Atenciosamente,<br>Equipe CannabiLizi</p>
      </div>
    `,
  },
  CONSULTATION_CONFIRMED: {
    id: 'CONSULTATION_CONFIRMED',
    name: 'Confirmação de Consulta',
    description: 'Enviado ao paciente imediatamente após o agendamento da consulta.',
    subject: 'Consulta Agendada - CannabiLizi',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00A859;">Consulta Agendada com Sucesso!</h2>
        <p>Olá {{patientName}},</p>
        <p>Sua consulta foi agendada para:</p>
        <p><strong>{{consultationDateTime}}</strong></p>
        {{#if meetingLink}}
          <p>Esta consulta será realizada por telemedicina.</p>
          <p>Link da consulta: <a href="{{meetingLink}}">{{meetingLink}}</a></p>
        {{/if}}
        {{#if confirmationUrl}}
          <p><a href="{{confirmationUrl}}" style="background: #00A859; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 16px 0;">Ver detalhes da consulta</a></p>
        {{/if}}
        <p>Se precisar reagendar ou cancelar, acesse sua área do paciente.</p>
        <p>Em caso de dúvidas, entre em contato conosco.</p>
        <p style="margin-top: 24px;">Atenciosamente,<br>Equipe CannabiLizi</p>
      </div>
    `,
  },
  PAYMENT_CONFIRMED: {
    id: 'PAYMENT_CONFIRMED',
    name: 'Confirmação de Pagamento',
    description: 'Enviado ao paciente quando o pagamento da consulta é confirmado.',
    subject: 'Pagamento Confirmado - CannabiLizi',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00A859;">Pagamento Confirmado!</h2>
        <p>Olá {{patientName}},</p>
        <p>Seu pagamento de <strong>{{amount}}</strong> foi confirmado com sucesso.</p>
        {{#if consultationDateTime}}
          <p>Sua consulta está agendada para: <strong>{{consultationDateTime}}</strong></p>
        {{/if}}
        {{#if confirmationUrl}}
          <p><a href="{{confirmationUrl}}" style="background: #00A859; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 16px 0;">Ver detalhes da consulta</a></p>
        {{/if}}
        <p>Você pode acessar os detalhes da consulta e os recibos diretamente na plataforma.</p>
        <p style="margin-top: 24px;">Atenciosamente,<br>Equipe CannabiLizi</p>
      </div>
    `,
  },
  CONSULTATION_REMINDER_24H: {
    id: 'CONSULTATION_REMINDER_24H',
    name: 'Lembrete de Consulta (24h antes)',
    description: 'Enviado ao paciente 24 horas antes da consulta agendada.',
    subject: 'Lembrete: Sua consulta é amanhã - CannabiLizi',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00A859;">Lembrete de Consulta</h2>
        <p>Olá {{patientName}},</p>
        <p>Este é um lembrete de que sua consulta está agendada para:</p>
        <p><strong>{{consultationDateTime}}</strong></p>
        {{#if meetingLink}}
          <p>Esta consulta será realizada por telemedicina.</p>
          <p>Link da consulta: <a href="{{meetingLink}}">{{meetingLink}}</a></p>
          <p><strong>Importante:</strong> Acesse o link alguns minutos antes do horário agendado.</p>
        {{/if}}
        <p>Se precisar reagendar ou cancelar, acesse sua área do paciente o quanto antes.</p>
        <p style="margin-top: 24px;">Atenciosamente,<br>Equipe CannabiLizi</p>
      </div>
    `,
  },
  CONSULTATION_REMINDER_2H: {
    id: 'CONSULTATION_REMINDER_2H',
    name: 'Lembrete de Consulta (2h antes)',
    description: 'Enviado ao paciente 2 horas antes da consulta agendada.',
    subject: 'Lembrete: Sua consulta é em breve - CannabiLizi',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00A859;">Sua consulta é em breve!</h2>
        <p>Olá {{patientName}},</p>
        <p>Sua consulta está agendada para:</p>
        <p><strong>{{consultationDateTime}}</strong></p>
        {{#if meetingLink}}
          <p>Esta consulta será realizada por telemedicina.</p>
          <p>
            <a href="{{meetingLink}}" style="background: #00A859; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Acessar Consulta Agora
            </a>
          </p>
          <p><strong>Dica:</strong> Acesse o link alguns minutos antes para garantir que tudo está funcionando.</p>
        {{/if}}
        <p style="margin-top: 24px;">Atenciosamente,<br>Equipe CannabiLizi</p>
      </div>
    `,
  },
  CONSULTATION_REMINDER_1H: {
    id: 'CONSULTATION_REMINDER_1H',
    name: 'Lembrete de Consulta (1h antes)',
    description: 'Enviado ao paciente 1 hora antes da consulta agendada.',
    subject: 'Lembrete: Sua consulta é em 1 hora - CannabiLizi',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00A859;">Sua consulta é em 1 hora!</h2>
        <p>Olá {{patientName}},</p>
        <p>Sua consulta está agendada para:</p>
        <p><strong>{{consultationDateTime}}</strong></p>
        {{#if meetingLink}}
          <p>Esta consulta será realizada por telemedicina.</p>
          <p>
            <a href="{{meetingLink}}" style="background: #00A859; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Acessar Consulta
            </a>
          </p>
        {{/if}}
        <p style="margin-top: 24px;">Atenciosamente,<br>Equipe CannabiLizi</p>
      </div>
    `,
  },
  CONSULTATION_REMINDER_10MIN: {
    id: 'CONSULTATION_REMINDER_10MIN',
    name: 'Lembrete de Consulta (10 min antes)',
    description: 'Enviado ao paciente 10 minutos antes da consulta agendada.',
    subject: 'Sua consulta é em 10 minutos! - CannabiLizi',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00A859;">Sua consulta é em 10 minutos!</h2>
        <p>Olá {{patientName}},</p>
        <p>Horário da consulta: <strong>{{consultationDateTime}}</strong></p>
        {{#if meetingLink}}
          <p>
            <a href="{{meetingLink}}" style="background: #00A859; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
              Entrar na Consulta
            </a>
          </p>
        {{/if}}
        <p style="margin-top: 24px;">Atenciosamente,<br>Equipe CannabiLizi</p>
      </div>
    `,
  },
  CONSULTATION_REMINDER_NOW: {
    id: 'CONSULTATION_REMINDER_NOW',
    name: 'Lembrete de Consulta (na hora)',
    description: 'Enviado ao paciente no horário agendado da consulta.',
    subject: 'Sua consulta é agora! - CannabiLizi',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00A859;">Sua consulta é agora!</h2>
        <p>Olá {{patientName}},</p>
        <p>Este é o horário da sua consulta agendada:</p>
        <p><strong>{{consultationDateTime}}</strong></p>
        {{#if meetingLink}}
          <p>Esta consulta será realizada por telemedicina.</p>
          <p style="margin: 24px 0;">
            <a href="{{meetingLink}}" style="background: #00A859; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
              🚀 Entrar na Consulta
            </a>
          </p>
          <p><strong>Importante:</strong> Clique no botão acima para acessar a sala de telemedicina.</p>
        {{else}}
          <p>Entre em contato com seu médico ou acesse sua área do paciente para mais informações.</p>
        {{/if}}
        <p style="margin-top: 24px;">Atenciosamente,<br>Equipe CannabiLizi</p>
      </div>
    `,
  },
  CONSULTATION_FOLLOWUP: {
    id: 'CONSULTATION_FOLLOWUP',
    name: 'Follow-up Pós-Consulta',
    description: 'Enviado ao paciente algumas horas após a consulta ser concluída.',
    subject: 'Como foi sua consulta? - CannabiLizi',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00A859;">Obrigado pela sua consulta!</h2>
        <p>Olá {{patientName}},</p>
        <p>Esperamos que sua consulta tenha sido proveitosa.</p>
        {{#if prescriptionUrl}}
          <p>Sua receita médica já está disponível:</p>
          <p>
            <a href="{{prescriptionUrl}}" style="background: #00A859; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Acessar Receita
            </a>
          </p>
        {{/if}}
        <p>Se tiver dúvidas sobre seu tratamento ou precisar de suporte, nossa equipe está à disposição.</p>
        <p>Você pode acessar todas as informações da sua consulta, receitas e histórico na sua área do paciente.</p>
        <p style="margin-top: 24px;">Atenciosamente,<br>Equipe CannabiLizi</p>
      </div>
    `,
  },
  PRESCRIPTION_ISSUED: {
    id: 'PRESCRIPTION_ISSUED',
    name: 'Receita Emitida',
    description: 'Enviado ao paciente quando uma nova receita é emitida.',
    subject: 'Receita Médica Emitida - CannabiLizi',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00A859;">Receita Médica Emitida</h2>
        <p>Olá {{patientName}},</p>
        <p>Sua receita médica foi emitida com sucesso e já está disponível na sua área do paciente.</p>
        <p>
          <a href="{{prescriptionUrl}}" style="background: #00A859; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Acessar Receita
          </a>
        </p>
        <p>Caso tenha dúvidas sobre o uso do medicamento, entre em contato com seu médico.</p>
        <p style="margin-top: 24px;">Atenciosamente,<br>Equipe CannabiLizi</p>
      </div>
    `,
  },
  RESCHEDULE_INVITE: {
    id: 'RESCHEDULE_INVITE',
    name: 'Convite para Adiantar Consulta',
    description: 'Enviado ao paciente quando o médico sugere adiantar a consulta.',
    subject: 'Oportunidade: Adiantar sua consulta - CannabiLizi',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00A859;">Oportunidade de Adiantar sua Consulta</h2>
        <p>Olá {{patientName}},</p>
        <p>O Dr(a). <strong>{{doctorName}}</strong> identificou um horário disponível mais próximo e gostaria de sugerir adiantar sua consulta.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>📅 Horário Atual:</strong></p>
          <p style="margin: 0 0 20px 0; font-size: 18px; color: #666;">{{currentDateTime}}</p>
          <p style="margin: 0 0 10px 0;"><strong>📅 Novo Horário Proposto:</strong></p>
          <p style="margin: 0; font-size: 18px; color: #00A859; font-weight: bold;">{{newDateTime}}</p>
        </div>
        {{#if message}}
          <div style="background: #e8f5e9; padding: 15px; border-left: 4px solid #00A859; margin: 20px 0;">
            <p style="margin: 0 0 5px 0;"><strong>💬 Mensagem do médico:</strong></p>
            <p style="margin: 0;">{{message}}</p>
          </div>
        {{/if}}
        <p><strong>⏰ Você tem até {{expiresAt}} para responder.</strong></p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="{{acceptUrl}}" style="background: #00A859; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px; font-weight: bold;">
            ✅ Aceitar Convite
          </a>
          <a href="{{rejectUrl}}" style="background: #f44336; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            ❌ Recusar
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">Ou acesse sua área do paciente para responder ao convite.</p>
        <p style="margin-top: 24px;">Atenciosamente,<br>Equipe CannabiLizi</p>
      </div>
    `,
  },
  RESCHEDULE_INVITE_ACCEPTED: {
    id: 'RESCHEDULE_INVITE_ACCEPTED',
    name: 'Convite Aceito - Confirmação',
    description: 'Enviado ao paciente quando ele aceita o convite de remarcação.',
    subject: 'Consulta Remarcada com Sucesso - CannabiLizi',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00A859;">Consulta Remarcada com Sucesso!</h2>
        <p>Olá {{patientName}},</p>
        <p>Sua consulta foi remarcada para:</p>
        <p style="font-size: 20px; font-weight: bold; color: #00A859; margin: 20px 0;">{{newDateTime}}</p>
        {{#if meetingLink}}
          <p>Esta consulta será realizada por telemedicina.</p>
          <p>
            <a href="{{meetingLink}}" style="background: #00A859; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Acessar Consulta
            </a>
          </p>
        {{/if}}
        <p>Lembre-se de estar disponível no horário agendado.</p>
        <p style="margin-top: 24px;">Atenciosamente,<br>Equipe CannabiLizi</p>
      </div>
    `,
  },
  RESCHEDULE_INVITE_REJECTED: {
    id: 'RESCHEDULE_INVITE_REJECTED',
    name: 'Convite Recusado - Notificação ao Médico',
    description: 'Enviado ao médico quando o paciente recusa o convite de remarcação.',
    subject: 'Paciente manteve horário original',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #666;">Convite Recusado</h2>
        <p>Olá Dr(a). {{doctorName}},</p>
        <p>O paciente <strong>{{patientName}}</strong> optou por manter o horário original da consulta.</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Horário mantido:</strong> {{currentDateTime}}</p>
        </div>
        <p>A consulta permanece agendada para o horário original.</p>
        <p style="margin-top: 24px;">Atenciosamente,<br>Equipe CannabiLizi</p>
      </div>
    `,
  },
  RESCHEDULE_INVITE_EXPIRED: {
    id: 'RESCHEDULE_INVITE_EXPIRED',
    name: 'Convite Expirado - Notificação ao Médico',
    description: 'Enviado ao médico quando um convite expira sem resposta.',
    subject: 'Convite de remarcação expirado',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f44336;">Convite Expirado</h2>
        <p>Olá Dr(a). {{doctorName}},</p>
        <p>O convite de remarcação enviado para o paciente <strong>{{patientName}}</strong> expirou sem resposta.</p>
        <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <p style="margin: 0;"><strong>Horário proposto:</strong> {{newDateTime}}</p>
        </div>
        <p>A consulta permanece agendada para o horário original.</p>
        <p style="margin-top: 24px;">Atenciosamente,<br>Equipe CannabiLizi</p>
      </div>
    `,
  },
};

// ---------------------------------------------------------------------------
// Leitura de configuração de provedor
// ---------------------------------------------------------------------------

/** Config SMTP a partir de variáveis de ambiente (fallback quando não há config no banco). */
function getEnvSmtpConfig(): (Awaited<ReturnType<typeof prisma.emailConfig.findFirst>>) | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim() || process.env.SMTP_PASSWORD?.trim();
  if (!host || !user || !pass) return null;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const from = process.env.SMTP_FROM?.trim(); // ex: "CannabiLizi <email@...>"
  const replyTo = process.env.SMTP_REPLY_TO?.trim();
  let fromEmail: string | null = null;
  let fromName: string | null = null;
  if (from) {
    const match = from.match(/^(.+?)\s*<([^>]+)>$/);
    if (match) {
      fromName = match[1].trim();
      fromEmail = match[2].trim();
    } else if (from.includes('@')) {
      fromEmail = from;
    }
  }
  if (!fromEmail) fromEmail = user;
  if (!fromName) fromName = 'CannabiLizi';
  return {
    id: 'env-smtp',
    provider: 'SMTP',
    enabled: true,
    apiKey: null,
    apiSecret: null,
    fromEmail,
    fromName,
    replyTo: replyTo || user,
    smtpHost: host,
    smtpPort: port,
    smtpUser: user,
    smtpPassword: pass,
    smtpSecure: process.env.SMTP_SECURE === 'true' || String(port) === '465',
    domain: null,
    region: null,
    config: null,
    testEmail: null,
    lastTestAt: null,
    lastTestResult: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Awaited<ReturnType<typeof prisma.emailConfig.findFirst>>;
}

/** Verifica se a config tem credenciais mínimas para enviar. */
function configCanSend(config: { provider: string; apiKey?: string | null; smtpHost?: string | null; smtpUser?: string | null; smtpPassword?: string | null }): boolean {
  const p = config.provider as EmailProvider;
  if (p === 'RESEND') return !!(config.apiKey?.trim());
  if (p === 'SMTP') return !!(config.smtpHost?.trim() && config.smtpUser?.trim() && config.smtpPassword);
  if (p === 'SENDGRID' || p === 'AWS_SES') return false; // ainda não implementados
  return false;
}

async function getActiveEmailConfig() {
  // Tenta encontrar um provedor habilitado. Prioriza provedores com credenciais completas.
  const configs = await prisma.emailConfig.findMany({
    where: { enabled: true },
  });

  if (configs.length > 0) {
    const preferredOrder: EmailProvider[] = ['RESEND', 'SMTP', 'SENDGRID', 'AWS_SES'];
    const byProvider: Partial<Record<EmailProvider, (typeof configs)[number]>> = {};
    for (const c of configs) {
      const p = c.provider as EmailProvider;
      byProvider[p] = c;
    }
    // Primeiro: escolher um provedor que tenha credenciais (evita "sucesso" sem envio)
    for (const p of preferredOrder) {
      const c = byProvider[p];
      if (c && configCanSend(c)) return c;
    }
    // Segundo: fallback para o primeiro habilitado (sendEmail vai lançar erro se não puder enviar)
    for (const p of preferredOrder) {
      if (byProvider[p]) return byProvider[p]!;
    }
    return configs[0];
  }

  // Fallback: SMTP via variáveis de ambiente (ex.: Gmail Cannabilize)
  return getEnvSmtpConfig();
}

/**
 * Retorna o status atual do envio de email (para diagnóstico no Admin).
 * Indica qual provedor está ativo, se tem credenciais e se há redirecionamento.
 */
export async function getEmailStatus(): Promise<{
  hasConfig: boolean;
  provider?: string;
  canSend: boolean;
  redirectTo: string | null;
  message: string;
}> {
  const config = await getActiveEmailConfig();
  const redirectTo = await getEmailRedirect();

  if (!config) {
    return {
      hasConfig: false,
      canSend: false,
      redirectTo,
      message:
        'Nenhum provedor de email habilitado. Configure SMTP em Admin → Email ou defina SMTP_HOST, SMTP_USER e SMTP_PASS no .env.',
    };
  }

  const canSend = configCanSend(config);
  return {
    hasConfig: true,
    provider: config.provider,
    canSend,
    redirectTo,
    message: canSend
      ? `Provedor ativo: ${config.provider}. Emails serão enviados normalmente.${redirectTo ? ` (Redirecionamento ativo para ${redirectTo})` : ''}`
      : `Provedor "${config.provider}" habilitado mas credenciais incompletas. Preencha host, usuário e senha em Admin → Email e salve.`,
  };
}

// ---------------------------------------------------------------------------
// Leitura/Renderização de templates (admin pode sobrescrever via SystemConfig)
// ---------------------------------------------------------------------------

const EMAIL_TEMPLATES_CONFIG_KEY = 'EMAIL_TEMPLATES_V1';

async function loadTemplatesFromConfig(): Promise<
  Partial<Record<EmailTemplateType, EmailTemplateConfig>>
> {
  try {
    const entry = await prisma.systemConfig.findUnique({
      where: { key: EMAIL_TEMPLATES_CONFIG_KEY },
    });
    if (!entry) return {};

    const parsed = JSON.parse(entry.value) as EmailTemplateConfig[];
    const map: Partial<Record<EmailTemplateType, EmailTemplateConfig>> = {};
    for (const t of parsed) {
      map[t.id] = t;
    }
    return map;
  } catch (error) {
    console.error('Erro ao carregar templates de email do SystemConfig:', error);
    return {};
  }
}

export async function getEmailTemplate(
  type: EmailTemplateType
): Promise<EmailTemplateConfig> {
  const overrides = await loadTemplatesFromConfig();
  return overrides[type] || DEFAULT_EMAIL_TEMPLATES[type];
}

/**
 * Renderizador simples para {{variavel}} e {{#if variavel}} ... {{/if}}
 */
function renderTemplate(
  template: string,
  variables: Record<string, string | number | boolean | null | undefined>
): string {
  let html = template;

  // Blocos condicionais {{#if var}} ... {{/if}}
  html = html.replace(
    /{{#if\s+([\w.]+)}}([\s\S]*?){{\/if}}/g,
    (_, varName: string, content: string) => {
      const value = variables[varName];
      if (value === undefined || value === null || value === '' || value === false) {
        return '';
      }
      return content;
    }
  );

  // Variáveis simples {{var}}
  html = html.replace(/{{([\w.]+)}}/g, (_, varName: string) => {
    const value = variables[varName];
    if (value === undefined || value === null) return '';
    return String(value);
  });

  return html;
}

/** Variáveis de exemplo para envio de teste de cada modelo (admin). */
function getSampleVariablesForTemplate(
  type: EmailTemplateType
): Record<string, string | number | boolean | null | undefined> {
  const dateEx = new Date().toLocaleString('pt-BR');
  const base = {
    patientName: 'Maria Silva',
    doctorName: 'Dr. João Santos',
    consultationDateTime: dateEx,
    meetingLink: 'https://meet.exemplo.com/consulta-123',
    amount: 'R$ 250,00',
    prescriptionUrl: 'https://app.exemplo.com/paciente/receitas/1',
    setupUrl: 'https://app.exemplo.com/setup/senha?token=xxx',
    currentDateTime: dateEx,
    newDateTime: new Date(Date.now() + 86400000).toLocaleString('pt-BR'),
    message: 'Identificamos um horário mais próximo. Gostaria de adiantar?',
    acceptUrl: 'https://app.exemplo.com/reschedule/accept/1',
    rejectUrl: 'https://app.exemplo.com/reschedule/reject/1',
    expiresAt: new Date(Date.now() + 3600000).toLocaleString('pt-BR'),
  };
  switch (type) {
    case 'ACCOUNT_WELCOME':
      return { patientName: base.patientName };
    case 'ACCOUNT_SETUP':
      return { patientName: base.patientName, setupUrl: base.setupUrl };
    case 'CONSULTATION_CONFIRMED':
      return {
        patientName: base.patientName,
        consultationDateTime: base.consultationDateTime,
        meetingLink: base.meetingLink,
      };
    case 'PAYMENT_CONFIRMED':
      return {
        patientName: base.patientName,
        amount: base.amount,
        consultationDateTime: base.consultationDateTime,
      };
    case 'CONSULTATION_REMINDER_24H':
    case 'CONSULTATION_REMINDER_2H':
    case 'CONSULTATION_REMINDER_1H':
    case 'CONSULTATION_REMINDER_10MIN':
    case 'CONSULTATION_REMINDER_NOW':
      return {
        patientName: base.patientName,
        consultationDateTime: base.consultationDateTime,
        meetingLink: base.meetingLink,
      };
    case 'CONSULTATION_FOLLOWUP':
      return {
        patientName: base.patientName,
        prescriptionUrl: base.prescriptionUrl,
      };
    case 'PRESCRIPTION_ISSUED':
      return {
        patientName: base.patientName,
        prescriptionUrl: base.prescriptionUrl,
      };
    case 'RESCHEDULE_INVITE':
      return {
        patientName: base.patientName,
        doctorName: base.doctorName,
        currentDateTime: base.currentDateTime,
        newDateTime: base.newDateTime,
        message: base.message,
        acceptUrl: base.acceptUrl,
        rejectUrl: base.rejectUrl,
        expiresAt: base.expiresAt,
      };
    case 'RESCHEDULE_INVITE_ACCEPTED':
      return {
        patientName: base.patientName,
        newDateTime: base.newDateTime,
        meetingLink: base.meetingLink,
      };
    case 'RESCHEDULE_INVITE_REJECTED':
      return {
        doctorName: base.doctorName,
        patientName: base.patientName,
        currentDateTime: base.currentDateTime,
      };
    case 'RESCHEDULE_INVITE_EXPIRED':
      return {
        doctorName: base.doctorName,
        patientName: base.patientName,
        newDateTime: base.newDateTime,
      };
    default:
      return base;
  }
}

/**
 * Envia um email de teste com o modelo indicado (variáveis de exemplo).
 * Usado no painel Admin para pré-visualizar os modelos.
 * Retorna o destino real (pode ser redirecionado).
 */
export async function sendTemplateTest(
  to: string,
  templateType: EmailTemplateType
): Promise<{ sentTo: string; redirected: boolean }> {
  const redirectTo = await getEmailRedirect();
  const template = await getEmailTemplate(templateType);
  const variables = getSampleVariablesForTemplate(templateType);
  const html = renderTemplate(template.html, variables);
  await sendEmail({ to, subject: `[TESTE] ${template.subject}`, html });
  return {
    sentTo: redirectTo || to,
    redirected: !!redirectTo,
  };
}

// ---------------------------------------------------------------------------
// Envio genérico de email usando o provedor configurado
// ---------------------------------------------------------------------------

export async function getEmailRedirect(): Promise<string | null> {
  try {
    const redirectConfig = await prisma.systemConfig.findUnique({
      where: { key: 'EMAIL_REDIRECT_TO' },
    });
    if (redirectConfig && redirectConfig.value) {
      const email = redirectConfig.value.trim();
      // Validar se é um email válido
      if (email.includes('@') && email.length > 0) {
        return email;
      }
    }
  } catch (error) {
    console.error('[EMAIL] Erro ao buscar configuração de redirecionamento:', error);
  }
  return null;
}

export async function sendEmail(data: EmailData): Promise<void> {
  const config = await getActiveEmailConfig();

  if (!config) {
    const msg =
      'Nenhum provedor de email habilitado. Configure SMTP (Admin → Email) ou variáveis de ambiente (SMTP_HOST, SMTP_USER, SMTP_PASS).';
    console.warn('[EMAIL]', msg);
    throw new Error(msg);
  }

  // Verificar se há redirecionamento global configurado
  const redirectTo = await getEmailRedirect();
  const originalTo = data.to;
  const finalTo = redirectTo || data.to;

  if (redirectTo && redirectTo !== originalTo) {
    console.log(`[EMAIL] Redirecionando email de ${originalTo} para ${redirectTo} (modo de teste)`);
    // Adicionar informação no assunto sobre o redirecionamento
    data.subject = `[REDIRECTED FROM: ${originalTo}] ${data.subject}`;
  }

  const provider = config.provider as EmailProvider;

  if (provider === 'RESEND') {
    if (!config.apiKey?.trim()) {
      const msg =
        'Resend está habilitado mas a chave da API não está configurada. Desative o Resend ou configure a chave em Admin → Email para usar SMTP.';
      console.error('[EMAIL]', msg);
      throw new Error(msg);
    }

    try {
      const resend = new Resend(config.apiKey);
      
      // Se o email remetente não for do domínio resend.dev e não houver domínio verificado,
      // usar o domínio de teste para garantir que funcione
      let fromEmail = config.fromEmail || 'onboarding@resend.dev';
      if (fromEmail && !fromEmail.includes('resend.dev') && !config.domain) {
        console.warn('[EMAIL] Domínio customizado sem verificação detectado. Usando domínio de teste do Resend.');
        fromEmail = 'onboarding@resend.dev';
      }
      
      const fromName = config.fromName || 'CannabiLizi';
      const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

      console.log('[EMAIL] Enviando via Resend:', { from, to: finalTo, originalTo: redirectTo ? originalTo : undefined });

      await resend.emails.send({
        from,
        to: finalTo,
        subject: data.subject,
        html: data.html,
        replyTo: config.replyTo || undefined,
      });

      return;
    } catch (error) {
      console.error('Erro ao enviar email via Resend:', error);
      throw error;
    }
  }

  if (provider === 'SMTP') {
    const host = config.smtpHost?.trim();
    const port = config.smtpPort ?? 587;
    const user = config.smtpUser?.trim();
    const pass = config.smtpPassword;

    if (!host || !user || !pass) {
      const msg =
        'SMTP está habilitado mas faltam host, usuário ou senha. Preencha e salve a configuração SMTP em Admin → Email (e use uma senha de app do Gmail).';
      console.error('[EMAIL]', msg);
      throw new Error(msg);
    }

    try {
      // Gmail 587 usa STARTTLS → secure: false. Porta 465 usa SSL → secure: true.
      const transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure: config.smtpSecure ?? false,
        auth: { user, pass },
      });

      const fromName = config.fromName || 'CannabiLizi';
      const fromEmail = config.fromEmail || user;
      const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

      console.log('[EMAIL] Enviando via SMTP:', {
        from,
        to: finalTo,
        originalTo: redirectTo ? originalTo : undefined,
      });

      await transporter.sendMail({
        from,
        to: finalTo,
        replyTo: config.replyTo || undefined,
        subject: data.subject,
        html: data.html,
      });
      return;
    } catch (error) {
      console.error('[EMAIL] Erro ao enviar email via SMTP:', error);
      throw error;
    }
  }

  // Outros provedores não implementados
  throw new Error(
    `Provedor "${provider}" ainda não implementado. Use Resend ou SMTP em Admin → Email.`
  );
}

// ---------------------------------------------------------------------------
// Funções de alto nível para eventos de negócio
// ---------------------------------------------------------------------------

export async function sendConsultationConfirmationEmail(params: {
  to: string;
  patientName: string;
  consultationDateTime: Date | string;
  meetingLink?: string | null;
  confirmationUrl?: string | null;
}) {
  const template = await getEmailTemplate('CONSULTATION_CONFIRMED');

  const subject = template.subject;
  const html = renderTemplate(template.html, {
    patientName: params.patientName,
    consultationDateTime: new Date(params.consultationDateTime).toLocaleString('pt-BR'),
    meetingLink: params.meetingLink || '',
    confirmationUrl: params.confirmationUrl || '',
  });

  await sendEmail({
    to: params.to,
    subject,
    html,
  });
}

export async function sendPaymentConfirmationEmail(params: {
  to: string;
  patientName: string;
  amount: number;
  consultationDateTime?: Date | string | null;
  confirmationUrl?: string | null;
}) {
  const template = await getEmailTemplate('PAYMENT_CONFIRMED');
  const amountFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(params.amount);

  const html = renderTemplate(template.html, {
    patientName: params.patientName,
    amount: amountFormatted,
    consultationDateTime: params.consultationDateTime
      ? new Date(params.consultationDateTime).toLocaleString('pt-BR')
      : '',
    confirmationUrl: params.confirmationUrl || '',
  });

  await sendEmail({
    to: params.to,
    subject: template.subject,
    html,
  });
}

export async function sendPrescriptionIssuedEmail(params: {
  to: string;
  patientName: string;
  prescriptionUrl: string;
}) {
  const template = await getEmailTemplate('PRESCRIPTION_ISSUED');

  const html = renderTemplate(template.html, {
    patientName: params.patientName,
    prescriptionUrl: params.prescriptionUrl,
  });

  await sendEmail({
    to: params.to,
    subject: template.subject,
    html,
  });
}

export async function sendAccountWelcomeEmail(params: {
  to: string;
  patientName: string;
}) {
  const template = await getEmailTemplate('ACCOUNT_WELCOME');

  const html = renderTemplate(template.html, {
    patientName: params.patientName,
  });

  await sendEmail({
    to: params.to,
    subject: template.subject,
    html,
  });
}

export async function sendConsultationReminderEmail(params: {
  to: string;
  patientName: string;
  consultationDateTime: Date | string;
  meetingLink?: string | null;
  reminderType: '24H' | '2H' | '1H' | '10MIN' | 'NOW';
}) {
  let templateType: EmailTemplateType;
  if (params.reminderType === '24H') {
    templateType = 'CONSULTATION_REMINDER_24H';
  } else if (params.reminderType === '2H') {
    templateType = 'CONSULTATION_REMINDER_2H';
  } else if (params.reminderType === '1H') {
    templateType = 'CONSULTATION_REMINDER_1H';
  } else if (params.reminderType === '10MIN') {
    templateType = 'CONSULTATION_REMINDER_10MIN';
  } else {
    templateType = 'CONSULTATION_REMINDER_NOW';
  }

  const template = await getEmailTemplate(templateType);

  const html = renderTemplate(template.html, {
    patientName: params.patientName,
    consultationDateTime: new Date(params.consultationDateTime).toLocaleString('pt-BR'),
    meetingLink: params.meetingLink || '',
  });

  await sendEmail({
    to: params.to,
    subject: template.subject,
    html,
  });
}

export async function sendAccountSetupEmail(params: {
  to: string;
  patientName: string;
  setupUrl: string;
}) {
  const template = await getEmailTemplate('ACCOUNT_SETUP');

  const html = renderTemplate(template.html, {
    patientName: params.patientName,
    setupUrl: params.setupUrl,
  });

  await sendEmail({
    to: params.to,
    subject: template.subject,
    html,
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  userName: string;
  resetUrl: string;
}) {
  const template = await getEmailTemplate('PASSWORD_RESET');

  const html = renderTemplate(template.html, {
    userName: params.userName,
    resetUrl: params.resetUrl,
  });

  await sendEmail({
    to: params.to,
    subject: template.subject,
    html,
  });
}

export async function sendConsultationFollowupEmail(params: {
  to: string;
  patientName: string;
  prescriptionUrl?: string | null;
}) {
  const template = await getEmailTemplate('CONSULTATION_FOLLOWUP');

  const html = renderTemplate(template.html, {
    patientName: params.patientName,
    prescriptionUrl: params.prescriptionUrl || '',
  });

  await sendEmail({
    to: params.to,
    subject: template.subject,
    html,
  });
}

// ---------------------------------------------------------------------------
// Funções antigas mantidas para compatibilidade (usam os novos templates)
// ---------------------------------------------------------------------------

export function getConsultationConfirmationEmail(
  patientName: string,
  consultationDate: Date,
  meetingLink?: string
): EmailData {
  return {
    to: '',
    subject: DEFAULT_EMAIL_TEMPLATES.CONSULTATION_CONFIRMED.subject,
    html: renderTemplate(DEFAULT_EMAIL_TEMPLATES.CONSULTATION_CONFIRMED.html, {
      patientName,
      consultationDateTime: new Date(consultationDate).toLocaleString('pt-BR'),
      meetingLink: meetingLink || '',
    }),
  };
}

export function getPrescriptionEmail(
  patientName: string,
  prescriptionUrl: string
): EmailData {
  return {
    to: '',
    subject: DEFAULT_EMAIL_TEMPLATES.PRESCRIPTION_ISSUED.subject,
    html: renderTemplate(DEFAULT_EMAIL_TEMPLATES.PRESCRIPTION_ISSUED.html, {
      patientName,
      prescriptionUrl,
    }),
  };
}

export function getPaymentConfirmationEmail(patientName: string, amount: number): EmailData {
  const amountFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);

  return {
    to: '',
    subject: DEFAULT_EMAIL_TEMPLATES.PAYMENT_CONFIRMED.subject,
    html: renderTemplate(DEFAULT_EMAIL_TEMPLATES.PAYMENT_CONFIRMED.html, {
      patientName,
      amount: amountFormatted,
    }),
  };
}

// ---------------------------------------------------------------------------
// Funções para convites de remarcação
// ---------------------------------------------------------------------------

export async function sendRescheduleInviteEmail(params: {
  to: string;
  patientName: string;
  doctorName: string;
  currentDateTime: Date | string;
  newDateTime: Date | string;
  message?: string | null;
  acceptUrl: string;
  rejectUrl: string;
  expiresAt: Date | string;
}) {
  const template = await getEmailTemplate('RESCHEDULE_INVITE');

  const html = renderTemplate(template.html, {
    patientName: params.patientName,
    doctorName: params.doctorName,
    currentDateTime: new Date(params.currentDateTime).toLocaleString('pt-BR'),
    newDateTime: new Date(params.newDateTime).toLocaleString('pt-BR'),
    message: params.message || '',
    acceptUrl: params.acceptUrl,
    rejectUrl: params.rejectUrl,
    expiresAt: new Date(params.expiresAt).toLocaleString('pt-BR'),
  });

  await sendEmail({
    to: params.to,
    subject: template.subject,
    html,
  });
}

export async function sendRescheduleInviteAcceptedEmail(params: {
  to: string;
  patientName: string;
  newDateTime: Date | string;
  meetingLink?: string | null;
}) {
  const template = await getEmailTemplate('RESCHEDULE_INVITE_ACCEPTED');

  const html = renderTemplate(template.html, {
    patientName: params.patientName,
    newDateTime: new Date(params.newDateTime).toLocaleString('pt-BR'),
    meetingLink: params.meetingLink || '',
  });

  await sendEmail({
    to: params.to,
    subject: template.subject,
    html,
  });
}

export async function sendRescheduleInviteRejectedEmail(params: {
  to: string;
  doctorName: string;
  patientName: string;
  currentDateTime: Date | string;
}) {
  const template = await getEmailTemplate('RESCHEDULE_INVITE_REJECTED');

  const html = renderTemplate(template.html, {
    doctorName: params.doctorName,
    patientName: params.patientName,
    currentDateTime: new Date(params.currentDateTime).toLocaleString('pt-BR'),
  });

  await sendEmail({
    to: params.to,
    subject: template.subject,
    html,
  });
}

export async function sendRescheduleInviteExpiredEmail(params: {
  to: string;
  doctorName: string;
  patientName: string;
  newDateTime: Date | string;
}) {
  const template = await getEmailTemplate('RESCHEDULE_INVITE_EXPIRED');

  const html = renderTemplate(template.html, {
    doctorName: params.doctorName,
    patientName: params.patientName,
    newDateTime: new Date(params.newDateTime).toLocaleString('pt-BR'),
  });

  await sendEmail({
    to: params.to,
    subject: template.subject,
    html,
  });
}
