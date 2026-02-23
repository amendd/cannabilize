/**
 * Roles e permissões - Plataforma de Gestão de Pacientes e Prescrições
 * Spec: Super Admin, Admin Clínica, Operador, Médico, Paciente
 */

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  SUBADMIN: 'SUBADMIN',
  OPERATOR: 'OPERATOR',
  DOCTOR: 'DOCTOR',
  PATIENT: 'PATIENT',
  AGRONOMIST: 'AGRONOMIST',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Ação permitida para um role */
export type Permission = 'create' | 'edit' | 'view' | 'delete' | 'export';

/** Quem pode acessar admin (sidebar e rotas /admin) */
export function canAccessAdmin(role: string | undefined): boolean {
  if (!role) return false;
  return [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SUBADMIN, ROLES.OPERATOR].includes(role as Role);
}

/** Apenas Admin e Super Admin (configurações sensíveis) */
export function isAdminOrSuper(role: string | undefined): boolean {
  if (!role) return false;
  return role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN;
}

/** Criar paciente: Admin, Operador, Subadmin */
export function canCreatePatient(role: string | undefined): boolean {
  if (!role) return false;
  return [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SUBADMIN, ROLES.OPERATOR].includes(role as Role);
}

/** Editar paciente: Admin (ilimitado), Operador, Subadmin (limitado - spec) */
export function canEditPatient(role: string | undefined): boolean {
  if (!role) return false;
  return [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SUBADMIN, ROLES.OPERATOR].includes(role as Role);
}

/** Criar prescrição: apenas Médico */
export function canCreatePrescription(role: string | undefined): boolean {
  if (!role) return false;
  return role === ROLES.DOCTOR;
}

/** Visualizar prescrição: Admin, Operador, Médico (todas); Paciente (apenas própria) */
export function canViewPrescription(role: string | undefined): boolean {
  if (!role) return false;
  return [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OPERATOR, ROLES.DOCTOR, ROLES.PATIENT].includes(role as Role);
}

/** Upload documento: Admin, Operador, Médico; Paciente (apenas próprio) */
export function canUploadDocument(role: string | undefined): boolean {
  if (!role) return false;
  return [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OPERATOR, ROLES.DOCTOR, ROLES.PATIENT].includes(role as Role);
}

/** Excluir dados: Ninguém (soft delete apenas) */
export function canDeleteData(role: string | undefined): boolean {
  return false;
}

/** Usuários & Permissões: apenas Admin e Super Admin (Subadmin não gerencia usuários) */
export function canManageUsers(role: string | undefined): boolean {
  if (!role) return false;
  return role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN;
}

/** Compliance & LGPD: Admin, Super Admin, Operador, Subadmin (se tiver menu) */
export function canAccessCompliance(role: string | undefined): boolean {
  if (!role) return false;
  return [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SUBADMIN, ROLES.OPERATOR].includes(role as Role);
}

/** Relatórios: Admin, Operador, Subadmin (se tiver menu) */
export function canAccessReports(role: string | undefined): boolean {
  if (!role) return false;
  return [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SUBADMIN, ROLES.OPERATOR].includes(role as Role);
}

/** Descrição do que cada perfil permite acessar (para exibir no formulário de usuários) */
export const ROLE_ACCESS_DESCRIPTIONS: Record<string, string> = {
  SUPER_ADMIN:
    'Acesso total à plataforma. Pode criar outros Super Admins, gerenciar todos os usuários e permissões, e todas as áreas do painel.',
  ADMIN:
    'Acesso completo ao painel: Dashboard, Pacientes, Prescrições, Médicos, Documentos, Relatórios, Compliance, Usuários & Permissões, Integrações e Configurações.',
  SUBADMIN:
    'Acesso ao painel admin com menus escolhidos pelo administrador. Marque abaixo quais seções este usuário pode ver.',
  OPERATOR:
    'Acesso operacional: Dashboard, Pacientes, Prescrições, Médicos, Documentos, Relatórios e Compliance. Não acessa Usuários & Permissões nem configurações sensíveis.',
  DOCTOR:
    'Acesso à área do médico: consultas, emissão de prescrições/receitas, disponibilidade e prontuários.',
  PATIENT:
    'Acesso à área do paciente: minhas consultas, receitas, documentos, pagamentos e perfil.',
  AGRONOMIST:
    'Acesso à área do engenheiro agrônomo: solicitações de análise agronômica, visualização de receitas e emissão de laudos.',
};
