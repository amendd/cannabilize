'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList, ArrowLeft, Shield, FileCheck, History } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';

export default function ErpCompliancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [consentCount, setConsentCount] = useState<number | null>(null);
  const [auditCount, setAuditCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

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
    Promise.all([
      fetch('/api/erp-canna/compliance-summary').then((r) => r.json()),
    ])
      .then(([summary]) => {
        setConsentCount(summary?.consentCount ?? null);
        setAuditCount(summary?.auditCountLast30 ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.user?.role]);

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
          <ClipboardList size={24} className="text-emerald-600" />
          Compliance
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          LGPD (consentimentos, solicitações do titular), ANVISA (rastreabilidade, histórico). Logs imutáveis.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          Carregando...
        </div>
      ) : (
        <div className="space-y-6">
          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <Shield size={20} className="text-emerald-600" />
              LGPD
            </h2>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• Logs de acesso a dados sensíveis (auditoria)</li>
              <li>• Registro de consentimentos versionados por paciente</li>
              <li>• Gestão de solicitações do titular (acesso, correção, exclusão, portabilidade)</li>
              <li>• Política de retenção configurável nas Configurações</li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/erp-canna/auditoria"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200"
              >
                <History size={18} /> Auditoria ({auditCount ?? '—'} últimos 30 dias)
              </Link>
              {consentCount !== null && (
                <span className="inline-flex items-center px-4 py-2 bg-emerald-50 text-emerald-800 rounded-lg text-sm">
                  Consentimentos registrados: {consentCount}
                </span>
              )}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <FileCheck size={20} className="text-emerald-600" />
              ANVISA / RDC
            </h2>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• Relatórios de rastreabilidade (prescrição → pedido → pagamento → logística)</li>
              <li>• Histórico de prescrições e pedidos por paciente</li>
              <li>• Cadeia completa de eventos para auditoria regulatória</li>
            </ul>
            <div className="mt-4">
              <Link
                href="/erp-canna/autorizacoes"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-medium hover:bg-emerald-200"
              >
                Autorizações ANVISA
              </Link>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
