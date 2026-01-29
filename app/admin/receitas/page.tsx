'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, Download, Calendar, User, Clock, Search, Filter, Eye, Pill } from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingPage from '@/components/ui/Loading';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

interface Prescription {
  id: string;
  consultationId: string;
  patientId: string;
  doctorId: string;
  prescriptionData: string | any;
  pdfUrl?: string;
  issuedAt: string;
  expiresAt?: string;
  status: string;
  consultation?: {
    patient: {
      name: string;
      email: string;
    };
    doctor?: {
      name: string;
      crm: string;
    };
  };
  doctor?: {
    name: string;
    crm: string;
  };
  medications?: Array<{
    medication: {
      name: string;
      productType?: string;
      cbdConcentrationValue?: number;
      cbdConcentrationUnit?: string;
      thcConcentrationValue?: number;
      thcConcentrationUnit?: string;
    };
    quantity?: string;
    dosage?: string;
    instructions?: string;
  }>;
}

export default function AdminReceitasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

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
    if (session?.user.role === 'ADMIN') {
      fetchPrescriptions();
    }
  }, [session]);

  useEffect(() => {
    filterPrescriptions();
  }, [searchTerm, statusFilter, dateFilter, prescriptions]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/prescriptions');
      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data);
        setFilteredPrescriptions(data);
      }
    } catch (error) {
      console.error('Erro ao buscar receitas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPrescriptions = () => {
    let filtered = [...prescriptions];

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter((p) => {
        const patientName = p.consultation?.patient?.name || '';
        const patientEmail = p.consultation?.patient?.email || '';
        const doctorName = p.doctor?.name || p.consultation?.doctor?.name || '';
        const searchLower = searchTerm.toLowerCase();
        return (
          patientName.toLowerCase().includes(searchLower) ||
          patientEmail.toLowerCase().includes(searchLower) ||
          doctorName.toLowerCase().includes(searchLower)
        );
      });
    }

    // Filtro de status
    if (statusFilter !== 'all') {
      if (statusFilter === 'expired') {
        filtered = filtered.filter((p) => {
          if (!p.expiresAt) return false;
          return new Date(p.expiresAt) < new Date();
        });
      } else if (statusFilter === 'valid') {
        filtered = filtered.filter((p) => {
          if (!p.expiresAt) return true;
          return new Date(p.expiresAt) > new Date() && p.status === 'ISSUED';
        });
      } else {
        filtered = filtered.filter((p) => p.status === statusFilter);
      }
    }

    // Filtro de data
    if (dateFilter !== 'all') {
      const now = new Date();
      let dateFrom: Date;

      switch (dateFilter) {
        case 'today':
          dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          dateFrom = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          dateFrom = new Date(0);
      }

      filtered = filtered.filter((p) => {
        const issuedDate = new Date(p.issuedAt);
        return issuedDate >= dateFrom && issuedDate <= now;
      });
    }

    setFilteredPrescriptions(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPrescriptionData = (prescription: Prescription) => {
    if (typeof prescription.prescriptionData === 'string') {
      try {
        return JSON.parse(prescription.prescriptionData);
      } catch {
        return null;
      }
    }
    return prescription.prescriptionData;
  };

  if (status === 'loading' || loading) {
    return <LoadingPage />;
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }

  const stats = {
    total: prescriptions.length,
    valid: prescriptions.filter((p) => {
      if (!p.expiresAt) return p.status === 'ISSUED';
      return new Date(p.expiresAt) > new Date() && p.status === 'ISSUED';
    }).length,
    expired: prescriptions.filter((p) => {
      if (!p.expiresAt) return false;
      return new Date(p.expiresAt) < new Date();
    }).length,
    today: prescriptions.filter((p) => {
      const today = new Date();
      const issuedDate = new Date(p.issuedAt);
      return (
        issuedDate.getDate() === today.getDate() &&
        issuedDate.getMonth() === today.getMonth() &&
        issuedDate.getFullYear() === today.getFullYear()
      );
    }).length,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Breadcrumbs items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Receitas' },
          ]} />
          <h1 className="text-3xl font-bold text-gray-900 font-display mt-4 flex items-center gap-2">
            <FileText className="text-green-600" size={32} />
            Gestão de Receitas
          </h1>
          <p className="text-gray-600 mt-2">Gerencie todas as receitas médicas emitidas na plataforma</p>
        </motion.div>

        {/* Estatísticas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Receitas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <FileText size={24} className="text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Receitas Válidas</p>
                <p className="text-2xl font-bold text-green-600">{stats.valid}</p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <Calendar size={24} className="text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Receitas Expiradas</p>
                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              </div>
              <div className="bg-red-500 p-3 rounded-lg">
                <Clock size={24} className="text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Emitidas Hoje</p>
                <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <Calendar size={24} className="text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por paciente ou médico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Filtro de Status */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">Todos os Status</option>
                <option value="ISSUED">Emitidas</option>
                <option value="valid">Válidas</option>
                <option value="expired">Expiradas</option>
                <option value="USED">Utilizadas</option>
                <option value="CANCELLED">Canceladas</option>
              </select>
            </div>

            {/* Filtro de Data */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">Todas as Datas</option>
                <option value="today">Hoje</option>
                <option value="week">Últimos 7 dias</option>
                <option value="month">Este Mês</option>
                <option value="year">Este Ano</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Lista de Receitas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          {filteredPrescriptions.length === 0 ? (
            <div className="p-12 text-center">
              <FileText size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                  ? 'Nenhuma receita encontrada com os filtros aplicados.'
                  : 'Nenhuma receita cadastrada.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Médico</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicamentos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data de Emissão</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Validade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPrescriptions.map((prescription, index) => {
                    const prescriptionData = getPrescriptionData(prescription);
                    const medications = prescriptionData?.medications || prescription.medications || [];
                    const isExpired = prescription.expiresAt && new Date(prescription.expiresAt) < new Date();

                    return (
                      <motion.tr
                        key={prescription.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                              <User className="text-green-600" size={20} />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {prescription.consultation?.patient?.name || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {prescription.consultation?.patient?.email || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {prescription.doctor?.name || prescription.consultation?.doctor?.name || 'N/A'}
                            </div>
                            <div className="text-gray-500">
                              CRM: {prescription.doctor?.crm || prescription.consultation?.doctor?.crm || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {medications.length > 0 ? (
                              medications.slice(0, 2).map((med: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                                >
                                  <Pill size={12} />
                                  {med.medicationName || med.medication?.name || 'Medicamento'}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 text-sm">N/A</span>
                            )}
                            {medications.length > 2 && (
                              <span className="text-xs text-gray-500">+{medications.length - 2} mais</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-green-600" />
                            {formatDate(prescription.issuedAt)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Clock size={12} />
                            {formatTime(prescription.issuedAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {prescription.expiresAt ? (
                            <span className={isExpired ? 'text-red-600 font-semibold' : ''}>
                              {formatDate(prescription.expiresAt)}
                            </span>
                          ) : (
                            <span className="text-gray-400">Sem validade</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              isExpired
                                ? 'bg-red-100 text-red-800'
                                : prescription.status === 'ISSUED'
                                ? 'bg-green-100 text-green-800'
                                : prescription.status === 'USED'
                                ? 'bg-blue-100 text-blue-800'
                                : prescription.status === 'CANCELLED'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {isExpired ? 'Expirada' : prescription.status === 'ISSUED' ? 'Válida' : prescription.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/consultas/${prescription.consultationId}`}
                              className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition text-sm"
                            >
                              <Eye size={14} />
                              Ver
                            </Link>
                            {prescription.pdfUrl && (
                              <a
                                href={prescription.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition text-sm"
                              >
                                <Download size={14} />
                                PDF
                              </a>
                            )}
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
      </div>
    </div>
  );
}
