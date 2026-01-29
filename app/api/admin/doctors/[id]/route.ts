import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: 'Médico não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(doctor);
  } catch (error) {
    console.error('Error fetching doctor:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar médico' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      crm,
      email,
      phone,
      specialization,
      availability,
      active,
      password,
    } = body;

    const doctor = await prisma.doctor.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: 'Médico não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar dados do médico
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (crm !== undefined) updateData.crm = crm;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (specialization !== undefined) updateData.specialization = specialization;
    if (availability !== undefined) updateData.availability = availability;
    if (active !== undefined) updateData.active = active;

    // Verificar duplicação de CRM
    if (crm && crm !== doctor.crm) {
      const existingCrm = await prisma.doctor.findUnique({
        where: { crm },
      });
      if (existingCrm) {
        return NextResponse.json(
          { error: 'CRM já cadastrado' },
          { status: 400 }
        );
      }
    }

    // Verificar duplicação de email
    if (email && email !== doctor.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: 'Email já cadastrado' },
          { status: 400 }
        );
      }
    }

    // Atualizar médico
    const updatedDoctor = await prisma.doctor.update({
      where: { id: params.id },
      data: updateData,
    });

    // Atualizar usuário se necessário
    if (doctor.userId) {
      const userUpdateData: any = {};
      if (name !== undefined) userUpdateData.name = name;
      if (email !== undefined) userUpdateData.email = email;
      if (phone !== undefined) userUpdateData.phone = phone;
      if (password && password.trim() !== '') {
        userUpdateData.password = await bcrypt.hash(password, 10);
      }

      if (Object.keys(userUpdateData).length > 0) {
        await prisma.user.update({
          where: { id: doctor.userId },
          data: userUpdateData,
        });
      }
    }

    return NextResponse.json(updatedDoctor);
  } catch (error: any) {
    console.error('Error updating doctor:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'CRM ou email já cadastrado' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar médico' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: 'Médico não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se tem consultas agendadas
    const consultations = await prisma.consultation.findMany({
      where: {
        doctorId: params.id,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
    });

    if (consultations.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir médico com consultas agendadas' },
        { status: 400 }
      );
    }

    // Excluir médico
    await prisma.doctor.delete({
      where: { id: params.id },
    });

    // Excluir usuário se existir
    if (doctor.userId) {
      await prisma.user.delete({
        where: { id: doctor.userId },
      });
    }

    return NextResponse.json({ message: 'Médico excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir médico' },
      { status: 500 }
    );
  }
}
