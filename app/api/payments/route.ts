import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    // Verificar permissão: paciente só pode ver seus próprios pagamentos, admin pode ver qualquer um
    if (patientId && session.user.role === 'PATIENT' && patientId !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    const where: any = {};
    if (patientId) {
      where.patientId = patientId;
    } else if (session.user.role !== 'ADMIN' && session.user.role !== 'DOCTOR') {
      where.patientId = session.user.id;
    }

    const payments = await prisma.payment.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pagamentos' },
      { status: 500 }
    );
  }
}

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
    const { paymentId, paymentMethod } = body;

    // Aqui você integraria com Stripe, Mercado Pago, etc.
    // Por enquanto, apenas atualizamos o status

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PROCESSING',
        paymentMethod,
      },
    });

    // Simular processamento de pagamento
    // Em produção, isso seria feito via webhook do gateway de pagamento
    setTimeout(async () => {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });
    }, 2000);

    return NextResponse.json({
      id: payment.id,
      status: payment.status,
      message: 'Pagamento processado com sucesso',
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'Erro ao processar pagamento' },
      { status: 500 }
    );
  }
}
