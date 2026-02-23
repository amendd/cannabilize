/**
 * IFP CANNA — Controle de acesso por role
 * Roles: ADMIN (super), FINANCE_ADMIN, FINANCE_OPERATOR, AUDITOR
 * Paciente: acesso externo limitado (apenas pagar cobrança)
 */

export const IFP_ROLES = ['ADMIN', 'FINANCE_ADMIN', 'FINANCE_OPERATOR', 'AUDITOR'] as const;
export type IfpRole = (typeof IFP_ROLES)[number];

export function canAccessIfp(role: string | undefined): boolean {
  if (!role) return false;
  return IFP_ROLES.includes(role as IfpRole);
}

export function canCreateCharge(role: string | undefined): boolean {
  return role === 'ADMIN' || role === 'FINANCE_ADMIN' || role === 'FINANCE_OPERATOR';
}

export function canCancelCharge(role: string | undefined): boolean {
  return role === 'ADMIN' || role === 'FINANCE_ADMIN';
}

export function canCancelChargeOperator(role: string | undefined): boolean {
  return role === 'ADMIN' || role === 'FINANCE_ADMIN' || role === 'FINANCE_OPERATOR';
}

export function canViewReports(role: string | undefined): boolean {
  return IFP_ROLES.includes(role as IfpRole);
}

export function canReconcile(role: string | undefined): boolean {
  return role === 'ADMIN' || role === 'FINANCE_ADMIN' || role === 'FINANCE_OPERATOR';
}

export function canEditFinancialConfig(role: string | undefined): boolean {
  return role === 'ADMIN' || role === 'FINANCE_ADMIN';
}

export function canViewAudit(role: string | undefined): boolean {
  return IFP_ROLES.includes(role as IfpRole);
}

export function isAuditorOnly(role: string | undefined): boolean {
  return role === 'AUDITOR';
}
