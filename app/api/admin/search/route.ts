import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'DOCTOR')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all';

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    const results: any = {
      patients: [],
      consultations: [],
      prescriptions: [],
    };

    if (type === 'all' || type === 'patients') {
      results.patients = await prisma.user.findMany({
        where: {
          role: 'PATIENT',
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { cpf: { contains: query } },
          ],
        },
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      });
    }

    if (type === 'all' || type === 'consultations') {
      results.consultations = await prisma.consultation.findMany({
        where: {
          OR: [
            {
              patient: {
                name: { contains: query, mode: 'insensitive' },
              },
            },
            {
              patient: {
                email: { contains: query, mode: 'insensitive' },
              },
            },
          ],
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        take: 10,
      });
    }

    if (type === 'all' || type === 'prescriptions') {
      results.prescriptions = await prisma.prescription.findMany({
        where: {
          patient: {
            name: { contains: query, mode: 'insensitive' },
          },
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        take: 10,
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar' },
      { status: 500 }
    );
  }
}
