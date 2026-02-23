import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET - Lista todas as carteirinhas (admin apenas)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // PENDING, APPROVED, REJECTED
    const approvalStatus = searchParams.get('approvalStatus');

    const where: any = {};
    if (status) where.status = status;
    if (approvalStatus) where.approvalStatus = approvalStatus;

    const cards = await prisma.patientCard.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            cpf: true,
            phone: true,
            birthDate: true,
            image: true,
          },
        },
        activePrescription: {
          include: {
            doctor: {
              select: {
                name: true,
                crm: true,
              },
            },
            consultation: {
              select: {
                scheduledAt: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error('Erro ao buscar carteirinhas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar carteirinhas' },
      { status: 500 }
    );
  }
}
