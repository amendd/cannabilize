'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { canAccessIfp, canCreateCharge } from '@/lib/ifp-permissions';
import { ArrowLeft, CreditCard } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';
import toast from 'react-hot-toast';

export default function NovaCobrancaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Array<{ id: string; name: string; email: string }>>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=' + encodeURIComponent('/ifp-canna/cobrancas/nova'));
      return;
    }
    if (status === 'authenticated' && session?.user?.role != null && !canAccessIfp(session.user.role)) {
      router.push('/admin');
      return;
    }
  }, [status, session?.user?.role, router]);

  useEffect(() => {
    if (session?.user?.role && canCreateCharge(session.user.role)) {
      fetch('/api/admin/patients?limit=500')
        .then((res) => res.json())
        .then((data) => setPatients(data.patients || data || []))
        .catch(() => setPatients([]));
    }
  }, [session?.user?.role]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const patientId = (form.querySelector('[name="patientId"]') as HTMLSelectElement)?.value;
    const amount = (form.querySelector('[name="amount"]') as HTMLInputElement)?.value;
    const dueDate = (form.querySelector('[name="dueDate"]') as HTMLInputElement)?.value;
    const description = (form.querySelector('[name="description"]') as HTMLInputElement)?.value;
    const chargeType = (form.querySelector('[name="chargeType"]') as HTMLSelectElement)?.value;

    if (!patientId || !amount || !dueDate) {
      toast.error('Preencha paciente, valor e vencimento.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/ifp-canna/charges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          amount: parseFloat(amount.replace(',', '.')),
          dueDate,
          description: description || undefined,
          chargeType: chargeType === 'RECURRING' ? 'RECURRING' : 'ONE_TIME',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar cobrança');
      toast.success('Cobrança criada com sucesso.');
      router.push('/ifp-canna/cobrancas');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar cobrança');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') return <LoadingPage />;
  if (!session || !canAccessIfp(session.user?.role)) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/ifp-canna/cobrancas"
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
        >
          <ArrowLeft size={20} /> Voltar
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CreditCard size={28} className="text-indigo-600" />
          Nova cobrança
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Paciente *</label>
          <select
            name="patientId"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">Selecione o paciente</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$) *</label>
          <input
            type="text"
            name="amount"
            required
            placeholder="0,00"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Data de vencimento *</label>
          <input
            type="date"
            name="dueDate"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
          <input
            type="text"
            name="description"
            placeholder="Ex: Consulta, medicamentos..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
          <select name="chargeType" className="w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="ONE_TIME">Avulsa</option>
            <option value="RECURRING">Recorrente</option>
          </select>
        </div>
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Criar cobrança'}
          </button>
          <Link
            href="/ifp-canna/cobrancas"
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
