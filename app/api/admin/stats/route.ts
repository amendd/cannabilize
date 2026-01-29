import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'DOCTOR')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const [totalPatients, totalConsultations, totalPrescriptions, payments] = await Promise.all([
      prisma.user.count({ where: { role: 'PATIENT' } }),
      prisma.consultation.count(),
      prisma.prescription.count(),
      prisma.payment.findMany({
        where: { status: 'PAID' },
        select: { amount: true },
      }),
    ]);

    const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

    return NextResponse.json({
      totalPatients,
      totalConsultations,
      totalPrescriptions,
      totalRevenue,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}
