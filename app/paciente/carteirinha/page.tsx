'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { IdCard, Download, Calendar, User, FileText, AlertCircle } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

interface PatientCardData {
  id: string;
  cardNumber: string;
  qrCodeUrl: string;
  qrCodeData: string;
  issuedAt: string;
  expiresAt: string | null;
  status: string;
  patient: {
    id: string;
    name: string;
    cpf: string | null;
    email: string;
    phone: string | null;
    birthDate: string | null;
    address: string | null;
    image?: string | null;
  };
  activePrescription: {
    id: string;
    issuedAt: string;
    expiresAt: string | null;
    doctor: {
      name: string;
      crm: string;
    };
  } | null;
}

export default function PacienteCarteirinhaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { effectivePatientId, loading: loadingPatientId } = useEffectivePatientId();
  const [card, setCard] = useState<PatientCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (effectivePatientId && !loadingPatientId) {
      fetchCard();
    }
  }, [effectivePatientId, loadingPatientId]);

  const fetchCard = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = effectivePatientId 
        ? `/api/patient-card?patientId=${effectivePatientId}`
        : '/api/patient-card';
      const response = await fetch(url);
      
      if (response.status === 404) {
        setError('Você ainda não possui uma carteirinha. Ela será gerada após a aprovação do administrador e compra do medicamento.');
        setCard(null);
      } else if (!response.ok) {
        const data = await response.json();
        if (data.error?.includes('PENDING')) {
          setError('PENDING - Aguardando aprovação');
        } else {
          throw new Error(data.error || 'Erro ao buscar carteirinha');
        }
        setCard(null);
      } else {
        const data = await response.json();
        if (data.approvalStatus === 'PENDING') {
          setError('PENDING - Aguardando aprovação');
          setCard(null);
        } else if (data.approvalStatus === 'REJECTED') {
          setError(`REJECTED - ${data.rejectionReason || 'Carteirinha rejeitada'}`);
          setCard(null);
        } else {
          setCard(data);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar carteirinha');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCard = async () => {
    try {
      setGenerating(true);
      setError(null);
      const response = await fetch('/api/patient-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao gerar carteirinha');
      }

      const data = await response.json();
      setCard(data.card);
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar carteirinha');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadCard = () => {
    if (!card?.qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = card.qrCodeUrl;
    link.download = `carteirinha-${card.cardNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2 drop-shadow-sm">
            <IdCard className="text-emerald-300" size={32} />
            Carteirinha Digital de Paciente
          </h1>
          <p className="text-emerald-100 mt-2">
            Visual da sua carteirinha oficial de paciente de cannabis medicinal.
          </p>
        </div>

        {error && !card && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-yellow-600 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-1">Carteirinha não disponível</h3>
                <p className="text-yellow-800 text-sm mb-2">
                  {error.includes('PENDING') 
                    ? 'Sua solicitação de carteirinha está aguardando aprovação do administrador. Você receberá uma notificação quando for aprovada.'
                    : error}
                </p>
                {error.includes('PENDING') && (
                  <p className="text-yellow-700 text-xs mt-2">
                    A carteirinha será gerada automaticamente após a aprovação e compra do medicamento indicado.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {card && (
          <div className="flex justify-center">
            <div className="relative w-full max-w-3xl aspect-[86/54] bg-gradient-to-br from-emerald-100 via-sky-100 to-emerald-50 rounded-3xl shadow-2xl overflow-hidden border border-emerald-200">
              {/* Faixa superior azul escura */}
              <div className="absolute inset-x-0 top-0 h-16 bg-[#0b2855] flex items-center justify-between px-8">
                <p className="text-xs md:text-sm font-semibold tracking-[0.18em] text-white/90 uppercase">
                  Paciente registrado de cannabis medicinal
                </p>
                <p className="text-sm md:text-base font-bold tracking-[0.25em] text-white uppercase">
                  CANNA ID
                </p>
              </div>

              {/* Corpo do cartão */}
              <div className="absolute inset-x-0 bottom-0 top-12 px-6 md:px-8 py-5 md:py-6 flex gap-4 md:gap-6">
                {/* Faixa lateral com número */}
                <div className="hidden md:flex flex-col justify-between w-16 bg-gradient-to-b from-emerald-300 to-lime-200 rounded-2xl rounded-tr-none rounded-br-none shadow-inner border border-emerald-300">
                  <div className="px-3 pt-4 text-[10px] font-semibold tracking-[0.2em] text-emerald-900 uppercase">
                    Nº de registro
                  </div>
                  <div className="px-3 pb-4 text-xs font-mono font-bold text-emerald-900 leading-tight">
                    {card.cardNumber}
                  </div>
                </div>

                {/* Conteúdo principal */}
                <div className="flex-1 flex gap-4 md:gap-6 items-stretch">
                  {/* Foto */}
                  <div className="flex flex-col justify-center">
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-emerald-200 w-28 h-32 md:w-32 md:h-40 flex items-center justify-center">
                      <Avatar
                        src={card.patient.image || undefined}
                        name={card.patient.name}
                        size="xl"
                        className="w-full h-full rounded-none border-none shadow-none"
                        showBorder={false}
                      />
                    </div>
                  </div>

                  {/* Dados textuais */}
                  <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] md:text-xs text-slate-800">
                    <div className="col-span-2 mb-1">
                      <p className="font-semibold tracking-[0.18em] uppercase text-[10px] text-emerald-900">
                        Dados do paciente
                      </p>
                    </div>

                    <div>
                      <p className="uppercase text-[9px] text-slate-600 tracking-[0.18em]">
                        Nome
                      </p>
                      <p className="font-semibold text-[11px] md:text-sm text-slate-900">
                        {card.patient.name}
                      </p>
                    </div>

                    <div>
                      <p className="uppercase text-[9px] text-slate-600 tracking-[0.18em]">
                        CPF
                      </p>
                      <p className="font-semibold text-[11px] md:text-sm text-slate-900">
                        {card.patient.cpf || '—'}
                      </p>
                    </div>

                    <div>
                      <p className="uppercase text-[9px] text-slate-600 tracking-[0.18em]">
                        Data de nascimento
                      </p>
                      <p className="font-semibold text-[11px] md:text-sm text-slate-900">
                        {card.patient.birthDate
                          ? new Date(card.patient.birthDate).toLocaleDateString('pt-BR')
                          : '—'}
                      </p>
                    </div>

                    <div>
                      <p className="uppercase text-[9px] text-slate-600 tracking-[0.18em]">
                        Nacionalidade
                      </p>
                      <p className="font-semibold text-[11px] md:text-sm text-slate-900">
                        BRASILEIRO(A)
                      </p>
                    </div>

                    <div>
                      <p className="uppercase text-[9px] text-slate-600 tracking-[0.18em]">
                        Tipo
                      </p>
                      <p className="font-semibold text-[11px] md:text-sm text-slate-900">
                        PACIENTE
                      </p>
                    </div>

                    <div>
                      <p className="uppercase text-[9px] text-slate-600 tracking-[0.18em]">
                        Validade
                      </p>
                      <p className="font-semibold text-[11px] md:text-sm text-slate-900">
                        {card.expiresAt
                          ? new Date(card.expiresAt).toLocaleDateString('pt-BR')
                          : '—'}
                      </p>
                    </div>

                    {/* QR Code área */}
                    <div className="col-span-2 md:col-span-1 mt-1 md:mt-0 flex items-center justify-end">
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-[9px] uppercase tracking-[0.18em] text-slate-600">
                          Verificação
                        </p>
                        {card.qrCodeUrl && (
                          <div className="bg-white p-1.5 rounded-md shadow-md border border-slate-200">
                            <img
                              src={card.qrCodeUrl}
                              alt="QR Code da Carteirinha"
                              className="w-16 h-16 md:w-20 md:h-20"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rodapé - emissão/baixa */}
              <div className="absolute inset-x-0 bottom-0 h-12 bg-white/70 backdrop-blur-sm border-t border-emerald-200 px-6 md:px-8 flex items-center justify-between text-[10px] md:text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-emerald-700" />
                  <div>
                    <p className="uppercase text-[9px] tracking-[0.18em] text-slate-500">
                      Emitida em
                    </p>
                    <p className="font-semibold text-[11px]">
                      {new Date(card.issuedAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDownloadCard}
                  className="inline-flex items-center gap-2 bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[11px] font-semibold hover:bg-emerald-800 transition"
                >
                  <Download size={14} />
                  Baixar QR
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
