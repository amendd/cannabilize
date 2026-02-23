'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { History, User, Filter } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

interface AuditEntry {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  changes: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string } | null;
}

export default function GppAuditoriaPage() {
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
    if (session?.user?.role !== 'ADMIN') return;
    setLoading(true);
    const params = new URLSearchParams();
    if (entityFilter) params.set('entity', entityFilter);
    if (actionFilter) params.set('action', actionFilter);
    params.set('limit', '100');
    fetch(`/api/gpp-canna/audit?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setLogs(data.logs ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session?.user?.role, entityFilter, actionFilter]);

  if (status === 'loading') return <LoadingPage />;
  if (!session || session.user.role !== 'ADMIN') return null;

  return (
    <div className="max-w-7xl mx-auto">
      <Breadcrumbs items={[{ label: 'GPP CANNA', href: '/gpp-canna' }, { label: 'Auditoria' }]} />
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Trilha de auditoria</h1>
        <p className="text-slate-600 mt-1">
          Quem acessou, quando e o quê. Logs imutáveis para conformidade e auditorias.
        </p>
      </motion.div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-500" />
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todas entidades</option>
            <option value="User">User</option>
            <option value="Consultation">Consultation</option>
            <option value="Prescription">Prescription</option>
            <option value="PatientConsent">PatientConsent</option>
            <option value="Payment">Payment</option>
            <option value="PatientCard">PatientCard</option>
          </select>
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todas ações</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="LOGIN">LOGIN</option>
          <option value="EXPORT">EXPORT</option>
          <option value="VIEW">VIEW</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Carregando...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <History size={48} className="mx-auto mb-3 text-slate-300" />
            <p>Nenhum registro de auditoria no período.</p>
          </div>
        ) : (
          <>
            <p className="px-4 py-2 text-sm text-slate-600 border-b border-slate-100">
              Exibindo até 100 registros. Total: {total}
            </p>
            <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 z-10">
                  <tr className="border-b border-slate-200 text-left text-slate-600">
                    <th className="pb-2 pt-3 px-4 font-semibold">Data/Hora</th>
                    <th className="pb-2 pt-3 px-4 font-semibold">Usuário</th>
                    <th className="pb-2 pt-3 px-4 font-semibold">Ação</th>
                    <th className="pb-2 pt-3 px-4 font-semibold">Entidade</th>
                    <th className="pb-2 pt-3 px-4 font-semibold">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-2 px-4 text-slate-600 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2 px-4">
                        {log.user ? (
                          <>
                            <span className="font-medium text-slate-900">{log.user.name}</span>
                            <span className="block text-xs text-slate-500">{log.user.email}</span>
                          </>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2 px-4">{log.entity}</td>
                      <td className="py-2 px-4 font-mono text-xs text-slate-600 truncate max-w-[120px]">
                        {log.entityId || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
