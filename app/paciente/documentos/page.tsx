'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FileText, 
  Download, 
  Calendar, 
  Stethoscope, 
  FileCheck, 
  Receipt, 
  Eye,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';
import { useEffectivePatientId } from '@/components/impersonation/useEffectivePatientId';
import { motion, AnimatePresence } from 'framer-motion';

const fileTypeConfig = {
  EXAM: {
    label: 'Exame',
    icon: Stethoscope,
    color: 'bg-blue-100 text-blue-600',
    borderColor: 'border-blue-200',
  },
  REPORT: {
    label: 'Laudo',
    icon: FileCheck,
    color: 'bg-purple-100 text-purple-600',
    borderColor: 'border-purple-200',
  },
  PRESCRIPTION: {
    label: 'Receita',
    icon: Receipt,
    color: 'bg-green-100 text-green-600',
    borderColor: 'border-green-200',
  },
  OTHER: {
    label: 'Documento',
    icon: FileText,
    color: 'bg-gray-100 text-gray-600',
    borderColor: 'border-gray-200',
  },
};

export default function PacienteDocumentosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { effectivePatientId, loading: loadingPatientId } = useEffectivePatientId();
  const [files, setFiles] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedConsultations, setExpandedConsultations] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>('ALL');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (effectivePatientId && !loadingPatientId) {
      Promise.all([
        fetch(`/api/patients/${effectivePatientId}/files`).then(res => res.json()),
        fetch(`/api/consultations?patientId=${effectivePatientId}`).then(res => res.json()),
      ])
        .then(([filesData, consultationsData]) => {
          setFiles(filesData.files || []);
          setConsultations(consultationsData || []);
          setLoading(false);
          
          // Expandir primeira consulta por padrão
          if (consultationsData && consultationsData.length > 0) {
            setExpandedConsultations(new Set([consultationsData[0].id]));
          }
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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const toggleConsultation = (consultationId: string) => {
    const newExpanded = new Set(expandedConsultations);
    if (newExpanded.has(consultationId)) {
      newExpanded.delete(consultationId);
    } else {
      newExpanded.add(consultationId);
    }
    setExpandedConsultations(newExpanded);
  };

  // Agrupar arquivos por consulta
  const filesByConsultation = files.reduce((acc, file) => {
    const consultationId = file.consultationId || 'no-consultation';
    if (!acc[consultationId]) {
      acc[consultationId] = [];
    }
    acc[consultationId].push(file);
    return acc;
  }, {} as Record<string, any[]>);

  // Criar estrutura de consultas com arquivos
  const consultationsWithFiles = consultations
    .map(consultation => ({
      ...consultation,
      files: filesByConsultation[consultation.id] || [],
    }))
    .filter(consultation => {
      if (filterType === 'ALL') return true;
      return consultation.files.some((f: any) => f.fileType === filterType);
    })
    .sort((a, b) => {
      const dateA = new Date(a.scheduledAt || a.createdAt).getTime();
      const dateB = new Date(b.scheduledAt || b.createdAt).getTime();
      return dateB - dateA; // Mais recente primeiro
    });

  // Arquivos sem consulta associada
  const orphanFiles = files.filter(f => !f.consultationId);

  if (status === 'loading' || loading || loadingPatientId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  const totalFiles = files.length;
  const filesByType = {
    EXAM: files.filter(f => f.fileType === 'EXAM').length,
    REPORT: files.filter(f => f.fileType === 'REPORT').length,
    PRESCRIPTION: files.filter(f => f.fileType === 'PRESCRIPTION').length,
    OTHER: files.filter(f => f.fileType === 'OTHER').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/paciente" className="text-primary hover:underline mb-4 inline-block">
            ← Voltar
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Histórico Médico</h1>
          <p className="text-gray-600 mt-2">
            Visualize todos os documentos e arquivos enviados para análise médica
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <p className="text-sm text-gray-600 mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900">{totalFiles}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <Stethoscope size={16} className="text-blue-600" />
              <p className="text-sm text-gray-600">Exames</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{filesByType.EXAM}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <FileCheck size={16} className="text-purple-600" />
              <p className="text-sm text-gray-600">Laudos</p>
            </div>
            <p className="text-2xl font-bold text-purple-600">{filesByType.REPORT}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <Receipt size={16} className="text-green-600" />
              <p className="text-sm text-gray-600">Receitas</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{filesByType.PRESCRIPTION}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <FileText size={16} className="text-gray-600" />
              <p className="text-sm text-gray-600">Outros</p>
            </div>
            <p className="text-2xl font-bold text-gray-600">{filesByType.OTHER}</p>
          </motion.div>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex items-center gap-2 flex-wrap">
          <Filter size={18} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filtrar:</span>
          {['ALL', 'EXAM', 'REPORT', 'PRESCRIPTION', 'OTHER'].map((type) => {
            const config = type === 'ALL' 
              ? { label: 'Todos', color: 'bg-gray-100 text-gray-700' }
              : fileTypeConfig[type as keyof typeof fileTypeConfig];
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filterType === type
                    ? 'bg-primary text-white'
                    : config.color
                }`}
              >
                {config.label}
              </button>
            );
          })}
        </div>

        {/* Timeline de Consultas */}
        <div className="space-y-4">
          {consultationsWithFiles.length === 0 && orphanFiles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-12 text-center"
            >
              <FileText size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Nenhum documento encontrado.</p>
              <p className="text-sm text-gray-500">
                Os documentos enviados para análise médica aparecerão aqui organizados por consulta.
              </p>
            </motion.div>
          ) : (
            <>
              {consultationsWithFiles.map((consultation, index) => {
                const consultationFiles = consultation.files || [];
                const isExpanded = expandedConsultations.has(consultation.id);
                const doctor = consultation.doctor;

                if (consultationFiles.length === 0 && filterType !== 'ALL') return null;

                return (
                  <motion.div
                    key={consultation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg shadow-md overflow-hidden"
                  >
                    {/* Cabeçalho da Consulta */}
                    <button
                      onClick={() => toggleConsultation(consultation.id)}
                      className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-4 flex-1 text-left">
                        <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Calendar className="text-primary" size={24} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Consulta - {formatDate(consultation.scheduledAt || consultation.createdAt)}
                            </h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              consultation.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-800'
                                : consultation.status === 'SCHEDULED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {consultation.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            {doctor && (
                              <div className="flex items-center gap-1">
                                <User size={14} />
                                <span>{doctor.name}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <FileText size={14} />
                              <span>{consultationFiles.length} documento{consultationFiles.length !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp size={20} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-400" />
                      )}
                    </button>

                    {/* Arquivos da Consulta */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-gray-200"
                        >
                          <div className="p-6 space-y-3">
                            {consultationFiles.length === 0 ? (
                              <p className="text-sm text-gray-500 text-center py-4">
                                Nenhum documento enviado para esta consulta.
                              </p>
                            ) : (
                              consultationFiles.map((file: any) => {
                                const fileConfig = fileTypeConfig[file.fileType as keyof typeof fileTypeConfig] || fileTypeConfig.OTHER;
                                const FileIcon = fileConfig.icon;

                                return (
                                  <motion.div
                                    key={file.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`p-4 rounded-lg border-2 ${fileConfig.borderColor} bg-white hover:shadow-md transition`}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-start gap-4 flex-1">
                                        <div className={`p-3 rounded-lg ${fileConfig.color}`}>
                                          <FileIcon size={24} />
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-semibold text-gray-900">{file.fileName}</h4>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${fileConfig.color}`}>
                                              {fileConfig.label}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                              <Clock size={14} />
                                              <span>Enviado em {formatDateTime(file.uploadedAt)}</span>
                                            </div>
                                            {file.fileSize && (
                                              <span>{formatFileSize(file.fileSize)}</span>
                                            )}
                                          </div>
                                          {file.description && (
                                            <p className="text-sm text-gray-600 mt-2">{file.description}</p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 ml-4">
                                        <a
                                          href={`/api/consultation-files/${file.id}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition"
                                          title="Visualizar"
                                        >
                                          <Eye size={20} />
                                        </a>
                                        <a
                                          href={`/api/consultation-files/${file.id}?download=1`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition"
                                          title="Baixar"
                                        >
                                          <Download size={20} />
                                        </a>
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}

              {/* Arquivos sem consulta associada */}
              {orphanFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Documentos Gerais
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Documentos não associados a uma consulta específica
                    </p>
                  </div>
                  <div className="p-6 space-y-3">
                    {orphanFiles.map((file: any) => {
                      const fileConfig = fileTypeConfig[file.fileType as keyof typeof fileTypeConfig] || fileTypeConfig.OTHER;
                      const FileIcon = fileConfig.icon;

                      return (
                        <div
                          key={file.id}
                          className={`p-4 rounded-lg border-2 ${fileConfig.borderColor} bg-white`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <div className={`p-3 rounded-lg ${fileConfig.color}`}>
                                <FileIcon size={24} />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-1">{file.fileName}</h4>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span>Enviado em {formatDateTime(file.uploadedAt)}</span>
                                  {file.fileSize && <span>{formatFileSize(file.fileSize)}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <a
                                href={`/api/consultation-files/${file.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition"
                              >
                                <Eye size={20} />
                              </a>
                              <a
                                href={`/api/consultation-files/${file.id}?download=1`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition"
                              >
                                <Download size={20} />
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
