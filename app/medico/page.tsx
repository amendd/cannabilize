'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Video, Calendar, FileText, Clock, User, ExternalLink, DollarSign, ArrowUp, CalendarClock, CheckCircle2, Circle, Radio, Bell, BellOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import LoadingPage from '@/components/ui/Loading';
import RecentPrescriptions from '@/components/medico/RecentPrescriptions';
import DoctorFinancialOverview from '@/components/medico/DoctorFinancialOverview';
import RescheduleInviteModal from '@/components/medico/RescheduleInviteModal';
import NextAppointmentCountdown from '@/components/medico/NextAppointmentCountdown';
import CentralDeAcaoMedico, { type ActionCenterData } from '@/components/medico/CentralDeAcaoMedico';
import DoctorStatusOnline from '@/components/medico/DoctorStatusOnline';
import AtencaoClinicaBlock from '@/components/medico/AtencaoClinicaBlock';

/** Status visual das consultas: Agendada=Azul, Em andamento=Verde, Aguardando início=Amarelo, Atrasada=Vermelho, Concluída=Cinza */
function getConsultationStatusDisplay(
  status: string,
  scheduledDate: string,
  scheduledTime: string
): { label: string; className: string } {
  const now = new Date();
  const dateStr = scheduledDate || now.toISOString().split('T')[0];
  const timeStr = scheduledTime || '00:00';
  const consultDt = new Date(`${dateStr}T${timeStr}`);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const consultMins = consultDt.getHours() * 60 + consultDt.getMinutes();
  const fiveMinBefore = nowMins - 5;
  const fifteenMinAfter = nowMins + 15;

  if (status === 'IN_PROGRESS') {
    return { label: 'Em andamento', className: 'bg-green-600 text-white' };
  }
  if (status === 'COMPLETED') {
    return { label: 'Concluída', className: 'bg-gray-500 text-white' };
  }
  if (status === 'SCHEDULED') {
    if (consultMins >= fiveMinBefore && consultMins < fifteenMinAfter) {
      return { label: 'Aguardando início', className: 'bg-amber-500 text-white' };
    }
    if (consultMins < nowMins) {
      return { label: 'Atrasada', className: 'bg-red-600 text-white' };
    }
    return { label: 'Agendada', className: 'bg-blue-500 text-white' };
  }
  return { label: status, className: 'bg-gray-400 text-white' };
}

interface Consultation {
  id: string;
  scheduledAt: string;
  scheduledDate?: string;
  scheduledTime: string;
  status: string;
  meetingLink?: string;
  meetingStartUrl?: string | null;
  meetingPlatform?: string;
  anamnesis?: string | {
    previousTreatments?: string;
    currentMedications?: string;
    allergies?: string;
    additionalInfo?: string;
  };
  notes?: string;
  prescription?: { issuedAt: string };
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
  const [rescheduleInvitesEnabled, setRescheduleInvitesEnabled] = useState(true);
  const [doctorProfile, setDoctorProfile] = useState<{
    id: string;
    acceptsOnlineBooking: boolean;
    isOnline?: boolean;
  } | null>(null);
  const [updatingOnlineBooking, setUpdatingOnlineBooking] = useState(false);
  const [alertsSoundMuted, setAlertsSoundMuted] = useState(false);
  const [alertsSoundGlobalEnabled, setAlertsSoundGlobalEnabled] = useState(true);
  const [updatingAlertsSound, setUpdatingAlertsSound] = useState(false);
  const [retornosPrevistos, setRetornosPrevistos] = useState<Array<{ id: string; patientName: string; patientId: string; nextReturnDate: string }>>([]);
  const [actionCenterData, setActionCenterData] = useState<ActionCenterData | null>(null);

  const role = session?.user?.role;
  const effectiveDoctorId = doctorProfile?.id ?? (session?.user as { doctorId?: string })?.doctorId;
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
    // Atualizar atividade do médico (heartbeat) a cada 1 minuto — mantém "online" para agendamentos de hoje
    const updateActivity = async () => {
      try {
        const isImpersonating = role === 'ADMIN' && typeof window !== 'undefined' && sessionStorage.getItem('admin_impersonated_doctor_id');
        const body = isImpersonating ? { doctorId: sessionStorage.getItem('admin_impersonated_doctor_id') } : undefined;
        await fetch('/api/doctors/activity', {
          method: 'POST',
          headers: body ? { 'Content-Type': 'application/json' } : undefined,
          body: body ? JSON.stringify(body) : undefined,
        });
      } catch (error) {
        console.error('Erro ao atualizar atividade:', error);
      }
    };

