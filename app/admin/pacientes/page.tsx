'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { SkeletonTable } from '@/components/ui/Skeleton';
import LoadingPage from '@/components/ui/Loading';
import { Search, Edit, Eye, LogIn, RefreshCw } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  birthDate: string | null;
  address: string | null;
  role: string;
  createdAt: string;
  consultations: Array<{
    id: string;
    status: string;
    scheduledAt: string;
  }>;
  prescriptions: Array<{
    id: string;
    createdAt: string;
  }>;
  patientPathologies: Array<{
    pathology: {
      name: string;
    };
  }>;
  patientCard: {
    status: string;
    approvalStatus: string;
    cardNumber: string | null;
  } | null;
}

export default function PatientsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [refreshNonce, setRefreshNonce] = useState(0);

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

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const isAdmin = status === 'authenticated' && session?.user?.role === 'ADMIN';

  useEffect(() => {
    if (!isAdmin) return;
    fetchPatients({ search: debouncedSearchTerm });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, debouncedSearchTerm, refreshNonce]);

  useEffect(() => {
    if (!isAdmin) return;
    const id = setInterval(() => {
      fetchPatients({ search: debouncedSearchTerm, silent: true });
    }, 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, debouncedSearchTerm]);

  const fetchPatients = async (opts?: { search?: string; silent?: boolean }) => {
    const search = opts?.search ?? '';
    const silent = opts?.silent ?? false;
    try {
      if (!silent) setLoading(true);
      setRefreshing(true);
      const url = search
        ? `/api/admin/patients?search=${encodeURIComponent(search)}`
        : '/api/admin/patients';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
      } else {
        if (!silent) toast.error('Erro ao carregar pacientes');
      }
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
      if (!silent) toast.error('Erro ao carregar pacientes');
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCPF = (cpf: string | null) => {
    if (!cpf) return '-';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
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
          className="mb-8"
        >
          <Breadcrumbs items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Pacientes' },
          ]} />
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-display">Gerenciar Pacientes</h1>
              <p className="text-gray-600 mt-2">Visualize e gerencie todos os pacientes cadastrados</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRefreshNonce((n) => n + 1)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-sm font-medium text-gray-700 min-h-[44px]"
                aria-label="Atualizar lista de pacientes"
                title="Atualiza automaticamente a cada 1 minuto"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                Atualizar
              </button>
              <span className="text-xs text-gray-500 hidden sm:inline">
                Auto a cada 1 min
              </span>
            </div>
          </div>
        </motion.div>

        {/* Barra de Busca */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome, email, telefone ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </motion.div>

        {/* Tabela de Pacientes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CPF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consultas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receitas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cadastrado em
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
                    </td>
                  </tr>
                ) : (
                  patients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                        {patient.birthDate && (
                          <div className="text-xs text-gray-500">
                            {formatDate(patient.birthDate)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{patient.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{patient.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCPF(patient.cpf)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {patient.consultations?.length || 0}
                        </div>
                        {patient.consultations && patient.consultations.length > 0 && (
                          <div className="text-xs text-gray-500">
                            {patient.consultations.filter(c => c.status === 'SCHEDULED').length} agendadas
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {patient.prescriptions?.length || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(patient.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/pacientes/${patient.id}/editar`}
                            className="px-3 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 min-h-[32px] min-w-[80px] flex items-center justify-center gap-1"
                            aria-label={`Editar paciente ${patient.name}`}
                          >
                            <Edit size={14} />
                            Editar
                          </Link>
                          <Link
                            href={`/admin/consultas?patientId=${patient.id}`}
                            className="px-3 py-1 rounded text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 min-h-[32px] min-w-[80px] flex items-center justify-center gap-1"
                            aria-label={`Ver consultas de ${patient.name}`}
                          >
                            <Eye size={14} />
                            Ver Consultas
                          </Link>
                          <a
                            href={`/admin/impersonate?patientId=${patient.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 min-h-[32px] min-w-[80px] flex items-center justify-center gap-1"
                            aria-label={`Acessar como paciente ${patient.name}`}
                            title="Abrir área do paciente em nova aba"
                          >
                            <LogIn size={14} />
                            Acessar como
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Estatísticas */}
        {patients.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600">Total de Pacientes</p>
              <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600">Total de Consultas</p>
              <p className="text-2xl font-bold text-gray-900">
                {patients.reduce((acc, p) => acc + (p.consultations?.length || 0), 0)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600">Total de Receitas</p>
              <p className="text-2xl font-bold text-gray-900">
                {patients.reduce((acc, p) => acc + (p.prescriptions?.length || 0), 0)}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
