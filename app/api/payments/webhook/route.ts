import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { createAuditLog, AuditAction, AuditEntity } from '@/lib/audit';
import { handleApiError } from '@/lib/error-handler';
import { runAfterPaymentConfirmed } from '@/lib/payment-confirmed';

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2025-02-24.acacia' });
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Validar webhook secret
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[webhook] STRIPE_WEBHOOK_SECRET não configurado');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err: any) {
      console.error('[webhook] Erro ao validar assinatura:', err.message);
      // Log de tentativa de webhook inválido (possível ataque)
      await createAuditLog({
        action: AuditAction.PAYMENT,
        entity: AuditEntity.PAYMENT,
        metadata: {
          error: 'Invalid webhook signature',
          message: err.message,
          timestamp: new Date().toISOString(),
        },
      }).catch(() => {}); // Não bloquear se log falhar
      
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      console.log('[webhook] Payment confirmed:', {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata,
      });

      // Log de auditoria
      await createAuditLog({
        action: AuditAction.PAYMENT,
        entity: AuditEntity.PAYMENT,
        entityId: paymentIntent.metadata?.consultationId,
        metadata: {
          stripePaymentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: 'succeeded',
          source: 'stripe_webhook',
        },
      }).catch(() => {}); // Não bloquear se log falhar

      // Atualizar pagamento no banco (forma de pagamento pode vir dos metadados enviados no create-intent)
      const metadataMethod = paymentIntent.metadata?.paymentMethod;
      const updateResult = await prisma.payment.updateMany({
        where: { stripePaymentId: paymentIntent.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          ...(metadataMethod && { paymentMethod: metadataMethod }),
        },
      });

      console.log('[webhook] Payment updated:', {
        stripePaymentId: paymentIntent.id,
        recordsUpdated: updateResult.count,
      });

      const payment = await prisma.payment.findFirst({
        where: { stripePaymentId: paymentIntent.id },
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

      // Lógica pós-pagamento centralizada: consulta vencida, carteirinha, email e WhatsApp
      await runAfterPaymentConfirmed(payment.id);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('[webhook] Erro geral:', error);
    
    // Log de erro
    await createAuditLog({
      action: AuditAction.PAYMENT,
      entity: AuditEntity.PAYMENT,
      metadata: {
        error: 'Webhook handler failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
    }).catch(() => {});

    return handleApiError(error);
  }
}
