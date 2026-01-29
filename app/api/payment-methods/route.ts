import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// API pública para buscar métodos de pagamento habilitados (usado no checkout)
export async function GET(request: NextRequest) {
  try {
    const methods = await prisma.paymentMethod.findMany({
      where: {
        enabled: true,
      },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        type: true,
        icon: true,
        description: true,
        instructions: true,
        minAmount: true,
        maxAmount: true,
        fee: true,
        feeType: true,
        isIntegrated: true,
        gateway: true,
        // Não retornar chaves secretas
      },
    });

    return NextResponse.json(methods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar métodos de pagamento' },
      { status: 500 }
    );
  }
}
