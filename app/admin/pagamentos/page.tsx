'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  isIntegrated: boolean;
  gateway: string | null;
  minAmount: number | null;
  maxAmount: number | null;
  fee: number | null;
  feeType: string | null;
  description: string | null;
  icon: string | null;
  order: number;
}

export default function PaymentMethodsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (session?.user.role === 'ADMIN') {
      fetchMethods();
    }
  }, [session]);

  const fetchMethods = async () => {
    try {
      const response = await fetch('/api/admin/payment-methods');
      if (response.ok) {
        const data = await response.json();
        setMethods(data);
      }
    } catch (error) {
      console.error('Error fetching methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEnabled = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/payment-methods/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentStatus }),
      });

      if (response.ok) {
        toast.success(`Método ${!currentStatus ? 'habilitado' : 'desabilitado'}`);
        fetchMethods();
      } else {
        toast.error('Erro ao atualizar método');
      }
    } catch (error) {
      toast.error('Erro ao atualizar método');
    }
  };

  const deleteMethod = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este método de pagamento?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/payment-methods/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Método excluído com sucesso');
        fetchMethods();
      } else {
        toast.error('Erro ao excluir método');
      }
    } catch (error) {
      toast.error('Erro ao excluir método');
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Métodos de Pagamento</h1>
            <p className="text-gray-600 mt-2">Gerencie métodos e integrações de pagamento</p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/admin"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Voltar
            </Link>
            <Link
              href="/admin/pagamentos/novo"
              className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition"
            >
              + Novo Método
            </Link>
          </div>
        </div>

        {/* Métodos de Pagamento */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {methods.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 mb-4">Nenhum método de pagamento configurado</p>
              <Link
                href="/admin/pagamentos/novo"
                className="text-primary hover:underline font-semibold"
              >
                Criar primeiro método
              </Link>
            </div>
          ) : (
            methods.map((method) => (
              <div
                key={method.id}
                className={`bg-white rounded-lg shadow-md p-6 border-2 ${
                  method.enabled ? 'border-green-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{method.icon || '💳'}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{method.name}</h3>
                      <p className="text-sm text-gray-500">{method.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleEnabled(method.id, method.enabled)}
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        method.enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {method.enabled ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>
                </div>

                {method.description && (
                  <p className="text-sm text-gray-600 mb-4">{method.description}</p>
                )}

                <div className="space-y-2 mb-4">
                  {method.isIntegrated && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-600">✓</span>
                      <span className="text-gray-700">
                        Integrado com {method.gateway || 'Gateway'}
                      </span>
                    </div>
                  )}
                  {method.fee && (
                    <div className="text-sm text-gray-600">
                      Taxa: {method.fee}% {method.feeType === 'FIXED' ? 'fixa' : ''}
                    </div>
                  )}
                  {method.minAmount && (
                    <div className="text-sm text-gray-600">
                      Mínimo: R$ {method.minAmount.toFixed(2)}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/admin/pagamentos/${method.id}/editar`}
                    className="flex-1 text-center bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-100 transition text-sm"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => deleteMethod(method.id)}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition text-sm"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Informações */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Sobre Métodos de Pagamento</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Métodos habilitados aparecem para os clientes no checkout</li>
            <li>• Integre com gateways como Stripe, Mercado Pago, PagSeguro</li>
            <li>• Configure taxas e limites de valor por método</li>
            <li>• Métodos inativos não aparecem para os clientes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
