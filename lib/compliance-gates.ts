/**
 * Portas de compliance — fluxo dos 3 produtos (Paciente, Médico, Associação).
 * Nada anda sem: consentimento LGPD, prescrição válida e rastreabilidade.
 * Uso: criação de pedido, cobrança, liberação logística, etc.
 */

import { prisma } from '@/lib/prisma';
import { ACTIVE_STATUSES, BLOCKING_STATUSES } from '@/lib/prescription-constants';

/** Tipo de consentimento obrigatório para avanço operacional (LGPD) */
export const CONSENT_TYPE_LGPD = 'DATA_PROCESSING';

/**
 * Verifica se o paciente possui consentimento LGPD válido (não revogado).
 */
export async function hasValidLgpdConsent(patientId: string): Promise<boolean> {
  const consent = await prisma.patientConsent.findFirst({
    where: {
      patientId,
      type: CONSENT_TYPE_LGPD,
      revokedAt: null,
    },
    orderBy: { consentedAt: 'desc' },
  });
  return !!consent;
}

/**
 * Verifica se a prescrição está ativa e pode ser usada para pedido.
 */
export async function isPrescriptionValidForOrder(
  prescriptionId: string
): Promise<{ ok: boolean; reason?: string }> {
  const prescription = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    include: { doctor: { select: { active: true } } },
  });
  if (!prescription) return { ok: false, reason: 'Prescrição não encontrada' };
  if (BLOCKING_STATUSES.includes(prescription.status))
    return { ok: false, reason: `Prescrição não está ativa (status: ${prescription.status})` };
  if (!ACTIVE_STATUSES.includes(prescription.status))
    return { ok: false, reason: 'Prescrição não está ativa para uso em pedido' };
  if (prescription.expiresAt && new Date() > prescription.expiresAt)
    return { ok: false, reason: 'Prescrição vencida' };
  if (!prescription.doctor?.active) return { ok: false, reason: 'Médico da prescrição está inativo' };
  return { ok: true };
}

/**
 * Verifica se o médico está ativo.
 */
export async function isDoctorActive(doctorId: string): Promise<boolean> {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { active: true },
  });
  return doctor?.active === true;
}

/**
 * Verifica se o paciente existe e não está excluído (soft delete).
 */
export async function isPatientEligible(patientId: string): Promise<{ ok: boolean; reason?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: patientId },
    select: { id: true, deletedAt: true, role: true },
  });
  if (!user) return { ok: false, reason: 'Paciente não encontrado' };
  if (user.deletedAt) return { ok: false, reason: 'Paciente inativo (excluído)' };
  return { ok: true };
}

/**
 * Retorna lista de motivos que impedem a criação de pedido.
 * Regras: paciente elegível, consentimento LGPD válido, prescrição ativa (se informada), médico ativo.
 */
export async function getOrderCreationBlockReasons(
  patientId: string,
  prescriptionId: string | null
): Promise<string[]> {
  const reasons: string[] = [];

  const patientCheck = await isPatientEligible(patientId);
  if (!patientCheck.ok) reasons.push(patientCheck.reason!);

  const hasConsent = await hasValidLgpdConsent(patientId);
  if (!hasConsent) reasons.push('Paciente sem consentimento LGPD válido (obrigatório)');

  if (prescriptionId) {
    const prescCheck = await isPrescriptionValidForOrder(prescriptionId);
    if (!prescCheck.ok) reasons.push(prescCheck.reason!);
  } else {
    // Fluxo: nada anda sem prescrição válida
    reasons.push('Pedido exige prescrição ativa vinculada');
  }

  return reasons;
}

/**
 * Indica se o pedido pode ser criado (nenhum bloqueio).
 */
export async function canCreateOrder(
  patientId: string,
  prescriptionId: string | null
): Promise<boolean> {
  const reasons = await getOrderCreationBlockReasons(patientId, prescriptionId);
  return reasons.length === 0;
}
