import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');

    const where: any = {};
    if (patientId) {
      where.patientId = patientId;
    }
    if (status) {
      where.status = status;
    }

    // Verificar permissão
    if (patientId && session.user.id !== patientId && session.user.role !== 'ADMIN' && session.user.role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    const imports = await prisma.import.findMany({
      where,
      include: {
        anvisaAuthorization: {
          include: {
            prescription: {
              include: {
                consultation: {
                  include: { patient: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(imports);
  } catch (error) {
    console.error('Error fetching imports:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar importações' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'DOCTOR')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { anvisaAuthorizationId, productData, trackingNumber, estimatedDelivery } = body;

    // Verificar se a autorização existe e está aprovada
    const authorization = await prisma.anvisaAuthorization.findUnique({
      where: { id: anvisaAuthorizationId },
    });

    if (!authorization) {
      return NextResponse.json(
        { error: 'Autorização ANVISA não encontrada' },
        { status: 404 }
      );
    }

    if (authorization.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Autorização ANVISA deve estar aprovada para criar importação' },
        { status: 400 }
      );
    }

    // Criar importação
    const importItem = await prisma.import.create({
      data: {
        anvisaAuthorizationId,
        patientId: authorization.patientId,
        productData,
        trackingNumber,
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      id: importItem.id,
      message: 'Importação criada com sucesso',
    });
  } catch (error) {
    console.error('Error creating import:', error);
    return NextResponse.json(
      { error: 'Erro ao criar importação' },
      { status: 500 }
    );
  }
}
