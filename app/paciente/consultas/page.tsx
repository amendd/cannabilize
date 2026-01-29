'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, FileText, Download, Video } from 'lucide-react';
import { useEffectivePatientId } from '@/components/impersonation/useEffectivePatientId';
import RescheduleInviteCard from '@/components/patient/RescheduleInviteCard';

export default function PacienteConsultasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { effectivePatientId, loading: loadingPatientId } = useEffectivePatientId();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleInvites, setRescheduleInvites] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (effectivePatientId && !loadingPatientId) {
      fetch(`/api/consultations?patientId=${effectivePatientId}`)
        .then(res => res.json())
        .then(data => {
          setConsultations(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });

      // Carregar convites de remarcação
      const invitesUrl = effectivePatientId 
        ? `/api/patient/reschedule-invites?patientId=${effectivePatientId}`
        : '/api/patient/reschedule-invites';
      
      fetch(invitesUrl)
        .then(res => {
          if (!res.ok) {
            return res.json().then(err => {
              console.error('Erro da API:', err);
              throw new Error(err.error || `HTTP error! status: ${res.status}`);
            });
          }
          return res.json();
        })
        .then(data => {
          console.log('Convites carregados:', data);
          setRescheduleInvites(data.invites || []);
        })
        .catch(err => {
          console.error('Erro ao carregar convites:', err);
          setRescheduleInvites([]);
        });
    }
  }, [effectivePatientId, loadingPatientId]);

  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/paciente" className="text-primary hover:underline mb-4 inline-block">
            ← Voltar
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Minhas Consultas</h1>
        </div>

        {/* Convites de Remarcação */}
        {rescheduleInvites.length > 0 && (
          <div className="mb-6 space-y-4">
            {rescheduleInvites.map((invite) => (
              <RescheduleInviteCard
                key={invite.id}
                invite={invite}
                onRespond={() => {
                  // Recarregar convites e consultas
                  fetch('/api/patient/reschedule-invites')
                    .then(res => res.json())
                    .then(data => {
                      setRescheduleInvites(data.invites || []);
                    });
                  fetch(`/api/consultations?patientId=${effectivePatientId}`)
                    .then(res => res.json())
                    .then(data => {
                      setConsultations(data);
                    });
                }}
              />
            ))}
          </div>
        )}

        <div className="space-y-4">
          {consultations.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600 mb-4">Você ainda não possui consultas agendadas.</p>
              <Link
                href="/agendamento"
                className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition"
              >
                Agendar Consulta
              </Link>
            </div>
          ) : (
            consultations.map((consultation) => (
              <div key={consultation.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar size={20} className="text-primary" />
                      <h3 className="text-xl font-semibold text-gray-900">
                        Consulta #{consultation.id.slice(0, 8)}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock size={16} />
                        {new Date(consultation.scheduledAt).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(consultation.scheduledAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      consultation.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : consultation.status === 'SCHEDULED'
                        ? 'bg-blue-100 text-blue-800'
                        : consultation.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {consultation.status}
                  </span>
                </div>

                {consultation.meetingLink && (
                  <div className="mb-4">
                    <a
                      href={consultation.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:underline"
                    >
                      <Video size={18} />
                      Acessar consulta online
                    </a>
                  </div>
                )}

                {consultation.prescription && (
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText size={20} className="text-green-600" />
                        <span className="text-gray-700">Receita emitida</span>
                      </div>
                      {consultation.prescription.pdfUrl && (
                        <a
                          href={consultation.prescription.pdfUrl}
                          target="_blank"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <Download size={18} />
                          Baixar PDF
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {consultation.payment && consultation.payment.status === 'PENDING' && (
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Pagamento pendente</span>
                      <Link
                        href={`/paciente/pagamentos/${consultation.payment.id}`}
                        className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition text-sm"
                      >
                        Pagar agora
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
