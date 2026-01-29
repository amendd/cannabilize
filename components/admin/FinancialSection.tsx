'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, CreditCard, Calendar } from 'lucide-react';
import RevenueChart from './RevenueChart';
import PaymentMethodsChart from './PaymentMethodsChart';
import { SkeletonDashboard } from '@/components/ui/Skeleton';

interface FinancialStats {
  summary: {
    totalRevenue: number;
    totalPayments: number;
    averageTicket: number;
  };
  revenueChart: Array<{ period: string; revenue: number }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    total: number;
    percentage: number;
  }>;
  statusStats: Array<{
    status: string;
    count: number;
    total: number;
  }>;
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export default function FinancialSection() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [useCustomRange, setUseCustomRange] = useState(false);

  const fetchFinancialStats = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (useCustomRange && startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      } else {
        params.append('period', period);
      }

      const response = await fetch(`/api/admin/financial-stats?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas financeiras:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialStats();
  }, [period, startDate, endDate, useCustomRange]);

  const handlePeriodChange = (newPeriod: 'day' | 'month' | 'year') => {
    setUseCustomRange(false);
    setPeriod(newPeriod);
    setStartDate('');
    setEndDate('');
  };

  const handleCustomRange = () => {
    setUseCustomRange(true);
  };

  if (loading && !stats) {
    return (
      <div className="mb-8">
        <SkeletonDashboard />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
        Nenhum dado financeiro disponível
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-md p-6 mb-6"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-gray-600" />
            <span className="font-semibold text-gray-700">Período:</span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => handlePeriodChange('day')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                !useCustomRange && period === 'day'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => handlePeriodChange('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                !useCustomRange && period === 'month'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Este Mês
            </button>
            <button
              onClick={() => handlePeriodChange('year')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                !useCustomRange && period === 'year'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Este Ano
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-600">Período personalizado:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setUseCustomRange(true);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <span className="text-gray-600">até</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setUseCustomRange(true);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </motion.div>

      {/* Métricas Principais */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"
      >
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Arrecadado</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {stats.summary.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <DollarSign size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total de Pagamentos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.summary.totalPayments}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <CreditCard size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Ticket Médio</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {stats.summary.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <TrendingUp size={24} className="text-white" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <RevenueChart data={stats.revenueChart} period={stats.period} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <PaymentMethodsChart data={stats.paymentMethods} />
        </motion.div>
      </div>
    </div>
  );
}
