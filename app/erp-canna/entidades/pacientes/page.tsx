'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserCircle, Search, ArrowLeft } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  role: string;
  createdAt: string;
}

export default function ErpPacientesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
    if (session?.user?.role === 'ADMIN') {
      setLoading(true);
      const url = search
        ? `/api/admin/patients?search=${encodeURIComponent(search)}`
        : '/api/admin/patients';
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : (data?.patients ?? []);
          setPatients(Array.isArray(list) ? list : []);
        })
        .catch(() => setPatients([]))
        .finally(() => setLoading(false));
    }
  }, [session?.user?.role, search]);

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
            <UserCircle size={24} className="text-emerald-600" />
            Pacientes
          </h1>
          <p className="text-slate-600 text-sm mt-1">Cadastro estruturado para auditoria e rastreabilidade.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg w-full sm:w-64 text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Nome</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Telefone</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">CPF</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Nenhum paciente encontrado.
                    </td>
                  </tr>
                ) : (
                  patients.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-900">{p.name}</td>
                      <td className="py-3 px-4 text-slate-600">{p.email}</td>
                      <td className="py-3 px-4 text-slate-600">{p.phone || '—'}</td>
                      <td className="py-3 px-4 text-slate-600">{p.cpf || '—'}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(p.createdAt).toLocaleDateString('pt-BR')}
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
