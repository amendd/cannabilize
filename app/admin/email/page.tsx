'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Settings, CheckCircle2, XCircle, Save, Send, AlertCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import Textarea from '@/components/ui/Textarea';

type Provider = 'RESEND' | 'SENDGRID' | 'AWS_SES' | 'SMTP';

interface EmailConfig {
  id?: string;
  provider: Provider;
  enabled: boolean;
  apiKey?: string;
  apiSecret?: string;
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
  domain?: string;
  region?: string;
  testEmail?: string;
  lastTestAt?: string;
  lastTestResult?: string;
}

type EmailTemplateType =
  | 'ACCOUNT_WELCOME'
  | 'ACCOUNT_SETUP'
  | 'CONSULTATION_CONFIRMED'
  | 'CONSULTATION_REMINDER_24H'
  | 'CONSULTATION_REMINDER_2H'
  | 'CONSULTATION_REMINDER_1H'
  | 'CONSULTATION_REMINDER_10MIN'
  | 'CONSULTATION_REMINDER_NOW'
  | 'CONSULTATION_FOLLOWUP'
  | 'PAYMENT_CONFIRMED'
  | 'PRESCRIPTION_ISSUED'
  | 'RESCHEDULE_INVITE'
  | 'RESCHEDULE_INVITE_ACCEPTED'
  | 'RESCHEDULE_INVITE_REJECTED'
  | 'RESCHEDULE_INVITE_EXPIRED';

interface EmailTemplateConfig {
  id: EmailTemplateType;
  name: string;
  description: string;
  subject: string;
  html: string;
}

const providerInfo = {
  RESEND: {
    name: 'Resend',
    description: 'Serviço moderno de email transacional',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    docs: 'https://resend.com/docs',
  },
  SENDGRID: {
    name: 'SendGrid',
    description: 'Plataforma de email da Twilio',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    docs: 'https://docs.sendgrid.com',
  },
  AWS_SES: {
    name: 'AWS SES',
    description: 'Amazon Simple Email Service',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    docs: 'https://docs.aws.amazon.com/ses',
  },
  SMTP: {
    name: 'SMTP Customizado',
    description: 'Servidor SMTP personalizado',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    docs: null,
  },
};

