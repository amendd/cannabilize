'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Bot, Save, CheckCircle2, XCircle, Info, MessageSquare, Settings, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { SkeletonDashboard } from '@/components/ui/Skeleton';

export default function AdminWhatsAppIaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [provider, setProvider] = useState<'openai' | 'groq'>('openai');
  const [model, setModel] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [clearKeyOnSave, setClearKeyOnSave] = useState(false);
  const [keyConfigured, setKeyConfigured] = useState(false);
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [defaultInstructions, setDefaultInstructions] = useState('');
  const [testMessage, setTestMessage] = useState('Vocês atendem aos sábados?');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; reply: string | null; usedFallback?: boolean; error?: string } | null>(null);

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
  }, [status, session?.user?.role, router]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/settings/whatsapp-ai');
      if (res.ok) {
        const data = await res.json();
        setEnabled(data.enabled !== false);
        setProvider(data.provider === 'groq' ? 'groq' : 'openai');
        setModel(data.model ?? '');
        setKeyConfigured(!!data.keyConfigured);
        setHasStoredKey(!!data.hasStoredKey);
        const defaultText = data.defaultInstructions ?? '';
        setDefaultInstructions(defaultText);
        setInstructions((data.instructions && data.instructions.length > 0) ? data.instructions : defaultText);
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar configuração');
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    try {
      setSaving(true);
      const body: Record<string, unknown> = {
        enabled,
        provider,
        model: model.trim() || null,
        instructions: instructions.trim() || null,
      };
      if (clearKeyOnSave) {
        body.apiKey = null;
      } else if (apiKeyInput.trim()) {
        body.apiKey = apiKeyInput.trim();
      }
      const res = await fetch('/api/admin/settings/whatsapp-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Configuração salva.');
        setEnabled(data.enabled !== false);
        setProvider(data.provider === 'groq' ? 'groq' : 'openai');
        setModel(data.model ?? '');
        setKeyConfigured(!!data.keyConfigured);
        setHasStoredKey(!!data.hasStoredKey);
        const defaultText = data.defaultInstructions ?? '';
        setDefaultInstructions(defaultText);
        setInstructions((data.instructions && data.instructions.length > 0) ? data.instructions : defaultText);
        setApiKeyInput('');
        setClearKeyOnSave(false);
      } else {
        toast.error(data?.error || 'Erro ao salvar');
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const runTest = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const res = await fetch('/api/admin/settings/whatsapp-ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testMessage.trim() || undefined }),
      });
      const data = await res.json();
      setTestResult({
        success: data.success,
        reply: data.reply ?? null,
        usedFallback: data.usedFallback,
        error: data.error ?? null,
      });
      if (data.success && data.reply) {
        toast.success(data.usedFallback ? 'Fallback exibido (IA não respondeu).' : 'IA respondeu com sucesso.');
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (e) {
      console.error(e);
      setTestResult({ success: false, reply: null, error: 'Erro ao testar' });
      toast.error('Erro ao testar a IA');
    } finally {
      setTesting(false);
    }
  };

  if (status === 'loading' || loading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'WhatsApp', href: '/admin/whatsapp' },
            { label: 'IA no WhatsApp', href: '/admin/whatsapp/ia' },
          ]}
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Bot className="text-primary" size={28} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">IA no WhatsApp</h1>
              <p className="text-sm text-gray-500">
                Responde dúvidas que não caíram no FAQ durante o agendamento
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 space-y-6">
              {/* Ativar/Desativar integração de IA - em destaque no topo */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="font-semibold text-gray-900">Integração de IA</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {enabled
                      ? 'A IA responde dúvidas que não caíram no FAQ. Desative para usar apenas FAQ e mensagem de atendente.'
                      : 'Desativada: só o FAQ e a mensagem de fallback (atendente) são usados no WhatsApp.'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  onClick={() => setEnabled((e) => !e)}
                  className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    enabled ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition ${
                      enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-sm text-gray-500 -mt-2">
                {enabled ? 'Ativada' : 'Desativada'} — altere e clique em Salvar para aplicar.
              </p>

              {/* Opções de integração (provedor, chave, modelo) — só ativas quando integração ligada */}
              <div className={enabled ? '' : 'opacity-60 pointer-events-none'}>
                {!enabled && (
                  <p className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                    Ative a integração de IA acima para configurar provedor, chave e modelo.
                  </p>
                )}
                {/* Provedor */}
                <div>
                  <label className="block font-medium text-gray-900 mb-2">Provedor da IA</label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="provider"
                      checked={provider === 'openai'}
                      onChange={() => setProvider('openai')}
                      className="text-primary focus:ring-primary"
                    />
                    <span>OpenAI (pago)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="provider"
                      checked={provider === 'groq'}
                      onChange={() => setProvider('groq')}
                      className="text-primary focus:ring-primary"
                    />
                    <span>Groq (plano gratuito)</span>
                  </label>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {provider === 'groq'
                    ? 'Groq oferece tier gratuito. Obtenha a chave em console.groq.com e use no campo abaixo.'
                    : 'OpenAI exige créditos na conta. Chave em platform.openai.com/api-keys.'}
                </p>
              </div>

              {/* Chave da API - em destaque no topo */}
              <div className="space-y-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Chave da API (obrigatória para a IA responder)
                </h3>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-white border border-gray-100">
                  {keyConfigured ? (
                    <CheckCircle2 className="text-green-600 shrink-0" size={24} />
                  ) : (
                    <XCircle className="text-amber-600 shrink-0" size={24} />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      Chave {provider === 'groq' ? 'Groq' : 'OpenAI'}: {keyConfigured ? 'Configurada' : 'Não configurada'}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {keyConfigured
                        ? 'A IA será usada quando uma dúvida não tiver resposta no FAQ.'
                        : provider === 'groq'
                          ? 'Informe a chave abaixo ou configure no .env (GROQ_API_KEY).'
                          : 'Informe a chave abaixo ou configure no .env (OPENAI_API_KEY).'}
                    </p>
                  </div>
                </div>
                <div>
                  <label htmlFor="apiKey" className="block font-medium text-gray-900 mb-1">
                    Chave da API ({provider === 'groq' ? 'Groq' : 'OpenAI'})
                  </label>
                  <Input
                    id="apiKey"
                    type="password"
                    autoComplete="off"
                    value={apiKeyInput}
                    onChange={(e) => {
                      setApiKeyInput(e.target.value);
                      if (clearKeyOnSave) setClearKeyOnSave(false);
                    }}
                    placeholder={
                      hasStoredKey
                        ? '•••••••• (digite nova chave para alterar)'
                        : provider === 'groq'
                          ? 'gsk_... (obtenha em console.groq.com)'
                          : 'sk-proj-... (obtenha em platform.openai.com/api-keys)'
                    }
                    className="max-w-xl font-mono text-sm"
                  />
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {hasStoredKey && (
                      <button
                        type="button"
                        onClick={() => setClearKeyOnSave(true)}
                        className="text-sm text-amber-600 hover:text-amber-700 underline"
                      >
                        Remover chave salva no painel
                      </button>
                    )}
                    {clearKeyOnSave && (
                      <span className="text-sm text-amber-700">
                        Ao salvar, a chave será removida. Digite uma nova chave no campo acima para cancelar.
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 -mt-2">
                Cole a chave acima, clique em Salvar e depois use &quot;Testar IA&quot; para validar.
              </p>

              {/* Modelo */}
              <div>
                <label htmlFor="model" className="block font-medium text-gray-900 mb-1">
                  Modelo (opcional)
                </label>
                <Input
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={provider === 'groq' ? 'llama-3.1-8b-instant' : 'gpt-4o-mini'}
                  className="max-w-xs"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {provider === 'groq'
                    ? 'Deixe em branco para llama-3.1-8b-instant. Outros: llama-3.1-70b-versatile, mixtral-8x7b-32768.'
                    : 'Deixe em branco para gpt-4o-mini. Ex.: gpt-4o para respostas mais elaboradas.'}
                </p>
              </div>

              {/* Instruções para a IA — ensinar o que a IA deve saber e como falar */}
              <div className="space-y-2">
                <label htmlFor="instructions" className="block font-medium text-gray-900">
                  Instruções para a IA
                </label>
                <p className="text-sm text-gray-500">
                  O que a IA deve saber sobre sua clínica e como falar com o paciente (tom, valores, o que pode ou não dizer). As instruções padrão aparecem abaixo para você editar ou apagar e definir novas. O valor da consulta é adicionado automaticamente pelo sistema.
                </p>
                <textarea
                  id="instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Digite ou edite as instruções para a IA..."
                  rows={10}
                  maxLength={8000}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-xs text-gray-500">
                    {instructions.length}/8000 caracteres
                  </p>
                  {defaultInstructions && (
                    <button
                      type="button"
                      onClick={() => setInstructions(defaultInstructions)}
                      className="text-sm text-primary hover:text-primary/80 font-medium"
                    >
                      Restaurar instruções padrão
                    </button>
                  )}
                </div>
              </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <Link href="/admin/whatsapp">
                <Button variant="outline">Voltar</Button>
              </Link>
              <Button onClick={save} disabled={saving}>
                <Save size={16} className="mr-2" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>

          {/* Testar IA */}
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <PlayCircle size={20} className="text-primary" />
                Testar se a IA está respondendo
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Envie uma pergunta de exemplo (como no WhatsApp). A resposta que aparecer aqui é a que a IA enviaria no fluxo.
              </p>
              <div className="flex flex-wrap gap-2 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label htmlFor="testMessage" className="block text-sm font-medium text-gray-700 mb-1">
                    Pergunta de teste
                  </label>
                  <Input
                    id="testMessage"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Ex.: Vocês atendem aos sábados?"
                    className="w-full"
                  />
                </div>
                <Button onClick={runTest} disabled={testing || !enabled || !keyConfigured} variant="outline">
                  {testing ? 'Testando...' : 'Testar IA'}
                </Button>
              </div>
              {!enabled && (
                <p className="text-sm text-gray-500 mt-2">
                  Ative a integração de IA na tela acima para poder testar.
                </p>
              )}
              {enabled && !keyConfigured && (
                <p className="text-sm text-amber-600 mt-2">
                  Configure a chave da API acima e salve antes de testar.
                </p>
              )}
              {testResult && (
                <div className={`mt-4 p-4 rounded-lg border ${testResult.success && !testResult.usedFallback ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                  {testResult.error && (
                    <div className="mb-3 p-3 rounded bg-red-100 border border-red-200">
                      <p className="text-sm font-semibold text-red-800">Motivo do fallback / erro:</p>
                      <p className="text-sm text-red-700 mt-1 whitespace-pre-wrap">{testResult.error}</p>
                    </div>
                  )}
                  {testResult.reply && (
                    <>
                      {testResult.usedFallback && (
                        <p className="text-sm text-amber-700 mb-2">Mensagem que o usuário receberia (fallback):</p>
                      )}
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{testResult.reply}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-100 flex gap-3">
            <Info className="text-blue-600 shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Chave da API</p>
              <p>
                {provider === 'groq' ? (
                  <>
                    Use a chave no campo acima (salva no servidor) ou variável <code className="bg-blue-100 px-1 rounded">GROQ_API_KEY</code> no{' '}
                    <code className="bg-blue-100 px-1 rounded">.env</code>. Obtenha em{' '}
                    <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="underline">
                      console.groq.com
                    </a>
                    . Groq tem plano gratuito.
                  </>
                ) : (
                  <>
                    Use a chave no campo acima (salva no servidor) ou variável{' '}
                    <code className="bg-blue-100 px-1 rounded">OPENAI_API_KEY</code> no <code className="bg-blue-100 px-1 rounded">.env</code>.
                    Obtenha em{' '}
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">
                      platform.openai.com/api-keys
                    </a>
                    .
                  </>
                )}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Atalhos */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/admin/whatsapp"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <Settings size={18} />
            Configurações WhatsApp
          </Link>
          <Link
            href="/admin/whatsapp/monitor"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <MessageSquare size={18} />
            Monitor Z-API
          </Link>
        </div>
      </div>
    </div>
  );
}
