'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, FileText, Download, Video, Search } from 'lucide-react';
import { useEffectivePatientId } from '@/components/impersonation/useEffectivePatientId';
import RescheduleInviteCard from '@/components/patient/RescheduleInviteCard';
import EmptyState from '@/components/patient/EmptyState';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { SkeletonPatientList } from '@/components/ui/Skeleton';
import { getConsultationStatusLabel } from '@/lib/status-labels';
import { getConsultationActionButton } from '@/lib/patient-treatment-status';

type FilterStatus = 'ALL' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export default function PacienteConsultasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { effectivePatientId, loading: loadingPatientId } = useEffectivePatientId();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rescheduleInvites, setRescheduleInvites] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (effectivePatientId && !loadingPatientId) {
      fetch(`/api/consultations?patientId=${effectivePatientId}&limit=100`)
        .then((res) => res.json())
        .then((data) => {
          const list = data.consultations ?? data ?? [];
          setConsultations(list);
          setNextCursor(data.nextCursor ?? null);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });

      const invitesUrl = effectivePatientId 
        ? `/api/patient/reschedule-invites?patientId=${effectivePatientId}`
        : '/api/patient/reschedule-invites';
      
      fetch(invitesUrl)
        .then(res => {
          if (!res.ok) return res.json().then(() => ({ invites: [] }));
          return res.json();
        })
        .then(data => setRescheduleInvites(data.invites || []))
        .catch(() => setRescheduleInvites([]));
    }
  }, [effectivePatientId, loadingPatientId]);

  const filteredConsultations = useMemo(() => {
    let list = consultations;
    if (filterStatus !== 'ALL') {
      list = list.filter(c => c.status === filterStatus);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(c => {
        const doctorName = c.doctor?.name?.toLowerCase() ?? '';
        const dateStr = new Date(c.scheduledAt).toLocaleDateString('pt-BR');
        return doctorName.includes(term) || dateStr.includes(term);
      });
    }
    return list.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  }, [consultations, filterStatus, searchTerm]);

  const now = new Date();
  const nextConsultationId = useMemo(() => {
    const upcoming = consultations
      .filter((c: any) => new Date(c.scheduledAt) > now && c.status === 'SCHEDULED')
      .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    return upcoming.length > 0 ? upcoming[0].id : null;
  }, [consultations]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs baseHref="/paciente" items={[{ label: 'Minhas Consultas' }]} />
        <SkeletonPatientList count={6} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs baseHref="/paciente" items={[{ label: 'Minhas Consultas' }]} />
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Consultas</h1>
      <p className="text-gray-600 mb-6">Acompanhe suas consultas e acesse a sala quando for o horário</p>

      {rescheduleInvites.length > 0 && (
        <div className="mb-6 space-y-4">
          {rescheduleInvites.map((invite) => (
            <RescheduleInviteCard
              key={invite.id}
              invite={invite}
              onRespond={() => {
                const dashboardUrl = effectivePatientId
                  ? `/api/patient/dashboard?patientId=${effectivePatientId}`
                  : '/api/patient/dashboard';
                fetch(dashboardUrl)
                  .then((res) => res.json())
                  .then((data) => {
                    if (data.consultations) {
                      setConsultations(data.consultations);
                      setNextCursor(null);
                    }
                    if (data.invites) setRescheduleInvites(data.invites);
                  });
              }}
            />
          ))}
        </div>
      )}

      {/* Filtros e busca */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por médico ou data..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['ALL', 'SCHEDULED', 'COMPLETED', 'CANCELLED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filterStatus === f
                  ? 'bg-purple-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-purple-50'
              }`}
            >
              {f === 'ALL' ? 'Todas' : getConsultationStatusLabel(f)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredConsultations.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title={consultations.length === 0 ? 'Estamos prontos quando você estiver' : 'Nenhum resultado com esses filtros'}
            description={consultations.length === 0 
              ? 'Quando quiser começar seu acompanhamento, agende uma consulta. Nossa equipe está aqui para cuidar de você.'
              : 'Tente alterar os filtros ou o termo de busca.'}
            actionLabel={consultations.length === 0 ? 'Começar meu tratamento' : undefined}
            actionHref={consultations.length === 0 ? '/agendar' : undefined}
          />
        ) : (
          filteredConsultations.map((consultation) => {
            const action = getConsultationActionButton(consultation);
            const isNext = consultation.id === nextConsultationId;
            return (
            <div
              key={consultation.id}
              className={`bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition ${isNext ? 'ring-2 ring-purple-400 ring-offset-2' : ''}`}
            >
              {isNext && (
                <div className="mb-4 px-3 py-1.5 rounded-lg bg-purple-100 text-purple-800 text-sm font-semibold inline-block">
                  Próxima consulta
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={20} className="text-purple-600" />
                    <h3 className="text-xl font-semibold text-gray-900">
                      {formatDate(consultation.scheduledAt)} às {formatTime(consultation.scheduledAt)}
                    </h3>
                  </div>
                  {consultation.doctor && (
                    <p className="text-sm text-gray-600 mb-2">Dr(a). {consultation.doctor.name}</p>
                  )}
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      consultation.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : consultation.status === 'SCHEDULED'
                        ? 'bg-blue-100 text-blue-800'
                        : consultation.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {getConsultationStatusLabel(consultation.status)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {action.href.startsWith('http') ? (
                    <a
                      href={action.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                    >
                      <Video size={18} />
                      {action.label}
                    </a>
                  ) : (
                    <Link
                      href={action.href}
                      className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                    >
                      {action.label === 'Ver receita' ? <FileText size={18} /> : <Video size={18} />}
                      {action.label}
                    </Link>
                  )}
                  <Link
                    href={`/paciente/consultas/${consultation.id}`}
                    className="inline-flex items-center gap-2 border border-purple-600 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition text-sm"
                  >
                    Ver detalhes
                  </Link>
                </div>
              </div>

              {consultation.prescription && (
                <div className="border-t mt-4 pt-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText size={20} className="text-green-600" />
                    <span className="text-gray-700">Receita emitida</span>
                  </div>
                  {consultation.prescription.pdfUrl && (
                    <a
                      href={consultation.prescription.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-purple-600 hover:underline text-sm"
                    >
                      <Download size={18} />
                      Baixar PDF
                    </a>
                  )}
                </div>
              )}

              {consultation.payment && consultation.payment.status === 'PENDING' && (
                <div className="border-t mt-4 pt-4 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-gray-700">Pagamento pendente</span>
                  <Link
                    href={`/paciente/pagamentos/${consultation.payment.id}`}
                    className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition text-sm font-medium"
                  >
                    Pagar agora
                  </Link>
                </div>
              )}
            </div>
            );
          })
        )}

        {nextCursor && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                if (!effectivePatientId || loadingMore) return;
                setLoadingMore(true);
                fetch(
                  `/api/consultations?patientId=${effectivePatientId}&limit=50&cursor=${encodeURIComponent(nextCursor)}`
                )
                  .then((res) => res.json())
                  .then((data) => {
                    const list = data.consultations ?? [];
                    setConsultations((prev) => [...prev, ...list]);
                    setNextCursor(data.nextCursor ?? null);
                  })
                  .finally(() => setLoadingMore(false));
              }}
              disabled={loadingMore}
              className="px-6 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition text-sm font-medium disabled:opacity-50"
            >
              {loadingMore ? 'Carregando...' : 'Carregar mais'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
