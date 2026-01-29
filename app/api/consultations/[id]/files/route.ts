import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET - Listar arquivos da consulta
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const consultation = await prisma.consultation.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        patientId: true,
        doctorId: true,
      },
    });

    if (!consultation) {
      return NextResponse.json(
        { error: 'Consulta não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se é o paciente, médico ou admin
    const isPatient = session.user.id === consultation.patientId;
    let isDoctor = false;
    let isAdmin = session.user.role === 'ADMIN';

    // Se for médico, verificar se é o médico da consulta
    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      isDoctor = doctor ? (consultation.doctorId === doctor.id || !consultation.doctorId) : false;
    }

    if (!isPatient && !isDoctor && !isAdmin) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    const files = await prisma.consultationFile.findMany({
      where: { consultationId: params.id },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        consultationId: true,
        patientId: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        description: true,
        uploadedAt: true,
      },
    });

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Erro ao buscar arquivos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar arquivos' },
      { status: 500 }
    );
  }
}

/**
 * POST - Upload de arquivo (apenas paciente)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'PATIENT') {
      return NextResponse.json(
        { error: 'Não autorizado. Apenas pacientes podem enviar arquivos.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string || 'OTHER';
    const description = formData.get('description') as string || '';

    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar tamanho máximo (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Tamanho máximo: 10MB' },
        { status: 400 }
      );
    }

    // Verificar tipo de arquivo permitido
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use PDF, JPG, PNG ou DOC/DOCX' },
        { status: 400 }
      );
    }

    const consultation = await prisma.consultation.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        patientId: true,
      },
    });

    if (!consultation) {
      return NextResponse.json(
        { error: 'Consulta não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se é o paciente da consulta
    if (session.user.id !== consultation.patientId) {
      return NextResponse.json(
        { error: 'Não autorizado a enviar arquivos para esta consulta' },
        { status: 403 }
      );
    }

    // Converter arquivo para base64 (em produção, usar serviço de storage como S3)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const fileUrl = `data:${file.type};base64,${base64}`;

    const consultationFile = await prisma.consultationFile.create({
      data: {
        consultationId: params.id,
        patientId: consultation.patientId,
        fileName: file.name,
        fileUrl,
        fileType,
        fileSize: file.size,
        description: description || null,
      },
    });

    return NextResponse.json({
      success: true,
      file: consultationFile,
    });
  } catch (error) {
    console.error('Erro ao fazer upload de arquivo:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer upload do arquivo' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Deletar arquivo (apenas paciente que enviou)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { error: 'fileId é obrigatório' },
        { status: 400 }
      );
    }

    const file = await prisma.consultationFile.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        patientId: true,
        consultationId: true,
      },
    });

    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se é o paciente que enviou ou admin
    if (session.user.id !== file.patientId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado a deletar este arquivo' },
        { status: 403 }
      );
    }

    await prisma.consultationFile.delete({
      where: { id: fileId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar arquivo' },
      { status: 500 }
    );
  }
}
