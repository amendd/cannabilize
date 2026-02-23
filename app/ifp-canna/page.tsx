'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Wallet,
  Receipt,
  Clock,
  TrendingUp,
  Share2,
  Scale,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { canAccessIfp } from '@/lib/ifp-permissions';

interface Stats {
  totalRecebido: number;
  totalTransacoesPagas: number;
  totalPendente: number;
  totalTransacoesPendentes: number;
  receitaMes: number;
  transacoesMes: number;
  receitaAno: number;
  totalRepassesEfetuados: number;
  repassesPendentesValor: number;
  repassesPendentesQtd: number;
  ordersCount: number;
  ordersWithPayment: number;
  ordersSemPagamento: number;
  chargebackCount?: number;
  failedCount?: number;
  unreconciledCount?: number;
}

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function IfpCannaDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=' + encodeURIComponent('/ifp-canna'));
      return;
    }
    if (status === 'authenticated' && session?.user?.role != null && !canAccessIfp(session.user.role)) {
      router.push('/admin');
      return;
    }
  }, [status, session?.user?.role, router]);

  useEffect(() => {
    if (session?.user?.role && canAccessIfp(session.user.role)) {
      setLoading(true);
      fetch('/api/ifp-canna/stats')
        .then((res) => res.json())
        .then((data) => {
          if (data.error) throw new Error(data.error);
          setStats(data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [session?.user?.role]);

  if (status === 'unauthenticated') return null;
  if (status === 'authenticated' && (!session || !canAccessIfp(session.user?.role))) return null;

  const showSkeleton = status === 'loading' || loading;

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Visão geral — IFP CANNA</h1>
        <p className="text-slate-500 font-medium mt-0.5">Infraestrutura Financeira e Pagamentos</p>
        <p className="text-slate-600 mt-1">
          Pedidos, cobranças, pagamentos e reconciliação em um só fluxo.
        </p>
      </motion.div>

      {showSkeleton ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
          </div>
        </>
      ) : stats ? (
        <>
          {/* KPIs financeiros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Link
              href="/ifp-canna/transacoes?status=PAID"
              className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-4"
            >
              <div className="bg-emerald-500 p-3 rounded-lg flex-shrink-0">
                <Wallet size={24} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{formatBRL(stats.totalRecebido)}</p>
                <p className="text-sm text-slate-600 font-medium">Total recebido</p>
                <p className="text-xs text-slate-500">{stats.totalTransacoesPagas} transações</p>
              </div>
            </Link>
            <Link
              href="/ifp-canna/transacoes?status=PENDING"
              className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all flex items-center gap-4"
            >
              <div className="bg-amber-500 p-3 rounded-lg flex-shrink-0">
                <Clock size={24} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{formatBRL(stats.totalPendente)}</p>
                <p className="text-sm text-slate-600 font-medium">Pendente</p>
                <p className="text-xs text-slate-500">{stats.totalTransacoesPendentes} transações</p>
              </div>
            </Link>
            <Link
              href="/ifp-canna/transacoes"
              className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-4"
            >
              <div className="bg-indigo-500 p-3 rounded-lg flex-shrink-0">
                <TrendingUp size={24} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{formatBRL(stats.receitaMes)}</p>
                <p className="text-sm text-slate-600 font-medium">Receita no mês</p>
                <p className="text-xs text-slate-500">{stats.transacoesMes} transações</p>
              </div>
            </Link>
            <Link
              href="/ifp-canna/repasses"
              className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-4"
            >
              <div className="bg-violet-500 p-3 rounded-lg flex-shrink-0">
                <Share2 size={24} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{formatBRL(stats.totalRepassesEfetuados)}</p>
                <p className="text-sm text-slate-600 font-medium">Repasses efetuados</p>
                {stats.repassesPendentesQtd > 0 && (
                  <p className="text-xs text-amber-600">
                    {stats.repassesPendentesQtd} pendente(s) · {formatBRL(stats.repassesPendentesValor)}
                  </p>
                )}
              </div>
            </Link>
          </div>

          {/* Reconciliação e ações */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Scale size={20} className="text-indigo-600" />
                  Reconciliação
                </h2>
                <Link
                  href="/ifp-canna/reconciliacao"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  Abrir <ArrowRight size={14} />
                </Link>
              </div>
              <p className="text-slate-600 text-sm mb-4">
                Vínculo pagamento ↔ pedido ↔ paciente. Pedidos com e sem pagamento vinculado.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium">
                  Pedidos com pagamento: {stats.ordersWithPayment}
                </span>
                {stats.ordersSemPagamento > 0 ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 text-sm font-medium">
                    <AlertCircle size={14} />
                    Sem pagamento: {stats.ordersSemPagamento}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-sm font-medium">
                    Todos reconciliados
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Receipt size={20} className="text-indigo-600" />
                  Transações
                </h2>
                <Link
                  href="/ifp-canna/transacoes"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  Ver todas <ArrowRight size={14} />
                </Link>
              </div>
              <p className="text-slate-600 text-sm mb-4">
                Registro de transações com vínculo a paciente, consulta e pedido para auditoria.
              </p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalTransacoesPagas}</p>
              <p className="text-sm text-slate-500">transações pagas no total</p>
            </div>
          </div>

          {/* Alertas: chargeback, falha, conciliação */}
          {(stats.chargebackCount !== undefined && stats.chargebackCount > 0) ||
           (stats.failedCount !== undefined && stats.failedCount > 0) ||
           (stats.unreconciledCount !== undefined && stats.unreconciledCount > 0) ? (
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-amber-900 mb-3 flex items-center gap-2">
                <AlertCircle size={22} /> Alertas financeiros
              </h2>
              <div className="flex flex-wrap gap-4">
                {stats.chargebackCount !== undefined && stats.chargebackCount > 0 && (
                  <Link
                    href="/ifp-canna/transacoes?status=CHARGEBACK"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 text-red-800 font-medium hover:bg-red-200"
                  >
                    Chargebacks: {stats.chargebackCount}
                  </Link>
                )}
                {stats.failedCount !== undefined && stats.failedCount > 0 && (
                  <Link
                    href="/ifp-canna/transacoes?status=FAILED"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-100 text-amber-800 font-medium hover:bg-amber-200"
                  >
                    Pagamentos falhos: {stats.failedCount}
                  </Link>
                )}
                {stats.unreconciledCount !== undefined && stats.unreconciledCount > 0 && (
                  <Link
                    href="/ifp-canna/reconciliacao"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-100 text-orange-800 font-medium hover:bg-orange-200"
                  >
                    Não conciliados: {stats.unreconciledCount}
                  </Link>
                )}
              </div>
            </div>
          ) : null}

          {/* Resumo anual */}
          <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-indigo-900 mb-2">Resumo do ano</h2>
            <p className="text-2xl font-bold text-indigo-700">{formatBRL(stats.receitaAno)}</p>
            <p className="text-sm text-indigo-600">Receita total no ano (pagamentos confirmados)</p>
          </div>
        </>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800">
          Não foi possível carregar as estatísticas. Verifique o console ou tente novamente.
        </div>
      )}
    </div>
  );
}
