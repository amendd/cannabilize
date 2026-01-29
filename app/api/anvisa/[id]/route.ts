import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'DOCTOR')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status, anvisaNumber, rejectionReason } = body;

    const updateData: any = { status };
    if (anvisaNumber) updateData.anvisaNumber = anvisaNumber;
    if (rejectionReason) updateData.rejectionReason = rejectionReason;

    if (status === 'APPROVED') {
      updateData.approvedAt = new Date();
      updateData.expiresAt = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000); // 2 anos
    }

    const authorization = await prisma.anvisaAuthorization.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(authorization);
  } catch (error) {
    console.error('Error updating ANVISA authorization:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar autorização ANVISA' },
      { status: 500 }
    );
  }
}
