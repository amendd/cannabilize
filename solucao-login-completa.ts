/**
 * Script completo para diagnosticar e resolver problemas de login
 * Execute: npx tsx solucao-login-completa.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function solucaoLogin() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DE LOGIN\n');
  console.log('='.repeat(60));

  // 1. Verificar conexão com banco
  console.log('\n1️⃣ Verificando conexão com banco de dados...');
  try {
    await prisma.$connect();
    console.log('✅ Conexão com banco estabelecida!\n');
  } catch (error: any) {
    console.error('❌ ERRO: Não foi possível conectar ao banco de dados!');
    console.error(`   Erro: ${error.message}\n`);
    
    if (error.message.includes('TLS') || error.message.includes('SSL')) {
      console.log('💡 SOLUÇÃO: Problema com SSL/TLS');
      console.log('   Verifique se a DATABASE_URL no .env inclui:');
      console.log('   - ?sslmode=require (para Supabase)');
      console.log('   - Ou ajuste para ?sslmode=prefer (mais permissivo)\n');
    }
    
    if (error.message.includes('password') || error.message.includes('authentication')) {
      console.log('💡 SOLUÇÃO: Credenciais incorretas');
      console.log('   Verifique a DATABASE_URL no arquivo .env\n');
    }
    
    console.log('📝 Exemplo de DATABASE_URL correta:');
    console.log('   postgresql://usuario:senha@host:5432/database?sslmode=require\n');
    
    await prisma.$disconnect();
    process.exit(1);
  }

  // 2. Verificar se tabela users existe
  console.log('2️⃣ Verificando estrutura do banco...');
  try {
    const totalUsuarios = await prisma.user.count();
    console.log(`✅ Tabela 'users' existe! Total de usuários: ${totalUsuarios}\n`);
  } catch (error: any) {
    console.error('❌ ERRO: Tabela "users" não existe!');
    console.error(`   Erro: ${error.message}\n`);
    console.log('💡 SOLUÇÃO: Execute os seguintes comandos:');
    console.log('   1. npx prisma generate');
    console.log('   2. npx prisma db push\n');
    await prisma.$disconnect();
    process.exit(1);
  }

  // 3. Verificar usuários existentes
  console.log('3️⃣ Verificando usuários no banco...');
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@cannabilize.com.br' },
  });

  const doctor = await prisma.user.findUnique({
    where: { email: 'doctor@cannabilize.com.br' },
  });

  const paciente = await prisma.user.findUnique({
    where: { email: 'paciente@cannabilize.com.br' },
  });

  // 4. Criar/atualizar usuários
  console.log('4️⃣ Criando/atualizando usuários...\n');

  // Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@cannabilize.com.br' },
    update: {
      password: adminPassword,
      role: 'ADMIN',
      name: 'Administrador',
    },
    create: {
      email: 'admin@cannabilize.com.br',
      name: 'Administrador',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin criado/atualizado:');
  console.log(`   Email: ${adminUser.email}`);
  console.log(`   Senha: admin123`);
  console.log(`   Role: ${adminUser.role}\n`);

  // Médico
  const doctorPassword = await bcrypt.hash('doctor123', 10);
  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@cannabilize.com.br' },
    update: {
      password: doctorPassword,
      role: 'DOCTOR',
      name: 'Dr. João Silva',
    },
    create: {
      email: 'doctor@cannabilize.com.br',
      name: 'Dr. João Silva',
      password: doctorPassword,
      role: 'DOCTOR',
    },
  });

  // Criar registro do médico
  await prisma.doctor.upsert({
    where: { crm: 'CRM123456' },
    update: {
      userId: doctorUser.id,
      active: true,
      email: 'doctor@cannabilize.com.br',
    },
    create: {
      name: 'Dr. João Silva',
      crm: 'CRM123456',
      email: 'doctor@cannabilize.com.br',
      specialization: 'Cannabis Medicinal',
      active: true,
      userId: doctorUser.id,
    },
  });
  console.log('✅ Médico criado/atualizado:');
  console.log(`   Email: ${doctorUser.email}`);
  console.log(`   Senha: doctor123`);
  console.log(`   Role: ${doctorUser.role}\n`);

  // Paciente
  const patientPassword = await bcrypt.hash('paciente123', 10);
  const patientUser = await prisma.user.upsert({
    where: { email: 'paciente@cannabilize.com.br' },
    update: {
      password: patientPassword,
      role: 'PATIENT',
      name: 'Paciente Teste',
    },
    create: {
      email: 'paciente@cannabilize.com.br',
      name: 'Paciente Teste',
      password: patientPassword,
      role: 'PATIENT',
    },
  });
  console.log('✅ Paciente criado/atualizado:');
  console.log(`   Email: ${patientUser.email}`);
  console.log(`   Senha: paciente123`);
  console.log(`   Role: ${patientUser.role}\n`);

  // 5. Verificar configuração do NextAuth
  console.log('5️⃣ Verificando configuração do NextAuth...');
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  const nextAuthUrl = process.env.NEXTAUTH_URL;

  if (!nextAuthSecret) {
    console.log('⚠️  AVISO: NEXTAUTH_SECRET não está configurado!');
    console.log('   Adicione no arquivo .env:');
    console.log('   NEXTAUTH_SECRET="sua-chave-secreta-aqui"\n');
    console.log('   Para gerar uma chave segura, execute:');
    console.log('   node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"\n');
  } else {
    console.log('✅ NEXTAUTH_SECRET configurado\n');
  }

  if (!nextAuthUrl) {
    console.log('⚠️  AVISO: NEXTAUTH_URL não está configurado!');
    console.log('   Adicione no arquivo .env:');
    console.log('   NEXTAUTH_URL="http://localhost:3000"\n');
  } else {
    console.log(`✅ NEXTAUTH_URL configurado: ${nextAuthUrl}\n`);
  }

  // 6. Testar autenticação
  console.log('6️⃣ Testando autenticação...');
  try {
    const testUser = await prisma.user.findUnique({
      where: { email: 'admin@cannabilize.com.br' },
    });

    if (testUser && testUser.password) {
      const isValid = await bcrypt.compare('admin123', testUser.password);
      if (isValid) {
        console.log('✅ Autenticação funcionando corretamente!\n');
      } else {
        console.log('❌ ERRO: Senha não confere!\n');
      }
    } else {
      console.log('❌ ERRO: Usuário não tem senha!\n');
    }
  } catch (error: any) {
    console.error(`❌ Erro ao testar autenticação: ${error.message}\n`);
  }

  // Resumo final
  console.log('='.repeat(60));
  console.log('\n🎉 DIAGNÓSTICO CONCLUÍDO!\n');
  console.log('📋 CREDENCIAIS PARA LOGIN:');
  console.log('   👤 Admin:');
  console.log('      Email: admin@cannabilize.com.br');
  console.log('      Senha: admin123');
  console.log('      URL: http://localhost:3000/login\n');
  console.log('   👨‍⚕️ Médico:');
  console.log('      Email: doctor@cannabilize.com.br');
  console.log('      Senha: doctor123');
  console.log('      URL: http://localhost:3000/login\n');
  console.log('   👤 Paciente:');
  console.log('      Email: paciente@cannabilize.com.br');
  console.log('      Senha: paciente123');
  console.log('      URL: http://localhost:3000/login\n');

  console.log('📝 PRÓXIMOS PASSOS:');
  console.log('   1. Certifique-se de que o servidor está rodando: npm run dev');
  console.log('   2. Acesse: http://localhost:3000/login');
  console.log('   3. Use uma das credenciais acima para fazer login\n');

  console.log('⚠️  SE O LOGIN AINDA NÃO FUNCIONAR:');
  console.log('   1. Verifique se NEXTAUTH_SECRET está no .env');
  console.log('   2. Verifique se NEXTAUTH_URL está no .env');
  console.log('   3. Reinicie o servidor após alterar o .env');
  console.log('   4. Limpe o cache do navegador\n');

  await prisma.$disconnect();
}

solucaoLogin().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
