'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FileCheck, ArrowLeft } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  UNDER_REVIEW: 'Em análise',
};

interface Auth {
  id: string;
  prescriptionId: string;
  patientId: string;
  status: string;
  createdAt: string;
  prescription?: {
    consultation?: {
      patient?: { name: string; email: string };
    };
  };
}

export default function ErpAutorizacoesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [authorizations, setAuthorizations] = useState<Auth[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

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
      const url = filterStatus ? `/api/anvisa?status=${filterStatus}` : '/api/anvisa';
      fetch(url)
        .then((res) => res.json())
        .then((data) => setAuthorizations(Array.isArray(data) ? data : []))
        .catch(() => setAuthorizations([]))
        .finally(() => setLoading(false));
    }
  }, [session?.user?.role, filterStatus]);

  const updateStatus = (id: string, newStatus: string) => {
    fetch(`/api/anvisa/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        toast.success('Status atualizado');
        setAuthorizations((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
        );
      })
      .catch((err) => toast.error(err.message || 'Erro ao atualizar'));
  };

  if (status === 'loading') return <LoadingPage />;
  if (!session || session.user.role !== 'ADMIN') return null;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/erp-canna"
            className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mb-2"
          >
            <ArrowLeft size={16} /> Voltar ao dashboard
          </Link>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileCheck size={24} className="text-emerald-600" />
            Autorizações ANVISA
          </h1>
          <p className="text-slate-600 text-sm mt-1">Workflow de autorizações para importação e conformidade regulatória.</p>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-full sm:w-40"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : authorizations.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nenhuma autorização encontrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Paciente</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Data</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {authorizations.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      {a.prescription?.consultation?.patient?.name || '—'}
                      {a.prescription?.consultation?.patient?.email && (
                        <span className="block text-xs text-slate-500">
                          {a.prescription.consultation.patient.email}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {STATUS_LABELS[a.status] || a.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(a.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      {a.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => updateStatus(a.id, 'APPROVED')}
                            className="text-xs text-emerald-600 hover:underline"
                          >
                            Aprovar
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStatus(a.id, 'REJECTED')}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Rejeitar
                          </button>
                        </div>
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
