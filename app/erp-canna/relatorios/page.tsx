'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FileDown, ArrowLeft } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';

export default function ErpRelatoriosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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

  const exportAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/erp-canna/audit?limit=500');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const logs = data.logs || [];
      const headers = ['Data', 'Ação', 'Entidade', 'EntityId', 'Usuário', 'Email'];
      const rows = logs.map((l: { createdAt: string; action: string; entity: string; entityId: string | null; user?: { name: string; email: string } | null }) => [
        new Date(l.createdAt).toISOString(),
        l.action,
        l.entity,
        l.entityId || '',
        l.user?.name || '',
        l.user?.email || '',
      ]);
      const csv = [headers.join(';'), ...rows.map((r: string[]) => r.join(';'))].join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auditoria-erp-canna-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Relatório de auditoria exportado.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao exportar');
    } finally {
      setLoading(false);
    }
  };

  const exportOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/erp-canna/orders?limit=500');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const orders = data.orders || [];
      const headers = ['ID', 'Paciente', 'Email', 'Status', 'Data'];
      const rows = orders.map((o: { id: string; patient: { name: string; email: string }; status: string; createdAt: string }) => [
        o.id,
        o.patient?.name || '',
        o.patient?.email || '',
        o.status,
        new Date(o.createdAt).toISOString(),
      ]);
      const csv = [headers.join(';'), ...rows.map((r: string[]) => r.join(';'))].join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pedidos-erp-canna-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Relatório de pedidos exportado.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao exportar');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') return <LoadingPage />;
  if (!session || session.user.role !== 'ADMIN') return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/erp-canna"
          className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mb-2"
        >
          <ArrowLeft size={16} /> Voltar ao dashboard
        </Link>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FileDown size={24} className="text-emerald-600" />
          Relatórios para auditoria
        </h1>
        <p className="text-slate-600 text-sm mt-1">Exportação de dados para conformidade e auditoria regulatória.</p>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-2">Auditoria (logs)</h2>
          <p className="text-sm text-slate-600 mb-4">
            Exportar histórico de ações (até 500 registros) em CSV para auditoria.
          </p>
          <button
            type="button"
            onClick={exportAudit}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium"
          >
            <FileDown size={18} /> Exportar auditoria (CSV)
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-2">Pedidos</h2>
          <p className="text-sm text-slate-600 mb-4">
            Exportar lista de pedidos com status e datas em CSV.
          </p>
          <button
            type="button"
            onClick={exportOrders}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium"
          >
            <FileDown size={18} /> Exportar pedidos (CSV)
          </button>
        </div>

        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-sm text-slate-600">
          <p className="font-medium text-slate-700 mb-1">Relatórios adicionais</p>
          <p>
            Para relatórios de consultas, receitas e pagamentos, utilize o painel Admin e a página de métricas.
            Aqui estão disponíveis exportações específicas do ERP CANNA (auditoria e pedidos).
          </p>
        </div>
      </div>
    </div>
  );
}
