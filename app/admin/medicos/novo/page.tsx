'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import AvailabilitySelector, { AvailabilitySlot } from '@/components/admin/AvailabilitySelector';

interface DoctorForm {
  name: string;
  crm: string;
  email: string;
  phone: string;
  specialization: string;
  active: boolean;
  password: string;
  availabilities?: AvailabilitySlot[];
}

export default function NewDoctorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<DoctorForm>({
    defaultValues: {
      active: true,
      availabilities: [],
    },
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.role]);

  const onSubmit = async (data: DoctorForm) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          availabilities: data.availabilities || [],
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        toast.success('Médico criado com sucesso!');
        router.push('/admin/medicos');
      } else {
        // Mensagem de erro específica
        const errorMessage = responseData.error || 'Erro ao criar médico';
        const errorDetails = responseData.details;
        
        // Mostrar mensagem de erro detalhada
        if (errorDetails && Array.isArray(errorDetails)) {
          // Se houver múltiplos erros de validação
          const validationErrors = errorDetails.map((err: any) => 
            `${err.path?.join('.')}: ${err.message}`
          ).join(', ');
          toast.error(`${errorMessage} - ${validationErrors}`);
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error: any) {
      console.error('Erro ao criar médico:', error);
      toast.error(
        error.message || 
        'Erro de conexão. Verifique sua internet e tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/admin/medicos"
            className="text-gray-600 hover:text-gray-900 font-medium mb-4 inline-block"
          >
            ← Voltar para Médicos
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Novo Médico</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo *
              </label>
              <input
                {...register('name', { required: 'Nome é obrigatório' })}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CRM *
              </label>
              <input
                {...register('crm', { required: 'CRM é obrigatório' })}
                type="text"
                placeholder="CRM-12345"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {errors.crm && (
                <p className="text-red-500 text-sm mt-1">{errors.crm.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                {...register('email', { 
                  required: 'Email é obrigatório',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido'
                  }
                })}
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <input
                {...register('phone')}
                type="tel"
                placeholder="(00) 00000-0000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Especialização
              </label>
              <input
                {...register('specialization')}
                type="text"
                placeholder="Ex: Psiquiatria, Neurologia..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <AvailabilitySelector
                value={watch('availabilities') || []}
                onChange={(availabilities) => setValue('availabilities', availabilities)}
                error={errors.availabilities?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha Inicial *
              </label>
              <input
                {...register('password', { 
                  required: 'Senha é obrigatória',
                  minLength: {
                    value: 6,
                    message: 'Senha deve ter pelo menos 6 caracteres'
                  }
                })}
                type="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                O médico poderá alterar a senha após o primeiro login
              </p>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-3">
                <input
                  {...register('active')}
                  type="checkbox"
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">
                  Médico ativo (pode receber consultas)
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <Link
              href="/admin/medicos"
              className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Médico'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
