'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Receipt, ArrowLeft, Filter } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';
import { canAccessIfp } from '@/lib/ifp-permissions';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  PROCESSING: 'Processando',
  PAID: 'Pago',
  FAILED: 'Falhou',
  REFUNDED: 'Reembolsado',
  CANCELLED: 'Cancelado',
  CHARGEBACK: 'Chargeback',
};

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function IfpTransacoesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    transactions: Array<{
      id: string;
      amount: number;
      status: string;
      paymentMethod: string | null;
      transactionId: string | null;
      paidAt: string | null;
      createdAt: string;
      patient: { id: string; name: string; email: string } | null;
      consultation: { id: string; scheduledAt: string; status: string } | null;
      erpOrder: { id: string; status: string; createdAt: string; organization: { name: string } | null } | null;
    }>;
    total: number;
    limit: number;
    offset: number;
  } | null>(null);

  const statusFilter = searchParams.get('status') || 'ALL';
  const period = searchParams.get('period') || 'all';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user?.role != null && !canAccessIfp(session.user.role)) {
      router.push('/');
      return;
    }
  }, [status, session?.user?.role, router]);

  useEffect(() => {
    if (session?.user?.role && canAccessIfp(session.user.role)) {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (period !== 'all') params.set('period', period);
      params.set('limit', '50');
      fetch(`/api/ifp-canna/transactions?${params}`)
        .then((res) => res.json())
        .then((d) => {
          if (d.error) throw new Error(d.error);
          setData(d);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [session?.user?.role, statusFilter, period]);

  if (status === 'loading') return <LoadingPage />;
  if (!session || !canAccessIfp(session.user?.role)) return null;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/ifp-canna"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
          >
            <ArrowLeft size={20} /> Voltar
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt size={28} className="text-indigo-600" />
            Transações
          </h1>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <span className="flex items-center gap-2 text-slate-600">
          <Filter size={18} /> Filtros:
        </span>
        <select
          value={statusFilter}
          onChange={(e) => {
            const p = new URLSearchParams(searchParams);
            if (e.target.value === 'ALL') p.delete('status');
            else p.set('status', e.target.value);
            router.push(`/ifp-canna/transacoes?${p}`);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="ALL">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={period}
          onChange={(e) => {
            const p = new URLSearchParams(searchParams);
            if (e.target.value === 'all') p.delete('period');
            else p.set('period', e.target.value);
            router.push(`/ifp-canna/transacoes?${p}`);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="all">Todo o período</option>
          <option value="month">Este mês</option>
          <option value="year">Este ano</option>
        </select>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          Carregando transações...
        </div>
      ) : data?.transactions?.length ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left text-slate-600">
                  <th className="px-4 py-3 font-semibold">Data</th>
                  <th className="px-4 py-3 font-semibold">Paciente</th>
                  <th className="px-4 py-3 font-semibold">Valor</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Método</th>
                  <th className="px-4 py-3 font-semibold">Consulta</th>
                  <th className="px-4 py-3 font-semibold">Pedido</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">
                      {t.paidAt ? formatDate(t.paidAt) : formatDate(t.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-medium text-slate-900">{t.patient?.name ?? '—'}</span>
                        {t.patient?.email && (
                          <span className="block text-xs text-slate-500">{t.patient.email}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{formatBRL(t.amount)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          t.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.status === 'PENDING' || t.status === 'PROCESSING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {STATUS_LABELS[t.status] ?? t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{t.paymentMethod ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {t.consultation ? (
                        <Link href={`/admin/consultas/${t.consultation.id}`} className="text-indigo-600 hover:underline">
                          #{t.consultation.id.slice(0, 8)}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {t.erpOrder ? (
                        <Link href={`/erp-canna/pedidos`} className="text-indigo-600 hover:underline">
                          #{t.erpOrder.id.slice(0, 8)}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-slate-600 text-sm">
            Total: {data.total} transação(ões)
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          Nenhuma transação encontrada com os filtros aplicados.
        </div>
      )}
    </div>
  );
}
