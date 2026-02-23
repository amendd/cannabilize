import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { handleApiError, checkAuth } from '@/lib/error-handler';

// Schema de validação
const patientUpdateSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
});

// GET - Buscar paciente específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    const authError = checkAuth(session);
    if (authError) return authError;
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado. Apenas administradores podem acessar.' },
        { status: 403 }
      );
    }

    const patient = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        consultations: {
          select: {
            id: true,
            status: true,
            scheduledAt: true,
            doctor: {
              select: {
                name: true,
                crm: true,
              },
            },
          },
          orderBy: {
            scheduledAt: 'desc',
          },
        },
        prescriptions: {
          select: {
            id: true,
            createdAt: true,
            status: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        patientPathologies: {
          include: {
            pathology: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        patientCard: {
          select: {
            id: true,
            status: true,
            approvalStatus: true,
            cardNumber: true,
            expiresAt: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    if (patient.role !== 'PATIENT') {
      return NextResponse.json(
        { error: 'Usuário não é um paciente' },
        { status: 400 }
      );
    }

    return NextResponse.json(patient);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH - Atualizar paciente
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    
    // Validar dados
    const validatedData = patientUpdateSchema.parse(body);

    // Verificar se paciente existe
    const existingPatient = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!existingPatient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    if (existingPatient.role !== 'PATIENT') {
      return NextResponse.json(
        { error: 'Usuário não é um paciente' },
        { status: 400 }
      );
    }

    // Verificar se email já está em uso por outro usuário
    if (validatedData.email && validatedData.email !== existingPatient.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (emailExists) {
        return NextResponse.json(
          { 
            error: `Email ${validatedData.email} já está cadastrado para outro usuário.`,
            code: 'DUPLICATE_EMAIL'
          },
          { status: 400 }
        );
      }
    }

    // Verificar se CPF já está em uso por outro usuário
    if (validatedData.cpf && validatedData.cpf !== existingPatient.cpf) {
      const cpfExists = await prisma.user.findUnique({
        where: { cpf: validatedData.cpf },
      });

      if (cpfExists) {
        return NextResponse.json(
          { 
            error: `CPF ${validatedData.cpf} já está cadastrado para outro usuário.`,
            code: 'DUPLICATE_CPF'
          },
          { status: 400 }
        );
      }
    }

    // Preparar dados para atualização
    const updateData: any = {};

    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.email) updateData.email = validatedData.email;
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone;
    if (validatedData.cpf !== undefined) updateData.cpf = validatedData.cpf;
    if (validatedData.address !== undefined) updateData.address = validatedData.address;
    
    if (validatedData.birthDate) {
      updateData.birthDate = new Date(validatedData.birthDate);
    } else if (validatedData.birthDate === null) {
      updateData.birthDate = null;
    }

    // Hash da senha se fornecida
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 10);
    }

    // Atualizar paciente
    const updatedPatient = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      include: {
        consultations: {
          select: {
            id: true,
            status: true,
            scheduledAt: true,
          },
          take: 5,
        },
        prescriptions: {
          select: {
            id: true,
            createdAt: true,
          },
          take: 3,
        },
      },
    });

    return NextResponse.json(
      { 
        patient: updatedPatient,
        message: 'Paciente atualizado com sucesso'
      },
      { status: 200 }
    );
  } catch (error) {
    // Erro de validação Zod
    if (error instanceof z.ZodError) {
      return handleApiError(error);
    }

    return handleApiError(error);
  }
}

// DELETE - Excluir paciente (opcional, use com cuidado)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const patient = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    if (patient.role !== 'PATIENT') {
      return NextResponse.json(
        { error: 'Usuário não é um paciente' },
        { status: 400 }
      );
    }

    // Verificar se há consultas ou receitas associadas
    const hasConsultations = await prisma.consultation.count({
      where: { patientId: params.id },
    });

    if (hasConsultations > 0) {
      return NextResponse.json(
        { 
          error: 'Não é possível excluir paciente com consultas cadastradas. Considere desativar o paciente.',
          code: 'HAS_RELATIONS'
        },
        { status: 400 }
      );
    }

    // Excluir paciente
    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: 'Paciente excluído com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
