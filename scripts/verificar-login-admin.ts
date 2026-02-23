/**
 * Verifica se o admin existe e se a senha "admin123" confere no banco.
 * Execute: npx tsx scripts/verificar-login-admin.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@cannabilize.com.br';
const ADMIN_PASSWORD = 'admin123';

async function main() {
  console.log('Verificando login do admin...\n');
  console.log('DATABASE_URL (primeiros 50 chars):', (process.env.DATABASE_URL || '').slice(0, 50));

  const user = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { id: true, email: true, password: true, role: true, deletedAt: true },
  });

  if (!user) {
    console.log('❌ Nenhum usuário encontrado com email:', ADMIN_EMAIL);
    console.log('\n   Rode: npx prisma db seed');
    return;
  }

  if (user.deletedAt) {
    console.log('⚠️ Conta está desativada. Reativando...');
    await prisma.user.update({
      where: { email: ADMIN_EMAIL },
      data: { deletedAt: null },
    });
    console.log('✅ Conta reativada.');
  }
  console.log('✅ Usuário encontrado:', user.email, '| role:', user.role);

  if (!user.password) {
    console.log('❌ Usuário não tem senha definida. Definindo admin123...');
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await prisma.user.update({
      where: { email: ADMIN_EMAIL },
      data: { password: hash },
    });
    console.log('✅ Senha definida. Use admin123 para logar.');
    return;
  }

  const ok = await bcrypt.compare(ADMIN_PASSWORD, user.password);
  if (ok) {
    console.log('✅ Senha "admin123" confere. Login deve funcionar.');
    console.log('\n   Use exatamente: email', ADMIN_EMAIL, '| senha admin123');
  } else {
    console.log('❌ Senha "admin123" NÃO confere. Redefinindo para admin123...');
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await prisma.user.update({
      where: { email: ADMIN_EMAIL },
      data: { password: hash, deletedAt: null },
    });
    console.log('✅ Senha atualizada e conta reativada (se estava desativada). Tente logar com admin123');
  }
}

main()
  .catch((e) => {
    console.error('Erro:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
