/**
 * Garante que o usuário admin exista com a senha correta para login no ERP CANNA.
 * Usa SQL direto para funcionar mesmo se o banco não tiver colunas novas (ex.: deleted_at).
 * Execute: npx tsx scripts/garantir-admin-erp.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@cannabilize.com.br';
const ADMIN_PASSWORD = 'admin123';

async function main() {
  console.log('Verificando/criando usuário admin para ERP CANNA...\n');

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const now = new Date().toISOString();

  // SQLite: tabela "users" (map do Prisma). Não usar colunas que podem não existir (deleted_at).
  const existing = await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM users WHERE email = ${ADMIN_EMAIL}`;

  if (existing && existing.length > 0) {
    await prisma.$executeRaw`
      UPDATE users SET password = ${hashedPassword}, name = 'Administrador', role = 'ADMIN', updated_at = ${now}
      WHERE email = ${ADMIN_EMAIL}
    `;
    console.log('✅ Senha do admin atualizada.\n');
  } else {
    const id = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO users (id, email, name, password, role, created_at, updated_at)
      VALUES (${id}, ${ADMIN_EMAIL}, 'Administrador', ${hashedPassword}, 'ADMIN', ${now}, ${now})
    `;
    console.log('✅ Admin criado.\n');
  }

  console.log('   Email:', ADMIN_EMAIL);
  console.log('   Senha:', ADMIN_PASSWORD);
  console.log('\n   Use em /login e depois acesse /erp-canna\n');
}

main()
  .catch((e) => {
    console.error('Erro:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
