/**
 * Fases do tratamento para exibição no dashboard do paciente.
 * Reduz ansiedade ao deixar claro "em que fase eu estou".
 */

export const TREATMENT_PHASES = [
  { id: 'CONSULTA_AGENDADA', label: 'Consulta agendada', order: 0 },
  { id: 'RECEITA_PENDENTE', label: 'Receita pendente', order: 1 },
  { id: 'DOCUMENTACAO_ANVISA', label: 'Documentação Anvisa', order: 2 },
  { id: 'MEDICAMENTO_ENTREGA', label: 'Medicamento em entrega', order: 3 },
] as const;

export type TreatmentPhaseId = (typeof TREATMENT_PHASES)[number]['id'];

export interface ConsultationForPhase {
  id: string;
  status: string;
  scheduledAt: string;
  prescription?: { id: string } | null;
  payment?: { status: string } | null;
}

/**
 * Determina a fase atual do tratamento com base nas consultas.
 * - CONSULTA_AGENDADA: tem próxima consulta agendada (futura, SCHEDULED).
 * - RECEITA_PENDENTE: última consulta concluída sem receita ainda.
 * - DOCUMENTACAO_ANVISA: tem receita emitida (próximo passo é documentação/Anvisa).
 * - MEDICAMENTO_ENTREGA: após documentação (futuro: quando houver Import/entrega).
 */
export function getCurrentTreatmentPhase(
  consultations: ConsultationForPhase[],
  nextConsultation: ConsultationForPhase | null
): TreatmentPhaseId {
  const now = new Date();

  if (nextConsultation) {
    const scheduled = new Date(nextConsultation.scheduledAt);
    if (scheduled > now && nextConsultation.status === 'SCHEDULED') {
      return 'CONSULTA_AGENDADA';
    }
  }

  const completed = consultations
    .filter((c) => c.status === 'COMPLETED')
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  if (completed.length > 0) {
    const lastCompleted = completed[0];
    if (!lastCompleted.prescription) {
      return 'RECEITA_PENDENTE';
    }
    return 'DOCUMENTACAO_ANVISA';
  }

  return 'CONSULTA_AGENDADA';
}

/**
 * Retorna a ordem (índice) da fase atual para exibir o stepper (qual está ativa).
 */
export function getPhaseOrder(phaseId: TreatmentPhaseId): number {
  const phase = TREATMENT_PHASES.find((p) => p.id === phaseId);
  return phase?.order ?? 0;
}

/**
 * Uma ação clara para o paciente: "o que fazer agora".
 * UX de saúde deve ser diretiva, não só informativa.
 */
export interface NextStepAction {
  id: string;
  label: string;
  description?: string;
  href: string;
  priority: number; // menor = mais importante
}

/**
 * Calcula a próxima ação mais importante para exibir no card "Próximos passos".
 */
