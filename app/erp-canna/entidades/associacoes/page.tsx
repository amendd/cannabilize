'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Building2, ArrowLeft, Plus } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';

interface Organization {
  id: string;
  name: string;
  type: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  active: boolean;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  ASSOCIATION: 'Associação',
  CLINIC: 'Clínica',
  HYBRID: 'Híbrido',
};

export default function ErpAssociacoesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'ASSOCIATION',
    document: '',
    email: '',
    phone: '',
    address: '',
  });

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
    fetch('/api/erp-canna/organizations')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setOrganizations(data);
        else setOrganizations([]);
      })
      .catch(() => setOrganizations([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      setLoading(true);
      load();
    }
  }, [session?.user?.role]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    fetch('/api/erp-canna/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        toast.success('Associação criada');
        setForm({ name: '', type: 'ASSOCIATION', document: '', email: '', phone: '', address: '' });
        setShowForm(false);
        load();
      })
      .catch((err) => toast.error(err.message || 'Erro ao criar'));
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
            <Building2 size={24} className="text-emerald-600" />
            Associações / Clínicas
          </h1>
          <p className="text-slate-600 text-sm mt-1">Entidades para operação e rastreabilidade (B2B).</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
        >
          <Plus size={18} /> Nova associação
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 p-6 bg-white rounded-xl border border-slate-200 space-y-4">
          <h2 className="font-semibold text-slate-900">Nova associação ou clínica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label>
              <input
                type="text"
                value={form.document}
                onChange={(e) => setForm((f) => ({ ...f, document: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
              Salvar
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Nome</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Tipo</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">CNPJ</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Contato</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {organizations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Nenhuma associação cadastrada. Crie uma para começar.
                    </td>
                  </tr>
                ) : (
                  organizations.map((o) => (
                    <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-900">{o.name}</td>
                      <td className="py-3 px-4 text-slate-600">{TYPE_LABELS[o.type] || o.type}</td>
                      <td className="py-3 px-4 text-slate-600">{o.document || '—'}</td>
                      <td className="py-3 px-4 text-slate-600">{o.email || o.phone || '—'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            o.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {o.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
