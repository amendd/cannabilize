/**
 * Script simples para testar login diretamente
 * Execute: node --loader ts-node/esm testar-login.ts
 * OU: npx tsx testar-login.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testarLogin() {
  try {
    console.log('🔍 Testando login...\n');

    // Testar conexão
    await prisma.$connect();
    console.log('✅ Conexão com banco OK\n');

    // Verificar admin
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@cannabilize.com.br' },
    });

    if (!admin) {
      console.log('❌ Admin NÃO encontrado!');
      console.log('   Execute: npx tsx criar-dados-completos.ts\n');
      return;
    }

    console.log('✅ Admin encontrado:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Tem senha: ${admin.password ? 'SIM' : 'NÃO'}`);

    // Testar senha
    if (admin.password) {
      const senhaCorreta = await bcrypt.compare('admin123', admin.password);
      console.log(`   Senha "admin123" está correta: ${senhaCorreta ? 'SIM ✅' : 'NÃO ❌'}`);
      
      if (!senhaCorreta) {
        console.log('\n⚠️  PROBLEMA: A senha não confere!');
        console.log('   Execute: npx tsx criar-dados-completos.ts para recriar\n');
      }
    } else {
      console.log('\n⚠️  PROBLEMA: Admin não tem senha!');
      console.log('   Execute: npx tsx criar-dados-completos.ts para recriar\n');
    }

    // Verificar médico
    const doctor = await prisma.user.findUnique({
      where: { email: 'doctor@cannabilize.com.br' },
    });

    if (doctor) {
      console.log('\n✅ Médico encontrado:');
      console.log(`   Email: ${doctor.email}`);
      console.log(`   Tem senha: ${doctor.password ? 'SIM' : 'NÃO'}`);
      
      if (doctor.password) {
        const senhaCorreta = await bcrypt.compare('doctor123', doctor.password);
        console.log(`   Senha "doctor123" está correta: ${senhaCorreta ? 'SIM ✅' : 'NÃO ❌'}`);
      }
    } else {
      console.log('\n❌ Médico NÃO encontrado!');
    }

    console.log('\n📋 Diagnóstico:');
    if (admin && admin.password) {
      const senhaOk = await bcrypt.compare('admin123', admin.password);
      if (senhaOk) {
        console.log('✅ Admin está OK! O problema pode ser:');
        console.log('   1. Servidor não está rodando');
        console.log('   2. NEXTAUTH_SECRET está diferente');
        console.log('   3. Problema na página de login');
        console.log('   4. Cache do navegador');
      } else {
        console.log('❌ Senha do admin está incorreta!');
        console.log('   Execute: npx tsx criar-dados-completos.ts');
      }
    } else {
      console.log('❌ Admin não existe ou não tem senha!');
      console.log('   Execute: npx tsx criar-dados-completos.ts');
    }

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    if (error.message.includes('connect')) {
      console.log('\n💡 Problema de conexão com o banco!');
      console.log('   Verifique a DATABASE_URL no arquivo .env');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testarLogin();
