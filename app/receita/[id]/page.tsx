'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FileText, User, Calendar, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

interface PrescriptionData {
  id: string;
  issuedAt: string;
  expiresAt: string | null;
  status: string;
  prescriptionData?: any;
  patient?: {
    name: string;
    cpf: string | null;
    email: string;
  };
  doctor: {
    name: string;
    crm: string;
  };
  consultation?: {
    scheduledAt: string;
  } | null;
  medications?: any[];
  pdfUrl?: string | null;
}

export default function ReceitaPublicaPage() {
  const params = useParams();
  const prescriptionId = params.id as string;
  const [prescription, setPrescription] = useState<PrescriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prescriptionId) {
      fetchPrescription();
    }
  }, [prescriptionId]);

  const fetchPrescription = async () => {
    try {
      setLoading(true);
      setError(null);
      // Buscar diretamente pela receita usando a rota pública
      const response = await fetch(`/api/prescriptions/public/${prescriptionId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Receita não encontrada');
        } else {
          throw new Error('Erro ao buscar receita');
        }
      }

      const data = await response.json();
      setPrescription(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar receita');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!prescription) return null;

    const isExpired = prescription.expiresAt && new Date(prescription.expiresAt) < new Date();
    const isActive = prescription.status === 'ISSUED' && !isExpired;

    if (isActive) {
      return (
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
          <CheckCircle size={16} />
          Receita Válida
        </div>
      );
    } else if (isExpired) {
      return (
        <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
          <XCircle size={16} />
          Receita Expirada
        </div>
      );
    } else {
      return (
        <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
          <AlertCircle size={16} />
          {prescription.status}
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando receita...</p>
        </div>
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Receita não encontrada</h1>
          <p className="text-gray-600 mb-6">{error || 'A receita solicitada não foi encontrada ou não está mais disponível.'}</p>
          <Link
            href="/"
            className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Voltar para o início
          </Link>
        </div>
      </div>
    );
  }

  const isExpired = prescription.expiresAt && new Date(prescription.expiresAt) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="bg-green-600 p-3 rounded-full">
              <FileText className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Receita Médica</h1>
              <p className="text-gray-600">CannabiLizi - Cannabis Medicinal</p>
            </div>
          </div>
          <div className="mt-4">{getStatusBadge()}</div>
        </div>

        {/* Card Principal */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Cabeçalho */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
            <h2 className="text-xl font-bold mb-2">Verificação de Receita</h2>
            <p className="text-green-100 text-sm">
              Esta receita foi verificada através do QR code de autenticidade do documento
            </p>
          </div>

          {/* Conteúdo */}
          <div className="p-6 space-y-6">
            {/* Informações do Médico */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="text-green-600" size={20} />
                Médico Responsável
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Nome</p>
                  <p className="font-medium text-gray-900">{prescription.doctor.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">CRM</p>
                  <p className="font-medium text-gray-900">{prescription.doctor.crm}</p>
                </div>
              </div>
            </div>

            {/* Informações do Paciente (omitidas na verificação pública por LGPD; disponíveis na área logada) */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="text-green-600" size={20} />
                Dados do Paciente
              </h3>
              {prescription.patient ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Nome</p>
                    <p className="font-medium text-gray-900">{prescription.patient.name}</p>
                  </div>
                  {prescription.patient.cpf && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">CPF</p>
                      <p className="font-medium text-gray-900">{prescription.patient.cpf}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  Dados do paciente não exibidos nesta verificação (proteção de dados). O titular pode ver os dados completos em <Link href="/paciente/receitas" className="text-green-600 hover:underline">Minhas Receitas</Link> após login.
                </p>
              )}
            </div>

            {/* Informações da Receita */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="text-green-600" size={20} />
                Informações da Receita
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Data de Emissão</p>
                  <p className="font-medium text-gray-900">
                    {new Date(prescription.issuedAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {prescription.expiresAt && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Validade</p>
                    <p className={`font-medium ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                      {new Date(prescription.expiresAt).toLocaleDateString('pt-BR')}
                      {isExpired && ' (Expirada)'}
                    </p>
                  </div>
                )}
                {prescription.consultation && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Data da Consulta</p>
                    <p className="font-medium text-gray-900">
                      {new Date(prescription.consultation.scheduledAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Medicamentos */}
            {prescription.prescriptionData?.medications && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Medicamentos Prescritos</h3>
                <div className="space-y-3">
                  {prescription.prescriptionData.medications.map((med: any, index: number) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 mb-1">{med.name}</p>
                          {med.dosage && (
                            <p className="text-sm text-gray-600 mb-1">Dosagem: {med.dosage}</p>
                          )}
                          {med.instructions && (
                            <p className="text-sm text-gray-600">Instruções: {med.instructions}</p>
                          )}
                          {med.quantity && (
                            <p className="text-sm text-gray-600 mt-1">Quantidade: {med.quantity}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Observações */}
            {prescription.prescriptionData?.observations && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Observações</h3>
                <p className="text-sm text-blue-800 whitespace-pre-line">
                  {prescription.prescriptionData.observations}
                </p>
              </div>
            )}

            {/* Aviso de Validade */}
            {isExpired && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-600 mt-0.5" size={20} />
                  <div>
                    <h4 className="font-semibold text-red-900 mb-1">Receita Expirada</h4>
                    <p className="text-sm text-red-800">
                      Esta receita expirou e não pode mais ser utilizada. O paciente deve obter uma nova receita através de uma consulta médica.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Esta receita foi verificada através do QR code de autenticidade do documento (CannabiLizi).
              {prescription.patient?.email
                ? ` Para mais informações, entre em contato através do email: ${prescription.patient.email}`
                : ' Para mais informações, entre em contato através do site.'}
            </p>
          </div>
        </div>

        {/* Botão Voltar */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-block text-green-600 hover:text-green-700 font-medium"
          >
            ← Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
}
