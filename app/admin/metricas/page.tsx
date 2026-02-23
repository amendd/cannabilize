'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Calendar,
  FileText,
  Users,
  LogIn,
  CreditCard,
  MapPin,
  TrendingUp,
  TrendingDown,
  Filter,
  BarChart3,
  Activity,
  ExternalLink,
  BarChart2,
} from 'lucide-react';
import { getConsultationStatusLabel } from '@/lib/status-labels';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import LoadingPage from '@/components/ui/Loading';

type Period = 'day' | 'week' | 'month' | 'quarter' | 'year';

interface MetricsData {
  period: string;
  dateRange: { start: string; end: string };
  consultations: {
    total: number;
    agendadas: number;
    realizadas: number;
    emAndamento: number;
    canceladas: number;
    noShow: number;
    byStatus: { status: string; count: number }[];
    chart: { period: string; agendadas: number; realizadas: number; emAndamento: number; canceladas: number; noShow: number }[];
  };
  prescriptions: {
    total: number;
    byStatus: { status: string; count: number }[];
    chart: { period: string; count: number }[];
  };
  users: {
    totalPatients: number;
    totalDoctors: number;
    newPatientsInPeriod: number;
  };
  access: {
    totalLogins: number;
    chart: { period: string; acessos: number }[];
  };
  regions: { uf: string; count: number }[];
  financial: {
    totalRevenue: number;
    paymentCount: number;
    averageTicket: number;
    chart: { period: string; valor: number }[];
  };
  percentages: {
    conversionRate: number;
    cancellationRate: number;
  };
}

const prescriptionStatusLabel: Record<string, string> = {
  ISSUED: 'Emitida',
  USED: 'Utilizada',
  EXPIRED: 'Expirada',
  CANCELLED: 'Cancelada',
};

function AcessosAnalyticsSection() {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  useEffect(() => {
    fetch('/api/config/analytics')
      .then((res) => res.json())
      .then((data) => setAnalyticsEnabled(!!data.enabled && !!data.measurementId))
      .catch(() => setAnalyticsEnabled(false));
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.38 }}
      className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200"
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-4 font-display flex items-center gap-2">
        <BarChart2 size={22} className="text-blue-600" />
        Acessos e audiência (Google Analytics)
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Sessões, visitantes, região, dispositivo e origem do tráfego são registrados pela integração com o Google Analytics.
      </p>
      {analyticsEnabled ? (
        <div className="flex flex-wrap items-center gap-4">
          <a
            href="https://analytics.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
          >
            Abrir Google Analytics
            <ExternalLink size={16} />
          </a>
          <span className="text-sm text-gray-600">
            Consulte relatórios de aquisição, engajamento e geolocalização no GA4.
          </span>
        </div>
      ) : (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          Configure a integração em <strong>Integrações → Google Analytics</strong> para ativar o rastreamento e ver métricas de acessos, regiões e dispositivos no GA4.
        </p>
      )}
    </motion.div>
  );
}

