'use client';

import { forwardRef } from 'react';
import Image from 'next/image';
import { Calendar, Download } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

export interface CarteirinhaCardData {
  id: string;
  cardNumber: string | null;
  qrCodeUrl?: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  patient: {
    id: string;
    name: string;
    cpf: string | null;
    email?: string;
    phone?: string | null;
    birthDate?: string | null;
    image?: string | null;
  };
}

interface CarteirinhaCardProps {
  card: CarteirinhaCardData;
  showDownloadButton?: boolean;
  onDownloadClick?: () => void;
  downloading?: boolean;
  className?: string;
}

/**
 * Carteirinha Digital – visual original (faixa azul, faixa lateral, gradiente).
 * Melhorias mantidas: hierarquia (nome em destaque), CANNA ID no cabeçalho, labels neutros,
 * validade em destaque leve, texto "Escaneie para validar" no QR.
 */
const CarteirinhaCard = forwardRef<HTMLDivElement, CarteirinhaCardProps>(
  (
    {
      card,
      showDownloadButton = false,
      onDownloadClick,
      downloading = false,
      className = '',
    },
    ref
  ) => {
    const issuedFormatted = card.issuedAt
      ? new Date(card.issuedAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : '—';
    const expiresFormatted = card.expiresAt
      ? new Date(card.expiresAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : '—';

    return (
      <div
        ref={ref}
        className={`relative w-full max-w-3xl aspect-[86/54] bg-gradient-to-br from-emerald-100 via-sky-100 to-emerald-50 rounded-3xl shadow-2xl overflow-hidden border border-emerald-200 ${className}`}
      >
        {/* Faixa superior azul escura (cabeçalho institucional) */}
        <div className="absolute inset-x-0 top-0 h-16 bg-[#0b2855] flex items-center justify-between px-6 md:px-8">
          <div>
            <p className="text-xs md:text-sm font-semibold tracking-[0.18em] text-white/90 uppercase">
              Paciente registrado de cannabis medicinal
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] font-medium uppercase tracking-widest text-white/80">
              CANNA ID
            </p>
            <p className="text-sm md:text-base font-bold tracking-[0.2em] text-white">
              {card.cardNumber || '—'}
            </p>
          </div>
        </div>

        {/* Corpo: faixa lateral + foto + dados + QR */}
        <div className="absolute inset-x-0 bottom-0 top-12 px-6 md:px-8 py-5 md:py-6 flex gap-4 md:gap-6">
          {/* Faixa lateral com nº de registro */}
          <div className="hidden md:flex flex-col justify-between w-16 bg-gradient-to-b from-emerald-300 to-lime-200 rounded-2xl rounded-tr-none rounded-br-none shadow-inner border border-emerald-300">
            <div className="px-3 pt-4 text-[10px] font-semibold tracking-[0.2em] text-emerald-900 uppercase">
              Nº de registro
            </div>
            <div className="px-3 pb-4 text-xs font-mono font-bold text-emerald-900 leading-tight">
              {card.cardNumber || '—'}
            </div>
          </div>

          <div className="flex-1 flex gap-4 md:gap-6 items-stretch min-w-0">
            {/* Foto do paciente (imagem ou iniciais) */}
            <div className="flex flex-col justify-center shrink-0">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-emerald-200 w-28 h-32 md:w-32 md:h-40 flex items-center justify-center relative">
                {card.patient.image ? (
                  <Image
                    src={card.patient.image}
                    alt={`Foto de ${card.patient.name}`}
                    fill
                    className="object-cover"
                    sizes="128px"
                    unoptimized={card.patient.image.startsWith('blob:') || card.patient.image.startsWith('data:')}
                  />
                ) : (
                  <Avatar
                    src={undefined}
                    name={card.patient.name}
                    size="xl"
                    className="w-full h-full rounded-none border-none shadow-none"
                    showBorder={false}
                  />
                )}
              </div>
              <p className="text-[9px] uppercase tracking-[0.18em] text-emerald-800 mt-1.5 text-center font-medium">
                PACIENTE
              </p>
            </div>

            {/* Dados + Verificação: dados à esquerda, Verificação+QR à direita */}
            <div className="flex-1 flex flex-col md:flex-row gap-4 min-w-0">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] md:text-xs text-slate-800 min-w-0 flex-1">
                <div className="col-span-2 mb-1">
                  <p className="font-semibold tracking-[0.18em] uppercase text-[10px] text-emerald-900">
                    Dados do paciente
                  </p>
                </div>

                <div className="col-span-2">
                  <p className="uppercase text-[9px] text-slate-600 tracking-[0.18em]">Nome completo</p>
                  <p className="font-semibold text-sm md:text-base text-slate-900 truncate" title={card.patient.name}>
                    {card.patient.name}
                  </p>
                </div>

                <div>
                  <p className="uppercase text-[9px] text-slate-600 tracking-[0.18em]">CPF</p>
                  <p className="font-semibold text-[11px] md:text-sm text-slate-900">
                    {card.patient.cpf || '—'}
                  </p>
                </div>

                <div>
                  <p className="uppercase text-[9px] text-slate-600 tracking-[0.18em]">Data de nascimento</p>
                  <p className="font-semibold text-[11px] md:text-sm text-slate-900">
                    {card.patient.birthDate
                      ? new Date(card.patient.birthDate).toLocaleDateString('pt-BR')
                      : '—'}
                  </p>
                </div>

                <div>
                  <p className="uppercase text-[9px] text-slate-600 tracking-[0.18em]">Nacionalidade</p>
                  <p className="font-semibold text-[11px] md:text-sm text-slate-900">Brasileiro(a)</p>
                </div>

                <div>
                  <p className="uppercase text-[9px] text-slate-600 tracking-[0.18em]">Validade</p>
                  <p className="font-semibold text-[11px] md:text-sm text-amber-800">
                    {expiresFormatted}
                  </p>
                </div>
              </div>

              {/* Verificação + QR Code – colado à direita */}
              <div className="shrink-0 flex flex-col items-end md:items-end justify-center">
                <p className="text-[9px] uppercase tracking-[0.18em] text-slate-600 font-medium">Verificação</p>
                <p className="text-[9px] text-slate-500 text-right">Escaneie para validar este documento</p>
                {card.qrCodeUrl ? (
                  <div className="bg-white p-1.5 rounded-md shadow-md border border-slate-200 mt-0.5 relative w-16 h-16 md:w-20 md:h-20">
                    <Image
                      src={card.qrCodeUrl}
                      alt="QR Code da Carteirinha"
                      width={80}
                      height={80}
                      className="w-full h-full object-contain"
                      unoptimized={card.qrCodeUrl.startsWith('data:') || card.qrCodeUrl.startsWith('blob:')}
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-md flex items-center justify-center text-[8px] text-gray-500 mt-0.5">
                    QR indisponível
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé: Emitida em + Validade (validade com destaque leve) */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-white/70 backdrop-blur-sm border-t border-emerald-200 px-6 md:px-8 flex items-center justify-between text-[10px] md:text-xs text-slate-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-emerald-700 shrink-0" />
              <div>
                <p className="uppercase text-[9px] tracking-[0.18em] text-slate-500">Emitida em</p>
                <p className="font-semibold text-[11px]">{issuedFormatted}</p>
              </div>
            </div>
            <div className="border-l border-slate-200 pl-4">
              <p className="uppercase text-[9px] tracking-[0.18em] text-slate-500">Validade</p>
              <p className="font-semibold text-[11px] text-amber-800">{expiresFormatted}</p>
            </div>
          </div>

          {showDownloadButton && onDownloadClick && (
            <button
              type="button"
              onClick={onDownloadClick}
              disabled={downloading}
              className="inline-flex items-center gap-2 bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[11px] font-semibold hover:bg-emerald-800 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Download size={14} />
              {downloading ? 'Gerando...' : 'Baixar Carteirinha'}
            </button>
          )}
        </div>
      </div>
    );
  }
);

CarteirinhaCard.displayName = 'CarteirinhaCard';

export default CarteirinhaCard;
