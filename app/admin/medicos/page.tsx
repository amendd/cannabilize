'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Eye, LogIn, MoreVertical } from 'lucide-react';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { SkeletonTable } from '@/components/ui/Skeleton';
import LoadingPage from '@/components/ui/Loading';
import DoctorDetailModal from '@/components/admin/DoctorDetailModal';

interface Doctor {
  id: string;
  name: string;
  crm: string;
  email: string;
  phone: string | null;
  specialization: string | null;
  availability: string | null;
  active: boolean;
  lastActiveAt: string | null;
  isOnline: boolean;
  totalConsultations: number;
  scheduledConsultations: number;
  inProgressConsultations: number;
  completedConsultations: number;
  cancelledConsultations: number;
  noShowConsultations: number;
  user: {
    name: string;
    email: string;
  } | null;
}

export default function DoctorsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [openActionsForDoctorId, setOpenActionsForDoctorId] = useState<string | null>(null);

  const formatLastActive = (lastActiveAt: string | null) => {
    if (!lastActiveAt) return 'Nunca acessou';

    const last = new Date(lastActiveAt);
    const diffMs = Date.now() - last.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffMinutes < 1) return 'Agora mesmo';
    if (diffMinutes < 60) return `Há ${diffMinutes} min`;
    if (diffHours === 1) return 'Há 1 hora';
    if (diffHours < 24) return `Há ${diffHours} horas`;

    return last.toLocaleString('pt-BR');
  };

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

  const isAdmin = status === 'authenticated' && session?.user?.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) {
      setLoading(true);
      fetchDoctors(period, onlineOnly);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, period, onlineOnly]);

  // Fechar dropdown de ações ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => setOpenActionsForDoctorId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchDoctors = async (currentPeriod: string, currentOnlineOnly: boolean) => {
    try {
      const params = new URLSearchParams();
      params.set('period', currentPeriod);
      if (currentOnlineOnly) {
        params.set('onlineOnly', 'true');
      }

      const response = await fetch(`/api/admin/doctors?${params.toString()}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        // A API retorna { doctors: [...] }, então precisamos acessar data.doctors
        setDoctors(data.doctors || []);
      } else {
        let msg = 'Erro ao carregar médicos';
        try {
          const data = await response.json();
          if (data?.error) msg = data.error;
        } catch {}
        toast.error(msg);
      }
    } catch (error) {
      console.error('Erro ao carregar médicos:', error);
      toast.error('Erro ao carregar médicos');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (doctorId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/doctors/${doctorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentStatus }),
      });

      if (response.ok) {
        toast.success(`Médico ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`);
        fetchDoctors(period, onlineOnly);
      } else {
        toast.error('Erro ao atualizar status do médico');
      }
    } catch (error) {
      toast.error('Erro ao atualizar médico');
    }
  };

  const handleDelete = async (doctorId: string, doctorName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o médico ${doctorName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/doctors/${doctorId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Médico excluído com sucesso!');
        fetchDoctors(period, onlineOnly);
      } else {
        toast.error('Erro ao excluir médico');
      }
    } catch (error) {
      toast.error('Erro ao excluir médico');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <SkeletonTable />
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <Breadcrumbs
              items={[
                { label: 'Admin', href: '/admin' },
                { label: 'Médicos' },
              ]}
            />
            <h1 className="text-3xl font-bold text-gray-900 font-display mt-4">
              Gerenciar Médicos
            </h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                  Período das métricas
                </label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as '7d' | '30d' | '90d' | 'all')}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary min-h-[40px]"
                >
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Últimos 30 dias</option>
                  <option value="90d">Últimos 90 dias</option>
                  <option value="all">Todo o histórico</option>
                </select>
              </div>
              <label className="mt-4 sm:mt-6 inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={onlineOnly}
                  onChange={(e) => setOnlineOnly(e.target.checked)}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                Apenas médicos online
              </label>
            </div>
            <Link
              href="/admin/medicos/novo"
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition min-h-[44px] flex items-center justify-center"
              aria-label="Adicionar novo médico"
            >
              + Novo Médico
            </Link>
          </div>
        </motion.div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 z-20 bg-gray-50">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CRM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Especialização
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status Online
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Atendimentos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 z-20 bg-gray-50">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {doctors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    Nenhum médico cadastrado
                  </td>
                </tr>
              ) : (
                doctors.map((doctor) => (
                  <tr
                    key={doctor.id}
                    className={`group hover:bg-gray-50 transition-colors ${!doctor.active ? 'opacity-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap sticky left-0 z-10 bg-white group-hover:bg-gray-50">
                      <div className="text-sm font-medium text-gray-900">{doctor.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{doctor.crm}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{doctor.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{doctor.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{doctor.specialization || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span
                          className={`inline-flex items-center text-xs font-semibold ${
                            doctor.isOnline
                              ? 'text-green-700'
                              : 'text-gray-600'
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full mr-2 ${
                              doctor.isOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          />
                          {doctor.isOnline ? 'Online agora' : 'Offline'}
                        </span>
                        <span className="text-xs text-gray-500">
                          Última atividade: {formatLastActive(doctor.lastActiveAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-900 space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold">Realizados:</span>
                          <span>{doctor.completedConsultations}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold">Agendados:</span>
                          <span>{doctor.scheduledConsultations + doctor.inProgressConsultations}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <span className="font-semibold">Total:</span>
                          <span>{doctor.totalConsultations}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          doctor.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {doctor.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium sticky right-0 z-10 bg-white group-hover:bg-gray-50 shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.35)]">
                      {/* Desktop (xl+) - botões completos */}
                      <div className="hidden xl:flex justify-end gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            setSelectedDoctor(doctor);
                            setIsDetailModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 flex items-center justify-center gap-1.5 whitespace-nowrap"
                          aria-label={`Ver detalhes do médico ${doctor.name}`}
                        >
                          <Eye size={14} />
                          Detalhes
                        </button>
                        <Link
                          href={`/admin/medicos/${doctor.id}/editar`}
                          className="px-3 py-1.5 rounded text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 flex items-center justify-center gap-1.5 whitespace-nowrap"
                          aria-label={`Editar médico ${doctor.name}`}
                        >
                          Editar
                        </Link>
                        <a
                          href={`/admin/impersonate-doctor?doctorId=${doctor.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 flex items-center justify-center gap-1.5 whitespace-nowrap"
                          aria-label={`Acessar como médico ${doctor.name}`}
                          title="Abrir área do médico em nova aba"
                        >
                          <LogIn size={14} />
                          Fazer Login
                        </a>
                        <Link
                          href={`/admin/medicos/${doctor.id}/disponibilidade`}
                          className="px-3 py-1.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200 flex items-center justify-center whitespace-nowrap"
                          aria-label={`Configurar horários de ${doctor.name}`}
                        >
                          Horários
                        </Link>
                        <button
                          onClick={() => handleToggleActive(doctor.id, doctor.active)}
                          className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap ${
                            doctor.active
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                          aria-label={doctor.active ? `Desativar médico ${doctor.name}` : `Ativar médico ${doctor.name}`}
                        >
                          {doctor.active ? 'Desativar' : 'Ativar'}
                        </button>
                        <button
                          onClick={() => handleDelete(doctor.id, doctor.name)}
                          className="px-3 py-1.5 rounded text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 whitespace-nowrap"
                          aria-label={`Excluir médico ${doctor.name}`}
                        >
                          Excluir
                        </button>
                      </div>

                      {/* Mobile/Tablet - menu compacto */}
                      <div className="xl:hidden flex justify-end relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenActionsForDoctorId((prev) => (prev === doctor.id ? null : doctor.id))
                          }
                          className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                          aria-label={`Abrir ações do médico ${doctor.name}`}
                          aria-haspopup="menu"
                          aria-expanded={openActionsForDoctorId === doctor.id}
                        >
                          <MoreVertical size={18} />
                        </button>

                        {openActionsForDoctorId === doctor.id && (
                          <div
                            role="menu"
                            className="absolute right-0 top-10 z-20 w-56 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
                          >
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setSelectedDoctor(doctor);
                                setIsDetailModalOpen(true);
                                setOpenActionsForDoctorId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Eye size={16} className="text-green-700" />
                              Detalhes
                            </button>
                            <Link
                              role="menuitem"
                              href={`/admin/medicos/${doctor.id}/editar`}
                              onClick={() => setOpenActionsForDoctorId(null)}
                              className="w-full px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <span className="inline-block w-2 h-2 rounded-full bg-blue-600" />
                              Editar
                            </Link>
                            <a
                              role="menuitem"
                              href={`/admin/impersonate-doctor?doctorId=${doctor.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setOpenActionsForDoctorId(null)}
                              className="w-full px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <LogIn size={16} className="text-purple-700" />
                              Fazer Login
                            </a>
                            <Link
                              role="menuitem"
                              href={`/admin/medicos/${doctor.id}/disponibilidade`}
                              onClick={() => setOpenActionsForDoctorId(null)}
                              className="w-full px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <span className="inline-block w-2 h-2 rounded-full bg-indigo-600" />
                              Horários
                            </Link>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenActionsForDoctorId(null);
                                handleToggleActive(doctor.id, doctor.active);
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <span
                                className={`inline-block w-2 h-2 rounded-full ${
                                  doctor.active ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                              />
                              {doctor.active ? 'Desativar' : 'Ativar'}
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenActionsForDoctorId(null);
                                handleDelete(doctor.id, doctor.name);
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-700 flex items-center gap-2"
                            >
                              <span className="inline-block w-2 h-2 rounded-full bg-red-600" />
                              Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Modal de Detalhes */}
        <DoctorDetailModal
          doctor={selectedDoctor}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedDoctor(null);
          }}
        />
      </div>
    </div>
  );
}