export default function EmailConfigPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesSaving, setTemplatesSaving] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplateConfig[]>([]);
  const [emailRedirect, setEmailRedirect] = useState({ enabled: false, email: '' });
  const [redirectSaving, setRedirectSaving] = useState(false);
  const [templateTestEmail, setTemplateTestEmail] = useState('');
  const [templateTestSending, setTemplateTestSending] = useState<EmailTemplateType | null>(null);
  const [emailStatus, setEmailStatus] = useState<{ hasConfig: boolean; provider?: string; canSend: boolean; redirectTo: string | null; message: string } | null>(null);
  const [configs, setConfigs] = useState<EmailConfig[]>([
    {
      provider: 'RESEND',
      enabled: false,
      smtpSecure: true,
    },
    {
      provider: 'SENDGRID',
      enabled: false,
      smtpSecure: true,
    },
    {
      provider: 'AWS_SES',
      enabled: false,
      smtpSecure: true,
    },
    {
      provider: 'SMTP',
      enabled: false,
      smtpSecure: true,
    },
  ]);

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
      Promise.all([loadConfigs(), loadTemplates(), loadEmailRedirect()]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.role]);

  const loadEmailRedirect = async () => {
    try {
      const response = await fetch('/api/admin/email/redirect');
      if (response.ok) {
        const data = await response.json();
        setEmailRedirect({ enabled: data.enabled || false, email: data.email || '' });
      }
    } catch (error) {
      console.error('Erro ao carregar configuração de redirecionamento:', error);
    }
  };

  const handleSaveRedirect = async () => {
    try {
      setRedirectSaving(true);
      const response = await fetch('/api/admin/email/redirect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailRedirect),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || 'Configuração de redirecionamento salva!');
        await loadEmailRedirect();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar configuração');
      }
    } catch (error) {
      console.error('Erro ao salvar redirecionamento:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setRedirectSaving(false);
    }
  };

  const loadEmailStatus = async () => {
    try {
      const res = await fetch('/api/admin/email/status');
      if (res.ok) {
        const data = await res.json();
        setEmailStatus(data);
      }
    } catch {
      setEmailStatus(null);
    }
  };

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/email');
      if (response.ok) {
        const data = await response.json();
        const loadedConfigs = data.configs || [];
        
        // Mesclar com defaults; não preencher senha com valor mascarado (***) para evitar sobrescrever no banco
        setConfigs(prev => prev.map(defaultConfig => {
          const loaded = loadedConfigs.find((c: any) => c.provider === defaultConfig.provider);
          if (!loaded) return defaultConfig;
          const merged = { ...defaultConfig, ...loaded };
          const masked = merged.smtpPassword === '***' || (merged.smtpPassword && merged.smtpPassword.includes('...'));
          if (masked) merged.smtpPassword = '';
          return merged;
        }));
      }
      await loadEmailStatus();
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const response = await fetch('/api/admin/email/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast.error('Erro ao carregar templates de email');
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleSave = async (provider: Provider) => {
    try {
      setSaving(true);
      const config = configs.find(c => c.provider === provider);
      if (!config) return;

      // Não enviar senha mascarada ou vazia, para não sobrescrever a senha real no banco
      const isMasked = config.smtpPassword === '***' || (config.smtpPassword && config.smtpPassword.includes('...'));
      const payload = { ...config };
      if (payload.smtpPassword === '' || isMasked) delete payload.smtpPassword;
      // Garantir smtpPort: só enviar se for número válido (evita "Dados inválidos")
      const port = typeof payload.smtpPort === 'string' ? parseInt(payload.smtpPort, 10) : payload.smtpPort;
      if (port == null || Number.isNaN(port) || port < 1 || port > 65535) delete payload.smtpPort;
      else payload.smtpPort = port;

      const response = await fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(`${providerInfo[provider].name} configurado com sucesso!`);
        loadConfigs();
      } else {
        const error = await response.json();
        const msg = error.details?.length ? `Dados inválidos: ${error.details.map((d: { path?: string[] }) => d.path?.join('.')).join(', ')}` : (error.error || 'Erro ao salvar configuração');
        toast.error(msg);
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const handleFixTestConfig = async (provider: Provider) => {
    if (provider !== 'RESEND') return;
    
    try {
      const response = await fetch('/api/admin/email/fix-test-config', {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Configuração ajustada para usar domínio de teste do Resend!');
        await loadConfigs();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao ajustar configuração');
      }
    } catch (error) {
      console.error('Erro ao ajustar configuração:', error);
      toast.error('Erro ao ajustar configuração');
    }
  };

  const handleTest = async (provider: Provider) => {
    try {
      setTesting(provider);
      const config = configs.find(c => c.provider === provider);
      if (!config || !config.testEmail) {
        toast.error('Por favor, informe um email para teste');
        return;
      }

      const response = await fetch('/api/admin/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          testEmail: config.testEmail,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || 'Email de teste enviado com sucesso!');
        if (result.warning) {
          toast(result.warning, { icon: '⚠️', duration: 5000 });
        }
        loadConfigs();
      } else {
        const error = await response.json();
        toast.error(error.error || error.message || 'Erro ao enviar email de teste');
      }
    } catch (error) {
      console.error('Erro ao testar configuração:', error);
      toast.error('Erro ao testar configuração');
    } finally {
      setTesting(null);
    }
  };

  const updateConfig = (provider: Provider, updates: Partial<EmailConfig>) => {
    setConfigs(prev => prev.map(config =>
      config.provider === provider ? { ...config, ...updates } : config
    ));
  };

  const updateTemplate = (id: EmailTemplateType, updates: Partial<EmailTemplateConfig>) => {
    setTemplates(prev =>
      prev.map(template => (template.id === id ? { ...template, ...updates } : template))
    );
  };

  const handleSaveTemplates = async () => {
    try {
      setTemplatesSaving(true);
      const response = await fetch('/api/admin/email/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates }),
      });

      if (response.ok) {
        toast.success('Templates de email salvos com sucesso!');
        await loadTemplates();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar templates de email');
      }
    } catch (error) {
      console.error('Erro ao salvar templates:', error);
      toast.error('Erro ao salvar templates de email');
    } finally {
      setTemplatesSaving(false);
    }
  };

  const handleSendTemplateTest = async (templateId: EmailTemplateType) => {
    const email = templateTestEmail.trim() || configs.find(c => c.enabled)?.testEmail?.trim();
    if (!email) {
      toast.error('Informe um email para receber o teste (campo acima ou na configuração SMTP).');
      return;
    }
    try {
      setTemplateTestSending(templateId);
      const response = await fetch('/api/admin/email/send-template-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, testEmail: email }),
      });
      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || 'Email de teste enviado!');
        if (result.redirected) {
          toast(`Verifique a caixa de entrada de ${result.sentTo}`, { icon: '📬', duration: 6000 });
        }
      } else {
        const err = await response.json();
        toast.error(err.message || err.error || 'Erro ao enviar teste');
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao enviar email de teste');
    } finally {
      setTemplateTestSending(null);
    }
  };

  const handleResetTemplate = async (id: EmailTemplateType) => {
    const existing = templates.find(t => t.id === id);
    if (!existing) return;
    try {
      const res = await fetch('/api/admin/email/templates/defaults');
      if (!res.ok) throw new Error('Falha ao carregar padrões');
      const { defaults } = await res.json();
      const defaultTemplate = defaults?.[id];
      if (!defaultTemplate) return;
      setTemplates(prev => prev.map(t => (t.id === id ? { ...t, ...defaultTemplate } : t)));
      toast.success('Template restaurado para o padrão.');
    } catch {
      toast.error('Não foi possível restaurar o padrão.');
    }
  };

  if (loading || templatesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <SkeletonDashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Breadcrumbs items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Integrações de Email' },
          ]} />
          <h1 className="text-3xl font-bold text-gray-900 font-display mt-4">Integrações de Email</h1>
          <p className="text-gray-600 mt-2">Configure e gerencie as integrações de email do sistema</p>
        </motion.div>

        <div className="space-y-10">
          {/* Status do envio (diagnóstico) */}
          {emailStatus && (
            <section className="rounded-lg border p-4 bg-white shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Status do envio</h2>
              <div
                className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                  emailStatus.canSend ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-amber-50 border border-amber-200 text-amber-800'
                }`}
              >
                {emailStatus.canSend ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
                <div>
                  <p>{emailStatus.message}</p>
                  {emailStatus.redirectTo && (
                    <p className="mt-1 text-xs opacity-90">Redirecionamento ativo para: {emailStatus.redirectTo}</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Redirecionamento Global de Emails */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="text-primary" size={20} />
              <h2 className="text-xl font-semibold text-gray-900">
                Redirecionamento Global (Modo Teste)
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Quando ativado, <strong>todos os emails</strong> do sistema serão redirecionados para o email abaixo, 
              independente do destinatário original. Útil para testes e desenvolvimento.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="text-yellow-600 mt-0.5" size={18} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-800 mb-1">
                    ⚠️ Atenção: Modo de Teste
                  </p>
                  <p className="text-sm text-yellow-700">
                    Quando ativado, todos os emails (confirmações, receitas, pagamentos, etc.) serão enviados 
                    apenas para o email configurado abaixo. O destinatário original será indicado no assunto do email.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="space-y-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailRedirect.enabled}
                    onChange={(e) => setEmailRedirect(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Ativar redirecionamento global de emails
                  </span>
                </label>
                {emailRedirect.enabled && (
                  <Input
                    label="Email para receber todos os emails"
                    type="email"
                    value={emailRedirect.email}
                    onChange={(e) => setEmailRedirect(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="amend.chapada@gmail.com"
                  />
                )}
                <Button
                  onClick={handleSaveRedirect}
                  loading={redirectSaving}
                  disabled={emailRedirect.enabled && !emailRedirect.email}
                  className="w-full sm:w-auto"
                >
                  <Save size={18} />
                  Salvar Configuração de Redirecionamento
                </Button>
              </div>
            </div>
          </section>

          {/* Configuração de provedores de email */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="text-primary" size={20} />
              <h2 className="text-xl font-semibold text-gray-900">
                Provedores e Integrações
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Configure aqui as credenciais dos provedores de email transacional. Recomendamos
              começar pelo <strong>Resend</strong>, que tem integração simples com Next.js.
            </p>

          {configs.map((config, index) => {
            const info = providerInfo[config.provider];
            return (
              <motion.div
                key={config.provider}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Mail className={info.color} size={24} />
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{info.name}</h2>
                      <p className="text-sm text-gray-600">{info.description}</p>
                    </div>
                    {config.enabled ? (
                      <CheckCircle2 className="text-green-500" size={20} />
                    ) : (
                      <XCircle className="text-gray-400" size={20} />
                    )}
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enabled || false}
                      onChange={(e) => updateConfig(config.provider, { enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="space-y-4">
                  {/* Campos comuns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Email Remetente"
                      type="email"
                      value={config.fromEmail || ''}
                      onChange={(e) => updateConfig(config.provider, { fromEmail: e.target.value })}
                      placeholder="noreply@exemplo.com"
                    />
                    <Input
                      label="Nome Remetente"
                      type="text"
                      value={config.fromName || ''}
                      onChange={(e) => updateConfig(config.provider, { fromName: e.target.value })}
                      placeholder="CannabiLizi"
                    />
                  </div>

                  <Input
                    label="Email para Resposta (Reply-To)"
                    type="email"
                    value={config.replyTo || ''}
                    onChange={(e) => updateConfig(config.provider, { replyTo: e.target.value })}
                    placeholder="contato@exemplo.com"
                  />

                  {/* Campos específicos por provedor */}
                  {config.provider === 'RESEND' && (
                    <>
                      <Input
                        label="API Key"
                        type="password"
                        value={config.apiKey || ''}
                        onChange={(e) => updateConfig(config.provider, { apiKey: e.target.value })}
                        placeholder="re_xxxxx"
                      />
                      <Input
                        label="Domínio Verificado"
                        type="text"
                        value={config.domain || ''}
                        onChange={(e) => updateConfig(config.provider, { domain: e.target.value })}
                        placeholder="exemplo.com"
                      />
                    </>
                  )}

                  {config.provider === 'SENDGRID' && (
                    <>
                      <Input
                        label="API Key"
                        type="password"
                        value={config.apiKey || ''}
                        onChange={(e) => updateConfig(config.provider, { apiKey: e.target.value })}
                        placeholder="SG.xxxxx"
                      />
                    </>
                  )}

                  {config.provider === 'AWS_SES' && (
                    <>
                      <Input
                        label="Access Key ID"
                        type="text"
                        value={config.apiKey || ''}
                        onChange={(e) => updateConfig(config.provider, { apiKey: e.target.value })}
                        placeholder="AKIAxxxxx"
                      />
                      <Input
                        label="Secret Access Key"
                        type="password"
                        value={config.apiSecret || ''}
                        onChange={(e) => updateConfig(config.provider, { apiSecret: e.target.value })}
                        placeholder="xxxxx"
                      />
                      <Input
                        label="Região"
                        type="text"
                        value={config.region || ''}
                        onChange={(e) => updateConfig(config.provider, { region: e.target.value })}
                        placeholder="us-east-1"
                      />
                    </>
                  )}

                  {config.provider === 'SMTP' && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Host SMTP"
                          type="text"
                          value={config.smtpHost || ''}
                          onChange={(e) => updateConfig(config.provider, { smtpHost: e.target.value })}
                          placeholder="smtp.exemplo.com"
                        />
                        <Input
                          label="Porta"
                          type="number"
                          value={config.smtpPort || ''}
                          onChange={(e) => updateConfig(config.provider, { smtpPort: parseInt(e.target.value) || undefined })}
                          placeholder="587"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Usuário SMTP"
                          type="text"
                          value={config.smtpUser || ''}
                          onChange={(e) => updateConfig(config.provider, { smtpUser: e.target.value })}
                          placeholder="usuario@exemplo.com"
                        />
                        <Input
                          label="Senha SMTP"
                          type="password"
                          value={config.smtpPassword || ''}
                          onChange={(e) => updateConfig(config.provider, { smtpPassword: e.target.value })}
                          placeholder="Senha de app do Gmail (16 caracteres)"
                        />
                        <p className="text-xs text-gray-500 -mt-2 mb-1">
                          Gmail: use uma <strong>senha de app</strong> (não a senha da conta). Pode colar com ou sem espaços.
                        </p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.smtpSecure || false}
                          onChange={(e) => updateConfig(config.provider, { smtpSecure: e.target.checked })}
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="text-sm text-gray-700">Usar TLS/SSL</span>
                      </label>
                    </>
                  )}

                  {/* Email de teste */}
                  <Input
                    label="Email para Teste"
                    type="email"
                    value={config.testEmail || ''}
                    onChange={(e) => updateConfig(config.provider, { testEmail: e.target.value })}
                    placeholder="seu-email@gmail.com"
                  />
                  <p className="text-xs text-gray-500 -mt-2 mb-1">
                    Use um email real seu para receber o teste (ex.: Gmail).
                  </p>

                  {/* Informações de ajuda */}
                  {info.docs && (
                    <div className={`${info.bgColor} border ${info.borderColor} rounded-lg p-4`}>
                      <div className="flex items-start gap-2">
                        <AlertCircle className={`${info.color} mt-0.5`} size={18} />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800 mb-1">
                            Como obter as credenciais:
                          </p>
                          <p className="text-sm text-gray-700 mb-2">
                            Consulte a documentação oficial do {info.name} para obter suas credenciais de API.
                          </p>
                          <a
                            href={info.docs}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-700 underline"
                          >
                            Ver documentação →
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Resultado do último teste */}
                  {config.lastTestAt && config.lastTestResult && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700">
                        <strong>Último teste:</strong> {new Date(config.lastTestAt).toLocaleString('pt-BR')}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {JSON.parse(config.lastTestResult).message || 'Teste realizado'}
                      </p>
                    </div>
                  )}

                  {/* Botões de ação */}
                  <div className="flex gap-3 flex-wrap">
                    <Button
                      onClick={() => handleSave(config.provider)}
                      loading={saving}
                      className="flex-1"
                    >
                      <Save size={20} />
                      Salvar Configuração
                    </Button>
                    {config.provider === 'RESEND' && (
                      <Button
                        onClick={() => handleFixTestConfig(config.provider)}
                        variant="outline"
                        className="flex-1"
                        title="Ajusta automaticamente para usar onboarding@resend.dev (domínio de teste)"
                      >
                        <Settings size={20} />
                        Usar Domínio de Teste
                      </Button>
                    )}
                    {config.enabled && (
                      <Button
                        onClick={() => handleTest(config.provider)}
                        loading={testing === config.provider}
                        variant="outline"
                        className="flex-1"
                      >
                        <Send size={20} />
                        Testar Envio
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
            </section>

            {/* Templates de email */}
            <section className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="text-primary" size={20} />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Modelos de Emails Transacionais
                  </h2>
                </div>
                <Button
                  onClick={handleSaveTemplates}
                  loading={templatesSaving}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Save size={18} />
                  Salvar modelos
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Edite abaixo os textos e HTML dos emails automáticos. Você pode usar variáveis
                como <code className="bg-gray-100 px-1 rounded">{'{{patientName}}'}</code>,{' '}
                <code className="bg-gray-100 px-1 rounded">{'{{consultationDateTime}}'}</code>,{' '}
                <code className="bg-gray-100 px-1 rounded">{'{{amount}}'}</code> e{' '}
                <code className="bg-gray-100 px-1 rounded">{'{{prescriptionUrl}}'}</code>. Use{' '}
                <code className="bg-gray-100 px-1 rounded">
                  {'{{#if meetingLink}}'} ... {'{{/if}}'}
                </code>{' '}
                para blocos condicionais.
              </p>

              {emailRedirect.enabled && emailRedirect.email && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>
                    <strong>Redirecionamento ativo:</strong> todos os emails de teste são enviados para{' '}
                    <strong>{emailRedirect.email}</strong>. Verifique a caixa de entrada (e o spam) desse endereço.
                  </span>
                </div>
              )}
              <div className="flex flex-wrap items-end gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    label="Email para receber testes dos modelos"
                    type="email"
                    value={templateTestEmail}
                    onChange={e => setTemplateTestEmail(e.target.value)}
                    placeholder="seu-email@gmail.com"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Preencha acima e use o botão &quot;Enviar teste&quot; em cada modelo abaixo.
                </p>
              </div>

              <div className="space-y-6">
                {templates.map(template => (
                  <div key={template.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-600">{template.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendTemplateTest(template.id)}
                          disabled={!!templateTestSending}
                          loading={templateTestSending === template.id}
                          className="flex items-center gap-1"
                        >
                          <Send size={16} />
                          Enviar teste
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResetTemplate(template.id)}
                        >
                          Restaurar padrão
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Input
                        label="Assunto do email"
                        type="text"
                        value={template.subject}
                        onChange={e =>
                          updateTemplate(template.id, { subject: e.target.value })
                        }
                      />
                      <Textarea
                        label="HTML do email"
                        value={template.html}
                        onChange={e =>
                          updateTemplate(template.id, { html: e.target.value })
                        }
                        rows={10}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
      </div>
    </div>
  );
}
