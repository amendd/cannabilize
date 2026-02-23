'use client';

import { useState, useEffect, useMemo } from 'react';
import { Clock, User, Calendar } from 'lucide-react';
import Link from 'next/link';

interface ConsultationBase {
  id: string;
  scheduledAt: string;
  scheduledDate?: string;
  scheduledTime?: string;
  status: string;
  patient: { name: string; email?: string };
}

function getNextConsultationDateTime(c: ConsultationBase): Date | null {
  const date = c.scheduledDate || new Date(c.scheduledAt).toISOString().split('T')[0];
  const time = c.scheduledTime || new Date(c.scheduledAt).toTimeString().slice(0, 5);
  return new Date(`${date}T${time}`);
}

function formatTimeUntil(target: Date, now: Date): { hours: number; minutes: number; totalMs: number } {
  const totalMs = Math.max(0, target.getTime() - now.getTime());
  const totalMinutes = Math.floor(totalMs / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes, totalMs };
}

function formatCountdownText(hours: number, minutes: number): string {
  if (hours === 0 && minutes === 0) return 'agora';
  if (hours === 0) return minutes === 1 ? '1 minuto' : `${minutes} minutos`;
  const h = hours === 1 ? '1 hora' : `${hours} horas`;
  if (minutes === 0) return h;
  const m = minutes === 1 ? '1 minuto' : `${minutes} minutos`;
  return `${h} e ${m}`;
}

interface NextAppointmentCountdownProps {
  consultations: ConsultationBase[];
  /** Se true, mostra link "Ver detalhes" para a próxima consulta */
  showLink?: boolean;
  className?: string;
}

export default function NextAppointmentCountdown({
  consultations,
  showLink = true,
  className = '',
}: NextAppointmentCountdownProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const nextConsultation = useMemo(() => {
    const nowDate = now;
    const future = consultations
      .filter((c) => c.status === 'SCHEDULED' || c.status === 'IN_PROGRESS')
      .map((c) => ({ c, dt: getNextConsultationDateTime(c) }))
      .filter(({ dt }) => dt && dt > nowDate) as { c: ConsultationBase; dt: Date }[];
    future.sort((a, b) => a.dt.getTime() - b.dt.getTime());
    return future[0] ?? null;
  }, [consultations, now]);

  if (!nextConsultation) {
    return (
      <div
        className={`rounded-lg border border-gray-200 bg-gray-50 p-4 text-gray-600 ${className}`}
      >
        <div className="flex items-center gap-2">
          <Clock size={20} className="text-gray-400" />
          <span className="text-sm font-medium">Nenhum próximo atendimento agendado</span>
        </div>
      </div>
    );
  }

  const { c, dt } = nextConsultation;
  const { hours, minutes, totalMs } = formatTimeUntil(dt, now);
  const countdownText = formatCountdownText(hours, minutes);
  const isSoon = totalMs < 30 * 60 * 1000; // menos de 30 min

  return (
    <div
      className={`rounded-lg border-2 p-4 ${
        isSoon
          ? 'border-green-300 bg-green-50'
          : 'border-green-200 bg-white'
      } ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              isSoon ? 'bg-green-500 text-white' : 'bg-green-100 text-green-600'
            }`}
          >
            <Clock size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">Próximo atendimento</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              Faltam {countdownText}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <User size={16} className="text-green-600" />
                {c.patient.name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={16} className="text-green-600" />
                {dt.toLocaleDateString('pt-BR')} às {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
        {showLink && (
          <Link
            href={`/medico/consultas/${c.id}`}
            className="rounded-lg border border-green-300 bg-white px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
          >
            Ver detalhes
          </Link>
        )}
      </div>
    </div>
  );
}
