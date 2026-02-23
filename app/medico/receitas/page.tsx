'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, Download, Calendar, User, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingPage from '@/components/ui/Loading';

export default function MedicoReceitasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      fetchPrescriptions();
    }
  }, [session]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/prescriptions');
      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data);
      } else {
        console.error('Erro ao buscar receitas');
      }
    } catch (error) {
      console.error('Erro ao buscar receitas:', error);
    } finally {
      setLoading(false);
    }
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
            <FileText className="text-green-600" size={32} />
            Receitas Emitidas
          </h1>
          <p className="text-gray-600 mt-2">Todas as receitas médicas que você emitiu</p>
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
                <p className="text-sm text-gray-600 mb-1">Total de Receitas</p>
                <p className="text-2xl font-bold text-gray-900">{prescriptions.length}</p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <FileText size={24} className="text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Receitas Válidas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {prescriptions.filter((p: any) => {
                    if (!p.expiresAt) return true;
                    return new Date(p.expiresAt) > new Date();
                  }).length}
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
                <p className="text-sm text-gray-600 mb-1">Pacientes Únicos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(prescriptions.map((p: any) => p.patientId)).size}
                </p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <User size={24} className="text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Lista de Receitas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          {prescriptions.length === 0 ? (
            <div className="p-12 text-center">
              <FileText size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Você ainda não emitiu nenhuma receita médica.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data de Emissão</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Validade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {prescriptions.map((prescription, index) => {
                    const prescriptionData = typeof prescription.prescriptionData === 'string'
                      ? JSON.parse(prescription.prescriptionData)
                      : prescription.prescriptionData;
                    
                    const isExpired = prescription.expiresAt && new Date(prescription.expiresAt) < new Date();
                    const isValid = !prescription.expiresAt || new Date(prescription.expiresAt) > new Date();

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
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-green-600" />
                            {new Date(prescription.issuedAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(prescription.issuedAt).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {prescription.expiresAt ? (
                            <span className={isExpired ? 'text-red-600 font-semibold' : ''}>
                              {new Date(prescription.expiresAt).toLocaleDateString('pt-BR')}
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
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {isExpired ? 'Expirada' : prescription.status === 'ISSUED' ? 'Válida' : prescription.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {prescription.pdfUrl && (
                              <a
                                href={prescription.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                              >
                                <Download size={16} />
                                PDF
                              </a>
                            )}
                            {prescription.consultationId && (
                              <Link
                                href={`/medico/consultas/${prescription.consultationId}`}
                                className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm"
                              >
                                <FileText size={16} />
                                Ver Consulta
                              </Link>
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
