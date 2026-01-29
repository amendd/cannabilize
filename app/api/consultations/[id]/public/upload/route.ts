import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST - Upload de arquivo público (página de confirmação)
 * Permite upload sem autenticação, mas valida que a consulta existe e o pagamento foi confirmado
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const consultation = await prisma.consultation.findUnique({
      where: { id: params.id },
      include: {
        payment: true,
        patient: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!consultation) {
      return NextResponse.json(
        { error: 'Consulta não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se o pagamento foi confirmado
    if (!consultation.payment || consultation.payment.status !== 'PAID') {
      return NextResponse.json(
        { error: 'Pagamento não confirmado. Não é possível enviar documentos.' },
        { status: 403 }
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

    // Converter arquivo para base64 (em produção, usar serviço de storage como S3)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const fileUrl = `data:${file.type};base64,${base64}`;

    const consultationFile = await prisma.consultationFile.create({
      data: {
        consultationId: params.id,
        patientId: consultation.patientId || consultation.patient?.id || '',
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
 * GET - Listar arquivos da consulta (público)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const consultation = await prisma.consultation.findUnique({
      where: { id: params.id },
      include: {
        payment: true,
      },
    });

    if (!consultation) {
      return NextResponse.json(
        { error: 'Consulta não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se o pagamento foi confirmado
    if (!consultation.payment || consultation.payment.status !== 'PAID') {
      return NextResponse.json(
        { error: 'Pagamento não confirmado' },
        { status: 403 }
      );
    }

    const files = await prisma.consultationFile.findMany({
      where: { consultationId: params.id },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        uploadedAt: true,
        description: true,
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
