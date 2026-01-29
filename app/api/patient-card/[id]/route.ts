import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET - Busca carteirinha por ID (público, usado para validação)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cardId = params.id;

    const card = await prisma.patientCard.findUnique({
      where: { id: cardId },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            cpf: true,
            // Evitar expor PII demais em rota pública
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
          },
        },
      },
    });

    if (!card) {
      return NextResponse.json(
        { error: 'Carteirinha não encontrada' },
        { status: 404 }
      );
    }

    const now = new Date();
    const isExpired = !!(card.expiresAt && new Date(card.expiresAt) < now);
    const isApproved = card.approvalStatus === 'APPROVED';
    const isActive = card.status === 'ACTIVE';
    const isValid = isApproved && isActive && !isExpired;

    return NextResponse.json({
      ...card,
      validation: {
        isValid,
        isApproved,
        isExpired,
        status: card.status,
        approvalStatus: card.approvalStatus,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar carteirinha:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar carteirinha' },
      { status: 500 }
    );
  }
}
