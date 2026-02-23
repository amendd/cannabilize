'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DollarSign, ArrowLeft, CreditCard, FileText } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';

const PAYMENT_STATUS: Record<string, string> = {
  PENDING: 'Pendente',
  PROCESSING: 'Processando',
  PAID: 'Pago',
  FAILED: 'Falhou',
  REFUNDED: 'Reembolsado',
  CANCELLED: 'Cancelado',
};

interface PaymentRow {
  id: string;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  status: string;
  paidAt: string | null;
  createdAt: string;
  patient: { id: string; name: string; email: string };
  erpOrderId: string | null;
}

export default function ErpFinanceiroPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [summary, setSummary] = useState<{ totalPaid: number; totalPending: number; countPaid: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

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
    if (filterStatus !== 'ALL') params.set('status', filterStatus);
    fetch(`/api/erp-canna/finance?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPayments(data.payments ?? []);
        setSummary(data.summary ?? null);
      })
      .catch(() => {
        setPayments([]);
        setSummary(null);
      })
      .finally(() => setLoading(false));
  }, [session?.user?.role, filterStatus]);

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
            <DollarSign size={24} className="text-emerald-600" />
            Financeiro
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Cobranças, registro de pagamentos, conciliação. Pagamentos sempre vinculados a pedidos. Logs imutáveis.
          </p>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
        >
          <option value="ALL">Todos</option>
          {Object.entries(PAYMENT_STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-600">Total pago</p>
            <p className="text-xl font-bold text-emerald-600">
              R$ {summary.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-600">Pendente</p>
            <p className="text-xl font-bold text-amber-600">
              R$ {summary.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-600">Quantidade paga</p>
            <p className="text-xl font-bold text-slate-900">{summary.countPaid}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nenhum pagamento encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Paciente</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Valor</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Forma</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Data pagamento</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900">{p.patient?.name ?? '—'}</span>
                      {p.patient?.email && (
                        <span className="block text-xs text-slate-500">{p.patient.email}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      R$ {p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{p.paymentMethod || '—'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          p.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'PENDING' || p.status === 'PROCESSING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {PAYMENT_STATUS[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {p.paidAt ? new Date(p.paidAt).toLocaleString('pt-BR') : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(p.createdAt).toLocaleString('pt-BR')}
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
