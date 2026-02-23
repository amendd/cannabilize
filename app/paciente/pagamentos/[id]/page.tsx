'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEffectivePatientId } from '@/components/impersonation/useEffectivePatientId';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { SkeletonPatientList } from '@/components/ui/Skeleton';
import { getPaymentStatusLabel } from '@/lib/status-labels';

export default function PagamentoPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { effectivePatientId, loading: loadingPatientId } = useEffectivePatientId();
  const params = useParams();
  const paymentId = params.id as string;
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (paymentId && effectivePatientId && !loadingPatientId) {
      fetch(`/api/payments?patientId=${effectivePatientId}`)
        .then(res => res.json())
        .then(data => {
          const found = data.find((p: any) => p.id === paymentId);
          setPayment(found);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [paymentId, effectivePatientId, loadingPatientId]);

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          paymentMethod: 'credit_card', // Em produção, viria do formulário
        }),
      });

      if (!response.ok) throw new Error('Erro ao processar pagamento');

      toast.success('Pagamento processado com sucesso!');
      
      // Aguardar atualização do status
      setTimeout(() => {
        router.push('/paciente/consultas');
      }, 2000);
    } catch (error) {
      toast.error('Erro ao processar pagamento');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs baseHref="/paciente" items={[{ label: 'Pagamentos', href: '/paciente/pagamentos' }, { label: 'Detalhe' }]} />
        <SkeletonPatientList count={3} />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Pagamento não encontrado</p>
          <Link href="/paciente" className="text-primary hover:underline">
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs baseHref="/paciente" items={[{ label: 'Pagamentos', href: '/paciente/pagamentos' }, { label: 'Detalhe' }]} />
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Pagamento</h1>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={24} className="text-primary" />
              <h2 className="text-xl font-semibold text-gray-900">Detalhes do Pagamento</h2>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Descrição:</span>
                <span className="font-medium text-gray-900">
                  Consulta Médica - {payment.consultation?.id?.slice(0, 8)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Valor:</span>
                <span className="font-bold text-2xl text-primary">
                  R$ {Number(payment.amount).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    payment.status === 'PAID'
                      ? 'bg-green-100 text-green-800'
                      : payment.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : payment.status === 'FAILED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {getPaymentStatusLabel(payment.status)}
                </span>
              </div>
            </div>
          </div>

          {payment.status === 'PENDING' && (
            <div className="border-t pt-6">
              <p className="text-gray-600 mb-4">
                Selecione a forma de pagamento e complete a transação:
              </p>

              {/* Em produção, aqui viria o formulário de pagamento do Stripe/Mercado Pago */}
              <div className="space-y-3 mb-6">
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="credit_card"
                    defaultChecked
                    className="mr-3"
                  />
                  <div>
                    <p className="font-medium">Cartão de Crédito</p>
                    <p className="text-sm text-gray-500">Visa, Mastercard, Elo</p>
                  </div>
                </label>
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="pix"
                    className="mr-3"
                  />
                  <div>
                    <p className="font-medium">PIX</p>
                    <p className="text-sm text-gray-500">Pagamento instantâneo</p>
                  </div>
                </label>
              </div>

              <button
                onClick={handlePayment}
                disabled={processing}
                className="w-full bg-primary text-white py-4 rounded-lg font-semibold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Pagar Agora
                  </>
                )}
              </button>
            </div>
          )}

          {payment.status === 'PAID' && (
            <div className="border-t pt-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle size={24} className="text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Pagamento Confirmado</p>
                  <p className="text-sm text-green-700">
                    Pago em{' '}
                    {payment.paidAt
                      ? new Date(payment.paidAt).toLocaleDateString('pt-BR')
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {payment.status === 'FAILED' && (
            <div className="border-t pt-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <XCircle size={24} className="text-red-600" />
                <div>
                  <p className="font-semibold text-red-900">Pagamento Falhou</p>
                  <p className="text-sm text-red-700">
                    Tente novamente ou entre em contato com o suporte.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
