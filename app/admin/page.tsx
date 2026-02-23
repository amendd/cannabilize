'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SkeletonDashboard, SkeletonTable } from '@/components/ui/Skeleton';
import LoadingPage from '@/components/ui/Loading';
import { canAccessAdmin, isAdminOrSuper } from '@/lib/roles-permissions';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const ConsultationsChart = dynamic(
  () => import('@/components/admin/ConsultationsChart'),
  { ssr: false, loading: () => <div className="bg-white rounded-lg shadow-md p-6 h-64 animate-pulse" /> }
);

const FinancialSection = dynamic(
  () => import('@/components/admin/FinancialSection'),
  { ssr: false, loading: () => <div className="bg-white rounded-lg shadow-md p-6 h-48 animate-pulse" /> }
);
import { 
  Calendar, 
  Users, 
  FileText, 
  Shield, 
  CreditCard, 
  BookOpen, 
  Settings,
  Clock,
  Activity,
  IdCard,
  UserCircle,
  UserCog,
  Heart,
  AlertTriangle
} from 'lucide-react';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalConsultations: 0,
    totalPrescriptions: 0,
    totalRevenue: 0,
  });
  const [pending, setPending] = useState({
    consultations: 0,
    prescriptions: 0,
    anvisa: 0,
    patientCards: 0,
  });
  const [health, setHealth] = useState({
    consultationsToday: 0,
    prescriptionsPending: 0,
    regulatoryPending: 0,
    activeDoctors: 0,
    anvisaExpiringSoon: 0,
  });
  const [prescriptionStats, setPrescriptionStats] = useState({
    prescriptionsActive: 0,
    prescriptionsExpiring7: 0,
    prescriptionsExpiring15: 0,
    prescriptionsExpiring30: 0,
    prescriptionsExpired: 0,
    alertsNoConsent: 0,
    alertsDoctorInactive: 0,
  });
  const [consultations, setConsultations] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && !canAccessAdmin(session?.user?.role)) {
      if (session?.user?.role === 'DOCTOR') router.push('/medico');
      else router.push('/');
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.role]);

  const dashboardKey = canAccessAdmin(session?.user?.role) ? '/api/admin/dashboard' : null;
  const { data: dashboardData, error: dashboardError, isLoading: dashboardLoading } = useSWR(
    dashboardKey,
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 60000 }
  );

  useEffect(() => {
    if (!dashboardKey) {
      setLoading(false);
      return;
    }
    if (dashboardError || (dashboardData && dashboardData.error)) {
      setLoading(false);
      return;
    }
    if (!dashboardData) {
      setLoading(dashboardLoading);
      return;
    }
    const { stats: statsData, pending: pendingData, health: healthData, consultations: consultationsData } = dashboardData;
    setStats(statsData ?? {});
    setPending(pendingData ?? {});
    setHealth(healthData ?? {});
    setConsultations(Array.isArray(consultationsData) ? consultationsData : []);
    setPrescriptionStats({
      prescriptionsActive: statsData?.prescriptionsActive ?? 0,
      prescriptionsExpiring7: statsData?.prescriptionsExpiring7 ?? 0,
      prescriptionsExpiring15: statsData?.prescriptionsExpiring15 ?? 0,
      prescriptionsExpiring30: statsData?.prescriptionsExpiring30 ?? 0,
      prescriptionsExpired: statsData?.prescriptionsExpired ?? 0,
      alertsNoConsent: statsData?.alertsNoConsent ?? 0,
      alertsDoctorInactive: statsData?.alertsDoctorInactive ?? 0,
    });
    setLoading(false);
  }, [dashboardKey, dashboardData, dashboardLoading]);

  if (dashboardError) console.error('Erro ao carregar dados:', dashboardError);

  if (status === 'loading') {
    return <LoadingPage />;
  }

  if (!session || !canAccessAdmin(session.user?.role)) {
    return null;
  }

  const isAdmin = isAdminOrSuper(session.user?.role);

  // Status de consulta em português para a tabela
  const statusLabel: Record<string, string> = {
    COMPLETED: 'Concluída',
    SCHEDULED: 'Agendada',
    CANCELLED: 'Cancelada',
    CONFIRMED: 'Confirmada',
    NO_SHOW: 'Não compareceu',
    RESCHEDULED: 'Reagendada',
  };
  const getStatusLabel = (status: string) => statusLabel[status] || status;

  // Acesso Rápido enxuto: 8 atalhos mais usados (sem duplicar menu)
  const quickActions = [
    { icon: FileText, label: 'Receitas', href: '/admin/receitas', color: 'bg-purple-100 text-purple-600' },
    { icon: Calendar, label: 'Consultas', href: '/admin/consultas', color: 'bg-blue-100 text-blue-600' },
    { icon: UserCircle, label: 'Pacientes', href: '/admin/pacientes', color: 'bg-rose-100 text-rose-600' },
    { icon: Shield, label: 'ANVISA', href: '/admin/anvisa', color: 'bg-yellow-100 text-yellow-600' },
    { icon: CreditCard, label: 'Pagamentos', href: '/admin/pagamentos', color: 'bg-indigo-100 text-indigo-600' },
    { icon: UserCog, label: 'Usuários', href: '/admin/usuarios', color: 'bg-slate-100 text-slate-600' },
    { icon: Settings, label: 'Configurações', href: '/admin/configuracoes', color: 'bg-gray-100 text-gray-600' },
    { icon: BookOpen, label: 'Blog', href: '/admin/blog', color: 'bg-green-100 text-green-600' },
  ].filter(a => a.href !== '/admin/usuarios' || isAdmin);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 font-display">Dashboard Administrativo</h1>
        <p className="text-gray-600 mt-2">Bem-vindo, {session.user.name}</p>
      </div>

      {/* Resumo do dia — o que está acontecendo + CTA principal */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Heart size={20} className="text-rose-500" />
            Resumo do dia
          </h2>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                <Link href="/admin/consultas" className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-primary hover:shadow-sm transition-all flex items-center gap-3">
                  <div className="bg-primary p-2.5 rounded-lg flex-shrink-0">
                    <Calendar size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{health.consultationsToday ?? 0}</p>
                    <p className="text-xs text-gray-600 font-medium">Consultas hoje</p>
                  </div>
                </Link>
                <Link href="/admin/receitas?status=pending" className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-amber-400 hover:shadow-sm transition-all flex items-center gap-3">
                  <div className="bg-amber-500 p-2.5 rounded-lg flex-shrink-0">
                    <FileText size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{pending.prescriptions ?? health.prescriptionsPending ?? 0}</p>
                    <p className="text-xs text-gray-600 font-medium">Receitas pendentes</p>
                  </div>
                </Link>
                <Link href="/admin/anvisa" className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-slate-400 hover:shadow-sm transition-all flex items-center gap-3">
                  <div className="bg-slate-600 p-2.5 rounded-lg flex-shrink-0">
                    <Shield size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{health.regulatoryPending ?? pending.anvisa ?? 0}</p>
                    <p className="text-xs text-gray-600 font-medium">Pendências ANVISA</p>
                  </div>
                </Link>
                <div className={`rounded-lg p-4 border flex items-center gap-3 ${(health.anvisaExpiringSoon ?? 0) > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className={`p-2.5 rounded-lg flex-shrink-0 ${(health.anvisaExpiringSoon ?? 0) > 0 ? 'bg-red-500' : 'bg-gray-400'}`}>
                    <AlertTriangle size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{health.anvisaExpiringSoon ?? 0}</p>
                    <p className="text-xs text-gray-600 font-medium">Alertas vencendo</p>
                  </div>
                </div>
              </div>
              {/* CTA principal — proativo */}
              {(pending.prescriptions > 0 || (health.prescriptionsPending ?? 0) > 0) ? (
                <Link
                  href="/admin/receitas?status=pending"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary-dark transition-colors shadow-sm"
                >
                  <FileText size={18} />
                  Emitir {pending.prescriptions || health.prescriptionsPending || 0} receita(s) pendente(s)
                </Link>
              ) : (health.consultationsToday ?? 0) > 0 ? (
                <Link
                  href="/admin/consultas"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary-dark transition-colors shadow-sm"
                >
                  <Calendar size={18} />
                  Ver {health.consultationsToday} consulta(s) de hoje
                </Link>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* Ações pendentes — sem duplicar receitas (já no Resumo do dia) */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock size={20} className="text-blue-600" />
          Ações pendentes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/consultas?status=SCHEDULED"
            className="bg-white rounded-lg shadow-sm p-5 border-2 border-blue-200 hover:border-blue-400 hover:shadow-md transition-all flex items-center gap-4"
            aria-label={`${pending.consultations} consultas agendadas`}
          >
            <div className="bg-blue-500 p-3 rounded-lg flex-shrink-0">
              <Calendar size={24} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pending.consultations}</p>
              <p className="text-sm text-gray-600 font-medium">Consultas agendadas</p>
            </div>
          </Link>
          <Link
            href="/admin/anvisa?status=PENDING"
            className="bg-white rounded-lg shadow-sm p-5 border border-gray-200 hover:border-amber-400 hover:shadow-md transition-all flex items-center gap-4"
            aria-label={`${pending.anvisa} autorizações ANVISA pendentes`}
          >
            <div className="bg-amber-500 p-3 rounded-lg flex-shrink-0">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pending.anvisa}</p>
              <p className="text-sm text-gray-600 font-medium">Autorizações ANVISA</p>
            </div>
          </Link>
          <Link
            href="/admin/carteirinhas?approvalStatus=PENDING"
            className="bg-white rounded-lg shadow-sm p-5 border border-gray-200 hover:border-emerald-400 hover:shadow-md transition-all flex items-center gap-4"
            aria-label={`${pending.patientCards} carteirinhas pendentes`}
          >
            <div className="bg-emerald-500 p-3 rounded-lg flex-shrink-0">
              <IdCard size={24} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pending.patientCards}</p>
              <p className="text-sm text-gray-600 font-medium">Carteirinhas pendentes</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Prescrições e validade — hierarquia visual (7 dias em destaque) */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText size={20} className="text-purple-600" />
          Prescrições e validade
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          <Link href="/admin/receitas" className="bg-white rounded-lg shadow-sm p-4 border border-slate-200 hover:border-purple-300 flex flex-col gap-1">
            <p className="text-2xl font-bold text-gray-900">{prescriptionStats.prescriptionsActive}</p>
            <p className="text-xs text-gray-600 font-medium">Prescrições ativas</p>
          </Link>
          <Link href="/admin/receitas?expiring=7" className="bg-amber-50 rounded-lg shadow-sm p-4 border-2 border-amber-300 flex flex-col gap-1">
            <p className="text-2xl font-bold text-amber-800">{prescriptionStats.prescriptionsExpiring7}</p>
            <p className="text-xs text-amber-700 font-medium">Vencendo em 7 dias</p>
          </Link>
          <Link href="/admin/receitas?expiring=15" className="bg-amber-50 rounded-lg shadow-sm p-4 border border-amber-200 flex flex-col gap-1">
            <p className="text-2xl font-bold text-amber-800">{prescriptionStats.prescriptionsExpiring15}</p>
            <p className="text-xs text-amber-700 font-medium">Vencendo em 15 dias</p>
          </Link>
          <Link href="/admin/receitas?expiring=30" className="bg-amber-50 rounded-lg shadow-sm p-4 border border-amber-200 flex flex-col gap-1">
            <p className="text-2xl font-bold text-amber-800">{prescriptionStats.prescriptionsExpiring30}</p>
            <p className="text-xs text-amber-700 font-medium">Vencendo em 30 dias</p>
          </Link>
          <Link href="/admin/receitas?status=expired" className="bg-red-50 rounded-lg shadow-sm p-4 border border-red-200 flex flex-col gap-1">
            <p className="text-2xl font-bold text-red-800">{prescriptionStats.prescriptionsExpired}</p>
            <p className="text-xs text-red-700 font-medium">Vencidas</p>
          </Link>
          <Link href="/admin/compliance" className={`rounded-lg shadow-sm p-4 border flex flex-col gap-1 ${prescriptionStats.alertsNoConsent > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
            <p className="text-2xl font-bold text-gray-900">{prescriptionStats.alertsNoConsent}</p>
            <p className="text-xs text-gray-600 font-medium">Sem consentimento LGPD</p>
          </Link>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200 flex flex-col gap-1">
            <p className="text-2xl font-bold text-gray-900">{prescriptionStats.alertsDoctorInactive}</p>
            <p className="text-xs text-gray-600 font-medium">Médicos inativos</p>
          </div>
        </div>
      </div>

      {/* Métricas Principais — período explícito (Este mês) */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-900">Métricas principais</h2>
            <span className="text-sm text-gray-500">(Este mês)</span>
          </div>
          {isAdmin && (
            <Link
              href="/admin/metricas"
              className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1"
            >
              <Activity size={16} />
              Ver métricas completas
            </Link>
          )}
        </div>
        {loading ? (
          <SkeletonDashboard />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Pacientes', sub: 'Este mês', value: stats.totalPatients, icon: Users, color: 'bg-blue-500' },
              { label: 'Consultas', sub: 'Este mês', value: stats.totalConsultations, icon: Calendar, color: 'bg-green-500' },
              { label: 'Receitas', sub: 'Este mês', value: stats.totalPrescriptions, icon: FileText, color: 'bg-purple-500' },
              { label: 'Receita total', sub: 'Este mês', value: `R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: CreditCard, color: 'bg-yellow-500' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">{stat.label} <span className="text-gray-400 font-normal">{stat.sub}</span></p>
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
        )}
      </div>

      {/* Acesso Rápido — 8 atalhos, sem duplicar menu */}
      {isAdmin && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Acesso rápido</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:border-primary hover:shadow-md transition-all flex items-center gap-3 group"
                >
                  <div className={`${action.color} p-2 rounded-lg flex-shrink-0`}>
                    <Icon size={18} />
                  </div>
                  <span className="font-medium text-gray-900 text-sm truncate">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Análise Financeira */}
      {isAdmin && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard size={24} className="text-green-600" />
            Análise Financeira
          </h2>
          <FinancialSection />
        </div>
      )}

      {/* Gráficos e Análises */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity size={24} className="text-green-600" />
          Análises e Gráficos
        </h2>
        <ConsultationsChart />
      </div>

      {/* Consultas Recentes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 font-display">Consultas Recentes</h2>
          <Link
            href="/admin/consultas"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Ver todas →
          </Link>
        </div>
        {loading ? (
          <SkeletonTable />
        ) : consultations.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhuma consulta recente</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Paciente</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Data</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {consultations.map((consultation) => (
                  <tr
                    key={consultation.id}
                    className="border-b hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="py-3 px-4">
                      <span>{consultation.patient?.name || 'N/A'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span>{new Date(consultation.scheduledAt).toLocaleDateString('pt-BR')}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        consultation.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        consultation.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                        consultation.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getStatusLabel(consultation.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/consultas/${consultation.id}`}
                        className="text-primary hover:underline text-sm transition-colors"
                      >
                        Ver detalhes
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
