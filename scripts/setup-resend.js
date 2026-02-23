/**
 * Script simples para configurar Resend no banco de dados
 * Execute com: node scripts/setup-resend.js
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function setupResendConfig() {
  console.log('🔧 Configurando integração com Resend...\n');

  try {
    // 1. Verificar se a API key está no .env
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('❌ ERRO: RESEND_API_KEY não encontrada no arquivo .env');
      console.log('💡 Adicione: RESEND_API_KEY="sua_chave_aqui" no arquivo .env');
      process.exit(1);
    }

    console.log('✅ API Key encontrada no .env');
    console.log(`   Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}\n`);

    // 2. Verificar/criar configuração no banco de dados
    let emailConfig = await prisma.emailConfig.findUnique({
      where: { provider: 'RESEND' },
    });

    if (!emailConfig) {
      console.log('📝 Criando configuração RESEND no banco de dados...');
      emailConfig = await prisma.emailConfig.create({
        data: {
          provider: 'RESEND',
          enabled: true,
          apiKey: apiKey,
          fromEmail: 'onboarding@resend.dev',
          fromName: 'CannabiLizi',
        },
      });
      console.log('✅ Configuração criada com sucesso\n');
    } else {
      console.log('✅ Configuração RESEND já existe no banco');
      
      // Atualizar com a API key do .env e habilitar se necessário
      const needsUpdate = emailConfig.apiKey !== apiKey || !emailConfig.enabled;
      if (needsUpdate) {
        console.log('🔄 Atualizando configuração...');
        emailConfig = await prisma.emailConfig.update({
          where: { provider: 'RESEND' },
          data: {
            apiKey: apiKey,
            enabled: true,
          },
        });
        console.log('✅ Configuração atualizada e habilitada\n');
      } else {
        console.log('✅ Configuração já está atualizada e habilitada\n');
      }
    }

    // 3. Resumo final
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ CONFIGURAÇÃO RESEND: PRONTA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✓ API Key configurada no .env`);
    console.log(`✓ Configuração no banco de dados`);
    console.log(`✓ Provedor: ${emailConfig.provider}`);
    console.log(`✓ Habilitado: ${emailConfig.enabled ? 'Sim' : 'Não'}`);
    console.log(`✓ Email remetente: ${emailConfig.fromEmail || 'Não configurado'}`);
    console.log(`✓ Nome remetente: ${emailConfig.fromName || 'Não configurado'}\n`);

    console.log('📧 Para testar o envio de email:');
    console.log('   1. Inicie o servidor: npm run dev');
    console.log('   2. Acesse: http://localhost:3000/admin/email');
    console.log('   3. Faça login como ADMIN');
    console.log('   4. Clique em "Testar Envio" no provedor RESEND');
    console.log('   5. Ou use a API: POST /api/admin/email/test\n');

  } catch (error) {
    console.error('\n❌ ERRO durante a configuração:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar configuração
setupResendConfig();
