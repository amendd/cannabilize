/**
 * Script para executar a migração de convites de remarcação
 * Execute com: npx tsx scripts/run-reschedule-invites-migration.ts
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('🔄 Iniciando migração de convites de remarcação...');

    // Ler o arquivo SQL da migração
    const migrationPath = join(
      __dirname,
      '../prisma/migrations/20260128000000_add_reschedule_invites/migration.sql'
    );
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Executar a migração
    // Como o Prisma Client não suporta execução direta de SQL em SQLite,
    // vamos verificar se a tabela já existe e criar se necessário
    const tableExists = await prisma.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='consultation_reschedule_invites'
    `;

    if (tableExists.length > 0) {
      console.log('✅ Tabela consultation_reschedule_invites já existe!');
      console.log('ℹ️  Migração já foi aplicada anteriormente.');
      return;
    }

    // Executar SQL diretamente usando $executeRawUnsafe
    console.log('📝 Criando tabela consultation_reschedule_invites...');
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "consultation_reschedule_invites" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "consultation_id" TEXT NOT NULL,
        "patient_id" TEXT NOT NULL,
        "doctor_id" TEXT NOT NULL,
        "current_scheduled_at" DATETIME NOT NULL,
        "new_scheduled_at" DATETIME NOT NULL,
        "new_scheduled_date" TEXT NOT NULL,
        "new_scheduled_time" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "message" TEXT,
        "expires_at" DATETIME NOT NULL,
        "responded_at" DATETIME,
        "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME NOT NULL,
        FOREIGN KEY ("consultation_id") REFERENCES "consultations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY ("patient_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        FOREIGN KEY ("doctor_id") REFERENCES "doctors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `);

    console.log('📊 Criando índices...');

    await prisma.$executeRawUnsafe(`
      CREATE INDEX "consultation_reschedule_invites_consultation_id_idx" 
      ON "consultation_reschedule_invites"("consultation_id");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX "consultation_reschedule_invites_patient_id_idx" 
      ON "consultation_reschedule_invites"("patient_id");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX "consultation_reschedule_invites_doctor_id_idx" 
      ON "consultation_reschedule_invites"("doctor_id");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX "consultation_reschedule_invites_status_idx" 
      ON "consultation_reschedule_invites"("status");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX "consultation_reschedule_invites_expires_at_idx" 
      ON "consultation_reschedule_invites"("expires_at");
    `);

    console.log('✅ Migração concluída com sucesso!');
    console.log('📋 Tabela consultation_reschedule_invites criada com todos os índices.');

  } catch (error) {
    console.error('❌ Erro ao executar migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMigration()
  .then(() => {
    console.log('✨ Processo finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
