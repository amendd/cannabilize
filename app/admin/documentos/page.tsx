'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileCheck, ArrowRight } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { canAccessAdmin } from '@/lib/roles-permissions';

export default function AdminDocumentosPage() {
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Documentos' }]} />
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-slate-900">Documentos</h1>
        <p className="text-slate-600 mt-1">
          Central de documentos sensíveis: prescrições, laudos, termos de consentimento. Versionamento e trilha de acesso.
        </p>
      </motion.div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-emerald-100 text-emerald-600">
              <FileCheck size={32} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Módulo GPP CANNA</h2>
              <p className="text-sm text-slate-600">
                Listagem, upload e versionamento de documentos de prescrição e acesso controlado.
              </p>
            </div>
          </div>
          <Link
            href="/gpp-canna/documentos"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Abrir Documentos
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
