/**
 * Corrige todos os registros de WhatsAppLead em que birth_date está em formato
 * que o Prisma não aceita (número ou "YYYY-MM-DD HH:MM:SS") → ISO 8601.
 * Execute uma vez: npx tsx scripts/fix-whatsapp-lead-birth-date.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Corrigindo birth_date em whatsapp_leads para formato ISO 8601 (Prisma)...\n');

  // 1) Numérico (timestamp ms) → ISO 8601
  const r1 = await prisma.$executeRawUnsafe(`
    UPDATE whatsapp_leads
    SET birth_date = strftime('%Y-%m-%dT%H:%M:%S.000Z', datetime(cast(birth_date as real)/1000, 'unixepoch'))
    WHERE birth_date IS NOT NULL AND birth_date GLOB '[0-9]*'
  `);
  // 2) "YYYY-MM-DD HH:MM:SS" → ISO 8601
  const r2 = await prisma.$executeRawUnsafe(`
    UPDATE whatsapp_leads
    SET birth_date = replace(birth_date, ' ', 'T') || '.000Z'
    WHERE birth_date IS NOT NULL AND birth_date LIKE '% %'
  `);

  const total = Number(r1) + Number(r2);
  console.log('✅ Linhas atualizadas (numéricas:', r1, ', com espaço:', r2, ') Total:', total);
  if (total > 0) {
    console.log('   Próximas mensagens do WhatsApp para esses números devem processar normalmente.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
