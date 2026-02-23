'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Download, LayoutGrid, List } from 'lucide-react';
import ConsultationFilters from '@/components/admin/ConsultationFilters';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import LoadingPage from '@/components/ui/Loading';
import { canAccessAdmin } from '@/lib/roles-permissions';

const ConsultationsTable = dynamic(
  () => import('@/components/admin/ConsultationsTable'),
  { ssr: false, loading: () => <div className="bg-white rounded-lg shadow p-6 min-h-[300px] animate-pulse" /> }
);

export default function AdminConsultationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
  });
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && !canAccessAdmin(session?.user?.role) && session?.user?.role !== 'DOCTOR') {
      router.push('/');
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.role]);

  if (status === 'loading') {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Breadcrumbs items={[
              { label: 'Admin', href: '/admin' },
              { label: 'Consultas' },
            ]} />
            <h1 className="text-3xl font-bold text-gray-900 font-display">Gestão de Consultas</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 mr-2">Visualização:</span>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${
                viewMode === 'list' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <List size={18} />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${
                viewMode === 'kanban' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <LayoutGrid size={18} />
              Kanban
            </button>
            <a
              href="/api/admin/consultations?format=csv"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 text-sm font-medium ml-2"
              download="consultas.csv"
            >
              <Download size={18} />
              Exportar CSV
            </a>
          </div>
        </div>

        <ConsultationFilters filters={filters} onFiltersChange={setFilters} />
        <ConsultationsTable filters={filters} viewMode={viewMode} />
      </div>
    </div>
  );
}