    void updateActivity();
    const interval = setInterval(updateActivity, 60 * 1000);

    return () => clearInterval(interval);
  }, [canAccess, role]);

  const fetchDoctorProfile = () => {
    if (!canAccess) return;
    let url = '/api/doctors/me';
    const isImpersonating = role === 'ADMIN' && typeof window !== 'undefined' && !!sessionStorage.getItem('admin_impersonated_doctor_id');
    if (isImpersonating) url = `/api/doctors/me?doctorId=${sessionStorage.getItem('admin_impersonated_doctor_id')}`;
    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setDoctorProfile({ id: data.id, acceptsOnlineBooking: data.acceptsOnlineBooking === true, isOnline: data.isOnline });
          // Atualizar lastActiveAt imediatamente ao carregar o perfil (para aparecer como online nos agendamentos de hoje)
          const activityBody = isImpersonating && data?.id ? { doctorId: data.id } : undefined;
          fetch('/api/doctors/activity', {
            method: 'POST',
            headers: activityBody ? { 'Content-Type': 'application/json' } : undefined,
            body: activityBody ? JSON.stringify(activityBody) : undefined,
          }).catch(() => {});
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!canAccess) return;
    fetchDoctorProfile();
  }, [canAccess, role]);

  useEffect(() => {
    if (!canAccess) return;
    const interval = setInterval(fetchDoctorProfile, 2 * 60 * 1000);
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
      const idToUse = doctorId ?? effectiveDoctorId;
      const isAdmin = role === 'ADMIN';
      const impersonatedId = typeof window !== 'undefined' ? sessionStorage.getItem('admin_impersonated_doctor_id') : null;
      const isImpersonating = isAdmin && !!impersonatedId;
      const url = isAdmin && !isImpersonating
        ? '/api/admin/consultations?limit=50'
        : `/api/doctors/me/consultations?limit=50${isImpersonating && impersonatedId ? `&doctorId=${impersonatedId}` : ''}`;

      const response = await fetch(url);
      if (response.ok) {
        const consultations = await response.json();
        const filtered = isAdmin && !isImpersonating && idToUse
          ? consultations.filter((c: any) => c.doctorId === idToUse)
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

  const loadAlertsSoundPreference = async () => {
    if (!canAccess) return;
    try {
      let url = '/api/doctors/me/alert-sound';
      const isImpersonating = role === 'ADMIN' && typeof window !== 'undefined' && sessionStorage.getItem('admin_impersonated_doctor_id');
      if (isImpersonating) url += `?doctorId=${sessionStorage.getItem('admin_impersonated_doctor_id')}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAlertsSoundGlobalEnabled(data.globalEnabled === true);
        setAlertsSoundMuted(data.muted === true);
      }
    } catch {
      // silenciar
    }
  };

  const toggleAlertsSound = async () => {
    if (!canAccess || !alertsSoundGlobalEnabled) return;
    setUpdatingAlertsSound(true);
    try {
      let url = '/api/doctors/me/alert-sound';
      const isImpersonating = role === 'ADMIN' && typeof window !== 'undefined' && sessionStorage.getItem('admin_impersonated_doctor_id');
      if (isImpersonating) url += `?doctorId=${sessionStorage.getItem('admin_impersonated_doctor_id')}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ muted: !alertsSoundMuted }),
      });
      if (res.ok) {
        const data = await res.json();
        setAlertsSoundMuted(data.muted === true);
        toast.success(data.muted ? 'Alertas sonoros desativados para você.' : 'Alertas sonoros ativados.');
      } else {
        toast.error('Não foi possível atualizar.');
      }
    } catch {
      toast.error('Erro ao atualizar preferência.');
    } finally {
      setUpdatingAlertsSound(false);
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

  const loadRetornosPrevistos = () => {
    fetch('/api/medico/retornos-previstos?days=15')
      .then((res) => (res.ok ? res.json() : { retornos: [] }))
      .then((data) => setRetornosPrevistos(data.retornos || []))
      .catch(() => setRetornosPrevistos([]));
  };

  useEffect(() => {
    if (!canAccess) return;
    void loadConsultations({ doctorId: effectiveDoctorId, silent: false });
    void loadStats();
    void loadAlertsSoundPreference();
    loadRetornosPrevistos();
    fetch('/api/config/booking-features')
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        if (typeof data?.rescheduleInvitesEnabled === 'boolean') {
          setRescheduleInvitesEnabled(data.rescheduleInvitesEnabled);
        }
      })
      .catch(() => {});

    const interval = setInterval(() => {
      void loadConsultations({ doctorId: effectiveDoctorId, silent: true });
      void loadStats();
      loadRetornosPrevistos();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [canAccess, effectiveDoctorId]);

  const handleStartMeeting = async (consultationId: string) => {
    try {
      // Verificar se já tem reunião criada
      const consultation = [...todayConsultations, ...upcomingConsultations].find(c => c.id === consultationId);
      
      if (consultation?.meetingLink) {
        // Zoom: médico deve abrir meetingStartUrl (host) para a reunião começar; senão o paciente fica "aguardando host"
        window.open(consultation.meetingStartUrl || consultation.meetingLink, '_blank');
      } else {
        // Criar reunião
        toast.loading('Criando reunião...');
        const response = await fetch(`/api/consultations/${consultationId}/meeting`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        if (response.ok) {
          const data = await response.json();
          toast.dismiss();
          toast.success('Reunião criada!');
          // Abrir link
          if (data.meeting?.meetingLink) {
            window.open(data.meeting.meetingStartUrl || data.meeting.meetingLink, '_blank');
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
      {/* Header + Status Online */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Visão geral</h1>
            <p className="text-gray-600 mt-1">Bem-vindo, {session.user.name}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {actionCenterData && (
              <DoctorStatusOnline
                isOnline={actionCenterData.doctorProfile.isOnline}
                acceptsOnlineBooking={actionCenterData.doctorProfile.acceptsOnlineBooking}
                hasActiveAgenda={actionCenterData.doctorProfile.hasActiveAgenda}
              />
            )}
            {refreshing && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                Atualizando…
              </span>
            )}
            {!alertsSoundGlobalEnabled ? (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
                <BellOff size={14} />
                Alertas desativados pelo admin
              </span>
            ) : (
              <button
                type="button"
                onClick={toggleAlertsSound}
                disabled={updatingAlertsSound}
                className={`text-xs px-3 py-1.5 rounded-full border flex items-center gap-1.5 transition-colors ${
                  alertsSoundMuted
                    ? 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                    : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
                }`}
              >
                {alertsSoundMuted ? <BellOff size={14} /> : <Bell size={14} />}
                {alertsSoundMuted ? 'Alertas mutados' : 'Alertas ativos'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ✅ AJUSTE 1 — Central de Ação do Médico (elemento visual dominante) */}
      <div className="mb-8">
        <CentralDeAcaoMedico
          doctorId={effectiveDoctorId}
          onDataLoaded={setActionCenterData}
        />
      </div>

      {/* Contador para o próximo atendimento */}
      <div className="mb-6">
        <NextAppointmentCountdown
          consultations={[...todayConsultations, ...upcomingConsultations]}
          showLink
        />
      </div>

      {/* Consultas de Hoje — status visual padronizado + CTA INICIAR CONSULTA dominante */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
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
            {todayConsultations.map((consultation) => {
              const consultationDate = consultation.scheduledDate || new Date(consultation.scheduledAt).toISOString().split('T')[0];
              const consultationTime = consultation.scheduledTime || new Date(consultation.scheduledAt).toTimeString().slice(0, 5);
              const statusDisplay = getConsultationStatusDisplay(consultation.status, consultationDate, consultationTime);
              return (
              <div
                key={consultation.id}
                className="border-2 border-green-100 rounded-lg p-5 hover:shadow-lg hover:border-green-300 transition-all bg-gradient-to-r from-green-50 to-white"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <User className="text-green-600" size={20} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 text-lg">{consultation.patient.name}</h3>
                        <p className="text-sm text-gray-500 truncate">{consultation.patient.email}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${statusDisplay.className}`}>
                        {statusDisplay.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <Clock size={18} className="text-green-600" />
                        <span className="font-medium">{consultationTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-green-600" />
                        <span className="font-medium">{new Date(consultation.scheduledAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    {consultation.notes?.trim() && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText size={16} className="text-green-600" />
                          <span className="text-sm font-semibold text-gray-700">Observações:</span>
                        </div>
                        <p className="text-xs text-gray-600 bg-white rounded-lg p-3 line-clamp-2">{consultation.notes}</p>
                      </div>
                    )}
                    {consultation.prescription?.issuedAt && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-purple-600" />
                          <span className="text-sm font-semibold text-gray-700">
                            Receita emitida em {new Date(consultation.prescription.issuedAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    )}
                    {(() => {
                      if (!consultation.anamnesis) return null;
                      let anamnesisData: any = null;
                      try {
                        anamnesisData = typeof consultation.anamnesis === 'string'
                          ? JSON.parse(consultation.anamnesis)
                          : consultation.anamnesis;
                      } catch (e) {
                        return null;
                      }
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
                            {anamnesisData.previousTreatments?.trim() && (
                              <div>
                                <strong className="text-gray-700">Tratamentos Anteriores:</strong>
                                <p className="mt-1 text-gray-600 line-clamp-2">{anamnesisData.previousTreatments}</p>
                              </div>
                            )}
                            {anamnesisData.currentMedications?.trim() && (
                              <div>
                                <strong className="text-gray-700">Medicamentos Atuais:</strong>
                                <p className="mt-1 text-gray-600 line-clamp-2">{anamnesisData.currentMedications}</p>
                              </div>
                            )}
                            {anamnesisData.allergies?.trim() && (
                              <div>
                                <strong className="text-gray-700">Alergias:</strong>
                                <p className="mt-1 text-gray-600">{anamnesisData.allergies}</p>
                              </div>
                            )}
                            {anamnesisData.additionalInfo?.trim() && (
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
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    {(() => {
                      const consultationDate = consultation.scheduledDate || new Date(consultation.scheduledAt).toISOString().split('T')[0];
                      const consultationTime = consultation.scheduledTime || new Date(consultation.scheduledAt).toTimeString().slice(0, 5);
                      const consultationDateTime = new Date(`${consultationDate}T${consultationTime}`);
                      const now = new Date();
                      const fiveMinutesBefore = new Date(consultationDateTime.getTime() - 5 * 60 * 1000);
                      const canStart = now >= fiveMinutesBefore && consultation.status === 'SCHEDULED';
                      if (consultation.meetingLink) {
                        return (
                          <Button onClick={() => window.open(consultation.meetingStartUrl || consultation.meetingLink, '_blank')} variant="primary">
                            <Video size={18} /> Entrar na Reunião <ExternalLink size={16} />
                          </Button>
                        );
                      }
                      if (canStart) {
                        return (
                          <Button onClick={() => handleStartMeeting(consultation.id)} variant="primary" className="bg-green-600 hover:bg-green-700">
                            <Video size={18} /> Iniciar consulta
                          </Button>
                        );
                      }
                      if (now < fiveMinutesBefore) {
                        const minutesUntil = Math.max(0, Math.ceil((consultationDateTime.getTime() - now.getTime()) / (60 * 1000)));
                        return (
                          <div className="text-sm text-gray-500 px-4 py-2 bg-gray-100 rounded-lg">
                            Disponível em {minutesUntil} min
                          </div>
                        );
                      }
                      return null;
                    })()}
                    {rescheduleInvitesEnabled && consultation.status === 'SCHEDULED' && (() => {
                      const consultationDate = consultation.scheduledDate || new Date(consultation.scheduledAt).toISOString().split('T')[0];
                      const consultationTime = consultation.scheduledTime || new Date(consultation.scheduledAt).toTimeString().slice(0, 5);
                      const consultationDateTime = new Date(`${consultationDate}T${consultationTime}`);
                      if (consultationDateTime > new Date()) {
                        return (
                          <Button
                            variant="primary"
                            onClick={() => { setSelectedConsultation(consultation); setRescheduleModalOpen(true); }}
                            className="bg-green-600 hover:bg-green-700 text-white border-0"
                          >
                            <ArrowUp size={18} /> Sugerir Adiantamento
                          </Button>
                        );
                      }
                      return null;
                    })()}
                    <Link href={`/medico/consultas/${consultation.id}`}>
                      <Button variant="outline"><FileText size={18} /> Ver Detalhes</Button>
                    </Link>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* KPIs (após Central de Ação) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Consultas Hoje', value: doctorStats.today, icon: Calendar, color: 'bg-green-500' },
          { label: 'Consultas Semana', value: doctorStats.week, icon: Calendar, color: 'bg-blue-500' },
          { label: 'Receitas Emitidas', value: doctorStats.prescriptions, icon: FileText, color: 'bg-purple-500' },
          { label: 'Pacientes Atendidos', value: doctorStats.patientsAttended, icon: User, color: 'bg-teal-500' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200"
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
            </div>
          );
        })}
      </div>

      {/* Retornos previstos */}
      {retornosPrevistos.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-green-500">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
            <CalendarClock className="text-green-600" size={22} />
            Retornos previstos (próximos 15 dias)
          </h2>
          <ul className="space-y-2">
            {retornosPrevistos.slice(0, 10).map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-gray-700">{r.patientName}</span>
                <span className="text-sm text-gray-500">
                  {new Date(r.nextReturnDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <Link
                  href={`/medico/pacientes/${r.patientId}/prontuario`}
                  className="text-sm text-green-700 hover:underline font-medium"
                >
                  Ver prontuário
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Atenção Clínica — pacientes que precisam de atenção */}
      {actionCenterData && (
        <div className="mb-8">
          <AtencaoClinicaBlock
            noReturn30Days={actionCenterData.atencaoClinica.noReturn30Days}
            prescriptionsExpiringSoon={actionCenterData.atencaoClinica.prescriptionsExpiringSoon}
          />
        </div>
      )}

      {/* Disponibilidade para agendamento — destaque, status online e toggle */}
      {doctorProfile && (
      <div className="mb-8">
          <div
            className={`rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
              doctorProfile.acceptsOnlineBooking
                ? 'bg-gradient-to-br from-primary/5 via-white to-primary/10 border-2 border-primary/30'
                : 'bg-white border-2 border-gray-200'
            }`}
          >
            <div className="p-6 sm:p-8">
              {/* Cabeçalho: título + status Online/Offline */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex items-center justify-center w-14 h-14 rounded-xl transition-colors ${
                      doctorProfile.acceptsOnlineBooking ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {doctorProfile.acceptsOnlineBooking ? (
                      <CheckCircle2 size={28} strokeWidth={2} />
                    ) : (
                      <CalendarClock size={28} />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                      Disponibilidade para agendamento
                    </h2>
                    <p className="text-gray-600 text-sm mt-0.5">
                      Atendimentos com 30 min de antecedência quando você estiver online
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                      doctorProfile.acceptsOnlineBooking && doctorProfile.isOnline
                        ? 'bg-primary/15 text-primary border border-primary/30'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        doctorProfile.acceptsOnlineBooking && doctorProfile.isOnline ? 'bg-primary animate-pulse' : 'bg-gray-400'
                      }`}
                    />
                    {doctorProfile.acceptsOnlineBooking && doctorProfile.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Mensagem contextual quando ativo + online */}
              {doctorProfile.acceptsOnlineBooking && doctorProfile.isOnline && (
                <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20 flex items-start gap-3">
                  <CheckCircle2 className="text-primary flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-sm text-gray-800">
                    <strong>Você está disponível.</strong> Pacientes podem agendar consultas para hoje com apenas 30 minutos de antecedência.
                  </p>
                </div>
              )}

              {doctorProfile.acceptsOnlineBooking && !doctorProfile.isOnline && (
                <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <Radio className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-sm text-gray-700">
                    Opção ativa, mas você está <strong>offline</strong>. Permaneça com a plataforma aberta para aparecer como disponível.
                  </p>
                </div>
              )}

              {/* Controles: toggle + link */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={doctorProfile.acceptsOnlineBooking}
                      disabled={updatingOnlineBooking}
                      onClick={async () => {
                        setUpdatingOnlineBooking(true);
                        try {
                          const isImpersonating = role === 'ADMIN' && typeof window !== 'undefined' && sessionStorage.getItem('admin_impersonated_doctor_id');
                          const body: { acceptsOnlineBooking: boolean; doctorId?: string } = {
                            acceptsOnlineBooking: !doctorProfile.acceptsOnlineBooking,
                          };
                          if (isImpersonating && doctorProfile?.id) body.doctorId = doctorProfile.id;
                          const res = await fetch('/api/doctors/me', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(body),
                          });
                          if (res.ok) {
                            setDoctorProfile((p) => p ? { ...p, acceptsOnlineBooking: !p.acceptsOnlineBooking } : null);
                            toast.success(doctorProfile.acceptsOnlineBooking ? 'Desativado.' : 'Ativado. Pacientes podem agendar com 30 min quando você estiver online.');
                          } else {
                            toast.error('Erro ao atualizar.');
                          }
                        } catch {
                          toast.error('Erro ao atualizar.');
                        } finally {
                          setUpdatingOnlineBooking(false);
                        }
                      }}
                      className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        doctorProfile.acceptsOnlineBooking ? 'bg-primary' : 'bg-gray-300'
                      } ${updatingOnlineBooking ? 'opacity-60 pointer-events-none' : ''}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ${
                          doctorProfile.acceptsOnlineBooking ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-base font-medium text-gray-800">
                      Aceitar agendamentos com 30 min (quando online)
                    </span>
                  </label>
                </div>
                <Link
                  href="/medico/disponibilidade"
                  className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                    doctorProfile.acceptsOnlineBooking
                      ? 'bg-primary text-white hover:bg-primary-dark shadow-md'
                      : 'border-2 border-primary text-primary hover:bg-primary hover:text-white'
                  }`}
                >
                  <CalendarClock size={18} />
                  Gerenciar meus horários
                </Link>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Para aparecer como disponível, mantenha esta opção ativa e a plataforma aberta.
              </p>
              <p className="text-xs text-gray-600 mt-2 flex items-center gap-1.5">
                <CalendarClock size={14} className="text-primary flex-shrink-0" />
                Para pacientes agendarem para <strong>hoje</strong>, basta estar online e com esta opção ativa — mesmo sem horário configurado em &quot;Meus Horários&quot; para o dia (atendimento em momento de folga). Ou ter horários do dia e estar online.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Financeiro — ganhos previstos (orientado ao futuro) + resumo */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="text-green-600" size={22} />
            Financeiro
          </h2>
          <span className="text-xs text-gray-500">
            Somente você vê estas informações
          </span>
        </div>
        {actionCenterData && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl border border-green-200 bg-green-50/80 p-4">
              <p className="text-xs font-medium text-gray-600">Ganhos previstos hoje</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                R$ {actionCenterData.earningsPredictedToday.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4">
              <p className="text-xs font-medium text-gray-600">Ganhos previstos semana</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                R$ {actionCenterData.earningsPredictedWeek.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-xl border border-purple-200 bg-purple-50/80 p-4">
              <p className="text-xs font-medium text-gray-600">Ganhos previstos mês</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                R$ {actionCenterData.earningsPredictedMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        )}
        <DoctorFinancialOverview />
      </div>

        {/* Receitas Recentes */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
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
        </div>

        {/* Próximas Consultas */}
        <div className="bg-white rounded-lg shadow-md p-6">
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
                  {upcomingConsultations.map((consultation) => (
                    <tr key={consultation.id} className="hover:bg-gray-50 transition-colors">
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
                          {rescheduleInvitesEnabled && (
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
                          )}
                          <Link href={`/medico/consultas/${consultation.id}`}>
                            <Button variant="outline" size="sm">
                              Ver Detalhes
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

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
              loadConsultations({ doctorId: effectiveDoctorId, silent: true });
            }}
          />
        )}
    </div>
  );
}
