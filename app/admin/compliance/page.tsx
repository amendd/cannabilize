'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, FileCheck, History, UserCheck, ArrowRight } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { canAccessAdmin, canAccessCompliance } from '@/lib/roles-permissions';

export default function AdminCompliancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && !canAccessAdmin(session?.user?.role)) {
      router.push('/');
      return;
    }
  }, [status, session?.user?.role, router]);

  if (status === 'loading') return <LoadingPage />;
  if (!session || !canAccessAdmin(session.user?.role)) return null;
  if (!canAccessCompliance(session.user?.role)) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-red-600">Sem permissão para acessar Compliance & LGPD.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Compliance & LGPD' }]} />
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-slate-900">Compliance & LGPD</h1>
        <p className="text-slate-600 mt-1">
          Registro de consentimentos, histórico de acessos e solicitações do titular (acesso, correção, exclusão lógica).
        </p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/gpp-canna/consentimentos"
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:border-blue-300 hover:shadow-md transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-200">
              <FileCheck size={28} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Consentimentos</h2>
              <p className="text-sm text-slate-600">Termos aceitos, versão, data e revogação</p>
            </div>
          </div>
          <ArrowRight size={20} className="text-slate-400 group-hover:text-blue-600" />
        </Link>

        <Link
          href="/gpp-canna/auditoria"
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:border-blue-300 hover:shadow-md transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200">
              <History size={28} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Auditoria</h2>
              <p className="text-sm text-slate-600">Quem acessou, quando e o quê — logs imutáveis</p>
            </div>
          </div>
          <ArrowRight size={20} className="text-slate-400 group-hover:text-emerald-600" />
        </Link>
      </div>

      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
        <strong>Solicitações do titular (LGPD):</strong> acesso aos dados, correção e exclusão lógica devem ser tratadas pelo fluxo de Compliance. Nada é deletado definitivamente (soft delete). Registre cada solicitação e o atendimento na auditoria.
      </div>
    </div>
  );
}
