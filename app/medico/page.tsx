'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Video, Calendar, FileText, Clock, User, ExternalLink, DollarSign, ArrowUp } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { SkeletonTable } from '@/components/ui/Skeleton';
import LoadingPage from '@/components/ui/Loading';
import RecentPrescriptions from '@/components/medico/RecentPrescriptions';
import DoctorFinancialOverview from '@/components/medico/DoctorFinancialOverview';
import RescheduleInviteModal from '@/components/medico/RescheduleInviteModal';

interface Consultation {
  id: string;
  scheduledAt: string;
  scheduledTime: string;
  status: string;
  meetingLink?: string;
  meetingPlatform?: string;
  anamnesis?: string | {
    previousTreatments?: string;
    currentMedications?: string;
    allergies?: string;
    additionalInfo?: string;
  };
  patient: {
    name: string;
    email: string;
  };
}

export default function DoctorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayConsultations, setTodayConsultations] = useState<Consultation[]>([]);
  const [upcomingConsultations, setUpcomingConsultations] = useState<Consultation[]>([]);
  const [doctorStats, setDoctorStats] = useState({
    today: 0,
    week: 0,
    prescriptions: 0,
    patientsAttended: 0,
  });
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);

  const role = session?.user?.role;
  const doctorId = session?.user?.doctorId;
  const canAccess = status === 'authenticated' && (role === 'DOCTOR' || role === 'ADMIN');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && role !== 'DOCTOR' && role !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [status, role, router]);

  useEffect(() => {
    if (!canAccess) return;
    // Atualizar atividade do médico (heartbeat) a cada 2 minutos
    const updateActivity = async () => {
      try {
        await fetch('/api/doctors/activity', {
          method: 'POST',
        });
      } catch (error) {
        console.error('Erro ao atualizar atividade:', error);
      }
    };

    // Atualizar imediatamente e depois a cada 2 minutos
    void updateActivity();
    const interval = setInterval(updateActivity, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [canAccess]);

  const loadConsultations = async ({
    doctorId,
    silent = false,
  }: {
    doctorId?: string;
    silent?: boolean;
  } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setInitialLoading(true);
      }
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch(`/api/admin/consultations?limit=50`);
      if (response.ok) {
        const consultations = await response.json();
        
        // Filtrar consultas do médico (se for médico) ou todas (se for admin)
        const filtered = doctorId
          ? consultations.filter((c: any) => c.doctorId === doctorId)
          : consultations;

        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        const todayList = filtered.filter((c: any) => {
          const consultationDate = c.scheduledDate || new Date(c.scheduledAt).toISOString().split('T')[0];
          return consultationDate === today && 
                 ['SCHEDULED', 'IN_PROGRESS'].includes(c.status);
        }).sort((a: any, b: any) => {
          const timeA = a.scheduledTime || new Date(a.scheduledAt).toTimeString().slice(0, 5);
          const timeB = b.scheduledTime || new Date(b.scheduledAt).toTimeString().slice(0, 5);
          return timeA.localeCompare(timeB);
        });

        const upcomingList = filtered.filter((c: any) => {
          const consultationDate = c.scheduledDate || new Date(c.scheduledAt).toISOString().split('T')[0];
          const consultationDateTime = new Date(`${consultationDate}T${c.scheduledTime || new Date(c.scheduledAt).toTimeString().slice(0, 5)}`);
          return consultationDate > today && 
                 consultationDateTime > now &&
                 ['SCHEDULED'].includes(c.status);
        }).slice(0, 10);

        setTodayConsultations(todayList);
        setUpcomingConsultations(upcomingList);
      }
    } catch (error) {
      console.error('Erro ao carregar consultas:', error);
      toast.error('Erro ao carregar consultas');
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setInitialLoading(false);
      }
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/medico/stats');
      if (response.ok) {
        const stats = await response.json();
        setDoctorStats(stats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  useEffect(() => {
    if (!canAccess) return;
    void loadConsultations({ doctorId, silent: false });
    void loadStats();

    // Refresh leve (sem "tela de loading") só das consultas
    const interval = setInterval(() => {
      void loadConsultations({ doctorId, silent: true });
      void loadStats();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [canAccess, doctorId]);

  const handleStartMeeting = async (consultationId: string) => {
    try {
      // Verificar se já tem reunião criada
      const consultation = [...todayConsultations, ...upcomingConsultations].find(c => c.id === consultationId);
      
      if (consultation?.meetingLink) {
        // Abrir link da reunião
        window.open(consultation.meetingLink, '_blank');
      } else {
        // Criar reunião
        toast.loading('Criando reunião...');
        const response = await fetch(`/api/consultations/${consultationId}/meeting`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform: 'GOOGLE_MEET' }),
        });

        if (response.ok) {
          const data = await response.json();
          toast.dismiss();
          toast.success('Reunião criada!');
          // Abrir link
          if (data.meeting?.meetingLink) {
            window.open(data.meeting.meetingLink, '_blank');
          }
          loadConsultations();
        } else {
          toast.dismiss();
          const error = await response.json();
          toast.error(error.error || 'Erro ao criar reunião');
        }
      }
    } catch (error) {
      toast.dismiss();
      console.error('Erro ao iniciar reunião:', error);
      toast.error('Erro ao iniciar reunião');
    }
  };

  if (status === 'loading' || initialLoading) {
    return <LoadingPage />;
  }

  if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
    return null;
  }

  // Estatísticas já carregadas via API (inclui pacientes atendidos corretamente)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900">Dashboard do Médico</h1>
        <div className="mt-2 flex items-center gap-3">
          <p className="text-gray-600">Bem-vindo, {session.user.name}</p>
          {refreshing && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              Atualizando…
            </span>
          )}
        </div>
      </motion.div>

      {/* Cards de Métricas Médicas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {[
          { label: 'Consultas Hoje', value: doctorStats.today, icon: Calendar, color: 'bg-green-500' },
          { label: 'Consultas Semana', value: doctorStats.week, icon: Calendar, color: 'bg-blue-500' },
          { label: 'Receitas Emitidas', value: doctorStats.prescriptions, icon: FileText, color: 'bg-purple-500' },
          { label: 'Pacientes Atendidos', value: doctorStats.patientsAttended, icon: User, color: 'bg-teal-500' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Visão Financeira do Médico */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="text-green-600" size={22} />
            Visão Financeira
          </h2>
          <span className="text-xs text-gray-500">
            Somente você vê estas informações de ganhos
          </span>
        </div>
        <DoctorFinancialOverview />
      </motion.div>

        {/* Consultas de Hoje - Destaque Principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="text-green-600" size={24} />
              Consultas de Hoje
            </h2>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
              {todayConsultations.length}
            </span>
          </div>

          {todayConsultations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhuma consulta agendada para hoje</p>
          ) : (
            <div className="space-y-4">
              {todayConsultations.map((consultation, index) => (
                <motion.div
                  key={consultation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border-2 border-green-100 rounded-lg p-5 hover:shadow-lg hover:border-green-300 transition-all bg-gradient-to-r from-green-50 to-white"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <User className="text-green-600" size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{consultation.patient.name}</h3>
                          <p className="text-sm text-gray-500">{consultation.patient.email}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          consultation.status === 'IN_PROGRESS'
                            ? 'bg-green-500 text-white'
                            : 'bg-blue-500 text-white'
                        }`}>
                          {consultation.status === 'IN_PROGRESS' ? 'Em Andamento' : 'Agendada'}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-600 ml-13 mb-3">
                        <div className="flex items-center gap-2">
                          <Clock size={18} className="text-green-600" />
                          <span className="font-medium">{consultation.scheduledTime || new Date(consultation.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={18} className="text-green-600" />
                          <span className="font-medium">{new Date(consultation.scheduledAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      
                      {/* Anamnese */}
                      {(() => {
                        if (!consultation.anamnesis) return null;
                        
                        let anamnesisData: any = null;
                        try {
                          anamnesisData = typeof consultation.anamnesis === 'string' 
                            ? JSON.parse(consultation.anamnesis) 
                            : consultation.anamnesis;
                        } catch (e) {
                          // Se não for JSON válido, tratar como string simples
                          console.error('Erro ao parsear anamnese:', e);
                          return null;
                        }
                        
                        // Verificar se há dados válidos na anamnese
                        const hasAnamnesisData = anamnesisData && (
                          (anamnesisData.previousTreatments && anamnesisData.previousTreatments.trim()) ||
                          (anamnesisData.currentMedications && anamnesisData.currentMedications.trim()) ||
                          (anamnesisData.allergies && anamnesisData.allergies.trim()) ||
                          (anamnesisData.additionalInfo && anamnesisData.additionalInfo.trim())
                        );
                        
                        if (!hasAnamnesisData) return null;
                        
                        return (
                          <div className="mt-3 pt-3 border-t border-green-200">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText size={16} className="text-green-600" />
                              <span className="text-sm font-semibold text-gray-700">Anamnese:</span>
                            </div>
                            <div className="bg-white rounded-lg p-3 space-y-2 text-xs text-gray-600">
                              {anamnesisData.previousTreatments && anamnesisData.previousTreatments.trim() && (
                                <div>
                                  <strong className="text-gray-700">Tratamentos Anteriores:</strong>
                                  <p className="mt-1 text-gray-600 line-clamp-2">{anamnesisData.previousTreatments}</p>
                                </div>
                              )}
                              {anamnesisData.currentMedications && anamnesisData.currentMedications.trim() && (
                                <div>
                                  <strong className="text-gray-700">Medicamentos Atuais:</strong>
                                  <p className="mt-1 text-gray-600 line-clamp-2">{anamnesisData.currentMedications}</p>
                                </div>
                              )}
                              {anamnesisData.allergies && anamnesisData.allergies.trim() && (
                                <div>
                                  <strong className="text-gray-700">Alergias:</strong>
                                  <p className="mt-1 text-gray-600">{anamnesisData.allergies}</p>
                                </div>
                              )}
                              {anamnesisData.additionalInfo && anamnesisData.additionalInfo.trim() && (
                                <div>
                                  <strong className="text-gray-700">Informações Adicionais:</strong>
                                  <p className="mt-1 text-gray-600 line-clamp-2">{anamnesisData.additionalInfo}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="flex items-center gap-2">
                      {(() => {
                        // Verificar se está dentro da janela de 5 minutos antes
                        const consultationDate = consultation.scheduledDate || new Date(consultation.scheduledAt).toISOString().split('T')[0];
                        const consultationTime = consultation.scheduledTime || new Date(consultation.scheduledAt).toTimeString().slice(0, 5);
                        const consultationDateTime = new Date(`${consultationDate}T${consultationTime}`);
                        const now = new Date();
                        const fiveMinutesBefore = new Date(consultationDateTime.getTime() - 5 * 60 * 1000);
                        const canStart = now >= fiveMinutesBefore && consultation.status === 'SCHEDULED';
                        
                        if (consultation.meetingLink) {
                          return (
                            <Button
                              onClick={() => window.open(consultation.meetingLink, '_blank')}
                              variant="primary"
                            >
                              <Video size={18} />
                              Entrar na Reunião
                              <ExternalLink size={16} />
                            </Button>
                          );
                        } else if (canStart) {
                          return (
                            <Button
                              onClick={() => handleStartMeeting(consultation.id)}
                              variant="primary"
                            >
                              <Video size={18} />
                              Iniciar Reunião
                            </Button>
                          );
                        } else if (now < fiveMinutesBefore) {
                          const minutesUntil = Math.ceil((fiveMinutesBefore.getTime() - now.getTime()) / (60 * 1000));
                          return (
                            <div className="text-sm text-gray-500 px-4 py-2 bg-gray-100 rounded-lg">
                              Disponível em {minutesUntil} min
                            </div>
                          );
                        }
                        return null;
                      })()}
                      {(() => {
                        // Verificar se é uma consulta futura (ainda não iniciou)
                        const consultationDate = consultation.scheduledDate || new Date(consultation.scheduledAt).toISOString().split('T')[0];
                        const consultationTime = consultation.scheduledTime || new Date(consultation.scheduledAt).toTimeString().slice(0, 5);
                        const consultationDateTime = new Date(`${consultationDate}T${consultationTime}`);
                        const now = new Date();
                        
                        // Mostrar botão apenas para consultas futuras (status SCHEDULED e horário no futuro)
                        if (consultation.status === 'SCHEDULED' && consultationDateTime > now) {
                          return (
                            <Button
                              variant="primary"
                              onClick={() => {
                                setSelectedConsultation(consultation);
                                setRescheduleModalOpen(true);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white border-0"
                            >
                              <ArrowUp size={18} />
                              Sugerir Adiantamento
                            </Button>
                          );
                        }
                        return null;
                      })()}
                      <Link href={`/medico/consultas/${consultation.id}`}>
                        <Button variant="outline">
                          <FileText size={18} />
                          Ver Detalhes
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Receitas Recentes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="text-purple-600" size={24} />
              Receitas Recentes
            </h2>
            <Link
              href="/medico/receitas"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver todas →
            </Link>
          </div>
          <RecentPrescriptions />
        </motion.div>

        {/* Próximas Consultas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="text-blue-600" size={24} />
            Próximas Consultas (Próximos 7 dias)
          </h2>

          {upcomingConsultations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhuma consulta futura agendada</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horário</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {upcomingConsultations.map((consultation, index) => (
                    <motion.tr
                      key={consultation.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{consultation.patient.name}</div>
                        <div className="text-sm text-gray-500">{consultation.patient.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(consultation.scheduledAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {consultation.scheduledTime || new Date(consultation.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                          Agendada
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedConsultation(consultation);
                              setRescheduleModalOpen(true);
                            }}
                          >
                            <ArrowUp size={14} />
                            Sugerir Adiantamento
                          </Button>
                          <Link href={`/admin/consultas/${consultation.id}`}>
                            <Button variant="outline" size="sm">
                              Ver Detalhes
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Modal de Convite de Remarcação */}
        {selectedConsultation && (
          <RescheduleInviteModal
            isOpen={rescheduleModalOpen}
            onClose={() => {
              setRescheduleModalOpen(false);
              setSelectedConsultation(null);
            }}
            consultationId={selectedConsultation.id}
            currentScheduledAt={new Date(selectedConsultation.scheduledAt)}
            onInviteSent={() => {
              loadConsultations({ doctorId, silent: true });
            }}
          />
        )}
    </div>
  );
}
