import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Resolver doctorId
    let doctorId: string | null = null;
    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      doctorId = doctor?.id || null;
    } else if (session.user.role === 'ADMIN' && session.user.doctorId) {
      doctorId = session.user.doctorId;
    }

    if (!doctorId) {
      return NextResponse.json({
        today: 0,
        week: 0,
        prescriptions: 0,
        patientsAttended: 0,
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Domingo da semana

    // Consultas de hoje
    const todayConsultations = await prisma.consultation.count({
      where: {
        doctorId,
        scheduledAt: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS'],
        },
      },
    });

    // Consultas da semana
    const weekConsultations = await prisma.consultation.count({
      where: {
        doctorId,
        scheduledAt: {
          gte: weekStart,
        },
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS'],
        },
      },
    });

    // Receitas emitidas (todas as receitas do médico)
    const prescriptions = await prisma.prescription.count({
      where: {
        doctorId,
      },
    });

    // Pacientes atendidos: consultas COMPLETED com receita emitida
    // Buscar todas as consultas completadas com receita
    const completedConsultationsWithPrescriptions = await prisma.consultation.findMany({
      where: {
        doctorId,
        status: 'COMPLETED',
        prescription: {
          isNot: null, // Deve ter receita associada
        },
      },
      select: {
        patientId: true,
      },
    });

    // Contar pacientes únicos
    const uniquePatientIds = new Set(completedConsultationsWithPrescriptions.map(c => c.patientId));
    const patientsAttended = uniquePatientIds.size;

    return NextResponse.json({
      today: todayConsultations,
      week: weekConsultations,
      prescriptions,
      patientsAttended,
    });
  } catch (error) {
    console.error('Error fetching doctor stats:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}
