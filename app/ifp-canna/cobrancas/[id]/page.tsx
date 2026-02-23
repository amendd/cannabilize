'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { canAccessIfp, canCancelCharge } from '@/lib/ifp-permissions';
import { ArrowLeft, CreditCard } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';
import toast from 'react-hot-toast';

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
function formatDate(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const STATUS_LABEL: Record<string, string> = {
  CREATED: 'Criada',
  SENT: 'Enviada',
  PAID: 'Paga',
  OVERDUE: 'Vencida',
  CANCELLED: 'Cancelada',
};

export default function CobrancaDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [charge, setCharge] = useState<{
    id: string;
    amount: number;
    description: string | null;
    dueDate: string;
    status: string;
    chargeType: string;
    cancelledAt: string | null;
    createdAt: string;
    patient: { name: string; email: string; phone: string | null };
    consultation?: { id: string; scheduledAt: string; status: string };
    erpOrder?: { id: string; status: string; totalAmount: number | null; organization?: { name: string } };
    prescription?: { id: string; status: string };
    payments: Array<{ id: string; amount: number; status: string; paidAt: string | null }>;
  } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user?.role != null && !canAccessIfp(session.user.role)) {
      router.push('/admin');
      return;
    }
  }, [status, session?.user?.role, router]);

  useEffect(() => {
    if (!id || !session?.user?.role || !canAccessIfp(session.user.role)) return;
    setLoading(true);
    fetch('/api/ifp-canna/charges/' + id)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setCharge(data);
      })
      .catch(() => setCharge(null))
      .finally(() => setLoading(false));
  }, [id, session?.user?.role]);

  const handleCancel = async () => {
    if (!charge || charge.status === 'CANCELLED' || charge.status === 'PAID') return;
    if (!confirm('Cancelar esta cobrança? Esta ação gera log imutável.')) return;
    try {
      const res = await fetch('/api/ifp-canna/charges/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao cancelar');
      toast.success('Cobrança cancelada.');
      setCharge((c) => (c ? { ...c, status: 'CANCELLED', cancelledAt: new Date().toISOString() } : null));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cancelar');
    }
  };

  if (status === 'loading') return <LoadingPage />;
  if (!session || !canAccessIfp(session.user?.role)) return null;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center text-slate-500">
        Carregando...
      </div>
    );
  }

  if (!charge) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <p className="text-amber-600">Cobrança não encontrada.</p>
        <Link href="/ifp-canna/cobrancas" className="text-indigo-600 hover:underline mt-2 inline-block">
          Voltar à lista
        </Link>
      </div>
    );
  }

  const canCancel = canCancelCharge(session.user?.role) && charge.status !== 'CANCELLED' && charge.status !== 'PAID' && !charge.payments?.some((p) => p.status === 'PAID');

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/ifp-canna/cobrancas"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
          >
            <ArrowLeft size={20} /> Voltar
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard size={28} className="text-indigo-600" />
            Cobrança #{charge.id.slice(0, 8)}
          </h1>
        </div>
        <span
          className={`inline-flex px-3 py-1 rounded-lg text-sm font-medium ${
            charge.status === 'PAID'
              ? 'bg-emerald-100 text-emerald-800'
              : charge.status === 'CANCELLED'
              ? 'bg-slate-100 text-slate-700'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {STATUS_LABEL[charge.status] ?? charge.status}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-200">
        <div className="p-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase mb-2">Valor e vencimento</h2>
          <p className="text-2xl font-bold text-slate-900">{formatBRL(charge.amount)}</p>
          <p className="text-slate-600">Vencimento: {formatDate(charge.dueDate)}</p>
          {charge.description && (
            <p className="text-slate-600 mt-2">Descrição: {charge.description}</p>
          )}
          <p className="text-slate-500 text-sm mt-1">Tipo: {charge.chargeType === 'RECURRING' ? 'Recorrente' : 'Avulsa'}</p>
        </div>
        <div className="p-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase mb-2">Paciente</h2>
          <p className="font-medium text-slate-900">{charge.patient.name}</p>
          <p className="text-slate-600">{charge.patient.email}</p>
          {charge.patient.phone && <p className="text-slate-600">{charge.patient.phone}</p>}
        </div>
        {(charge.erpOrder || charge.consultation || charge.prescription) && (
          <div className="p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase mb-2">Vínculos</h2>
            {charge.erpOrder && (
              <p>
                Pedido: <Link href="/erp-canna/pedidos" className="text-indigo-600 hover:underline">#{charge.erpOrder.id.slice(0, 8)}</Link>
                {charge.erpOrder.organization?.name && ` — ${charge.erpOrder.organization.name}`}
              </p>
            )}
            {charge.consultation && (
              <p>
                Consulta: <Link href={`/admin/consultas/${charge.consultation.id}`} className="text-indigo-600 hover:underline">#{charge.consultation.id.slice(0, 8)}</Link>
              </p>
            )}
            {charge.prescription && <p>Prescrição: #{charge.prescription.id.slice(0, 8)}</p>}
          </div>
        )}
        {charge.payments && charge.payments.length > 0 && (
          <div className="p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase mb-2">Pagamentos</h2>
            <ul className="space-y-1">
              {charge.payments.map((p) => (
                <li key={p.id} className="flex justify-between text-sm">
                  <span>{formatBRL(p.amount)} — {p.status}</span>
                  {p.paidAt && <span>{formatDate(p.paidAt)}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
        {charge.cancelledAt && (
          <div className="p-6 bg-slate-50">
            <p className="text-sm text-slate-600">Cancelada em {formatDate(charge.cancelledAt)}</p>
          </div>
        )}
        {canCancel && (
          <div className="p-6 border-t border-slate-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
            >
              Cancelar cobrança
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
