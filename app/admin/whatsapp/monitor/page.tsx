'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  MessageSquare,
  Settings,
  FileText,
  Inbox,
  GitBranch,
  RefreshCw,
  Search,
  Activity,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Smartphone,
  ChevronDown,
  ChevronUp,
  List,
  Send,
  User,
  Calendar,
  ExternalLink,
  RotateCcw,
  CloudDownload,
  Pause,
  PlayCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { SkeletonDashboard } from '@/components/ui/Skeleton';

interface WebhookLogRow {
  id: string;
  type: string;
  phone: string | null;
  fromMe: boolean;
  hasText: boolean;
  result: string;
  detail: string;
  messageText: string | null;
  payloadPreview: string | null;
  createdAt: string;
  /** Texto para exibir na bolha (mensagem do paciente); preenchido pela API */
  displayText?: string;
}

interface SentMessageRow {
  id: string;
  to: string;
  message: string;
  status: string;
  createdAt: string;
}

/** Item unificado da timeline: recebida (do contato) ou enviada (pelo sistema) */
type TimelineItem =
  | { kind: 'received'; id: string; createdAt: string; text: string; log: WebhookLogRow }
  | { kind: 'sent'; id: string; createdAt: string; text: string; msg: SentMessageRow; responseSource?: string };

/** Extrai "quem respondeu" do detail do log (ex.: "Processado: 1/1 — Resposta: IA" → "IA") */
function parseResponseSourceFromDetail(detail: string | null | undefined): string | undefined {
  if (!detail?.trim()) return undefined;
  const m = detail.match(/Resposta:\s*(.+?)(?:\s*$|\.)/i) || detail.match(/—\s*Resposta:\s*(.+?)(?:\s*$|\.)/i);
  if (!m) return undefined;
  const raw = m[1].trim();
  if (/^fluxo$/i.test(raw)) return 'Fluxo';
  if (/^FAQ$/i.test(raw)) return 'FAQ';
  if (/^IA$/i.test(raw)) return 'IA';
  if (/fallback/i.test(raw)) return 'Fallback';
  return raw;
}

interface ConversationItem {
  phone: string;
  /** ID do lead (contato) — exibido como referência */
  leadId?: string;
  /** Nome do contato quando o paciente já informou no fluxo */
  name?: string | null;
  lastLog: {
    id: string;
    result: string;
    detail: string;
    displayText?: string;
    createdAt: string;
    payloadPreview: string | null;
  };
  count: number;
  /** Etapa do cadastro com a IA: 0 = sem lead, 1 = nome, 2 = dados, 3 = data/horário, 4 = pagamento, 5 = agendado */
  progress?: number;
  flowState?: string;
  /** Última atividade (recebida ou enviada) — usado para ordenar e exibir horário na lista */
  lastActivityAt?: string;
}

interface Stats {
  todayProcessed: number;
  todayIgnored: number;
  todayErrors: number;
  todayTotal: number;
}

interface ClientContext {
  lead: { id: string; name: string | null; phone: string; flowState: string; consultationId: string | null; robotPaused?: boolean } | null;
  nextConsultation: {
    id: string;
    scheduledAt: string;
    scheduledDate: string | null;
    scheduledTime: string | null;
    status: string;
    patientName: string | null;
    doctorName: string | null;
  } | null;
  patient: { id: string; name: string; email: string; phone: string | null } | null;
  latestPrescription?: {
    id: string;
    consultationId: string | null;
    status: string;
    issuedAt: string;
    expiresAt: string | null;
    medications: { name: string; dosage: string | null; quantity: string | null }[];
  } | null;
}

const PRESCRIPTION_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Ativa',
  EXPIRING: 'Próxima do vencimento',
  EXPIRED: 'Expirada',
  REPLACED: 'Substituída',
  CANCELLED: 'Cancelada',
  ISSUED: 'Emitida',
  USED: 'Utilizada',
};

const RESULT_LABELS: Record<string, { label: string; short: string; icon: typeof CheckCircle2; bubbleBg: string; bubbleBorder: string; text: string }> = {
  processed: {
    label: 'Processada',
    short: 'Ok',
    icon: CheckCircle2,
    bubbleBg: 'bg-emerald-500/90',
    bubbleBorder: 'border-emerald-400/50',
    text: 'text-emerald-400',
  },
  ignored: {
    label: 'Ignorada',
    short: 'Ign',
    icon: MinusCircle,
    bubbleBg: 'bg-slate-600/90',
    bubbleBorder: 'border-slate-500/50',
    text: 'text-slate-400',
  },
  error: {
    label: 'Erro',
    short: 'Erro',
    icon: XCircle,
    bubbleBg: 'bg-red-600/90',
    bubbleBorder: 'border-red-500/50',
    text: 'text-red-400',
  },
};