export default function AdminMetricasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MetricsData | null>(null);
  const [period, setPeriod] = useState<Period>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [useCustomRange, setUseCustomRange] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [status, session?.user?.role, router]);

  useEffect(() => {
    if (session?.user.role !== 'ADMIN') return;
    const params = new URLSearchParams();
    if (useCustomRange && startDate && endDate) {
      params.set('startDate', startDate);
      params.set('endDate', endDate);
    } else {
      params.set('period', period);
    }
    setLoading(true);
    fetch(`/api/admin/metrics?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session?.user?.role, period, startDate, endDate, useCustomRange]);

  if (status === 'loading') return <LoadingPage />;
  if (!session || session.user.role !== 'ADMIN') return null;

  const handlePeriod = (p: Period) => {
    setUseCustomRange(false);
    setPeriod(p);
    setStartDate('');
    setEndDate('');
  };

  const maxConsultationChart = data?.consultations.chart.length
    ? Math.max(
        ...data.consultations.chart.flatMap((d) => [
          d.agendadas,
          d.realizadas,
          d.emAndamento,
          d.canceladas,
          d.noShow,
        ]),
        1
      )
    : 1;
  const maxPrescriptionChart = data?.prescriptions.chart.length
    ? Math.max(...data.prescriptions.chart.map((d) => d.count), 1)
    : 1;
  const maxAccessChart = data?.access.chart.length
    ? Math.max(...data.access.chart.map((d) => d.acessos), 1)
    : 1;
  const maxRevenueChart = data?.financial.chart.length
    ? Math.max(...data.financial.chart.map((d) => d.valor), 1)
    : 1;
  const maxRegionCount = data?.regions?.length
    ? Math.max(...data.regions.map((r) => r.count), 1)
    : 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 font-display">Métricas da Plataforma</h1>
        <p className="text-gray-600 mt-2">
          Consultas, receitas, acessos, regiões e indicadores com filtros por período.
        </p>
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-600" />
            <span className="font-semibold text-gray-700">Período</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['day', 'week', 'month', 'quarter', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  !useCustomRange && period === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p === 'day' && 'Hoje'}
                {p === 'week' && 'Esta Semana'}
                {p === 'month' && 'Este Mês'}
                {p === 'quarter' && 'Trimestre'}
                {p === 'year' && 'Este Ano'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <span className="text-sm text-gray-600">Personalizado:</span>
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

      {loading && !data ? (
        <SkeletonDashboard />
      ) : !data ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
          Nenhum dado disponível para o período selecionado.
        </div>
      ) : (
        <>
          {/* KPIs principais */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8"
          >
            <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Calendar size={20} className="text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">{data.consultations.agendadas}</span>
              </div>
              <p className="text-sm text-gray-600">Consultas agendadas</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Activity size={20} className="text-green-600" />
                <span className="text-2xl font-bold text-gray-900">{data.consultations.realizadas}</span>
              </div>
              <p className="text-sm text-gray-600">Consultas realizadas</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 size={20} className="text-amber-600" />
                <span className="text-2xl font-bold text-gray-900">{data.consultations.emAndamento}</span>
              </div>
              <p className="text-sm text-gray-600">Em andamento</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <FileText size={20} className="text-purple-600" />
                <span className="text-2xl font-bold text-gray-900">{data.prescriptions.total}</span>
              </div>
              <p className="text-sm text-gray-600">Receitas emitidas</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <LogIn size={20} className="text-cyan-600" />
                <span className="text-2xl font-bold text-gray-900">{data.access.totalLogins}</span>
              </div>
              <p className="text-sm text-gray-600">Acessos (logins)</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <CreditCard size={20} className="text-emerald-600" />
                <span className="text-lg font-bold text-gray-900">
                  R$ {data.financial.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              <p className="text-sm text-gray-600">Receita no período</p>
            </div>
          </motion.div>

          {/* Percentuais e extras */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200 flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Taxa de conclusão</p>
                <p className="text-xl font-bold text-gray-900">{data.percentages.conversionRate}%</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200 flex items-center gap-4">
              <div className="bg-red-100 p-3 rounded-lg">
                <TrendingDown size={24} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Taxa de cancelamento</p>
                <p className="text-xl font-bold text-gray-900">{data.percentages.cancellationRate}%</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200 flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Novos pacientes (período)</p>
                <p className="text-xl font-bold text-gray-900">{data.users.newPatientsInPeriod}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200 flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <CreditCard size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ticket médio</p>
                <p className="text-xl font-bold text-gray-900">
                  R$ {data.financial.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Gráfico: Consultas por período */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 font-display flex items-center gap-2">
              <Calendar size={22} className="text-blue-600" />
              Consultas por período
            </h2>
            {data.consultations.chart.length === 0 ? (
              <p className="text-gray-500 py-8 text-center">Nenhum dado no período.</p>
            ) : (
              <div className="space-y-4" role="img" aria-label="Consultas por período">
                {data.consultations.chart.map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">{item.period}</span>
                      <div className="flex gap-4">
                        <span className="text-blue-600">{item.agendadas} agend.</span>
                        <span className="text-green-600">{item.realizadas} real.</span>
                        <span className="text-amber-600">{item.emAndamento} and.</span>
                        <span className="text-red-600">{item.canceladas + item.noShow} canc.</span>
                      </div>
                    </div>
                    <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden flex">
                      <div
                        className="bg-blue-500 h-full rounded-l"
                        style={{ width: `${(item.agendadas / maxConsultationChart) * 100}%` }}
                      />
                      <div
                        className="bg-green-500 h-full"
                        style={{ width: `${(item.realizadas / maxConsultationChart) * 100}%` }}
                      />
                      <div
                        className="bg-amber-500 h-full"
                        style={{ width: `${(item.emAndamento / maxConsultationChart) * 100}%` }}
                      />
                      <div
                        className="bg-red-500 h-full rounded-r"
                        style={{
                          width: `${((item.canceladas + item.noShow) / maxConsultationChart) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-4 justify-center text-sm text-gray-600">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500" /> Agendadas</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500" /> Realizadas</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500" /> Em andamento</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500" /> Canceladas / No-show</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Consultas por status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4 font-display">Consultas por status</h2>
              {data.consultations.byStatus.filter((s) => s.count > 0).length === 0 ? (
                <p className="text-gray-500 py-4">Nenhuma consulta no período.</p>
              ) : (
                <div className="space-y-3">
                  {data.consultations.byStatus
                    .filter((s) => s.count > 0)
                    .map((s) => (
                      <div key={s.status} className="flex items-center justify-between">
                        <span className="text-gray-700">{getConsultationStatusLabel(s.status)}</span>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-6 bg-gray-200 rounded overflow-hidden"
                            style={{
                              width: 120,
                              maxWidth: '100%',
                            }}
                          >
                            <div
                              className="h-full bg-blue-500 rounded"
                              style={{
                                width: `${(s.count / Math.max(...data.consultations.byStatus.map((x) => x.count), 1)) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="font-semibold text-gray-900 w-8 text-right">{s.count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </motion.div>

            {/* Receitas por período */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4 font-display flex items-center gap-2">
                <FileText size={22} className="text-purple-600" />
                Receitas por período
              </h2>
              {data.prescriptions.chart.length === 0 ? (
                <p className="text-gray-500 py-4">Nenhuma receita no período.</p>
              ) : (
                <div className="space-y-3">
                  {data.prescriptions.chart.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-4">
                      <span className="text-gray-700 font-medium w-24">{item.period}</span>
                      <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded"
                          style={{ width: `${(item.count / maxPrescriptionChart) * 100}%` }}
                        />
                      </div>
                      <span className="font-semibold text-gray-900 w-8 text-right">{item.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Acessos (logins) por período */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4 font-display flex items-center gap-2">
                <LogIn size={22} className="text-cyan-600" />
                Acessos (logins) por período
              </h2>
              {data.access.chart.length === 0 ? (
                <p className="text-gray-500 py-4">Nenhum acesso no período.</p>
              ) : (
                <div className="space-y-3">
                  {data.access.chart.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-4">
                      <span className="text-gray-700 font-medium w-24">{item.period}</span>
                      <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 rounded"
                          style={{ width: `${(item.acessos / maxAccessChart) * 100}%` }}
                        />
                      </div>
                      <span className="font-semibold text-gray-900 w-8 text-right">{item.acessos}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Receita financeira por período */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4 font-display flex items-center gap-2">
                <CreditCard size={22} className="text-emerald-600" />
                Receita por período
              </h2>
              {data.financial.chart.length === 0 ? (
                <p className="text-gray-500 py-4">Nenhum pagamento no período.</p>
              ) : (
                <div className="space-y-3">
                  {data.financial.chart.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-4">
                      <span className="text-gray-700 font-medium w-24">{item.period}</span>
                      <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded"
                          style={{ width: `${(item.valor / maxRevenueChart) * 100}%` }}
                        />
                      </div>
                      <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                        R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Pacientes por região (UF) – a partir do endereço cadastrado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 font-display flex items-center gap-2">
              <MapPin size={22} className="text-rose-600" />
              Pacientes por região (UF) – endereço cadastrado
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              UF extraída do endereço informado pelo paciente no perfil.
            </p>
            {!data.regions?.length ? (
              <p className="text-gray-500 py-4">Nenhum endereço com UF identificada.</p>
            ) : (
              <div className="space-y-3">
                {[...data.regions]
                  .sort((a, b) => b.count - a.count)
                  .map((r, index) => (
                    <div key={r.uf} className="flex items-center justify-between gap-4">
                      <span className="text-gray-700 font-medium w-28 flex items-center gap-2">
                        <span className="text-rose-600 font-bold text-sm">#{index + 1}</span>
                        {r.uf}
                      </span>
                      <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded"
                          style={{ width: `${(r.count / maxRegionCount) * 100}%` }}
                        />
                      </div>
                      <span className="font-semibold text-gray-900 w-12 text-right">{r.count} pacientes</span>
                    </div>
                  ))}
              </div>
            )}
          </motion.div>

          {/* Acessos e audiência (Google Analytics) */}
          <AcessosAnalyticsSection />

          {/* Receitas por status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 font-display">Receitas por status</h2>
            {data.prescriptions.byStatus.filter((s) => s.count > 0).length === 0 ? (
              <p className="text-gray-500 py-4">Nenhuma receita no período.</p>
            ) : (
              <div className="flex flex-wrap gap-6">
                {data.prescriptions.byStatus
                  .filter((s) => s.count > 0)
                  .map((s) => (
                    <div key={s.status} className="flex items-center gap-2">
                      <span className="text-gray-700">
                        {prescriptionStatusLabel[s.status] ?? s.status}
                      </span>
                      <span className="font-semibold text-gray-900">{s.count}</span>
                    </div>
                  ))}
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* Totais gerais (resumo) */}
      {data && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-gray-100 rounded-lg p-6 border border-gray-200"
        >
          <h2 className="text-base font-semibold text-gray-800 mb-3">Resumo geral da plataforma</h2>
          <div className="flex flex-wrap gap-6 text-sm text-gray-700">
            <span><strong>{data.users.totalPatients}</strong> pacientes cadastrados</span>
            <span><strong>{data.users.totalDoctors}</strong> médicos</span>
            <span>
              Período: {new Date(data.dateRange.start).toLocaleDateString('pt-BR')} até{' '}
              {new Date(data.dateRange.end).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
