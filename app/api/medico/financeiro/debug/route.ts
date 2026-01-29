import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Endpoint de debug para diagnosticar problemas no cálculo financeiro
 * Mostra detalhes de todas as consultas do médico para identificar problemas
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Resolver doctorId
    let doctorId: string | null = null;
    if (session.user.role === 'DOCTOR') {
      if (session.user.doctorId) {
        doctorId = session.user.doctorId as string;
      } else {
        const doctor = await prisma.doctor.findUnique({
          where: { userId: session.user.id },
          select: { id: true },
        });
        doctorId = doctor?.id || null;
      }
    } else {
      doctorId = request.nextUrl.searchParams.get('doctorId');
    }

    if (!doctorId) {
      return NextResponse.json({ error: 'Médico não encontrado' }, { status: 404 });
    }

    // Buscar todas as consultas do médico com detalhes
    const allConsultations = await prisma.consultation.findMany({
      where: { doctorId },
      include: {
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            paidAt: true,
          },
        },
        prescription: {
          select: {
            id: true,
            issuedAt: true,
            status: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    });

    // Analisar cada consulta
    const analysis = allConsultations.map((consultation) => {
      const hasPrescription = !!consultation.prescription;
      const hasPayment = !!consultation.payment;
      const paymentPaid = consultation.payment?.status === 'PAID';
      const isCompleted = consultation.status === 'COMPLETED';
      const paymentAmount = consultation.payment?.amount || 0;

      // Verificar se conta para o saldo disponível
      const countsForAvailable =
        isCompleted && hasPrescription && hasPayment && paymentPaid;

      return {
        consultationId: consultation.id,
        patientName: consultation.patient.name,
        patientEmail: consultation.patient.email,
        scheduledAt: consultation.scheduledAt,
        status: consultation.status,
        hasPrescription,
        prescriptionId: consultation.prescription?.id || null,
        prescriptionIssuedAt: consultation.prescription?.issuedAt || null,
        hasPayment,
        paymentId: consultation.payment?.id || null,
        paymentStatus: consultation.payment?.status || null,
        paymentAmount,
        paymentPaidAt: consultation.payment?.paidAt || null,
        countsForAvailable,
        reasonNotCounted: !isCompleted
          ? 'Consulta não está COMPLETED'
          : !hasPrescription
          ? 'Consulta não tem receita emitida'
          : !hasPayment
          ? 'Consulta não tem pagamento associado'
          : !paymentPaid
          ? `Pagamento não está PAID (status: ${consultation.payment?.status})`
          : null,
      };
    });

    // Calcular totais
    const totals = {
      totalConsultations: allConsultations.length,
      completedConsultations: allConsultations.filter((c) => c.status === 'COMPLETED').length,
      withPrescription: allConsultations.filter((c) => !!c.prescription).length,
      withPayment: allConsultations.filter((c) => !!c.payment).length,
      paidPayments: allConsultations.filter(
        (c) => c.payment?.status === 'PAID'
      ).length,
      countsForAvailable: analysis.filter((a) => a.countsForAvailable).length,
      totalAvailableAmount: analysis
        .filter((a) => a.countsForAvailable)
        .reduce((sum, a) => sum + a.paymentAmount, 0),
    };

    return NextResponse.json({
      doctorId,
      totals,
      consultations: analysis,
    });
  } catch (error) {
    console.error('Error in finance debug:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar diagnóstico', details: String(error) },
      { status: 500 }
    );
  }
}