/** ID curto do contato para exibição (primeiros 8 caracteres do UUID do lead) */
function formatShortLeadId(leadId: string | null | undefined): string | null {
  if (!leadId || typeof leadId !== 'string') return null;
  const s = leadId.replace(/-/g, '').slice(0, 8);
  return s || null;
}

/** Formata número para exibição: +55 (11) 99999-9999 */
function formatPhoneDisplay(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.length >= 12 && d.startsWith('55')) {
    const ddd = d.slice(2, 4);
    const rest = d.slice(4);
    const last = rest.length >= 8 ? `${rest.slice(-4)}` : rest;
    const mid = rest.length >= 8 ? rest.slice(0, -4) : '';
    if (mid) return `+55 (${ddd}) ${mid}-${last}`;
    return `+55 (${ddd}) ${rest}`;
  }
  return phone;
}

/** Iniciais para avatar (ex: +55 11 99999 -> "11") */
function getInitials(phoneOrName: string): string {
  const s = (phoneOrName || '').trim();
  const hasLetters = /[a-zA-Z\u00C0-\u024F]/.test(s);
  if (hasLetters) {
    const parts = s.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const a = (parts[0].match(/[a-zA-Z\u00C0-\u024F]/) || [])[0];
      const b = (parts[parts.length - 1].match(/[a-zA-Z\u00C0-\u024F]/) || [])[0];
      if (a && b) return (a + b).toUpperCase().slice(0, 2);
    }
    const first = (s.match(/[a-zA-Z\u00C0-\u024F]/) || [])[0];
    return first ? first.toUpperCase() : '?';
  }
  const d = s.replace(/\D/g, '');
  if (d.length >= 4) return d.slice(-2);
  return d.slice(0, 2) || '?';
}

