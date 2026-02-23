import { prisma } from './prisma';
import { headers } from 'next/headers';

export interface AuditLogData {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Verifica se a tabela audit_logs existe
 */
async function auditTableExists(): Promise<boolean> {
  try {
    // Tentar uma query simples para verificar se a tabela existe
    await prisma.$queryRaw`SELECT 1 FROM audit_logs LIMIT 1`;
    return true;
  } catch (error: any) {
    // Se der erro de tabela não encontrada, retorna false
    if (error?.message?.includes('no such table') || 
        error?.message?.includes('does not exist') ||
        error?.code === 'P2021') {
      return false;
    }
    // Outros erros, assumir que não existe por segurança
    return false;
  }
}

/**
 * Cria um log de auditoria
 * Funciona com ou sem a tabela audit_logs (fallback para console.log)
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    // Obter informações da requisição
    let ipAddress = 'unknown';
    let userAgent = 'unknown';
    
    try {
      const headersList = await headers();
      ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || 
                  headersList.get('x-real-ip') || 
                  'unknown';
      userAgent = headersList.get('user-agent') || 'unknown';
    } catch {
      // Se headers() falhar (fora de contexto Next.js), usar valores padrão
    }

    // Tentar salvar no banco se a tabela existir
    const tableExists = await auditTableExists();
    
    if (tableExists) {
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          changes: data.changes ? JSON.stringify(data.changes) : null,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          ipAddress,
          userAgent,
        },
      });
    } else {
      // Fallback: Log no console (em produção, poderia usar arquivo ou serviço externo)
      const logEntry = {
        timestamp: new Date().toISOString(),
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        changes: data.changes,
        metadata: data.metadata,
        ipAddress,
        userAgent,
      };
      
      // Log estruturado para facilitar parsing depois
      console.log('[AUDIT_LOG]', JSON.stringify(logEntry));
    }
  } catch (error) {
    // Não bloquear a operação principal se o log falhar
    // Fallback para console.log
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId: data.userId,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      changes: data.changes,
      metadata: data.metadata,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    console.error('[AUDIT_LOG_ERROR]', JSON.stringify(logEntry));
  }
}

/**
 * Cria log de auditoria de forma assíncrona (não bloqueia)
 */
export function createAuditLogAsync(data: AuditLogData): void {
  createAuditLog(data).catch(error => {
    console.error('Erro ao criar log de auditoria (async):', error);
  });
}

/**
 * Tipos de ações de auditoria
 */
export const AuditAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  EXPORT: 'EXPORT',
  DELETE_ACCOUNT: 'DELETE_ACCOUNT',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  ROLE_CHANGE: 'ROLE_CHANGE',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  PAYMENT: 'PAYMENT',
  PRESCRIPTION_ISSUED: 'PRESCRIPTION_ISSUED',
  FEEDBACK: 'FEEDBACK',
  CHARGE_CANCEL: 'CHARGE_CANCEL',
  RECONCILE: 'RECONCILE',
} as const;

/**
 * Entidades que podem ser auditadas
 */
export const AuditEntity = {
  USER: 'User',
  CONSULTATION: 'Consultation',
  PRESCRIPTION: 'Prescription',
  PAYMENT: 'Payment',
  CHARGE: 'Charge',
  RECONCILIATION: 'Reconciliation',
  DOCTOR: 'Doctor',
  PATIENT_CARD: 'PatientCard',
  ANVISA_AUTHORIZATION: 'AnvisaAuthorization',
  MEDICATION: 'Medication',
  PATIENT_CONSENT: 'PatientConsent',
  ERP_ORDER: 'ErpOrder',
} as const;
