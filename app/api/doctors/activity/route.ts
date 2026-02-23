import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Atualiza a última atividade do médico (heartbeat)
 * POST /api/doctors/activity
 * Body opcional: { doctorId?: string } — quando ADMIN impersona médico, enviar doctorId para atualizar aquele médico
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Não autorizado. Apenas médicos (ou admin) podem atualizar atividade.' },
        { status: 401 }
      );
    }

    let doctor: { id: string } | null = null;

    // ADMIN pode enviar doctorId no body para atualizar atividade do médico impersonado
    if (session.user.role === 'ADMIN') {
      try {
        const body = await request.json().catch(() => ({}));
        const doctorId = typeof body?.doctorId === 'string' ? body.doctorId.trim() : undefined;
        if (doctorId) {
          const found = await prisma.doctor.findUnique({
            where: { id: doctorId },
            select: { id: true },
          });
          if (found) doctor = found;
        }
      } catch {
        // body vazio ou inválido
      }
    }

    // Médico logado como DOCTOR (ou ADMIN sem doctorId no body): resolver médico pelo userId
    if (!doctor && session.user.role === 'DOCTOR') {
      doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
    }

    // Fallback: médico vinculado só por email
    if (!doctor && session.user.role === 'DOCTOR') {
      let emailToUse = session.user.email;
      if (!emailToUse) {
        const userRow = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { email: true },
        });
        emailToUse = userRow?.email ?? undefined;
      }
      if (emailToUse) {
        const byEmail = await prisma.doctor.findFirst({
          where: { email: emailToUse },
          select: { id: true },
        });
        if (byEmail) {
          doctor = byEmail;
          await prisma.doctor.update({
            where: { id: byEmail.id },
            data: { userId: session.user.id },
          });
        }
      }
    }

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
