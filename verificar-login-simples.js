/**
 * Script JavaScript simples para verificar login
 * Não precisa de TypeScript, funciona direto com Node.js
 * Execute: node verificar-login-simples.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function verificarLogin() {
  try {
    console.log('🔍 Verificando login...\n');

    // Testar conexão
    await prisma.$connect();
    console.log('✅ Conexão com banco OK\n');

    // Verificar admin
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@cannabilize.com.br' },
    });

    if (!admin) {
      console.log('❌ Admin NÃO encontrado!');
      console.log('   Email procurado: admin@cannabilize.com.br');
      console.log('\n💡 Execute: npx tsx criar-dados-completos.ts\n');
      await prisma.$disconnect();
      return;
    }

    console.log('✅ Admin encontrado:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Nome: ${admin.name}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Tem senha: ${admin.password ? 'SIM ✅' : 'NÃO ❌'}`);

    // Testar senha
    if (admin.password) {
      const senhaCorreta = await bcrypt.compare('admin123', admin.password);
      console.log(`   Senha "admin123" está correta: ${senhaCorreta ? 'SIM ✅' : 'NÃO ❌'}`);
      
      if (!senhaCorreta) {
        console.log('\n⚠️  PROBLEMA: A senha não confere!');
        console.log('   Execute: npx tsx criar-dados-completos.ts para recriar\n');
      } else {
        console.log('\n✅ Admin está OK!');
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

    // Resumo
    console.log('\n📋 Diagnóstico Final:');
    if (admin && admin.password) {
      const senhaOk = await bcrypt.compare('admin123', admin.password);
      if (senhaOk) {
        console.log('✅ Admin está configurado corretamente!');
        console.log('\n💡 Se o login ainda não funciona, verifique:');
        console.log('   1. Servidor está rodando? (http://localhost:3000)');
        console.log('   2. Use credenciais: admin@cannabilize.com.br / admin123');
        console.log('   3. Limpe o cache do navegador');
        console.log('   4. Verifique o console do navegador (F12)');
      } else {
        console.log('❌ Senha do admin está incorreta!');
        console.log('   Execute: npx tsx criar-dados-completos.ts');
      }
    } else {
      console.log('❌ Admin não existe ou não tem senha!');
      console.log('   Execute: npx tsx criar-dados-completos.ts');
    }

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    
    if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Problema de conexão com o banco!');
      console.log('   Verifique:');
      console.log('   1. A DATABASE_URL no arquivo .env está correta?');
      console.log('   2. O banco Supabase está ativo?');
      console.log('   3. Sua conexão com a internet está funcionando?');
    } else if (error.message.includes('Cannot find module')) {
      console.log('\n💡 Dependências não instaladas!');
      console.log('   Execute: npm install');
    } else {
      console.log('\n💡 Erro desconhecido. Detalhes:');
      console.log(error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

verificarLogin();
