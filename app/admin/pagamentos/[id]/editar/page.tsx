'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface PaymentMethodForm {
  name: string;
  type: string;
  enabled: boolean;
  isIntegrated: boolean;
  gateway: string;
  apiKey: string;
  apiSecret: string;
  webhookUrl: string;
  webhookSecret: string;
  minAmount: number;
  maxAmount: number;
  fee: number;
  feeType: string;
  description: string;
  instructions: string;
  icon: string;
  order: number;
}

export default function EditPaymentMethodPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const methodId = params.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, watch, setValue, reset } = useForm<PaymentMethodForm>();

  const isIntegrated = watch('isIntegrated');
  const type = watch('type');
  const gateway = watch('gateway');
  
  // Verificar se é PIX ou Cartão de Crédito com Mercado Pago
  const isMercadoPagoIntegration = 
    (type === 'PIX' || type === 'CREDIT_CARD' || type === 'DEBIT_CARD') && 
    gateway === 'mercadopago';

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
    if (session?.user.role === 'ADMIN' && methodId) {
      fetchMethod();
    }
  }, [session, methodId]);

  const fetchMethod = async () => {
    try {
      const response = await fetch(`/api/admin/payment-methods/${methodId}`);
      if (response.ok) {
        const data = await response.json();
        reset({
          ...data,
          apiKey: '', // Não mostrar chaves salvas por segurança
          apiSecret: '',
          webhookSecret: '',
        });
      }
    } catch (error) {
      toast.error('Erro ao carregar método');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: PaymentMethodForm) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/payment-methods/${methodId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Método de pagamento atualizado com sucesso!');
        router.push('/admin/pagamentos');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao atualizar método');
      }
    } catch (error) {
      toast.error('Erro ao atualizar método de pagamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/admin/pagamentos"
            className="text-gray-600 hover:text-gray-900 font-medium mb-4 inline-block"
          >
            ← Voltar para Métodos de Pagamento
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Editar Método de Pagamento</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-8 space-y-6">
          {/* Informações Básicas */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informações Básicas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome *
                </label>
                <input
                  {...register('name', { required: true })}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo *
                </label>
                <select
                  {...register('type', { required: true })}
                  onChange={(e) => {
                    setValue('type', e.target.value);
                    // Auto-configurar para Mercado Pago se for PIX ou Cartão
                    if (e.target.value === 'PIX' || e.target.value === 'CREDIT_CARD' || e.target.value === 'DEBIT_CARD') {
                      setValue('isIntegrated', true);
                      setValue('gateway', 'mercadopago');
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="CREDIT_CARD">Cartão de Crédito</option>
                  <option value="DEBIT_CARD">Cartão de Débito</option>
                  <option value="PIX">PIX</option>
                  <option value="BOLETO">Boleto</option>
                  <option value="STRIPE">Stripe</option>
                  <option value="MERCADO_PAGO">Mercado Pago</option>
                  <option value="PAGSEGURO">PagSeguro</option>
                  <option value="OTHER">Outro</option>
                </select>
              </div>

              {!isMercadoPagoIntegration && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ícone/Emoji
                    </label>
                    <input
                      {...register('icon')}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ordem de Exibição
                    </label>
                    <input
                      {...register('order', { valueAsNumber: true })}
                      type="number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição
                    </label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instruções para o Cliente
                    </label>
                    <textarea
                      {...register('instructions')}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Configurações de Valor - Oculto para Mercado Pago */}
          {!isMercadoPagoIntegration && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Configurações de Valor</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Mínimo (R$)
                  </label>
                  <input
                    {...register('minAmount', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Máximo (R$)
                  </label>
                  <input
                    {...register('maxAmount', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taxa (%)
                  </label>
                  <input
                    {...register('fee', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Taxa
                  </label>
                  <select
                    {...register('feeType')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="PERCENTAGE">Percentual (%)</option>
                    <option value="FIXED">Fixo (R$)</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          {/* Integração com Gateway */}
          {isMercadoPagoIntegration ? (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Integração Mercado Pago</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">💳</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {type === 'PIX' ? 'PIX via Mercado Pago' : 'Cartão de Crédito via Mercado Pago'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Configure apenas os campos essenciais para integração
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Token (Obrigatório) *
                  </label>
                  <input
                    {...register('apiSecret', { required: isMercadoPagoIntegration })}
                    type="password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="APP_USR-..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Token de acesso do Mercado Pago (Production ou Test)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Public Key (Obrigatório) *
                  </label>
                  <input
                    {...register('apiKey', { required: isMercadoPagoIntegration })}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="APP_USR-..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Chave pública do Mercado Pago
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>💡 Dica:</strong> Encontre suas credenciais em{' '}
                    <a 
                      href="https://www.mercadopago.com.br/developers/panel/credentials" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-900"
                    >
                      Developers do Mercado Pago
                    </a>
                  </p>
                  <p className="text-xs text-blue-700 mt-2">
                    <strong>ℹ️ Sobre Webhooks:</strong> Webhooks são opcionais e usados apenas para notificações automáticas de pagamento. 
                    Para PIX e Cartão de Crédito, você só precisa das credenciais acima (Access Token e Public Key).
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Integração com Gateway</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    {...register('isIntegrated')}
                    type="checkbox"
                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Integrado com gateway de pagamento externo
                  </span>
                </label>

                {isIntegrated && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gateway
                      </label>
                      <select
                        {...register('gateway')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">Selecione...</option>
                        <option value="stripe">Stripe</option>
                        <option value="mercadopago">Mercado Pago</option>
                        <option value="pagseguro">PagSeguro</option>
                        <option value="asaas">ASAAS</option>
                        <option value="other">Outro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chave Pública (API Key)
                      </label>
                      <input
                        {...register('apiKey')}
                        type="password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Deixe em branco para manter a atual"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chave Secreta (API Secret)
                      </label>
                      <input
                        {...register('apiSecret')}
                        type="password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Deixe em branco para manter a atual"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL do Webhook <span className="text-gray-500 text-xs">(Opcional)</span>
                      </label>
                      <input
                        {...register('webhookUrl')}
                        type="url"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="https://seu-site.com/api/webhooks/payment"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        URL para receber notificações automáticas de pagamento (opcional)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Secret do Webhook <span className="text-gray-500 text-xs">(Opcional)</span>
                      </label>
                      <input
                        {...register('webhookSecret')}
                        type="password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Deixe em branco para manter a atual"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Chave secreta para validar webhooks (opcional)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Status */}
          <section>
            <label className="flex items-center gap-3">
              <input
                {...register('enabled')}
                type="checkbox"
                className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm font-medium text-gray-700">
                Habilitar método de pagamento (aparecerá para os clientes)
              </span>
            </label>
          </section>

          {/* Botões */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Link
              href="/admin/pagamentos"
              className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
