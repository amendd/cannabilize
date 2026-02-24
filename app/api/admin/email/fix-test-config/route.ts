import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Ajustar configuração do Resend para usar domínio de teste
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar configuração do Resend
    const config = await prisma.emailConfig.findUnique({
      where: { provider: 'RESEND' },
    });

    if (!config) {
      return NextResponse.json(
        { error: 'Configuração do Resend não encontrada. Configure primeiro no painel admin.' },
        { status: 404 }
      );
    }

    // Atualizar para usar domínio de teste do Resend
    const updated = await prisma.emailConfig.update({
      where: { provider: 'RESEND' },
      data: {
        fromEmail: 'onboarding@resend.dev',
        fromName: config.fromName || 'Cannabilize',
        enabled: true, // Garantir que está habilitado
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Configuração atualizada para usar domínio de teste do Resend',
      config: {
        ...updated,
        apiKey: updated.apiKey ? `${updated.apiKey.substring(0, 8)}...${updated.apiKey.substring(updated.apiKey.length - 5)}` : null,
      },
    });
  } catch (error) {
    console.error('Erro ao ajustar configuração:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao ajustar configuração',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
