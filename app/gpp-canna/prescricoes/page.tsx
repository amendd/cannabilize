'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileText, Download, Calendar, User, Search, Filter, Eye, Pill } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  issuedAt: string;
  expiresAt?: string;
  status: string;
  pdfUrl?: string;
  consultation?: { patient: { name: string; email: string }; doctor?: { name: string; crm: string } };
  doctor?: { name: string; crm: string };
  medications?: Array<{ medication: { name: string }; quantity?: string; dosage?: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  ISSUED: 'Emitida',
  USED: 'Utilizada',
  EXPIRED: 'Vencida',
  CANCELLED: 'Cancelada',
};

export default function GppPrescricoesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filtroVencendo = searchParams.get('filtro') === 'vencendo';
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
    fetch('/api/prescriptions')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPrescriptions(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session?.user?.role]);

  let filtered = [...prescriptions];
  if (filtroVencendo) {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    filtered = filtered.filter(
      (p) => p.expiresAt && new Date(p.expiresAt) >= now && new Date(p.expiresAt) <= in30 && p.status === 'ISSUED'
    );
  }
  if (statusFilter !== 'all') filtered = filtered.filter((p) => p.status === statusFilter);
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        (p.consultation?.patient?.name || '').toLowerCase().includes(term) ||
        (p.consultation?.patient?.email || '').toLowerCase().includes(term) ||
        (p.doctor?.name || '').toLowerCase().includes(term)
    );
  }

  if (status === 'loading') return <LoadingPage />;
  if (!session || session.user.role !== 'ADMIN') return null;

  return (
    <div className="max-w-7xl mx-auto">
      <Breadcrumbs items={[{ label: 'GPP CANNA', href: '/gpp-canna' }, { label: 'Prescrições' }]} />
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Prescrições</h1>
        <p className="text-slate-600 mt-1">
          Controle de validade, histórico e vínculo paciente-médico. Upload e versionamento em Documentos.
        </p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por paciente ou médico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        {filtroVencendo && (
          <Link
            href="/gpp-canna/prescricoes"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-100 text-amber-800 text-sm font-medium"
          >
            <Filter size={18} /> Remover filtro &quot;vencendo&quot;
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText size={48} className="mx-auto mb-3 text-slate-300" />
            <p>Nenhuma prescrição encontrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                  <th className="pb-3 pt-4 px-4 font-semibold">Paciente</th>
                  <th className="pb-3 pt-4 px-4 font-semibold">Médico</th>
                  <th className="pb-3 pt-4 px-4 font-semibold">Emissão</th>
                  <th className="pb-3 pt-4 px-4 font-semibold">Validade</th>
                  <th className="pb-3 pt-4 px-4 font-semibold">Status</th>
                  <th className="pb-3 pt-4 px-4 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900">{p.consultation?.patient?.name || '—'}</span>
                      {p.consultation?.patient?.email && (
                        <span className="block text-xs text-slate-500">{p.consultation.patient.email}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-700">{p.doctor?.name || '—'}</span>
                      {p.doctor?.crm && <span className="block text-xs text-slate-500">CRM {p.doctor.crm}</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(p.issuedAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      {p.expiresAt
                        ? new Date(p.expiresAt).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          p.status === 'EXPIRED'
                            ? 'bg-red-100 text-red-800'
                            : p.status === 'ISSUED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {STATUS_LABELS[p.status] || p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/receita/${p.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-medium"
                      >
                        <Eye size={14} /> Ver
                      </Link>
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
