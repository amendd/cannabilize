/**
 * Script para criar os métodos de pagamento Mercado Pago (PIX e Cartão) no banco.
 * Use se a página Admin > Métodos de Pagamento está vazia e você não quer rodar o seed completo.
 *
 * Executar: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/criar-metodos-pagamento-mercadopago.ts
 * Ou: npx tsx scripts/criar-metodos-pagamento-mercadopago.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.paymentMethod.count();
  if (count > 0) {
    console.log(`Já existem ${count} método(s) de pagamento. Nada a fazer.`);
    return;
  }

  await prisma.paymentMethod.createMany({
    data: [
      {
        name: 'PIX - Mercado Pago',
        type: 'PIX',
        enabled: false,
        isIntegrated: true,
        gateway: 'mercadopago',
        description:
          'PIX integrado via Mercado Pago. Edite e preencha Access Token e Public Key (credenciais de teste).',
        icon: '💳',
        order: 0,
      },
      {
        name: 'Cartão de Crédito - Mercado Pago',
        type: 'CREDIT_CARD',
        enabled: false,
        isIntegrated: true,
        gateway: 'mercadopago',
        description:
          'Cartão de crédito/débito via Mercado Pago. Edite e preencha as credenciais de teste.',
        icon: '💳',
        order: 1,
      },
    ],
  });

  console.log('✅ Métodos de pagamento criados: PIX - Mercado Pago e Cartão de Crédito - Mercado Pago.');
  console.log('   Acesse Admin > Métodos de Pagamento e clique em Editar para adicionar suas credenciais de teste.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
