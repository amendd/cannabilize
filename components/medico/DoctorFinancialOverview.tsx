'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, DollarSign, TrendingUp, Wallet, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

interface SummaryResponse {
  doctorId: string;
  period: 'day' | 'month' | 'year' | 'custom';
  dateRange: {
    start: string;
    end: string;
  };
  totals: {
    earned: number;
    paidOut: number;
    available: number;
    requested: number;
    processing: number;
    consultationsPaidCount: number;
  };
  charts: {
    earningsByPeriod: Array<{ period: string; amount: number }>;
  };
}

export default function DoctorFinancialOverview() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('month');
  const [summary, setSummary] = useState<SummaryResponse | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('period', period);
      const res = await fetch(`/api/medico/financeiro/summary?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Erro ao carregar resumo financeiro');
      }
      const data = (await res.json()) as SummaryResponse;
      setSummary(data);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar resumo financeiro');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSummary();
  }, [period]);

  const periodLabel = useMemo(() => {
    if (!summary) return '';
    const start = new Date(summary.dateRange.start).toLocaleDateString('pt-BR');
    const end = new Date(summary.dateRange.end).toLocaleDateString('pt-BR');
    return `${start} — ${end}`;
  }, [summary]);

  if (loading && !summary) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-sm text-gray-500">Carregando informações financeiras...</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-sm text-gray-500">Nenhuma informação financeira disponível.</p>
      </div>
    );
  }

  const { totals, charts } = summary;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Filtros simples */}
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Período:</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPeriod('day')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              period === 'day' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => setPeriod('month')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              period === 'month' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Este mês
          </button>
          <button
            type="button"
            onClick={() => setPeriod('year')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              period === 'year' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Este ano
          </button>
        </div>
        <span className="ml-auto text-xs text-gray-500">{periodLabel}</span>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border rounded-lg p-4 bg-green-50 border-green-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total recebido no período</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                R$ {totals.earned.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-green-500 p-3 rounded-full">
              <DollarSign size={20} className="text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border rounded-lg p-4 bg-blue-50 border-blue-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Disponível para saque</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                R$ {totals.available.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-blue-500 p-3 rounded-full">
              <Wallet size={20} className="text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border rounded-lg p-4 bg-yellow-50 border-yellow-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Repasses solicitados</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                R$ {totals.requested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-full">
              <CreditCard size={20} className="text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border rounded-lg p-4 bg-purple-50 border-purple-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Consultas pagas no período</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{totals.consultationsPaidCount}</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-full">
              <TrendingUp size={20} className="text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Gráfico simples (earningsByPeriod como barras horizontais) */}
      {charts.earningsByPeriod.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            Evolução dos ganhos
          </h3>
          <div className="space-y-2">
            {charts.earningsByPeriod.map((item) => (
              <div key={item.period} className="flex items-center gap-3 text-xs">
                <div className="w-20 text-gray-600">{item.period}</div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-primary rounded-full"
                    style={{
                      width: `${Math.min(100, (item.amount / (totals.earned || 1)) * 100)}%`,
                    }}
                  />
                </div>
                <div className="w-24 text-right text-gray-700">
                  R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

