'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserCog, ArrowLeft, Shield } from 'lucide-react';
import LoadingPage from '@/components/ui/Loading';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  PATIENT: 'Paciente',
  DOCTOR: 'Médico',
};

export default function ErpUsuariosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string; role: string; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);

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
    fetch('/api/erp-canna/users')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setUsers(data.users ?? []);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [session?.user?.role]);

  if (status === 'loading') return <LoadingPage />;
  if (!session || session.user.role !== 'ADMIN') return null;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link
          href="/erp-canna"
          className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mb-2"
        >
          <ArrowLeft size={16} /> Voltar ao dashboard
        </Link>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <UserCog size={24} className="text-emerald-600" />
          Usuários e permissões
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Roles: Super Admin (plataforma), Admin Associação, Operador, Médico, Financeiro, Paciente. Controle de acesso granular.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nenhum usuário encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Nome</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-900">{u.name}</td>
                    <td className="py-3 px-4 text-slate-600">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        <Shield size={12} /> {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString('pt-BR')}
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
