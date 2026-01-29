import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { prescriptionId, documents } = body;

    // Verificar se a receita existe
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: { patient: true },
    });

    if (!prescription) {
      return NextResponse.json(
        { error: 'Receita não encontrada' },
        { status: 404 }
      );
    }

    // Verificar permissão
    if (session.user.role !== 'ADMIN' && prescription.patientId !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    // Criar ou atualizar autorização ANVISA
    const authorization = await prisma.anvisaAuthorization.upsert({
      where: { prescriptionId },
      create: {
        prescriptionId,
        patientId: prescription.patientId,
        status: 'PENDING',
        documents,
      },
      update: {
        documents,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      id: authorization.id,
      message: 'Solicitação de autorização ANVISA criada com sucesso',
    });
  } catch (error) {
    console.error('Error creating ANVISA authorization:', error);
    return NextResponse.json(
      { error: 'Erro ao criar autorização ANVISA' },
      { status: 500 }
    );
  }
}

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
    } else if (session.user.role !== 'ADMIN' && session.user.role !== 'DOCTOR') {
      where.patientId = session.user.id;
    }

    if (status) {
      where.status = status;
    }

    const authorizations = await prisma.anvisaAuthorization.findMany({
      where,
      include: {
        prescription: {
          include: {
            consultation: {
              include: {
                patient: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        import: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(authorizations);
  } catch (error) {
    console.error('Error fetching ANVISA authorizations:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar autorizações ANVISA' },
      { status: 500 }
    );
  }
}
