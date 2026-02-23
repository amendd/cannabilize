'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plug, ArrowLeft, CreditCard, Truck, Webhook } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';

export default function ErpIntegracoesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

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

  if (status === 'loading') return <LoadingPage />;
  if (!session || session.user.role !== 'ADMIN') return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/erp-canna"
          className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mb-2"
        >
          <ArrowLeft size={16} /> Voltar ao dashboard
        </Link>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Plug size={24} className="text-emerald-600" />
          Integrações
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Gateways de pagamento, transportadoras, webhooks. API pública (futura).
        </p>
      </div>

      <div className="space-y-6">
        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <CreditCard size={20} className="text-emerald-600" />
            Pagamento
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Stripe, Pagar.me, Mercado Pago. Configuração de chaves e webhooks em Admin → Configurações.
          </p>
          <Link
            href="/admin/configuracoes"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200"
          >
            Ir para Configurações
          </Link>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Truck size={20} className="text-emerald-600" />
            Logística
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            APIs de transportadoras para cotação, geração de etiqueta e webhooks de status de entrega.
          </p>
          <p className="text-xs text-slate-500">Em breve: integração com Correios e transportadoras parceiras.</p>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Webhook size={20} className="text-emerald-600" />
            Webhooks
          </h2>
          <p className="text-sm text-slate-600">
            Eventos de pagamento e logística podem ser enviados para URLs configuradas (compliance e conciliação).
          </p>
        </section>
      </div>
    </div>
  );
}
