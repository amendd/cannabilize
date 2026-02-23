'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { History, ArrowLeft } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  changes: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
}

export default function ErpAuditoriaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [status, session?.user?.role, router]);

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      setLoading(true);
      const params = new URLSearchParams();
      if (entityFilter) params.set('entity', entityFilter);
      if (actionFilter) params.set('action', actionFilter);
      fetch(`/api/erp-canna/audit?${params}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) throw new Error(data.error);
          setLogs(data.logs || []);
          setTotal(data.total ?? 0);
        })
        .catch(() => {
          setLogs([]);
          setTotal(0);
        })
        .finally(() => setLoading(false));
    }
  }, [session?.user?.role, entityFilter, actionFilter]);

  if (status === 'loading') return <LoadingPage />;
  if (!session || session.user.role !== 'ADMIN') return null;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/erp-canna"
            className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mb-2"
          >
            <ArrowLeft size={16} /> Voltar ao dashboard
          </Link>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History size={24} className="text-emerald-600" />
            Auditoria
          </h1>
          <p className="text-slate-600 text-sm mt-1">Histórico completo de ações para compliance e rastreabilidade.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Entidade"
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-32"
          />
          <input
            type="text"
            placeholder="Ação"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-32"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nenhum registro de auditoria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Data</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Ação</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Entidade</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Usuário</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{log.entity}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs">{log.entityId || '—'}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {log.user?.name || '—'}
                      {log.user?.email && (
                        <span className="block text-xs text-slate-400">{log.user.email}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {!loading && total > 0 && (
        <p className="mt-2 text-sm text-slate-500">Exibindo até 100 registros. Total: {total}</p>
      )}
    </div>
  );
}
