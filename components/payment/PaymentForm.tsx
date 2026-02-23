'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface PaymentFormProps {
  consultationId: string;
  amount: number;
  onSuccess: () => void;
}

export default function PaymentForm({ consultationId, amount, onSuccess }: PaymentFormProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'pix' | 'boleto'>('credit');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Simular processamento de pagamento
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Confirmar pagamento (endpoint público: permite pagar sem login, ex.: pagar por outra pessoa)
      const method = paymentMethod === 'credit' ? 'CREDIT_CARD' : paymentMethod === 'pix' ? 'PIX' : 'BOLETO';
      const response = await fetch(`/api/consultations/${consultationId}/payment/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: method }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao processar pagamento');
      }

      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Pagamento da Consulta</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Valor */}
        <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Valor a pagar</p>
          <p className="text-3xl font-bold text-gray-900">R$ {amount.toFixed(2)}</p>
        </div>

        {/* Método de Pagamento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Método de Pagamento
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setPaymentMethod('credit')}
              className={`p-4 rounded-lg border-2 transition ${
                paymentMethod === 'credit'
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">💳</div>
              <div className="font-semibold text-gray-900">Cartão de Crédito</div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('pix')}
              className={`p-4 rounded-lg border-2 transition ${
                paymentMethod === 'pix'
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">📱</div>
              <div className="font-semibold text-gray-900">PIX</div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('boleto')}
              className={`p-4 rounded-lg border-2 transition ${
                paymentMethod === 'boleto'
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">📄</div>
              <div className="font-semibold text-gray-900">Boleto</div>
            </button>
          </div>
        </div>

        {/* Informações do Pagamento */}
        {paymentMethod === 'credit' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Modo de Desenvolvimento:</strong> O pagamento será simulado. 
              Em produção, integre com Stripe ou outro gateway de pagamento.
            </p>
          </div>
        )}

        {paymentMethod === 'pix' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              💡 <strong>Modo de Desenvolvimento:</strong> O pagamento será simulado. 
              Em produção, gere o QR Code do PIX.
            </p>
          </div>
        )}

        {paymentMethod === 'boleto' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              💡 <strong>Modo de Desenvolvimento:</strong> O pagamento será simulado. 
              Em produção, gere o boleto bancário.
            </p>
          </div>
        )}

        {/* Botão de Pagamento */}
        <button
          type="submit"
          disabled={isProcessing}
          className="w-full bg-primary text-white py-4 rounded-lg font-semibold text-lg hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <span className="animate-spin">⏳</span>
              Processando pagamento...
            </>
          ) : (
            `Confirmar Pagamento de R$ ${amount.toFixed(2)}`
          )}
        </button>

        {/* Aviso */}
        <div className="bg-gray-100 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-600">
            🔒 Seus dados estão seguros. Este é um ambiente de desenvolvimento.
          </p>
        </div>
      </form>
    </div>
  );
}
