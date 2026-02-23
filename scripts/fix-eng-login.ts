/**
 * Garante que o usuário do engenheiro agrônomo existe com senha correta e role AGRONOMIST.
 * Rode: npx tsx scripts/fix-eng-login.ts
 * Depois: tente logar em /login (opção Engenheiro Agrônomo) com eng@cannabilize.com.br / eng123
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const ENG_EMAIL = 'eng@cannabilize.com.br';
const SENHA = 'eng123';

async function main() {
  console.log('Verificando/corrigindo usuário do engenheiro agrônomo...\n');

  let user = await prisma.user.findUnique({
    where: { email: ENG_EMAIL },
    select: { id: true, email: true, name: true, role: true, password: true, deletedAt: true },
  });

  if (!user) {
    console.log('Usuário não encontrado. Criando...');
    const hash = await bcrypt.hash(SENHA, 10);
    user = await prisma.user.create({
      data: {
        email: ENG_EMAIL,
        name: 'Eng. Agrônomo Silva',
        password: hash,
        role: 'AGRONOMIST',
      },
      select: { id: true, email: true, name: true, role: true, password: true, deletedAt: true },
    });
    console.log('✅ Usuário criado.');
  } else {
    const newHash = await bcrypt.hash(SENHA, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: newHash,
        role: 'AGRONOMIST',
        name: 'Eng. Agrônomo Silva',
        deletedAt: null,
      },
    });
    console.log('✅ Senha e perfil atualizados (role AGRONOMIST, deletedAt limpo).');
  }

  const depois = await prisma.user.findUnique({
    where: { email: ENG_EMAIL },
    select: { password: true, role: true, deletedAt: true },
  });

  const senhaOk = depois?.password && (await bcrypt.compare(SENHA, depois.password));
  const roleOk = depois?.role === 'AGRONOMIST';
  const ativo = !depois?.deletedAt;

  if (senhaOk && roleOk && ativo) {
    console.log('\n✅ Tudo certo. Faça login com:');
    console.log('   Email:', ENG_EMAIL);
    console.log('   Senha:', SENHA);
    console.log('\n   Em /login escolha "Engenheiro Agrônomo" ou acesse /login?callbackUrl=%2Fengenheiro');
  } else {
    console.log('\n❌ Algo falhou:', { senhaOk, roleOk, ativo });
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
