import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting simples em memória (para produção, usar Redis)
// Tornar global para acesso via API de debug
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Tornar acessível globalmente para a rota de debug
if (typeof global !== 'undefined') {
  (global as any).rateLimitMap = rateLimitMap;
}

const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 200, // 200 requests por janela (aumentado de 100)
};

// Em desenvolvimento, hot-reload e telas com polling podem estourar o limite facilmente.
// Para não “quebrar” o painel durante ajustes, aplicamos rate limit apenas em produção.
const ENABLE_RATE_LIMIT = process.env.NODE_ENV === 'production';

function getRateLimitKey(request: NextRequest): string {
  // Usar IP do cliente
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
  return ip;
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    // Criar novo registro
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT.maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

function hasNextAuthSessionCookie(request: NextRequest): boolean {
  // NextAuth pode usar nomes diferentes dependendo de HTTPS/secure cookies
  return (
    request.cookies.has('next-auth.session-token') ||
    request.cookies.has('__Secure-next-auth.session-token') ||
    request.cookies.has('__Host-next-auth.session-token')
  );
}

// Limpar registros antigos periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60 * 1000); // A cada minuto

// Função para limpar rate limit de um IP específico (útil para debug)
export function clearRateLimit(ip?: string) {
  if (ip) {
    rateLimitMap.delete(ip);
  } else {
    rateLimitMap.clear();
  }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Excluir rotas de autenticação e debug do rate limiting
  const excludedPaths = [
    '/api/auth',
    '/api/auth/session',
    '/api/auth/csrf',
    '/api/auth/providers',
    '/api/auth/signin',
    '/api/auth/signout',
    '/api/auth/callback',
    '/api/debug', // Rotas de debug
  ];
  
  const isExcluded = excludedPaths.some(path => pathname.startsWith(path));
  
  // Aplicar rate limiting apenas em rotas de API (exceto autenticação)
  // Observação: para melhorar a UX do app logado, não aplicar rate limiting quando houver cookie de sessão do NextAuth.
  // (Para produção robusta, ideal usar rate limiting por usuário com Redis e validar sessão.)
  if (ENABLE_RATE_LIMIT && pathname.startsWith('/api/') && !isExcluded && !hasNextAuthSessionCookie(request)) {
    const key = getRateLimitKey(request);
    
    if (!checkRateLimit(key)) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
        { 
          status: 429,
          headers: {
            'Retry-After': '900', // 15 minutos em segundos
          },
        }
      );
    }
  }

  // Headers de segurança
  const response = NextResponse.next();
  
  // Content Security Policy (CSP) melhorado
  // Permite reCAPTCHA do Google
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.google.com https://www.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://www.google.com https://www.google.com/recaptcha",
    "frame-src 'self' https://www.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  // X-Frame-Options (redundante com CSP frame-ancestors, mas mantido para compatibilidade)
  response.headers.set('X-Frame-Options', 'DENY');
  
  // X-Content-Type-Options
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // X-XSS-Protection (legado, mas ainda útil)
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Strict-Transport-Security (HSTS) - apenas em produção com HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }
  
  // Referrer-Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions-Policy (anteriormente Feature-Policy)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );
  
  // Cross-Origin-Embedder-Policy (opcional, pode quebrar alguns recursos)
  // response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  
  // Cross-Origin-Opener-Policy
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  
  // Cross-Origin-Resource-Policy
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};
