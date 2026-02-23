import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { handleApiError, checkAuth } from '@/lib/error-handler';
import { canManageUsers } from '@/lib/roles-permissions';
import { createAuditLog, AuditAction, AuditEntity } from '@/lib/audit';
import { isValidAdminMenuGroupId, stringifyAdminMenuPermissions } from '@/lib/admin-menu';

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'SUBADMIN', 'OPERATOR', 'DOCTOR', 'PATIENT', 'AGRONOMIST'] as const;

const createUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(ROLES),
  adminMenuPermissions: z.array(z.string()).optional(),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  address: z.string().optional(),
});

// GET - Listar usuários (ADMIN ou SUPER_ADMIN)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session);
    if (authError) return authError;
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (!canManageUsers(session.user.role)) {
      return NextResponse.json({ error: 'Sem permissão para gerenciar usuários.' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const search = searchParams.get('search') || '';
    const includeDeleted = searchParams.get('deleted') === '1';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(10, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = { ...(includeDeleted ? {} : { deletedAt: null }) };
    if (role && ROLES.includes(role as any)) {
      where.role = role;
    }
    if (search.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term } },
        { email: { contains: term } },
        ...(term.replace(/\D/g, '').length >= 3 ? [{ cpf: { contains: term.replace(/\D/g, '') } }] : []),
      ].filter(Boolean);
    }

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
          cpf: true,
          createdAt: true,
          deletedAt: true,
          _count: {
            select: {
              consultations: true,
              prescriptions: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error as Error);
  }
}

// POST - Criar usuário (apenas ADMIN)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Dados inválidos', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { name, email, password, role, adminMenuPermissions, phone, cpf, address } = parsed.data;
    if (role === 'SUPER_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Apenas Super Admin pode criar usuários com perfil Super Admin.' },
        { status: 403 }
      );
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const createData: any = {
      name,
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role,
      phone: phone || null,
      cpf: cpf ? cpf.replace(/\D/g, '') : null,
      address: address || null,
    };
    if (role === 'SUBADMIN' && Array.isArray(adminMenuPermissions)) {
      const valid = adminMenuPermissions.filter((id) => isValidAdminMenuGroupId(id));
      createData.adminMenuPermissions = stringifyAdminMenuPermissions(valid);
    }

    const user = await prisma.user.create({
      data: createData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    createAuditLog({
      userId: session!.user!.id,
      action: AuditAction.CREATE,
      entity: AuditEntity.USER,
      entityId: user.id,
      metadata: { role: user.role, email: user.email },
    }).catch(() => {});

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return handleApiError(error as Error);
  }
}
