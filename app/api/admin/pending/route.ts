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

    const [consultations, completedConsultations, anvisa, patientCards] = await Promise.all([
      prisma.consultation.count({ where: { status: 'SCHEDULED' } }),
      prisma.consultation.count({
        where: {
          status: 'COMPLETED',
          prescription: null,
        },
      }),
      prisma.anvisaAuthorization.count({ where: { status: 'PENDING' } }),
      prisma.patientCard.count({ where: { approvalStatus: 'PENDING' } }),
    ]);

    return NextResponse.json({
      consultations,
      prescriptions: completedConsultations,
      anvisa,
      patientCards,
    });
  } catch (error) {
    console.error('Error fetching pending actions:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar ações pendentes' },
      { status: 500 }
    );
  }
}
