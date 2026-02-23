'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Truck, ArrowLeft, Package } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';

const SHIPMENT_STATUS: Record<string, string> = {
  PENDING: 'Pendente',
  QUOTED: 'Cotado',
  LABEL_GENERATED: 'Etiqueta gerada',
  DISPATCHED: 'Despachado',
  IN_TRANSIT: 'Em trânsito',
  DELIVERED: 'Entregue',
  FAILED: 'Falha',
};

interface Shipment {
  id: string;
  orderId: string;
  carrier: string | null;
  carrierService: string | null;
  trackingCode: string | null;
  labelUrl: string | null;
  status: string;
  requestedAt: string;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  order: {
    id: string;
    status: string;
    trackingCode: string | null;
    patient: { id: string; name: string; email: string };
  };
}

export default function ErpLogisticaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
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

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') return;
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus !== 'ALL') params.set('status', filterStatus);
    fetch(`/api/erp-canna/shipments?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setShipments(data.shipments ?? []);
      })
      .catch(() => setShipments([]))
      .finally(() => setLoading(false));
  }, [session?.user?.role, filterStatus]);

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
            <Truck size={24} className="text-emerald-600" />
            Logística
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Solicitações de envio, transportadora, etiquetas e tracking. Integração com APIs de fretes.
          </p>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
        >
          <option value="ALL">Todos os status</option>
          {Object.entries(SHIPMENT_STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : shipments.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Nenhum envio registrado. Os envios são criados a partir dos pedidos (após aprovação/pagamento).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Pedido / Paciente</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Transportadora</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Rastreio</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Solicitado em</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <Link
                        href={`/erp-canna/pedidos`}
                        className="font-medium text-emerald-600 hover:underline"
                      >
                        #{s.order?.id?.slice(0, 8)}
                      </Link>
                      <span className="block text-xs text-slate-500">{s.order?.patient?.name ?? '—'}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {s.carrier || '—'}
                      {s.carrierService && (
                        <span className="block text-xs text-slate-500">{s.carrierService}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {s.trackingCode ? (
                        <span className="font-mono text-xs">{s.trackingCode}</span>
                      ) : (
                        '—'
                      )}
                      {s.labelUrl && (
                        <a
                          href={s.labelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-emerald-600 hover:underline"
                        >
                          Etiqueta
                        </a>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {SHIPMENT_STATUS[s.status] ?? s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(s.requestedAt).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
