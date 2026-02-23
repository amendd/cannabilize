'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Video,
  FileText,
  Calendar,
  CalendarClock,
  User,
  DollarSign,
  Stethoscope,
  RefreshCw,
} from 'lucide-react';

export interface ActionCenterData {
  consultationsStartingNow: number;
  consultationsNext30_60: number;
  pendingPrescriptions: number;
  patientsAwaitingReturn: number;
  earningsPredictedToday: number;
  earningsPredictedWeek: number;
  earningsPredictedMonth: number;
  weeklyAgendaLoad: { totalSlots: number; occupiedSlots: number; percent: number };
  startingNowList: { id: string; patientName: string; scheduledTime: string }[];
  next30_60List: { id: string; patientName: string; scheduledTime: string }[];
  atencaoClinica: {
    noReturn30Days: { patientId: string; patientName: string; lastConsultation: string }[];
    prescriptionsExpiringSoon: { id: string; patientId: string; patientName: string; expiresAt: string }[];
  };
  doctorProfile: { isOnline: boolean; acceptsOnlineBooking: boolean; hasActiveAgenda: boolean };
}

const defaultData: ActionCenterData = {
  consultationsStartingNow: 0,
  consultationsNext30_60: 0,
  pendingPrescriptions: 0,
  patientsAwaitingReturn: 0,
  earningsPredictedToday: 0,
  earningsPredictedWeek: 0,
  earningsPredictedMonth: 0,
  weeklyAgendaLoad: { totalSlots: 0, occupiedSlots: 0, percent: 0 },
  startingNowList: [],
  next30_60List: [],
  atencaoClinica: { noReturn30Days: [], prescriptionsExpiringSoon: [] },
  doctorProfile: { isOnline: false, acceptsOnlineBooking: false, hasActiveAgenda: false },
};

interface CentralDeAcaoMedicoProps {
  doctorId?: string | null;
  onStartConsultation?: (consultationId: string) => void;
  /** Chamado quando há dados carregados (para uso no dashboard) */
  onDataLoaded?: (data: ActionCenterData) => void;
}

export default function CentralDeAcaoMedico({
  doctorId,
  onStartConsultation,
  onDataLoaded,
}: CentralDeAcaoMedicoProps) {
  const [data, setData] = useState<ActionCenterData>(defaultData);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    const url = doctorId
      ? `/api/medico/action-center?doctorId=${encodeURIComponent(doctorId)}`
      : '/api/medico/action-center';
    fetch(url)
      .then((res) => (res.ok ? res.json() : defaultData))
      .then((d) => {
        setData(d);
        onDataLoaded?.(d);
      })
      .catch(() => setData(defaultData))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [doctorId]);

  if (loading) {
    return (
      <div className="rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-white p-6 sm:p-8 shadow-lg animate-pulse">
        <div className="h-8 w-64 bg-green-100 rounded mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-green-100/60 rounded-xl" />
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <div className="h-10 w-36 bg-green-100 rounded-lg" />
          <div className="h-10 w-32 bg-green-100 rounded-lg" />
          <div className="h-10 w-28 bg-green-100 rounded-lg" />
        </div>
      </div>
    );
  }

  const {
    consultationsStartingNow,
    consultationsNext30_60,
    pendingPrescriptions,
    patientsAwaitingReturn,
    earningsPredictedToday,
    weeklyAgendaLoad,
    startingNowList,
    doctorProfile,
  } = data;

  const hasAnyAction =
    consultationsStartingNow > 0 ||
    consultationsNext30_60 > 0 ||
    pendingPrescriptions > 0;

  return (
    <div className="rounded-2xl border-2 border-green-300 bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6 sm:p-8 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-600 text-white shadow-md">
            <Stethoscope size={26} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Situação clínica atual
            </h2>
            <p className="text-sm text-gray-600 mt-0.5">
              O que precisa da sua atenção agora
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={fetchData}
          className="p-2 rounded-lg text-gray-500 hover:bg-green-100 hover:text-green-700 transition-colors"
          title="Atualizar"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="mb-6">
        <p className="text-base font-semibold text-gray-800 mb-4">
          Você possui hoje:
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <li className="flex items-center gap-3 rounded-xl bg-white/80 border border-green-200 p-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Video size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {consultationsStartingNow}
              </p>
              <p className="text-sm text-gray-600">
                consulta(s) aguardando início
              </p>
            </div>
          </li>
          <li className="flex items-center gap-3 rounded-xl bg-white/80 border border-green-200 p-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {consultationsNext30_60}
              </p>
              <p className="text-sm text-gray-600">
                consulta(s) nas próximas 30 min
              </p>
            </div>
          </li>
          <li className="flex items-center gap-3 rounded-xl bg-white/80 border border-green-200 p-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {pendingPrescriptions}
              </p>
              <p className="text-sm text-gray-600">receita(s) pendente(s)</p>
            </div>
          </li>
          <li className="flex items-center gap-3 rounded-xl bg-white/80 border border-green-200 p-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
              <User size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {patientsAwaitingReturn}
              </p>
              <p className="text-sm text-gray-600">
                paciente(s) aguardando retorno
              </p>
            </div>
          </li>
        </ul>
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/80 border border-green-200 p-4 shadow-sm max-w-md">
          <DollarSign size={24} className="text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-600">Ganhos previstos hoje</p>
            <p className="text-xl font-bold text-gray-900">
              R${' '}
              {earningsPredictedToday.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-green-200">
        <Link
          href="/medico/consultas"
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-green-700 transition-colors"
        >
          <Video size={18} />
          Iniciar consulta
        </Link>
        <Link
          href="/medico/receitas"
          className="inline-flex items-center gap-2 rounded-lg border-2 border-green-600 bg-white px-4 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-50 transition-colors"
        >
          <FileText size={18} />
          Emitir receita
        </Link>
        <Link
          href="/medico/consultas"
          className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <CalendarClock size={18} />
          Ver agenda
        </Link>
      </div>

      {weeklyAgendaLoad.totalSlots > 0 && (
        <div className="mt-6 pt-4 border-t border-green-200">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Carga semanal da agenda
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, data.weeklyAgendaLoad.percent)}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
              {data.weeklyAgendaLoad.percent}% ocupada
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
