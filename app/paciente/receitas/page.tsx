'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, Download, Calendar, Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useEffectivePatientId } from '@/components/impersonation/useEffectivePatientId';
import { motion } from 'framer-motion';

export default function PacienteReceitasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { effectivePatientId, loading: loadingPatientId } = useEffectivePatientId();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (effectivePatientId && !loadingPatientId) {
      fetch(`/api/prescriptions?patientId=${effectivePatientId}`)
        .then(res => res.json())
        .then(data => {
          setPrescriptions(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [effectivePatientId, loadingPatientId]);

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const handleDownload = async (prescription: any) => {
    if (!prescription.pdfUrl) {
      alert('PDF não disponível para download');
      return;
    }

    try {
      const response = await fetch(prescription.pdfUrl);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `receita-${prescription.id.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      alert('Erro ao baixar receita');
    }
  };

  if (status === 'loading' || loading || loadingPatientId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/paciente" className="text-primary hover:underline mb-4 inline-block">
            ← Voltar
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Minhas Receitas Médicas</h1>
          <p className="text-gray-600 mt-2">Visualize e baixe suas receitas médicas</p>
        </div>

        <div className="space-y-4">
          {prescriptions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-12 text-center"
            >
              <FileText size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Você ainda não possui receitas médicas.</p>
            </motion.div>
          ) : (
            prescriptions.map((prescription, index) => {
              const consultation = prescription.consultation;
              const doctor = prescription.doctor || consultation?.doctor;
              const expired = isExpired(prescription.expiresAt);

              return (
                <motion.div
                  key={prescription.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <FileText size={24} className="text-green-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Receita Médica
                            </h3>
                            <p className="text-sm text-gray-500">
                              Emitida em {formatDateTime(prescription.issuedAt)}
                            </p>
                          </div>
                        </div>

                        {/* Informações da Consulta */}
                        {consultation && (
                          <div className="ml-11 mb-4 p-3 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Calendar size={16} />
                                <span>
                                  <strong>Data da Consulta:</strong>{' '}
                                  {consultation.scheduledAt
                                    ? formatDate(consultation.scheduledAt)
                                    : consultation.scheduledDate
                                    ? formatDate(consultation.scheduledDate)
                                    : 'N/A'}
                                </span>
                              </div>
                              {doctor && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <User size={16} />
                                  <span>
                                    <strong>Médico:</strong> {doctor.name}
                                    {doctor.crm && ` - CRM ${doctor.crm}`}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Status e Validade */}
                        <div className="ml-11 flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            {expired ? (
                              <>
                                <XCircle size={16} className="text-red-500" />
                                <span className="text-sm text-red-600 font-medium">Expirada</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle size={16} className="text-green-500" />
                                <span className="text-sm text-green-600 font-medium">Válida</span>
                              </>
                            )}
                          </div>
                          {prescription.expiresAt && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock size={16} />
                              <span>
                                Válida até {formatDate(prescription.expiresAt)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Botão de Download */}
                      <div className="ml-4">
                        <button
                          onClick={() => handleDownload(prescription)}
                          disabled={!prescription.pdfUrl}
                          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                        >
                          <Download size={20} />
                          Baixar PDF
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
