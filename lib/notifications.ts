// Sistema de Notificações
// Envia notificações por Email e WhatsApp quando uma consulta é agendada

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
}

/**
 * Envia notificação por Email para Admin
 */
export async function notifyAdminByEmail(data: ConsultationNotificationData) {
  try {
    // TODO: Integrar com serviço de email (SendGrid, Resend, etc.)
    // Por enquanto, apenas log
    console.log('📧 [EMAIL] Notificação para Admin:', {
      to: data.adminEmail || 'admin@cannalize.com',
      subject: 'Nova Consulta Agendada',
      body: `
        Nova consulta agendada!
        
        Paciente: ${data.patientName}
        Email: ${data.patientEmail}
        Telefone: ${data.patientPhone || 'Não informado'}
        
        Médico: ${data.doctorName}
        Email: ${data.doctorEmail}
        
        Data: ${new Date(data.scheduledDate).toLocaleDateString('pt-BR')}
        Horário: ${data.scheduledTime}
        
        ID da Consulta: ${data.consultationId}
      `,
    });

    // Exemplo de integração com Resend (descomente quando configurar):
    /*
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'CannaLize <noreply@cannalize.com>',
      to: data.adminEmail || 'admin@cannalize.com',
      subject: 'Nova Consulta Agendada',
      html: `
        <h2>Nova Consulta Agendada</h2>
        <p><strong>Paciente:</strong> ${data.patientName}</p>
        <p><strong>Email:</strong> ${data.patientEmail}</p>
        <p><strong>Telefone:</strong> ${data.patientPhone || 'Não informado'}</p>
        <p><strong>Médico:</strong> ${data.doctorName}</p>
        <p><strong>Data:</strong> ${new Date(data.scheduledDate).toLocaleDateString('pt-BR')}</p>
        <p><strong>Horário:</strong> ${data.scheduledTime}</p>
      `,
    });
    */

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
    // TODO: Integrar com API do WhatsApp (Twilio, Evolution API, etc.)
    // Por enquanto, apenas log
    const message = `🔔 *Nova Consulta Agendada*

👤 *Paciente:* ${data.patientName}
📧 Email: ${data.patientEmail}
📱 Telefone: ${data.patientPhone || 'Não informado'}

👨‍⚕️ *Médico:* ${data.doctorName}

📅 *Data:* ${new Date(data.scheduledDate).toLocaleDateString('pt-BR')}
⏰ *Horário:* ${data.scheduledTime}

ID: ${data.consultationId}`;

    console.log('📱 [WHATSAPP] Notificação para Admin:', {
      to: data.adminPhone || '+5511999999999',
      message,
    });

    // Exemplo de integração com Twilio (descomente quando configurar):
    /*
    const twilio = require('twilio');
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await client.messages.create({
      from: 'whatsapp:+14155238886',
      to: `whatsapp:${data.adminPhone}`,
      body: message,
    });
    */

    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar WhatsApp para admin:', error);
    return { success: false, error };
  }
}

/**
 * Envia notificação por Email para Médico
 */
export async function notifyDoctorByEmail(data: ConsultationNotificationData) {
  try {
    // TODO: Integrar com serviço de email
    console.log('📧 [EMAIL] Notificação para Médico:', {
      to: data.doctorEmail,
      subject: 'Nova Consulta Agendada - Você foi designado',
      body: `
        Você foi designado para uma nova consulta!
        
        Paciente: ${data.patientName}
        Email: ${data.patientEmail}
        Telefone: ${data.patientPhone || 'Não informado'}
        
        Data: ${new Date(data.scheduledDate).toLocaleDateString('pt-BR')}
        Horário: ${data.scheduledTime}
        
        ID da Consulta: ${data.consultationId}
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
    // TODO: Integrar com API do WhatsApp
    const message = `🔔 *Nova Consulta Agendada*

Você foi designado para uma nova consulta!

👤 *Paciente:* ${data.patientName}
📧 Email: ${data.patientEmail}
📱 Telefone: ${data.patientPhone || 'Não informado'}

📅 *Data:* ${new Date(data.scheduledDate).toLocaleDateString('pt-BR')}
⏰ *Horário:* ${data.scheduledTime}

ID: ${data.consultationId}`;

    console.log('📱 [WHATSAPP] Notificação para Médico:', {
      to: data.doctorPhone || '+5511999999999',
      message,
    });

    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar WhatsApp para médico:', error);
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
