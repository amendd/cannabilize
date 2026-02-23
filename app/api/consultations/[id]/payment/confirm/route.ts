import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runAfterPaymentConfirmed } from '@/lib/payment-confirmed';

/**
 * POST - Confirmar pagamento da consulta (público, sem login).
 * Permite que alguém pague a consulta de outra pessoa (quem tem o link pode pagar).
 * Em modo simulado/teste, também dispara email e WhatsApp de confirmação (mesma lógica do webhook).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const consultationId = params.id;
    const body = await request.json().catch(() => ({}));
    const paymentMethod = body.paymentMethod || 'CREDIT_CARD';

    const payment = await prisma.payment.findFirst({
      where: { consultationId },
      include: { consultation: true },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    if (payment.status === 'PAID') {
      return NextResponse.json({
        id: payment.id,
        status: payment.status,
        message: 'Pagamento já confirmado',
      });
    }

    const consultation = payment.consultation;
    if (consultation?.scheduledAt) {
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
      if (consultation.scheduledAt < fiveMinutesFromNow) {
        return NextResponse.json(
          { error: 'Esta consulta já venceu. Agende um novo horário.' },
          { status: 400 }
        );
      }
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        paymentMethod: paymentMethod || payment.paymentMethod,
        paidAt: new Date(),
      },
    });

    // Disparar notificações (email + WhatsApp) como no webhook do gateway — funciona em modo teste/simulado
    runAfterPaymentConfirmed(updatedPayment.id).catch((err) => {
      console.error('Erro ao enviar notificações pós-pagamento:', err);
    });

    return NextResponse.json({
      id: updatedPayment.id,
      status: updatedPayment.status,
      message: 'Pagamento confirmado com sucesso',
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return NextResponse.json(
      { error: 'Erro ao confirmar pagamento' },
      { status: 500 }
    );
  }
}
