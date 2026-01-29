import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// DELETE - Deletar receita (apenas ADMIN para testes)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado. Apenas ADMIN pode deletar receitas.' },
        { status: 401 }
      );
    }

    const prescription = await prisma.prescription.findUnique({
      where: { id: params.id },
    });

    if (!prescription) {
      return NextResponse.json(
        { error: 'Receita não encontrada' },
        { status: 404 }
      );
    }

    await prisma.prescription.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Receita deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar receita:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar receita' },
      { status: 500 }
    );
  }
}
