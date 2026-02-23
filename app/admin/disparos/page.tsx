'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Send, Plus, Search } from 'lucide-react';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import LoadingPage from '@/components/ui/Loading';
import { canAccessAdmin } from '@/lib/roles-permissions';

interface EmailStatus {
  hasConfig?: boolean;
  canSend?: boolean;
  provider?: string;
}

interface WhatsAppConfig {
  enabled?: boolean;
  provider?: string;
}

export default function AdminDisparosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && !canAccessAdmin(session?.user?.role)) {
      router.push('/');
      return;
    }
    if (!canAccessAdmin(session?.user?.role)) return;

    Promise.all([
      fetch('/api/admin/email/status').then((r) => (r.ok ? r.json() : {})),
      fetch('/api/admin/whatsapp?provider=TWILIO').then((r) => (r.ok ? r.json() : {})),
    ])
      .then(([email, whatsapp]) => {
        setEmailStatus(email);
        setWhatsappConfig(whatsapp);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, session?.user?.role, router]);

  if (status === 'loading' || loading) return <LoadingPage />;
  if (!session || !canAccessAdmin(session.user?.role)) return null;

  const emailsDisponiveis = emailStatus?.canSend ? 'Ativo' : emailStatus?.hasConfig ? 'Configurado' : 'Não configurado';
  const whatsappDisponiveis = whatsappConfig?.enabled ? 'Ativo' : whatsappConfig ? 'Configurado' : 'Não configurado';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Disparos' }]} />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Disparos</h1>
          <p className="text-gray-600 mt-1">
            Campanhas de comunicação por e-mail e WhatsApp. Configure os canais em Integrações.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/whatsapp/templates"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm font-medium"
          >
            <Plus size={18} />
            Novo (WhatsApp)
          </Link>
          <Link
            href="/admin/email"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 text-sm font-medium"
          >
            <Mail size={18} />
            Config. E-mail
          </Link>
        </div>
      </motion.div>

      {/* Cards de quota (estilo D9 Pro) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
      >
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <Mail size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">E-mails</p>
                <p className="text-2xl font-bold text-gray-900">{emailsDisponiveis}</p>
              </div>
            </div>
            <span className="text-xs text-gray-500">Canal transacional</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Status do provedor configurado em Integrações → E-mail.
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-100 text-green-600">
                <MessageSquare size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">WhatsApp</p>
                <p className="text-2xl font-bold text-gray-900">{whatsappDisponiveis}</p>
              </div>
            </div>
            <span className="text-xs text-gray-500">Templates aprovados</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Configuração em Integrações → WhatsApp. Envios via templates.
          </p>
        </div>
      </motion.div>

      {/* Tabela de disparos (últimos registros – placeholder) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-gray-200 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar nos últimos registros"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total enviado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  <Send size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="font-medium">Nenhum disparo registrado</p>
                  <p className="text-sm mt-1">
                    Os envios por template (WhatsApp) e transacionais (e-mail) são feitos automaticamente pela plataforma.
                  </p>
                  <p className="text-sm mt-2">
                    Para campanhas em massa, use <Link href="/admin/whatsapp/templates" className="text-primary hover:underline">Templates WhatsApp</Link> ou
                    {' '}<Link href="/admin/whatsapp/mensagens" className="text-primary hover:underline">Mensagens</Link>.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
