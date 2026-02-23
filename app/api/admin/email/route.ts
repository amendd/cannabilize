import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const emailConfigSchema = z.object({
  provider: z.enum(['RESEND', 'SENDGRID', 'AWS_SES', 'SMTP']),
  enabled: z.boolean().default(false),
  apiKey: z.string().nullish(),
  apiSecret: z.string().nullish(),
  fromEmail: z.string().email().nullish(),
  fromName: z.string().nullish(),
  replyTo: z.string().email().nullish(),
  smtpHost: z.string().nullish(),
  smtpPort: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : (typeof v === 'string' ? parseInt(v, 10) : v)),
    z.number().int().min(1).max(65535).optional()
  ),
  smtpUser: z.string().nullish(),
  smtpPassword: z.string().nullish(),
  smtpSecure: z.boolean().default(true),
  domain: z.string().nullish(),
  region: z.string().nullish(),
  config: z.string().nullish(), // JSON string
  testEmail: z.string().email().nullish(),
});

// Função para mascarar chaves sensíveis mostrando início e fim
const maskApiKey = (key: string | null | undefined): string | null => {
  if (!key) return null;
  if (key.length <= 8) return '***';
  // Mostra primeiros 8 caracteres e últimos 5
  return `${key.substring(0, 8)}...${key.substring(key.length - 5)}`;
};

// GET - Listar configurações
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const configs = await prisma.emailConfig.findMany({
      orderBy: { provider: 'asc' },
    });

    // Não retornar secrets completos por segurança
    const safeConfigs = configs.map(config => ({
      ...config,
      apiKey: maskApiKey(config.apiKey),
      apiSecret: config.apiSecret ? '***' : null,
      smtpPassword: config.smtpPassword ? '***' : null,
    }));

    return NextResponse.json({ configs: safeConfigs });
  } catch (error) {
    console.error('Erro ao buscar configurações de email:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações de email' },
      { status: 500 }
    );
  }
}

// POST - Criar ou atualizar configuração
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = emailConfigSchema.parse(body);

    // Verificar se já existe configuração para este provedor
    const existing = await prisma.emailConfig.findUnique({
      where: { provider: data.provider },
    });

    let config;
    if (existing) {
      // Atualizar apenas campos fornecidos (não sobrescrever secrets se não fornecidos)
      const updateData: any = {
        enabled: data.enabled,
        smtpSecure: data.smtpSecure,
      };

      if (data.apiKey !== undefined) updateData.apiKey = data.apiKey;
      if (data.apiSecret !== undefined) updateData.apiSecret = data.apiSecret;
      if (data.fromEmail !== undefined) updateData.fromEmail = data.fromEmail;
      if (data.fromName !== undefined) updateData.fromName = data.fromName;
      if (data.replyTo !== undefined) updateData.replyTo = data.replyTo;
      if (data.smtpHost !== undefined) updateData.smtpHost = data.smtpHost;
      if (data.smtpPort !== undefined) updateData.smtpPort = data.smtpPort;
      if (data.smtpUser !== undefined) updateData.smtpUser = data.smtpUser;
      if (data.smtpPassword !== undefined) updateData.smtpPassword = data.smtpPassword;
      if (data.domain !== undefined) updateData.domain = data.domain;
      if (data.region !== undefined) updateData.region = data.region;
      if (data.config !== undefined) updateData.config = data.config;
      if (data.testEmail !== undefined) updateData.testEmail = data.testEmail;

      config = await prisma.emailConfig.update({
        where: { provider: data.provider },
        data: updateData,
      });
    } else {
      // Criar nova configuração
      config = await prisma.emailConfig.create({
        data,
      });
    }

    return NextResponse.json({ 
      config: {
        ...config,
        apiKey: maskApiKey(config.apiKey),
        apiSecret: config.apiSecret ? '***' : null,
        smtpPassword: config.smtpPassword ? '***' : null,
      } 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao salvar configuração de email:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar configuração de email' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar configuração
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider é obrigatório' },
        { status: 400 }
      );
    }

    await prisma.emailConfig.delete({
      where: { provider: provider as any },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar configuração de email:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar configuração de email' },
      { status: 500 }
    );
  }
}
