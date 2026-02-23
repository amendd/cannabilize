'use client';

import { Check, Clock, Package, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  getCurrentTreatmentPhase,
  getTreatmentPhaseSteps,
  getPrimaryNextStep,
  type ConsultationForPhase,
  type NextStepAction,
} from '@/lib/patient-treatment-status';
import { formatDisplayName } from '@/lib/format-display-name';

interface TreatmentStatusHeroProps {
  consultations: ConsultationForPhase[];
  nextConsultation: ConsultationForPhase | null;
  pendingPaymentsCount: number;
  userHasCompleteProfile?: boolean;
  /** Nome do paciente para saudação opcional */
  patientName?: string;
}

export default function TreatmentStatusHero({
  consultations,
  nextConsultation,
  pendingPaymentsCount,
  userHasCompleteProfile = true,
  patientName,
}: TreatmentStatusHeroProps) {
  const currentPhase = getCurrentTreatmentPhase(consultations, nextConsultation);
  const steps = getTreatmentPhaseSteps(currentPhase);
  const displayFirstName = formatDisplayName(patientName).split(' ')[0];
  const primaryNextStep = getPrimaryNextStep(
    consultations,
    nextConsultation,
    pendingPaymentsCount,
    userHasCompleteProfile
  );

  const getStepIcon = (state: string) => {
    if (state === 'done') return <Check className="w-5 h-5 text-white" />;
    if (state === 'current') return <Clock className="w-5 h-5 text-white" />;
    return <Package className="w-5 h-5 text-white/80" />;
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-gradient-to-br from-purple-600 via-purple-700 to-blue-800 rounded-2xl shadow-xl overflow-hidden"
    >
      <div className="relative px-6 py-8 sm:px-8 sm:py-10">
        <div className="relative z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
            {displayFirstName ? `Olá, ${displayFirstName}` : 'Seu tratamento'}
          </h2>
          <p className="text-purple-100 text-sm sm:text-base mb-6">
            Status do seu acompanhamento médico
          </p>

          {/* Etapas: concluídas, atual, próximo passo */}
          <ul className="space-y-3 mb-8">
            {steps.map((step, index) => (
              <motion.li
                key={step.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                className="flex items-center gap-3"
              >
                <span
                  className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                    step.state === 'done'
                      ? 'bg-emerald-500'
                      : step.state === 'current'
                      ? 'bg-white/20 ring-2 ring-white/40'
                      : 'bg-white/10'
                  }`}
                >
                  {getStepIcon(step.state)}
                </span>
                <span
                  className={
                    step.state === 'current'
                      ? 'font-semibold text-white'
                      : step.state === 'done'
                      ? 'text-white/90'
                      : 'text-white/70'
                  }
                >
                  {step.state === 'done' && '✔ '}
                  {step.state === 'current' && '⏳ '}
                  {step.state === 'next' && '📦 '}
                  {step.label}
                </span>
              </motion.li>
            ))}
          </ul>

          {/* Próximo passo do seu tratamento — botão dinâmico único */}
          <div className="pt-4 border-t border-white/20">
            <p className="text-white/90 text-sm font-medium mb-3">
              Próximo passo do seu tratamento
            </p>
            {primaryNextStep ? (
              <Link
                href={primaryNextStep.href}
                className="inline-flex items-center gap-2 bg-white text-purple-700 px-5 py-3 rounded-xl font-semibold hover:bg-purple-50 transition shadow-lg"
              >
                {getActionLabel(primaryNextStep)}
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <p className="text-white/80 text-sm">
                Nenhuma ação pendente no momento.
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function getActionLabel(action: NextStepAction): string {
  if (action.id === 'pagamento') return 'Finalizar pagamento';
  if (action.id === 'confirmar-presenca' || action.id === 'entrar-consulta') return 'Entrar na consulta';
  if (action.id === 'documentacao-anvisa') return 'Enviar documentos';
  if (action.id === 'aguardar-receita') return 'Acompanhar receita';
  if (action.id === 'ver-receita') return 'Visualizar receita';
  if (action.id === 'acompanhar-entrega') return 'Acompanhar importação';
  if (action.id === 'completar-dados') return 'Completar meus dados';
  return action.label;
}
