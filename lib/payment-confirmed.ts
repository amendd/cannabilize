/**
 * Lógica executada após confirmação de pagamento (webhook Stripe ou confirmação simulada em teste).
 * Centraliza: cancelar consulta vencida, carteirinha, email e WhatsApp ao paciente.
 */

import { prisma } from './prisma';
import { createPatientCardRequest } from './patient-card';
import { sendPaymentConfirmationEmail } from './email';
import { notifyPatientByWhatsApp, notifyAdminPaymentConfirmed } from './notifications';
import { getAppOrigin } from './app-url';

/**
 * Executa as ações pós-pagamento: consulta vencida, carteirinha (se receita),
 * email e WhatsApp de confirmação ao paciente.
 * Usado pelo webhook Stripe e pelo endpoint de confirmação simulada (modo teste).
 */
export async function runAfterPaymentConfirmed(paymentId: string): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      consultation: {
        include: {
          prescription: true,
          confirmationToken: true,
        },
      },
      patient: true,
    },
  });

  if (!payment) return;

  // Consulta já venceu: cancelar status SCHEDULED para não aparecer como agendada
  if (payment.consultation?.scheduledAt && payment.consultation.status === 'SCHEDULED') {
    const now = new Date();
    if (payment.consultation.scheduledAt < now) {
      await prisma.consultation.update({
        where: { id: payment.consultation.id },
        data: { status: 'CANCELLED' },
      });
    }
  }

  // Carteirinha: se há receita associada, criar solicitação
  if (payment.consultation?.prescription && payment.patientId) {
    try {
      await createPatientCardRequest(payment.patientId, payment.consultation.prescription.id);
    } catch (e) {
      console.error('Erro ao criar solicitação de carteirinha após pagamento (não crítico):', e);
    }
  }

  const consultationDateTime = payment.consultation?.scheduledAt || null;
  const now = new Date();
  const origin = getAppOrigin();

  // Só enviar confirmações se a consulta não tiver vencido
  if (consultationDateTime && consultationDateTime < now) return;

  const token = payment.consultation?.confirmationToken?.token;
  const consultationId = payment.consultationId || '';
  const consultationPageUrl =
    token && consultationId ? `${origin}/consultas/${consultationId}/confirmacao?token=${token}` : undefined;

  // Email de confirmação
  if (payment.patient?.email && payment.amount) {
    sendPaymentConfirmationEmail({
      to: payment.patient.email,
      patientName: payment.patient.name,
      amount: payment.amount,
      consultationDateTime: payment.consultation?.scheduledAt ?? undefined,
      confirmationUrl: consultationPageUrl ?? null,
    }).catch((err) => console.error('Erro ao enviar email de confirmação de pagamento:', err));
  }

  // WhatsApp de confirmação (resumo + link concluir cadastro + página da consulta)
  if (payment.patient?.phone && payment.amount) {
    const setupToken = await prisma.accountSetupToken.findFirst({
      where: { userId: payment.patientId, used: false },
      orderBy: { expiresAt: 'desc' },
    });
    const setupUrl = setupToken ? `${origin}/concluir-cadastro?token=${setupToken.token}` : undefined;

    notifyPatientByWhatsApp({
      patientName: payment.patient.name,
      patientPhone: payment.patient.phone,
      type: 'PAYMENT_CONFIRMED',
      paymentData: {
        patientName: payment.patient.name,
        amount: payment.amount,
        date: payment.paidAt || new Date(),
        transactionId: payment.transactionId || payment.stripePaymentId || undefined,
        consultationScheduledAt: payment.consultation?.scheduledAt,
        setupUrl,
        consultationPageUrl,
      },
    }).catch((err) => console.error('Erro ao enviar WhatsApp de confirmação de pagamento:', err));
  }

  // Notificar admin por WhatsApp: pagamento confirmado + forma de pagamento
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (admin?.phone && payment.amount) {
    notifyAdminPaymentConfirmed({
      adminPhone: admin.phone,
      patientName: payment.patient?.name ?? 'Paciente',
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      consultationId: payment.consultationId ?? undefined,
      origin,
    }).catch((err) => console.error('Erro ao enviar WhatsApp (pagamento confirmado) para admin:', err));
  }
}
