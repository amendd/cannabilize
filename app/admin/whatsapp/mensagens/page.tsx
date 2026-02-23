'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MessageSquare, Settings, FileText, Inbox, GitBranch, RefreshCw, Search, ChevronLeft, ChevronRight, Activity, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { SkeletonDashboard } from '@/components/ui/Skeleton';

interface WhatsAppMessageRow {
  id: string;
  to: string;
  message: string;
  template: string | null;
  status: string;
  error: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  SENT: 'Enviado',
  DELIVERED: 'Entregue',
  READ: 'Lido',
  FAILED: 'Falhou',
};

export default function WhatsAppMensagensPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<WhatsAppMessageRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [resendingId, setResendingId] = useState<string | null>(null);

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
      loadMessages();
    }
  }, [status, session?.user?.role, pagination.page]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(pagination.page));
      params.set('limit', String(pagination.limit));
      if (filterStatus) params.set('status', filterStatus);
      if (filterTo) params.set('to', filterTo);
      if (filterFromDate) params.set('fromDate', filterFromDate);
      if (filterToDate) params.set('toDate', filterToDate);
      const res = await fetch(`/api/admin/whatsapp/messages?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        setPagination(prev => ({ ...prev, ...data.pagination }));
      } else {
        toast.error('Erro ao carregar mensagens');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadMessages();
  };

  const handleResend = async (messageId: string) => {
    try {
      setResendingId(messageId);
      const res = await fetch('/api/admin/whatsapp/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Mensagem reenviada');
        loadMessages();
      } else {
        toast.error(data.error || 'Erro ao reenviar');
      }
    } catch (error) {
      toast.error('Erro ao reenviar');
    } finally {
      setResendingId(null);
    }
  };

  if (status === 'loading' || (status === 'authenticated' && loading && messages.length === 0)) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'WhatsApp', href: '/admin/whatsapp' },
            { label: 'Mensagens', href: '/admin/whatsapp/mensagens' },
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
                href="/admin/whatsapp/monitor"
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  pathname === '/admin/whatsapp/monitor' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Activity size={18} />
                Monitor Z-API
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
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Inbox className="text-primary" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">Histórico de Mensagens</h1>
          </div>
          <p className="text-gray-600">
            Visualize e reenvie mensagens WhatsApp enviadas pelo sistema.
          </p>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 mb-6"
        >
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-40"
              >
                <option value="">Todos</option>
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número (contém)</label>
              <Input
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                placeholder="11999..."
                className="w-40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">De</label>
              <Input
                type="date"
                value={filterFromDate}
                onChange={(e) => setFilterFromDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Até</label>
              <Input
                type="date"
                value={filterToDate}
                onChange={(e) => setFilterToDate(e.target.value)}
                className="w-40"
              />
            </div>
            <Button onClick={handleFilter} className="flex items-center gap-2">
              <Search size={16} />
              Filtrar
            </Button>
          </div>
        </motion.div>

        {/* Tabela */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destinatário</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mensagem</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {messages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Nenhuma mensagem encontrada.
                    </td>
                  </tr>
                ) : (
                  messages.map((msg) => (
                    <tr key={msg.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-mono">{msg.to}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            msg.status === 'FAILED'
                              ? 'bg-red-100 text-red-800'
                              : msg.status === 'DELIVERED' || msg.status === 'READ'
                              ? 'bg-green-100 text-green-800'
                              : msg.status === 'SENT'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {STATUS_LABELS[msg.status] || msg.status}
                        </span>
                        {msg.error && (
                          <p className="text-xs text-red-600 mt-0.5 truncate max-w-[180px]" title={msg.error}>
                            {msg.error}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(msg.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={msg.message}>
                        {msg.message}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {msg.status === 'FAILED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResend(msg.id)}
                            disabled={!!resendingId}
                            className="flex items-center gap-1 ml-auto"
                          >
                            <RefreshCw size={14} className={resendingId === msg.id ? 'animate-spin' : ''} />
                            Reenviar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Página {pagination.page} de {pagination.totalPages} ({pagination.total} mensagens)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
