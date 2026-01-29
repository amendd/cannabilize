import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { consultationId } = body;

    // Buscar consulta e pagamento
    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
      include: { payment: true },
    });

    if (!consultation) {
      return NextResponse.json(
        { error: 'Consulta não encontrada' },
        { status: 404 }
      );
    }

    if (consultation.patientId !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    // Bloquear pagamento para consulta vencida (evita pagar e "confirmar" consulta no passado)
    if (consultation.scheduledAt) {
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
      if (consultation.scheduledAt < fiveMinutesFromNow) {
        return NextResponse.json(
          { error: 'Esta consulta já venceu. Por favor, agende um novo horário.' },
          { status: 400 }
        );
      }
    }

    const amount = consultation.payment?.amount || 50.00;

    // Criar Payment Intent no Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Converter para centavos
      currency: 'brl',
      metadata: {
        consultationId,
        patientId: consultation.patientId,
      },
    });

    // Atualizar pagamento com stripePaymentId
    if (consultation.payment) {
      await prisma.payment.update({
        where: { id: consultation.payment.id },
        data: {
          stripePaymentId: paymentIntent.id,
          status: 'PROCESSING',
        },
      });

      // Em ambiente de teste/desenvolvimento, confirmar pagamento automaticamente após 3 segundos
      // Isso simula o webhook que não funciona em ambiente de teste
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.log('[TEST MODE] Auto-confirming payment in 3 seconds...');
        setTimeout(async () => {
          try {
            await prisma.payment.update({
              where: { id: consultation.payment!.id },
              data: {
                status: 'PAID',
                paidAt: new Date(),
              },
            });
            console.log('[TEST MODE] Payment auto-confirmed:', consultation.payment!.id);
          } catch (error) {
            console.error('[TEST MODE] Error auto-confirming payment:', error);
          }
        }, 3000);
      }
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Erro ao criar pagamento' },
      { status: 500 }
    );
  }
}
