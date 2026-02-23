import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { testWhatsAppConnection, getDefaultWhatsAppProvider } from '@/lib/whatsapp';

// GET - Buscar configuração do WhatsApp (query: ?provider=TWILIO ou ?provider=META)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    if (!prisma?.whatsAppConfig) {
      return NextResponse.json(
        { error: 'Erro de configuração do banco. Execute: npx prisma generate' },
        { status: 500 }
      );
    }

    const provider = (request.nextUrl.searchParams.get('provider') || 'TWILIO').toUpperCase();
    const allowed = ['TWILIO', 'META', 'ZAPI'];
    const useProvider = allowed.includes(provider) ? provider : 'TWILIO';

    let config = await prisma.whatsAppConfig.findUnique({
      where: { provider: useProvider },
    });

    if (!config) {
      config = await prisma.whatsAppConfig.create({
        data: { provider: useProvider, enabled: false },
      });
    }

    const { authToken, ...safeConfig } = config;
    const out: Record<string, unknown> = {
      ...safeConfig,
      hasAuthToken: !!authToken,
    };
    if (useProvider === 'META' && config.config) {
      try {
        const parsed = JSON.parse(config.config) as { phone_number_id?: string };
        out.phoneNumberId = parsed.phone_number_id || '';
      } catch {
        out.phoneNumberId = '';
      }
    }
    if (useProvider === 'ZAPI' && config.config) {
      try {
        const parsed = JSON.parse(config.config) as { instance_id?: string };
        out.instanceId = parsed.instance_id || '';
      } catch {
        out.instanceId = '';
      }
      out.hasClientToken = !!config.apiSecret;
    }
    const defaultProvider = await getDefaultWhatsAppProvider();
    out.defaultProvider = defaultProvider;
    return NextResponse.json(out);
  } catch (error) {
    console.error('Erro ao buscar configuração WhatsApp:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configuração' },
      { status: 500 }
    );
  }
}

