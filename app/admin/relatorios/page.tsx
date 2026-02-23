'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Calendar,
  User,
  FileText,
  Download,
  FileDown,
  CreditCard,
  Stethoscope,
  Shield,
  ExternalLink,
} from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { canAccessAdmin, canAccessReports } from '@/lib/roles-permissions';

type TabId = 'prescricoes' | 'consultas' | 'financeiro' | 'prescritores' | 'anvisa' | 'exportacoes';

const TABS: { id: TabId; label: string; icon: typeof FileText }[] = [
  { id: 'prescricoes', label: 'Prescrições', icon: FileText },
  { id: 'consultas', label: 'Consultas', icon: Calendar },
  { id: 'financeiro', label: 'Financeiro', icon: CreditCard },
  { id: 'prescritores', label: 'Prescritores', icon: Stethoscope },
  { id: 'anvisa', label: 'ANVISA', icon: Shield },
  { id: 'exportacoes', label: 'Exportações', icon: Download },
];

function defaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default function AdminRelatoriosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<TabId>('prescricoes');
  const [period, setPeriod] = useState<string>('30');
  const [dateRange, setDateRange] = useState(defaultDateRange);
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && !canAccessAdmin(session?.user?.role)) {
      router.push('/');
      return;
    }
  }, [status, session?.user?.role, router]);

  if (status === 'loading') return <LoadingPage />;
  if (!session || !canAccessAdmin(session.user?.role)) return null;
  if (!canAccessReports(session.user?.role)) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-red-600">Sem permissão para acessar Relatórios.</p>
      </div>
    );
  }

  const handleExport = async (format: 'pdf' | 'csv') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ format });
      if (useCustomRange && dateRange.start && dateRange.end) {
        params.set('startDate', dateRange.start);
        params.set('endDate', dateRange.end);
      } else {
        params.set('period', period);
      }
      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      if (format === 'pdf' && res.status === 501) {
        alert('Exportação em PDF em desenvolvimento. Use CSV.');
        return;
      }
      if (!res.ok) throw new Error('Falha ao gerar relatório');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = useCustomRange && dateRange.start && dateRange.end
        ? `relatorio-prescricoes-${dateRange.start}-${dateRange.end}.${format === 'pdf' ? 'pdf' : 'csv'}`
        : `relatorio-prescricoes-${period}d.${format === 'pdf' ? 'pdf' : 'csv'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Erro ao exportar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Relatórios' }]} />
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
        <p className="text-slate-600 mt-1">
          Por categoria: prescrições, consultas, financeiro, prescritores, ANVISA e exportações.
        </p>
      </motion.div>

      {/* Abas */}
      <div className="flex flex-wrap gap-1 mb-6 border-b border-slate-200" role="tablist" aria-label="Categorias de relatórios">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              id={`tab-${t.id}`}
              role="tab"
            >
              <Icon size={18} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Painel Prescrições */}
      {(tab === 'prescricoes' || tab === 'exportacoes') && (
        <div id="panel-prescricoes" role="tabpanel" aria-labelledby="tab-prescricoes" className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <Calendar size={24} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Período</h2>
          </div>
          <select
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
              setUseCustomRange(false);
            }}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 bg-white"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
          <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={useCustomRange}
              onChange={(e) => setUseCustomRange(e.target.checked)}
              className="rounded border-slate-300"
            />
            Usar intervalo personalizado
          </label>
          {useCustomRange && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-500 mb-1">De</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange((r) => ({ ...r, start: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Até</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange((r) => ({ ...r, end: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
              <FileDown size={24} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Exportar</h2>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleExport('csv')}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
            >
              <Download size={18} />
              CSV
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <FileText size={18} />
              PDF
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
          <User className="text-slate-400" size={28} />
          <div>
            <p className="text-sm text-slate-600">Prescrições por período</p>
            <p className="text-xs text-slate-500">Filtro por data de emissão</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
          <FileText className="text-slate-400" size={28} />
          <div>
            <p className="text-sm text-slate-600">Prescrições por médico</p>
            <p className="text-xs text-slate-500">Agrupado por CRM / médico</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
          <BarChart3 className="text-slate-400" size={28} />
          <div>
            <p className="text-sm text-slate-600">Logs de auditoria</p>
            <p className="text-xs text-slate-500">Acessos e alterações</p>
          </div>
        </div>
      </div>
        </div>
      )}

      {/* Painéis por aba (resumo + links) */}
      {tab === 'consultas' && (
        <div id="panel-consultas" role="tabpanel" aria-labelledby="tab-consultas" className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Relatórios de Consultas</h2>
          <p className="text-slate-600 text-sm mb-4">Consultas por status, período e médico. Use as métricas para análises detalhadas.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/metricas" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 text-sm font-medium">
              <BarChart3 size={18} />
              Ver Métricas
            </Link>
            <a href="/api/admin/consultations?format=csv" download="consultas.csv" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 text-sm font-medium">
              <Download size={18} />
              Exportar consultas (CSV)
            </a>
          </div>
        </div>
      )}
      {tab === 'financeiro' && (
        <div id="panel-financeiro" role="tabpanel" aria-labelledby="tab-financeiro" className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Relatórios Financeiros</h2>
          <p className="text-slate-600 text-sm mb-4">Receita por período, ticket médio e pagamentos. Dados na página de Métricas.</p>
          <Link href="/admin/metricas" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 text-sm font-medium">
            <CreditCard size={18} />
            Ver Métricas (Financeiro)
          </Link>
        </div>
      )}
      {tab === 'prescritores' && (
        <div id="panel-prescritores" role="tabpanel" aria-labelledby="tab-prescritores" className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Prescritores (Médicos)</h2>
          <p className="text-slate-600 text-sm mb-4">Desempenho por médico: prescrições emitidas, faturamento. Exporte prescrições por período para análise por prescritor.</p>
          <button type="button" onClick={() => { setTab('exportacoes'); }} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 text-sm font-medium">
            <FileDown size={18} />
            Ir para Exportações
          </button>
        </div>
      )}
      {tab === 'anvisa' && (
        <div id="panel-anvisa" role="tabpanel" aria-labelledby="tab-anvisa" className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">ANVISA e Conformidade</h2>
          <p className="text-slate-600 text-sm mb-4">Autorizações, documentação e processos regulatórios.</p>
          <Link href="/admin/anvisa" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 text-sm font-medium">
            <Shield size={18} />
            Abrir ANVISA
            <ExternalLink size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
