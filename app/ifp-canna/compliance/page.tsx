'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { canAccessIfp, canViewAudit } from '@/lib/ifp-permissions';
import { Shield, ArrowLeft, Filter } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  changes: string | null;
  metadata: string | null;
  createdAt: string;
  user: { name: string; email: string } | null;
}

function formatDate(s: string) {
  return new Date(s).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CompliancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [entityFilter, setEntityFilter] = useState('financial');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=' + encodeURIComponent('/ifp-canna/compliance'));
      return;
    }
    if (status === 'authenticated' && session?.user?.role != null && !canAccessIfp(session.user.role)) {
      router.push('/admin');
      return;
    }
  }, [status, session?.user?.role, router]);

  useEffect(() => {
    if (!session?.user?.role || !canViewAudit(session.user.role)) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (entityFilter) params.set('entity', entityFilter);
    fetch('/api/ifp-canna/audit?' + params.toString())
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setLogs(data.logs || []);
        setTotal(data.total ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session?.user?.role, entityFilter]);

  if (status === 'loading') return <LoadingPage />;
  if (!session || !canAccessIfp(session.user?.role)) return null;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/ifp-canna"
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
        >
          <ArrowLeft size={20} /> Voltar
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Shield size={28} className="text-indigo-600" />
          Compliance & Auditoria
        </h1>
      </div>

      <p className="text-slate-600 mb-6">
        Logs imutáveis de criação, edição e cancelamento. Rastreamento completo por transação (quem criou, alterou, quando e por quê).
      </p>

      <div className="mb-4 flex items-center gap-2">
        <Filter size={18} className="text-slate-500" />
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="financial">Financeiro (Payment, Charge, Reconciliation)</option>
          <option value="Payment">Apenas Payment</option>
          <option value="Charge">Apenas Charge</option>
          <option value="Reconciliation">Apenas Reconciliation</option>
        </select>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          Carregando...
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left text-slate-600">
                  <th className="px-4 py-3 font-semibold">Data</th>
                  <th className="px-4 py-3 font-semibold">Usuário</th>
                  <th className="px-4 py-3 font-semibold">Ação</th>
                  <th className="px-4 py-3 font-semibold">Entidade</th>
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Metadados</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Nenhum log encontrado.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-100">
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                      <td className="px-4 py-3">
                        {log.user ? (
                          <>
                            <span className="font-medium text-slate-900">{log.user.name}</span>
                            <span className="block text-xs text-slate-500">{log.user.email}</span>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">{log.action}</td>
                      <td className="px-4 py-3">{log.entity}</td>
                      <td className="px-4 py-3 font-mono text-xs">{log.entityId ? log.entityId.slice(0, 8) : '—'}</td>
                      <td className="px-4 py-3 max-w-xs truncate" title={log.metadata || undefined}>
                        {log.metadata ? (
                          <span className="text-slate-600">{log.metadata.length > 80 ? log.metadata.slice(0, 80) + '…' : log.metadata}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {total > 0 && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-sm text-slate-600">
              Total: {total} registro(s)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
