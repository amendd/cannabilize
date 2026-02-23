/**
 * Verifica se a integração Google Meet está configurada e disponível.
 * Usa o banco de dados (Prisma) — não precisa do servidor rodando nem de login.
 *
 * Uso: npx ts-node scripts/verificar-google-meet-status.ts
 * Ou: npx tsx scripts/verificar-google-meet-status.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificação da integração Google Meet\n');

  const config = await prisma.telemedicineConfig.findUnique({
    where: { platform: 'GOOGLE_MEET' },
  });

  if (!config) {
    console.log('❌ Google Meet: nenhuma configuração encontrada.');
    console.log('   Ação: acesse Admin → Telemedicina, preencha Google Meet e salve.\n');
    return;
  }

  const hasClientId = !!config.clientId && config.clientId.trim() !== '';
  const hasClientSecret = !!config.clientSecret && config.clientSecret.trim() !== '';
  const hasRefreshToken = !!config.refreshToken && config.refreshToken.trim() !== '';
  const credentialsOk = hasClientId && hasClientSecret && hasRefreshToken;

  console.log('Configuração no banco:');
  console.log('  Habilitado:', config.enabled ? 'Sim' : 'Não');
  console.log('  Client ID:', hasClientId ? 'Preenchido' : 'Faltando');
  console.log('  Client Secret:', hasClientSecret ? 'Preenchido' : 'Faltando');
  console.log('  Refresh Token:', hasRefreshToken ? 'Preenchido' : 'Faltando');
  console.log('  Duração padrão:', config.defaultDuration, 'min');
  console.log('');

  if (!config.enabled) {
    console.log('⚠️  Google Meet está desabilitado.');
    console.log('   Ação: em Admin → Telemedicina, ligue o toggle do Google Meet e salve.\n');
    return;
  }

  if (!credentialsOk) {
    console.log('⚠️  Credenciais incompletas.');
    if (!hasClientId) console.log('   - Preencha Client ID (Google OAuth).');
    if (!hasClientSecret) console.log('   - Preencha Client Secret.');
    if (!hasRefreshToken) console.log('   - Preencha Refresh Token (obtido no OAuth Playground).');
    console.log('   Depois clique em "Testar Credenciais" e "Salvar" na página de telemedicina.\n');
    return;
  }

  console.log('✅ Google Meet: habilitado e credenciais presentes no banco.');
  console.log('   Para validar de fato:');
  console.log('   1. Inicie o servidor (npm run dev) e faça login como admin.');
  console.log('   2. Acesse Admin → Telemedicina e clique em "Testar Credenciais" no Google Meet.');
  console.log('   3. Para testar criação de reunião: use "Iniciar Reunião" em uma consulta com pagamento confirmado.\n');
}

main()
  .catch((e) => {
    console.error('Erro:', e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