export function getPrimaryNextStep(
  consultations: ConsultationForPhase[],
  nextConsultation: ConsultationForPhase | null,
  pendingPaymentsCount: number,
  userHasCompleteProfile: boolean
): NextStepAction | null {
  const phase = getCurrentTreatmentPhase(consultations, nextConsultation);
  const actions: NextStepAction[] = [];

  if (pendingPaymentsCount > 0) {
    actions.push({
      id: 'pagamento',
      label: 'Regularize seu pagamento',
      description: `${pendingPaymentsCount} pagamento(s) pendente(s)`,
      href: '/paciente/pagamentos',
      priority: 1,
    });
  }

  switch (phase) {
    case 'CONSULTA_AGENDADA':
      if (!userHasCompleteProfile) {
        actions.push({
          id: 'completar-dados',
          label: 'Complete seus dados antes da consulta',
          description: 'Perfil e documentos ajudam o médico',
          href: '/paciente/perfil',
          priority: 2,
        });
      }
      actions.push({
        id: 'confirmar-presenca',
        label: 'Confirme sua presença',
        description: 'Veja detalhes e link da reunião',
        href: nextConsultation ? `/paciente/consultas/${nextConsultation.id}` : '/paciente/consultas',
        priority: 3,
      });
      break;
    case 'RECEITA_PENDENTE':
      actions.push({
        id: 'aguardar-receita',
        label: 'Aguardar emissão da receita',
        description: 'O médico emite em até 24h após a consulta',
        href: '/paciente/receitas',
        priority: 2,
      });
      break;
    case 'DOCUMENTACAO_ANVISA':
      actions.push({
        id: 'documentacao-anvisa',
        label: 'Envie seus documentos',
        description: 'Documentação para autorização Anvisa',
        href: '/paciente/documentos',
        priority: 2,
      });
      actions.push({
        id: 'ver-receita',
        label: 'Ver receita e dosagem',
        href: '/paciente/receitas',
        priority: 3,
      });
      break;
    case 'MEDICAMENTO_ENTREGA':
      actions.push({
        id: 'acompanhar-entrega',
        label: 'Acompanhar entrega',
        href: '/paciente/consultas',
        priority: 2,
      });
      break;
  }

  if (actions.length === 0) {
    return {
      id: 'proximos-passos',
      label: 'Ver o que fazer na sua jornada',
      href: '/paciente/proximos-passos',
      priority: 10,
    };
  }

  actions.sort((a, b) => a.priority - b.priority);
  return actions[0];
}

/** Estado de cada fase para o Hero: concluída, atual ou próxima */
export type PhaseStepState = 'done' | 'current' | 'next' | 'upcoming';

export interface PhaseStepDisplay {
  id: TreatmentPhaseId;
  label: string;
  state: PhaseStepState;
}

/**
 * Retorna as fases para exibição no Hero: quais concluídas, qual atual, qual próxima.
 */
export function getTreatmentPhaseSteps(
  currentPhase: TreatmentPhaseId
): PhaseStepDisplay[] {
  const order = getPhaseOrder(currentPhase);
  return TREATMENT_PHASES.map((p, i) => {
    let state: PhaseStepState = 'upcoming';
    if (i < order) state = 'done';
    else if (i === order) state = 'current';
    else if (i === order + 1) state = 'next';
    return { id: p.id, label: p.label, state };
  });
}

/** Dados mínimos da consulta para decidir o botão de ação */
export interface ConsultationForAction {
  id: string;
  status: string;
  scheduledAt: string;
  meetingLink?: string | null;
  prescription?: { id: string } | null;
}

const MINUTES_BEFORE_OPEN = 10;

/**
 * Define o rótulo e destino do botão principal da consulta (jornada guiada).
 * - Agendada, faltando >10min: "Entrar na consulta" (detalhes)
 * - Agendada, ≤10min: "Abrir sala"
 * - Concluída com receita: "Ver receita" ou "Continuar tratamento"
 * - Concluída sem receita: "Ver detalhes"
 */
export function getConsultationActionButton(
  consultation: ConsultationForAction
): { label: string; href: string; primary?: boolean } {
  const now = new Date();
  const scheduled = new Date(consultation.scheduledAt);
  const minutesUntil = (scheduled.getTime() - now.getTime()) / (60 * 1000);

  if (consultation.status === 'SCHEDULED' && scheduled > now) {
    if (consultation.meetingLink && minutesUntil <= MINUTES_BEFORE_OPEN) {
      return { label: 'Abrir sala', href: consultation.meetingLink, primary: true };
    }
    return { label: 'Entrar na consulta', href: `/paciente/consultas/${consultation.id}`, primary: true };
  }

  if (consultation.status === 'COMPLETED' && consultation.prescription) {
    return { label: 'Ver receita', href: '/paciente/receitas', primary: true };
  }

  if (consultation.status === 'COMPLETED') {
    return { label: 'Ver detalhes', href: `/paciente/consultas/${consultation.id}` };
  }

  return { label: 'Ver detalhes', href: `/paciente/consultas/${consultation.id}` };
}
