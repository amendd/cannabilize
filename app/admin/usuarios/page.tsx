'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { UserPlus, Search, Edit, Trash2, MoreVertical, Shield, Stethoscope, User } from 'lucide-react';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { SkeletonTable } from '@/components/ui/Skeleton';
import LoadingPage from '@/components/ui/Loading';

interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  cpf: string | null;
  createdAt: string;
  _count: { consultations: number; prescriptions: number };
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  DOCTOR: 'Médico',
  PATIENT: 'Paciente',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-amber-100 text-amber-800',
  DOCTOR: 'bg-blue-100 text-blue-800',
  PATIENT: 'bg-gray-100 text-gray-800',
};

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [openActionsId, setOpenActionsId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [status, session?.user?.role, router]);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [roleFilter, searchDebounced]);

  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.role, roleFilter, searchDebounced, pagination.page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(pagination.page));
      params.set('limit', String(pagination.limit));
      if (roleFilter) params.set('role', roleFilter);
      if (searchDebounced) params.set('search', searchDebounced);
      const res = await fetch(`/api/admin/users?${params.toString()}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination?.total ?? 0,
          totalPages: data.pagination?.totalPages ?? 1,
        }));
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erro ao carregar usuários');
      }
    } catch (e) {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => setOpenActionsId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleDelete = async (user: UserListItem) => {
    if (user.id === session?.user?.id) {
      toast.error('Você não pode excluir sua própria conta.');
      return;
    }
    if (!confirm(`Excluir o usuário "${user.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        toast.success('Usuário excluído.');
        fetchUsers();
      } else {
        toast.error(data.error || 'Erro ao excluir');
      }
    } catch {
      toast.error('Erro ao excluir usuário');
    }
    setOpenActionsId(null);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  if (status === 'loading') return <LoadingPage />;
  if (!session || session.user.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Usuários' }]} />
            <h1 className="text-3xl font-bold text-gray-900 font-display mt-4">Gerenciar Usuários</h1>
            <p className="text-gray-600 mt-1">Criar, editar e definir acessos dos usuários do sistema.</p>
          </div>
          <Link
            href="/admin/usuarios/novo"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition"
          >
            <UserPlus size={20} />
            Novo usuário
          </Link>
        </motion.div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por nome ou e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary min-w-[160px]"
            >
              <option value="">Todos os perfis</option>
              <option value="ADMIN">Administrador</option>
              <option value="DOCTOR">Médico</option>
              <option value="PATIENT">Paciente</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <SkeletonTable />
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-mail</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Perfil</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cadastro</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">{user.name}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {ROLE_LABELS[user.role] || user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.phone || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(user.createdAt)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 relative">
                            <Link
                              href={`/admin/usuarios/${user.id}/editar`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                            >
                              <Edit size={14} />
                              Editar
                            </Link>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionsId(openActionsId === user.id ? null : user.id);
                              }}
                              className="xl:hidden inline-flex items-center justify-center h-8 w-8 rounded border border-gray-200 hover:bg-gray-50"
                            >
                              <MoreVertical size={16} />
                            </button>
                            {openActionsId === user.id && (
                              <div
                                className="absolute right-0 top-10 z-20 w-48 bg-white border rounded-lg shadow-lg py-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Link
                                  href={`/admin/usuarios/${user.id}/editar`}
                                  className="block px-4 py-2 text-sm hover:bg-gray-50"
                                  onClick={() => setOpenActionsId(null)}
                                >
                                  Editar e acessos
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(user)}
                                  className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                >
                                  Excluir
                                </button>
                              </div>
                            )}
                            {user.id !== session?.user?.id && (
                              <button
                                type="button"
                                onClick={() => handleDelete(user)}
                                className="hidden xl:inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200"
                              >
                                <Trash2 size={14} />
                                Excluir
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {pagination.totalPages > 1 && (
            <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Total: <strong>{pagination.total}</strong> usuário(s)
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-sm">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
