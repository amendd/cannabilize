'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import LoadingPage from '@/components/ui/Loading';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

interface PatientForm {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birthDate: string;
  address: string;
  password: string;
}

export default function EditPatientPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const patientId = params?.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<PatientForm>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      cpf: '',
      birthDate: '',
      address: '',
      password: '',
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
    if (session?.user.role === 'ADMIN' && patientId) {
      fetchPatient();
    }
  }, [session, patientId]);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/patients/${patientId}`);
      
      if (response.ok) {
        const patientData = await response.json();
        setPatient(patientData);
        
        // Preencher formulário com dados do paciente
        reset({
          name: patientData.name || '',
          email: patientData.email || '',
          phone: patientData.phone || '',
          cpf: patientData.cpf || '',
          birthDate: patientData.birthDate 
            ? new Date(patientData.birthDate).toISOString().split('T')[0]
            : '',
          address: patientData.address || '',
          password: '', // Não preencher senha
        });
      } else {
        toast.error('Paciente não encontrado');
        router.push('/admin/pacientes');
      }
    } catch (error) {
      console.error('Erro ao carregar paciente:', error);
      toast.error('Erro ao carregar dados do paciente');
      router.push('/admin/pacientes');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: PatientForm) => {
    setIsSubmitting(true);
    try {
      const updateData: any = {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        cpf: data.cpf || null,
        address: data.address || null,
      };

      // Adicionar data de nascimento se fornecida
      if (data.birthDate) {
        updateData.birthDate = data.birthDate;
      } else {
        updateData.birthDate = null;
      }

      // Só enviar senha se foi preenchida
      if (data.password && data.password.trim() !== '') {
        updateData.password = data.password;
      }

      const response = await fetch(`/api/admin/patients/${patientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const responseData = await response.json();

      if (response.ok) {
        toast.success('Paciente atualizado com sucesso!');
        router.push('/admin/pacientes');
      } else {
        const errorMessage = responseData.error || 'Erro ao atualizar paciente';
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error('Erro ao atualizar paciente:', error);
      toast.error(
        error.message || 
        'Erro de conexão. Verifique sua internet e tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCPF = (value: string) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '');
    // Aplica a máscara
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    e.target.value = formatted;
  };

  if (status === 'loading' || loading) {
    return <LoadingPage />;
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }

  if (!patient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Breadcrumbs items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Pacientes', href: '/admin/pacientes' },
            { label: 'Editar' },
          ]} />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Editar Paciente</h1>
          <p className="text-gray-600 mt-2">Editando: {patient.name}</p>
        </div>

        {/* Informações do Paciente */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações do Paciente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total de Consultas:</span>
              <span className="ml-2 font-medium text-gray-900">
                {patient.consultations?.length || 0}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Total de Receitas:</span>
              <span className="ml-2 font-medium text-gray-900">
                {patient.prescriptions?.length || 0}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Cadastrado em:</span>
              <span className="ml-2 font-medium text-gray-900">
                {new Date(patient.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
            {patient.patientCard && (
              <div>
                <span className="text-gray-600">Carteirinha:</span>
                <span className={`ml-2 font-medium ${
                  patient.patientCard.approvalStatus === 'APPROVED' 
                    ? 'text-green-600' 
                    : 'text-yellow-600'
                }`}>
                  {patient.patientCard.approvalStatus === 'APPROVED' ? 'Aprovada' : 'Pendente'}
                </span>
              </div>
            )}
          </div>
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
                CPF
              </label>
              <input
                {...register('cpf')}
                type="text"
                placeholder="000.000.000-00"
                maxLength={14}
                onChange={handleCPFChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Nascimento
              </label>
              <input
                {...register('birthDate')}
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereço
              </label>
              <input
                {...register('address')}
                type="text"
                placeholder="Rua, número, bairro, cidade - UF"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
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
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <Link
              href="/admin/pacientes"
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
