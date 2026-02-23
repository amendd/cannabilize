// Sistema de Notificações
// Envia notificações por Email e WhatsApp quando uma consulta é agendada

import { sendWhatsAppMessage } from './whatsapp';
import {
  getAdminConsultationScheduledMessage,
  getDoctorConsultationAssignedMessage,
  formatPaymentMethodLabel,
} from './whatsapp-templates';
import { sendEmail } from './email';

interface ConsultationNotificationData {
  consultationId: string;
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  doctorName: string;
  doctorEmail: string;
  doctorPhone?: string;
  scheduledDate: string;
  scheduledTime: string;
  adminEmail?: string;
  adminPhone?: string;
  amount?: number;
  /** Forma de pagamento (ex.: PIX, CREDIT_CARD). Se vazio, na mensagem aparece "Aguardando pagamento". */
  paymentMethod?: string | null;
  /** URL base do sistema (ex.: https://site.com) para montar links (ex.: link da consulta para o médico). */
  origin?: string;
}

/**
 * Envia notificação por Email para Admin
 */
export async function notifyAdminByEmail(data: ConsultationNotificationData) {
  try {
    const to = data.adminEmail;
    if (!to) {
      console.log('Email do admin não informado, pulando email');
      return { success: false, error: 'Email não informado' };
    }

    const dateStr = new Date(data.scheduledDate).toLocaleDateString('pt-BR');
    await sendEmail({
      to,
      subject: 'Nova Consulta Agendada - CannabiLizi',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00A859;">Nova Consulta Agendada</h2>
          <p>Uma nova consulta foi agendada no sistema.</p>
          <p><strong>Paciente:</strong> ${data.patientName}</p>
          <p><strong>Email:</strong> ${data.patientEmail}</p>
          <p><strong>Telefone:</strong> ${data.patientPhone || 'Não informado'}</p>
          <p><strong>Médico:</strong> ${data.doctorName}</p>
          <p><strong>Data:</strong> ${dateStr}</p>
          <p><strong>Horário:</strong> ${data.scheduledTime}</p>
          <p><strong>ID da Consulta:</strong> ${data.consultationId}</p>
          <p style="margin-top: 24px;">Atenciosamente,<br>Equipe CannabiLizi</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar email para admin:', error);
    return { success: false, error };
  }
}

/**
 * Envia notificação por WhatsApp para Admin
 */
export async function notifyAdminByWhatsApp(data: ConsultationNotificationData) {
  try {
    if (!data.adminPhone) {
      console.log('Telefone do admin não informado, pulando WhatsApp');
      return { success: false, error: 'Telefone não informado' };
    }

    const message = await getAdminConsultationScheduledMessage({
      patientName: data.patientName,
      doctorName: data.doctorName,
      date: data.scheduledDate,
      time: data.scheduledTime,
      amount: data.amount || 0,
      consultationId: data.consultationId,
      paymentMethod: data.paymentMethod ?? undefined,
    });

    const result = await sendWhatsAppMessage({
      to: data.adminPhone,
      message,
    });

    return result;
  } catch (error) {
    console.error('Erro ao enviar WhatsApp para admin:', error);
    return { success: false, error };
  }
}

/**
 * Envia notificação por WhatsApp para Admin quando um pagamento é confirmado (forma de pagamento + valor).
 */
export async function notifyAdminPaymentConfirmed(data: {
  adminPhone: string;
  patientName: string;
  amount: number;
  paymentMethod?: string | null;
  consultationId?: string;
  origin?: string;
}) {
  try {
    if (!data.adminPhone) return { success: false, error: 'Telefone do admin não informado' };
    const amountStr = data.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const methodLabel = formatPaymentMethodLabel(data.paymentMethod);
    const linkLine = data.consultationId && data.origin
      ? `\n📋 Ver consulta: ${data.origin.replace(/\/$/, '')}/admin/consultas/${data.consultationId}`
      : '';
    const message = `💳 *Pagamento confirmado*

👤 *Paciente:* ${data.patientName}
💰 *Valor:* R$ ${amountStr}
💳 *Forma de pagamento:* ${methodLabel}${linkLine}

CannabiLizi 💚`;
    const result = await sendWhatsAppMessage({
      to: data.adminPhone,
      message,
    });
    return result;
  } catch (error) {
    console.error('Erro ao enviar WhatsApp (pagamento confirmado) para admin:', error);
    return { success: false, error };
  }
}

/**
 * Envia notificação por Email para Médico
 */
export async function notifyDoctorByEmail(data: ConsultationNotificationData) {
  try {
    const to = data.doctorEmail;
    if (!to) {
      console.log('Email do médico não informado, pulando email');
      return { success: false, error: 'Email não informado' };
    }

    const dateStr = new Date(data.scheduledDate).toLocaleDateString('pt-BR');
    await sendEmail({
      to,
      subject: 'Nova Consulta Agendada - Você foi designado - CannabiLizi',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00A859;">Nova Consulta Designada</h2>
          <p>Olá Dr(a). ${data.doctorName},</p>
          <p>Você foi designado para uma nova consulta.</p>
          <p><strong>Paciente:</strong> ${data.patientName}</p>
          <p><strong>Email:</strong> ${data.patientEmail}</p>
          <p><strong>Telefone:</strong> ${data.patientPhone || 'Não informado'}</p>
          <p><strong>Data:</strong> ${dateStr}</p>
          <p><strong>Horário:</strong> ${data.scheduledTime}</p>
          <p><strong>ID da Consulta:</strong> ${data.consultationId}</p>
          <p style="margin-top: 24px;">Atenciosamente,<br>Equipe CannabiLizi</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar email para médico:', error);
    return { success: false, error };
  }
}

/**
 * Envia notificação por WhatsApp para Médico
 */
export async function notifyDoctorByWhatsApp(data: ConsultationNotificationData) {
  try {
    if (!data.doctorPhone) {
      console.log('Telefone do médico não informado, pulando WhatsApp');
      return { success: false, error: 'Telefone não informado' };
    }

    const consultationLink = data.origin && data.consultationId
      ? `${data.origin.replace(/\/$/, '')}/medico/consultas/${data.consultationId}`
      : undefined;

    const message = await getDoctorConsultationAssignedMessage({
      doctorName: data.doctorName,
      patientName: data.patientName,
      patientEmail: data.patientEmail,
      patientPhone: data.patientPhone,
      date: new Date(data.scheduledDate).toLocaleDateString('pt-BR'),
      time: data.scheduledTime,
      consultationId: data.consultationId,
      consultationLink: consultationLink || undefined,
    });

    const result = await sendWhatsAppMessage({
      to: data.doctorPhone,
      message,
    });

    return result;
  } catch (error) {
    console.error('Erro ao enviar WhatsApp para médico:', error);
    return { success: false, error };
  }
}

/**
 * Envia notificação por WhatsApp para Paciente
 */
export async function notifyPatientByWhatsApp(data: {
  patientName: string;
  patientPhone?: string;
  type: 'CONSULTATION_CONFIRMED' | 'PAYMENT_CONFIRMED' | 'PRESCRIPTION_ISSUED' | 'ACCOUNT_WELCOME' | 'ACCOUNT_SETUP';
  consultationData?: any;
  paymentData?: any;
  prescriptionData?: any;
  setupUrl?: string;
}) {
  try {
    if (!data.patientPhone) {
      console.log('Telefone do paciente não informado, pulando WhatsApp');
      return { success: false, error: 'Telefone não informado' };
    }

    let message = '';

    switch (data.type) {
      case 'CONSULTATION_CONFIRMED':
        const { getConsultationConfirmedMessage } = await import('./whatsapp-templates');
        message = await getConsultationConfirmedMessage(data.consultationData);
        break;
      case 'PAYMENT_CONFIRMED':
        const { getPaymentConfirmedMessage } = await import('./whatsapp-templates');
        message = await getPaymentConfirmedMessage(data.paymentData);
        break;
      case 'PRESCRIPTION_ISSUED':
        const { getPrescriptionIssuedMessage } = await import('./whatsapp-templates');
        message = await getPrescriptionIssuedMessage(data.prescriptionData);
        break;
      case 'ACCOUNT_WELCOME':
        const { getAccountWelcomeMessage } = await import('./whatsapp-templates');
        message = await getAccountWelcomeMessage({ patientName: data.patientName });
        break;
      case 'ACCOUNT_SETUP':
        const { getAccountSetupMessage } = await import('./whatsapp-templates');
        message = await getAccountSetupMessage({ patientName: data.patientName, setupUrl: data.setupUrl || '' });
        break;
      default:
        return { success: false, error: 'Tipo de notificação inválido' };
    }

    const result = await sendWhatsAppMessage({
      to: data.patientPhone,
      message,
    });

    return result;
  } catch (error) {
    console.error('Erro ao enviar WhatsApp para paciente:', error);
    return { success: false, error };
  }
}

/**
 * Envia todas as notificações quando uma consulta é agendada
 */
export async function notifyConsultationScheduled(data: ConsultationNotificationData) {
  const results = {
    adminEmail: await notifyAdminByEmail(data),
    adminWhatsApp: await notifyAdminByWhatsApp(data),
    doctorEmail: await notifyDoctorByEmail(data),
    doctorWhatsApp: await notifyDoctorByWhatsApp(data),
  };

  return results;
}
