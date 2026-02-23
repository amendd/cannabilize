/**
 * Força a senha do admin para admin123 e confere com o mesmo bcrypt usado no auth.
 * Rode: npx tsx scripts/fix-admin-password.ts
 * Depois: reinicie o servidor (Ctrl+C e npm run dev) e tente logar de novo.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const ADMIN_EMAIL = 'admin@cannabilize.com.br';
const SENHA = 'admin123';

async function main() {
  console.log('Corrigindo senha do admin...\n');

  const user = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { id: true, email: true, password: true },
  });

  if (!user) {
    console.log('❌ Admin não encontrado. Rode: npx prisma db seed');
    process.exit(1);
  }

  const newHash = await bcrypt.hash(SENHA, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: newHash, deletedAt: null },
  });

  const depois = await prisma.user.findUnique({
    where: { id: user.id },
    select: { password: true },
  });

  const ok = depois?.password && (await bcrypt.compare(SENHA, depois.password));
  console.log(ok ? '✅ Senha atualizada e conferida no banco.' : '❌ Verificação falhou.');
  console.log('\n👉 Reinicie o servidor (Ctrl+C e npm run dev) e faça login com:');
  console.log('   Email:', ADMIN_EMAIL);
  console.log('   Senha:', SENHA);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
