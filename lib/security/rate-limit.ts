/**
 * Rate Limiting Avançado
 * 
 * Sistema de rate limiting por IP, email, telefone, etc.
 * Suporta Redis para produção ou Map em memória para desenvolvimento.
 */

interface RateLimitConfig {
  windowMs: number; // Janela de tempo em milissegundos
  maxRequests: number; // Máximo de requisições na janela
  keyPrefix: string; // Prefixo para a chave (ex: 'form:', 'login:')
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
  blocked?: boolean;
  blockUntil?: number;
}

// Map em memória (para desenvolvimento ou sem Redis)
const rateLimitStore = new Map<string, RateLimitRecord>();

// Limpar registros antigos periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime && (!record.blockUntil || now > record.blockUntil)) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // A cada minuto

/**
 * Verifica rate limit
 * 
 * @param key Chave única (ex: IP, email, telefone)
 * @param config Configuração de rate limit
 * @returns Objeto com status e informações
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  reason?: string;
} {
  const fullKey = `${config.keyPrefix}${key}`;
  const now = Date.now();
  const record = rateLimitStore.get(fullKey);

  // Verificar se está bloqueado permanentemente
  if (record?.blocked && record.blockUntil && now < record.blockUntil) {
    const retryAfter = Math.ceil((record.blockUntil - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.blockUntil,
      retryAfter,
      reason: 'IP bloqueado temporariamente devido a atividade suspeita',
    };
  }

  // Se não existe registro ou janela expirou, criar novo
  if (!record || now > record.resetTime) {
    rateLimitStore.set(fullKey, {
      count: 1,
      resetTime: now + config.windowMs,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Incrementar contador
  record.count++;

  // Verificar se excedeu limite
  if (record.count > config.maxRequests) {
    // Bloquear por 1 hora se exceder muito (3x o limite)
    if (record.count > config.maxRequests * 3) {
      record.blocked = true;
      record.blockUntil = now + 60 * 60 * 1000; // 1 hora
    }

    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfter,
      reason: 'Limite de requisições excedido',
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Obtém configuração de rate limit por tipo de formulário
 */
export function getRateLimitConfig(
  formType: 'appointment' | 'login' | 'contact' | 'register' | 'api'
): RateLimitConfig {
  const configs: Record<string, RateLimitConfig> = {
    appointment: {
      windowMs: 60 * 60 * 1000, // 1 hora
      maxRequests: 3,
      keyPrefix: 'form:appointment:',
    },
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxRequests: 5,
      keyPrefix: 'form:login:',
    },
    contact: {
      windowMs: 60 * 60 * 1000, // 1 hora
      maxRequests: 5,
      keyPrefix: 'form:contact:',
    },
    register: {
      windowMs: 60 * 60 * 1000, // 1 hora
      maxRequests: 2,
      keyPrefix: 'form:register:',
    },
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxRequests: 200,
      keyPrefix: 'api:',
    },
  };

  return configs[formType] || configs.api;
}

/**
 * Limpa rate limit de uma chave específica (útil para debug ou whitelist)
 */
export function clearRateLimit(key: string, formType?: string): void {
  if (formType) {
    const config = getRateLimitConfig(formType as any);
    const fullKey = `${config.keyPrefix}${key}`;
    rateLimitStore.delete(fullKey);
  } else {
    // Limpar todas as chaves que começam com o prefixo
    for (const storeKey of rateLimitStore.keys()) {
      if (storeKey.includes(key)) {
        rateLimitStore.delete(storeKey);
      }
    }
  }
}

/**
 * Obtém IP do cliente da requisição
 */
export function getClientIP(request: Request | { headers: Headers }): string {
  const headers = request.headers instanceof Headers 
    ? request.headers 
    : new Headers(Object.entries(request.headers || {}));

  // Verificar headers de proxy
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  // Fallback
  return 'unknown';
}
