/**
 * Script para criar/atualizar usuário admin com email admin@clickcannabis.com
 * Execute: npx tsx scripts/criar-admin-clickcannabis.ts
 * 
 * Este script garante que o usuário admin com o email correto exista no banco
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function criarAdminClickcannabis() {
  try {
    console.log('🔧 Criando/atualizando usuário admin...');

    const adminPassword = await bcrypt.hash('admin123', 10);
    
    // Criar ou atualizar o admin com o email correto
    const admin = await prisma.user.upsert({
      where: { email: 'admin@clickcannabis.com' },
      update: {
        password: adminPassword, // Atualizar senha caso o usuário já exista
        role: 'ADMIN',
        name: 'Administrador',
      },
      create: {
        email: 'admin@clickcannabis.com',
        name: 'Administrador',
        password: adminPassword,
        role: 'ADMIN',
      },
    });

    console.log('✅ Usuário admin criado/atualizado com sucesso!');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Senha: admin123`);
    console.log(`   Role: ${admin.role}`);
    console.log('\n💡 Agora você pode fazer login com essas credenciais!');

  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

criarAdminClickcannabis();
