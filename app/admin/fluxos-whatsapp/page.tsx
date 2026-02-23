'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageSquare, Save, Smartphone, Monitor, ExternalLink, Send, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { SkeletonDashboard } from '@/components/ui/Skeleton';

type FunnelType = 'SITE' | 'WHATSAPP';

interface CaptureFunnelConfig {
  mobile: { funnelType: FunnelType };
  desktop: { funnelType: FunnelType };
  whatsappNumber: string;
  whatsappPrefillTemplate: string;
  whatsappWelcomeMessage: string;
  whatsappNextStepsMessage: string | null;
  whatsappPixKey: string | null;
  whatsappAgentPhone: string | null;
}

export default function FluxosWhatsAppPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [simulatePhone, setSimulatePhone] = useState('');
  const [simulateLoading, setSimulateLoading] = useState(false);
  const [simulateResult, setSimulateResult] = useState<{
    success: boolean;
    phone?: string;
    messagesSent?: number;
    totalMessages?: number;
    error?: string;
    message?: string;
  } | null>(null);
  const [config, setConfig] = useState<CaptureFunnelConfig>({
    mobile: { funnelType: 'SITE' },
    desktop: { funnelType: 'SITE' },
    whatsappNumber: '',
    whatsappPrefillTemplate: 'Olá, gostaria de agendar minha consulta.',
    whatsappWelcomeMessage: '',
    whatsappNextStepsMessage: null,
    whatsappPixKey: null,
    whatsappAgentPhone: null,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    if (status === 'authenticated' && session?.user.role === 'ADMIN') {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.role]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/settings/capture-funnel');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Erro ao carregar fluxos:', error);
      toast.error('Erro ao carregar configuração');
    } finally {
      setLoading(false);
    }
  };

  type SectionKey = 'channel' | 'captation' | 'prefill' | 'welcome' | 'nextsteps' | 'pixkey' | 'agentphone';

  const saveSection = async (section: SectionKey) => {
    let body: Record<string, unknown> = {};
    switch (section) {
      case 'channel':
        body = { funnelMobile: config.mobile.funnelType, funnelDesktop: config.desktop.funnelType };
        break;
      case 'captation':
        body = { whatsappNumber: config.whatsappNumber };
        break;
      case 'prefill':
        body = { whatsappPrefillTemplate: config.whatsappPrefillTemplate };
        break;
      case 'welcome':
        body = { whatsappWelcomeMessage: config.whatsappWelcomeMessage };
        break;
      case 'nextsteps':
        body = { whatsappNextStepsMessage: config.whatsappNextStepsMessage || null };
        break;
      case 'pixkey':
        body = { whatsappPixKey: config.whatsappPixKey || null };
        break;
      case 'agentphone':
        body = { whatsappAgentPhone: config.whatsappAgentPhone || null };
        break;
    }
    try {
      setSavingSection(section);
      const res = await fetch('/api/admin/settings/capture-funnel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success('Alterações salvas com sucesso!');
        const data = await res.json();
        setConfig(data);
      } else {
        const err = await res.json();
        toast.error(err?.error || 'Erro ao salvar');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar');
    } finally {
      setSavingSection(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <SkeletonDashboard />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Fluxos WhatsApp' },
          ]}
        />
        <h1 className="text-3xl font-bold text-gray-900 font-display mt-4">Funil de Captação</h1>
        <p className="text-gray-600 mt-2">
          Defina como o visitante será direcionado ao agendar: formulário no site ou redirecionamento para o WhatsApp (estilo ClickCannabis).
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-md p-6 mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <MessageSquare className="text-green-600" size={22} />
          <h2 className="text-xl font-bold text-gray-900">Canal por dispositivo</h2>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Escolha o funil para cada tipo de dispositivo. <strong>WhatsApp</strong>: ao clicar em &quot;Agendar&quot; / &quot;Falar com médico&quot;, o visitante é redirecionado para o WhatsApp com uma mensagem pré-preenchida. <strong>Site</strong>: preenche o formulário completo no site.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="text-gray-600" size={20} />
              <span className="font-medium text-gray-900">Mobile</span>
            </div>
            <select
              value={config.mobile.funnelType}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  mobile: { funnelType: e.target.value as FunnelType },
                }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="SITE">Site (formulário completo)</option>
              <option value="WHATSAPP">WhatsApp (redirecionar)</option>
            </select>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Monitor className="text-gray-600" size={20} />
              <span className="font-medium text-gray-900">Desktop</span>
            </div>
            <select
              value={config.desktop.funnelType}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  desktop: { funnelType: e.target.value as FunnelType },
                }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="SITE">Site (formulário completo)</option>
              <option value="WHATSAPP">WhatsApp (redirecionar)</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => saveSection('channel')} loading={savingSection === 'channel'} size="sm">
            <Save size={18} />
            Salvar canal
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-lg shadow-md p-6 mb-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-2">WhatsApp – Captação</h2>
        <p className="text-sm text-gray-600 mb-4">
          Mesmo número definido como <strong>padrão de contato</strong> em{' '}
          <Link href="/admin/configuracoes" className="text-green-600 hover:underline">Configurações</Link>
          . Usado nos links &quot;Agendar&quot; e &quot;Falar com médico&quot; (prioridade sobre a integração Twilio). Se vazio, usa o número em{' '}
          <Link href="/admin/whatsapp" className="text-green-600 hover:underline inline-flex items-center gap-1">
            WhatsApp <ExternalLink size={14} />
          </Link>
          . Formato: dígitos com DDD (ex.: 5521999998888).
        </p>
        <Input
          label="Número WhatsApp (captação)"
          type="text"
          placeholder="5521999998888"
          value={config.whatsappNumber}
          onChange={(e) => setConfig((c) => ({ ...c, whatsappNumber: e.target.value }))}
        />
        <div className="mt-4 flex justify-end">
          <Button onClick={() => saveSection('captation')} loading={savingSection === 'captation'} size="sm">
            <Save size={18} />
            Salvar número
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-md p-6 mb-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-2">Mensagem pré-preenchida (link wa.me)</h2>
        <p className="text-sm text-gray-600 mb-4">
          Texto que aparece quando o visitante abre o WhatsApp. Use <code className="bg-gray-100 px-1 rounded">{'{{name}}'}</code> para o nome e <code className="bg-gray-100 px-1 rounded">{'{{pathologies}}'}</code> para a lista numerada de patologias.
        </p>
        <textarea
          rows={5}
          value={config.whatsappPrefillTemplate}
          onChange={(e) => setConfig((c) => ({ ...c, whatsappPrefillTemplate: e.target.value }))}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono"
          placeholder="Olá, me chamo {{name}}.\n\nPatologias selecionadas:\n{{pathologies}}"
        />
        <div className="mt-4 flex justify-end">
          <Button onClick={() => saveSection('prefill')} loading={savingSection === 'prefill'} size="sm">
            <Save size={18} />
            Salvar mensagem
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-lg shadow-md p-6 mb-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-2">Mensagem de boas-vindas (automática)</h2>
        <p className="text-sm text-gray-600 mb-4">
          Enviada automaticamente quando alguém manda a primeira mensagem no WhatsApp (após clicar no link do site).
        </p>
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <strong>Para o paciente receber o retorno:</strong> configure o webhook para <code className="bg-amber-100 px-1 rounded">https://seu-dominio.com/api/whatsapp/webhook</code>. Se usar <strong>Meta (API direta)</strong>, em Meta for Developers → WhatsApp → Configuração → Webhook, inscreva-se no campo <strong>messages</strong>. Se usar Twilio, em &quot;Quando uma mensagem chegar&quot; use a mesma URL. Em desenvolvimento local use ngrok para expor a URL.
        </div>
        <textarea
          rows={5}
          value={config.whatsappWelcomeMessage}
          onChange={(e) => setConfig((c) => ({ ...c, whatsappWelcomeMessage: e.target.value }))}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
          placeholder="Olá! 👋 Obrigado pelo seu contato..."
        />
        <div className="mt-4 flex justify-end">
          <Button onClick={() => saveSection('welcome')} loading={savingSection === 'welcome'} size="sm">
            <Save size={18} />
            Salvar boas-vindas
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.17 }}
        className="bg-white rounded-lg shadow-md p-6 mb-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-2">Mensagem de próximos passos (opcional)</h2>
        <p className="text-sm text-gray-600 mb-4">
          Enviada logo após as boas-vindas na primeira mensagem. Use para informar valor da consulta, que enviarão o link de pagamento, etc. Deixe vazio para enviar só a mensagem de boas-vindas.
        </p>
        <textarea
          rows={5}
          value={config.whatsappNextStepsMessage ?? ''}
          onChange={(e) => setConfig((c) => ({ ...c, whatsappNextStepsMessage: e.target.value || null }))}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
          placeholder="📋 Próximos passos: nossa equipe enviará o link de pagamento..."
        />
        <div className="mt-4 flex justify-end">
          <Button onClick={() => saveSection('nextsteps')} loading={savingSection === 'nextsteps'} size="sm">
            <Save size={18} />
            Salvar próximos passos
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="bg-white rounded-lg shadow-md p-6 mb-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-2">Chave PIX (copia e cola)</h2>
        <p className="text-sm text-gray-600 mb-4">
          Opcional. Se preenchida, será enviada no WhatsApp junto com o link de pagamento após o paciente confirmar o agendamento. O paciente pode pagar pelo link (PIX ou cartão) ou usar esta chave para PIX manual.
        </p>
        <Input
          label="Chave PIX"
          type="text"
          placeholder="Ex: chave@email.com ou 000.000.000-00"
          value={config.whatsappPixKey ?? ''}
          onChange={(e) => setConfig((c) => ({ ...c, whatsappPixKey: e.target.value || null }))}
        />
        <div className="mt-4 flex justify-end">
          <Button onClick={() => saveSection('pixkey')} loading={savingSection === 'pixkey'} size="sm">
            <Save size={18} />
            Salvar chave PIX
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.19 }}
        className="bg-white rounded-lg shadow-md p-6 mb-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-2">Atendimento humano (números dos atendentes)</h2>
        <p className="text-sm text-gray-600 mb-4">
          Opcional. Quando o paciente pedir para &quot;falar com um humano&quot;, o sistema pergunta apenas aos atendentes que <strong>não estão em um atendimento</strong>. Um por linha ou separados por vírgula. Respostas enviadas por esses números para o número da clínica são reenviadas ao paciente. O atendente pode encerrar digitando <strong>ENCERRAR</strong>.
        </p>
        <label className="block text-sm font-medium text-gray-700 mb-1">Números dos atendentes (WhatsApp)</label>
        <textarea
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[80px]"
          placeholder="Ex: +5511999998888&#10;+5511988887777"
          value={config.whatsappAgentPhone ?? ''}
          onChange={(e) => setConfig((c) => ({ ...c, whatsappAgentPhone: e.target.value || null }))}
          rows={4}
        />
        <div className="mt-4 flex justify-end">
          <Button onClick={() => saveSection('agentphone')} loading={savingSection === 'agentphone'} size="sm">
            <Save size={18} />
            Salvar número do atendente
          </Button>
        </div>
      </motion.div>

      {/* Testar fluxo de resposta */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-md p-6 mb-6 border-2 border-dashed border-green-200"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Send className="text-green-600" size={22} />
          Testar fluxo de resposta
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Simula uma &quot;primeira mensagem&quot; recebida no WhatsApp: o sistema cria o lead (se for número novo) e envia automaticamente a mensagem de boas-vindas e a de próximos passos configuradas acima. Use para validar os textos sem precisar enviar do celular.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Número (ex.: +5579991269833)</label>
            <Input
              type="text"
              placeholder="+5579991269833"
              value={simulatePhone}
              onChange={(e) => { setSimulatePhone(e.target.value); setSimulateResult(null); }}
            />
          </div>
          <Button
            onClick={async () => {
              if (!simulatePhone.trim()) {
                toast.error('Informe um número para simular');
                return;
              }
              setSimulateLoading(true);
              setSimulateResult(null);
              try {
                const res = await fetch('/api/admin/whatsapp/simulate-incoming', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ phone: simulatePhone.trim(), messageBody: 'Teste fluxo (simulação)' }),
                });
                const data = await res.json();
                if (res.ok) {
                  setSimulateResult(data);
                  if (data.messagesSent === data.totalMessages && data.totalMessages) toast.success('Fluxo executado! Verifique o WhatsApp.');
                  else if (data.messagesSent) toast.success(data.message || 'Mensagens enviadas.');
                  else toast(data.message || 'Verifique a config do WhatsApp.');
                } else {
                  toast.error(data.error || 'Erro ao simular');
                  setSimulateResult({ success: false });
                }
              } catch (e) {
                toast.error('Erro ao simular');
                setSimulateResult({ success: false });
              } finally {
                setSimulateLoading(false);
              }
            }}
            disabled={simulateLoading}
            className="flex items-center gap-2"
          >
            <Send size={16} />
            {simulateLoading ? 'Enviando...' : 'Simular primeira mensagem'}
          </Button>
        </div>
        {simulateResult && (
          <div className={`mt-4 p-4 rounded-lg border ${simulateResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <p className="text-sm font-medium text-gray-800 mb-2">{simulateResult.message}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              {simulateResult.phone && <span><strong>Número:</strong> {simulateResult.phone}</span>}
              {simulateResult.messagesSent != null && (
                <span className="flex items-center gap-1">
                  {simulateResult.messagesSent === simulateResult.totalMessages ? <CheckCircle2 className="text-green-600" size={16} /> : <XCircle className="text-red-500" size={16} />}
                  Mensagens: {simulateResult.messagesSent}/{simulateResult.totalMessages ?? 0}
                </span>
              )}
            </div>
            {simulateResult.error && <p className="text-xs text-red-600 mt-2">{simulateResult.error}</p>}
          </div>
        )}
      </motion.div>
    </div>
  );
}
