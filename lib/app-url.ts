/**
 * URL base do sistema para links em emails, WhatsApp, etc.
 * Prioridade: SITE_PUBLIC_URL (recomendado para links) → NEXT_PUBLIC_APP_URL → APP_URL → NEXTAUTH_URL.
 * Defina SITE_PUBLIC_URL=https://cannabilize.com.br para que os links nas mensagens usem sempre seu domínio,
 * mesmo com NEXTAUTH_URL em ngrok ou app. em desenvolvimento.
 */
export function getAppOrigin(fallback?: string): string {
  const u =
    process.env.SITE_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, '')}` : undefined);
  if (u) {
    const base = u.startsWith('http') ? u.replace(/\/$/, '') : `https://${u}`;
    return base;
  }
  return fallback && fallback.startsWith('http') ? fallback.replace(/\/$/, '') : 'http://localhost:3000';
}
