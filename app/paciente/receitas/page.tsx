'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FileText, Download, Calendar, Clock, User, CheckCircle, XCircle, ExternalLink, Pill } from 'lucide-react';
import { useEffectivePatientId } from '@/components/impersonation/useEffectivePatientId';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import EmptyState from '@/components/patient/EmptyState';
import { SkeletonPatientList } from '@/components/ui/Skeleton';

function parsePrescriptionData(prescription: any): { diagnosis?: string; posologySummary?: string } {
  try {
    const data = typeof prescription.prescriptionData === 'string'
      ? JSON.parse(prescription.prescriptionData)
      : prescription.prescriptionData || {};
    const diagnosis = data.diagnosis || null;
    const meds = data.medications || prescription.medications;
    let posologySummary = '';
    if (Array.isArray(meds) && meds.length > 0) {
      posologySummary = meds
        .slice(0, 3)
        .map((m: any) => m.medicationName || m.name || m.substance)
        .filter(Boolean)
        .join(', ');
      if (meds.length > 3) posologySummary += '…';
    }
    return { diagnosis: diagnosis || undefined, posologySummary: posologySummary || undefined };
  } catch {
    return {};
  }
}

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

  /** Converte pdfUrl (data URL ou URL normal) em Blob para download/visualização */
  const pdfUrlToBlob = (pdfUrl: string): Blob | null => {
    if (!pdfUrl) return null;
    if (pdfUrl.startsWith('data:')) {
      try {
        const base64 = pdfUrl.split(',')[1];
        if (!base64) return null;
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return new Blob([bytes], { type: 'application/pdf' });
      } catch {
        return null;
      }
    }
    return null;
  };

  const handleDownload = (prescription: any) => {
    if (!prescription.pdfUrl) {
      toast.error('PDF não disponível para download');
      return;
    }
    try {
      const blob = pdfUrlToBlob(prescription.pdfUrl);
      if (blob) {
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `receita-${prescription.id.slice(0, 8)}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        toast.success('Receita baixada com sucesso');
        return;
      }
      // Fallback: URL normal (ex.: S3)
      const link = document.createElement('a');
      link.href = prescription.pdfUrl;
      link.download = `receita-${prescription.id.slice(0, 8)}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Receita baixada com sucesso');
    } catch (error) {
      toast.error('Erro ao baixar receita. Tente novamente.');
    }
  };

  const handleView = (prescription: any) => {
    if (!prescription.pdfUrl) {
      toast.error('PDF não disponível para visualização');
      return;
    }
    const blob = pdfUrlToBlob(prescription.pdfUrl);
    if (blob) {
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
      return;
    }
    window.open(prescription.pdfUrl, '_blank', 'noopener,noreferrer');
  };

  type FilterType = 'ALL' | 'VALID' | 'EXPIRED';
  const [filterType, setFilterType] = useState<FilterType>('ALL');

  const filteredPrescriptions = useMemo(() => {
    let list = [...prescriptions].sort(
      (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
    );
    if (filterType === 'VALID') list = list.filter(p => !isExpired(p.expiresAt));
    if (filterType === 'EXPIRED') list = list.filter(p => isExpired(p.expiresAt));
    return list;
  }, [prescriptions, filterType]);

  if (status === 'loading' || loading || loadingPatientId) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs baseHref="/paciente" items={[{ label: 'Receitas' }]} />
        <SkeletonPatientList count={5} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs baseHref="/paciente" items={[{ label: 'Meu Tratamento', href: '/paciente' }, { label: 'Receitas' }]} />
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Tratamento ativo</h1>
      <p className="text-gray-600 mb-6">Suas receitas e orientações do médico em acompanhamento</p>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['ALL', 'VALID', 'EXPIRED'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterType(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filterType === f ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-purple-50'
            }`}
          >
            {f === 'ALL' ? 'Todas' : f === 'VALID' ? 'Válidas' : 'Expiradas'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredPrescriptions.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={prescriptions.length === 0 ? 'Seu tratamento em um só lugar' : 'Nenhuma receita com esses filtros'}
            description={prescriptions.length === 0 ? 'Após suas consultas, as receitas e orientações do médico aparecerão aqui.' : 'Tente alterar o filtro.'}
          />
        ) : (
            filteredPrescriptions.map((prescription, index) => {
              const consultation = prescription.consultation;
              const doctor = prescription.doctor || consultation?.doctor;
              const expired = isExpired(prescription.expiresAt);
              const { diagnosis, posologySummary } = parsePrescriptionData(prescription);

              return (
                <motion.div
                  key={prescription.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-100"
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-3 bg-emerald-100 rounded-xl">
                            <Pill size={24} className="text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {diagnosis || 'Tratamento médico'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Emitida em {formatDateTime(prescription.issuedAt)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                          {doctor && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <User size={16} className="text-gray-400" />
                              <span>Dr(a). {doctor.name}{doctor.crm ? ` — CRM ${doctor.crm}` : ''}</span>
                            </div>
                          )}
                          {consultation?.scheduledAt && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <Calendar size={16} className="text-gray-400" />
                              <span>Consulta em {formatDate(consultation.scheduledAt)}</span>
                            </div>
                          )}
                          {posologySummary && (
                            <div className="flex items-start gap-2 text-gray-700 sm:col-span-2">
                              <Pill size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                              <span><strong>Posologia:</strong> {posologySummary}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            {expired ? (
                              <>
                                <XCircle size={16} className="text-red-500" />
                                <span className="text-red-600 font-medium">Expirada</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle size={16} className="text-green-500" />
                                <span className="text-green-600 font-medium">Válida</span>
                                {prescription.expiresAt && (
                                  <span className="text-gray-500">até {formatDate(prescription.expiresAt)}</span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          Próxima revisão recomendada conforme orientação do médico.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 md:flex-shrink-0">
                        {prescription.pdfUrl && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleView(prescription)}
                              className="inline-flex items-center gap-2 border border-purple-600 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition text-sm font-medium"
                            >
                              <ExternalLink size={18} />
                              Visualizar PDF
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownload(prescription)}
                              className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                            >
                              <Download size={18} />
                              Baixar PDF
                            </button>
                          </>
                        )}
                        {!prescription.pdfUrl && (
                          <span className="text-sm text-gray-500">PDF em processamento</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
      </div>
    </div>
  );
}
