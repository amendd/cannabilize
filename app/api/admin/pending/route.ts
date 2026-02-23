import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canAccessAdmin } from '@/lib/roles-permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !canAccessAdmin(session.user?.role)) {
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

    return NextResponse.json(
      {
        consultations,
        prescriptions: completedConsultations,
        anvisa,
        patientCards,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching pending actions:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar ações pendentes' },
      { status: 500 }
    );
  }
}
