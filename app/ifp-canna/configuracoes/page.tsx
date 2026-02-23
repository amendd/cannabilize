'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { canAccessIfp, canEditFinancialConfig } from '@/lib/ifp-permissions';
import { Settings, ArrowLeft, ExternalLink } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';

export default function ConfiguracoesFinanceirasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=' + encodeURIComponent('/ifp-canna/configuracoes'));
      return;
    }
    if (status === 'authenticated' && session?.user?.role != null && !canAccessIfp(session.user.role)) {
      router.push('/admin');
      return;
    }
  }, [status, session?.user?.role, router]);

  if (status === 'loading') return <LoadingPage />;
  if (!session || !canAccessIfp(session.user?.role)) return null;

  const canEdit = canEditFinancialConfig(session.user?.role);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/ifp-canna"
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
        >
          <ArrowLeft size={20} /> Voltar
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings size={28} className="text-indigo-600" />
          Configurações Financeiras
        </h1>
      </div>

      <p className="text-slate-600 mb-6">
        Gateways ativos, meios de pagamento permitidos, políticas de cobrança, regras de cancelamento e SLA financeiro.
      </p>

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Métodos de pagamento</h2>
          <p className="text-slate-600 text-sm mb-4">
            Configure PIX, cartão, boleto e gateways (Stripe, Mercado Pago, etc.). Defina taxas e valores mínimos/máximos.
          </p>
          {canEdit ? (
            <Link
              href="/admin/pagamentos"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              Abrir no Admin <ExternalLink size={16} />
            </Link>
          ) : (
            <p className="text-slate-500 text-sm">Apenas Admin Financeiro pode editar.</p>
          )}
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-sm text-slate-600">
          <h2 className="font-semibold text-slate-800 mb-2">Políticas e SLA</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Cobrança paga não pode ser editada.</li>
            <li>Cancelamento de cobrança gera log imutável.</li>
            <li>Pagamento não conciliado pode bloquear avanço operacional.</li>
            <li>Divergência de conciliação gera alerta financeiro.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
