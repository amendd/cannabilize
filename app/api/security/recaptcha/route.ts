import { NextResponse } from 'next/server';
import { getRecaptchaConfig } from '@/lib/security/recaptcha-config';

/**
 * Endpoint público para o frontend obter a Site Key do reCAPTCHA.
 *
 * - Seguro expor a **siteKey** (é pública por definição)
 * - NÃO expõe secret key
 * - Usado em páginas públicas como /agendamento
 */
export async function GET() {
  try {
    const config = await getRecaptchaConfig();

    return NextResponse.json({
      enabled: config.enabled,
      siteKey: config.siteKey || '',
    });
  } catch (error) {
    console.error('Erro ao buscar configuração pública do reCAPTCHA:', error);
    // Fallback seguro: não bloquear o usuário por falha nesse endpoint
    return NextResponse.json({
      enabled: false,
      siteKey: '',
    });
  }
}

