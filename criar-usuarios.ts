/**
 * Script para criar usuários de teste no banco de dados
 * Execute: npx tsx criar-usuarios.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function criarUsuarios() {
  try {
    console.log('🔧 Criando usuários no banco de dados...\n');

    // Criar usuário admin
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
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
    console.log(`   Email: ${admin.email}`);
    console.log(`   Senha: admin123`);
    console.log(`   Role: ${admin.role}\n`);

    // Criar usuário médico
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
    const doctor = await prisma.doctor.upsert({
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

    // Criar paciente de teste
    const patientPassword = await bcrypt.hash('paciente123', 10);
    const patient = await prisma.user.upsert({
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
    console.log(`   Email: ${patient.email}`);
    console.log(`   Senha: paciente123`);
    console.log(`   Role: ${patient.role}\n`);

    console.log('🎉 Usuários criados com sucesso!');
    console.log('\n📋 Credenciais para login:');
    console.log('   Admin: admin@cannabilize.com.br / admin123');
    console.log('   Médico: doctor@cannabilize.com.br / doctor123');
    console.log('   Paciente: paciente@cannabilize.com.br / paciente123');

  } catch (error) {
    console.error('❌ Erro ao criar usuários:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

criarUsuarios();
