'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, CheckCircle, XCircle, Clock, Calendar, ArrowRight } from 'lucide-react';
import { useEffectivePatientId } from '@/components/impersonation/useEffectivePatientId';
import { motion } from 'framer-motion';

const statusConfig = {
  PENDING: {
    label: 'Pendente',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
  },
  PROCESSING: {
    label: 'Processando',
    color: 'bg-blue-100 text-blue-800',
    icon: Clock,
  },
  PAID: {
    label: 'Pago',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
  },
  FAILED: {
    label: 'Falhou',
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
  },
  REFUNDED: {
    label: 'Reembolsado',
    color: 'bg-gray-100 text-gray-800',
    icon: XCircle,
  },
  CANCELLED: {
    label: 'Cancelado',
    color: 'bg-gray-100 text-gray-800',
    icon: XCircle,
  },
};

export default function PacientePagamentosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { effectivePatientId, loading: loadingPatientId } = useEffectivePatientId();
  const [payments, setPayments] = useState<any[]>([]);
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
      fetch(`/api/payments?patientId=${effectivePatientId}`)
        .then(res => res.json())
        .then(data => {
          setPayments(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [effectivePatientId, loadingPatientId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (status === 'loading' || loading || loadingPatientId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  const pendingPayments = payments.filter(p => p.status === 'PENDING' || p.status === 'PROCESSING');
  const completedPayments = payments.filter(p => p.status === 'PAID');
  const otherPayments = payments.filter(
    p => p.status !== 'PENDING' && p.status !== 'PROCESSING' && p.status !== 'PAID'
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/paciente" className="text-primary hover:underline mb-4 inline-block">
            ← Voltar
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Meus Pagamentos</h1>
          <p className="text-gray-600 mt-2">Visualize e gerencie todos os seus pagamentos</p>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingPayments.length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pagos</p>
                <p className="text-2xl font-bold text-green-600">{completedPayments.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Pago</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(
                    completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
                  )}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
          </motion.div>
        </div>

        {/* Pagamentos Pendentes */}
        {pendingPayments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pagamentos Pendentes</h2>
            <div className="space-y-4">
              {pendingPayments.map((payment) => {
                const statusInfo = statusConfig[payment.status as keyof typeof statusConfig] || statusConfig.PENDING;
                const StatusIcon = statusInfo.icon;

                return (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <CreditCard className="w-5 h-5 text-primary" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            Pagamento #{payment.id.slice(0, 8)}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.color}`}
                          >
                            <StatusIcon className="w-4 h-4" />
                            {statusInfo.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Criado em: {formatDate(payment.createdAt)}</span>
                          </div>
                          {payment.consultation && (
                            <div>
                              <span className="font-medium">Consulta:</span>{' '}
                              {payment.consultation.scheduledAt
                                ? new Date(payment.consultation.scheduledAt).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })
                                : payment.consultation.scheduledDate
                                ? new Date(payment.consultation.scheduledDate).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })
                                : `#${payment.consultation.id.slice(0, 8)}`}
                            </div>
                          )}
                          {payment.paymentMethod && (
                            <div>
                              <span className="font-medium">Método:</span>{' '}
                              {payment.paymentMethod === 'credit_card'
                                ? 'Cartão de Crédito'
                                : payment.paymentMethod === 'pix'
                                ? 'PIX'
                                : payment.paymentMethod}
                            </div>
                          )}
                        </div>

                        <div className="mt-4">
                          <p className="text-2xl font-bold text-primary">
                            {formatCurrency(payment.amount)}
                          </p>
                        </div>
                      </div>

                      <div className="ml-4">
                        <Link
                          href={`/paciente/pagamentos/${payment.id}`}
                          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition"
                        >
                          Ver Detalhes
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagamentos Concluídos */}
        {completedPayments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pagamentos Concluídos</h2>
            <div className="space-y-4">
              {completedPayments.map((payment) => {
                const statusInfo = statusConfig[payment.status as keyof typeof statusConfig] || statusConfig.PAID;
                const StatusIcon = statusInfo.icon;

                return (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <CreditCard className="w-5 h-5 text-green-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            Pagamento #{payment.id.slice(0, 8)}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.color}`}
                          >
                            <StatusIcon className="w-4 h-4" />
                            {statusInfo.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Pago em:{' '}
                              {payment.paidAt ? formatDate(payment.paidAt) : formatDate(payment.updatedAt)}
                            </span>
                          </div>
                          {payment.consultation && (
                            <div>
                              <span className="font-medium">Consulta:</span>{' '}
                              {payment.consultation.scheduledAt
                                ? new Date(payment.consultation.scheduledAt).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })
                                : payment.consultation.scheduledDate
                                ? new Date(payment.consultation.scheduledDate).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })
                                : `#${payment.consultation.id.slice(0, 8)}`}
                            </div>
                          )}
                          {payment.paymentMethod && (
                            <div>
                              <span className="font-medium">Método:</span>{' '}
                              {payment.paymentMethod === 'credit_card'
                                ? 'Cartão de Crédito'
                                : payment.paymentMethod === 'pix'
                                ? 'PIX'
                                : payment.paymentMethod}
                            </div>
                          )}
                          {payment.transactionId && (
                            <div>
                              <span className="font-medium">Transação:</span> {payment.transactionId.slice(0, 12)}...
                            </div>
                          )}
                        </div>

                        <div className="mt-4">
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(payment.amount)}
                          </p>
                        </div>
                      </div>

                      <div className="ml-4">
                        <Link
                          href={`/paciente/pagamentos/${payment.id}`}
                          className="inline-flex items-center gap-2 text-primary hover:underline"
                        >
                          Ver Detalhes
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Outros Pagamentos */}
        {otherPayments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Outros</h2>
            <div className="space-y-4">
              {otherPayments.map((payment) => {
                const statusInfo = statusConfig[payment.status as keyof typeof statusConfig] || statusConfig.PENDING;
                const StatusIcon = statusInfo.icon;

                return (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <CreditCard className="w-5 h-5 text-gray-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            Pagamento #{payment.id.slice(0, 8)}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.color}`}
                          >
                            <StatusIcon className="w-4 h-4" />
                            {statusInfo.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Criado em: {formatDate(payment.createdAt)}</span>
                          </div>
                          {payment.consultation && (
                            <div>
                              <span className="font-medium">Consulta:</span>{' '}
                              {payment.consultation.scheduledAt
                                ? new Date(payment.consultation.scheduledAt).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })
                                : payment.consultation.scheduledDate
                                ? new Date(payment.consultation.scheduledDate).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })
                                : `#${payment.consultation.id.slice(0, 8)}`}
                            </div>
                          )}
                        </div>

                        <div className="mt-4">
                          <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(payment.amount)}
                          </p>
                        </div>
                      </div>

                      <div className="ml-4">
                        <Link
                          href={`/paciente/pagamentos/${payment.id}`}
                          className="inline-flex items-center gap-2 text-primary hover:underline"
                        >
                          Ver Detalhes
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Estado Vazio */}
        {payments.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <CreditCard size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Você ainda não possui pagamentos registrados.</p>
            <Link
              href="/agendamento"
              className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition"
            >
              Agendar Consulta
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
