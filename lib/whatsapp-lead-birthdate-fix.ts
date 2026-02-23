/**
 * Corrige birth_date na tabela whatsapp_leads quando está em formato que o Prisma não aceita.
 * - Número (timestamp ms) ou "YYYY-MM-DD HH:MM:SS" → ISO 8601 (ex: 1994-05-24T00:00:00.000Z).
 * Chamado automaticamente quando o fluxo detecta erro ao buscar o lead.
 */
import { prisma } from './prisma';

export async function fixWhatsAppLeadBirthDateIfNeeded(phone: string): Promise<void> {
  try {
    // 1) Numérico (timestamp ms) → ISO 8601 (Prisma exige este formato no SQLite)
    await prisma.$executeRawUnsafe(
      `UPDATE whatsapp_leads SET birth_date = strftime('%Y-%m-%dT%H:%M:%S.000Z', datetime(cast(birth_date as real)/1000, 'unixepoch'))
       WHERE phone = ? AND birth_date IS NOT NULL AND birth_date GLOB '[0-9]*'`,
      phone
    );
    // 2) "YYYY-MM-DD HH:MM:SS" (formato SQLite datetime) → ISO 8601
    await prisma.$executeRawUnsafe(
      `UPDATE whatsapp_leads SET birth_date = replace(birth_date, ' ', 'T') || '.000Z'
       WHERE phone = ? AND birth_date IS NOT NULL AND birth_date LIKE '% %'`,
      phone
    );
  } catch (e) {
    console.warn('[WhatsApp Lead] Erro ao corrigir birth_date:', e);
  }
}
