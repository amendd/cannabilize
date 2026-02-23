import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Data é obrigatória (formato: YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // Validar formato
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Formato de data inválido. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Calcular dia da semana
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();

    // Buscar todos os médicos
    const allDoctors = await prisma.doctor.findMany({
      where: { active: true },
      include: {
        availabilities: true,
        _count: {
          select: {
            consultations: true,
          },
        },
      },
    });

    // Buscar médicos com disponibilidade para o dia
    const doctorsWithAvailability = await prisma.doctor.findMany({
      where: {
        active: true,
        availabilities: {
          some: {
            dayOfWeek,
            active: true,
          },
        },
      },
      include: {
        availabilities: {
          where: {
            dayOfWeek,
            active: true,
          },
        },
        consultations: {
          where: {
            scheduledDate: date,
            status: {
              in: ['SCHEDULED', 'IN_PROGRESS'],
            },
          },
        },
      },
    });

    // Buscar consultas agendadas para a data
    const consultations = await prisma.consultation.findMany({
      where: {
        scheduledDate: date,
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS'],
        },
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      date,
      dayOfWeek,
      dayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dayOfWeek],
      totalDoctors: allDoctors.length,
      doctorsWithAvailability: doctorsWithAvailability.length,
      doctors: allDoctors.map(d => ({
        id: d.id,
        name: d.name,
        active: d.active,
        totalAvailabilities: d.availabilities.length,
        availabilitiesForDay: d.availabilities.filter(a => a.dayOfWeek === dayOfWeek && a.active),
        availabilities: d.availabilities.map(a => ({
          dayOfWeek: a.dayOfWeek,
          dayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][a.dayOfWeek],
          startTime: a.startTime,
          endTime: a.endTime,
          duration: a.duration,
          active: a.active,
        })),
      })),
      doctorsWithAvailabilityForDay: doctorsWithAvailability.map(d => ({
        id: d.id,
        name: d.name,
        availabilities: d.availabilities.map(a => ({
          startTime: a.startTime,
          endTime: a.endTime,
          duration: a.duration,
        })),
        occupiedSlots: d.consultations.map(c => c.scheduledTime).filter(t => t),
      })),
      consultations: consultations.map(c => ({
        id: c.id,
        doctorId: c.doctorId,
        doctorName: c.doctor?.name,
        scheduledDate: c.scheduledDate,
        scheduledTime: c.scheduledTime,
        status: c.status,
      })),
    });
  } catch (error) {
    console.error('Erro no debug:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao buscar informações',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
