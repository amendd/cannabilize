import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { approveAndGeneratePatientCard } from '@/lib/patient-card';

/**
 * POST - Aprova e gera a carteirinha do paciente
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const cardId = params.id;

    // Buscar carteirinha para obter o patientId
    const { prisma } = await import('@/lib/prisma');
    const card = await prisma.patientCard.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      return NextResponse.json(
        { error: 'Carteirinha não encontrada' },
        { status: 404 }
      );
    }

    if (card.approvalStatus === 'APPROVED') {
      return NextResponse.json(
        { error: 'Carteirinha já foi aprovada' },
        { status: 400 }
      );
    }

    // Aprovar e gerar carteirinha
    const approvedCard = await approveAndGeneratePatientCard(
      card.patientId,
      session.user.id
    );

    return NextResponse.json({
      message: 'Carteirinha aprovada e gerada com sucesso',
      card: approvedCard,
    });
  } catch (error: any) {
    console.error('Erro ao aprovar carteirinha:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao aprovar carteirinha' },
      { status: 500 }
    );
  }
}
