'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, FileText, Package, CreditCard, User, Clock, Video, Download, Target, IdCard, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffectivePatientId } from '@/components/impersonation/useEffectivePatientId';
import RescheduleInviteCard from '@/components/patient/RescheduleInviteCard';

export default function PacienteDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { effectivePatientId, loading: loadingPatientId } = useEffectivePatientId();
  const [stats, setStats] = useState({
    consultations: 0,
    prescriptions: 0,
    pendingPayments: 0,
  });
  const [consultations, setConsultations] = useState<any[]>([]);
  const [nextConsultation, setNextConsultation] = useState<any>(null);
  const [lastReturnDate, setLastReturnDate] = useState<any>(null);
  const [rescheduleInvites, setRescheduleInvites] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    // Aguardar até que o patientId esteja disponível
    if (loadingPatientId || !session?.user?.id) {
      return;
    }

    const patientId = effectivePatientId || session.user.id;
    if (!patientId) {
      return;
    }

    console.log('Carregando dados do paciente:', patientId);

    // Carregar consultas
    fetch(`/api/consultations?patientId=${patientId}`)
      .then(res => res.json())
      .then(data => {
        setConsultations(data);
        setStats({
          consultations: data.length,
          prescriptions: data.filter((c: any) => c.prescription).length,
          pendingPayments: data.filter((c: any) => c.payment?.status === 'PENDING').length,
        });

        // Encontrar próxima consulta
        const now = new Date();
        const upcoming = data
          .filter((c: any) => {
            const consultationDate = new Date(c.scheduledAt);
            return consultationDate > now && c.status === 'SCHEDULED';
          })
          .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
        
        if (upcoming.length > 0) {
          setNextConsultation(upcoming[0]);
        }

        // Encontrar última consulta concluída com data de retorno
        const completed = data
          .filter((c: any) => c.status === 'COMPLETED' && c.nextReturnDate)
          .sort((a: any, b: any) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
        
        if (completed.length > 0) {
          setLastReturnDate(completed[0]);
        }
      })
      .catch(err => console.error('Erro ao carregar consultas:', err));

    // Carregar convites de remarcação
    console.log('Buscando convites de remarcação para paciente:', patientId);
    const invitesUrl = effectivePatientId 
      ? `/api/patient/reschedule-invites?patientId=${effectivePatientId}`
      : '/api/patient/reschedule-invites';
    
    fetch(invitesUrl)
      .then(res => {
        console.log('Resposta da API de convites:', res.status, res.statusText);
        if (!res.ok) {
          return res.json().then(err => {
            console.error('Erro da API:', err);
            throw new Error(err.error || `HTTP error! status: ${res.status}`);
          });
        }
        return res.json();
      })
      .then(data => {
        console.log('Convites recebidos da API:', data);
        const invites = data.invites || [];
        console.log(`Total de convites encontrados: ${invites.length}`);
        if (invites.length > 0) {
          console.log('Detalhes dos convites:', invites);
        } else {
          console.log('⚠️ Nenhum convite encontrado. Verifique:');
          console.log('  - Se há convites no banco para este paciente');
          console.log('  - Se o status é PENDING');
          console.log('  - Se o expiresAt é maior que agora');
        }
        setRescheduleInvites(invites);
      })
      .catch(err => {
        console.error('Erro ao carregar convites:', err);
        setRescheduleInvites([]);
      });
  }, [effectivePatientId, loadingPatientId, session?.user?.id]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  if (!session) return null;

  const cards = [
    {
      title: 'Minhas Consultas',
      value: stats.consultations,
      icon: Calendar,
      link: '/paciente/consultas',
      color: 'bg-blue-500',
    },
    {
      title: 'Receitas Médicas',
      value: stats.prescriptions,
      icon: FileText,
      link: '/paciente/receitas',
      color: 'bg-green-500',
    },
    {
      title: 'Pagamentos Pendentes',
      value: stats.pendingPayments,
      icon: CreditCard,
      link: '/paciente/pagamentos',
      color: 'bg-yellow-500',
    },
    {
      title: 'Meus Documentos',
      value: 'Ver',
      icon: Package,
      link: '/paciente/documentos',
      color: 'bg-purple-500',
    },
    {
      title: 'Carteirinha Digital',
      value: 'Ver',
      icon: IdCard,
      link: '/paciente/carteirinha',
      color: 'bg-emerald-500',
    },
  ];

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Área do Paciente
        </h1>
        <p className="text-gray-600 mt-2">Bem-vindo, {session.user?.name}</p>
      </motion.div>

      {/* Cards Principais */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
            >
              <Link
                href={card.link}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all block"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{card.value}</span>
                </div>
                <p className="text-gray-600 font-medium">{card.title}</p>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Convites de Remarcação - Destaque */}
      {rescheduleInvites.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8 space-y-4"
        >
          {rescheduleInvites.map((invite) => (
            <RescheduleInviteCard
              key={invite.id}
              invite={invite}
              onRespond={() => {
                // Recarregar convites e consultas
                const patientId = effectivePatientId || session?.user?.id;
                const invitesUrl = effectivePatientId 
                  ? `/api/patient/reschedule-invites?patientId=${effectivePatientId}`
                  : '/api/patient/reschedule-invites';
                
                fetch(invitesUrl)
                  .then(res => res.json())
                  .then(data => {
                    setRescheduleInvites(data.invites || []);
                  });
                fetch(`/api/consultations?patientId=${patientId}`)
                  .then(res => res.json())
                  .then(data => {
                    setConsultations(data);
                    const now = new Date();
                    const upcoming = data
                      .filter((c: any) => {
                        const consultationDate = new Date(c.scheduledAt);
                        return consultationDate > now && c.status === 'SCHEDULED';
                      })
                      .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
                    if (upcoming.length > 0) {
                      setNextConsultation(upcoming[0]);
                    }
                  });
              }}
            />
          ))}
        </motion.div>
      ) : (
        // Debug: Mostrar mensagem se não há convites (apenas em desenvolvimento)
        process.env.NODE_ENV === 'development' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
          >
            <p className="text-sm text-yellow-800">
              <strong>Debug:</strong> Nenhum convite pendente encontrado. 
              Verifique o console do navegador (F12) para mais detalhes.
            </p>
          </motion.div>
        )
      )}

      {/* Próxima Consulta - Destaque */}
      {nextConsultation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center gap-3 mb-6">
              <Target size={32} />
              <h2 className="text-2xl font-bold">Sua Próxima Consulta</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex items-center gap-3">
                <Calendar size={24} />
                <div>
                  <p className="text-sm opacity-90">Data</p>
                  <p className="text-lg font-semibold">{formatDate(nextConsultation.scheduledAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={24} />
                <div>
                  <p className="text-sm opacity-90">Horário</p>
                  <p className="text-lg font-semibold">{formatTime(nextConsultation.scheduledAt)}</p>
                </div>
              </div>
              {nextConsultation.doctor && (
                <div className="flex items-center gap-3">
                  <User size={24} />
                  <div>
                    <p className="text-sm opacity-90">Médico</p>
                    <p className="text-lg font-semibold">
                      {nextConsultation.doctor.name}
                      {nextConsultation.doctor.crm && ` - CRM ${nextConsultation.doctor.crm}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-4">
              {nextConsultation.meetingLink && (
                <a
                  href={nextConsultation.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center gap-2"
                >
                  <Video size={20} />
                  Entrar na Reunião
                </a>
              )}
              <Link
                href={`/paciente/consultas/${nextConsultation.id}`}
                className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition flex items-center gap-2 border border-white/30"
              >
                <FileText size={20} />
                Ver Detalhes
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Retorno - Destaque */}
      {lastReturnDate?.nextReturnDate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center gap-3 mb-6">
              <RotateCcw size={32} />
              <h2 className="text-2xl font-bold">Seu Retorno</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex items-center gap-3">
                <Calendar size={24} />
                <div>
                  <p className="text-sm opacity-90">Data</p>
                  <p className="text-lg font-semibold">{formatDate(lastReturnDate.nextReturnDate)}</p>
                </div>
              </div>
              {lastReturnDate.doctor && (
                <div className="flex items-center gap-3">
                  <User size={24} />
                  <div>
                    <p className="text-sm opacity-90">Médico</p>
                    <p className="text-lg font-semibold">
                      {lastReturnDate.doctor.name}
                      {lastReturnDate.doctor.crm && ` - CRM ${lastReturnDate.doctor.crm}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <Link
                href={`/paciente/consultas/${lastReturnDate.id}`}
                className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition flex items-center gap-2 border border-white/30"
              >
                <FileText size={20} />
                Ver Detalhes
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Histórico de Consultas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-md p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Histórico de Consultas</h2>
          <Link
            href="/paciente/consultas"
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Ver todas →
          </Link>
        </div>
        {consultations.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhuma consulta encontrada</p>
        ) : (
          <div className="space-y-4">
            {consultations.slice(0, 5).map((consultation: any) => (
              <div
                key={consultation.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {formatDate(consultation.scheduledAt)} às {formatTime(consultation.scheduledAt)}
                    </p>
                    {consultation.doctor && (
                      <p className="text-sm text-gray-600">
                        Dr(a). {consultation.doctor.name}
                      </p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    consultation.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-800'
                      : consultation.status === 'SCHEDULED'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {consultation.status === 'COMPLETED' ? 'Concluída' :
                     consultation.status === 'SCHEDULED' ? 'Agendada' :
                     consultation.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Informações do Perfil */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-md p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">Informações do Perfil</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Nome</p>
            <p className="text-gray-900 font-medium">{session.user?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Email</p>
            <p className="text-gray-900 font-medium">{session.user?.email}</p>
          </div>
        </div>
        <Link
          href="/paciente/perfil"
          className="mt-4 inline-block text-purple-600 hover:text-purple-700 font-medium text-sm"
        >
          Editar perfil →
        </Link>
      </motion.div>
    </div>
  );
}
