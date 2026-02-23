'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Calendar, User, Eye, LayoutGrid, List, ChevronUp, ChevronDown } from 'lucide-react';
import { getConsultationStatusLabel } from '@/lib/status-labels';

type SortKey = 'patient' | 'scheduledAt' | 'status';
type SortDir = 'asc' | 'desc';

const KANBAN_COLUMNS: { status: string; label: string; bg: string; border: string }[] = [
  { status: 'SCHEDULED', label: 'Agendada', bg: 'bg-blue-50', border: 'border-blue-200' },
  { status: 'IN_PROGRESS', label: 'Em andamento', bg: 'bg-amber-50', border: 'border-amber-200' },
  { status: 'COMPLETED', label: 'Concluída', bg: 'bg-green-50', border: 'border-green-200' },
  { status: 'CANCELLED', label: 'Cancelada', bg: 'bg-red-50', border: 'border-red-200' },
  { status: 'NO_SHOW', label: 'Não compareceu', bg: 'bg-orange-50', border: 'border-orange-200' },
];

interface ConsultationsTableProps {
  filters: {
    status: string;
    dateFrom: string;
    dateTo: string;
  };
  viewMode?: 'list' | 'kanban';
}

export default function ConsultationsTable({ filters, viewMode = 'list' }: ConsultationsTableProps) {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>('scheduledAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);

    fetch(`/api/admin/consultations?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setConsultations(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filters]);

  const sortedConsultations = useMemo(() => {
    const arr = [...consultations];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'patient') {
        const na = (a.patient?.name || '').toLowerCase();
        const nb = (b.patient?.name || '').toLowerCase();
        cmp = na.localeCompare(nb);
      } else if (sortBy === 'scheduledAt') {
        cmp = new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
      } else if (sortBy === 'status') {
        cmp = (a.status || '').localeCompare(b.status || '');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [consultations, sortBy, sortDir]);

  const byStatus = useMemo(() => consultations.reduce<Record<string, any[]>>((acc, c) => {
    const s = c.status || 'SCHEDULED';
    if (!acc[s]) acc[s] = [];
    acc[s].push(c);
    return acc;
  }, {}), [consultations]);

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Carregando...</div>;
  }

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(key);
      setSortDir(key === 'scheduledAt' ? 'desc' : 'asc');
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const formatMoney = (v: number | undefined) => (v != null ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—');

  if (viewMode === 'kanban') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => {
          const items = byStatus[col.status] || [];
          const totalValue = items.reduce((sum, c) => sum + (c.payment?.amount ?? 0), 0);
          return (
            <div
              key={col.status}
              className={`rounded-xl border-2 ${col.border} ${col.bg} min-w-[240px] flex flex-col max-h-[70vh] overflow-hidden`}
            >
              <div className="px-4 py-3 border-b border-gray-200/80 flex items-center justify-between flex-shrink-0">
                <span className="font-semibold text-gray-800">{col.label}</span>
                <span className="text-xs font-medium text-gray-600 bg-white/80 px-2 py-0.5 rounded">
                  {items.length}
                </span>
              </div>
              {totalValue > 0 && (
                <div className="px-4 py-1 text-xs font-medium text-green-700 flex-shrink-0">
                  {formatMoney(totalValue)}
                </div>
              )}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {items.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4 text-center">Nenhuma</p>
                ) : (
                  items.map((c) => (
                    <Link
                      key={c.id}
                      href={`/admin/consultas/${c.id}`}
                      className="block bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow hover:border-gray-300 transition"
                    >
                      <div className="text-sm font-medium text-gray-900 truncate">
                        #{String(c.id).slice(0, 8)} {c.patient?.name || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {formatDate(c.scheduledAt)} · {formatTime(c.scheduledAt)}
                      </div>
                      {c.payment?.amount != null && (
                        <div className="text-xs text-green-700 font-medium mt-1">
                          {formatMoney(c.payment.amount)}
                        </div>
                      )}
                      <div className="mt-2 flex justify-end">
                        <span className="text-xs text-primary flex items-center gap-0.5">
                          <Eye size={12} /> Ver
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const Th = ({ colKey, label }: { colKey: SortKey; label: string }) => (
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      <button
        type="button"
        onClick={() => toggleSort(colKey)}
        className="inline-flex items-center gap-1 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 rounded"
        aria-label={`Ordenar por ${label} ${sortBy === colKey ? (sortDir === 'asc' ? 'crescente' : 'decrescente') : ''}`}
      >
        {label}
        {sortBy === colKey ? (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : null}
      </button>
    </th>
  );

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <Th colKey="patient" label="Paciente" />
              <Th colKey="scheduledAt" label="Data/Hora" />
              <Th colKey="status" label="Status" />
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Receita
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedConsultations.map((consultation) => (
              <tr key={consultation.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User size={16} className="text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {consultation.patient?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {consultation.patient?.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Calendar size={16} className="text-gray-400 mr-2" />
                    <div className="text-sm text-gray-900">
                      {new Date(consultation.scheduledAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(consultation.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    consultation.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    consultation.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                    consultation.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' :
                    consultation.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                    consultation.status === 'NO_SHOW' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getConsultationStatusLabel(consultation.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {consultation.prescription ? (
                    <span className="text-green-600 font-semibold">Emitida</span>
                  ) : (
                    <span className="text-gray-400">Pendente</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link
                    href={`/admin/consultas/${consultation.id}`}
                    className="text-primary hover:text-primary-dark flex items-center gap-1"
                  >
                    <Eye size={16} />
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