// POST - Criar ou atualizar configuração (body.provider: 'TWILIO' | 'META')
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
    const {
      provider: bodyProvider,
      enabled,
      accountSid,
      authToken,
      phoneNumber,
      phoneNumberId,
      instanceId,
      webhookUrl,
      webhookSecret,
      testPhone,
      clientToken,
      defaultProvider: bodyDefaultProvider,
    } = body;

    if (bodyDefaultProvider !== undefined && ['ZAPI', 'META', 'TWILIO'].includes(String(bodyDefaultProvider).toUpperCase())) {
      const value = String(bodyDefaultProvider).toUpperCase();
      await prisma.systemConfig.upsert({
        where: { key: 'whatsapp_default_provider' },
        create: { key: 'whatsapp_default_provider', value },
        update: { value },
      });
    }

    if (!prisma?.whatsAppConfig) {
      return NextResponse.json(
        { error: 'Erro de configuração do banco. Execute: npx prisma generate' },
        { status: 500 }
      );
    }

    const provider = (bodyProvider || 'TWILIO').toUpperCase();
    const useProvider = ['TWILIO', 'META', 'ZAPI'].includes(provider) ? provider : 'TWILIO';
    const existing = await prisma.whatsAppConfig.findUnique({
      where: { provider: useProvider },
    });

    if (useProvider === 'ZAPI') {
      const hasToken = (authToken !== undefined && authToken !== null && String(authToken).trim() !== '') || existing?.authToken;
      let resolvedInstanceId = (instanceId !== undefined && instanceId !== null && String(instanceId).trim() !== '') ? String(instanceId).trim() : null;
      if (!resolvedInstanceId && existing?.config) {
        try {
          const parsed = JSON.parse(existing.config) as { instance_id?: string };
          resolvedInstanceId = parsed.instance_id?.trim() || null;
        } catch {
          // ignore
        }
      }
      if (enabled && (!hasToken || !resolvedInstanceId)) {
        return NextResponse.json(
          { error: 'Preencha Instance ID e Token (obrigatórios quando a integração está habilitada). Se já salvou antes, confira se os campos não estão vazios.' },
          { status: 400 }
        );
      }
      const data: Record<string, unknown> = {
        enabled: enabled ?? false,
        testPhone: testPhone?.trim() || null,
        config: JSON.stringify({ instance_id: resolvedInstanceId || (instanceId || '').trim() || '' }),
      };
      if (authToken !== undefined && authToken !== '' && authToken !== null && String(authToken).trim() !== '') {
        data.authToken = String(authToken).trim();
      } else if (existing?.authToken) {
        data.authToken = existing.authToken;
      }
      if (clientToken !== undefined && clientToken !== '' && clientToken !== null && String(clientToken).trim() !== '') {
        data.apiSecret = String(clientToken).trim();
      } else if (existing?.apiSecret) {
        data.apiSecret = existing.apiSecret;
      }
      const config = existing
        ? await prisma.whatsAppConfig.update({ where: { id: existing.id }, data: data as any })
        : await prisma.whatsAppConfig.create({
            data: { provider: 'ZAPI', ...data } as any,
          });
      const { authToken: _t, ...safe } = config;
      return NextResponse.json({
        ...safe,
        hasAuthToken: !!config.authToken,
        instanceId: instanceId ?? (config.config ? (JSON.parse(config.config) as any)?.instance_id : '') ?? '',
      });
    }

    if (useProvider === 'META') {
      if (enabled && (!authToken?.trim() || !phoneNumberId?.trim())) {
        return NextResponse.json(
          { error: 'Token de acesso e Phone Number ID são obrigatórios quando habilitado (Meta)' },
          { status: 400 }
        );
      }
      const data: Record<string, unknown> = {
        enabled: enabled ?? false,
        webhookSecret: webhookSecret?.trim() || null,
        testPhone: testPhone?.trim() || null,
        config: JSON.stringify({ phone_number_id: (phoneNumberId || '').trim() }),
      };
      if (authToken !== undefined && authToken !== '' && authToken !== null) {
        data.authToken = authToken.trim();
      } else if (existing?.authToken) {
        data.authToken = existing.authToken;
      }
      const config = existing
        ? await prisma.whatsAppConfig.update({ where: { id: existing.id }, data: data as any })
        : await prisma.whatsAppConfig.create({
            data: { provider: 'META', ...data } as any,
          });
      const { authToken: _t, ...safe } = config;
      return NextResponse.json({
        ...safe,
        hasAuthToken: !!config.authToken,
        phoneNumberId: phoneNumberId ?? (config.config ? (JSON.parse(config.config) as any)?.phone_number_id : '') ?? '',
      });
    }

    // TWILIO
    if (enabled && (!accountSid?.trim() || !phoneNumber?.trim())) {
      return NextResponse.json(
        { error: 'Account SID e Número WhatsApp são obrigatórios quando habilitado' },
        { status: 400 }
      );
    }

    const data: any = {
      enabled: enabled ?? false,
      accountSid: accountSid?.trim() || null,
      phoneNumber: phoneNumber?.trim() || null,
      webhookUrl: webhookUrl?.trim() || null,
      webhookSecret: webhookSecret?.trim() || null,
      testPhone: testPhone?.trim() || null,
    };
    if (authToken !== undefined && authToken !== '' && authToken !== null) {
      data.authToken = authToken.trim();
    } else if (existing?.authToken) {
      data.authToken = existing.authToken;
    } else if (enabled) {
      return NextResponse.json(
        { error: 'Auth Token é obrigatório quando a integração está habilitada' },
        { status: 400 }
      );
    }

    const config = existing
      ? await prisma.whatsAppConfig.update({ where: { id: existing.id }, data })
      : await prisma.whatsAppConfig.create({
          data: { provider: 'TWILIO', ...data },
        });

    const { authToken: _t, ...safeConfig } = config;
    return NextResponse.json({
      ...safeConfig,
      hasAuthToken: !!config.authToken,
    });
  } catch (error: any) {
    console.error('Erro ao salvar configuração WhatsApp:', error);
    console.error('Stack trace:', error?.stack);
    
    // Mensagens de erro mais específicas
    let errorMessage = 'Erro ao salvar configuração';
    
    if (error?.message?.includes('findUnique') || error?.message?.includes('Cannot read properties')) {
      errorMessage = 'Erro de conexão com o banco de dados. Verifique se o Prisma Client foi gerado (npx prisma generate)';
    } else if (error?.code === 'P2002') {
      errorMessage = 'Já existe uma configuração para este provedor';
    } else if (error?.message?.includes('Unique constraint')) {
      errorMessage = 'Já existe uma configuração para este provedor';
    } else if (error?.code === 'P1001') {
      errorMessage = 'Não foi possível conectar ao banco de dados. Verifique a variável DATABASE_URL';
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: process.env.NODE_ENV === 'development' ? {
          message: error?.message,
          code: error?.code,
          stack: error?.stack?.split('\n').slice(0, 3).join('\n')
        } : undefined 
      },
      { status: 500 }
    );
  }
}

// PUT - Testar conexão
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { testPhone, provider } = body;

    if (!testPhone) {
      return NextResponse.json(
        { error: 'Número de teste é obrigatório' },
        { status: 400 }
      );
    }

    const result = await testWhatsAppConnection(testPhone, provider ? { provider } : undefined);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao testar WhatsApp:', error);
    return NextResponse.json(
      { error: 'Erro ao testar conexão' },
      { status: 500 }
    );
  }
}
