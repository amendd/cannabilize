'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SkeletonDashboard, SkeletonTable } from '@/components/ui/Skeleton';
import LoadingPage from '@/components/ui/Loading';
import ConsultationsChart from '@/components/admin/ConsultationsChart';
import FinancialSection from '@/components/admin/FinancialSection';
import { 
  Calendar, 
  Users, 
  FileText, 
  Pill, 
  Shield, 
  CreditCard, 
  BookOpen, 
  Image, 
  Star, 
  Video, 
  Settings,
  Clock,
  Activity,
  IdCard,
  Mail,
  UserCircle,
  UserCog
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
  const [consultations, setConsultations] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user.role !== 'ADMIN' && session?.user.role !== 'DOCTOR') {
      router.push('/');
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.role]);

  useEffect(() => {
    if (session?.user.role === 'ADMIN' || session?.user.role === 'DOCTOR') {
      setLoading(true);
      Promise.all([
        fetch('/api/admin/stats').then(res => res.json()),
        fetch('/api/admin/pending').then(res => res.json()),
        fetch('/api/admin/consultations?limit=15').then(res => res.json()),
      ])
        .then(([statsData, pendingData, consultationsData]) => {
          setStats(statsData);
          setPending(pendingData);
          setConsultations(consultationsData);
        })
        .catch(err => console.error('Erro ao carregar dados:', err))
        .finally(() => setLoading(false));
    }
  }, [session]);

  if (status === 'loading') {
    return <LoadingPage />;
  }

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'DOCTOR')) {
    return null;
  }

  const isAdmin = session.user.role === 'ADMIN';

  const quickActions = [
    { icon: Calendar, label: 'Consultas', href: '/admin/consultas', desc: 'Gerenciar agendamentos', color: 'bg-blue-100 text-blue-600' },
    { icon: FileText, label: 'Receitas', href: '/admin/receitas', desc: 'Gerenciar receitas médicas', color: 'bg-purple-100 text-purple-600' },
    { icon: UserCircle, label: 'Pacientes', href: '/admin/pacientes', desc: 'Gerenciar pacientes', color: 'bg-rose-100 text-rose-600' },
    { icon: Users, label: 'Médicos', href: '/admin/medicos', desc: 'Gerenciar médicos', color: 'bg-teal-100 text-teal-600' },
    { icon: UserCog, label: 'Usuários', href: '/admin/usuarios', desc: 'Criar, editar e definir acessos', color: 'bg-slate-100 text-slate-600' },
    { icon: Pill, label: 'Medicamentos', href: '/admin/medicamentos', desc: 'Gerenciar medicamentos', color: 'bg-pink-100 text-pink-600' },
    { icon: Shield, label: 'ANVISA', href: '/admin/anvisa', desc: 'Autorizações', color: 'bg-yellow-100 text-yellow-600' },
    { icon: CreditCard, label: 'Pagamentos', href: '/admin/pagamentos', desc: 'Métodos e integrações', color: 'bg-indigo-100 text-indigo-600' },
    { icon: IdCard, label: 'Carteirinhas', href: '/admin/carteirinhas', desc: 'Aprovar carteirinhas', color: 'bg-emerald-100 text-emerald-600' },
    { icon: BookOpen, label: 'Blog', href: '/admin/blog', desc: 'Gerenciar posts', color: 'bg-green-100 text-green-600' },
    { icon: Image, label: 'Galeria', href: '/admin/galeria', desc: 'Gerenciar eventos', color: 'bg-purple-100 text-purple-600' },
    { icon: Star, label: 'Artigos Destaque', href: '/admin/artigos-destaque', desc: 'Gerenciar destaques', color: 'bg-orange-100 text-orange-600' },
    { icon: Video, label: 'Telemedicina', href: '/admin/telemedicina', desc: 'Zoom e Google Meet', color: 'bg-cyan-100 text-cyan-600' },
    { icon: Mail, label: 'Integrações de Email', href: '/admin/email', desc: 'Gerenciar email', color: 'bg-red-100 text-red-600' },
    { icon: Shield, label: 'Segurança', href: '/admin/seguranca', desc: 'reCAPTCHA e proteções', color: 'bg-amber-100 text-amber-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 font-display">Dashboard Administrativo</h1>
        <p className="text-gray-600 mt-2">Bem-vindo, {session.user.name}</p>
      </motion.div>

      {/* Quick Actions - Apenas para Admin */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Acesso Rápido</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  <Link
                    href={action.href}
                    className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-4 group"
                  >
                    <div className={`${action.color} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                      <Icon size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 font-display">{action.label}</h3>
                      <p className="text-sm text-gray-600">{action.desc}</p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Estatísticas Principais */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Métricas Principais</h2>
        {loading ? (
          <SkeletonDashboard />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Pacientes', value: stats.totalPatients, icon: Users, color: 'bg-blue-500' },
              { label: 'Consultas', value: stats.totalConsultations, icon: Calendar, color: 'bg-green-500' },
              { label: 'Receitas', value: stats.totalPrescriptions, icon: FileText, color: 'bg-purple-500' },
              { label: 'Receita Total', value: `R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: CreditCard, color: 'bg-yellow-500' },
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
          </div>
        )}
      </motion.div>

      {/* Ações Pendentes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock size={24} className="text-blue-600" />
          Ações Pendentes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            href="/admin/consultas?status=SCHEDULED"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
            aria-label={`${pending.consultations} consultas pendentes`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-500 p-3 rounded-lg group-hover:scale-110 transition-transform">
                <Calendar size={24} className="text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{pending.consultations}</span>
            </div>
            <p className="text-gray-600 font-medium">Consultas Pendentes</p>
          </Link>

          <Link
            href="/admin/prescriptions?status=pending"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
            aria-label={`${pending.prescriptions} receitas para emitir`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-500 p-3 rounded-lg group-hover:scale-110 transition-transform">
                <FileText size={24} className="text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{pending.prescriptions}</span>
            </div>
            <p className="text-gray-600 font-medium">Receitas para Emitir</p>
          </Link>

          <Link
            href="/admin/anvisa?status=PENDING"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
            aria-label={`${pending.anvisa} autorizações ANVISA pendentes`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-500 p-3 rounded-lg group-hover:scale-110 transition-transform">
                <Shield size={24} className="text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{pending.anvisa}</span>
            </div>
            <p className="text-gray-600 font-medium">Autorizações ANVISA</p>
          </Link>

          <Link
            href="/admin/carteirinhas?approvalStatus=PENDING"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
            aria-label={`${pending.patientCards} carteirinhas pendentes`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-emerald-500 p-3 rounded-lg group-hover:scale-110 transition-transform">
                <IdCard size={24} className="text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{pending.patientCards}</span>
            </div>
            <p className="text-gray-600 font-medium">Carteirinhas Pendentes</p>
          </Link>
        </div>
      </motion.div>

      {/* Análise Financeira */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard size={24} className="text-green-600" />
            Análise Financeira
          </h2>
          <FinancialSection />
        </motion.div>
      )}

      {/* Gráficos e Análises */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-8"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity size={24} className="text-green-600" />
          Análises e Gráficos
        </h2>
        <ConsultationsChart />
      </motion.div>

      {/* Consultas Recentes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
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
                {consultations.map((consultation, index) => (
                  <motion.tr
                    key={consultation.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className="border-b hover:bg-gray-50 transition-colors"
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
                        {consultation.status}
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
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
