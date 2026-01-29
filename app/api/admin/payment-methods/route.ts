import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const methods = await prisma.paymentMethod.findMany({
      orderBy: { order: 'asc' },
    });

    // Não retornar chaves secretas
    const safeMethods = methods.map(method => ({
      ...method,
      apiKey: method.apiKey ? '***' : null,
      apiSecret: method.apiSecret ? '***' : null,
      webhookSecret: method.webhookSecret ? '***' : null,
    }));

    return NextResponse.json(safeMethods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar métodos de pagamento' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se o modelo PaymentMethod está disponível
    if (!prisma.paymentMethod) {
      console.error('Prisma Client não possui o modelo PaymentMethod. Execute: npx prisma generate');
      return NextResponse.json(
        { error: 'Modelo PaymentMethod não encontrado. Execute: npx prisma generate' },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log('Received payment method data:', {
      ...body,
      apiKey: body.apiKey ? '***' : null,
      apiSecret: body.apiSecret ? '***' : null,
    });

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

    // Validações básicas
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Nome e tipo são obrigatórios' },
        { status: 400 }
      );
    }

    // Para integração Mercado Pago, validar credenciais
    if (isIntegrated && gateway === 'mercadopago') {
      if (!apiKey || !apiSecret) {
        return NextResponse.json(
          { error: 'Access Token e Public Key são obrigatórios para integração Mercado Pago' },
          { status: 400 }
        );
      }
    }

    // Helper para converter string vazia em null
    const toNullIfEmpty = (value: any): string | null => {
      if (value === null || value === undefined) return null;
      const trimmed = String(value).trim();
      return trimmed === '' ? null : trimmed;
    };

    const method = await prisma.paymentMethod.create({
      data: {
        name: String(name).trim(),
        type: String(type).trim(),
        enabled: Boolean(enabled),
        isIntegrated: Boolean(isIntegrated),
        gateway: toNullIfEmpty(gateway),
        apiKey: toNullIfEmpty(apiKey),
        apiSecret: toNullIfEmpty(apiSecret),
        webhookUrl: toNullIfEmpty(webhookUrl),
        webhookSecret: toNullIfEmpty(webhookSecret),
        minAmount: minAmount !== null && minAmount !== undefined && minAmount !== '' 
          ? parseFloat(String(minAmount)) 
          : null,
        maxAmount: maxAmount !== null && maxAmount !== undefined && maxAmount !== '' 
          ? parseFloat(String(maxAmount)) 
          : null,
        fee: fee !== null && fee !== undefined && fee !== '' 
          ? parseFloat(String(fee)) 
          : null,
        feeType: toNullIfEmpty(feeType),
        description: toNullIfEmpty(description),
        instructions: toNullIfEmpty(instructions),
        icon: toNullIfEmpty(icon),
        order: order !== null && order !== undefined && order !== '' 
          ? parseInt(String(order), 10) 
          : 0,
      },
    });

    console.log('Payment method created successfully:', method.id);

    return NextResponse.json({
      id: method.id,
      message: 'Método de pagamento criado com sucesso',
    });
  } catch (error: any) {
    console.error('Error creating payment method:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    });
    
    // Retornar mensagem de erro mais específica
    let errorMessage = 'Erro ao criar método de pagamento';
    if (error?.code === 'P2002') {
      errorMessage = 'Já existe um método de pagamento com este nome';
    } else if (error?.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
