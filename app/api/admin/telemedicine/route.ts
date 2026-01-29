import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const telemedicineConfigSchema = z.object({
  platform: z.enum(['ZOOM', 'GOOGLE_MEET']),
  enabled: z.boolean().default(false),
  apiKey: z.string().optional().nullable(),
  apiSecret: z.string().optional().nullable(),
  accountId: z.string().optional().nullable(), // Para Zoom
  clientId: z.string().optional().nullable(), // Para Google OAuth
  clientSecret: z.string().optional().nullable(), // Para Google OAuth
  refreshToken: z.string().optional().nullable(), // Para Google OAuth
  webhookUrl: z.union([z.string().url(), z.literal(''), z.null(), z.undefined()]).optional(),
  webhookSecret: z.string().optional().nullable(),
  defaultDuration: z.number().min(15).max(120).default(30),
  requirePassword: z.boolean().default(false),
  waitingRoom: z.boolean().default(true),
  config: z.string().optional().nullable(), // JSON string
});

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

    const configs = await prisma.telemedicineConfig.findMany({
      orderBy: { platform: 'asc' },
    });

    // Não retornar secrets completos por segurança
    const safeConfigs = configs.map(config => ({
      ...config,
      apiSecret: config.apiSecret ? '***' : null,
      clientSecret: config.clientSecret ? '***' : null,
      refreshToken: config.refreshToken ? '***' : null,
      webhookSecret: config.webhookSecret ? '***' : null,
    }));

    return NextResponse.json({ configs: safeConfigs });
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
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
    console.log('📥 Dados recebidos para salvar:', { platform: body.platform, enabled: body.enabled, enabledType: typeof body.enabled });
    
    // Limpar strings vazias para null/undefined e garantir tipos corretos
    const cleanedBody = {
      ...body,
      enabled: typeof body.enabled === 'boolean' ? body.enabled : body.enabled === 'true' || body.enabled === true,
      webhookUrl: body.webhookUrl && body.webhookUrl.trim() !== '' ? body.webhookUrl : undefined,
      apiKey: body.apiKey && body.apiKey.trim() !== '' ? body.apiKey : undefined,
      apiSecret: body.apiSecret && body.apiSecret.trim() !== '' ? body.apiSecret : undefined,
      accountId: body.accountId && body.accountId.trim() !== '' ? body.accountId : undefined,
      clientId: body.clientId && body.clientId.trim() !== '' ? body.clientId : undefined,
      clientSecret: body.clientSecret && body.clientSecret.trim() !== '' ? body.clientSecret : undefined,
      refreshToken: body.refreshToken && body.refreshToken.trim() !== '' ? body.refreshToken : undefined,
      webhookSecret: body.webhookSecret && body.webhookSecret.trim() !== '' ? body.webhookSecret : undefined,
      defaultDuration: typeof body.defaultDuration === 'number' ? body.defaultDuration : parseInt(body.defaultDuration) || 30,
      requirePassword: typeof body.requirePassword === 'boolean' ? body.requirePassword : body.requirePassword === 'true' || body.requirePassword === true,
      waitingRoom: typeof body.waitingRoom === 'boolean' ? body.waitingRoom : body.waitingRoom !== false && body.waitingRoom !== 'false',
    };
    
    console.log('🧹 Dados limpos:', { platform: cleanedBody.platform, enabled: cleanedBody.enabled, enabledType: typeof cleanedBody.enabled });
    
    const data = telemedicineConfigSchema.parse(cleanedBody);
    
    console.log('✅ Dados validados:', { platform: data.platform, enabled: data.enabled, enabledType: typeof data.enabled });

    // Verificar se já existe configuração para esta plataforma
    const existing = await prisma.telemedicineConfig.findUnique({
      where: { platform: data.platform },
    });

    let config;
    if (existing) {
      // Atualizar apenas campos fornecidos (não sobrescrever secrets se não fornecidos)
      const updateData: any = {
        enabled: data.enabled,
        defaultDuration: data.defaultDuration,
        requirePassword: data.requirePassword,
        waitingRoom: data.waitingRoom,
      };

      // Não sobrescrever secrets com valor mascarado "***" (manter o que está no banco)
      const isMasked = (v: string | null | undefined) => v === '***' || v === '' || v == null;
      if (data.apiKey !== undefined && !isMasked(data.apiKey)) updateData.apiKey = data.apiKey;
      if (data.apiSecret !== undefined && !isMasked(data.apiSecret)) updateData.apiSecret = data.apiSecret;
      if (data.accountId !== undefined) updateData.accountId = data.accountId;
      if (data.clientId !== undefined) updateData.clientId = data.clientId;
      if (data.clientSecret !== undefined && !isMasked(data.clientSecret)) updateData.clientSecret = data.clientSecret;
      if (data.refreshToken !== undefined && !isMasked(data.refreshToken)) updateData.refreshToken = data.refreshToken;
      if (data.webhookUrl !== undefined) updateData.webhookUrl = data.webhookUrl;
      if (data.webhookSecret !== undefined && !isMasked(data.webhookSecret)) updateData.webhookSecret = data.webhookSecret;
      if (data.config !== undefined) updateData.config = data.config;

      config = await prisma.telemedicineConfig.update({
        where: { platform: data.platform },
        data: updateData,
      });
    } else {
      // Criar nova configuração (não salvar "***" em secrets)
      const isMasked = (v: string | null | undefined) => v === '***' || v === '' || v == null;
      const createData = {
        ...data,
        apiSecret: data.apiSecret && !isMasked(data.apiSecret) ? data.apiSecret : null,
        clientSecret: data.clientSecret && !isMasked(data.clientSecret) ? data.clientSecret : null,
        refreshToken: data.refreshToken && !isMasked(data.refreshToken) ? data.refreshToken : null,
        webhookSecret: data.webhookSecret && !isMasked(data.webhookSecret) ? data.webhookSecret : null,
      };
      config = await prisma.telemedicineConfig.create({
        data: createData,
      });
    }

    return NextResponse.json({ config: {
      ...config,
      apiSecret: config.apiSecret ? '***' : null,
      clientSecret: config.clientSecret ? '***' : null,
      refreshToken: config.refreshToken ? '***' : null,
      webhookSecret: config.webhookSecret ? '***' : null,
    } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Erro de validação Zod:', error.errors);
      return NextResponse.json(
        { 
          error: 'Dados inválidos', 
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          }))
        },
        { status: 400 }
      );
    }

    console.error('Erro ao salvar configuração:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao salvar configuração',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
