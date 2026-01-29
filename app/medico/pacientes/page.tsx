'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Calendar, FileText, Phone, Mail, Search, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingPage from '@/components/ui/Loading';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  birthDate: string | null;
  totalConsultations: number;
  lastConsultation: string | null;
  lastPrescription: string | null;
}

export default function MedicoPacientesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
      fetchPatients();
    }
  }, [session]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter((patient) =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.cpf && patient.cpf.includes(searchTerm)) ||
        (patient.phone && patient.phone.includes(searchTerm))
      );
      setFilteredPatients(filtered);
    }
  }, [searchTerm, patients]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/medico/patients');
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
        setFilteredPatients(data);
      } else {
        console.error('Erro ao buscar pacientes');
      }
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (status === 'loading' || loading) {
    return <LoadingPage />;
  }

  if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <User className="text-green-600" size={32} />
            Meus Pacientes
          </h1>
          <p className="text-gray-600 mt-2">Lista de todos os pacientes que você atendeu</p>
        </motion.div>

        {/* Estatísticas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Pacientes</p>
                <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <User size={24} className="text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Consultas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {patients.reduce((sum, p) => sum + p.totalConsultations, 0)}
                </p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <Calendar size={24} className="text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pacientes com Receitas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {patients.filter((p) => p.lastPrescription).length}
                </p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <FileText size={24} className="text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Barra de Busca */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome, email, CPF ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </motion.div>

        {/* Lista de Pacientes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          {filteredPatients.length === 0 ? (
            <div className="p-12 text-center">
              <User size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                {searchTerm ? 'Nenhum paciente encontrado com os critérios de busca.' : 'Você ainda não atendeu nenhum paciente.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contato</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consultas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última Consulta</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última Receita</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPatients.map((patient, index) => {
                    const age = calculateAge(patient.birthDate);
                    return (
                      <motion.tr
                        key={patient.id}
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
                              <div className="font-medium text-gray-900">{patient.name}</div>
                              {age && (
                                <div className="text-sm text-gray-500">{age} anos</div>
                              )}
                              {patient.cpf && (
                                <div className="text-xs text-gray-400">CPF: {patient.cpf}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {patient.email && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail size={14} className="text-green-600" />
                                {patient.email}
                              </div>
                            )}
                            {patient.phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone size={14} className="text-green-600" />
                                {patient.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                            {patient.totalConsultations}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {patient.lastConsultation ? (
                            <div className="flex items-center gap-2">
                              <Calendar size={16} className="text-green-600" />
                              {formatDate(patient.lastConsultation)}
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {patient.lastPrescription ? (
                            <div className="flex items-center gap-2">
                              <FileText size={16} className="text-purple-600" />
                              {formatDate(patient.lastPrescription)}
                            </div>
                          ) : (
                            <span className="text-gray-400">Nenhuma</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/medico/consultas`}
                            className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                          >
                            <Eye size={16} />
                            Ver Consultas
                          </Link>
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
