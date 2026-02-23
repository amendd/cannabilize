'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/next-auth-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, ArrowLeft, AlertTriangle, Search } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';

const STATUS_LABELS: Record<string, string> = {
  ISSUED: 'Ativa',
  USED: 'Utilizada',
  EXPIRED: 'Vencida',
  CANCELLED: 'Cancelada',
};

interface PrescriptionRow {
  id: string;
  status: string;
  issuedAt: string;
  expiresAt: string | null;
  patient: { id: string; name: string; email: string };
  doctor: { id: string; name: string };
  consultation?: { id: string };
}

export default function ErpPrescricoesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [list, setList] = useState<PrescriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

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
    if (filter !== 'ALL') params.set('status', filter);
    if (search.trim()) params.set('search', search.trim());
    fetch(`/api/erp-canna/prescriptions?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setList(data.prescriptions ?? []);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [session?.user?.role, filter, search]);

  if (status === 'loading') return <LoadingPage />;
  if (!session || session.user.role !== 'ADMIN') return null;

  const isExpired = (exp: string | null) => exp && new Date(exp) < new Date();
  const isExpiringSoon = (exp: string | null) => {
    if (!exp) return false;
    const d = new Date(exp);
    const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return d >= new Date() && d <= in30;
  };

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
            <FileText size={24} className="text-emerald-600" />
            Prescrições
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Controle de validade, vínculo com paciente e médico. Alertas de vencimento.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Paciente ou médico..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm w-48"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="ALL">Todos os status</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nenhuma prescrição encontrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Paciente</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Médico</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Emissão</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Validade</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Alerta</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => {
                  const expired = isExpired(p.expiresAt);
                  const soon = isExpiringSoon(p.expiresAt);
                  return (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-900">{p.patient?.name ?? '—'}</span>
                        {p.patient?.email && (
                          <span className="block text-xs text-slate-500">{p.patient.email}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{p.doctor?.name ?? '—'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            p.status === 'ISSUED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'EXPIRED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {STATUS_LABELS[p.status] ?? p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {p.issuedAt ? new Date(p.issuedAt).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="py-3 px-4">
                        {expired && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600">
                            <AlertTriangle size={12} /> Vencida
                          </span>
                        )}
                        {!expired && soon && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                            <AlertTriangle size={12} /> Vence em breve
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
