'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, FileText, User, Clock, Video, Target, RotateCcw } from 'lucide-react';
import { useEffectivePatientId } from '@/components/impersonation/useEffectivePatientId';
import RescheduleInviteCard from '@/components/patient/RescheduleInviteCard';
import EmptyState from '@/components/patient/EmptyState';
import TreatmentStatusHero from '@/components/patient/TreatmentStatusHero';
import WhatToDoNow from '@/components/patient/WhatToDoNow';
import InstitutionalMessage from '@/components/patient/InstitutionalMessage';
import { SkeletonPatientDashboard } from '@/components/ui/Skeleton';
import { getConsultationStatusLabel } from '@/lib/status-labels';
import {
  getCurrentTreatmentPhase,
  getPrimaryNextStep,
  getConsultationActionButton,
} from '@/lib/patient-treatment-status';

export default function PacienteDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { effectivePatientId, loading: loadingPatientId } = useEffectivePatientId();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [nextConsultation, setNextConsultation] = useState<any>(null);
  const [lastReturnDate, setLastReturnDate] = useState<any>(null);
  const [rescheduleInvites, setRescheduleInvites] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
  }, [status, router]);

  const dashboardUrl =
    (effectivePatientId || session?.user?.id) && !loadingPatientId
      ? effectivePatientId
        ? `/api/patient/dashboard?patientId=${effectivePatientId}`
        : '/api/patient/dashboard'
      : null;

  const { data: dashboardData, isLoading: dashboardLoading } = useSWR(
    dashboardUrl,
    (url: string) => fetch(url).then((r) => r.json()),
    { revalidateOnFocus: true, dedupingInterval: 30000 }
  );

  useEffect(() => {
    if (!dashboardUrl) return;
    if (!dashboardData || dashboardData.error) {
      if (dashboardData?.error) {
        setConsultations([]);
        setRescheduleInvites([]);
        setNextConsultation(null);
        setLastReturnDate(null);
      }
      return;
    }
    const consultationsData = dashboardData.consultations ?? [];
    const invitesData = dashboardData.invites ?? [];

    setConsultations(consultationsData);
    setRescheduleInvites(invitesData);

    const now = new Date();
    const upcoming = consultationsData
      .filter((c: any) => {
        const d = new Date(c.scheduledAt);
        return d > now && c.status === 'SCHEDULED';
      })
      .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    setNextConsultation(upcoming.length > 0 ? upcoming[0] : null);

    const completed = consultationsData
      .filter((c: any) => c.status === 'COMPLETED' && c.nextReturnDate)
      .sort((a: any, b: any) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
    setLastReturnDate(completed.length > 0 ? completed[0] : null);
  }, [dashboardUrl, dashboardData]);

  if (status === 'loading' || loadingPatientId || (dashboardUrl && dashboardLoading && !dashboardData)) {
    return <SkeletonPatientDashboard />;
  }

  if (!session) return null;

  const pendingPayments = consultations.filter((c: any) => c.payment?.status === 'PENDING').length;
  const primaryNextStep = getPrimaryNextStep(
    consultations,
    nextConsultation,
    pendingPayments,
    true
  );

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
      {/* 1. STATUS DO TRATAMENTO — Hero dominante */}
      <div className="mb-8">
        <TreatmentStatusHero
          consultations={consultations}
          nextConsultation={nextConsultation}
          pendingPaymentsCount={pendingPayments}
          userHasCompleteProfile={true}
          patientName={session.user?.name ?? undefined}
        />
      </div>

      {/* 2. O QUE VOCÊ PRECISA FAZER AGORA — Uma ação prioritária */}
      <div className="mb-8">
        <WhatToDoNow action={primaryNextStep} />
      </div>

      {/* Mensagem institucional — acompanhamento */}
      <div className="mb-8">
        <InstitutionalMessage index={0} />
      </div>

      {/* Convites de remarcação */}
      {rescheduleInvites.length > 0 && (
        <div className="mb-8 space-y-4">
          {rescheduleInvites.map((invite) => (
            <RescheduleInviteCard
              key={invite.id}
              invite={invite}
              onRespond={() => {
                const url = effectivePatientId
                  ? `/api/patient/dashboard?patientId=${effectivePatientId}`
                  : '/api/patient/dashboard';
                fetch(url)
                  .then((res) => res.json())
                  .then((data) => {
                    if (data.error) return;
                    setConsultations(data.consultations ?? []);
                    setRescheduleInvites(data.invites ?? []);
                    const now = new Date();
                    const upcoming = (data.consultations ?? []).filter(
                      (c: any) => new Date(c.scheduledAt) > now && c.status === 'SCHEDULED'
                    ).sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
                    setNextConsultation(upcoming.length > 0 ? upcoming[0] : null);
                  });
              }}
            />
          ))}
        </div>
      )}

      {/* Próxima consulta — destaque com botão dinâmico */}
      {nextConsultation && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center gap-3 mb-6">
              <Target size={32} />
              <h2 className="text-2xl font-bold">Próxima consulta</h2>
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
                      {nextConsultation.doctor.crm && ` — CRM ${nextConsultation.doctor.crm}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-4">
              {(() => {
                const action = getConsultationActionButton(nextConsultation);
                if (action.href.startsWith('http')) {
                  return (
                    <a
                      href={action.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center gap-2"
                    >
                      <Video size={20} />
                      {action.label}
                    </a>
                  );
                }
                return (
                  <Link
                    href={action.href}
                    className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center gap-2"
                  >
                    {action.label === 'Ver receita' ? <FileText size={20} /> : <Video size={20} />}
                    {action.label}
                  </Link>
                );
              })()}
              <Link
                href={`/paciente/consultas/${nextConsultation.id}`}
                className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition flex items-center gap-2 border border-white/30"
              >
                Ver detalhes
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Retorno recomendado */}
      {lastReturnDate?.nextReturnDate && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center gap-3 mb-6">
              <RotateCcw size={32} />
              <h2 className="text-2xl font-bold">Seu retorno</h2>
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
                      {lastReturnDate.doctor.crm && ` — CRM ${lastReturnDate.doctor.crm}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <Link
              href={`/paciente/consultas/${lastReturnDate.id}`}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition border border-white/30"
            >
              Ver detalhes
            </Link>
          </div>
        </div>
      )}

      {/* Histórico de consultas */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Histórico de consultas</h2>
          <Link
            href="/paciente/consultas"
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Ver todas →
          </Link>
        </div>
        {consultations.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Estamos prontos quando você estiver"
            description="Quando quiser começar seu acompanhamento, agende uma consulta. Nossa equipe está aqui para cuidar de você."
            actionLabel="Começar meu tratamento"
            actionHref="/agendar"
          />
        ) : (
          <div className="space-y-4">
            {consultations.slice(0, 5).map((consultation: any) => (
              <Link
                key={consultation.id}
                href={`/paciente/consultas/${consultation.id}`}
                className="block border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-purple-200 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {formatDate(consultation.scheduledAt)} às {formatTime(consultation.scheduledAt)}
                    </p>
                    {consultation.doctor && (
                      <p className="text-sm text-gray-600">Dr(a). {consultation.doctor.name}</p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      consultation.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : consultation.status === 'SCHEDULED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {getConsultationStatusLabel(consultation.status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Resumo do perfil — médico, status, próxima consulta */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Seu resumo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Nome</p>
            <p className="text-gray-900 font-medium">{session.user?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">E-mail</p>
            <p className="text-gray-900 font-medium">{session.user?.email}</p>
          </div>
          {nextConsultation?.doctor && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Médico responsável (próxima consulta)</p>
              <p className="text-gray-900 font-medium">Dr(a). {nextConsultation.doctor.name}</p>
            </div>
          )}
          {nextConsultation && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Próxima consulta</p>
              <p className="text-gray-900 font-medium">
                {formatDate(nextConsultation.scheduledAt)} às {formatTime(nextConsultation.scheduledAt)}
              </p>
            </div>
          )}
        </div>
        <Link
          href="/paciente/perfil"
          className="mt-4 inline-block text-purple-600 hover:text-purple-700 font-medium text-sm"
        >
          Ver perfil completo →
        </Link>
      </div>
    </div>
  );
}
