import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Atualiza a última atividade do médico (heartbeat)
 * POST /api/doctors/activity
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Não autorizado. Apenas médicos podem atualizar atividade.' },
        { status: 401 }
      );
    }

    // Buscar médico pelo userId
    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.user.id },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: 'Médico não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar lastActiveAt
    await prisma.doctor.update({
      where: { id: doctor.id },
      data: { lastActiveAt: new Date() },
    });

    return NextResponse.json({ 
      success: true,
      lastActiveAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao atualizar atividade do médico:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar atividade' },
      { status: 500 }
    );
  }
}

/**
 * Verifica se um médico está online
 * GET /api/doctors/activity?doctorId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const doctorId = searchParams.get('doctorId');

    if (!doctorId) {
      return NextResponse.json(
        { error: 'doctorId é obrigatório' },
        { status: 400 }
      );
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        name: true,
        lastActiveAt: true,
        active: true,
      },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: 'Médico não encontrado' },
        { status: 404 }
      );
    }

    // Considerar médico online se última atividade foi nos últimos 5 minutos
    const isOnline = doctor.lastActiveAt 
      ? (new Date().getTime() - new Date(doctor.lastActiveAt).getTime()) < 5 * 60 * 1000
      : false;

    return NextResponse.json({
      doctorId: doctor.id,
      name: doctor.name,
      isOnline,
      lastActiveAt: doctor.lastActiveAt,
      active: doctor.active,
    });
  } catch (error) {
    console.error('Erro ao verificar atividade do médico:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar atividade' },
      { status: 500 }
    );
  }
}
