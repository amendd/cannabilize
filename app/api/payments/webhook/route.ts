import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPatientCardRequest } from '@/lib/patient-card';
import Stripe from 'stripe';
import { sendPaymentConfirmationEmail } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      console.log('[webhook] Payment confirmed:', {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        metadata: paymentIntent.metadata,
      });

      // Atualizar pagamento no banco
      const updateResult = await prisma.payment.updateMany({
        where: { stripePaymentId: paymentIntent.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      console.log('[webhook] Payment updated:', {
        stripePaymentId: paymentIntent.id,
        recordsUpdated: updateResult.count,
      });

      // Buscar o pagamento atualizado para obter o patientId e dados relacionados
      const payment = await prisma.payment.findFirst({
        where: { stripePaymentId: paymentIntent.id },
        include: {
          consultation: {
            include: {
              prescription: true,
            },
          },
          patient: true,
        },
      });

      if (!payment) {
        console.warn('[webhook] Payment not found after update:', paymentIntent.id);
        return NextResponse.json({ received: true, warning: 'Payment not found' });
      }

      console.log('[webhook] Payment found:', {
        paymentId: payment.id,
        consultationId: payment.consultationId,
        amount: payment.amount,
        status: payment.status,
        paidAt: payment.paidAt,
      });

      // Se a consulta já venceu, cancelar a consulta (pagamento foi confirmado pelo Stripe,
      // então o sistema deve tratar como caso de suporte/reagendamento).
      if (payment?.consultation?.scheduledAt) {
        const now = new Date();
        if (payment.consultation.scheduledAt < now && payment.consultation.status === 'SCHEDULED') {
          await prisma.consultation.update({
            where: { id: payment.consultation.id },
            data: { status: 'CANCELLED' },
          });
          console.warn(
            '[payments/webhook] Pagamento confirmado para consulta vencida. Consulta cancelada:',
            payment.consultation.id
          );
        }
      }

      // Se o pagamento foi confirmado e há uma receita associada, criar solicitação de carteirinha
      if (payment && payment.consultation?.prescription) {
        try {
          await createPatientCardRequest(
            payment.patientId,
            payment.consultation.prescription.id
          );
          console.log(
            'Solicitação de carteirinha criada após confirmação de pagamento para paciente:',
            payment.patientId
          );
        } catch (cardError) {
          console.error(
            'Erro ao criar solicitação de carteirinha após pagamento (não crítico):',
            cardError
          );
        }
      }

      // Enviar email de confirmação de pagamento para o paciente (não bloqueia webhook)
      if (payment?.patient?.email && payment.amount) {
        const consultationDateTime = payment.consultation?.scheduledAt || null;

        // Evitar mandar email "confirmando consulta" se a consulta já venceu
        const now = new Date();
        if (!consultationDateTime || consultationDateTime >= now) {
          sendPaymentConfirmationEmail({
            to: payment.patient.email,
            patientName: payment.patient.name,
            amount: payment.amount,
            consultationDateTime,
          }).catch(error => {
            console.error('Erro ao enviar email de confirmação de pagamento:', error);
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error.message);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}
