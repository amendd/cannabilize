import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createPatientCardRequest } from '@/lib/patient-card';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const consultationId = params.id;
    const body = await request.json();
    const { status, paymentMethod } = body;

    // Buscar o pagamento pela consulta
    const payment = await prisma.payment.findFirst({
      where: { consultationId },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o usuário tem permissão
    if (session.user.role !== 'ADMIN' && payment.patientId !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    // Se estiver tentando marcar como pago, bloquear para consulta vencida
    if (status === 'PAID') {
      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        select: { scheduledAt: true, status: true },
      });

      if (consultation?.scheduledAt) {
        const now = new Date();
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
        if (consultation.scheduledAt < fiveMinutesFromNow) {
          return NextResponse.json(
            { error: 'Esta consulta já venceu. Por favor, agende um novo horário.' },
            { status: 400 }
          );
        }
      }
    }

    // Atualizar pagamento
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: status || payment.status,
        paymentMethod: paymentMethod || payment.paymentMethod,
        paidAt: status === 'PAID' ? new Date() : payment.paidAt,
      },
      include: {
        consultation: {
          include: {
            prescription: true,
          },
        },
      },
    });

    // Se o pagamento foi confirmado e há uma receita associada, criar solicitação de carteirinha
    if (updatedPayment.status === 'PAID' && updatedPayment.consultation?.prescription) {
      try {
        await createPatientCardRequest(
          updatedPayment.patientId,
          updatedPayment.consultation.prescription.id
        );
        console.log('Solicitação de carteirinha criada após confirmação de pagamento para paciente:', updatedPayment.patientId);
      } catch (cardError) {
        console.error('Erro ao criar solicitação de carteirinha após pagamento (não crítico):', cardError);
      }
    }

    return NextResponse.json({
      id: updatedPayment.id,
      status: updatedPayment.status,
      message: 'Pagamento atualizado com sucesso',
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar pagamento' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const consultationId = params.id;

    // Buscar o pagamento pela consulta
    const payment = await prisma.payment.findFirst({
      where: { consultationId },
      include: {
        consultation: {
          include: {
            patient: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o usuário tem permissão
    if (session.user.role !== 'ADMIN' && payment.patientId !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pagamento' },
      { status: 500 }
    );
  }
}
