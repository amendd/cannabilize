'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Share2, ArrowLeft } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';
import { canAccessIfp } from '@/lib/ifp-permissions';

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Solicitado',
  PROCESSING: 'Processando',
  PAID: 'Pago',
  REJECTED: 'Rejeitado',
  CANCELLED: 'Cancelado',
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
  });
}

export default function IfpRepassesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    payouts: Array<{
      id: string;
      amount: number;
      status: string;
      requestedAt: string;
      paidAt: string | null;
      doctor: { id: string; name: string; email: string } | null;
    }>;
    total: number;
    totalRepassesEfetuados: number;
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
      fetch('/api/ifp-canna/payouts?limit=100')
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
          <Share2 size={28} className="text-indigo-600" />
          Repasses
        </h1>
      </div>

      <p className="text-slate-600 mb-6">
        Controle de repasses aos médicos. Possível split ou controle de repasses — valor entregue.
      </p>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          Carregando repasses...
        </div>
      ) : data ? (
        <>
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
            <p className="text-sm text-indigo-800 font-medium">Total efetuado (status Pago)</p>
            <p className="text-2xl font-bold text-indigo-700">{formatBRL(data.totalRepassesEfetuados)}</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left text-slate-600">
                    <th className="px-4 py-3 font-semibold">Médico</th>
                    <th className="px-4 py-3 font-semibold">Valor</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Solicitado em</th>
                    <th className="px-4 py-3 font-semibold">Pago em</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payouts.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{p.doctor?.name ?? '—'}</span>
                        {p.doctor?.email && (
                          <span className="block text-xs text-slate-500">{p.doctor.email}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{formatBRL(p.amount)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            p.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'REQUESTED' || p.status === 'PROCESSING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {STATUS_LABELS[p.status] ?? p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(p.requestedAt)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(p.paidAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-slate-600 text-sm">
              Total: {data.total} repasse(s)
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          Não foi possível carregar os repasses.
        </div>
      )}
    </div>
  );
}
