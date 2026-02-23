'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';
import { IdCard, AlertCircle, Download, Share2, QrCode, Store } from 'lucide-react';
import CarteirinhaCard from '@/components/carteirinha/CarteirinhaCard';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { SkeletonPatientList } from '@/components/ui/Skeleton';
import { useEffectivePatientId } from '@/components/impersonation/useEffectivePatientId';

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
  const cardRef = useRef<HTMLDivElement>(null);

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

  const handleDownloadCard = async () => {
    if (!card || !cardRef.current) return;

    try {
      setGenerating(true);
      
      // Capturar o cartão completo como imagem
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2, // Maior resolução
        logging: false,
        useCORS: true,
        allowTaint: false,
      });

      // Converter canvas para blob e fazer download
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Erro ao gerar imagem da carteirinha');
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `carteirinha-${card.cardNumber}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (err) {
      console.error('Erro ao baixar carteirinha:', err);
      setError('Erro ao gerar imagem da carteirinha. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs baseHref="/paciente" items={[{ label: 'Carteirinha' }]} />
        <SkeletonPatientList count={3} />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs baseHref="/paciente" items={[{ label: 'Identidade do Paciente' }, { label: 'Carteirinha digital' }]} />
      <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2 mb-2">
        <IdCard className="text-emerald-600" size={32} />
        Carteirinha Digital
      </h1>
      <p className="text-gray-600 mb-8">
        Sua identidade oficial de paciente em tratamento com cannabis medicinal no Brasil.
      </p>

      {error && !card && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-600 mt-0.5 flex-shrink-0" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-1">Carteirinha não disponível</h3>
              <p className="text-amber-800 text-sm mb-2">
                {error.includes('PENDING') 
                  ? 'Sua solicitação de carteirinha está sendo analisada. Você receberá uma notificação quando for aprovada.'
                  : error.includes('REJECTED')
                  ? 'Sua solicitação foi recusada. Entre em contato com a clínica para mais informações.'
                  : error}
              </p>
              {error.includes('PENDING') && (
                <p className="text-amber-700 text-xs mt-2">
                  A carteirinha será gerada automaticamente após a aprovação e compra do medicamento indicado.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {card && (
        <>
          {/* Selo institucional: Paciente em tratamento ativo */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
              Paciente em tratamento ativo
            </span>
            <span className="text-sm text-gray-500">CannabiLize — Plataforma nacional</span>
          </div>

          {/* Carteirinha sem botão interno para export (PDF/imagem) limpa */}
          <div ref={cardRef} data-qr-code className="w-full max-w-3xl mx-auto">
            <CarteirinhaCard card={card} />
          </div>

          {/* Ações: Compartilhar, Validar QR, Mostrar em farmácia, Baixar */}
          <div className="mt-6 w-full max-w-3xl mx-auto space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  if (navigator.share && cardRef.current) {
                    html2canvas(cardRef.current, { scale: 2, useCORS: true, logging: false })
                      .then((canvas) => canvas.toBlob((blob) => {
                        if (!blob) return;
                        const f = new File([blob], 'carteirinha-cannabilize.png', { type: 'image/png' });
                        navigator.share({ title: 'Minha Carteirinha CannabiLize', files: [f] }).catch(() => {});
                      }));
                  } else {
                    handleDownloadCard();
                  }
                }}
                disabled={generating}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-200 bg-white py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition disabled:opacity-60"
              >
                <Share2 size={18} />
                Compartilhar carteirinha
              </button>
              <a
                href="#qr"
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-200 bg-white py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('[data-qr-code]')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <QrCode size={18} />
                Validar QR Code
              </a>
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-200 bg-white py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition"
                onClick={() => window.print?.()}
              >
                <Store size={18} />
                Mostrar em farmácia
              </button>
            </div>
            <button
              type="button"
              onClick={handleDownloadCard}
              disabled={generating}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download size={18} aria-hidden />
              {generating ? 'Gerando...' : 'Baixar carteirinha'}
            </button>
          </div>

          {/* Mobile: botão fixo no rodapé (apenas Baixar) */}
          <div className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 px-4 py-3 safe-area-pb md:hidden">
            <button
              type="button"
              onClick={handleDownloadCard}
              disabled={generating}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download size={20} aria-hidden />
              {generating ? 'Gerando...' : 'Baixar carteirinha'}
            </button>
          </div>
          <div className="h-20 md:hidden" aria-hidden />
        </>
      )}
    </div>
  );
}
