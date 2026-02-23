'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BarChart3,
  CheckCircle2,
  ExternalLink,
  Info,
  Save,
  Shield,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import LoadingPage from '@/components/ui/Loading';

interface AnalyticsConfig {
  enabled: boolean;
  measurementId: string;
}

const TRACKED_PAGES = [
  { path: '/', label: 'Home (página inicial)' },
  { path: '/login', label: 'Login' },
  { path: '/blog', label: 'Blog (listagem)' },
  { path: '/blog/[slug]', label: 'Blog (artigo)' },
  { path: '/sobre', label: 'Sobre' },
  { path: '/contato', label: 'Contato' },
  { path: '/privacidade', label: 'Política de Privacidade' },
  { path: '/termos', label: 'Termos de Uso' },
  { path: '/paciente', label: 'Área do Paciente (dashboard)' },
  { path: '/paciente/consultas', label: 'Paciente – Minhas consultas' },
  { path: '/paciente/consultas/[id]', label: 'Paciente – Detalhe da consulta' },
  { path: '/paciente/receitas', label: 'Paciente – Receitas' },
  { path: '/paciente/pagamentos', label: 'Paciente – Pagamentos' },
  { path: '/paciente/perfil', label: 'Paciente – Perfil' },
  { path: '/paciente/carteirinha', label: 'Paciente – Carteirinha' },
  { path: '/paciente/documentos', label: 'Paciente – Documentos' },
  { path: '/medico', label: 'Área do Médico (dashboard)' },
  { path: '/medico/receitas', label: 'Médico – Receitas' },
  { path: '/medico/consultas', label: 'Médico – Consultas' },
  { path: '/admin', label: 'Admin – Dashboard' },
  { path: '/admin/metricas', label: 'Admin – Métricas' },
  { path: '/admin/consultas', label: 'Admin – Consultas' },
  { path: '/admin/pacientes', label: 'Admin – Pacientes' },
  { path: '/admin/medicos', label: 'Admin – Médicos' },
  { path: '/admin/receitas', label: 'Admin – Receitas' },
  { path: '/admin/pagamentos', label: 'Admin – Pagamentos' },
  { path: '/admin/blog', label: 'Admin – Blog' },
  { path: '/admin/whatsapp', label: 'Admin – WhatsApp' },
  { path: '/admin/email', label: 'Admin – Email' },
  { path: '/admin/telemedicina', label: 'Admin – Telemedicina' },
  { path: '/admin/integracoes/analytics', label: 'Admin – Google Analytics' },
];

export default function AdminAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTrackedPages, setShowTrackedPages] = useState(false);
  const [config, setConfig] = useState<AnalyticsConfig>({
    enabled: false,
    measurementId: '',
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
  }, [status, session?.user?.role, router]);

  useEffect(() => {
    if (session?.user.role === 'ADMIN') loadConfig();
  }, [session?.user?.role]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const data = await res.json();
        setConfig({ enabled: data.enabled, measurementId: data.measurementId || '' });
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (config.enabled && !config.measurementId.trim()) {
      toast.error('Informe o ID de medição (GA4) quando Analytics estiver ativado.');
      return;
    }
    try {
      setSaving(true);
      const res = await fetch('/api/admin/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: config.enabled,
          measurementId: config.measurementId.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao salvar');
        return;
      }
      toast.success('Configurações salvas com sucesso.');
      await loadConfig();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading') return <LoadingPage />;
  if (!session || session.user.role !== 'ADMIN') return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Integrações', href: '#' },
          { label: 'Google Analytics', href: '/admin/integracoes/analytics' },
        ]}
      />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 font-display flex items-center gap-3">
          <BarChart3 size={32} className="text-blue-600" />
          Google Analytics (GA4)
        </h1>
        <p className="text-gray-600 mt-2">
          Integre o Google Analytics 4 à plataforma para acompanhar acessos, páginas mais visitadas,
          regiões e comportamento dos usuários, sem depender de dados cadastrais.
        </p>
      </motion.div>

      {loading ? (
        <SkeletonDashboard />
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield size={20} className="text-gray-600" />
              Configuração
            </h2>

            <div className="flex items-center gap-3 mb-6">
              <input
                type="checkbox"
                id="analytics-enabled"
                checked={config.enabled}
                onChange={(e) => setConfig((c) => ({ ...c, enabled: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="analytics-enabled" className="font-medium text-gray-700">
                Ativar Google Analytics na plataforma
              </label>
            </div>

            <div className="space-y-2 mb-4">
              <label htmlFor="measurement-id" className="block text-sm font-medium text-gray-700">
                ID de medição (GA4) <span className="text-red-500">*</span>
              </label>
              <Input
                id="measurement-id"
                type="text"
                placeholder="G-XXXXXXXXXX"
                value={config.measurementId}
                onChange={(e) => setConfig((c) => ({ ...c, measurementId: e.target.value }))}
                disabled={!config.enabled}
              />
              <p className="text-xs text-gray-500">
                Encontre em: Admin GA4 → Propriedade → Fluxos de dados → Seu fluxo da web → ID de medição
              </p>
            </div>

            <div className="flex items-center gap-2 mt-6">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando…' : 'Salvar'}
              </Button>
              {config.enabled && config.measurementId && (
                <span className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 size={18} />
                  Analytics ativo
                </span>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200"
          >
            <div className="flex gap-2">
              <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Como obter o ID de medição</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-800">
                  <li>Acesse o{' '}
                    <a
                      href="https://analytics.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium inline-flex items-center gap-1"
                    >
                      Google Analytics <ExternalLink size={14} />
                    </a>
                    .
                  </li>
                  <li>Selecione a propriedade GA4 (ou crie uma).</li>
                  <li>Vá em Admin → Fluxos de dados → Web → escolha o fluxo do site.</li>
                  <li>Copie o &quot;ID de medição&quot; (formato G-XXXXXXXXXX) e cole acima.</li>
                </ol>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setShowTrackedPages(!showTrackedPages)}
              className="w-full flex items-center justify-between p-4 text-left font-semibold text-gray-900 hover:bg-gray-50"
            >
              <span className="flex items-center gap-2">
                <FileText size={20} className="text-gray-600" />
                Páginas e rotas acompanhadas
              </span>
              {showTrackedPages ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {showTrackedPages && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <p className="text-sm text-gray-600 mb-3">
                  O GA4 registra automaticamente <strong>page_view</strong> em toda navegação da aplicação.
                  Abaixo, as rotas que serão identificadas nos relatórios:
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {TRACKED_PAGES.map((p) => (
                    <li key={p.path} className="flex items-center gap-2 text-gray-700">
                      <span className="text-gray-400 font-mono text-xs">{p.path}</span>
                      <span className="text-gray-500">→</span>
                      <span>{p.label}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-gray-500 mt-3">
                  Qualquer outra rota (ex.: /admin/usuarios/123/editar) também é enviada como page_view
                  com o path completo. No GA4 você pode ver relatórios por página, região, dispositivo e sessão.
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
