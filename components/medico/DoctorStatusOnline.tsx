'use client';

import { useMemo } from 'react';
import { CheckCircle2, Radio, Circle } from 'lucide-react';

interface DoctorStatusOnlineProps {
  isOnline: boolean;
  acceptsOnlineBooking: boolean;
  hasActiveAgenda: boolean;
  className?: string;
}

/**
 * Indicador de situação online do médico:
 * 🟢 Online e recebendo pacientes (online + aceita agendamento + (agenda ativa ou não exige))
 * 🟡 Online sem agenda ativa (online mas sem horários configurados esta semana)
 * 🔴 Offline
 */
export default function DoctorStatusOnline({
  isOnline,
  acceptsOnlineBooking,
  hasActiveAgenda,
  className = '',
}: DoctorStatusOnlineProps) {
  const status = useMemo(() => {
    if (!isOnline) return { label: 'Offline', color: 'red', icon: Circle };
    if (acceptsOnlineBooking && hasActiveAgenda) {
      return { label: 'Online e recebendo pacientes', color: 'green', icon: CheckCircle2 };
    }
    if (acceptsOnlineBooking && !hasActiveAgenda) {
      return { label: 'Online sem agenda ativa', color: 'amber', icon: Radio };
    }
    return { label: 'Online', color: 'green', icon: CheckCircle2 };
  }, [isOnline, acceptsOnlineBooking, hasActiveAgenda]);

  const Icon = status.icon;

  const styles = {
    green: 'bg-green-100 text-green-800 border-green-300 shadow-sm',
    amber: 'bg-amber-100 text-amber-800 border-amber-300 shadow-sm',
    red: 'bg-red-100 text-red-800 border-red-300 shadow-sm',
  };
  const dotStyles = {
    green: 'bg-green-500 animate-pulse',
    amber: 'bg-amber-500',
    red: 'bg-gray-400',
  };

  return (
    <div
      className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 font-semibold text-sm ${styles[status.color as keyof typeof styles]} ${className}`}
    >
      <span
        className={`w-3 h-3 rounded-full flex-shrink-0 ${dotStyles[status.color as keyof typeof dotStyles]}`}
      />
      <Icon size={18} className="flex-shrink-0" />
      <span>{status.label}</span>
    </div>
  );
}
