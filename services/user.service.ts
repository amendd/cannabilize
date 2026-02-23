import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createAuditLog, AuditAction, AuditEntity } from '@/lib/audit';

export interface CreateUserDto {
  email: string;
  name: string;
  password?: string;
  role?: string;
  phone?: string;
  cpf?: string;
  address?: string;
  birthDate?: Date;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  cpf?: string;
  address?: string;
  birthDate?: Date;
  role?: string;
}

export class UserService {
  /**
   * Cria um novo usuário
   */
  async create(data: CreateUserDto, createdBy?: string) {
    const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : null;

    const user = await prisma.user.create({
      data: {
        email: data.email.trim().toLowerCase(),
        name: data.name.trim(),
        password: hashedPassword,
        role: data.role || 'PATIENT',
        phone: data.phone || null,
        cpf: data.cpf ? data.cpf.replace(/\D/g, '') : null,
        address: data.address || null,
        birthDate: data.birthDate || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    // Log de auditoria
    await createAuditLog({
      userId: createdBy,
      action: AuditAction.CREATE,
      entity: AuditEntity.USER,
      entityId: user.id,
      metadata: {
        email: user.email,
        role: user.role,
      },
    }).catch(() => {});

    return user;
  }

  /**
   * Atualiza um usuário
   */
  async update(id: string, data: UpdateUserDto, updatedBy?: string) {
    // Buscar usuário atual para log de mudanças
    const current = await prisma.user.findUnique({
      where: { id },
      select: {
        name: true,
        email: true,
        role: true,
        phone: true,
        cpf: true,
      },
    });

    if (!current) {
      throw new Error('Usuário não encontrado');
    }

    const updateData: any = {};
    
    if (data.name) updateData.name = data.name.trim();
    if (data.email) updateData.email = data.email.trim().toLowerCase();
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
      // Tentar adicionar passwordChangedAt (será ignorado se campo não existir no banco)
      // O Prisma vai tentar usar, mas se a coluna não existir, vamos capturar o erro
      (updateData as any).passwordChangedAt = new Date();
    }
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.cpf !== undefined) updateData.cpf = data.cpf ? data.cpf.replace(/\D/g, '') : null;
    if (data.address !== undefined) updateData.address = data.address || null;
    if (data.birthDate !== undefined) updateData.birthDate = data.birthDate || null;
    if (data.role) updateData.role = data.role;

    let user;
    try {
      user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          updatedAt: true,
        },
      });
    } catch (error: any) {
      // Se der erro de coluna não encontrada (passwordChangedAt), tentar sem ele
      if (error?.message?.includes('no such column') || 
          error?.message?.includes('password_changed_at') ||
          error?.code === 'P2021') {
        // Remover passwordChangedAt e tentar novamente
        delete (updateData as any).passwordChangedAt;
        user = await prisma.user.update({
          where: { id },
          data: updateData,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
            updatedAt: true,
          },
        });
      } else {
        throw error; // Re-lançar outros erros
      }
    }

    // Log de auditoria com mudanças
    const changes: Record<string, any> = {};
    if (data.name && current.name !== data.name) {
      changes.name = { from: current.name, to: data.name };
    }
    if (data.email && current.email !== data.email) {
      changes.email = { from: current.email, to: data.email };
    }
    if (data.role && current.role !== data.role) {
      changes.role = { from: current.role, to: data.role };
    }
    if (data.password) {
      changes.password = { changed: true }; // Não logar senha
    }

    await createAuditLog({
      userId: updatedBy,
      action: data.password ? AuditAction.PASSWORD_CHANGE : AuditAction.UPDATE,
      entity: AuditEntity.USER,
      entityId: id,
      changes: Object.keys(changes).length > 0 ? changes : undefined,
    }).catch(() => {});

    return user;
  }

  /**
   * Busca usuário por ID
   */
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        cpf: true,
        address: true,
        birthDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Busca usuário por email
   */
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
  }

  /**
   * Lista usuários com filtros
   */
  async list(filters?: {
    role?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};

    if (filters?.role) where.role = filters.role;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
