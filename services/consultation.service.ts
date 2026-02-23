import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createAuditLog, AuditAction, AuditEntity } from '@/lib/audit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export interface CreateConsultationDto {
  patientId: string;
  doctorId?: string;
  scheduledAt: Date;
  scheduledDate: string;
  scheduledTime: string;
  pathologies: string[];
  anamnesis?: {
    previousTreatments?: string;
    currentMedications?: string;
    allergies?: string;
    additionalInfo?: string;
  };
}

export interface UpdateConsultationDto {
  scheduledAt?: Date;
  scheduledDate?: string;
  scheduledTime?: string;
  status?: string;
  anamnesis?: string;
  notes?: string;
  nextReturnDate?: Date;
}

export class ConsultationService {
  /**
   * Cria uma nova consulta
   */
  async create(data: CreateConsultationDto, userId?: string) {
    const consultation = await prisma.consultation.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        scheduledAt: data.scheduledAt,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        status: 'SCHEDULED',
        anamnesis: data.anamnesis ? JSON.stringify(data.anamnesis) : null,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            crm: true,
          },
        },
      },
    });

    // Log de auditoria
    await createAuditLog({
      userId,
      action: AuditAction.CREATE,
      entity: AuditEntity.CONSULTATION,
      entityId: consultation.id,
      metadata: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        scheduledAt: data.scheduledAt.toISOString(),
      },
    }).catch(() => {});

    return consultation;
  }

  /**
   * Atualiza uma consulta
   */
  async update(id: string, data: UpdateConsultationDto, userId?: string) {
    // Buscar consulta atual para log de mudanças
    const current = await prisma.consultation.findUnique({
      where: { id },
    });

    if (!current) {
      throw new Error('Consulta não encontrada');
    }

    const updateData: Prisma.ConsultationUpdateInput = {};
    
    if (data.scheduledAt) updateData.scheduledAt = data.scheduledAt;
    if (data.scheduledDate) updateData.scheduledDate = data.scheduledDate;
    if (data.scheduledTime) updateData.scheduledTime = data.scheduledTime;
    if (data.status) updateData.status = data.status;
    if (data.anamnesis !== undefined) updateData.anamnesis = data.anamnesis;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.nextReturnDate !== undefined) updateData.nextReturnDate = data.nextReturnDate;

    const consultation = await prisma.consultation.update({
      where: { id },
      data: updateData,
    });

    // Log de auditoria com mudanças
    const changes: Record<string, any> = {};
    if (data.scheduledAt && current.scheduledAt?.getTime() !== data.scheduledAt.getTime()) {
      changes.scheduledAt = { from: current.scheduledAt, to: data.scheduledAt };
    }
    if (data.status && current.status !== data.status) {
      changes.status = { from: current.status, to: data.status };
    }

    await createAuditLog({
      userId,
      action: AuditAction.UPDATE,
      entity: AuditEntity.CONSULTATION,
      entityId: id,
      changes: Object.keys(changes).length > 0 ? changes : undefined,
    }).catch(() => {});

    return consultation;
  }

  /**
   * Deleta uma consulta
   */
  async delete(id: string, userId?: string) {
    const consultation = await prisma.consultation.findUnique({
      where: { id },
    });

    if (!consultation) {
      throw new Error('Consulta não encontrada');
    }

    await prisma.consultation.delete({
      where: { id },
    });

    // Log de auditoria
    await createAuditLog({
      userId,
      action: AuditAction.DELETE,
      entity: AuditEntity.CONSULTATION,
      entityId: id,
      metadata: {
        patientId: consultation.patientId,
        scheduledAt: consultation.scheduledAt.toISOString(),
      },
    }).catch(() => {});
  }

  /**
   * Busca consulta por ID
   */
  async findById(id: string) {
    return prisma.consultation.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
        prescription: true,
        payment: true,
        files: true,
      },
    });
  }

  /**
   * Lista consultas com filtros
   */
  async list(filters?: {
    patientId?: string;
    doctorId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const where: Prisma.ConsultationWhereInput = {};

    if (filters?.patientId) where.patientId = filters.patientId;
    if (filters?.doctorId) where.doctorId = filters.doctorId;
    if (filters?.status) where.status = filters.status;
    if (filters?.startDate || filters?.endDate) {
      where.scheduledAt = {};
      if (filters.startDate) where.scheduledAt.gte = filters.startDate;
      if (filters.endDate) where.scheduledAt.lte = filters.endDate;
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [consultations, total] = await Promise.all([
      prisma.consultation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          doctor: {
            select: {
              id: true,
              name: true,
              crm: true,
            },
          },
        },
      }),
      prisma.consultation.count({ where }),
    ]);

    return {
      consultations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
