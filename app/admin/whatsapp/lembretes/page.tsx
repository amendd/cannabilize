'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Settings,
  FileText,
  Inbox,
  GitBranch,
  Bot,
  Bell,
  Send,
  RefreshCw,
  Users,
  MessageSquare,
  Edit3,
  Save,
  X,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import { FLOW_STATE_LABELS, FLOW_STATE_REMINDER_MESSAGES } from '@/lib/whatsapp-reminder-messages';

const FLOW_STATES_ORDER = Object.keys(FLOW_STATE_REMINDER_MESSAGES);

interface PendingLead {
  id: string;
  phone: string;
  name: string | null;
  flowState: string;
  lastMessageAt: string | null;
  createdAt: string;
}

export default function WhatsAppLembretesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<PendingLead[]>([]);
  const [filterFlowState, setFilterFlowState] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendMode, setSendMode] = useState<'by_stage' | 'custom'>('by_stage');
  const [customMessage, setCustomMessage] = useState('');
  const [showEditTemplatesModal, setShowEditTemplatesModal] = useState(false);
  const [templateMessages, setTemplateMessages] = useState<Record<string, string>>({});
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [savingTemplates, setSavingTemplates] = useState(false);
  const [previewMessages, setPreviewMessages] = useState<Record<string, string>>({});
  const [autoReminderEnabled, setAutoReminderEnabled] = useState(false);
  const [autoReminderHours, setAutoReminderHours] = useState(24);
  const [autoReminderMinIntervalDays, setAutoReminderMinIntervalDays] = useState(7);
  const [savingAutoReminder, setSavingAutoReminder] = useState(false);

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
      loadLeads();
      loadPreviewTemplates();
    }
  }, [status, session?.user?.role, filterFlowState]);

  const loadPreviewTemplates = async () => {
    try {
      const res = await fetch('/api/admin/whatsapp/reminder-templates');
      if (res.ok) {
        const data = await res.json();
        setPreviewMessages(data.messages ?? {});
        const ar = data.autoReminder;
        if (ar) {
          setAutoReminderEnabled(Boolean(ar.enabled));
          setAutoReminderHours(ar.inactivityHours ?? 24);
          setAutoReminderMinIntervalDays(ar.minIntervalDays ?? 7);
        }
      }
    } catch {
      // ignora; preview usa padrões
    }
  };

  const loadLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterFlowState) params.set('flowState', filterFlowState);
      const res = await fetch(`/api/admin/whatsapp/leads-pending?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads ?? []);
        setSelectedIds(new Set());
      } else {
        toast.error('Erro ao carregar leads');
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === leads.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(leads.map((l) => l.id)));
  };

  const selectByStage = (flowState: string) => {
    const ids = leads.filter((l) => l.flowState === flowState).map((l) => l.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    toast.success(`${ids.length} selecionado(s) nesta etapa`);
  };

  const openEditTemplatesModal = async () => {
    setShowEditTemplatesModal(true);
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/admin/whatsapp/reminder-templates');
      if (res.ok) {
        const data = await res.json();
        setTemplateMessages(data.messages ?? {});
        setPreviewMessages(data.messages ?? {});
      } else {
        toast.error('Erro ao carregar mensagens');
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSaveAutoReminder = async () => {
    setSavingAutoReminder(true);
    try {
      const res = await fetch('/api/admin/whatsapp/reminder-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoReminder: {
            enabled: autoReminderEnabled,
            inactivityHours: autoReminderHours,
            minIntervalDays: autoReminderMinIntervalDays,
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Configuração de envio automático salva.');
      } else {
        toast.error(data.error || 'Erro ao salvar');
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar');
    } finally {
      setSavingAutoReminder(false);
    }
  };

  const setTemplateForState = (state: string, value: string) => {
    setTemplateMessages((prev) => ({ ...prev, [state]: value }));
  };

  const restoreDefaultForState = (state: string) => {
    const defaultText = FLOW_STATE_REMINDER_MESSAGES[state] ?? '';
    setTemplateMessages((prev) => ({ ...prev, [state]: defaultText }));
  };

  const handleSaveTemplates = async () => {
    setSavingTemplates(true);
    try {
      const res = await fetch('/api/admin/whatsapp/reminder-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: templateMessages }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Mensagens salvas (${data.saved} etapa(s)).`);
        setPreviewMessages({ ...templateMessages });
        setShowEditTemplatesModal(false);
      } else {
        toast.error(data.error || 'Erro ao salvar');
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar mensagens');
    } finally {
      setSavingTemplates(false);
    }
  };

  const handleSendReminders = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast.error('Selecione pelo menos um lead');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/admin/whatsapp/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadIds: ids,
          useTemplateByStage: sendMode === 'by_stage',
          message: sendMode === 'custom' && customMessage.trim() ? customMessage.trim() : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Erro ao enviar');
        return;
      }

      toast.success(`Enviados: ${data.sent} de ${data.total}. ${data.failed ? `Falhas: ${data.failed}.` : ''}`);
      setShowSendModal(false);
      setSelectedIds(new Set());
      setCustomMessage('');
      loadLeads();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao enviar lembretes');
    } finally {
      setSending(false);
    }
  };

  if (status === 'loading' || (status === 'authenticated' && loading && leads.length === 0)) {
    return <SkeletonDashboard />;
  }

  const stagesWithCount = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.flowState] = (acc[l.flowState] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'WhatsApp', href: '/admin/whatsapp' },
            { label: 'Lembretes', href: '/admin/whatsapp/lembretes' },
          ]}
        />

        {/* Submenu */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 mt-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/whatsapp"
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  pathname === '/admin/whatsapp' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Settings size={18} />
                Configurações
              </Link>
              <Link
                href="/admin/whatsapp/templates"
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  pathname === '/admin/whatsapp/templates' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FileText size={18} />
                Templates
              </Link>
              <Link
                href="/admin/whatsapp/mensagens"
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  pathname === '/admin/whatsapp/mensagens' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Inbox size={18} />
                Mensagens
              </Link>
              <Link
                href="/admin/whatsapp/lembretes"
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  pathname === '/admin/whatsapp/lembretes' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Bell size={18} />
                Lembretes
              </Link>
              <Link
                href="/admin/fluxos-whatsapp"
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  pathname === '/admin/fluxos-whatsapp' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <GitBranch size={18} />
                Fluxos
              </Link>
              <Link
                href="/admin/whatsapp/ia"
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  pathname === '/admin/whatsapp/ia' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Bot size={18} />
                IA no WhatsApp
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="text-primary" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">Lembretes WhatsApp</h1>
          </div>
          <p className="text-gray-600">
            Pessoas que iniciaram conversa pelo WhatsApp mas ainda não concluíram uma consulta. Envie uma mensagem específica por etapa ou uma mensagem única.
          </p>
        </motion.div>

        {/* Editar conteúdo das mensagens por etapa */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 mb-6"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Conteúdo das mensagens por etapa</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Defina o texto que cada pessoa recebe conforme a etapa em que parou (nome, CPF, data, etc.).
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={openEditTemplatesModal}
              className="flex items-center gap-2"
            >
              <Edit3 size={18} />
              Editar mensagens
            </Button>
          </div>
        </motion.div>

        {/* Envio automático por inatividade */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="text-primary" size={24} />
            <h2 className="text-lg font-semibold text-gray-900">Envio automático por inatividade</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Envie lembretes automaticamente para quem iniciou conversa pelo WhatsApp mas não enviou mensagem há um tempo. O sistema usa o mesmo texto por etapa configurado acima. Configure um cron (ex.: a cada hora) na URL <code className="bg-gray-100 px-1 rounded text-xs">/api/cron/whatsapp-reminder-auto</code> com <code className="bg-gray-100 px-1 rounded text-xs">Authorization: Bearer CRON_SECRET</code>.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoReminderEnabled"
                checked={autoReminderEnabled}
                onChange={(e) => setAutoReminderEnabled(e.target.checked)}
                className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="autoReminderEnabled" className="text-sm font-medium text-gray-700">
                Ativar envio automático de lembretes
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enviar após quanto tempo de inatividade?
                </label>
                <select
                  value={autoReminderHours}
                  onChange={(e) => setAutoReminderHours(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value={12}>12 horas</option>
                  <option value={24}>24 horas (1 dia)</option>
                  <option value={48}>48 horas (2 dias)</option>
                  <option value={72}>72 horas (3 dias)</option>
                  <option value={168}>7 dias</option>
                  <option value={336}>14 dias</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Não reenviar antes de (para o mesmo lead)
                </label>
                <select
                  value={autoReminderMinIntervalDays}
                  onChange={(e) => setAutoReminderMinIntervalDays(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value={1}>1 dia</option>
                  <option value={3}>3 dias</option>
                  <option value={7}>7 dias</option>
                  <option value={14}>14 dias</option>
                </select>
              </div>
            </div>
            <Button
              onClick={handleSaveAutoReminder}
              disabled={savingAutoReminder}
              className="flex items-center gap-2"
            >
              {savingAutoReminder ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Salvar configuração de envio automático
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Filtro por etapa */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 mb-6"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Etapa do funil</label>
              <select
                value={filterFlowState}
                onChange={(e) => setFilterFlowState(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[220px]"
              >
                <option value="">Todas as etapas</option>
                {Object.entries(FLOW_STATE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <Button variant="secondary" onClick={loadLeads} className="flex items-center gap-2 mt-6">
              <RefreshCw size={16} />
              Atualizar
            </Button>
          </div>
        </motion.div>

        {/* Resumo por etapa (quick select) */}
        {Object.keys(stagesWithCount).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="bg-amber-50/80 border border-amber-200 rounded-lg p-4 mb-6"
          >
            <p className="text-sm font-medium text-amber-900 mb-2">Selecionar por etapa:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stagesWithCount).map(([state, count]) => (
                <button
                  key={state}
                  type="button"
                  onClick={() => selectByStage(state)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-sm text-amber-900 hover:bg-amber-100 transition"
                >
                  {FLOW_STATE_LABELS[state] || state} ({count})
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Ações em lote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center gap-4 mb-4"
        >
          <Button
            onClick={() => setShowSendModal(true)}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-2"
          >
            <Send size={18} />
            Enviar lembrete ({selectedIds.size} selecionado(s))
          </Button>
          <button
            type="button"
            onClick={toggleSelectAll}
            className="text-sm text-primary hover:underline"
          >
            {selectedIds.size === leads.length ? 'Desmarcar todos' : 'Selecionar todos'}
          </button>
        </motion.div>

        {/* Tabela */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={leads.length > 0 && selectedIds.size === leads.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Etapa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última mensagem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                      <Users className="mx-auto text-gray-400 mb-2" size={40} />
                      Nenhum lead pendente. Quem já concluiu consulta não aparece aqui.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(lead.id)}
                          onChange={() => toggleSelect(lead.id)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">{lead.phone}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{lead.name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          {FLOW_STATE_LABELS[lead.flowState] || lead.flowState}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {lead.lastMessageAt
                          ? new Date(lead.lastMessageAt).toLocaleString('pt-BR')
                          : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Modal Enviar lembrete */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200 flex items-center gap-2">
              <MessageSquare className="text-primary" size={24} />
              <h2 className="text-xl font-semibold text-gray-900">Enviar lembrete</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                {selectedIds.size} contato(s) selecionado(s). Escolha como enviar:
              </p>

              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="sendMode"
                    checked={sendMode === 'by_stage'}
                    onChange={() => setSendMode('by_stage')}
                    className="mt-1 text-primary border-gray-300 focus:ring-primary"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Mensagem por etapa</span>
                    <p className="text-xs text-gray-500">
                      Cada pessoa recebe um texto específico para a etapa em que parou (ex.: quem parou no CPF recebe pedido de CPF).
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="sendMode"
                    checked={sendMode === 'custom'}
                    onChange={() => setSendMode('custom')}
                    className="mt-1 text-primary border-gray-300 focus:ring-primary"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Mensagem única</span>
                    <p className="text-xs text-gray-500">
                      Todos recebem o mesmo texto que você digitar abaixo.
                    </p>
                  </div>
                </label>
              </div>

              {sendMode === 'by_stage' && (
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 max-h-40 overflow-y-auto">
                  <p className="font-medium text-gray-700 mb-2">Preview por etapa (textos que serão enviados):</p>
                  {FLOW_STATES_ORDER.slice(0, 6).map((state) => {
                    const msg = Object.keys(previewMessages).length ? (previewMessages[state] ?? '') : (FLOW_STATE_REMINDER_MESSAGES[state] ?? '');
                    return (
                      <div key={state} className="mb-2">
                        <span className="font-medium text-gray-700">{FLOW_STATE_LABELS[state]}:</span>{' '}
                        <span className="text-gray-600">{(msg || '').slice(0, 80)}{(msg || '').length > 80 ? '…' : ''}</span>
                      </div>
                    );
                  })}
                  <p className="text-gray-500">… e demais etapas. Edite em &quot;Editar mensagens&quot; na página.</p>
                </div>
              )}

              {sendMode === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Digite aqui a mensagem que todos vão receber..."
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowSendModal(false)} disabled={sending}>
                Cancelar
              </Button>
              <Button
                onClick={handleSendReminders}
                disabled={sending || (sendMode === 'custom' && !customMessage.trim())}
                className="flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Editar mensagens por etapa */}
      {showEditTemplatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 className="text-primary" size={24} />
                <h2 className="text-xl font-semibold text-gray-900">Editar mensagens por etapa</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowEditTemplatesModal(false)}
                className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loadingTemplates ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw size={28} className="animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-sm text-gray-600">
                    Cada etapa do funil pode ter um texto diferente. Use <strong>*negrito*</strong> no WhatsApp. Se o lead tiver nome, &quot;Oi!&quot; será trocado por &quot;Oi, [Nome]!&quot;.
                  </p>
                  {FLOW_STATES_ORDER.map((state) => (
                    <div key={state} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-900">
                          {FLOW_STATE_LABELS[state] || state}
                        </label>
                        <button
                          type="button"
                          onClick={() => restoreDefaultForState(state)}
                          className="text-xs text-primary hover:underline"
                        >
                          Restaurar padrão
                        </button>
                      </div>
                      <textarea
                        value={templateMessages[state] ?? ''}
                        onChange={(e) => setTemplateForState(state, e.target.value)}
                        placeholder={FLOW_STATE_REMINDER_MESSAGES[state] ?? ''}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary resize-y"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-2 shrink-0">
              <Button variant="secondary" onClick={() => setShowEditTemplatesModal(false)} disabled={savingTemplates}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveTemplates}
                disabled={savingTemplates || loadingTemplates}
                className="flex items-center gap-2"
              >
                {savingTemplates ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Salvar mensagens
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
