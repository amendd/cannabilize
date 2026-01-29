import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

    if (session.user.id !== params.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    const [totalConsultations, completedConsultations, totalPrescriptions, pendingPayments] = await Promise.all([
      prisma.consultation.count({ where: { patientId: params.id } }),
      prisma.consultation.count({ where: { patientId: params.id, status: 'COMPLETED' } }),
      prisma.prescription.count({ where: { patientId: params.id } }),
      prisma.payment.count({ where: { patientId: params.id, status: 'PENDING' } }),
    ]);

    return NextResponse.json({
      totalConsultations,
      completedConsultations,
      totalPrescriptions,
      pendingPayments,
    });
  } catch (error) {
    console.error('Error fetching patient stats:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}
