import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
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

    const method = await prisma.paymentMethod.findUnique({
      where: { id: params.id },
    });

    if (!method) {
      return NextResponse.json(
        { error: 'Método não encontrado' },
        { status: 404 }
      );
    }

    // Não retornar chaves secretas
    const safeMethod = {
      ...method,
      apiKey: method.apiKey ? '***' : null,
      apiSecret: method.apiSecret ? '***' : null,
      webhookSecret: method.webhookSecret ? '***' : null,
    };

    return NextResponse.json(safeMethod);
  } catch (error) {
    console.error('Error fetching payment method:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar método de pagamento' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const body = await request.json();
    const {
      name,
      type,
      enabled,
      isIntegrated,
      gateway,
      apiKey,
      apiSecret,
      webhookUrl,
      webhookSecret,
      minAmount,
      maxAmount,
      fee,
      feeType,
      description,
      instructions,
      icon,
      order,
    } = body;

    // Buscar método atual para preservar chaves se não foram fornecidas
    const currentMethod = await prisma.paymentMethod.findUnique({
      where: { id: params.id },
    });

    if (!currentMethod) {
      return NextResponse.json(
        { error: 'Método não encontrado' },
        { status: 404 }
      );
    }

    // Preparar dados de atualização
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (enabled !== undefined) updateData.enabled = enabled;
    if (isIntegrated !== undefined) updateData.isIntegrated = isIntegrated;
    if (gateway !== undefined) updateData.gateway = gateway;
    if (apiKey !== undefined && apiKey !== '' && apiKey !== '***') updateData.apiKey = apiKey;
    if (apiSecret !== undefined && apiSecret !== '' && apiSecret !== '***') updateData.apiSecret = apiSecret;
    if (webhookUrl !== undefined) updateData.webhookUrl = webhookUrl;
    if (webhookSecret !== undefined && webhookSecret !== '' && webhookSecret !== '***') updateData.webhookSecret = webhookSecret;
    if (minAmount !== undefined) updateData.minAmount = minAmount ? parseFloat(minAmount) : null;
    if (maxAmount !== undefined) updateData.maxAmount = maxAmount ? parseFloat(maxAmount) : null;
    if (fee !== undefined) updateData.fee = fee ? parseFloat(fee) : null;
    if (feeType !== undefined) updateData.feeType = feeType;
    if (description !== undefined) updateData.description = description;
    if (instructions !== undefined) updateData.instructions = instructions;
    if (icon !== undefined) updateData.icon = icon;
    if (order !== undefined) updateData.order = order ? parseInt(order) : 0;

    const method = await prisma.paymentMethod.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      id: method.id,
      message: 'Método de pagamento atualizado com sucesso',
    });
  } catch (error) {
    console.error('Error updating payment method:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar método de pagamento' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await prisma.paymentMethod.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'Método de pagamento excluído com sucesso',
    });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir método de pagamento' },
      { status: 500 }
    );
  }
}
