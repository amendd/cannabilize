import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getDefaultConsultationDurationMinutes } from '@/lib/consultation-config';

const availabilitySchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  duration: z.number().min(10).max(120).optional(),
  active: z.boolean().default(true),
});

// GET - Listar disponibilidades do médico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'DOCTOR')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const availabilities = await prisma.doctorAvailability.findMany({
      where: { doctorId: params.id },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return NextResponse.json({ availabilities });
  } catch (error) {
    console.error('Erro ao buscar disponibilidades:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar disponibilidades' },
      { status: 500 }
    );
  }
}

// POST - Criar disponibilidade (ADMIN ou o próprio médico)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'DOCTOR')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (!doctor || doctor.id !== params.id) {
        return NextResponse.json(
          { error: 'Você só pode editar sua própria disponibilidade.' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const parsed = availabilitySchema.parse(body);
    const duration = typeof parsed.duration === 'number'
      ? parsed.duration
      : await getDefaultConsultationDurationMinutes();
    const data = { ...parsed, duration };

    // Verificar se já existe disponibilidade para esse dia e horário
    const existing = await prisma.doctorAvailability.findFirst({
      where: {
        doctorId: params.id,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Já existe disponibilidade para esse horário' },
        { status: 400 }
      );
    }

    const availability = await prisma.doctorAvailability.create({
      data: {
        doctorId: params.id,
        ...data,
      },
    });

    return NextResponse.json({ availability }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao criar disponibilidade:', error);
    return NextResponse.json(
      { error: 'Erro ao criar disponibilidade' },
      { status: 500 }
    );
  }
}

// DELETE - Remover disponibilidade (ADMIN ou o próprio médico)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'DOCTOR')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (!doctor || doctor.id !== params.id) {
        return NextResponse.json(
          { error: 'Você só pode remover sua própria disponibilidade.' },
          { status: 403 }
        );
      }
    }

    const searchParams = request.nextUrl.searchParams;
    const availabilityId = searchParams.get('availabilityId');

    if (!availabilityId) {
      return NextResponse.json(
        { error: 'ID da disponibilidade é obrigatório' },
        { status: 400 }
      );
    }

    const availability = await prisma.doctorAvailability.findUnique({
      where: { id: availabilityId },
      select: { doctorId: true },
    });
    if (!availability || availability.doctorId !== params.id) {
      return NextResponse.json(
        { error: 'Disponibilidade não encontrada ou não pertence a este médico.' },
        { status: 404 }
      );
    }

    await prisma.doctorAvailability.delete({
      where: { id: availabilityId },
    });

    return NextResponse.json({ message: 'Disponibilidade removida' });
  } catch (error) {
    console.error('Erro ao remover disponibilidade:', error);
    return NextResponse.json(
      { error: 'Erro ao remover disponibilidade' },
      { status: 500 }
    );
  }
}
