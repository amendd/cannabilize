'use client';

import { useAgendarModal } from './AgendarModalContext';

interface AgendarTriggerProps {
  children: React.ReactNode;
  className?: string;
  /** Patologias pré-selecionadas (ex.: vindas do PathologySelector) */
  pathologies?: string[];
  disabled?: boolean;
}

/**
 * Botão/link que abre o popup de agendamento na mesma página (sem navegar para /agendar).
 */
export default function AgendarTrigger({
  children,
  className = '',
  pathologies = [],
  disabled = false,
}: AgendarTriggerProps) {
  const { openAgendarModal } = useAgendarModal();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;
    openAgendarModal(pathologies.length > 0 ? { pathologies } : undefined);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
