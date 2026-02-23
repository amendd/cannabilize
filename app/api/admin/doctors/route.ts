import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { handleApiError, checkAuth } from '@/lib/error-handler';
import { getDefaultConsultationDurationMinutes } from '@/lib/consultation-config';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

// Schema de validação
const doctorSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  crm: z.string().min(1, 'CRM é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  active: z.boolean().default(true),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  availabilities: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido (use formato HH:MM)'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido (use formato HH:MM)'),
    duration: z.number().min(10).max(120).optional(),
    active: z.boolean().default(true),
  })).optional(),
});

// GET - Listar médicos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const authError = checkAuth(session);
    if (authError) return authError;
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    if (!session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Não autorizado. Apenas administradores e médicos podem acessar.' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '30d'; // '7d', '30d', '90d', 'all'
    const onlineOnly = searchParams.get('onlineOnly') === 'true';

    const nowDate = new Date();
    let fromDate: Date | null = null;

    switch (period) {
      case '7d':
        fromDate = new Date(nowDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        fromDate = new Date(nowDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        fromDate = new Date(nowDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        fromDate = null;
        break;
    }

    const doctors = await prisma.doctor.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        availabilities: {
          where: { active: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // IDs dos médicos para calcular métricas de consultas
    const doctorIds = doctors.map((doctor) => doctor.id);

    let consultationStats: {
      doctorId: string | null;
      status: string;
      _count: { _all: number };
    }[] = [];

    if (doctorIds.length > 0) {
      const where: any = {
        doctorId: {
          in: doctorIds,
        },
      };

      if (fromDate) {
        where.scheduledAt = {
          gte: fromDate,
        };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma groupBy types bug: parameter typed as array
      consultationStats = (await (prisma.consultation.groupBy as any)({
        by: ['doctorId', 'status'],
        where,
        _count: { _all: true },
      })) as typeof consultationStats;
    }

    const metricsByDoctor: Record<
      string,
      {
        totalConsultations: number;
        scheduledConsultations: number;
        inProgressConsultations: number;
        completedConsultations: number;
        cancelledConsultations: number;
        noShowConsultations: number;
      }
    > = {};

    for (const doctorId of doctorIds) {
      metricsByDoctor[doctorId] = {
        totalConsultations: 0,
        scheduledConsultations: 0,
        inProgressConsultations: 0,
        completedConsultations: 0,
        cancelledConsultations: 0,
        noShowConsultations: 0,
      };
    }

    for (const stat of consultationStats) {
      if (!stat.doctorId) continue;

      const metrics = metricsByDoctor[stat.doctorId];
      if (!metrics) continue;

      const count = stat._count._all || 0;
      metrics.totalConsultations += count;

      switch (stat.status) {
        case 'SCHEDULED':
          metrics.scheduledConsultations += count;
          break;
        case 'IN_PROGRESS':
          metrics.inProgressConsultations += count;
          break;
        case 'COMPLETED':
          metrics.completedConsultations += count;
          break;
        case 'CANCELLED':
          metrics.cancelledConsultations += count;
          break;
        case 'NO_SHOW':
          metrics.noShowConsultations += count;
          break;
        default:
          break;
      }
    }

    // Montar resposta com métricas e status online
    const now = Date.now();
    const fiveMinutesInMs = 5 * 60 * 1000;

    const doctorsWithMetrics = doctors.map((doctor) => {
      const metrics = metricsByDoctor[doctor.id] || {
        totalConsultations: 0,
        scheduledConsultations: 0,
        inProgressConsultations: 0,
        completedConsultations: 0,
        cancelledConsultations: 0,
        noShowConsultations: 0,
      };

      const lastActiveAt = doctor.lastActiveAt
        ? new Date(doctor.lastActiveAt).toISOString()
        : null;

      const isOnline =
        doctor.active &&
        lastActiveAt !== null &&
        now - new Date(lastActiveAt).getTime() < fiveMinutesInMs;

      return {
        ...doctor,
        lastActiveAt,
        isOnline,
        ...metrics,
      };
    });

    const filteredDoctors =
      onlineOnly ? doctorsWithMetrics.filter((doctor) => doctor.isOnline) : doctorsWithMetrics;

    return NextResponse.json({ doctors: filteredDoctors });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST - Criar médico
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const body = await request.json();
    
    // Validar dados
    const validatedData = doctorSchema.parse(body);
    const defaultDuration = await getDefaultConsultationDurationMinutes();

    const {
      name,
      crm,
      email,
      phone,
      specialization,
      active,
      password,
      availabilities = [],
    } = validatedData;

    // Verificar se CRM já existe
    const existingCrm = await prisma.doctor.findUnique({
      where: { crm },
    });
    if (existingCrm) {
      return NextResponse.json(
        { 
          error: `CRM ${crm} já está cadastrado para outro médico. Verifique o CRM e tente novamente.`,
          code: 'DUPLICATE_CRM'
        },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      return NextResponse.json(
        { 
          error: `Email ${email} já está cadastrado. Use outro email ou recupere a senha.`,
          code: 'DUPLICATE_EMAIL'
        },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário e médico em transação
    const result = await prisma.$transaction(async (tx) => {
      // Criar usuário
      const user = await tx.user.create({
        data: {
          email,
          name,
          phone,
          password: hashedPassword,
          role: 'DOCTOR',
        },
      });

      // Criar médico
      const doctor = await tx.doctor.create({
        data: {
          name,
          crm,
          email,
          phone,
          specialization,
          active,
          userId: user.id,
        },
      });

      // Criar disponibilidades se fornecidas
      if (availabilities.length > 0) {
        // Validar horários
        for (const avail of availabilities) {
          if (avail.startTime >= avail.endTime) {
            const dayName = DAYS_OF_WEEK.find(d => d.value === avail.dayOfWeek)?.label || 'Dia';
            throw new Error(
              `Horário inválido para ${dayName}: horário de início (${avail.startTime}) deve ser anterior ao horário de fim (${avail.endTime}).`
            );
          }
        }

        await tx.doctorAvailability.createMany({
          data: availabilities.map(avail => ({
            doctorId: doctor.id,
            dayOfWeek: avail.dayOfWeek,
            startTime: avail.startTime,
            endTime: avail.endTime,
            duration: typeof avail.duration === 'number' ? avail.duration : defaultDuration,
            active: avail.active !== false,
          })),
        });
      }

      return { user, doctor };
    });

    // Buscar médico com relacionamentos
    const createdDoctor = await prisma.doctor.findUnique({
      where: { id: result.doctor.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        availabilities: true,
      },
    });

    return NextResponse.json(
      { 
        doctor: createdDoctor,
        message: 'Médico criado com sucesso'
      },
      { status: 201 }
    );
  } catch (error) {
    // Erro de validação Zod
    if (error instanceof z.ZodError) {
      return handleApiError(error);
    }

    // Erro de validação de horário (já tem mensagem específica)
    if (error instanceof Error && error.message.includes('Horário inválido')) {
      return NextResponse.json(
        { 
          error: error.message,
          code: 'INVALID_TIME_RANGE'
        },
        { status: 400 }
      );
    }

    // Outros erros
    return handleApiError(error);
  }
}
