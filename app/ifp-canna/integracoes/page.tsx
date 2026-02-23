'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { canAccessIfp } from '@/lib/ifp-permissions';
import { Plug, ArrowLeft, CheckCircle } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';

export default function IntegracoesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [methods, setMethods] = useState<Array<{ name: string; type: string; gateway: string | null; enabled: boolean; webhookUrl: string | null }>>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=' + encodeURIComponent('/ifp-canna/integracoes'));
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
          <Plug size={28} className="text-indigo-600" />
          Integrações
        </h1>
      </div>

      <p className="text-slate-600 mb-6">
        Gateways de pagamento (PIX, cartão, boleto). Webhooks obrigatórios para confirmação; idempotência e retry automático recomendados.
      </p>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          Carregando...
        </div>
      ) : (
        <div className="space-y-4">
          {methods.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
              Nenhum gateway configurado. Configure em Configurações Financeiras ou Admin → Pagamentos.
            </div>
          ) : (
            methods.map((m) => (
              <div
                key={m.name}
                className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-between"
              >
                <div>
                  <h2 className="font-semibold text-slate-900">{m.name}</h2>
                  <p className="text-sm text-slate-500">Tipo: {m.type} {m.gateway ? ` · Gateway: ${m.gateway}` : ''}</p>
                  {m.webhookUrl && (
                    <p className="text-xs text-slate-400 mt-1 truncate max-w-md">Webhook: {m.webhookUrl}</p>
                  )}
                </div>
                <span className={m.enabled ? 'text-emerald-600' : 'text-slate-400'}>
                  {m.enabled ? <CheckCircle size={24} /> : 'Inativo'}
                </span>
              </div>
            ))
          )}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-sm text-indigo-800">
            <strong>Requisitos:</strong> Webhooks obrigatórios para confirmação de pagamento; processamento idempotente; retry automático em falhas temporárias.
          </div>
        </div>
      )}
    </div>
  );
}
