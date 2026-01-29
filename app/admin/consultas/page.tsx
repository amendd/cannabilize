'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ConsultationsTable from '@/components/admin/ConsultationsTable';
import ConsultationFilters from '@/components/admin/ConsultationFilters';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import LoadingPage from '@/components/ui/Loading';

export default function AdminConsultationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user.role !== 'ADMIN' && session?.user.role !== 'DOCTOR') {
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Breadcrumbs items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Consultas' },
          ]} />
          <h1 className="text-3xl font-bold text-gray-900 font-display">Gestão de Consultas</h1>
        </motion.div>

        <ConsultationFilters filters={filters} onFiltersChange={setFilters} />
        <ConsultationsTable filters={filters} />
      </div>
    </div>
  );
}
