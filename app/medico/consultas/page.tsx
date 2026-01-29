'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Clock, FileText, Video, User, ExternalLink, Search, Filter, ArrowUp } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import LoadingPage from '@/components/ui/Loading';
import RescheduleInviteModal from '@/components/medico/RescheduleInviteModal';

interface Consultation {
  id: string;
  scheduledAt: string;
  scheduledTime?: string;
  scheduledDate?: string;
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
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  doctor?: {
    id: string;
    name: string;
  };
  prescription?: {
    id: string;
    pdfUrl?: string;
  };
  payment?: {
    id: string;
    status: string;
  };
}

export default function MedicoConsultasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user.role !== 'DOCTOR' && session?.user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.role]);

  useEffect(() => {
    if (session?.user.role === 'DOCTOR' || session?.user.role === 'ADMIN') {
      loadConsultations();
    }
  }, [session, statusFilter]);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      params.append('limit', '100');

      const response = await fetch(`/api/admin/consultations?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        
        // Filtrar consultas do médico (se for médico) ou todas (se for admin)
        const doctorId = session?.user.doctorId;
        const filtered = doctorId
          ? data.filter((c: any) => c.doctorId === doctorId)
          : data;

        setConsultations(filtered);
      } else {
        toast.error('Erro ao carregar consultas');
      }
    } catch (error) {
      console.error('Erro ao carregar consultas:', error);
      toast.error('Erro ao carregar consultas');
    } finally {
      setLoading(false);
    }
  };

  const handleStartMeeting = async (consultationId: string) => {
    try {
      const consultation = consultations.find(c => c.id === consultationId);
      
      if (consultation?.meetingLink) {
        window.open(consultation.meetingLink, '_blank');
      } else {
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      SCHEDULED: { label: 'Agendada', className: 'bg-blue-100 text-blue-800' },
      IN_PROGRESS: { label: 'Em Andamento', className: 'bg-yellow-100 text-yellow-800' },
      COMPLETED: { label: 'Concluída', className: 'bg-green-100 text-green-800' },
      CANCELLED: { label: 'Cancelada', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const filteredConsultations = consultations.filter(consultation => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        consultation.patient.name.toLowerCase().includes(searchLower) ||
        consultation.patient.email.toLowerCase().includes(searchLower) ||
        consultation.id.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (status === 'loading' || loading) {
    return <LoadingPage />;
  }

  if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900">Minhas Consultas</h1>
        <p className="text-gray-600 mt-2">Visualize e gerencie todas as suas consultas</p>
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-md p-6 mb-6"
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por paciente, email ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Filtro de Status */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Todos os Status</option>
              <option value="SCHEDULED">Agendada</option>
              <option value="IN_PROGRESS">Em Andamento</option>
              <option value="COMPLETED">Concluída</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Lista de Consultas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-md overflow-hidden"
      >
        {filteredConsultations.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 text-lg mb-2">
              {searchTerm || statusFilter 
                ? 'Nenhuma consulta encontrada com os filtros aplicados'
                : 'Você ainda não possui consultas agendadas'}
            </p>
            {!searchTerm && !statusFilter && (
              <Link href="/agendamento">
                <Button variant="primary" className="mt-4">
                  Agendar Consulta
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receita
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredConsultations.map((consultation, index) => {
                  const consultationDate = consultation.scheduledDate || new Date(consultation.scheduledAt).toISOString().split('T')[0];
                  const consultationTime = consultation.scheduledTime || new Date(consultation.scheduledAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <motion.tr
                      key={consultation.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                            <User className="text-green-600" size={20} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {consultation.patient.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {consultation.patient.email}
                            </div>
                            {consultation.patient.phone && (
                              <div className="text-xs text-gray-400">
                                {consultation.patient.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={16} className="text-green-600" />
                          <span>{new Date(consultationDate).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <Clock size={16} className="text-green-600" />
                          <span>{consultationTime}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(consultation.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {consultation.prescription ? (
                          <div className="flex items-center gap-2">
                            <FileText size={18} className="text-green-600" />
                            {consultation.prescription.pdfUrl && (
                              <a
                                href={consultation.prescription.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:underline text-sm"
                              >
                                Ver PDF
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          {(() => {
                            // Verificar se está dentro da janela de 5 minutos antes
                            const consultationDate = consultation.scheduledDate || new Date(consultation.scheduledAt).toISOString().split('T')[0];
                            const consultationTime = consultation.scheduledTime || new Date(consultation.scheduledAt).toTimeString().slice(0, 5);
                            const consultationDateTime = new Date(`${consultationDate}T${consultationTime}`);
                            const now = new Date();
                            const fiveMinutesBefore = new Date(consultationDateTime.getTime() - 5 * 60 * 1000);
                            const canStart = now >= fiveMinutesBefore && (consultation.status === 'SCHEDULED' || consultation.status === 'IN_PROGRESS');
                            
                            if (consultation.meetingLink) {
                              return (
                                <Button
                                  onClick={() => window.open(consultation.meetingLink, '_blank')}
                                  variant="primary"
                                  size="sm"
                                >
                                  <Video size={16} />
                                  Entrar
                                  <ExternalLink size={14} />
                                </Button>
                              );
                            } else if (canStart) {
                              return (
                                <Button
                                  onClick={() => handleStartMeeting(consultation.id)}
                                  variant="primary"
                                  size="sm"
                                >
                                  <Video size={16} />
                                  Iniciar
                                </Button>
                              );
                            } else if (now < fiveMinutesBefore && consultation.status === 'SCHEDULED') {
                              const minutesUntil = Math.ceil((fiveMinutesBefore.getTime() - now.getTime()) / (60 * 1000));
                              return (
                                <span className="text-xs text-gray-500">
                                  Em {minutesUntil} min
                                </span>
                              );
                            }
                            return null;
                          })()}
                          {(() => {
                            const consultationDate = consultation.scheduledDate || new Date(consultation.scheduledAt).toISOString().split('T')[0];
                            const consultationTime = consultation.scheduledTime || new Date(consultation.scheduledAt).toTimeString().slice(0, 5);
                            const consultationDateTime = new Date(`${consultationDate}T${consultationTime}`);
                            const now = new Date();
                            
                            return consultation.status === 'SCHEDULED' && consultationDateTime > now ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedConsultation(consultation);
                                  setRescheduleModalOpen(true);
                                }}
                              >
                                <ArrowUp size={14} />
                                Adiantar
                              </Button>
                            ) : null;
                          })()}
                          <Link href={`/medico/consultas/${consultation.id}`}>
                            <Button variant="outline" size="sm">
                              <FileText size={16} />
                              Detalhes
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Estatísticas */}
      {filteredConsultations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-2xl font-bold text-gray-900">{filteredConsultations.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Agendadas</div>
            <div className="text-2xl font-bold text-blue-600">
              {filteredConsultations.filter(c => c.status === 'SCHEDULED').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Concluídas</div>
            <div className="text-2xl font-bold text-green-600">
              {filteredConsultations.filter(c => c.status === 'COMPLETED').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Canceladas</div>
            <div className="text-2xl font-bold text-red-600">
              {filteredConsultations.filter(c => c.status === 'CANCELLED').length}
            </div>
          </div>
        </motion.div>
      )}

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
            loadConsultations();
          }}
        />
      )}
    </div>
  );
}
