/**
 * Script para verificar se os usuários existem no banco de dados
 * Execute: npx tsx verificar-usuarios.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarUsuarios() {
  try {
    console.log('🔍 Verificando usuários no banco de dados...\n');

    // Verificar conexão
    await prisma.$connect();
    console.log('✅ Conexão com banco de dados estabelecida!\n');

    // Contar total de usuários
    const totalUsuarios = await prisma.user.count();
    console.log(`📊 Total de usuários no banco: ${totalUsuarios}\n`);

    if (totalUsuarios === 0) {
      console.log('⚠️  NENHUM usuário encontrado no banco de dados!');
      console.log('   Isso explica por que o login não está funcionando.\n');
      console.log('💡 Solução: Execute o script criar-usuarios.ts');
      return;
    }

    // Buscar usuários específicos (mesmos emails do seed e criar-usuarios.ts)
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@cannabilize.com.br' },
    });

    const doctor = await prisma.user.findUnique({
      where: { email: 'doctor@cannabilize.com.br' },
    });

    console.log('📋 Usuários encontrados:\n');

    if (admin) {
      console.log('✅ Admin encontrado:');
      console.log(`   Email: ${admin.email}`);
      console.log(`   Nome: ${admin.name}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Tem senha: ${admin.password ? 'SIM ✅' : 'NÃO ❌'}`);
      console.log(`   Criado em: ${admin.createdAt}\n`);
    } else {
      console.log('❌ Admin NÃO encontrado (admin@cannabilize.com.br)\n');
    }

    if (doctor) {
      console.log('✅ Médico encontrado:');
      console.log(`   Email: ${doctor.email}`);
      console.log(`   Nome: ${doctor.name}`);
      console.log(`   Role: ${doctor.role}`);
      console.log(`   Tem senha: ${doctor.password ? 'SIM ✅' : 'NÃO ❌'}`);
      console.log(`   Criado em: ${doctor.createdAt}\n`);
    } else {
      console.log('❌ Médico NÃO encontrado (doctor@cannabilize.com.br)\n');
    }

    // Listar todos os usuários
    const todosUsuarios = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true,
        password: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (todosUsuarios.length > 0) {
      console.log(`\n📝 Todos os usuários (${todosUsuarios.length}):`);
      todosUsuarios.forEach((user, index) => {
        console.log(`\n   ${index + 1}. ${user.email}`);
        console.log(`      Nome: ${user.name}`);
        console.log(`      Role: ${user.role}`);
        console.log(`      Tem senha: ${user.password ? 'SIM' : 'NÃO'}`);
        console.log(`      Criado: ${user.createdAt.toLocaleString('pt-BR')}`);
      });
    }

    // Diagnóstico
    console.log('\n🔍 Diagnóstico:\n');

    if (!admin && !doctor) {
      console.log('❌ PROBLEMA: Nenhum usuário de teste encontrado!');
      console.log('   Execute: npx tsx criar-usuarios.ts\n');
    } else if (admin && !admin.password) {
      console.log('⚠️  PROBLEMA: Admin existe mas não tem senha!');
      console.log('   Execute: npx tsx criar-usuarios.ts\n');
    } else if (doctor && !doctor.password) {
      console.log('⚠️  PROBLEMA: Médico existe mas não tem senha!');
      console.log('   Execute: npx tsx criar-usuarios.ts\n');
    } else {
      console.log('✅ Tudo parece estar correto!');
      console.log('   Se o login ainda não funciona, verifique:');
      console.log('   1. O servidor está rodando?');
      console.log('   2. A conexão com o banco está ativa?');
      console.log('   3. As credenciais estão sendo digitadas corretamente?\n');
    }

  } catch (error: any) {
    console.error('❌ Erro ao verificar usuários:', error.message);
    
    if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Problema de conexão com o banco de dados!');
      console.log('   Verifique:');
      console.log('   1. A DATABASE_URL no arquivo .env está correta?');
      console.log('   2. O banco Supabase está ativo?');
      console.log('   3. Sua conexão com a internet está funcionando?');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verificarUsuarios();
