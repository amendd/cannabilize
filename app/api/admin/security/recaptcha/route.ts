import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkAuth } from '@/lib/error-handler';

/**
 * GET - Obter configurações do reCAPTCHA
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    // Buscar configurações do banco
    const siteKey = await prisma.systemConfig.findUnique({
      where: { key: 'recaptcha_site_key' },
    });

    const secretKey = await prisma.systemConfig.findUnique({
      where: { key: 'recaptcha_secret_key' },
    });

    const threshold = await prisma.systemConfig.findUnique({
      where: { key: 'recaptcha_threshold' },
    });

    const enabled = await prisma.systemConfig.findUnique({
      where: { key: 'recaptcha_enabled' },
    });

    return NextResponse.json({
      enabled: enabled?.value === 'true',
      siteKey: siteKey?.value || '',
      secretKey: secretKey?.value ? '***' : '', // Não retornar secret key completo por segurança
      threshold: threshold?.value ? parseFloat(threshold.value) : 0.5,
      hasSecretKey: !!secretKey?.value,
    });
  } catch (error) {
    console.error('Erro ao buscar configurações reCAPTCHA:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
}

/**
 * POST - Salvar/atualizar configurações do reCAPTCHA
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const body = await request.json();
    const { enabled, siteKey, secretKey, threshold } = body;

    // Validar dados
    if (enabled === undefined) {
      return NextResponse.json(
        { error: 'Campo "enabled" é obrigatório' },
        { status: 400 }
      );
    }

    if (enabled) {
      if (!siteKey || !secretKey) {
        return NextResponse.json(
          { error: 'Site Key e Secret Key são obrigatórios quando reCAPTCHA está ativado' },
          { status: 400 }
        );
      }

      if (threshold !== undefined && (threshold < 0 || threshold > 1)) {
        return NextResponse.json(
          { error: 'Threshold deve estar entre 0.0 e 1.0' },
          { status: 400 }
        );
      }
    }

    // Salvar configurações usando upsert
    await prisma.systemConfig.upsert({
      where: { key: 'recaptcha_enabled' },
      update: { value: enabled.toString() },
      create: { key: 'recaptcha_enabled', value: enabled.toString() },
    });

    if (siteKey) {
      await prisma.systemConfig.upsert({
        where: { key: 'recaptcha_site_key' },
        update: { value: siteKey },
        create: { key: 'recaptcha_site_key', value: siteKey },
      });
    }

    if (secretKey && secretKey !== '***') {
      // Só atualizar se não for o placeholder
      await prisma.systemConfig.upsert({
        where: { key: 'recaptcha_secret_key' },
        update: { value: secretKey },
        create: { key: 'recaptcha_secret_key', value: secretKey },
      });
    }

    if (threshold !== undefined) {
      await prisma.systemConfig.upsert({
        where: { key: 'recaptcha_threshold' },
        update: { value: threshold.toString() },
        create: { key: 'recaptcha_threshold', value: threshold.toString() },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Configurações salvas com sucesso',
    });
  } catch (error) {
    console.error('Erro ao salvar configurações reCAPTCHA:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar configurações' },
      { status: 500 }
    );
  }
}

/**
 * POST - Testar configuração do reCAPTCHA
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const body = await request.json();
    const { testToken } = body;

    if (!testToken) {
      return NextResponse.json(
        { error: 'Token de teste é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar secret key
    const secretKeyConfig = await prisma.systemConfig.findUnique({
      where: { key: 'recaptcha_secret_key' },
    });

    if (!secretKeyConfig?.value) {
      return NextResponse.json(
        { error: 'Secret Key não configurada' },
        { status: 400 }
      );
    }

    // Testar validação
    try {
      const response = await fetch(
        `https://www.google.com/recaptcha/api/siteverify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            secret: secretKeyConfig.value,
            response: testToken,
          }),
        }
      );

      const data = await response.json();

      return NextResponse.json({
        success: data.success,
        score: data.score,
        action: data.action,
        hostname: data.hostname,
        'error-codes': data['error-codes'],
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Erro ao conectar com serviço reCAPTCHA', details: error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao testar reCAPTCHA:', error);
    return NextResponse.json(
      { error: 'Erro ao testar configuração' },
      { status: 500 }
    );
  }
}
