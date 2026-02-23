'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileBarChart, ArrowLeft } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';
import { canAccessIfp } from '@/lib/ifp-permissions';

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function IfpRelatoriosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalRecebido: number;
    totalTransacoesPagas: number;
    receitaMes: number;
    transacoesMes: number;
    receitaAno: number;
    totalRepassesEfetuados: number;
    repassesPendentesValor: number;
    ordersWithPayment: number;
    ordersSemPagamento: number;
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
      fetch('/api/ifp-canna/stats')
        .then((res) => res.json())
        .then((d) => {
          if (d.error) throw new Error(d.error);
          setStats(d);
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
          <FileBarChart size={28} className="text-indigo-600" />
          Relatórios financeiros
        </h1>
      </div>

      <p className="text-slate-600 mb-8">
        Resumo financeiro para auditoria e análise. Estrutura preparada para exportação e compliance.
      </p>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          Carregando...
        </div>
      ) : stats ? (
        <div className="space-y-6">
          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Receita</h2>
            <ul className="space-y-3 text-slate-700">
              <li className="flex justify-between">
                <span>Total recebido (histórico)</span>
                <span className="font-semibold">{formatBRL(stats.totalRecebido)}</span>
              </li>
              <li className="flex justify-between">
                <span>Transações pagas</span>
                <span className="font-semibold">{stats.totalTransacoesPagas}</span>
              </li>
              <li className="flex justify-between">
                <span>Receita no mês</span>
                <span className="font-semibold">{formatBRL(stats.receitaMes)}</span>
              </li>
              <li className="flex justify-between">
                <span>Transações no mês</span>
                <span className="font-semibold">{stats.transacoesMes}</span>
              </li>
              <li className="flex justify-between">
                <span>Receita no ano</span>
                <span className="font-semibold">{formatBRL(stats.receitaAno)}</span>
              </li>
            </ul>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Repasses</h2>
            <ul className="space-y-3 text-slate-700">
              <li className="flex justify-between">
                <span>Total repasses efetuados</span>
                <span className="font-semibold">{formatBRL(stats.totalRepassesEfetuados)}</span>
              </li>
              <li className="flex justify-between">
                <span>Repasses pendentes (valor)</span>
                <span className="font-semibold text-amber-700">{formatBRL(stats.repassesPendentesValor)}</span>
              </li>
            </ul>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Reconciliação (pedidos)</h2>
            <ul className="space-y-3 text-slate-700">
              <li className="flex justify-between">
                <span>Pedidos com pagamento vinculado</span>
                <span className="font-semibold">{stats.ordersWithPayment}</span>
              </li>
              <li className="flex justify-between">
                <span>Pedidos sem pagamento vinculado</span>
                <span className="font-semibold text-amber-700">{stats.ordersSemPagamento}</span>
              </li>
            </ul>
          </section>

          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
            <p className="text-sm text-indigo-800">
              Para relatórios detalhados por período, use <strong>Transações</strong> e <strong>Reconciliação</strong> com
              filtros. Exportação (CSV/PDF) pode ser implementada conforme necessidade de auditoria.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          Não foi possível carregar os dados.
        </div>
      )}
    </div>
  );
}
