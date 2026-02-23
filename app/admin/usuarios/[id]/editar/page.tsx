'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import LoadingPage from '@/components/ui/Loading';
import { canManageUsers, ROLE_ACCESS_DESCRIPTIONS } from '@/lib/roles-permissions';
import { ADMIN_MENU_GROUPS } from '@/lib/admin-menu';
import { Shield, Stethoscope, User, UserCog, ShieldCheck, ShieldAlert, Leaf } from 'lucide-react';

interface UserForm {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  role: string;
  phone: string;
  cpf: string;
  address: string;
}

const ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin', icon: ShieldCheck, adminOnly: true },
  { value: 'ADMIN', label: 'Administrador', icon: Shield, adminOnly: false },
  { value: 'SUBADMIN', label: 'Subadmin', icon: ShieldAlert, adminOnly: false },
  { value: 'OPERATOR', label: 'Operador', icon: UserCog, adminOnly: false },
  { value: 'DOCTOR', label: 'Médico', icon: Stethoscope, adminOnly: false },
  { value: 'PATIENT', label: 'Paciente', icon: User, adminOnly: false },
  { value: 'AGRONOMIST', label: 'Engenheiro Agrônomo', icon: Leaf, adminOnly: false },
];

export default function EditUserPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [subadminMenuIds, setSubadminMenuIds] = useState<string[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<UserForm>({ defaultValues: { role: 'PATIENT', phone: '', cpf: '', address: '', password: '', passwordConfirm: '' } });

  const roleValue = watch('role');
  const passwordValue = watch('password');
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && !canManageUsers(session?.user?.role)) {
      router.push('/');
      return;
    }
  }, [status, session?.user?.role, router]);

  useEffect(() => {
    if (canManageUsers(session?.user?.role) && id) {
      fetchUser();
    }
  }, [session?.user?.role, id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/users/${id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        reset({
          name: data.name || '',
          email: data.email || '',
          password: '',
          passwordConfirm: '',
          role: data.role || 'PATIENT',
          phone: data.phone || '',
          cpf: data.cpf || '',
          address: data.address || '',
        });
        setSubadminMenuIds(Array.isArray(data.adminMenuPermissions) ? data.adminMenuPermissions : []);
      } else {
        toast.error('Usuário não encontrado');
        router.push('/admin/usuarios');
      }
    } catch {
      toast.error('Erro ao carregar usuário');
      router.push('/admin/usuarios');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: UserForm) => {
    if (data.password && data.password.trim() !== '' && data.password !== data.passwordConfirm) {
      toast.error('As senhas não coincidem.');
      return;
    }
    setIsSubmitting(true);
    try {
      const body: any = {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        role: data.role,
        phone: data.phone?.trim() || null,
        cpf: data.cpf?.replace(/\D/g, '') || null,
        address: data.address?.trim() || null,
      };
      if (data.role === 'SUBADMIN') {
        body.adminMenuPermissions = subadminMenuIds;
      }
      if (data.password && data.password.trim() !== '') {
        body.password = data.password;
      }
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success('Usuário atualizado com sucesso!');
        router.push('/admin/usuarios');
      } else {
        toast.error(json.error || 'Erro ao atualizar');
      }
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || loading) return <LoadingPage />;
  if (!session || !canManageUsers(session.user?.role)) return null;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Breadcrumbs
            items={[
              { label: 'Admin', href: '/admin' },
              { label: 'Usuários', href: '/admin/usuarios' },
              { label: 'Editar usuário' },
            ]}
          />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Editar usuário</h1>
          <p className="text-gray-600 mt-1">Altere dados e defina o perfil de acesso.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome completo *</label>
              <input
                {...register('name', { required: 'Nome é obrigatório', minLength: { value: 2, message: 'Mínimo 2 caracteres' } })}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-mail *</label>
              <input
                {...register('email', {
                  required: 'E-mail é obrigatório',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'E-mail inválido' },
                })}
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nova senha</label>
              <input
                {...register('password', {
                  minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                })}
                type="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Deixe em branco para não alterar"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar nova senha</label>
              <input
                {...register('passwordConfirm', {
                  minLength: passwordValue ? { value: 6, message: 'Mínimo 6 caracteres' } : undefined,
                })}
                type="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Obrigatório se alterar a senha"
              />
              {errors.passwordConfirm && <p className="text-red-500 text-sm mt-1">{errors.passwordConfirm.message}</p>}
              <p className="text-xs text-gray-500 mt-1">Ao alterar a senha, o usuário precisará fazer login novamente.</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Perfil de acesso *</label>
              <div className="space-y-2">
                {ROLES.filter((r) => !r.adminOnly || isSuperAdmin).map((r) => {
                  const Icon = r.icon;
                  const description = ROLE_ACCESS_DESCRIPTIONS[r.value];
                  return (
                    <label
                      key={r.value}
                      className={`flex gap-3 p-3 border rounded-lg cursor-pointer transition ${
                        roleValue === r.value ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        value={r.value}
                        {...register('role', { required: 'Selecione um perfil' })}
                        className="text-primary focus:ring-primary mt-0.5 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-medium text-gray-900">{r.label}</span>
                        {description && (
                          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                        )}
                      </div>
                      <Icon size={20} className="text-gray-400 shrink-0" />
                    </label>
                  );
                })}
              </div>
              {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>}
            </div>

            {roleValue === 'SUBADMIN' && (
              <div className="md:col-span-2 p-4 border border-primary-200 rounded-lg bg-primary-50/50">
                <label className="block text-sm font-medium text-gray-700 mb-3">Menus visíveis no painel admin</label>
                <p className="text-xs text-gray-500 mb-3">Marque quais seções este usuário poderá ver no menu lateral.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ADMIN_MENU_GROUPS.map((group) => (
                    <label
                      key={group.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-white/60 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={subadminMenuIds.includes(group.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSubadminMenuIds((prev) => [...prev, group.id]);
                          } else {
                            setSubadminMenuIds((prev) => prev.filter((id) => id !== group.id));
                          }
                        }}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-800">{group.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
              <input
                {...register('phone')}
                type="tel"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
              <input
                {...register('cpf')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
              <input
                {...register('address')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <Link
              href="/admin/usuarios"
              className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
