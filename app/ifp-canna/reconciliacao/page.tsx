'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Scale, ArrowLeft, Link2, Unlink } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';
import { canAccessIfp, canReconcile } from '@/lib/ifp-permissions';

function formatDate(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function IfpReconciliacaoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    resumo: {
      totalPagamentos: number;
      comVinculoConsulta: number;
      comVinculoPedido: number;
      pedidosSemPagamento: number;
    };
    payments: Array<{
      id: string;
      amount: number;
      status: string;
      consultationId: string | null;
      erpOrderId: string | null;
      patient: { name: string; email: string } | null;
      consultation: { id: string; scheduledAt: string } | null;
      erpOrder: { id: string; status: string; organization: { name: string } | null } | null;
    }>;
    ordersSemPagamento: Array<{
      id: string;
      status: string;
      createdAt: string;
      patient: { name: string; email: string } | null;
      consultation: { id: string } | null;
      organization: { name: string } | null;
    }>;
  } | null>(null);

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
      fetch('/api/ifp-canna/reconciliation')
        .then((res) => res.json())
        .then((d) => {
          if (d.error) throw new Error(d.error);
          setData(d);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [session?.user?.role]);

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
          <Scale size={28} className="text-indigo-600" />
          Reconciliação
        </h1>
      </div>

      <p className="text-slate-600 mb-6">
        Visão do vínculo pagamento ↔ pedido ↔ paciente. Base para auditoria e controle financeiro integrado.
      </p>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          Carregando...
        </div>
      ) : data ? (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-2xl font-bold text-slate-900">{data.resumo.totalPagamentos}</p>
              <p className="text-sm text-slate-600">Total pagamentos</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-2xl font-bold text-indigo-600">{data.resumo.comVinculoConsulta}</p>
              <p className="text-sm text-slate-600">Com vínculo consulta</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-2xl font-bold text-emerald-600">{data.resumo.comVinculoPedido}</p>
              <p className="text-sm text-slate-600">Com vínculo pedido</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-2xl font-bold text-amber-600">{data.resumo.pedidosSemPagamento}</p>
              <p className="text-sm text-slate-600">Pedidos sem pagamento</p>
            </div>
          </div>

          {/* Pedidos sem pagamento */}
          {data.ordersSemPagamento.length > 0 && (
            <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
                <Unlink size={20} /> Pedidos sem pagamento vinculado
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-amber-200 text-left text-amber-800">
                      <th className="pb-2 pr-4">Paciente</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2 pr-4">Data</th>
                      <th className="pb-2">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ordersSemPagamento.map((o) => (
                      <tr key={o.id} className="border-b border-amber-100">
                        <td className="py-3 pr-4">
                          <span className="font-medium text-slate-900">{o.patient?.name ?? '—'}</span>
                          {o.patient?.email && (
                            <span className="block text-xs text-slate-500">{o.patient.email}</span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-amber-800">{o.status}</td>
                        <td className="py-3 pr-4 text-slate-600">{formatDate(o.createdAt)}</td>
                        <td className="py-3">
                          <Link
                            href="/erp-canna/pedidos"
                            className="text-indigo-600 hover:underline font-medium"
                          >
                            Ver pedidos
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagamentos com vínculos */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <h2 className="text-lg font-semibold text-slate-900 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
              <Link2 size={20} className="text-indigo-600" /> Pagamentos e vínculos
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left text-slate-600">
                    <th className="px-4 py-3 font-semibold">Paciente</th>
                    <th className="px-4 py-3 font-semibold">Valor</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Consulta</th>
                    <th className="px-4 py-3 font-semibold">Pedido</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100">
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{p.patient?.name ?? '—'}</span>
                        {p.patient?.email && (
                          <span className="block text-xs text-slate-500">{p.patient.email}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.amount)}
                      </td>
                      <td className="px-4 py-3">{p.status}</td>
                      <td className="px-4 py-3">
                        {p.consultation ? (
                          <Link href={`/admin/consultas/${p.consultation.id}`} className="text-indigo-600 hover:underline">
                            #{p.consultation.id.slice(0, 8)}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.erpOrder ? (
                          <span className="text-emerald-600">#{p.erpOrder.id.slice(0, 8)}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          Não foi possível carregar os dados de reconciliação.
        </div>
      )}
    </div>
  );
}
