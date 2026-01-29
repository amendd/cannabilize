'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import AvailabilitySelector, { AvailabilitySlot } from '@/components/admin/AvailabilitySelector';
import LoadingPage from '@/components/ui/Loading';

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

export default function EditDoctorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const doctorId = params?.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState<any>(null);
  const isAdmin = status === 'authenticated' && session?.user?.role === 'ADMIN';
  
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<DoctorForm>({
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

  useEffect(() => {
    if (isAdmin && doctorId) {
      fetchDoctor();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, doctorId]);

  const fetchDoctor = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/doctors/${doctorId}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const doctorData = await response.json();
        setDoctor(doctorData);
        
        // Preencher formulário com dados do médico
        reset({
          name: doctorData.name || '',
          crm: doctorData.crm || '',
          email: doctorData.email || '',
          phone: doctorData.phone || '',
          specialization: doctorData.specialization || '',
          active: doctorData.active ?? true,
          password: '', // Não preencher senha
          availabilities: [], // Disponibilidades serão carregadas separadamente
        });

        // Carregar disponibilidades
        const availResponse = await fetch(`/api/admin/doctors/${doctorId}/availability`, {
          credentials: 'include',
        });
        if (availResponse.ok) {
          const availData = await availResponse.json();
          const availabilities: AvailabilitySlot[] = (availData.availabilities || []).map((avail: any) => ({
            dayOfWeek: avail.dayOfWeek,
            startTime: avail.startTime,
            endTime: avail.endTime,
            duration: typeof avail.duration === 'number' ? avail.duration : 20,
            active: avail.active !== false,
          }));
          setValue('availabilities', availabilities);
        }
      } else {
        toast.error('Médico não encontrado');
        router.push('/admin/medicos');
      }
    } catch (error) {
      console.error('Erro ao carregar médico:', error);
      toast.error('Erro ao carregar dados do médico');
      router.push('/admin/medicos');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: DoctorForm) => {
    setIsSubmitting(true);
    try {
      const updateData: any = {
        name: data.name,
        crm: data.crm,
        email: data.email,
        phone: data.phone || '',
        specialization: data.specialization || '',
        active: data.active,
      };

      // Só enviar senha se foi preenchida
      if (data.password && data.password.trim() !== '') {
        updateData.password = data.password;
      }

      const response = await fetch(`/api/admin/doctors/${doctorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      const responseData = await response.json();

      if (response.ok) {
        toast.success('Médico atualizado com sucesso!');
        router.push('/admin/medicos');
      } else {
        const errorMessage = responseData.error || 'Erro ao atualizar médico';
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error('Erro ao atualizar médico:', error);
      toast.error(
        error.message || 
        'Erro de conexão. Verifique sua internet e tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return <LoadingPage />;
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }

  if (!doctor) {
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
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Editar Médico</h1>
          <p className="text-gray-600 mt-2">Editando: {doctor.name}</p>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nova Senha (deixe em branco para não alterar)
              </label>
              <input
                {...register('password', {
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
                Deixe em branco se não quiser alterar a senha
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

            <div className="md:col-span-2">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Nota:</strong> Para editar os horários de disponibilidade, use a página de{' '}
                  <Link 
                    href={`/admin/medicos/${doctorId}/disponibilidade`}
                    className="text-primary hover:underline"
                  >
                    Horários
                  </Link>
                </p>
              </div>
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
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
