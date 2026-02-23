'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, User, Calendar, RotateCcw } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

const TYPE_LABELS: Record<string, string> = {
  DATA_PROCESSING: 'Tratamento de dados',
  SHARE_CLINIC: 'Compartilhamento com clínica',
  SHARE_ANVISA: 'Compartilhamento ANVISA',
  MARKETING: 'Comunicação de marketing',
  TELEMEDICINE: 'Telemedicina',
};

interface Consent {
  id: string;
  patientId: string;
  type: string;
  version: string;
  consentedAt: string;
  revokedAt: string | null;
  patient?: { id: string; name: string; email: string };
}

export default function GppConsentimentosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdParam = searchParams.get('patientId');
  const [consents, setConsents] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterActive, setFilterActive] = useState(true);

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
    if (session?.user?.role !== 'ADMIN') return;
    setLoading(true);
    const params = new URLSearchParams();
    if (patientIdParam) params.set('patientId', patientIdParam);
    if (filterActive) params.set('activeOnly', 'true');
    fetch(`/api/gpp-canna/consents?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setConsents(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session?.user?.role, patientIdParam, filterActive]);

  if (status === 'loading') return <LoadingPage />;
  if (!session || session.user.role !== 'ADMIN') return null;

  return (
    <div className="max-w-7xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'GPP CANNA', href: '/gpp-canna' },
          { label: 'Consentimentos' },
          ...(patientIdParam ? [{ label: 'Paciente' }] : []),
        ]}
      />
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Consentimentos (LGPD)</h1>
        <p className="text-slate-600 mt-1">
          Consentimento explícito do paciente. Base legal para dados sensíveis e compartilhamento.
        </p>
      </motion.div>

      <div className="flex items-center gap-4 mb-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filterActive}
            onChange={(e) => setFilterActive(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-slate-700">Apenas ativos (não revogados)</span>
        </label>
        {patientIdParam && (
          <Link
            href="/gpp-canna/consentimentos"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Ver todos
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Carregando...</div>
        ) : consents.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ShieldCheck size={48} className="mx-auto mb-3 text-slate-300" />
            <p>Nenhum consentimento encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                  <th className="pb-3 pt-4 px-4 font-semibold">Paciente</th>
                  <th className="pb-3 pt-4 px-4 font-semibold">Tipo</th>
                  <th className="pb-3 pt-4 px-4 font-semibold">Versão</th>
                  <th className="pb-3 pt-4 px-4 font-semibold">Data consentimento</th>
                  <th className="pb-3 pt-4 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {consents.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900">{c.patient?.name || c.patientId}</span>
                      {c.patient?.email && (
                        <span className="block text-xs text-slate-500">{c.patient.email}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{TYPE_LABELS[c.type] || c.type}</td>
                    <td className="py-3 px-4">{c.version}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(c.consentedAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      {c.revokedAt ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          <RotateCcw size={12} /> Revogado em {new Date(c.revokedAt).toLocaleDateString('pt-BR')}
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Ativo
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
