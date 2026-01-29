import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Endpoint para confirmar pagamentos manualmente em ambiente de teste
 * Útil quando webhooks não funcionam em sandbox/teste
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Permitir apenas em desenvolvimento/teste
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Esta funcionalidade só está disponível em ambiente de teste' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { paymentId, consultationId } = body;

    if (!paymentId && !consultationId) {
      return NextResponse.json(
        { error: 'Informe paymentId ou consultationId' },
        { status: 400 }
      );
    }

    // Buscar pagamento
    const payment = await prisma.payment.findFirst({
      where: paymentId
        ? { id: paymentId }
        : { consultationId: consultationId! },
      include: {
        consultation: {
          include: {
            prescription: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
    }

    if (payment.status === 'PAID') {
      return NextResponse.json({
        message: 'Pagamento já está confirmado',
        payment: {
          id: payment.id,
          status: payment.status,
          paidAt: payment.paidAt,
        },
      });
    }

    // Confirmar pagamento
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
      include: {
        consultation: {
          include: {
            prescription: true,
            patient: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Se há receita associada, criar solicitação de carteirinha
    if (updatedPayment.consultation?.prescription) {
      try {
        const { createPatientCardRequest } = await import('@/lib/patient-card');
        await createPatientCardRequest(
          updatedPayment.patientId,
          updatedPayment.consultation.prescription.id
        );
        console.log('[TEST MODE] Patient card request created for:', updatedPayment.patientId);
      } catch (cardError) {
        console.error('[TEST MODE] Error creating patient card (non-critical):', cardError);
      }
    }

    return NextResponse.json({
      message: 'Pagamento confirmado com sucesso (modo teste)',
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
        amount: updatedPayment.amount,
        paidAt: updatedPayment.paidAt,
        consultation: {
          id: updatedPayment.consultation?.id,
          status: updatedPayment.consultation?.status,
          patient: updatedPayment.consultation?.patient,
        },
      },
    });
  } catch (error) {
    console.error('Error confirming test payment:', error);
    return NextResponse.json(
      { error: 'Erro ao confirmar pagamento', details: String(error) },
      { status: 500 }
    );
  }
}
