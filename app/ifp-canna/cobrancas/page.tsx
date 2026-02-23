'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { canAccessIfp, canCreateCharge } from '@/lib/ifp-permissions';
import { CreditCard, ArrowLeft, Plus, Filter } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';

interface Charge {
  id: string;
  amount: number;
  currency: string;
  description: string | null;
  dueDate: string;
  status: string;
  chargeType: string;
  createdAt: string;
  patient: { id: string; name: string; email: string };
  erpOrder?: { id: string; status: string } | null;
}

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
function formatDate(s: string) {
  return new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const STATUS_LABEL: Record<string, string> = {
  CREATED: 'Criada',
  SENT: 'Enviada',
  PAID: 'Paga',
  OVERDUE: 'Vencida',
  CANCELLED: 'Cancelada',
};

export default function CobrancasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=' + encodeURIComponent('/ifp-canna/cobrancas'));
      return;
    }
    if (status === 'authenticated' && session?.user?.role != null && !canAccessIfp(session.user.role)) {
      router.push('/admin');
      return;
    }
  }, [status, session?.user?.role, router]);

  useEffect(() => {
    if (!session?.user?.role || !canAccessIfp(session.user.role)) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== 'ALL') params.set('status', statusFilter);
    fetch('/api/ifp-canna/charges?' + params.toString())
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setCharges(data.charges || []);
        setTotal(data.total ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session?.user?.role, statusFilter]);

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
            <CreditCard size={28} className="text-indigo-600" />
            Cobranças
          </h1>
        </div>
        {canCreateCharge(session.user?.role) && (
          <Link
            href="/ifp-canna/cobrancas/nova"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            <Plus size={20} /> Nova cobrança
          </Link>
        )}
      </div>

      <p className="text-slate-600 mb-6">
        Gerar e controlar cobranças vinculadas a pedidos, pacientes e prescrições. Cobrança paga não pode ser editada; cancelamento gera log imutável.
      </p>

      <div className="mb-4 flex items-center gap-2">
        <Filter size={18} className="text-slate-500" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="ALL">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
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
                  <th className="px-4 py-3 font-semibold">Paciente</th>
                  <th className="px-4 py-3 font-semibold">Valor</th>
                  <th className="px-4 py-3 font-semibold">Vencimento</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Pedido</th>
                  <th className="px-4 py-3 font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody>
                {charges.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Nenhuma cobrança encontrada.
                    </td>
                  </tr>
                ) : (
                  charges.map((c) => (
                    <tr key={c.id} className="border-b border-slate-100">
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{c.patient?.name ?? '—'}</span>
                        {c.patient?.email && (
                          <span className="block text-xs text-slate-500">{c.patient.email}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">{formatBRL(c.amount)}</td>
                      <td className="px-4 py-3">{formatDate(c.dueDate)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                            c.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'CANCELLED' || c.status === 'OVERDUE'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {STATUS_LABEL[c.status] ?? c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{c.chargeType === 'RECURRING' ? 'Recorrente' : 'Avulsa'}</td>
                      <td className="px-4 py-3">
                        {c.erpOrder ? (
                          <Link href="/erp-canna/pedidos" className="text-indigo-600 hover:underline">
                            #{c.erpOrder.id.slice(0, 8)}
                          </Link>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/ifp-canna/cobrancas/${c.id}`}
                          className="text-indigo-600 hover:underline font-medium"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {total > 0 && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-sm text-slate-600">
              Total: {total} cobrança(s)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
