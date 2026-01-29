import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST - Rejeita a solicitação de carteirinha
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
    const body = await request.json();
    const { rejectionReason } = body;

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
        { error: 'Não é possível rejeitar uma carteirinha já aprovada' },
        { status: 400 }
      );
    }

    // Rejeitar carteirinha
    const rejectedCard = await prisma.patientCard.update({
      where: { id: cardId },
      data: {
        approvalStatus: 'REJECTED',
        status: 'REJECTED',
        rejectionReason: rejectionReason || 'Solicitação rejeitada pelo administrador',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Carteirinha rejeitada com sucesso',
      card: rejectedCard,
    });
  } catch (error: any) {
    console.error('Erro ao rejeitar carteirinha:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao rejeitar carteirinha' },
      { status: 500 }
    );
  }
}
