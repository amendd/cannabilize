import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleApiError, checkAuth } from '@/lib/error-handler';

// GET - Listar pacientes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const authError = checkAuth(session);
    if (authError) return authError;

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado. Apenas administradores podem acessar.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || 'PATIENT';

    // Construir filtros
    const where: any = {
      role: role,
    };

    if (search) {
      // SQLite não suporta mode: 'insensitive', mas é case-insensitive por padrão
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { cpf: { contains: search } },
      ];
    }

    const patients = await prisma.user.findMany({
      where,
      include: {
        consultations: {
          select: {
            id: true,
            status: true,
            scheduledAt: true,
          },
          orderBy: {
            scheduledAt: 'desc',
          },
          take: 5, // Últimas 5 consultas
        },
        prescriptions: {
          select: {
            id: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 3, // Últimas 3 receitas
        },
        patientPathologies: {
          include: {
            pathology: {
              select: {
                name: true,
              },
            },
          },
        },
        patientCard: {
          select: {
            status: true,
            approvalStatus: true,
            cardNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ patients });
  } catch (error) {
    return handleApiError(error);
  }
}
