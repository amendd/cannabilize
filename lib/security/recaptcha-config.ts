/**
 * Configuração do reCAPTCHA
 * 
 * Busca configurações do banco de dados ou variáveis de ambiente
 */

import { prisma } from '@/lib/prisma';

interface RecaptchaConfig {
  enabled: boolean;
  siteKey: string;
  secretKey: string;
  threshold: number;
}

let cachedConfig: RecaptchaConfig | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Obtém configuração do reCAPTCHA do banco de dados
 */
export async function getRecaptchaConfig(): Promise<RecaptchaConfig> {
  // Verificar cache
  const now = Date.now();
  if (cachedConfig && now < cacheExpiry) {
    return cachedConfig;
  }

  try {
    // Buscar do banco de dados
    const [enabledConfig, siteKeyConfig, secretKeyConfig, thresholdConfig] = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: 'recaptcha_enabled' } }),
      prisma.systemConfig.findUnique({ where: { key: 'recaptcha_site_key' } }),
      prisma.systemConfig.findUnique({ where: { key: 'recaptcha_secret_key' } }),
      prisma.systemConfig.findUnique({ where: { key: 'recaptcha_threshold' } }),
    ]);

    const enabled = enabledConfig?.value === 'true';
    const siteKey = siteKeyConfig?.value || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';
    const secretKey = secretKeyConfig?.value || process.env.RECAPTCHA_SECRET_KEY || '';
    const threshold = thresholdConfig?.value 
      ? parseFloat(thresholdConfig.value) 
      : parseFloat(process.env.RECAPTCHA_THRESHOLD || '0.5');

    cachedConfig = {
      enabled,
      siteKey,
      secretKey,
      threshold,
    };

    cacheExpiry = now + CACHE_TTL;

    return cachedConfig;
  } catch (error) {
    console.error('Erro ao buscar configuração reCAPTCHA do banco:', error);
    
    // Fallback para variáveis de ambiente
    return {
      enabled: !!process.env.RECAPTCHA_SECRET_KEY,
      siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '',
      secretKey: process.env.RECAPTCHA_SECRET_KEY || '',
      threshold: parseFloat(process.env.RECAPTCHA_THRESHOLD || '0.5'),
    };
  }
}

/**
 * Limpa cache de configuração (útil após atualizar configurações)
 */
export function clearRecaptchaConfigCache(): void {
  cachedConfig = null;
  cacheExpiry = 0;
}

/**
 * Obtém apenas a chave pública (para uso no frontend)
 */
export async function getRecaptchaSiteKey(): Promise<string> {
  const config = await getRecaptchaConfig();
  return config.siteKey;
}
