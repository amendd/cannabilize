'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { canAccessIfp } from '@/lib/ifp-permissions';
import { Repeat, ArrowLeft } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function AssinaturasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Array<{ id: string; name: string; amount: number; interval: string; active: boolean }>>([]);
  const [subscriptions, setSubscriptions] = useState<Array<{
    id: string;
    status: string;
    nextBillingAt: string | null;
    patient: { name: string; email: string };
    plan: { name: string; amount: number; interval: string };
  }>>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=' + encodeURIComponent('/ifp-canna/assinaturas'));
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
    Promise.all([
      fetch('/api/ifp-canna/subscription-plans').then((r) => r.json()),
      fetch('/api/ifp-canna/subscriptions').then((r) => r.json()),
    ])
      .then(([plansData, subsData]) => {
        setPlans(plansData.plans || plansData || []);
        setSubscriptions(subsData.subscriptions || subsData || []);
      })
      .catch(() => {
        setPlans([]);
        setSubscriptions([]);
      })
      .finally(() => setLoading(false));
  }, [session?.user?.role]);

  if (status === 'loading') return <LoadingPage />;
  if (!session || !canAccessIfp(session.user?.role)) return null;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/ifp-canna"
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
        >
          <ArrowLeft size={20} /> Voltar
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Repeat size={28} className="text-indigo-600" />
          Assinaturas / Recorrência
        </h1>
      </div>

      <p className="text-slate-600 mb-6">
        Planos e assinaturas para cobrança automática mensal (MRR). Falha de pagamento gera alerta; múltiplas falhas podem suspender a assinatura.
      </p>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          Carregando...
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Planos</h2>
            {plans.length === 0 ? (
              <p className="text-slate-500">Nenhum plano cadastrado. Use a API para criar planos de assinatura.</p>
            ) : (
              <ul className="space-y-2">
                {plans.map((p) => (
                  <li key={p.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                    <span className="font-medium">{p.name}</span>
                    <span>{formatBRL(p.amount)} / {p.interval === 'MONTH' ? 'mês' : 'ano'}</span>
                    <span className={`text-xs px-2 py-1 rounded ${p.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100'}`}>
                      {p.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <h2 className="text-lg font-semibold text-slate-900 px-6 py-4 border-b border-slate-200">Assinaturas</h2>
            {subscriptions.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                Nenhuma assinatura ativa. Cobranças recorrentes aparecem aqui quando vinculadas a um plano.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left text-slate-600">
                      <th className="px-4 py-3 font-semibold">Paciente</th>
                      <th className="px-4 py-3 font-semibold">Plano</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Próxima cobrança</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((s) => (
                      <tr key={s.id} className="border-b border-slate-100">
                        <td className="px-4 py-3">
                          <span className="font-medium">{s.patient?.name ?? '—'}</span>
                          {s.patient?.email && <span className="block text-xs text-slate-500">{s.patient.email}</span>}
                        </td>
                        <td className="px-4 py-3">{s.plan?.name ?? '—'} — {s.plan ? formatBRL(s.plan.amount) : '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 rounded text-xs ${s.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100'}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {s.nextBillingAt ? new Date(s.nextBillingAt).toLocaleDateString('pt-BR') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
