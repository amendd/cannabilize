'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import LoadingPage from '@/components/ui/Loading';
import { canAccessAdmin } from '@/lib/roles-permissions';
import { UserPlus, Mail } from 'lucide-react';

interface NovoPacienteForm {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  address: string;
  sendInvite: boolean;
}

export default function NovoPacientePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NovoPacienteForm>({
    defaultValues: { sendInvite: true, phone: '', cpf: '', address: '' },
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && !canAccessAdmin(session?.user?.role)) {
      router.push('/');
      return;
    }
  }, [status, session?.user?.role, router]);

  const onSubmit = async (data: NovoPacienteForm) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          phone: data.phone?.trim() || undefined,
          cpf: data.cpf?.replace(/\D/g, '') || undefined,
          address: data.address?.trim() || undefined,
          sendInvite: data.sendInvite,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(json.message || 'Paciente criado com sucesso.');
        router.push('/admin/pacientes');
      } else {
        toast.error(json.error || 'Erro ao cadastrar paciente');
      }
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') return <LoadingPage />;
  if (!session || !canAccessAdmin(session.user?.role)) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Pacientes', href: '/admin/pacientes' },
            { label: 'Novo paciente' },
          ]}
        />
        <div className="mt-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 font-display flex items-center gap-2">
            <UserPlus className="text-primary" size={32} />
            Cadastro assistido de paciente
          </h1>
          <p className="text-gray-600 mt-1">
            Crie o cadastro do paciente e envie o convite por e-mail e WhatsApp para ele concluir o cadastro e definir a senha.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-lg shadow-md p-8 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome completo *</label>
              <input
                {...register('name', {
                  required: 'Nome é obrigatório',
                  minLength: { value: 2, message: 'Mínimo 2 caracteres' },
                })}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Nome do paciente"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-mail *</label>
              <input
                {...register('email', {
                  required: 'E-mail é obrigatório',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'E-mail inválido',
                  },
                })}
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="email@exemplo.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telefone (WhatsApp)</label>
              <input
                {...register('phone')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="(11) 99999-9999"
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

          <div className="border-t border-gray-200 pt-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('sendInvite')}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="flex items-center gap-2 text-gray-700">
                <Mail size={18} />
                Enviar convite por e-mail e WhatsApp para o paciente concluir o cadastro e definir a senha
              </span>
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Cadastrando...' : 'Cadastrar paciente'}
            </button>
            <Link
              href="/admin/pacientes"
              className="px-6 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
