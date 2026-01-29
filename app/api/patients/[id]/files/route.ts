import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET - Listar todos os arquivos de um paciente
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

    const patientId = params.id;

    // Verificar permissão: paciente só pode ver seus próprios arquivos, admin pode ver qualquer um
    if (session.user.role === 'PATIENT' && patientId !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    // Buscar todos os arquivos do paciente com informações da consulta
    // Importante: não retornar `fileUrl` (base64) para evitar payload gigante.
    const files = await prisma.consultationFile.findMany({
      where: { patientId },
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
        consultation: {
          select: {
            id: true,
            scheduledAt: true,
            scheduledDate: true,
            status: true,
            doctor: {
              select: {
                id: true,
                name: true,
                crm: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Erro ao buscar arquivos do paciente:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar arquivos' },
      { status: 500 }
    );
  }
}
