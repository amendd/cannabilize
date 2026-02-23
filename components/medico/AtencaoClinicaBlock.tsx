'use client';

import Link from 'next/link';
import { AlertTriangle, User, FileText, RotateCcw } from 'lucide-react';

interface AtencaoClinicaBlockProps {
  noReturn30Days: { patientId: string; patientName: string; lastConsultation: string }[];
  prescriptionsExpiringSoon: {
    id: string;
    patientId: string;
    patientName: string;
    expiresAt: string;
  }[];
  loading?: boolean;
}

export default function AtencaoClinicaBlock({
  noReturn30Days,
  prescriptionsExpiringSoon,
  loading = false,
}: AtencaoClinicaBlockProps) {
  const hasItems = noReturn30Days.length > 0 || prescriptionsExpiringSoon.length > 0;

  if (loading) {
    return (
      <div className="bg-amber-50/80 border-2 border-amber-200 rounded-xl p-6">
        <div className="h-6 w-56 bg-amber-100 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-10 bg-amber-100/60 rounded" />
          <div className="h-10 bg-amber-100/60 rounded" />
        </div>
      </div>
    );
  }

  if (!hasItems) return null;

  return (
    <div className="bg-amber-50/80 border-2 border-amber-200 rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
        <AlertTriangle className="text-amber-600" size={22} />
        Pacientes que precisam de atenção
      </h2>

      <div className="space-y-4">
        {noReturn30Days.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Sem retorno há mais de 30 dias
            </p>
            <ul className="space-y-2">
              {noReturn30Days.slice(0, 8).map((p) => (
                <li
                  key={p.patientId}
                  className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-white border border-amber-100"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <User size={16} className="text-amber-600 flex-shrink-0" />
                    <span className="text-gray-800 truncate">{p.patientName}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      Última: {new Date(p.lastConsultation).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <Link
                    href={`/medico/pacientes?reativar=${p.patientId}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-2.5 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-200 transition-colors flex-shrink-0"
                  >
                    <RotateCcw size={14} />
                    Reativar paciente
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {prescriptionsExpiringSoon.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Receitas próximas do vencimento
            </p>
            <ul className="space-y-2">
              {prescriptionsExpiringSoon.slice(0, 8).map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-white border border-amber-100"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={16} className="text-amber-600 flex-shrink-0" />
                    <span className="text-gray-800 truncate">{p.patientName}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      Vence: {new Date(p.expiresAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <Link
                    href={`/medico/receitas`}
                    className="text-xs font-medium text-amber-700 hover:underline flex-shrink-0"
                  >
                    Ver receitas
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
