/**
 * IDs e labels dos grupos do menu admin.
 * Usado no formulário de Subadmin (checkboxes) e no AdminLayout para filtrar por permissão.
 */
export const ADMIN_MENU_GROUPS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'pacientes', label: 'Pacientes' },
  { id: 'prescricoes', label: 'Prescrições' },
  { id: 'medicos', label: 'Médicos' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'relatorios', label: 'Relatórios' },
  { id: 'compliance', label: 'Compliance & LGPD' },
  { id: 'usuarios', label: 'Usuários & Permissões' },
  { id: 'integracoes', label: 'Integrações' },
  { id: 'configuracoes', label: 'Configurações' },
] as const;

export type AdminMenuGroupId = (typeof ADMIN_MENU_GROUPS)[number]['id'];

export const ADMIN_MENU_GROUP_IDS = ADMIN_MENU_GROUPS.map((g) => g.id);

export function parseAdminMenuPermissions(json: string | null): string[] {
  if (!json || json.trim() === '') return [];
  try {
    const arr = JSON.parse(json) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter((x): x is string => typeof x === 'string' && ADMIN_MENU_GROUP_IDS.includes(x));
  } catch {
    return [];
  }
}

export function stringifyAdminMenuPermissions(ids: string[]): string {
  const valid = ids.filter((id) => ADMIN_MENU_GROUP_IDS.includes(id));
  return JSON.stringify(valid);
}
