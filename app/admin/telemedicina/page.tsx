'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Video, Settings, CheckCircle2, XCircle, Save, TestTube } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { SkeletonDashboard } from '@/components/ui/Skeleton';

type Platform = 'ZOOM' | 'GOOGLE_MEET';

interface TelemedicineConfig {
  id?: string;
  platform: Platform;
  enabled: boolean;
  apiKey?: string;
  apiSecret?: string;
  accountId?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  defaultDuration: number;
  requirePassword: boolean;
  waitingRoom: boolean;
}

export default function TelemedicineConfigPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [preferredPlatform, setPreferredPlatform] = useState<Platform | null>(null);
  const [configs, setConfigs] = useState<TelemedicineConfig[]>([
    {
      platform: 'GOOGLE_MEET',
      enabled: false,
      defaultDuration: 30,
      requirePassword: false,
      waitingRoom: true,
    },
    {
      platform: 'ZOOM',
      enabled: false,
      defaultDuration: 30,
      requirePassword: false,
      waitingRoom: true,
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
      loadConfigs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.role]);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/telemedicine');
      if (response.ok) {
        const data = await response.json();
        const loadedConfigs = data.configs || [];
        
        // Mesclar com defaults, mas preservar valores existentes se o valor carregado for mascarado
        setConfigs(prev => prev.map(defaultConfig => {
          const loaded = loadedConfigs.find((c: any) => c.platform === defaultConfig.platform);
          if (!loaded) return defaultConfig;
          
          // Se o valor carregado for mascarado (***) e já temos um valor no estado, manter o valor do estado
          const merged = { ...defaultConfig, ...loaded };
          
          // Preservar secrets se o valor retornado for mascarado
          if (loaded.clientSecret === '***' || loaded.clientSecret === null) {
            const currentConfig = prev.find(c => c.platform === defaultConfig.platform);
            if (currentConfig?.clientSecret && currentConfig.clientSecret !== '***') {
              merged.clientSecret = currentConfig.clientSecret;
            }
          }
          
          if (loaded.apiSecret === '***' || loaded.apiSecret === null) {
            const currentConfig = prev.find(c => c.platform === defaultConfig.platform);
            if (currentConfig?.apiSecret && currentConfig.apiSecret !== '***') {
              merged.apiSecret = currentConfig.apiSecret;
            }
          }
          
          if (loaded.refreshToken === '***' || loaded.refreshToken === null) {
            const currentConfig = prev.find(c => c.platform === defaultConfig.platform);
            if (currentConfig?.refreshToken && currentConfig.refreshToken !== '***') {
              merged.refreshToken = currentConfig.refreshToken;
            }
          }
          
          if (loaded.webhookSecret === '***' || loaded.webhookSecret === null) {
            const currentConfig = prev.find(c => c.platform === defaultConfig.platform);
            if (currentConfig?.webhookSecret && currentConfig.webhookSecret !== '***') {
              merged.webhookSecret = currentConfig.webhookSecret;
            }
          }
          
          return merged;
        }));
      }

      // Carregar preferência de plataforma
      const prefResponse = await fetch('/api/admin/telemedicine/preference');
      if (prefResponse.ok) {
        const prefData = await prefResponse.json();
        setPreferredPlatform(prefData.preferredPlatform || null);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (platform: Platform) => {
    try {
      setSaving(true);
      const config = configs.find(c => c.platform === platform);
      if (!config) return;

      const response = await fetch('/api/admin/telemedicine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`${platform === 'GOOGLE_MEET' ? 'Google Meet' : 'Zoom'} configurado com sucesso!`);
        
        // Atualizar apenas os campos não-sensíveis da resposta, preservando secrets no estado
        if (result.config) {
          setConfigs(prev => prev.map(c => {
            if (c.platform === platform) {
              return {
                ...c,
                ...result.config,
                // Preservar secrets existentes se a resposta tiver valores mascarados
                clientSecret: result.config.clientSecret === '***' || result.config.clientSecret === null 
                  ? c.clientSecret 
                  : result.config.clientSecret,
                apiSecret: result.config.apiSecret === '***' || result.config.apiSecret === null 
                  ? c.apiSecret 
                  : result.config.apiSecret,
                refreshToken: result.config.refreshToken === '***' || result.config.refreshToken === null 
                  ? c.refreshToken 
                  : result.config.refreshToken,
                webhookSecret: result.config.webhookSecret === '***' || result.config.webhookSecret === null 
                  ? c.webhookSecret 
                  : result.config.webhookSecret,
              };
            }
            return c;
          }));
        }
      } else {
        const error = await response.json();
        const errorMessage = error.details 
          ? `${error.error || 'Erro ao salvar configuração'}: ${JSON.stringify(error.details)}`
          : error.error || 'Erro ao salvar configuração';
        console.error('Erro ao salvar configuração:', error);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (platform: Platform, updates: Partial<TelemedicineConfig>) => {
    setConfigs(prev => prev.map(config =>
      config.platform === platform ? { ...config, ...updates } : config
    ));
  };

  const handleSavePreference = async (platform: Platform | null) => {
    try {
      const response = await fetch('/api/admin/telemedicine/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredPlatform: platform }),
      });

      if (response.ok) {
        const result = await response.json();
        setPreferredPlatform(result.preferredPlatform);
        toast.success('Preferência de plataforma salva com sucesso!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar preferência');
      }
    } catch (error) {
      console.error('Erro ao salvar preferência:', error);
      toast.error('Erro ao salvar preferência');
    }
  };

  const handleTest = async (platform: Platform) => {
    try {
      setTesting(platform);
      const config = configs.find(c => c.platform === platform);
      if (!config) return;

      const testData: any = {
        platform,
      };

      if (platform === 'GOOGLE_MEET') {
        if (!config.clientId || !config.clientSecret || !config.refreshToken) {
          toast.error('Preencha Client ID, Client Secret e Refresh Token antes de testar');
          return;
        }
        testData.clientId = config.clientId;
        testData.clientSecret = config.clientSecret;
        testData.refreshToken = config.refreshToken;
      } else if (platform === 'ZOOM') {
        if (!config.accountId || !config.clientId || !config.clientSecret) {
          toast.error('Preencha Account ID, Client ID e Client Secret antes de testar');
          return;
        }
        testData.accountId = config.accountId;
        testData.clientId = config.clientId;
        testData.clientSecret = config.clientSecret;
      }

      const response = await fetch('/api/admin/telemedicine/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || 'Credenciais válidas!', { duration: 5000 });
      } else {
        // Exibir erro com quebra de linha se houver
        const errorMsg = result.error || 'Erro ao testar credenciais';
        toast.error(errorMsg, { 
          duration: 8000,
          style: { whiteSpace: 'pre-line' } // Permite quebra de linha
        });
      }
    } catch (error) {
      console.error('Erro ao testar credenciais:', error);
      toast.error('Erro ao testar credenciais');
    } finally {
      setTesting(null);
    }
  };

  if (loading) {
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Breadcrumbs items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Telemedicina' },
          ]} />
          <h1 className="text-3xl font-bold text-gray-900 font-display mt-4">Configuração de Telemedicina</h1>
          <p className="text-gray-600 mt-2">Configure as integrações com Zoom e Google Meet</p>
        </motion.div>

        {/* Configuração de Prioridade */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Settings className="text-primary" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Plataforma Prioritária</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Quando ambas as plataformas estiverem ativas e configuradas, selecione qual terá prioridade ao criar reuniões.
          </p>
          <div className="flex items-center gap-4">
            <select
              value={preferredPlatform || ''}
              onChange={(e) => {
                const value = e.target.value as Platform | '';
                handleSavePreference(value || null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Automático (Zoom primeiro, depois Google Meet)</option>
              <option value="ZOOM">Zoom (Prioritário)</option>
              <option value="GOOGLE_MEET">Google Meet (Prioritário)</option>
            </select>
            {preferredPlatform && (
              <span className="text-sm text-gray-500">
                {preferredPlatform === 'ZOOM' ? 'Zoom' : 'Google Meet'} será usado quando ambas estiverem disponíveis
              </span>
            )}
          </div>
        </motion.div>

        <div className="space-y-6">
          {/* Google Meet */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Video className="text-blue-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Google Meet</h2>
                {configs.find(c => c.platform === 'GOOGLE_MEET')?.enabled ? (
                  <CheckCircle2 className="text-green-500" size={20} />
                ) : (
                  <XCircle className="text-gray-400" size={20} />
                )}
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={configs.find(c => c.platform === 'GOOGLE_MEET')?.enabled || false}
                  onChange={(e) => updateConfig('GOOGLE_MEET', { enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="space-y-4">
              <Input
                label="Client ID (Google OAuth)"
                type="text"
                value={configs.find(c => c.platform === 'GOOGLE_MEET')?.clientId || ''}
                onChange={(e) => updateConfig('GOOGLE_MEET', { clientId: e.target.value })}
                placeholder="xxxxx.apps.googleusercontent.com"
              />

              <Input
                label="Client Secret (Google OAuth)"
                type="password"
                value={configs.find(c => c.platform === 'GOOGLE_MEET')?.clientSecret || ''}
                onChange={(e) => updateConfig('GOOGLE_MEET', { clientSecret: e.target.value })}
                placeholder="GOCSPX-xxxxx"
              />

              <Input
                label="Refresh Token"
                type="password"
                value={configs.find(c => c.platform === 'GOOGLE_MEET')?.refreshToken || ''}
                onChange={(e) => updateConfig('GOOGLE_MEET', { refreshToken: e.target.value })}
                placeholder="1//xxxxx"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Duração Padrão (minutos)"
                  type="number"
                  min="15"
                  max="120"
                  value={configs.find(c => c.platform === 'GOOGLE_MEET')?.defaultDuration || 30}
                  onChange={(e) => updateConfig('GOOGLE_MEET', { defaultDuration: parseInt(e.target.value) || 30 })}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Como obter as credenciais:</strong>
                </p>
                <ol className="list-decimal list-inside text-sm text-blue-700 mt-2 space-y-1">
                  <li>Acesse o Google Cloud Console</li>
                  <li>Crie um projeto ou selecione um existente</li>
                  <li>Habilite a Google Calendar API</li>
                  <li>Crie credenciais OAuth 2.0</li>
                  <li>Configure o redirect URI</li>
                  <li>Obtenha o refresh token usando o OAuth Playground</li>
                </ol>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <a 
                    href="/GUIA_CREDENCIAIS_GOOGLE_MEET.md" 
                    target="_blank"
                    className="text-sm text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    📖 Ver guia completo passo a passo
                  </a>
                </div>
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-xs text-yellow-800 font-semibold mb-2">
                    ⚠️ ATENÇÃO: Não use credenciais do Zoom aqui!
                  </p>
                  <p className="text-xs text-yellow-700">
                    <strong>Google Meet:</strong> Client ID termina com <code>.apps.googleusercontent.com</code> ou é uma string longa (25+ caracteres)
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    <strong>Zoom:</strong> Client ID é mais curto (10-20 caracteres) e usa Account ID separado
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleTest('GOOGLE_MEET')}
                  loading={testing === 'GOOGLE_MEET'}
                  disabled={testing === 'GOOGLE_MEET' || saving}
                  variant="secondary"
                  className="w-full"
                >
                  <TestTube size={18} />
                  Testar Credenciais
                </Button>
                <Button
                  onClick={() => handleSave('GOOGLE_MEET')}
                  loading={saving}
                  disabled={testing === 'GOOGLE_MEET'}
                  className="w-full"
                >
                  <Save size={20} />
                  Salvar
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Zoom */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Video className="text-blue-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Zoom</h2>
                {configs.find(c => c.platform === 'ZOOM')?.enabled ? (
                  <CheckCircle2 className="text-green-500" size={20} />
                ) : (
                  <XCircle className="text-gray-400" size={20} />
                )}
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={configs.find(c => c.platform === 'ZOOM')?.enabled || false}
                  onChange={(e) => updateConfig('ZOOM', { enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="space-y-4">
              <Input
                label="Account ID"
                type="text"
                value={configs.find(c => c.platform === 'ZOOM')?.accountId || ''}
                onChange={(e) => updateConfig('ZOOM', { accountId: e.target.value })}
                placeholder="xxxxx"
              />

              <Input
                label="Client ID"
                type="text"
                value={configs.find(c => c.platform === 'ZOOM')?.clientId || ''}
                onChange={(e) => updateConfig('ZOOM', { clientId: e.target.value })}
                placeholder="xxxxx"
              />

              <Input
                label="Client Secret"
                type="password"
                value={configs.find(c => c.platform === 'ZOOM')?.clientSecret || ''}
                onChange={(e) => updateConfig('ZOOM', { clientSecret: e.target.value })}
                placeholder="xxxxx"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Duração Padrão (minutos)"
                  type="number"
                  min="15"
                  max="120"
                  value={configs.find(c => c.platform === 'ZOOM')?.defaultDuration || 30}
                  onChange={(e) => updateConfig('ZOOM', { defaultDuration: parseInt(e.target.value) || 30 })}
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={configs.find(c => c.platform === 'ZOOM')?.requirePassword || false}
                    onChange={(e) => updateConfig('ZOOM', { requirePassword: e.target.checked })}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">Exigir senha nas reuniões</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={configs.find(c => c.platform === 'ZOOM')?.waitingRoom || false}
                    onChange={(e) => updateConfig('ZOOM', { waitingRoom: e.target.checked })}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">Habilitar sala de espera</span>
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Como obter as credenciais:</strong>
                </p>
                <ol className="list-decimal list-inside text-sm text-blue-700 mt-2 space-y-1">
                  <li>Acesse o Zoom Marketplace</li>
                  <li>Crie um Server-to-Server OAuth app</li>
                  <li>Copie o Account ID, Client ID e Client Secret</li>
                  <li>Configure as permissões necessárias</li>
                </ol>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleTest('ZOOM')}
                  loading={testing === 'ZOOM'}
                  disabled={testing === 'ZOOM' || saving}
                  variant="secondary"
                  className="w-full"
                >
                  <TestTube size={18} />
                  Testar Credenciais
                </Button>
                <Button
                  onClick={() => handleSave('ZOOM')}
                  loading={saving}
                  disabled={testing === 'ZOOM'}
                  className="w-full"
                >
                  <Save size={20} />
                  Salvar
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
