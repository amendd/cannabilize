'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Settings, ArrowLeft, Building2, Palette, FileText } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';

export default function ErpConfiguracoesPage() {
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
          <Settings size={24} className="text-emerald-600" />
          Configurações
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Dados da associação/clínica, branding (logo, cores), políticas de retenção e SLAs.
        </p>
      </div>

      <div className="space-y-6">
        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Building2 size={20} className="text-emerald-600" />
            Organização
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Nome, CNPJ, contato e endereço da associação ou clínica. Gerenciado em Entidades → Associações.
          </p>
          <Link
            href="/erp-canna/entidades/associacoes"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200"
          >
            Associações
          </Link>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Palette size={20} className="text-emerald-600" />
            Branding
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Logo e cores da marca. Configuração em Admin → Identidade visual.
          </p>
          <Link
            href="/admin/identidade-visual"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200"
          >
            Identidade visual
          </Link>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <FileText size={20} className="text-emerald-600" />
            Políticas e retenção
          </h2>
          <p className="text-sm text-slate-600">
            Política de retenção de dados (LGPD), termos e consentimentos versionados. Configurável no painel admin.
          </p>
        </section>
      </div>
    </div>
  );
}
