'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import LoadingPage from '@/components/ui/Loading';
import { Shield, Stethoscope, User } from 'lucide-react';

interface UserForm {
  name: string;
  email: string;
  password: string;
  role: string;
  phone: string;
  cpf: string;
  address: string;
}

const ROLES = [
  { value: 'ADMIN', label: 'Administrador', icon: Shield },
  { value: 'DOCTOR', label: 'Médico', icon: Stethoscope },
  { value: 'PATIENT', label: 'Paciente', icon: User },
];

export default function NewUserPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<UserForm>({
    defaultValues: { role: 'PATIENT', phone: '', cpf: '', address: '' },
  });

  const roleValue = watch('role');

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

  const onSubmit = async (data: UserForm) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          password: data.password,
          role: data.role,
          phone: data.phone?.trim() || undefined,
          cpf: data.cpf?.replace(/\D/g, '') || undefined,
          address: data.address?.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success('Usuário criado com sucesso!');
        router.push('/admin/usuarios');
      } else {
        toast.error(json.error || 'Erro ao criar usuário');
      }
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') return <LoadingPage />;
  if (!session || session.user.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Breadcrumbs
            items={[
              { label: 'Admin', href: '/admin' },
              { label: 'Usuários', href: '/admin/usuarios' },
              { label: 'Novo usuário' },
            ]}
          />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Novo usuário</h1>
          <p className="text-gray-600 mt-1">Crie um usuário e defina seu perfil de acesso.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome completo *</label>
              <input
                {...register('name', { required: 'Nome é obrigatório', minLength: { value: 2, message: 'Mínimo 2 caracteres' } })}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Nome do usuário"
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
                placeholder="email@exemplo.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Senha *</label>
              <input
                {...register('password', {
                  required: 'Senha é obrigatória',
                  minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                })}
                type="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="••••••••"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Perfil de acesso *</label>
              <div className="space-y-2">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  return (
                    <label
                      key={r.value}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                        roleValue === r.value ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        value={r.value}
                        {...register('role', { required: 'Selecione um perfil' })}
                        className="text-primary focus:ring-primary"
                      />
                      <Icon size={20} className="text-gray-600" />
                      <span className="font-medium">{r.label}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Administrador: acesso total. Médico: área médica. Paciente: área do paciente.
              </p>
              {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
              <input
                {...register('phone')}
                type="tel"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
              <input
                {...register('cpf')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="000.000.000-00"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
              <input
                {...register('address')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Rua, número, bairro, cidade"
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
              {isSubmitting ? 'Salvando...' : 'Criar usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
