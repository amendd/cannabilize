import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleApiError, checkAuth } from '@/lib/error-handler';

const updateMeSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  image: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) =>
        val == null ||
        val.startsWith('data:image/jpeg;base64,') ||
        val.startsWith('data:image/png;base64,') ||
        val.startsWith('data:image/jpg;base64,'),
      { message: 'Formato de imagem inválido. Use JPG ou PNG.' }
    )
    .refine((val) => val == null || val.length <= 14_000_000, {
      message: 'Imagem muito grande. Tamanho máximo: 10MB.',
    }),
});

// GET - retornar perfil do usuário logado
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session);
    if (authError) return authError;
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        name: true,
        email: true,
        phone: true,
        cpf: true,
        birthDate: true,
        address: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH - atualizar perfil do usuário logado
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session);
    if (authError) return authError;
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const data = updateMeSchema.parse(body);

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.cpf !== undefined) updateData.cpf = data.cpf;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.image !== undefined) updateData.image = data.image;

    if (data.birthDate) {
      updateData.birthDate = new Date(data.birthDate);
    } else if (data.birthDate === null) {
      updateData.birthDate = null;
    }

    // Paciente não pode alterar nome nem CPF
    const role = (session.user as { role?: string })?.role;
    if (role === 'PATIENT') {
      delete updateData.name;
      delete updateData.cpf;
    }

    try {
      const user = await prisma.user.update({
        where: { id: session.user.id },
        data: updateData,
        select: {
          id: true,
          role: true,
          name: true,
          email: true,
          phone: true,
          cpf: true,
          birthDate: true,
          address: true,
          image: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({ user, message: 'Perfil atualizado com sucesso' });
    } catch (err: any) {
      if (err?.code === 'P2002' && err?.meta?.target?.includes?.('email')) {
        return NextResponse.json({ error: 'Este email já está em uso por outra conta.' }, { status: 400 });
      }
      throw err;
    }
  } catch (error) {
    return handleApiError(error);
  }
}

