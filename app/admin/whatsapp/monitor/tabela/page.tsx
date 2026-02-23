'use client';

import { useEffect, useState, useCallback, Fragment } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Settings,
  FileText,
  Inbox,
  GitBranch,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Activity,
  CheckCircle2,
  XCircle,
  MinusCircle,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { SkeletonDashboard } from '@/components/ui/Skeleton';

interface WebhookLogRow {
  id: string;
  type: string;
  phone: string | null;
  fromMe: boolean;
  hasText: boolean;
  result: string;
  detail: string;
  payloadPreview: string | null;
  createdAt: string;
}

interface Stats {
  todayProcessed: number;
  todayIgnored: number;
  todayErrors: number;
  todayTotal: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const RESULT_LABELS: Record<string, { label: string; icon: typeof CheckCircle2; bg: string; text: string }> = {
  processed: { label: 'Processadas', icon: CheckCircle2, bg: 'bg-emerald-100', text: 'text-emerald-800' },
  ignored: { label: 'Ignoradas', icon: MinusCircle, bg: 'bg-slate-100', text: 'text-slate-700' },
  error: { label: 'Erros', icon: XCircle, bg: 'bg-red-100', text: 'text-red-800' },
};

export default function MonitorTabelaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<WebhookLogRow[]>([]);
  const [stats, setStats] = useState<Stats>({ todayProcessed: 0, todayIgnored: 0, todayErrors: 0, todayTotal: 0 });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 30, total: 0, totalPages: 0 });
  const [filterResult, setFilterResult] = useState('');
  const [filterPhone, setFilterPhone] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hideIgnoredCallbacks, setHideIgnoredCallbacks] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(pagination.page));
      params.set('limit', String(pagination.limit));
      if (filterResult) params.set('result', filterResult);
      if (filterPhone) params.set('phone', filterPhone);
      if (filterFromDate) params.set('fromDate', filterFromDate);
      if (filterToDate) params.set('toDate', filterToDate);
      const res = await fetch(`/api/admin/whatsapp/webhook-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setPagination((prev) => ({ ...prev, ...data.pagination }));
        setStats(data.stats || stats);
      } else toast.error('Erro ao carregar logs');
    } catch (e) {
      toast.error('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filterResult, filterPhone, filterFromDate, filterToDate]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    else if (status === 'authenticated' && session?.user.role !== 'ADMIN') router.push('/');
    else if (status === 'authenticated' && session?.user.role === 'ADMIN') loadData();
  }, [status, session?.user?.role, pagination.page]);

  useEffect(() => {
    if (!autoRefresh || status !== 'authenticated' || session?.user.role !== 'ADMIN') return;
    const t = setInterval(() => loadData(), 15000);
    return () => clearInterval(t);
  }, [autoRefresh, status, session?.user?.role, loadData]);

  const displayLogs = hideIgnoredCallbacks ? logs.filter((l) => l.result !== 'ignored') : logs;

  if (status === 'loading' || (status === 'authenticated' && loading && logs.length === 0)) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'WhatsApp', href: '/admin/whatsapp' },
            { label: 'Monitor Z-API', href: '/admin/whatsapp/monitor' },
            { label: 'Tabela', href: '/admin/whatsapp/monitor/tabela' },
          ]}
        />
        <div className="flex items-center gap-4 mt-4 mb-6">
          <Link
            href="/admin/whatsapp/monitor"
            className="flex items-center gap-2 text-primary hover:underline"
          >
            <ArrowLeft size={20} />
            Voltar ao monitor (visual)
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resultado</label>
              <select
                value={filterResult}
                onChange={(e) => setFilterResult(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-40"
              >
                <option value="">Todos</option>
                {Object.entries(RESULT_LABELS).map(([v, { label }]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
              <Input value={filterPhone} onChange={(e) => setFilterPhone(e.target.value)} placeholder="55..." className="w-40" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">De</label>
              <Input type="date" value={filterFromDate} onChange={(e) => setFilterFromDate(e.target.value)} className="w-40" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Até</label>
              <Input type="date" value={filterToDate} onChange={(e) => setFilterToDate(e.target.value)} className="w-40" />
            </div>
            <Button onClick={() => { setPagination((p) => ({ ...p, page: 1 })); loadData(); }} className="flex items-center gap-2">
              <Search size={16} /> Filtrar
            </Button>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={hideIgnoredCallbacks} onChange={(e) => setHideIgnoredCallbacks(e.target.checked)} className="rounded border-gray-300 text-primary" />
              Ocultar callbacks ignorados
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer ml-auto">
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="rounded border-gray-300 text-primary" />
              Atualizar a cada 15s
            </label>
            <Button variant="outline" size="sm" onClick={() => loadData()} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Atualizar
            </Button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resultado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalhe</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                      <AlertCircle className="mx-auto mb-2 text-gray-400" size={32} />
                      <p>{logs.length === 0 ? 'Nenhum evento ainda.' : 'Nenhum evento útil. Desmarque "Ocultar callbacks ignorados" para ver todos.'}</p>
                    </td>
                  </tr>
                ) : (
                  displayLogs.map((log) => {
                    const res = RESULT_LABELS[log.result] || { label: log.result, icon: AlertCircle, bg: 'bg-gray-100', text: 'text-gray-800' };
                    const Icon = res.icon;
                    return (
                      <Fragment key={log.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{new Date(log.createdAt).toLocaleString('pt-BR')}</td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-900">{log.phone || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${res.bg} ${res.text}`}>
                              <Icon size={14} /> {res.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 max-w-md truncate" title={log.detail}>{log.detail}</td>
                          <td className="px-4 py-3">
                            {log.payloadPreview && (
                              <button
                                type="button"
                                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                                className="text-gray-500 hover:text-primary p-1"
                              >
                                {expandedId === log.id ? '▲' : '▼'}
                              </button>
                            )}
                          </td>
                        </tr>
                        {log.payloadPreview && expandedId === log.id && (
                          <tr className="bg-gray-50">
                            <td colSpan={5} className="px-4 py-3">
                              <pre className="text-xs text-gray-700 bg-white p-3 rounded border overflow-x-auto max-h-32 overflow-y-auto">{log.payloadPreview}</pre>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {(pagination.totalPages > 1 || (hideIgnoredCallbacks && displayLogs.length < logs.length)) && (
            <div className="px-4 py-3 bg-gray-50 border-t flex justify-between items-center flex-wrap gap-2">
              <p className="text-sm text-gray-600">
                Página {pagination.page} de {pagination.totalPages} ({pagination.total} eventos)
                {hideIgnoredCallbacks && displayLogs.length < logs.length && (
                  <span className="ml-1 text-gray-500">· exibindo {displayLogs.length} (ignorados ocultos)</span>
                )}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))} disabled={pagination.page <= 1}><ChevronLeft size={16} /></Button>
                <Button variant="outline" size="sm" onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))} disabled={pagination.page >= pagination.totalPages}><ChevronRight size={16} /></Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
