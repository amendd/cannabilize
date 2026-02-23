'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageSquare, Settings, CheckCircle2, XCircle, Save, Send, AlertCircle, Info, ExternalLink, FileText, ChevronRight, Inbox, GitBranch, Bot, Bell } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { SkeletonDashboard } from '@/components/ui/Skeleton';

interface WhatsAppConfig {
  id?: string;
  provider: string;
  enabled: boolean;
  accountSid?: string;
  authToken?: string;
  phoneNumber?: string;
  phoneNumberId?: string;
  instanceId?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  clientToken?: string;
  testPhone?: string;
  lastTestAt?: string;
  lastTestResult?: string;
  hasAuthToken?: boolean;
  hasClientToken?: boolean;
}

export default function WhatsAppConfigPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [providerTab, setProviderTab] = useState<'TWILIO' | 'META' | 'ZAPI'>('ZAPI');
  const [defaultProvider, setDefaultProvider] = useState<'TWILIO' | 'META' | 'ZAPI'>('ZAPI');
  const [config, setConfig] = useState<WhatsAppConfig>({
    provider: 'TWILIO',
    enabled: false,
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
      loadConfig(providerTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.role]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user.role === 'ADMIN') {
      loadConfig(providerTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerTab]);

  const loadConfig = async (provider: 'TWILIO' | 'META' | 'ZAPI' = providerTab) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/whatsapp?provider=${provider}`);
      if (response.ok) {
        const data = await response.json();
        setConfig({ ...data, provider });
        if (typeof data.defaultProvider === 'string' && ['ZAPI', 'META', 'TWILIO'].includes(data.defaultProvider)) {
          setDefaultProvider(data.defaultProvider);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
      toast.error('Erro ao carregar configuração');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const dataToSend: Record<string, unknown> = {
        ...config,
        provider: config.provider || providerTab,
        defaultProvider,
      };
      if (config.hasAuthToken && (!config.authToken || config.authToken === '••••••••')) {
        delete dataToSend.authToken;
      }
      if (config.hasClientToken && (!config.clientToken || config.clientToken === '••••••••')) {
        delete dataToSend.clientToken;
      }
      delete dataToSend.hasAuthToken;
      delete dataToSend.hasClientToken;
      delete dataToSend.lastTestAt;
      delete dataToSend.lastTestResult;

      const response = await fetch('/api/admin/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        toast.success('Configuração do WhatsApp salva com sucesso!');
        await loadConfig();
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Erro ao salvar configuração';
        const errorDetails = errorData.details;
        
        console.error('Erro ao salvar:', errorData);
        toast.error(errorMessage);
        
        // Mostrar detalhes em desenvolvimento
        if (errorDetails && process.env.NODE_ENV === 'development') {
          console.error('Detalhes do erro:', errorDetails);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config.testPhone) {
      toast.error('Por favor, informe um número de telefone para teste');
      return;
    }

    try {
      setTesting(true);
      const response = await fetch('/api/admin/whatsapp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testPhone: config.testPhone,
          provider: config.provider || providerTab,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success(result.message || 'Mensagem de teste enviada com sucesso!');
        } else {
          toast.error(result.error || 'Erro ao enviar mensagem de teste');
        }
        await loadConfig();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao testar configuração');
      }
    } catch (error) {
      console.error('Erro ao testar configuração:', error);
      toast.error('Erro ao testar configuração');
    } finally {
      setTesting(false);
    }
  };

  if (status === 'loading' || loading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'WhatsApp', href: '/admin/whatsapp' },
          ]}
        />

        {/* Submenu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 mt-4"
        >
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex gap-4">
              <Link
                href="/admin/whatsapp"
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  pathname === '/admin/whatsapp'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Settings size={18} />
                Configurações
              </Link>
              <Link
                href="/admin/whatsapp/templates"
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  pathname === '/admin/whatsapp/templates'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FileText size={18} />
                Templates de Mensagens
              </Link>
              <Link
                href="/admin/whatsapp/mensagens"
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  pathname === '/admin/whatsapp/mensagens'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Inbox size={18} />
                Mensagens
              </Link>
              <Link
                href="/admin/whatsapp/lembretes"
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  pathname === '/admin/whatsapp/lembretes'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Bell size={18} />
                Lembretes
              </Link>
              <Link
                href="/admin/fluxos-whatsapp"
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  pathname === '/admin/fluxos-whatsapp'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <GitBranch size={18} />
                Fluxos
              </Link>
              <Link
                href="/admin/whatsapp/ia"
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  pathname === '/admin/whatsapp/ia'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Bot size={18} />
                IA no WhatsApp
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="text-primary" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">Configuração WhatsApp</h1>
          </div>
          <p className="text-gray-600">
            Configure a integração com WhatsApp: Twilio, Meta (API direta) ou Z-API.
          </p>
        </motion.div>

        {/* Provedor padrão para envio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Provedor para envio</h2>
            <p className="text-sm text-gray-500 mb-3">
              O provedor selecionado será usado em primeiro lugar para enviar mensagens (consultas, receitas, pagamentos, etc.). Se estiver desabilitado, o sistema tenta os demais. Padrão: Z-API.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={defaultProvider}
                onChange={(e) => setDefaultProvider(e.target.value as 'ZAPI' | 'META' | 'TWILIO')}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="ZAPI">Z-API (padrão)</option>
                <option value="META">Meta (API direta)</option>
                <option value="TWILIO">Twilio</option>
              </select>
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/whatsapp/default-provider', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ defaultProvider }),
                    });
                    if (res.ok) toast.success('Provedor para envio salvo.');
                    else toast.error((await res.json()).error || 'Erro ao salvar');
                  } catch {
                    toast.error('Erro ao salvar provedor');
                  }
                }}
              >
                Salvar preferência
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Ou salve a configuração do provedor abaixo para gravar credenciais e esta escolha juntos.
            </p>
          </div>
        </motion.div>

        {/* Abas: Twilio | Meta */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <div className="flex gap-2 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setProviderTab('TWILIO')}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                providerTab === 'TWILIO'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Twilio
            </button>
            <button
              type="button"
              onClick={() => setProviderTab('META')}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                providerTab === 'META'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Meta (API direta)
            </button>
            <button
              type="button"
              onClick={() => setProviderTab('ZAPI')}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                providerTab === 'ZAPI'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Z-API
            </button>
          </div>
        </motion.div>

        {/* Informações conforme provedor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
        >
          <div className="flex items-start gap-3">
            <Info className="text-blue-600 mt-0.5" size={20} />
            <div className="flex-1">
              {providerTab === 'ZAPI' ? (
                <>
                  <h3 className="font-semibold text-blue-900 mb-1">Z-API (z-api.io)</h3>
                  <p className="text-sm text-blue-800 mb-2">
                    1. Acesse o painel da Z-API, crie ou selecione sua <strong>Instância Web</strong>.
                  </p>
                  <p className="text-sm text-blue-800 mb-2">
                    2. Em <strong>Dados da instância web</strong>: copie o <strong>Instance ID</strong> e o <strong>Token</strong>.
                  </p>
                  <p className="text-sm text-blue-800 mb-2">
                    3. Em <strong>Webhooks e configurações gerais</strong> → &quot;Ao receber&quot;, configure a URL: <code className="bg-blue-100 px-1 rounded">https://seu-dominio.com/api/whatsapp/zapi-webhook</code>
                  </p>
                  <p className="text-sm text-blue-800">
                    4. Opcional: use <strong>Client-Token</strong> (Token de segurança da conta) se exigido pela sua conta Z-API.
                  </p>
                </>
              ) : providerTab === 'META' ? (
                <>
                  <h3 className="font-semibold text-blue-900 mb-1">Meta for Developers (WhatsApp Cloud API)</h3>
                  <p className="text-sm text-blue-800 mb-2">
                    1. Acesse{' '}
                    <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                      developers.facebook.com/apps
                    </a>
                    , crie ou selecione o app (ex: cannabilize).
                  </p>
                  <p className="text-sm text-blue-800 mb-2">
                    2. Em <strong>WhatsApp → Configuração</strong>: crie um Token permanente e anote o <strong>Phone number ID</strong>.
                  </p>
                  <p className="text-sm text-blue-800 mb-2">
                    3. Em <strong>Webhook</strong>: URL de callback = <code className="bg-blue-100 px-1 rounded">https://seu-dominio.com/api/whatsapp/webhook</code> e Verificar token = o mesmo valor que você colocar no campo &quot;Verificar token&quot; abaixo.
                  </p>
                  <p className="text-sm text-blue-800">
                    4. Inscreva-se no campo <strong>messages</strong> para receber mensagens e status.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-semibold text-blue-900 mb-1">Como obter credenciais do Twilio</h3>
                  <p className="text-sm text-blue-800 mb-2">
                    1. Crie uma conta em{' '}
                    <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer" className="underline font-medium">twilio.com</a>
                  </p>
                  <p className="text-sm text-blue-800 mb-2">
                    2. Acesse o Console do Twilio e vá em &quot;Messaging&quot; → &quot;Try it out&quot; → &quot;Send a WhatsApp message&quot;
                  </p>
                  <p className="text-sm text-blue-800 mb-2">
                    3. Use o número sandbox do Twilio (formato: whatsapp:+14155238886) ou configure seu próprio número
                  </p>
                  <p className="text-sm text-blue-800">
                    4. Copie o Account SID e Auth Token do{' '}
                    <a href="https://console.twilio.com/" target="_blank" rel="noopener noreferrer" className="underline font-medium">Console do Twilio</a>
                  </p>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Status da Configuração */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Settings className="text-primary" size={24} />
              <h2 className="text-xl font-semibold text-gray-900">Status da Configuração</h2>
            </div>
            <div className="flex items-center gap-2">
              {config.enabled ? (
                <>
                  <CheckCircle2 className="text-green-600" size={20} />
                  <span className="text-green-600 font-medium">Habilitado</span>
                </>
              ) : (
                <>
                  <XCircle className="text-gray-400" size={20} />
                  <span className="text-gray-400 font-medium">Desabilitado</span>
                </>
              )}
            </div>
          </div>

          {config.lastTestAt && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Último teste:</strong>{' '}
                {new Date(config.lastTestAt).toLocaleString('pt-BR')}
              </p>
              {config.lastTestResult && (
                <>
                  <p className={`text-sm mt-1 ${
                    config.lastTestResult === 'SUCCESS'
                      ? 'text-green-600'
                      : config.lastTestResult.startsWith('ERROR')
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}>
                    <strong>Resultado:</strong> {config.lastTestResult}
                  </p>
                  {config.provider === 'ZAPI' && config.lastTestResult.includes('client-token') && (
                    <p className="text-sm mt-2 text-amber-700 bg-amber-50 p-2 rounded">
                      💡 Preencha o campo <strong>Client-Token</strong> abaixo (token em Segurança no painel Z-API), clique em Salvar e depois em Testar.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </motion.div>

        {/* Formulário de Configuração */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Settings className="text-primary" size={20} />
            <h2 className="text-xl font-semibold text-gray-900">
              {providerTab === 'ZAPI'
                ? 'Credenciais Z-API'
                : providerTab === 'META'
                ? 'Credenciais Meta (WhatsApp Cloud API)'
                : 'Credenciais Twilio'}
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enabled"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
                Habilitar integração WhatsApp
              </label>
            </div>

            {providerTab === 'ZAPI' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL do webhook (Ao receber)</label>
                  <Input
                    readOnly
                    value={
                      typeof window !== 'undefined'
                        ? `${(process.env.NEXT_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '')}/api/whatsapp/zapi-webhook`
                        : 'https://cannabilize.com.br/api/whatsapp/zapi-webhook'
                    }
                    className="w-full bg-gray-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    No painel Z-API → Webhooks e configurações gerais → &quot;Ao receber&quot;, cole esta URL. Use o domínio público (NEXT_PUBLIC_APP_URL) se o site estiver em iframe apontando para túnel.
                  </p>
                </div>
                <div>
                  <label htmlFor="instanceId" className="block text-sm font-medium text-gray-700 mb-1">
                    Instance ID <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="instanceId"
                    type="text"
                    value={config.instanceId || ''}
                    onChange={(e) => setConfig({ ...config, instanceId: e.target.value })}
                    placeholder="Ex: A20DA9C0183A2D35A260F53F5D2B9244"
                    className="w-full"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Em Dados da instância web no painel Z-API.
                  </p>
                </div>
                <div>
                  <label htmlFor="authToken" className="block text-sm font-medium text-gray-700 mb-1">
                    Token <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="authToken"
                    type="password"
                    value={config.hasAuthToken ? '••••••••' : (config.authToken || '')}
                    onChange={(e) => setConfig({ ...config, authToken: e.target.value, hasAuthToken: false })}
                    placeholder={config.hasAuthToken ? 'Já configurado (deixe em branco para manter)' : 'Token da instância Z-API'}
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="clientToken" className="block text-sm font-medium text-gray-700 mb-1">Client-Token (opcional)</label>
                  <Input
                    id="clientToken"
                    type="password"
                    value={config.hasClientToken ? '••••••••' : (config.clientToken || '')}
                    onChange={(e) => setConfig({ ...config, clientToken: e.target.value, hasClientToken: false })}
                    placeholder={config.hasClientToken ? 'Já configurado (deixe em branco para manter)' : 'Token de segurança da conta (se exigido)'}
                    className="w-full"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Algumas contas Z-API exigem o Client-Token no header das requisições.
                  </p>
                </div>
              </>
            ) : providerTab === 'META' ? (
              <>
                {/* URL do Webhook (somente leitura) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL de callback (Webhook)</label>
                  <Input
                    readOnly
                    value={
                      typeof window !== 'undefined'
                        ? `${(process.env.NEXT_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '')}/api/whatsapp/webhook`
                        : 'https://cannabilize.com.br/api/whatsapp/webhook'
                    }
                    className="w-full bg-gray-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Cole em Meta for Developers → WhatsApp → Webhook. Use o domínio público (NEXT_PUBLIC_APP_URL) se o site estiver em iframe apontando para túnel.
                  </p>
                </div>
                {/* Verificar token */}
                <div>
                  <label htmlFor="webhookSecret" className="block text-sm font-medium text-gray-700 mb-1">
                    Verificar token <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="webhookSecret"
                    type="text"
                    value={config.webhookSecret || ''}
                    onChange={(e) => setConfig({ ...config, webhookSecret: e.target.value })}
                    placeholder="Ex: meu-token-secreto-123"
                    className="w-full"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Defina um valor e use o mesmo em &quot;Verificar token&quot; no painel do Meta. O Meta envia esse valor no GET para validar o webhook.
                  </p>
                </div>
                {/* Token de acesso */}
                <div>
                  <label htmlFor="authToken" className="block text-sm font-medium text-gray-700 mb-1">
                    Token de acesso (permanente) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="authToken"
                    type="password"
                    value={config.hasAuthToken ? '••••••••' : (config.authToken || '')}
                    onChange={(e) => setConfig({ ...config, authToken: e.target.value, hasAuthToken: false })}
                    placeholder={config.hasAuthToken ? 'Já configurado (deixe em branco para manter)' : 'Token do WhatsApp → Configuração da API'}
                    className="w-full"
                  />
                </div>
                {/* Phone Number ID */}
                <div>
                  <label htmlFor="phoneNumberId" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone number ID <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="phoneNumberId"
                    type="text"
                    value={config.phoneNumberId || ''}
                    onChange={(e) => setConfig({ ...config, phoneNumberId: e.target.value })}
                    placeholder="Ex: 106540352242922"
                    className="w-full"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Use o <strong>Phone number ID</strong> do número que envia/recebe (não o ID da conta business). Em Meta for Developers: WhatsApp → Configuração da API ou Configuração → ao lado do número; ou na URL do exemplo de envio: <code className="bg-gray-100 px-0.5">/v22.0/<strong>ESTE_NÚMERO</strong>/messages</code>.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="accountSid" className="block text-sm font-medium text-gray-700 mb-1">
                    Account SID <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="accountSid"
                    type="text"
                    value={config.accountSid || ''}
                    onChange={(e) => setConfig({ ...config, accountSid: e.target.value })}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full"
                  />
                  <div className="mt-1 flex items-start gap-1">
                    <p className="text-xs text-gray-500">Console Twilio → Account SID</p>
                    <a href="https://console.twilio.com/us1/account/keys-credentials/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700"><ExternalLink size={12} /></a>
                  </div>
                </div>
                <div>
                  <label htmlFor="authToken" className="block text-sm font-medium text-gray-700 mb-1">Auth Token <span className="text-red-500">*</span></label>
                  <Input
                    id="authToken"
                    type="password"
                    value={config.hasAuthToken ? '••••••••' : (config.authToken || '')}
                    onChange={(e) => setConfig({ ...config, authToken: e.target.value, hasAuthToken: false })}
                    placeholder={config.hasAuthToken ? 'Deixe em branco para manter' : 'Seu Auth Token'}
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">Número WhatsApp <span className="text-red-500">*</span></label>
                  <Input
                    id="phoneNumber"
                    type="text"
                    value={config.phoneNumber || ''}
                    onChange={(e) => setConfig({ ...config, phoneNumber: e.target.value })}
                    placeholder="whatsapp:+14155238886"
                    className="w-full"
                  />
                  <p className="mt-1 text-xs text-gray-500">Formato: whatsapp:+[código][número]</p>
                </div>
                <div>
                  <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700 mb-1">Webhook URL (Opcional)</label>
                  <Input
                    id="webhookUrl"
                    type="url"
                    value={config.webhookUrl || ''}
                    onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                    placeholder="https://seu-dominio.com/api/whatsapp/webhook"
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="webhookSecret" className="block text-sm font-medium text-gray-700 mb-1">Webhook Secret (Opcional)</label>
                  <Input
                    id="webhookSecret"
                    type="password"
                    value={config.webhookSecret || ''}
                    onChange={(e) => setConfig({ ...config, webhookSecret: e.target.value })}
                    placeholder="Secret para validar webhooks"
                    className="w-full"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="testPhone" className="block text-sm font-medium text-gray-700 mb-1">Número para Teste</label>
              <div className="flex gap-2">
                <Input
                  id="testPhone"
                  type="text"
                  value={config.testPhone || ''}
                  onChange={(e) => setConfig({ ...config, testPhone: e.target.value })}
                  placeholder="+5511999999999"
                  className="flex-1"
                />
                <Button onClick={handleTest} disabled={testing || !config.testPhone} className="flex items-center gap-2">
                  <Send size={16} />
                  {testing ? 'Enviando...' : 'Testar'}
                </Button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Formato: +5511999999999</p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
              <Save size={16} />
              {saving ? 'Salvando...' : 'Salvar Configuração'}
            </Button>
          </div>
        </motion.div>

        {/* Guia de Como Encontrar os Dados */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6"
        >
          <div className="flex items-start gap-3 mb-4">
            <Info className="text-blue-600 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-3">📋 Como Encontrar os Dados no Twilio Console</h3>
              
              <div className="space-y-4">
                {/* Account SID */}
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">1. Account SID e Auth Token</h4>
                    <a
                      href="https://console.twilio.com/us1/account/keys-credentials/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                    >
                      Abrir Console <ExternalLink size={14} />
                    </a>
                  </div>
                  <ol className="text-sm text-gray-700 space-y-1 ml-4 list-decimal">
                    <li>No Twilio Console, clique no seu <strong>nome de usuário</strong> (canto superior direito)</li>
                    <li>Ou acesse: <code className="bg-gray-100 px-1 rounded">Account → API Keys & Tokens</code></li>
                    <li>Você verá o <strong>Account SID</strong> (começa com <code>AC...</code>)</li>
                    <li>Para o <strong>Auth Token</strong>, clique no ícone 👁️ para revelar</li>
                  </ol>
                </div>

                {/* Número WhatsApp */}
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">2. Número do WhatsApp (Sandbox)</h4>
                    <a
                      href="https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                    >
                      Abrir Sandbox <ExternalLink size={14} />
                    </a>
                  </div>
                  <ol className="text-sm text-gray-700 space-y-1 ml-4 list-decimal">
                    <li>Acesse: <code className="bg-gray-100 px-1 rounded">Messaging → Try it out → Send a WhatsApp message</code></li>
                    <li>Na seção <strong>"Participantes do Sandbox"</strong>, você verá o número</li>
                    <li>Número Sandbox: <code className="bg-gray-100 px-1 rounded">+1 415 523 8886</code></li>
                    <li>Use o formato: <code className="bg-gray-100 px-1 rounded">whatsapp:+14155238886</code></li>
                    <li className="text-yellow-700 font-medium">⚠️ Para usar o sandbox, envie <code>join [código]</code> para o número</li>
                  </ol>
                </div>

                {/* Webhook */}
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">3. Configurar Webhook URL</h4>
                    <a
                      href="https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                    >
                      Abrir Configurações <ExternalLink size={14} />
                    </a>
                  </div>
                  <ol className="text-sm text-gray-700 space-y-1 ml-4 list-decimal">
                    <li>Na página do Sandbox, clique na aba <strong>"Configurações do Sandbox"</strong></li>
                    <li>Em <strong>"Quando uma mensagem chega"</strong>, coloque: <code className="bg-gray-100 px-1 rounded">https://seu-dominio.com/api/whatsapp/webhook</code></li>
                    <li>Em <strong>"URL de retorno de chamada de status"</strong>, coloque a mesma URL</li>
                    <li>Método: <code className="bg-gray-100 px-1 rounded">POST</code> (já vem selecionado)</li>
                    <li className="text-yellow-700 font-medium">💡 Para desenvolvimento local, use <code>ngrok</code> ou similar</li>
                  </ol>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>📖 Guia Completo:</strong> Consulte o arquivo <code>GUIA_DADOS_TWILIO.md</code> na raiz do projeto para instruções detalhadas.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Avisos e Dicas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-600 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">⚠️ Importante</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• O número sandbox do Twilio só funciona com números verificados. Envie <code>join [código]</code> para <code>+1 415 523 8886</code></li>
                <li>• Para produção, você precisará de um número WhatsApp Business aprovado pelo Twilio</li>
                <li>• Mantenha suas credenciais seguras. O Auth Token não será exibido após salvo</li>
                <li>• Configure o webhook no Twilio Console para receber status de entrega das mensagens</li>
                <li>• O formato do número deve ser: <code>whatsapp:+[código do país][número]</code></li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