/** Tenta extrair o texto da mensagem do payload Z-API (para logs antigos sem messageText) */
function extractTextFromPayload(preview: string | null): string | null {
  if (!preview?.trim()) return null;
  try {
    const o = JSON.parse(preview);
    const text =
      o?.text?.message ??
      o?.hydratedTemplate?.message ??
      o?.buttonsResponseMessage?.message ??
      o?.listResponseMessage?.message ??
      o?.image?.caption ??
      o?.body?.text ??
      o?.message ??
      (typeof o?.text === 'string' ? o.text : null);
    if (text) return String(text).trim();
  } catch {
    // payload pode estar truncado; tenta regex como fallback
  }
  const match = preview.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  return match ? match[1].replace(/\\"/g, '"').trim() : null;
}

export default function WhatsAppMonitorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [logs, setLogs] = useState<WebhookLogRow[]>([]);
  const [sentMessages, setSentMessages] = useState<SentMessageRow[]>([]);
  const [stats, setStats] = useState<Stats>({ todayProcessed: 0, todayIgnored: 0, todayErrors: 0, todayTotal: 0 });
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [searchConversation, setSearchConversation] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'processed' | 'ignored' | 'error'>('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [hideIgnoredCallbacks, setHideIgnoredCallbacks] = useState(true);
  const [draftMessage, setDraftMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [clientContext, setClientContext] = useState<ClientContext | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);
  const [restartingFlow, setRestartingFlow] = useState(false);
  const [pausingRobot, setPausingRobot] = useState(false);
  const [syncingMessages, setSyncingMessages] = useState(false);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef({ logs: 0, sent: 0 });
  const wasLoadingThreadRef = useRef(true);

  const loadConversations = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    try {
      if (!silent) setLoading(true);
      const res = await fetch('/api/admin/whatsapp/webhook-logs?conversations=1', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        setStats((s) => data.stats || s);
      } else if (!silent) toast.error('Erro ao carregar conversas');
    } catch (e) {
      if (!silent) toast.error('Erro ao carregar conversas');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const loadThread = useCallback(async (phone: string, opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) setLoadingThread(true);
    const digits = phone.replace(/\D/g, '');
    try {
      const [logsRes, messagesRes] = await Promise.all([
        fetch(`/api/admin/whatsapp/webhook-logs?phone=${encodeURIComponent(digits)}&limit=80`, { cache: 'no-store' }),
        fetch(`/api/admin/whatsapp/messages?to=${encodeURIComponent(digits)}&limit=80`, { cache: 'no-store' }),
      ]);
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data.logs || []);
      } else setLogs([]);
      if (messagesRes.ok) {
        const data = await messagesRes.json();
        setSentMessages(data.messages || []);
      } else setSentMessages([]);
    } catch (e) {
      setLogs([]);
      setSentMessages([]);
    } finally {
      if (!silent) setLoadingThread(false);
    }
  }, []);

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
      loadConversations();
    }
  }, [status, session?.user?.role]);

  useEffect(() => {
    if (selectedPhone) loadThread(selectedPhone);
    else setLogs([]);
  }, [selectedPhone, loadThread]);

  const loadClientContext = useCallback(async (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setClientContext(null);
      return;
    }
    setLoadingContext(true);
    try {
      const res = await fetch(`/api/admin/whatsapp/monitor-context?phone=${encodeURIComponent(digits)}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setClientContext(data);
      } else setClientContext(null);
    } catch {
      setClientContext(null);
    } finally {
      setLoadingContext(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPhone) loadClientContext(selectedPhone);
    else setClientContext(null);
  }, [selectedPhone, loadClientContext]);

  /** Rolar até a última mensagem no carregamento inicial, ao trocar de conversa ou quando chegam novas mensagens (não a cada refresh em segundo plano) */
  useEffect(() => {
    const justFinishedLoading = wasLoadingThreadRef.current && !loadingThread;
    wasLoadingThreadRef.current = loadingThread;
    if (loadingThread || (logs.length === 0 && sentMessages.length === 0)) return;
    const prev = prevCountRef.current;
    const hasNewMessages = logs.length > prev.logs || sentMessages.length > prev.sent;
    prevCountRef.current = { logs: logs.length, sent: sentMessages.length };
    const shouldScroll = hasNewMessages || justFinishedLoading;
    const el = messagesScrollRef.current;
    if (el && shouldScroll) {
      const scroll = () => {
        el.scrollTop = el.scrollHeight;
      };
      scroll();
      requestAnimationFrame(scroll);
    }
  }, [loadingThread, logs.length, sentMessages.length]);

  /** Polling só quando a aba está visível, para não encher o terminal/servidor com a página em segundo plano */
  const [tabVisible, setTabVisible] = useState(true);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVisibility = () => setTabVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (!autoRefresh || !tabVisible || status !== 'authenticated' || session?.user?.role !== 'ADMIN') return;
    const t = setInterval(() => {
      loadConversations({ silent: true });
      if (selectedPhone) loadThread(selectedPhone, { silent: true });
    }, 15000);
    return () => clearInterval(t);
  }, [autoRefresh, tabVisible, status, session?.user?.role, selectedPhone, loadConversations, loadThread]);

  /** Atualiza a conversa aberta a cada 30s em segundo plano (evita muitos GETs no terminal) */
  useEffect(() => {
    if (!autoRefresh || !tabVisible || !selectedPhone || status !== 'authenticated' || session?.user?.role !== 'ADMIN') return;
    const t = setInterval(() => loadThread(selectedPhone, { silent: true }), 30000);
    return () => clearInterval(t);
  }, [autoRefresh, tabVisible, selectedPhone, status, session?.user?.role, loadThread]);

  const filteredConversations = conversations.filter((c) => {
    const matchSearch = !searchConversation.trim() || c.phone.includes(searchConversation.replace(/\D/g, ''));
    if (!matchSearch) return false;
    if (hideIgnoredCallbacks && c.lastLog.result === 'ignored') return false;
    if (filterTab === 'all') return true;
    return c.lastLog.result === filterTab;
  });

  const displayLogs = hideIgnoredCallbacks ? logs.filter((l) => l.result !== 'ignored') : logs;

  const handleSendMessage = async () => {
    const text = draftMessage.trim();
    if (!text || !selectedPhone || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/admin/whatsapp/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: selectedPhone, message: text }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDraftMessage('');
        toast.success('Mensagem enviada');
        loadThread(selectedPhone);
      } else {
        toast.error(data.error || 'Falha ao enviar');
      }
    } catch (e) {
      toast.error('Erro ao enviar');
    } finally {
      setSending(false);
    }
  };

  const handleRestartFlow = async () => {
    if (!selectedPhone || restartingFlow) return;
    setRestartingFlow(true);
    try {
      const res = await fetch('/api/admin/whatsapp/restart-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: selectedPhone }),
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        toast.success(data.message || 'Fluxo reiniciado');
        loadConversations();
        loadClientContext(selectedPhone);
      } else {
        toast.error(data.error || 'Falha ao reiniciar');
      }
    } catch {
      toast.error('Erro ao reiniciar fluxo');
    } finally {
      setRestartingFlow(false);
    }
  };

  const handleTogglePauseRobot = async () => {
    if (!selectedPhone || pausingRobot) return;
    const paused = !clientContext?.lead?.robotPaused;
    setPausingRobot(true);
    try {
      const res = await fetch('/api/admin/whatsapp/pause-robot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: selectedPhone, paused }),
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        toast.success(data.message || (paused ? 'Robô pausado' : 'Robô ativado'));
        loadClientContext(selectedPhone);
      } else {
        toast.error(data.error || 'Falha ao pausar/despausar');
      }
    } catch {
      toast.error('Erro ao pausar/despausar robô');
    } finally {
      setPausingRobot(false);
    }
  };

  /** Sincroniza mensagens da Z-API (útil quando o sistema esteve offline). */
  const handleSyncMessages = async () => {
    if (syncingMessages) return;
    setSyncingMessages(true);
    try {
      const res = await fetch('/api/admin/whatsapp/sync-messages', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Sincronização concluída');
        if (data.warning) {
          toast(data.warning, { duration: 8000, icon: '⚠️', style: { maxWidth: 420 } });
        }
        if (data.debug) {
          const d = data.debug as { testChatsCount?: number; testOk?: boolean; testError?: string };
          const diag = d.testChatsCount != null
            ? `Diagnóstico: Z-API retornou ${d.testChatsCount} chats no teste.`
            : d.testError
              ? `Diagnóstico: ${d.testError}`
              : null;
          if (diag) toast(diag, { duration: 6000, icon: '🔍' });
        }
        loadConversations();
        if (selectedPhone) loadThread(selectedPhone);
      } else {
        toast.error(data.error || 'Falha ao sincronizar');
      }
    } catch {
      toast.error('Erro ao sincronizar mensagens');
    } finally {
      setSyncingMessages(false);
    }
  };

  /** Timeline unificada: mensagens recebidas + enviadas ordenadas por data (ascendente), com desempate por id para ordem estável */
  const timeline: TimelineItem[] = (() => {
    const processedLogs = displayLogs.filter((l) => l.result === 'processed');
    const received: TimelineItem[] = displayLogs.map((log) => {
      const fromApi = log.displayText?.trim();
      const direct = !fromApi && log.messageText?.trim();
      const fromPayload = !fromApi && !direct && log.payloadPreview ? extractTextFromPayload(log.payloadPreview) : null;
      const text = fromApi || direct || fromPayload || log.detail?.trim() || '(mensagem recebida)';
      return {
        kind: 'received',
        id: log.id,
        createdAt: log.createdAt,
        text,
        log,
      };
    });
    const sent: TimelineItem[] = sentMessages.map((msg) => {
      const sentTime = new Date(msg.createdAt).getTime();
      // Log processado que originou esta resposta: o mais recente com createdAt <= envio (+ pequena janela de atraso)
      const preceding = processedLogs
        .filter((l) => new Date(l.createdAt).getTime() <= sentTime + 1500)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const match = preceding[0];
      const responseSource = match ? parseResponseSourceFromDetail(match.detail) : undefined;
      return {
        kind: 'sent' as const,
        id: msg.id,
        createdAt: msg.createdAt,
        text: msg.message,
        msg,
        responseSource,
      };
    });
    const merged = [...received, ...sent].sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      const diff = ta - tb;
      // Janela de 2s: recebida e enviada próximas = usuário falou e nós respondemos → mostrar recebida primeiro
      const windowMs = 2000;
      if (Math.abs(diff) <= windowMs && a.kind !== b.kind) {
        return a.kind === 'received' ? -1 : 1;
      }
      if (diff !== 0) return diff;
      if (a.kind !== b.kind) return a.kind === 'received' ? -1 : 1;
      return a.id.localeCompare(b.id);
    });
    return merged;
  })();

  if (status === 'loading' || (status === 'authenticated' && loading && conversations.length === 0)) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19]">
      {/* Top: breadcrumb + submenu */}
      <div className="flex-shrink-0 bg-[#111827] border-b border-gray-800">
        <div className="max-w-full px-4 py-2">
          <Breadcrumbs
            items={[
              { label: 'Admin', href: '/admin' },
              { label: 'WhatsApp', href: '/admin/whatsapp' },
              { label: 'Monitor Z-API', href: '/admin/whatsapp/monitor' },
            ]}
          />
          <div className="flex flex-wrap gap-2 mt-2">
            <Link
              href="/admin/whatsapp"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 ${pathname === '/admin/whatsapp' ? 'bg-emerald-600 text-white' : 'bg-gray-700/80 text-gray-300 hover:bg-gray-600'}`}
            >
              <Settings size={16} /> Configurações
            </Link>
            <Link
              href="/admin/whatsapp/templates"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 ${pathname === '/admin/whatsapp/templates' ? 'bg-emerald-600 text-white' : 'bg-gray-700/80 text-gray-300 hover:bg-gray-600'}`}
            >
              <FileText size={16} /> Templates
            </Link>
            <Link
              href="/admin/whatsapp/mensagens"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 ${pathname === '/admin/whatsapp/mensagens' ? 'bg-emerald-600 text-white' : 'bg-gray-700/80 text-gray-300 hover:bg-gray-600'}`}
            >
              <Inbox size={16} /> Mensagens enviadas
            </Link>
            <Link
              href="/admin/whatsapp/monitor"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 ${pathname === '/admin/whatsapp/monitor' ? 'bg-emerald-600 text-white' : 'bg-gray-700/80 text-gray-300 hover:bg-gray-600'}`}
            >
              <Activity size={16} /> Monitor Z-API
            </Link>
            <Link
              href="/admin/fluxos-whatsapp"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 ${pathname === '/admin/fluxos-whatsapp' ? 'bg-emerald-600 text-white' : 'bg-gray-700/80 text-gray-300 hover:bg-gray-600'}`}
            >
              <GitBranch size={16} /> Fluxos
            </Link>
          </div>
        </div>
      </div>

      {/* Main: 3 columns - altura limitada para rolagem interna */}
      <div className="flex-1 flex min-h-0 max-h-[calc(100vh-11rem)]">
        {/* Coluna 1: Lista de conversas (estilo WhatsApp) */}
        <div className="w-80 flex-shrink-0 flex flex-col bg-[#111827] border-r border-gray-800">
          <div className="p-3 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Pesquisar por número..."
                value={searchConversation}
                onChange={(e) => setSearchConversation(e.target.value)}
                className="w-full bg-gray-700/80 text-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 border border-gray-600"
              />
            </div>
            <div className="flex gap-1 mt-2">
              {(['all', 'processed', 'ignored', 'error'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterTab(tab)}
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    filterTab === tab
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-700/60 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {tab === 'all' ? 'Tudo' : tab === 'processed' ? 'Ok' : tab === 'ignored' ? 'Ign' : 'Erro'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                <MessageSquare className="mx-auto mb-2 text-gray-600" size={40} />
                <p>Nenhuma conversa ainda.</p>
                <p className="mt-1 text-xs">Envie uma mensagem para o número Z-API para aparecer aqui.</p>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const res = RESULT_LABELS[c.lastLog.result] || RESULT_LABELS.ignored;
                const isSelected = selectedPhone === c.phone;
                return (
                  <button
                    key={c.phone}
                    type="button"
                    onClick={() => setSelectedPhone(c.phone)}
                    className={`w-full flex items-center gap-3 px-3 py-3 text-left border-b border-gray-800/80 hover:bg-gray-700/50 ${isSelected ? 'bg-gray-700/80' : ''}`}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-gray-300 font-medium text-sm">
                      {getInitials(c.name || c.phone)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">
                        {c.name || formatPhoneDisplay(c.phone)}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {c.name ? formatPhoneDisplay(c.phone) : (c.lastLog.displayText || c.lastLog.detail)}
                      </p>
                      {formatShortLeadId(c.leadId) && (
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5" title={`ID do contato: ${c.leadId}`}>
                          ID: {formatShortLeadId(c.leadId)}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right flex flex-col items-end gap-0.5">
                      <span className="text-[10px] font-medium text-emerald-400/90 bg-emerald-900/40 px-1.5 py-0.5 rounded" title="Etapa do cadastro (0–5)">
                        {typeof c.progress === 'number' ? `${c.progress}/5` : '–/5'}
                      </span>
                      <span className={`text-xs ${res.text}`}>{res.short}</span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(c.lastActivityAt || c.lastLog.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna 2: Thread (bolhas de mensagem) + rolagem interna + envio */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#0b0f19]">
          {!selectedPhone ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 min-h-0">
              <div className="text-center">
                <Smartphone className="mx-auto mb-4 text-gray-600" size={64} />
                <p className="text-lg font-medium text-gray-400">Selecione uma conversa</p>
                <p className="text-sm mt-1">Os eventos do webhook aparecerão aqui em formato de chat.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-shrink-0 px-4 py-3 bg-[#111827] border-b border-gray-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-gray-300 font-medium text-sm">
                  {getInitials(clientContext?.lead?.name || selectedPhone)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-200 truncate">
                    {clientContext?.lead?.name || formatPhoneDisplay(selectedPhone)}
                  </p>
                  <p className="text-xs text-gray-500 font-mono truncate">{selectedPhone}</p>
                  {clientContext?.lead?.id && formatShortLeadId(clientContext.lead.id) && (
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5" title={`ID do contato: ${clientContext.lead.id}`}>
                      ID: {formatShortLeadId(clientContext.lead.id)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleTogglePauseRobot}
                  disabled={pausingRobot || !clientContext?.lead}
                  className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 ${
                    clientContext?.lead?.robotPaused
                      ? 'bg-emerald-600/80 hover:bg-emerald-600 text-white'
                      : 'bg-gray-600/80 hover:bg-gray-500 text-gray-100'
                  }`}
                  title={clientContext?.lead?.robotPaused ? 'Despausar robô — voltar a enviar respostas automáticas' : 'Pausar robô — parar respostas automáticas enquanto você envia mensagens'}
                >
                  {clientContext?.lead?.robotPaused ? <PlayCircle size={16} /> : <Pause size={16} />}
                  {pausingRobot ? '...' : clientContext?.lead?.robotPaused ? 'Despausar robô' : 'Pausar robô'}
                </button>
                <button
                  type="button"
                  onClick={handleRestartFlow}
                  disabled={restartingFlow}
                  className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-600/80 hover:bg-amber-600 text-white text-sm font-medium disabled:opacity-50"
                  title="Reiniciar fluxo de cadastro (volta ao pedido de nome)"
                >
                  <RotateCcw size={16} />
                  {restartingFlow ? 'Reiniciando...' : 'Reiniciar fluxo'}
                </button>
              </div>
              <div ref={messagesScrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                {loadingThread ? (
                  <div className="flex justify-center py-8 text-gray-500">Carregando...</div>
                ) : timeline.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    {logs.length === 0 && sentMessages.length === 0
                      ? 'Nenhuma mensagem ainda para este número.'
                      : 'Nenhum evento útil. Desmarque "Ocultar callbacks ignorados" para ver todos.'}
                  </div>
                ) : (
                  timeline.map((item) => {
                    const isReceived = item.kind === 'received';
                    const responseSource = !isReceived && item.responseSource ? item.responseSource : null;
                    return (
                      <div
                        key={`${item.kind}-${item.id}`}
                        className={`flex ${isReceived ? 'justify-start' : 'justify-end'} items-start gap-2`}
                      >
                        {!isReceived && responseSource && (
                          <span
                            className="flex-shrink-0 mt-2 text-xs font-medium text-gray-400 bg-gray-800/80 border border-gray-600 rounded px-2 py-1"
                            title="Quem respondeu esta mensagem"
                          >
                            Quem respondeu: <span className="text-emerald-400">{responseSource}</span>
                          </span>
                        )}
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-lg ${
                            isReceived
                              ? 'bg-gray-700/90 border border-gray-600 rounded-bl-md'
                              : 'bg-emerald-600 border border-emerald-500/50 rounded-br-md'
                          }`}
                        >
                          {isReceived && item.log.result !== 'processed' && (
                            <div className="flex items-center gap-2 mb-1">
                              {(() => {
                                const res = RESULT_LABELS[item.log.result] || RESULT_LABELS.ignored;
                                const Icon = res.icon;
                                return (
                                  <>
                                    <Icon size={12} className={res.text} />
                                    <span className={`text-xs font-medium ${res.text}`}>{res.label}</span>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                          <p className="text-sm text-gray-100 break-words whitespace-pre-wrap">{item.text}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(item.createdAt).toLocaleString('pt-BR')}
                          </p>
                          {isReceived && item.log.payloadPreview && (
                            <div className="mt-2">
                              <button
                                type="button"
                                onClick={() => setExpandedId(expandedId === item.log.id ? null : item.log.id)}
                                className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                              >
                                {expandedId === item.log.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                Payload
                              </button>
                              {expandedId === item.log.id && (
                                <pre className="mt-1 text-xs text-gray-400 bg-black/30 p-2 rounded overflow-x-auto max-h-24 overflow-y-auto">
                                  {item.log.payloadPreview}
                                </pre>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {/* Barra de envio de mensagem */}
              <div className="flex-shrink-0 p-3 bg-[#111827] border-t border-gray-800">
                <div className="flex gap-2 items-end">
                  <textarea
                    value={draftMessage}
                    onChange={(e) => setDraftMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Digite sua mensagem... (Enter envia, Shift+Enter quebra linha)"
                    rows={2}
                    className="flex-1 min-h-[44px] max-h-32 resize-y rounded-lg bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                    disabled={sending}
                  />
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={sending || !draftMessage.trim()}
                    className="flex-shrink-0 h-11 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium flex items-center justify-center gap-2 transition"
                  >
                    <Send size={18} />
                    {sending ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Coluna 3: Resumo do cliente + Atalhos e estatísticas */}
        <div className="w-64 flex-shrink-0 flex flex-col bg-[#111827] border-l border-gray-800 p-4 overflow-y-auto">
          {selectedPhone && (
            <div className="mb-4 pb-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                <User size={14} />
                Resumo do cliente
              </h3>
              {loadingContext ? (
                <p className="text-xs text-gray-500">Carregando...</p>
              ) : clientContext ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-200 font-medium truncate" title={clientContext.lead?.name || clientContext.patient?.name || undefined}>
                      {clientContext.lead?.name || clientContext.patient?.name || formatPhoneDisplay(selectedPhone)}
                    </p>
                    <p className="text-xs text-gray-500 font-mono truncate mt-0.5" title={selectedPhone}>
                      {(clientContext.lead?.name || clientContext.patient?.name) ? formatPhoneDisplay(selectedPhone) : null}
                    </p>
                    {clientContext.lead?.id && formatShortLeadId(clientContext.lead.id) && (
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5" title={`ID do contato: ${clientContext.lead.id}`}>
                        ID: {formatShortLeadId(clientContext.lead.id)}
                      </p>
                    )}
                  </div>
                  {clientContext.nextConsultation ? (
                    <div className="rounded-lg bg-emerald-500/15 border border-emerald-500/40 p-2.5">
                      <p className="text-xs text-emerald-400 font-medium flex items-center gap-1 mb-1">
                        <Calendar size={12} />
                        Próxima consulta
                      </p>
                      <p className="text-xs text-gray-200">
                        {new Date(clientContext.nextConsultation.scheduledAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {clientContext.nextConsultation.scheduledTime && ` às ${clientContext.nextConsultation.scheduledTime.slice(0, 5)}`}
                      </p>
                      {clientContext.nextConsultation.doctorName && (
                        <p className="text-xs text-gray-400 mt-0.5">Dr(a). {clientContext.nextConsultation.doctorName}</p>
                      )}
                      <Link
                        href={`/admin/consultas/${clientContext.nextConsultation.id}`}
                        className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline"
                      >
                        Ver consulta
                        <ExternalLink size={10} />
                      </Link>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Nenhuma consulta agendada</p>
                  )}
                  {clientContext.latestPrescription ? (
                    <div className="rounded-lg bg-amber-500/15 border border-amber-500/40 p-2.5">
                      <p className="text-xs text-amber-400 font-medium flex items-center gap-1 mb-1">
                        <FileText size={12} />
                        Receita
                      </p>
                      <p className="text-xs text-gray-200">
                        Status: {PRESCRIPTION_STATUS_LABELS[clientContext.latestPrescription.status] ?? clientContext.latestPrescription.status}
                      </p>
                      {clientContext.latestPrescription.expiresAt && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Válida até {new Date(clientContext.latestPrescription.expiresAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                      {clientContext.latestPrescription.medications.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-gray-400 font-medium">Medicamentos:</p>
                          <ul className="text-xs text-gray-300 space-y-0.5 list-disc list-inside">
                            {clientContext.latestPrescription.medications.map((m) => (
                              <li key={m.name}>
                                {m.name}
                                {m.dosage && ` — ${m.dosage}`}
                                {m.quantity && ` (${m.quantity})`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <Link
                        href={clientContext.latestPrescription.consultationId
                          ? `/admin/consultas/${clientContext.latestPrescription.consultationId}`
                          : '/admin/receitas'}
                        className="mt-2 inline-flex items-center gap-1 text-xs text-amber-400 hover:underline"
                      >
                        Ver receita
                        <ExternalLink size={10} />
                      </Link>
                    </div>
                  ) : clientContext.patient && (
                    <p className="text-xs text-gray-500">Nenhuma receita encontrada</p>
                  )}
                  <div className="flex flex-col gap-1.5">
                    {(clientContext.patient?.id || clientContext.lead?.id) && (
                      <Link
                        href={clientContext.patient?.id ? `/admin/pacientes/${clientContext.patient.id}/editar` : '/admin/pacientes'}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
                      >
                        <User size={14} />
                        Acessar paciente
                      </Link>
                    )}
                    {clientContext.nextConsultation && (
                      <Link
                        href={`/admin/consultas/${clientContext.nextConsultation.id}`}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 text-xs"
                      >
                        <Calendar size={14} />
                        Ver consulta
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500">Nenhum dado vinculado a este número.</p>
              )}
            </div>
          )}
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Atalhos</h3>
          <div className="space-y-2 mb-6">
            <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 p-3">
              <p className="text-xs text-emerald-400 font-medium">Processadas hoje</p>
              <p className="text-2xl font-bold text-white">{stats.todayProcessed}</p>
            </div>
            <div className="rounded-lg bg-slate-600/20 border border-slate-500/40 p-3">
              <p className="text-xs text-slate-400 font-medium">Ignoradas hoje</p>
              <p className="text-2xl font-bold text-white">{stats.todayIgnored}</p>
            </div>
            <div className="rounded-lg bg-red-600/20 border border-red-500/40 p-3">
              <p className="text-xs text-red-400 font-medium">Erros hoje</p>
              <p className="text-2xl font-bold text-white">{stats.todayErrors}</p>
            </div>
            <div className="rounded-lg bg-gray-600/20 border border-gray-500/40 p-3">
              <p className="text-xs text-gray-400 font-medium">Total hoje</p>
              <p className="text-2xl font-bold text-white">{stats.todayTotal}</p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-400 mb-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hideIgnoredCallbacks}
              onChange={(e) => setHideIgnoredCallbacks(e.target.checked)}
              className="rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
            />
            Ocultar callbacks ignorados
          </label>
          <p className="text-xs text-gray-500 mb-3 leading-tight">
            Esconde Delivery/Status (só mostra processadas e erros).
          </p>
          <label className="flex items-center gap-2 text-sm text-gray-400 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
            />
            Atualizar automaticamente
          </label>
          <p className="text-xs text-gray-500 mb-3 leading-tight">
            Lista a cada 15s; conversa aberta a cada 30s. Só faz requisições com a aba visível.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSyncMessages}
            disabled={syncingMessages}
            className="w-full flex items-center justify-center gap-2 border-emerald-600/60 text-emerald-400 hover:bg-emerald-600/20 mb-2"
            title="Busca na Z-API as mensagens trocadas enquanto o sistema estava offline e exibe no monitor"
          >
            <CloudDownload size={16} />
            {syncingMessages ? 'Sincronizando...' : 'Sincronizar mensagens'}
          </Button>
          <p className="text-xs text-gray-500 mb-3 leading-tight">
            Traz para o monitor as mensagens trocadas quando o sistema estava fora.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { loadConversations(); if (selectedPhone) loadThread(selectedPhone); }}
            className="w-full flex items-center justify-center gap-2 border-gray-600 text-gray-300 hover:bg-gray-700 mb-3"
          >
            <RefreshCw size={16} />
            Atualizar
          </Button>
          <Link
            href="/admin/whatsapp/mensagens"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"
          >
            <Inbox size={16} />
            Mensagens enviadas
          </Link>
          <Link
            href="/admin/whatsapp/monitor/tabela"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-600 text-gray-400 hover:bg-gray-700 text-sm mt-2"
          >
            <List size={16} />
            Ver tabela completa
          </Link>
        </div>
      </div>
    </div>
  );
}
