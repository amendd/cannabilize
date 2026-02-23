/**
 * Exportação/importação de backup do banco via Prisma (JSON).
 * Ordem de inserção: pais antes de filhos (respeitando FKs).
 * Ordem de exclusão: inversa (filhos antes de pais).
 */

import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// Ordem para INSERT (pais antes de filhos). Ordem para DELETE = reverse.
const BACKUP_INSERT_ORDER = [
  'Pathology',
  'SubscriptionPlan',
  'PaymentMethod',
  'TelemedicineConfig',
  'EmailConfig',
  'WhatsAppConfig',
  'WhatsAppTemplate',
  'SystemConfig',
  'LandingTestimonial',
  'LandingFaq',
  'SiteAsset',
  'Template',
  'Event',
  'BlogPost',
  'User',
  'Doctor',
  'Organization',
  'PatientPathology',
  'DoctorAvailability',
  'Medication',
  'EventImage',
  'Consultation',
  'ConsultationConfirmationToken',
  'ConsultationFeedback',
  'Prescription',
  'PatientCard',
  'AnvisaAuthorization',
  'Import',
  'Charge',
  'Subscription',
  'ErpOrder',
  'Payment',
  'Testimonial',
  'ConsultationFile',
  'DoctorPayoutAccount',
  'DoctorPayout',
  'ConsultationRescheduleInvite',
  'ErpOrderItem',
  'OrderShipment',
  'AuditLog',
  'PatientConsent',
  'PrescriptionDocument',
  'PrescriptionDocumentAccess',
  'ClinicalEvolution',
  'MedicalCertificate',
  'ExamRequest',
  'Notification',
  'WhatsAppMessage',
  'WhatsAppWebhookLog',
  'WhatsAppLead',
  'WhatsAppIncomingMedia',
  'PrescriptionMedication',
] as const;

const BACKUP_DELETE_ORDER = [...BACKUP_INSERT_ORDER].reverse();

type ModelName = (typeof BACKUP_INSERT_ORDER)[number];

function getModel(name: ModelName): keyof PrismaClient {
  const key = name as keyof PrismaClient;
  if (!(key in prisma) || key.startsWith('$') || key.startsWith('_')) {
    throw new Error(`Modelo inválido para backup: ${name}`);
  }
  return key;
}

export interface BackupMeta {
  exportedAt: string;
  version: number;
  dbType: 'sqlite' | 'postgresql';
}

export interface BackupPayload {
  meta: BackupMeta;
  data: Record<string, unknown[]>;
}

/**
 * Exporta todo o banco para um objeto JSON (por modelo).
 */
export async function exportToJson(): Promise<BackupPayload> {
  const dbUrl = process.env.DATABASE_URL ?? '';
  const dbType = dbUrl.startsWith('file:') ? 'sqlite' : 'postgresql';

  const data: Record<string, unknown[]> = {};

  for (const modelName of BACKUP_INSERT_ORDER) {
    try {
      const model = prisma[getModel(modelName)] as { findMany: () => Promise<unknown[]> };
      const rows = await model.findMany();
      data[modelName] = rows as unknown[];
    } catch (e) {
      console.error(`Backup: erro ao exportar ${modelName}`, e);
      data[modelName] = [];
    }
  }

  return {
    meta: {
      exportedAt: new Date().toISOString(),
      version: 1,
      dbType,
    },
    data,
  };
}

/**
 * Importa um payload JSON: apaga dados na ordem reversa e insere na ordem definida.
 * Executado em transação (rollback em caso de erro).
 */
export async function importFromPayload(payload: BackupPayload): Promise<{ imported: number }> {
  const { data } = payload;
  let imported = 0;

  await prisma.$transaction(async (tx) => {
    for (const modelName of BACKUP_DELETE_ORDER) {
      const rows = data[modelName];
      if (!Array.isArray(rows) || rows.length === 0) continue;
      try {
        const model = (tx as PrismaClient)[getModel(modelName)] as { deleteMany: () => Promise<{ count: number }> };
        await model.deleteMany({});
      } catch (e) {
        console.error(`Backup: erro ao limpar ${modelName}`, e);
        throw e;
      }
    }

    for (const modelName of BACKUP_INSERT_ORDER) {
      const rows = data[modelName];
      if (!Array.isArray(rows) || rows.length === 0) continue;
      try {
        const model = (tx as PrismaClient)[getModel(modelName)] as {
          createMany: (args: { data: unknown[]; skipDuplicates?: boolean }) => Promise<{ count: number }>;
        };
        const result = await model.createMany({
          data: rows as Record<string, unknown>[],
          skipDuplicates: true,
        });
        imported += result.count;
      } catch (e) {
        console.error(`Backup: erro ao importar ${modelName}`, e);
        throw e;
      }
    }
  });

  return { imported };
}

export const BACKUP_CONFIG_KEY_RETENTION_DAYS = 'backup_retention_days';
export const BACKUP_CONFIG_KEY_AUTO_EXPORT_ENABLED = 'backup_auto_export_enabled';
