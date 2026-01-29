import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { handleApiError, checkAuth } from '@/lib/error-handler';

const ROLES = ['ADMIN', 'DOCTOR', 'PATIENT'] as const;

const updateUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
  role: z.enum(ROLES).optional(),
  phone: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

// GET - Obter um usuário (apenas ADMIN)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const { id } = await params;
    const user = await prisma.user.findUnique({
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
        _count: {
          select: { consultations: true, prescriptions: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error as Error);
  }
}

// PATCH - Atualizar usuário e acessos (apenas ADMIN)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

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

    const data: any = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.email !== undefined) data.email = parsed.data.email.trim().toLowerCase();
    if (parsed.data.role !== undefined) data.role = parsed.data.role;
    if (parsed.data.phone !== undefined) data.phone = parsed.data.phone || null;
    if (parsed.data.cpf !== undefined) data.cpf = parsed.data.cpf ? String(parsed.data.cpf).replace(/\D/g, '') : null;
    if (parsed.data.address !== undefined) data.address = parsed.data.address || null;
    if (parsed.data.password && parsed.data.password.trim() !== '') {
      data.password = await bcrypt.hash(parsed.data.password, 10);
    }

    // Não permitir remover o último ADMIN
    if (data.role && data.role !== 'ADMIN' && existing.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Não é possível alterar o perfil: deve existir pelo menos um administrador.' },
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

    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error as Error);
  }
}

// DELETE - Excluir usuário (apenas ADMIN)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const { id } = await params;

    // Não permitir excluir a si mesmo
    if (session!.user!.id === id) {
      return NextResponse.json(
        { error: 'Você não pode excluir sua própria conta.' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Não permitir excluir o último ADMIN
    if (existing.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Não é possível excluir o único administrador do sistema.' },
          { status: 400 }
        );
      }
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error as Error);
  }
}
