import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixResendConfig() {
  console.log('🔧 Ajustando configuração do Resend para testes...\n');

  try {
    // Buscar configuração do Resend
    const config = await prisma.emailConfig.findUnique({
      where: { provider: 'RESEND' },
    });

    if (!config) {
      console.log('❌ Configuração do Resend não encontrada.');
      console.log('💡 Execute primeiro a configuração manual no painel admin.');
      return;
    }

    console.log('📝 Configuração atual:');
    console.log(`   Email Remetente: ${config.fromEmail || '(não configurado)'}`);
    console.log(`   Nome Remetente: ${config.fromName || '(não configurado)'}`);
    console.log(`   Habilitado: ${config.enabled ? 'Sim' : 'Não'}\n`);

    // Atualizar para usar domínio de teste do Resend
    const updated = await prisma.emailConfig.update({
      where: { provider: 'RESEND' },
      data: {
        fromEmail: 'onboarding@resend.dev',
        fromName: config.fromName || 'Cannabilize',
        enabled: true, // Garantir que está habilitado
      },
    });

    console.log('✅ Configuração atualizada com sucesso!');
    console.log('\n📧 Nova configuração:');
    console.log(`   Email Remetente: ${updated.fromEmail}`);
    console.log(`   Nome Remetente: ${updated.fromName}`);
    console.log(`   Habilitado: ${updated.enabled ? 'Sim' : 'Não'}\n`);
    console.log('💡 Agora você pode testar o envio de emails no painel admin!');
    console.log('   Acesse: /admin/email e clique em "Testar Envio"\n');
  } catch (error) {
    console.error('❌ Erro ao atualizar configuração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixResendConfig()
  .then(() => {
    console.log('✅ Script concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });
