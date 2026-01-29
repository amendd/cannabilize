'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, CheckCircle2, XCircle, Save, AlertCircle, Info, ExternalLink, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { SkeletonDashboard } from '@/components/ui/Skeleton';

interface RecaptchaConfig {
  enabled: boolean;
  siteKey: string;
  secretKey: string;
  threshold: number;
  hasSecretKey: boolean;
}

export default function SecurityConfigPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [config, setConfig] = useState<RecaptchaConfig>({
    enabled: false,
    siteKey: '',
    secretKey: '',
    threshold: 0.5,
    hasSecretKey: false,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.role]);

  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      loadConfig();
    }
  }, [session]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/security/recaptcha');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      } else {
        toast.error('Erro ao carregar configurações');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config.enabled) {
      // Se desativado, apenas salvar o status
      await saveConfig({ ...config, siteKey: '', secretKey: '' });
      return;
    }

    // Validações
    if (!config.siteKey || !config.siteKey.trim()) {
      toast.error('Site Key é obrigatória');
      return;
    }

    if (!config.secretKey || config.secretKey === '***' || !config.secretKey.trim()) {
      if (!config.hasSecretKey) {
        toast.error('Secret Key é obrigatória');
        return;
      }
      // Se tem secret key mas está oculto, não atualizar
      const currentConfig = await fetch('/api/admin/security/recaptcha').then(r => r.json());
      config.secretKey = currentConfig.secretKey || '';
    }

    if (config.threshold < 0 || config.threshold > 1) {
      toast.error('Threshold deve estar entre 0.0 e 1.0');
      return;
    }

    await saveConfig(config);
  };

  const saveConfig = async (data: RecaptchaConfig) => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/security/recaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: data.enabled,
          siteKey: data.siteKey,
          secretKey: data.secretKey === '***' ? undefined : data.secretKey,
          threshold: data.threshold,
        }),
      });

      if (response.ok) {
        toast.success('Configurações salvas com sucesso!');
        await loadConfig(); // Recarregar para obter valores atualizados
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config.enabled || !config.siteKey) {
      toast.error('Configure e ative o reCAPTCHA antes de testar');
      return;
    }

    // Executar reCAPTCHA no frontend
    if (typeof window !== 'undefined' && (window as any).grecaptcha) {
      try {
        (window as any).grecaptcha.ready(async () => {
          const token = await (window as any).grecaptcha.execute(config.siteKey, {
            action: 'test',
          });

          // Enviar para o servidor validar
          const response = await fetch('/api/admin/security/recaptcha', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ testToken: token }),
          });

          const result = await response.json();
          if (result.success) {
            toast.success(
              `Teste bem-sucedido! Score: ${result.score?.toFixed(2) || 'N/A'}`,
              { duration: 5000 }
            );
          } else {
            toast.error(
              `Teste falhou: ${result['error-codes']?.join(', ') || 'Erro desconhecido'}`,
              { duration: 5000 }
            );
          }
        });
      } catch (error) {
        toast.error('Erro ao executar teste');
      }
    } else {
      toast.error('reCAPTCHA não carregado. Recarregue a página.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SkeletonDashboard />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Segurança', href: '/admin/seguranca' },
        ]}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-6 mb-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurações de Segurança</h1>
            <p className="text-gray-600">Gerencie proteções contra bots e spam</p>
          </div>
        </div>

        {/* Status */}
        <div className="mb-6 p-4 rounded-lg border-2 border-dashed" style={{
          backgroundColor: config.enabled ? '#f0fdf4' : '#fef2f2',
          borderColor: config.enabled ? '#86efac' : '#fca5a5',
        }}>
          <div className="flex items-center gap-3">
            {config.enabled ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">reCAPTCHA Ativado</p>
                  <p className="text-sm text-green-700">
                    O sistema está protegendo formulários contra bots
                  </p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-semibold text-red-900">reCAPTCHA Desativado</p>
                  <p className="text-sm text-red-700">
                    Formulários não estão protegidos por reCAPTCHA
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Toggle Ativar/Desativar */}
        <div className="mb-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-lg font-medium text-gray-900">
              Ativar reCAPTCHA v3
            </span>
          </label>
          <p className="text-sm text-gray-600 ml-8 mt-1">
            Protege formulários contra bots e spam de forma invisível
          </p>
        </div>

        {/* Configurações */}
        {config.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-6 border-t pt-6"
          >
            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-blue-900 font-medium mb-1">
                    Como obter as chaves do reCAPTCHA
                  </p>
                  <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
                    <li>Acesse{' '}
                      <a
                        href="https://www.google.com/recaptcha/admin/create"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline inline-flex items-center gap-1"
                      >
                        Google reCAPTCHA Admin
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                    <li>Crie um novo site do tipo <strong>reCAPTCHA v3</strong></li>
                    <li>Adicione seus domínios (localhost para dev, seu domínio para produção)</li>
                    <li>Copie a <strong>Site Key</strong> e <strong>Secret Key</strong></li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Site Key */}
            <div>
              <Input
                label="Site Key (Chave Pública)"
                type="text"
                value={config.siteKey}
                onChange={(e) => setConfig({ ...config, siteKey: e.target.value })}
                placeholder="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Esta chave é pública e pode ser exposta no frontend
              </p>
            </div>

            {/* Secret Key */}
            <div>
              <div className="relative">
                <Input
                  label="Secret Key (Chave Privada)"
                  type={showSecretKey ? 'text' : 'password'}
                  value={config.secretKey}
                  onChange={(e) => setConfig({ ...config, secretKey: e.target.value })}
                  placeholder={config.hasSecretKey ? '***' : '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                >
                  {showSecretKey ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Esta chave é privada e NUNCA deve ser exposta. Mantenha em segredo!
              </p>
            </div>

            {/* Threshold */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Threshold (Score Mínimo)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.threshold}
                  onChange={(e) => setConfig({ ...config, threshold: parseFloat(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-lg font-semibold text-gray-900 w-12 text-center">
                  {config.threshold.toFixed(1)}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-600 space-y-1">
                <p>
                  <strong>0.0 - 0.3:</strong> Muito restritivo (pode bloquear usuários legítimos)
                </p>
                <p>
                  <strong>0.3 - 0.5:</strong> Restritivo (recomendado para formulários sensíveis)
                </p>
                <p>
                  <strong>0.5 - 0.7:</strong> Moderado (recomendado para maioria dos casos) ✓
                </p>
                <p>
                  <strong>0.7 - 1.0:</strong> Permissivo (pode deixar passar alguns bots)
                </p>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
              <Button
                onClick={handleTest}
                variant="outline"
                disabled={!config.enabled || !config.siteKey}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Testar
              </Button>
            </div>
          </motion.div>
        )}

        {/* Botão Salvar quando desativado */}
        {!config.enabled && (
          <div className="pt-6 border-t">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        )}
      </motion.div>

      {/* Carregar script do reCAPTCHA para testes */}
      {config.enabled && config.siteKey && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${config.siteKey}`}
          strategy="lazyOnload"
        />
      )}
    </div>
  );
}
