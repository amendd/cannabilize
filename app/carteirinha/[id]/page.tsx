'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { IdCard, CheckCircle, XCircle, AlertCircle, FileText, User } from 'lucide-react';

type CardResponse = {
  id: string;
  cardNumber: string | null;
  status: string;
  approvalStatus: string;
  expiresAt: string | null;
  patient: { id: string; name: string; cpf: string | null };
  activePrescription: { id: string; doctor: { name: string; crm: string } } | null;
  validation: {
    isValid: boolean;
    isApproved: boolean;
    isExpired: boolean;
    status: string;
    approvalStatus: string;
  };
};

export default function CarteirinhaPublicaPage() {
  const params = useParams();
  const cardId = params.id as string;
  const [card, setCard] = useState<CardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cardId) fetchCard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId]);

  const fetchCard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/patient-card/${cardId}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Erro ao buscar carteirinha');
      }
      const data = (await res.json()) as CardResponse;
      setCard(data);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar carteirinha');
    } finally {
      setLoading(false);
    }
  };

  const badge = () => {
    if (!card) return null;
    if (card.validation?.isValid) {
      return (
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
          <CheckCircle size={16} />
          Carteirinha Válida
        </div>
      );
    }
    if (card.validation?.isExpired) {
      return (
        <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
          <XCircle size={16} />
          Carteirinha Expirada
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
        <AlertCircle size={16} />
        {card.approvalStatus || card.status}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando carteirinha...</p>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Carteirinha não encontrada</h1>
          <p className="text-gray-600 mb-6">{error || 'A carteirinha solicitada não foi encontrada.'}</p>
          <Link href="/" className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
            Voltar para o início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="bg-green-600 p-3 rounded-full">
              <IdCard className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Carteirinha Digital</h1>
              <p className="text-gray-600">Validação pública (CannabiLizi)</p>
            </div>
          </div>
          <div className="mt-4">{badge()}</div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
            <h2 className="text-xl font-bold mb-2">Verificação de Carteirinha</h2>
            <p className="text-green-100 text-sm">
              Este QR code é exclusivo da carteirinha e é diferente do QR de autenticidade da receita.
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="text-green-600" size={20} />
                Paciente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Nome</p>
                  <p className="font-medium text-gray-900">{card.patient?.name}</p>
                </div>
                {card.patient?.cpf && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">CPF</p>
                    <p className="font-medium text-gray-900">{card.patient.cpf}</p>
                  </div>
                )}
              </div>
            </div>

            {card.activePrescription && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="text-green-600" size={20} />
                  Receita ativa vinculada
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Médico:</span> {card.activePrescription.doctor?.name} —{' '}
                    <span className="font-semibold">CRM:</span> {card.activePrescription.doctor?.crm}
                  </p>
                  <div className="mt-3">
                    <Link
                      href={`/receita/${card.activePrescription.id}`}
                      className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 font-medium"
                    >
                      Ver verificação da receita (QR de autenticidade) →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="inline-block text-green-600 hover:text-green-700 font-medium">
            ← Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
}

