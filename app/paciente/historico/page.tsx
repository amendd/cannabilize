'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, FileText, User, ExternalLink, Clock, IdCard } from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingPage from '@/components/ui/Loading';
import { useEffectivePatientId } from '@/components/impersonation/useEffectivePatientId';

type HistoricoData = {
  consultations: Array<{
    id: string;
    scheduledAt: string;
    status: string;
    nextReturnDate: string | null;
    doctor: { id: string; name: string; crm: string; specialization: string | null } | null;
    prescription: { id: string; issuedAt: string; status: string } | null;
    filesCount: number;
  }>;
  prescriptions: any[];
  pathologies: string[];
  timeline: Array<{
    type: 'consultation' | 'prescription';
    id: string;
    date: string;
    title: string;
    subtitle: string;
    status: string;
    nextReturnDate?: string | null;
    hasPrescription?: boolean;
    prescriptionId?: string | null;
    filesCount?: number;
    expiresAt?: string | null;
  }>;
};

export default function MeuHistoricoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { effectivePatientId } = useEffectivePatientId();
  const [data, setData] = useState<HistoricoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user.role !== 'PATIENT') {
      router.push('/');
      return;
    }
  }, [status, session?.user?.role, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/paciente/meu-historico')
      .then((res) => {
        if (!res.ok) throw new Error('Erro ao carregar histórico');
        return res.json();
      })
      .then(setData)
      .catch(() => setData({ consultations: [], prescriptions: [], pathologies: [], timeline: [] }))
      .finally(() => setLoading(false));
  }, [status]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const formatDateTime = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const statusLabel: Record<string, string> = {
    SCHEDULED: 'Agendada',
    IN_PROGRESS: 'Em andamento',
    COMPLETED: 'Realizada',
    CANCELLED: 'Cancelada',
    NO_SHOW: 'Não compareceu',
  };

  if (status === 'loading' || loading) {
    return <LoadingPage />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <IdCard size={28} className="text-purple-600" />
          Meu histórico
        </h1>
        <p className="text-gray-600 mt-1">
          Suas consultas e receitas em ordem cronológica. Seus dados estão seguros e você pode exportá-los a qualquer momento.
        </p>
      </motion.div>

      {data?.pathologies?.length ? (
        <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-100">
          <p className="text-sm font-medium text-purple-800">Patologias relacionadas ao tratamento</p>
          <p className="text-purple-700 mt-1">{data.pathologies.join(', ')}</p>
        </div>
      ) : null}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <h2 className="px-6 py-4 bg-gray-50 border-b border-gray-200 font-semibold text-gray-900 flex items-center gap-2">
            <Clock size={20} />
            Linha do tempo
          </h2>
          <ul className="divide-y divide-gray-100">
            {(data?.timeline ?? []).length === 0 ? (
              <li className="px-6 py-8 text-center text-gray-500">
                Nenhum registro ainda. Após consultas e receitas, eles aparecerão aqui.
              </li>
            ) : (
              (data?.timeline ?? []).map((item) => (
                <li key={`${item.type}-${item.id}`} className="px-6 py-4 hover:bg-gray-50/50">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.type === 'consultation' ? (
                          <Calendar size={18} className="text-purple-600 flex-shrink-0" />
                        ) : (
                          <FileText size={18} className="text-green-600 flex-shrink-0" />
                        )}
                        <span className="font-medium text-gray-900">{item.title}</span>
                        <span className="text-sm text-gray-500">{item.subtitle}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                          {statusLabel[item.status] || item.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {formatDateTime(item.date)}
                        {item.nextReturnDate && (
                          <span className="text-purple-600 ml-2">
                            • Retorno previsto: {formatDate(item.nextReturnDate)}
                          </span>
                        )}
                        {item.expiresAt && (
                          <span className="text-gray-500 ml-2">
                            • Válida até: {formatDate(item.expiresAt)}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.type === 'consultation' && (
                        <Link
                          href={`/paciente/consultas/${item.id}`}
                          className="inline-flex items-center gap-1 text-sm text-purple-700 hover:underline"
                        >
                          Ver consulta
                          <ExternalLink size={14} />
                        </Link>
                      )}
                      {item.type === 'prescription' && (
                        <Link
                          href="/paciente/receitas"
                          className="inline-flex items-center gap-1 text-sm text-green-700 hover:underline"
                        >
                          Ver receitas
                          <ExternalLink size={14} />
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <Calendar size={20} className="text-purple-600" />
              Consultas
            </h3>
            <p className="text-2xl font-bold text-gray-900">{data?.consultations?.length ?? 0}</p>
            <Link href="/paciente/consultas" className="text-sm text-purple-600 hover:underline mt-2 inline-block">
              Ver todas →
            </Link>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <FileText size={20} className="text-green-600" />
              Receitas
            </h3>
            <p className="text-2xl font-bold text-gray-900">{data?.prescriptions?.length ?? 0}</p>
            <Link href="/paciente/receitas" className="text-sm text-green-600 hover:underline mt-2 inline-block">
              Ver todas →
            </Link>
          </div>
        </section>
      </motion.div>
    </div>
  );
}
