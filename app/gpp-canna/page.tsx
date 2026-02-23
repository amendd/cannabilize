'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  UserCircle,
  FileText,
  ShieldCheck,
  History,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  FileStack,
} from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  ISSUED: 'Emitida',
  USED: 'Utilizada',
  EXPIRED: 'Vencida',
  CANCELLED: 'Cancelada',
};

export default function GppCannaDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalPatients: number;
    totalPrescriptions: number;
    prescriptionsExpiringSoon: number;
    consentCount: number;
    auditLast30Days: number;
    prescriptionsByStatus: Record<string, number>;
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
      fetch('/api/gpp-canna/stats')
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
        <h1 className="text-2xl font-bold text-slate-900">Visão geral — GPP CANNA</h1>
        <p className="text-slate-500 font-medium mt-0.5">Gestão de Pacientes e Prescrições</p>
        <p className="text-slate-600 mt-1">
          Compliance LGPD e ANVISA. Dados organizados e trilhas de auditoria.
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Link
              href="/gpp-canna/pacientes"
              className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-4"
            >
              <div className="bg-indigo-500 p-3 rounded-lg flex-shrink-0">
                <UserCircle size={24} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.totalPatients}</p>
                <p className="text-sm text-slate-600 font-medium">Pacientes</p>
              </div>
            </Link>
            <Link
              href="/gpp-canna/prescricoes"
              className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-4"
            >
              <div className="bg-violet-500 p-3 rounded-lg flex-shrink-0">
                <FileText size={24} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.totalPrescriptions}</p>
                <p className="text-sm text-slate-600 font-medium">Prescrições</p>
              </div>
            </Link>
            <Link
              href="/gpp-canna/prescricoes?filtro=vencendo"
              className={`rounded-xl shadow-sm p-5 border flex items-center gap-4 transition-all ${
                stats.prescriptionsExpiringSoon > 0
                  ? 'bg-amber-50 border-amber-300 hover:border-amber-500'
                  : 'bg-white border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div className={`p-3 rounded-lg flex-shrink-0 ${stats.prescriptionsExpiringSoon > 0 ? 'bg-amber-500' : 'bg-slate-500'}`}>
                <CalendarClock size={24} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.prescriptionsExpiringSoon}</p>
                <p className="text-sm text-slate-600 font-medium">Vencendo em 30 dias</p>
                {stats.prescriptionsExpiringSoon > 0 && (
                  <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                    <AlertTriangle size={12} /> Alertas
                  </p>
                )}
              </div>
            </Link>
            <Link
              href="/gpp-canna/consentimentos"
              className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-4"
            >
              <div className="bg-emerald-500 p-3 rounded-lg flex-shrink-0">
                <ShieldCheck size={24} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.consentCount}</p>
                <p className="text-sm text-slate-600 font-medium">Consentimentos ativos</p>
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <FileText size={20} className="text-indigo-600" />
                  Prescrições por status
                </h2>
                <Link
                  href="/gpp-canna/prescricoes"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  Ver todas <ArrowRight size={14} />
                </Link>
              </div>
              <div className="flex flex-wrap gap-3">
                {Object.entries(stats.prescriptionsByStatus || {}).map(([statusKey, count]) => (
                  <span
                    key={statusKey}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium"
                  >
                    {STATUS_LABELS[statusKey] || statusKey}: {count}
                  </span>
                ))}
                {(!stats.prescriptionsByStatus || Object.keys(stats.prescriptionsByStatus).length === 0) && (
                  <p className="text-slate-500 text-sm">Nenhuma prescrição no sistema ainda.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <History size={20} className="text-indigo-600" />
                  Auditoria
                </h2>
                <Link
                  href="/gpp-canna/auditoria"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  Ver logs <ArrowRight size={14} />
                </Link>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.auditLast30Days}</p>
              <p className="text-sm text-slate-500">registros nos últimos 30 dias</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
              <h3 className="font-semibold text-indigo-900 flex items-center gap-2 mb-2">
                <ShieldCheck size={20} /> O que é o GPP CANNA
              </h3>
              <p className="text-sm text-indigo-800">
                Módulo de Gestão de Pacientes e Prescrições: cadastro completo, upload e versionamento de prescrições,
                vínculo paciente-médico-pedido, controle de validade e trilhas de auditoria para conformidade com LGPD e ANVISA.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-2">
                <FileStack size={20} /> Acesso rápido
              </h3>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/gpp-canna/pacientes"
                  className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:border-indigo-200"
                >
                  Pacientes
                </Link>
                <Link
                  href="/gpp-canna/prescricoes"
                  className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:border-indigo-200"
                >
                  Prescrições
                </Link>
                <Link
                  href="/gpp-canna/consentimentos"
                  className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:border-indigo-200"
                >
                  Consentimentos
                </Link>
                <Link
                  href="/gpp-canna/auditoria"
                  className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:border-indigo-200"
                >
                  Auditoria
                </Link>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800">
          Não foi possível carregar as estatísticas. Execute a migração do Prisma (patient_consents, prescription_documents) e tente novamente.
        </div>
      )}
    </div>
  );
}
