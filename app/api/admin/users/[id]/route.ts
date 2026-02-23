import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { handleApiError, checkAuth } from '@/lib/error-handler';
import { canManageUsers } from '@/lib/roles-permissions';
import { createAuditLog, AuditAction, AuditEntity } from '@/lib/audit';
import { isValidAdminMenuGroupId, parseAdminMenuPermissions, stringifyAdminMenuPermissions } from '@/lib/admin-menu';

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'SUBADMIN', 'OPERATOR', 'DOCTOR', 'PATIENT', 'AGRONOMIST'] as const;
const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];

const updateUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
  role: z.enum(ROLES).optional(),
  adminMenuPermissions: z.array(z.string()).optional(),
  phone: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  restore: z.boolean().optional(),
});

// GET - Obter um usuário (ADMIN ou SUPER_ADMIN)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session);
    if (authError) return authError;
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (!canManageUsers(session.user.role)) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        adminMenuPermissions: true,
        phone: true,
        cpf: true,
        address: true,
        birthDate: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        _count: {
          select: { consultations: true, prescriptions: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const response = {
      ...user,
      adminMenuPermissions: user.role === 'SUBADMIN' ? parseAdminMenuPermissions(user.adminMenuPermissions) : undefined,
    };
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error as Error);
  }
}

// PATCH - Atualizar usuário e acessos (ADMIN ou SUPER_ADMIN)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session);
    if (authError) return authError;
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (!canManageUsers(session.user.role)) {
      return NextResponse.json({ error: 'Sem permissão para editar usuários.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Dados inválidos', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (parsed.data.restore === true) {
      if (!existing.deletedAt) {
        return NextResponse.json({ error: 'Usuário já está ativo.' }, { status: 400 });
      }
      await prisma.user.update({
        where: { id },
        data: { deletedAt: null },
      });
      createAuditLog({
        userId: session.user.id,
        action: AuditAction.UPDATE,
        entity: AuditEntity.USER,
        entityId: id,
        metadata: { restore: true, email: existing.email },
      }).catch(() => {});
      return NextResponse.json({ success: true, restored: true });
    }

    if (parsed.data.role === 'SUPER_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Apenas Super Admin pode atribuir o perfil Super Admin.' },
        { status: 403 }
      );
    }

    const data: any = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.email !== undefined) data.email = parsed.data.email.trim().toLowerCase();
    if (parsed.data.role !== undefined) data.role = parsed.data.role;
    if (parsed.data.phone !== undefined) data.phone = parsed.data.phone || null;
    if (parsed.data.cpf !== undefined) data.cpf = parsed.data.cpf ? String(parsed.data.cpf).replace(/\D/g, '') : null;
    if (parsed.data.address !== undefined) data.address = parsed.data.address || null;
    if (parsed.data.role === 'SUBADMIN' && parsed.data.adminMenuPermissions !== undefined) {
      const valid = (parsed.data.adminMenuPermissions as string[]).filter((id) =>
        isValidAdminMenuGroupId(id)
      );
      data.adminMenuPermissions = stringifyAdminMenuPermissions(valid);
    }
    if (parsed.data.role !== undefined && parsed.data.role !== 'SUBADMIN') {
      data.adminMenuPermissions = null;
    }
    if (parsed.data.password && parsed.data.password.trim() !== '') {
      data.password = await bcrypt.hash(parsed.data.password, 10);
      data.passwordChangedAt = new Date();
    }

    // Não permitir remover o último admin (SUPER_ADMIN ou ADMIN)
    if (data.role && !ADMIN_ROLES.includes(data.role) && ADMIN_ROLES.includes(existing.role)) {
      const adminCount = await prisma.user.count({
        where: { role: { in: ADMIN_ROLES }, deletedAt: null },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Deve existir pelo menos um administrador (Admin ou Super Admin) no sistema.' },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        updatedAt: true,
      },
    });

    createAuditLog({
      userId: session.user.id,
      action: AuditAction.UPDATE,
      entity: AuditEntity.USER,
      entityId: id,
      changes: {
        role: data.role ? { from: existing.role, to: data.role } : undefined,
        email: data.email && data.email !== existing.email ? { from: existing.email, to: data.email } : undefined,
        passwordChanged: !!data.password,
      },
    }).catch(() => {});

    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error as Error);
  }
}

// DELETE - Soft delete usuário (ADMIN ou SUPER_ADMIN)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session);
    if (authError) return authError;
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (!canManageUsers(session.user.role)) {
      return NextResponse.json({ error: 'Sem permissão para excluir usuários.' }, { status: 403 });
    }

    const { id } = await params;

    if (session.user.id === id) {
      return NextResponse.json(
        { error: 'Você não pode excluir sua própria conta.' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (existing.deletedAt) {
      return NextResponse.json({ error: 'Usuário já está desativado.' }, { status: 400 });
    }

    if (ADMIN_ROLES.includes(existing.role)) {
      const adminCount = await prisma.user.count({
        where: { role: { in: ADMIN_ROLES }, deletedAt: null },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Não é possível desativar o único administrador do sistema.' },
          { status: 400 }
        );
      }
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    createAuditLog({
      userId: session.user.id,
      action: AuditAction.DELETE,
      entity: AuditEntity.USER,
      entityId: id,
      metadata: { softDelete: true, email: existing.email },
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error as Error);
  }
}
