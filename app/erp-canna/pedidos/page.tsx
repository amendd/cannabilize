'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Package, ArrowLeft } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  SENT: 'Enviado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

interface Order {
  id: string;
  status: string;
  notes: string | null;
  trackingCode: string | null;
  createdAt: string;
  patient: { id: string; name: string; email: string };
  prescription?: { id: string };
  organization?: { id: string; name: string } | null;
}

export default function ErpPedidosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [status, session?.user?.role, router]);

  const load = () => {
    if (session?.user?.role !== 'ADMIN') return;
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus !== 'ALL') params.set('status', filterStatus);
    fetch(`/api/erp-canna/orders?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setOrders(data.orders || []);
        setTotal(data.total ?? 0);
      })
      .catch(() => {
        setOrders([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [session?.user?.role, filterStatus]);

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    fetch(`/api/erp-canna/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        toast.success('Status atualizado');
        load();
      })
      .catch((err) => toast.error(err.message || 'Erro ao atualizar'));
  };

  if (status === 'loading') return <LoadingPage />;
  if (!session || session.user.role !== 'ADMIN') return null;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/erp-canna"
            className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mb-2"
          >
            <ArrowLeft size={16} /> Voltar ao dashboard
          </Link>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package size={24} className="text-emerald-600" />
            Pedidos
          </h1>
          <p className="text-slate-600 text-sm mt-1">Workflow: pedido → aprovação → envio → entrega. Controle de status e rastreabilidade.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Filtrar:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="ALL">Todos</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nenhum pedido encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Paciente</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Data</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900">{order.patient?.name || '—'}</span>
                      {order.patient?.email && (
                        <span className="block text-xs text-slate-500">{order.patient.email}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="text-xs border border-slate-200 rounded px-2 py-1"
                        >
                          {(['PENDING', 'APPROVED', 'PAID', 'SENT', 'DELIVERED'] as const).map((s) => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {!loading && total > 0 && (
        <p className="mt-2 text-sm text-slate-500">Total: {total} pedido(s)</p>
      )}
    </div>
  );
}
