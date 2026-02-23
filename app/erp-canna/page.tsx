'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users,
  UserCircle,
  Building2,
  Package,
  FileCheck,
  History,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  PAID: 'Pago',
  SENT: 'Em logística',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

export default function ErpCannaDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalPatients: number;
    totalDoctors: number;
    totalOrganizations: number;
    ordersByStatus: Record<string, number>;
    recentOrders: Array<{
      id: string;
      status: string;
      createdAt: string;
      patient: { id: string; name: string; email: string };
    }>;
    anvisaPending: number;
    auditCountLast30Days: number;
    monthlyRevenue?: number;
    prescriptionsExpiringSoon?: number;
    ordersInProgress?: number;
    ordersDelivered?: number;
  } | null>(null);

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
      fetch('/api/erp-canna/stats')
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
  if (status === 'authenticated' && (!session || session.user.role !== 'ADMIN')) return null;

  const showSkeleton = status === 'loading' || loading;

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Visão geral — ERP CANNA</h1>
        <p className="text-slate-500 font-medium mt-0.5">Gestão Operacional e Pedidos</p>
        <p className="text-slate-600 mt-1">
          Núcleo operacional regulatório. Rastreabilidade, auditoria e controle de pedidos.
        </p>
      </motion.div>

      {showSkeleton ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-40 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-40 bg-slate-100 rounded-xl animate-pulse" />
          </div>
        </>
      ) : stats ? (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Link
              href="/erp-canna/entidades/pacientes"
              className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all flex items-center gap-4"
            >
              <div className="bg-emerald-500 p-3 rounded-lg flex-shrink-0">
                <UserCircle size={24} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.totalPatients}</p>
                <p className="text-sm text-slate-600 font-medium">Pacientes</p>
              </div>
            </Link>
            <Link
              href="/erp-canna/entidades/medicos"
              className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all flex items-center gap-4"
            >
              <div className="bg-teal-500 p-3 rounded-lg flex-shrink-0">
                <Users size={24} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.totalDoctors}</p>
                <p className="text-sm text-slate-600 font-medium">Médicos</p>
              </div>
            </Link>
            <Link
              href="/erp-canna/entidades/associacoes"
              className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all flex items-center gap-4"
            >
              <div className="bg-amber-500 p-3 rounded-lg flex-shrink-0">
                <Building2 size={24} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.totalOrganizations}</p>
                <p className="text-sm text-slate-600 font-medium">Associações</p>
              </div>
            </Link>
            <Link
              href="/erp-canna/autorizacoes"
              className={`rounded-xl shadow-sm p-5 border flex items-center gap-4 transition-all ${
                stats.anvisaPending > 0
                  ? 'bg-amber-50 border-amber-300 hover:border-amber-500'
                  : 'bg-white border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div className={`p-3 rounded-lg flex-shrink-0 ${stats.anvisaPending > 0 ? 'bg-amber-500' : 'bg-slate-500'}`}>
                <FileCheck size={24} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.anvisaPending}</p>
                <p className="text-sm text-slate-600 font-medium">Autorizações pendentes</p>
                {stats.anvisaPending > 0 && (
                  <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                    <AlertTriangle size={12} /> Requer atenção
                  </p>
                )}
              </div>
            </Link>
          </div>

          {/* Segunda linha: Faturamento e alertas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
              <p className="text-sm text-slate-600 font-medium">Faturamento mensal</p>
              <p className="text-2xl font-bold text-emerald-600">
                R$ {(stats.monthlyRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
              <p className="text-sm text-slate-600 font-medium">Pedidos em andamento</p>
              <p className="text-2xl font-bold text-slate-900">{stats.ordersInProgress ?? 0}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
              <p className="text-sm text-slate-600 font-medium">Pedidos entregues</p>
              <p className="text-2xl font-bold text-slate-900">{stats.ordersDelivered ?? 0}</p>
            </div>
            <Link
              href="/erp-canna/prescricoes"
              className={`rounded-xl shadow-sm p-5 border flex items-center gap-4 transition-all ${
                (stats.prescriptionsExpiringSoon ?? 0) > 0
                  ? 'bg-amber-50 border-amber-300 hover:border-amber-500'
                  : 'bg-white border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div className={`p-3 rounded-lg flex-shrink-0 ${(stats.prescriptionsExpiringSoon ?? 0) > 0 ? 'bg-amber-500' : 'bg-slate-500'}`}>
                <AlertTriangle size={24} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.prescriptionsExpiringSoon ?? 0}</p>
                <p className="text-sm text-slate-600 font-medium">Prescrições vencendo (30 dias)</p>
                {(stats.prescriptionsExpiringSoon ?? 0) > 0 && (
                  <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">Requer atenção</p>
                )}
              </div>
            </Link>
          </div>

          {/* Pedidos por status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Package size={20} className="text-emerald-600" />
                  Pedidos por status
                </h2>
                <Link
                  href="/erp-canna/pedidos"
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  Ver todos <ArrowRight size={14} />
                </Link>
              </div>
              <div className="flex flex-wrap gap-3">
                {Object.entries(stats.ordersByStatus || {}).map(([statusKey, count]) => (
                  <span
                    key={statusKey}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium"
                  >
                    {STATUS_LABELS[statusKey] || statusKey}: {count}
                  </span>
                ))}
                {(!stats.ordersByStatus || Object.keys(stats.ordersByStatus).length === 0) && (
                  <p className="text-slate-500 text-sm">Nenhum pedido no sistema ainda.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <History size={20} className="text-emerald-600" />
                  Auditoria
                </h2>
                <Link
                  href="/erp-canna/auditoria"
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  Ver logs <ArrowRight size={14} />
                </Link>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.auditCountLast30Days}</p>
              <p className="text-sm text-slate-500">registros nos últimos 30 dias</p>
            </div>
          </div>

          {/* Pedidos recentes */}
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Pedidos recentes</h2>
              <Link
                href="/erp-canna/pedidos"
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                Ver todos <ArrowRight size={14} />
              </Link>
            </div>
            {stats.recentOrders?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-600">
                      <th className="pb-2 pr-4">Paciente</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-slate-100">
                        <td className="py-3 pr-4">
                          <span className="font-medium text-slate-900">{order.patient?.name || '—'}</span>
                          {order.patient?.email && (
                            <span className="block text-xs text-slate-500">{order.patient.email}</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Nenhum pedido recente.</p>
            )}
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
