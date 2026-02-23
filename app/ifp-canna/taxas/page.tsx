'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { canAccessIfp } from '@/lib/ifp-permissions';
import { FileText, ArrowLeft } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  gateway: string | null;
  enabled: boolean;
  fee: number | null;
  feeType: string | null;
  minAmount: number | null;
  maxAmount: number | null;
}

export default function TaxasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=' + encodeURIComponent('/ifp-canna/taxas'));
      return;
    }
    if (status === 'authenticated' && session?.user?.role != null && !canAccessIfp(session.user.role)) {
      router.push('/admin');
      return;
    }
  }, [status, session?.user?.role, router]);

  useEffect(() => {
    if (!session?.user?.role || !canAccessIfp(session.user.role)) return;
    setLoading(true);
    fetch('/api/admin/payment-methods')
      .then((res) => res.json())
      .then((data) => setMethods(Array.isArray(data) ? data : []))
      .catch(() => setMethods([]))
      .finally(() => setLoading(false));
  }, [session?.user?.role]);

  if (status === 'loading') return <LoadingPage />;
  if (!session || !canAccessIfp(session.user?.role)) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/ifp-canna"
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
        >
          <ArrowLeft size={20} /> Voltar
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileText size={28} className="text-indigo-600" />
          Taxas por gateway
        </h1>
      </div>

      <p className="text-slate-600 mb-6">
        Controle de custos e taxas por meio de pagamento. Cálculo automático de valor líquido (valor bruto − taxa).
      </p>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          Carregando...
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left text-slate-600">
                  <th className="px-4 py-3 font-semibold">Método</th>
                  <th className="px-4 py-3 font-semibold">Gateway</th>
                  <th className="px-4 py-3 font-semibold">Taxa</th>
                  <th className="px-4 py-3 font-semibold">Valor mín./máx.</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {methods.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Nenhum método configurado. Configure em Configurações Financeiras.
                    </td>
                  </tr>
                ) : (
                  methods.map((m) => (
                    <tr key={m.id} className="border-b border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-900">{m.name}</td>
                      <td className="px-4 py-3 text-slate-600">{m.gateway ?? '—'}</td>
                      <td className="px-4 py-3">
                        {m.fee != null
                          ? m.feeType === 'FIXED'
                            ? `R$ ${m.fee.toFixed(2)}`
                            : `${m.fee}%`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {m.minAmount != null || m.maxAmount != null
                          ? `${m.minAmount ?? '—'} / ${m.maxAmount ?? '—'}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                            m.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {m.enabled ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-sm text-slate-600">
            Para editar taxas e gateways, use{' '}
            <Link href="/ifp-canna/configuracoes" className="text-indigo-600 hover:underline">
              Configurações Financeiras
            </Link>
            .
          </div>
        </div>
      )}
    </div>
  );
}
