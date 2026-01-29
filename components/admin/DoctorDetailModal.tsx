'use client';

import { X, User, Mail, Phone, FileText, Briefcase, Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Doctor {
  id: string;
  name: string;
  crm: string;
  email: string;
  phone: string | null;
  specialization: string | null;
  availability: string | null;
  active: boolean;
  lastActiveAt: string | null;
  isOnline: boolean;
  totalConsultations: number;
  scheduledConsultations: number;
  inProgressConsultations: number;
  completedConsultations: number;
  cancelledConsultations: number;
  noShowConsultations: number;
  user: {
    name: string;
    email: string;
  } | null;
  createdAt?: string;
}

interface DoctorDetailModalProps {
  doctor: Doctor | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DoctorDetailModal({ doctor, isOpen, onClose }: DoctorDetailModalProps) {
  if (!doctor) return null;

  const formatLastActive = (lastActiveAt: string | null) => {
    if (!lastActiveAt) return 'Nunca acessou';

    const last = new Date(lastActiveAt);
    const diffMs = Date.now() - last.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffMinutes < 1) return 'Agora mesmo';
    if (diffMinutes < 60) return `Há ${diffMinutes} min`;
    if (diffHours === 1) return 'Há 1 hora';
    if (diffHours < 24) return `Há ${diffHours} horas`;

    return last.toLocaleString('pt-BR');
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <User className="text-primary" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{doctor.name}</h2>
                    <p className="text-sm text-gray-500">Detalhes do Médico</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  aria-label="Fechar modal"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Status e Informações Principais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {doctor.active ? (
                        <CheckCircle2 className="text-green-600" size={20} />
                      ) : (
                        <XCircle className="text-red-600" size={20} />
                      )}
                      <span className={`font-semibold ${doctor.active ? 'text-green-700' : 'text-red-700'}`}>
                        {doctor.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          doctor.isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                      <span className={`text-sm ${doctor.isOnline ? 'text-green-700' : 'text-gray-600'}`}>
                        {doctor.isOnline ? 'Online agora' : 'Offline'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="text-primary" size={20} />
                      <span className="font-semibold text-gray-700">CRM</span>
                    </div>
                    <p className="text-lg font-medium text-gray-900">{doctor.crm}</p>
                  </div>
                </div>

                {/* Informações Pessoais */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="text-primary" size={20} />
                    Informações Pessoais
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Nome Completo</p>
                      <p className="text-base font-medium text-gray-900">{doctor.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-gray-400" />
                        <p className="text-base text-gray-900">{doctor.email}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Telefone</p>
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-gray-400" />
                        <p className="text-base text-gray-900">{doctor.phone || '-'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Especialização</p>
                      <div className="flex items-center gap-2">
                        <Briefcase size={16} className="text-gray-400" />
                        <p className="text-base text-gray-900">{doctor.specialization || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Atividade */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="text-primary" size={20} />
                    Atividade
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Última atividade:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatLastActive(doctor.lastActiveAt)}
                      </span>
                    </div>
                    {doctor.createdAt && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Cadastrado em:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(doctor.createdAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Estatísticas de Atendimentos */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="text-primary" size={20} />
                    Estatísticas de Atendimentos
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-xs text-blue-600 mb-1">Total</p>
                      <p className="text-2xl font-bold text-blue-900">{doctor.totalConsultations}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-xs text-green-600 mb-1">Realizados</p>
                      <p className="text-2xl font-bold text-green-900">{doctor.completedConsultations}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <p className="text-xs text-yellow-600 mb-1">Agendados</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {doctor.scheduledConsultations + doctor.inProgressConsultations}
                      </p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <p className="text-xs text-red-600 mb-1">Cancelados</p>
                      <p className="text-2xl font-bold text-red-900">{doctor.cancelledConsultations}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-600 mb-1">Não Compareceram</p>
                      <p className="text-2xl font-bold text-gray-900">{doctor.noShowConsultations}</p>
                    </div>
                  </div>
                </div>

                {/* Disponibilidade */}
                {doctor.availability && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="text-primary" size={20} />
                      Disponibilidade
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-line">{doctor.availability}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Fechar
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
