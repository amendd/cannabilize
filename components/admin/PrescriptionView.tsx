'use client';

import Image from 'next/image';
import { Download, User, Calendar, Pill, FileCheck, Stethoscope, Hash, Shield } from 'lucide-react';
import { useState } from 'react';

interface PrescriptionViewProps {
  prescription: any;
  consultation?: any;
  patient?: any;
  doctor?: any;
  showDownloadButton?: boolean;
  onDownload?: () => void;
}

export default function PrescriptionView({
  prescription,
  consultation,
  patient,
  doctor,
  showDownloadButton = true,
  onDownload,
}: PrescriptionViewProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!prescription) return null;

  // Parsear prescriptionData se for string
  const prescriptionData = typeof prescription.prescriptionData === 'string'
    ? JSON.parse(prescription.prescriptionData)
    : prescription.prescriptionData;

  const isExpired = prescription.expiresAt && new Date(prescription.expiresAt) < new Date();

  // Parsear anamnese se disponível
  const anamnesisData = consultation?.anamnesis 
    ? (typeof consultation.anamnesis === 'string' 
        ? JSON.parse(consultation.anamnesis) 
        : consultation.anamnesis)
    : null;

  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
      return;
    }

    if (prescription.pdfUrl) {
      setIsDownloading(true);
      try {
        const response = await fetch(prescription.pdfUrl);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `receita-${prescription.id.slice(0, 8)}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } catch (error) {
        console.error('Erro ao baixar PDF:', error);
      } finally {
        setIsDownloading(false);
      }
    }
  };

  // Obter medicamentos
  const medications = prescriptionData?.medications || prescription.medications || [];
  
  // Obter dados completos
  const patientData = patient || consultation?.patient || {};
  const doctorData = doctor || consultation?.doctor || {};
  
  // Extrair CRM e UF
  const crmParts = doctorData?.crm ? doctorData.crm.split('-') : [];
  const crmNumber = crmParts[0]?.replace('CRM', '').trim() || doctorData?.crm || 'N/A';
  const crmUF = crmParts[1]?.trim() || 'N/A';

  // Data de emissão formatada
  const issuedDate = new Date(prescription.issuedAt);
  const issuedDateFormatted = issuedDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const issuedTimeFormatted = issuedDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Local de emissão
  const emissionLocation = prescriptionData?.emissionLocation || 'Brasil';

  // Hash do documento (simplificado - ID da receita)
  const documentHash = prescription.id.slice(0, 16).toUpperCase();

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ fontFamily: 'var(--font-inter), var(--font-roboto), sans-serif' }}>
      {/* 🔝 CABEÇALHO */}
      <div className="bg-white border-b-2" style={{ borderColor: '#EAEAEA' }}>
        <div className="px-8 py-6">
          <div className="flex items-start justify-between mb-4">
            {/* Logo e Título */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <Image
                  src="/images/cannalize-logo.png"
                  alt="CannaLize"
                  width={140}
                  height={50}
                  className="h-12 w-auto"
                />
              </div>
              <div>
                <h1 className="text-xl font-semibold" style={{ color: '#1F5E3B', fontFamily: 'var(--font-inter), var(--font-montserrat), var(--font-lato), sans-serif' }}>
                  RECEITA MÉDICA – USO MEDICINAL DE CANNABIS
                </h1>
                <p className="text-sm mt-1" style={{ color: '#666666' }}>
                  Plataforma Cannábica
                </p>
              </div>
            </div>

            {/* Bloco ID | Data | Local */}
            <div className="text-right">
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-medium" style={{ color: '#333333' }}>ID: </span>
                  <span className="font-mono" style={{ color: '#1F5E3B' }}>{prescription.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div style={{ color: '#333333' }}>
                  <span className="font-medium">Data: </span>
                  {issuedDateFormatted}
                </div>
                <div style={{ color: '#333333' }}>
                  <span className="font-medium">Local: </span>
                  {emissionLocation}
                </div>
              </div>
            </div>
          </div>

          {/* Linha separadora */}
          <div className="h-px" style={{ backgroundColor: '#EAEAEA' }}></div>

          {/* Botão Download */}
          {showDownloadButton && prescription.pdfUrl && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition disabled:opacity-50"
                style={{ 
                  backgroundColor: '#1F5E3B', 
                  color: '#FFFFFF',
                  fontFamily: 'Inter, Montserrat, Lato, sans-serif'
                }}
              >
                <Download size={16} />
                {isDownloading ? 'Baixando...' : 'Baixar PDF'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="px-8 py-6 space-y-6">
        {/* 👤 DADOS DO PACIENTE */}
        <div className="rounded-lg p-5" style={{ backgroundColor: '#F5F5F5' }}>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#1F5E3B', fontFamily: 'Inter, Montserrat, Lato, sans-serif' }}>
            DADOS DO PACIENTE
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs mb-1" style={{ color: '#666666' }}>Nome Completo</p>
              <p className="text-base font-semibold" style={{ color: '#333333' }}>
                {patientData.name || 'N/A'}
              </p>
            </div>
            {patientData.cpf && (
              <div>
                <p className="text-xs mb-1" style={{ color: '#666666' }}>CPF</p>
                <p className="text-base" style={{ color: '#333333' }}>{patientData.cpf}</p>
              </div>
            )}
            {patientData.birthDate && (
              <div>
                <p className="text-xs mb-1" style={{ color: '#666666' }}>Data de Nascimento</p>
                <p className="text-base" style={{ color: '#333333' }}>
                  {new Date(patientData.birthDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
            {patientData.phone && (
              <div>
                <p className="text-xs mb-1" style={{ color: '#666666' }}>Telefone</p>
                <p className="text-base" style={{ color: '#333333' }}>{patientData.phone}</p>
              </div>
            )}
            {patientData.email && (
              <div>
                <p className="text-xs mb-1" style={{ color: '#666666' }}>E-mail</p>
                <p className="text-base" style={{ color: '#333333' }}>{patientData.email}</p>
              </div>
            )}
            {prescription.id && (
              <div>
                <p className="text-xs mb-1" style={{ color: '#666666' }}>Nº do Prontuário</p>
                <p className="text-base font-mono" style={{ color: '#333333' }}>
                  {prescription.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            )}
            {patientData.address && (
              <div className="md:col-span-2">
                <p className="text-xs mb-1" style={{ color: '#666666' }}>Endereço Completo</p>
                <p className="text-base" style={{ color: '#333333' }}>{patientData.address}</p>
              </div>
            )}
          </div>
        </div>

        {/* 🧠 DIAGNÓSTICO / INDICAÇÃO CLÍNICA */}
        {(prescriptionData?.diagnosis || prescriptionData?.cid10 || anamnesisData) && (
          <div>
            <h2 className="text-base font-semibold mb-3" style={{ color: '#1F5E3B', fontFamily: 'Inter, Montserrat, Lato, sans-serif' }}>
              DIAGNÓSTICO / INDICAÇÃO CLÍNICA
            </h2>
            {prescriptionData?.cid10 && (
              <div className="mb-3">
                <p className="text-xs mb-1" style={{ color: '#666666' }}>CID-10</p>
                <p className="text-base font-semibold" style={{ color: '#1F5E3B' }}>{prescriptionData.cid10}</p>
              </div>
            )}
            {prescriptionData?.diagnosis && (
              <div>
                <p className="text-xs mb-1" style={{ color: '#666666' }}>Descrição</p>
                <p className="text-base leading-relaxed whitespace-pre-line" style={{ color: '#333333' }}>
                  {prescriptionData.diagnosis}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 🌿 PRODUTO PRESCRITO - SEÇÃO MAIS IMPORTANTE */}
        {medications.length > 0 && (
          <div className="border-2 rounded-lg p-5" style={{ borderColor: '#1F5E3B' }}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#1F5E3B', fontFamily: 'Inter, Montserrat, Lato, sans-serif' }}>
              <Pill size={20} />
              PRODUTO PRESCRITO
            </h2>
            <div className="space-y-4">
              {medications.map((med: any, index: number) => {
                const medicationName = med.medicationName || med.name || med.medication?.name || 'Medicamento';
                const productType = med.productType || med.medication?.productType || med.medication?.pharmaceuticalForm || '';

                const unitLabel = (u?: string) => (u === 'MG_PER_UNIT' ? 'mg/unidade' : 'mg/mL');
                const cbdVal = med.medication?.cbdConcentrationValue;
                const thcVal = med.medication?.thcConcentrationValue;
                const computedComposition =
                  typeof cbdVal === 'number'
                    ? `CBD ${cbdVal} ${unitLabel(med.medication?.cbdConcentrationUnit)} / THC ${typeof thcVal === 'number' ? thcVal : 0} ${unitLabel(med.medication?.thcConcentrationUnit)}`
                    : '';

                const composition = med.composition || computedComposition || '';
                const spectrum = med.spectrum || med.medication?.spectrum || '';
                const route = med.route || med.medication?.administrationRoute || med.instructions || '';

                return (
                  <div key={index} className="space-y-3 pb-4 border-b last:border-b-0 last:pb-0" style={{ borderColor: '#EAEAEA' }}>
                    <div>
                      <p className="text-sm mb-1" style={{ color: '#666666' }}>Medicamento</p>
                      <p className="text-base font-semibold" style={{ color: '#333333' }}>{medicationName}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {productType && (
                        <div>
                          <p className="text-xs mb-1" style={{ color: '#666666' }}>Tipo de Produto</p>
                          <p className="text-sm" style={{ color: '#333333' }}>{productType}</p>
                        </div>
                      )}
                      
                      {composition && (
                        <div>
                          <p className="text-xs mb-1" style={{ color: '#666666' }}>Composição (CBD / THC)</p>
                          <p className="text-sm" style={{ color: '#333333' }}>{composition}</p>
                        </div>
                      )}
                      
                      {spectrum && (
                        <div>
                          <p className="text-xs mb-1" style={{ color: '#666666' }}>Espectro</p>
                          <p className="text-sm" style={{ color: '#333333' }}>{spectrum}</p>
                        </div>
                      )}
                      
                      {route && (
                        <div>
                          <p className="text-xs mb-1" style={{ color: '#666666' }}>Via de Administração</p>
                          <p className="text-sm" style={{ color: '#333333' }}>{route}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 💊 POSOLOGIA */}
        {medications.length > 0 && (
          <div>
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: '#1F5E3B', fontFamily: 'Inter, Montserrat, Lato, sans-serif' }}>
              <Pill size={18} />
              POSOLOGIA
            </h2>
            <div className="space-y-4">
              {medications.map((med: any, index: number) => {
                const medicationName = med.medicationName || med.name || med.medication?.name || 'Medicamento';
                const dosage = med.dosage || '';
                const instructions = med.instructions || '';
                const initialDose = med.initialDose || '';
                const escalation = med.escalation || '';
                const maxDose = med.maxDose || '';
                const suggestedTimes = med.suggestedTimes || '';
                const duration = med.duration || '';

                return (
                  <div key={index} className="bg-white border rounded-lg p-4" style={{ borderColor: '#EAEAEA' }}>
                    <p className="text-sm font-semibold mb-3" style={{ color: '#333333' }}>{medicationName}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {initialDose && (
                        <div>
                          <p className="text-xs mb-1" style={{ color: '#666666' }}>Dose Inicial</p>
                          <p style={{ color: '#333333' }}>{initialDose}</p>
                        </div>
                      )}
                      {dosage && !initialDose && (
                        <div>
                          <p className="text-xs mb-1" style={{ color: '#666666' }}>Dosagem</p>
                          <p style={{ color: '#333333' }}>{dosage}</p>
                        </div>
                      )}
                      {escalation && (
                        <div>
                          <p className="text-xs mb-1" style={{ color: '#666666' }}>Escalonamento</p>
                          <p style={{ color: '#333333' }}>{escalation}</p>
                        </div>
                      )}
                      {maxDose && (
                        <div>
                          <p className="text-xs mb-1" style={{ color: '#666666' }}>Dose Máxima Diária</p>
                          <p style={{ color: '#333333' }}>{maxDose}</p>
                        </div>
                      )}
                      {suggestedTimes && (
                        <div>
                          <p className="text-xs mb-1" style={{ color: '#666666' }}>Horários Sugeridos</p>
                          <p style={{ color: '#333333' }}>{suggestedTimes}</p>
                        </div>
                      )}
                      {duration && (
                        <div>
                          <p className="text-xs mb-1" style={{ color: '#666666' }}>Duração do Tratamento</p>
                          <p style={{ color: '#333333' }}>{duration}</p>
                        </div>
                      )}
                      {instructions && (
                        <div className="md:col-span-2">
                          <p className="text-xs mb-1" style={{ color: '#666666' }}>Instruções</p>
                          <p style={{ color: '#333333' }}>{instructions}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 📦 QUANTIDADE TOTAL PRESCRITA */}
        {medications.length > 0 && medications.some((med: any) => med.quantity) && (
          <div className="bg-white border-2 rounded-lg p-5" style={{ borderColor: '#1F5E3B' }}>
            <h2 className="text-base font-semibold mb-3" style={{ color: '#1F5E3B', fontFamily: 'Inter, Montserrat, Lato, sans-serif' }}>
              QUANTIDADE TOTAL PRESCRITA
            </h2>
            <div className="space-y-2">
              {medications.map((med: any, index: number) => {
                if (!med.quantity) return null;
                const medicationName = med.medicationName || med.name || med.medication?.name || 'Medicamento';
                return (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: '#EAEAEA' }}>
                    <span className="text-base" style={{ color: '#333333' }}>{medicationName}</span>
                    <span className="text-lg font-semibold" style={{ color: '#1F5E3B' }}>{med.quantity}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ⚠️ ORIENTAÇÕES MÉDICAS */}
        {prescriptionData?.observations && (
          <div>
            <h2 className="text-base font-semibold mb-3" style={{ color: '#1F5E3B', fontFamily: 'Inter, Montserrat, Lato, sans-serif' }}>
              ORIENTAÇÕES MÉDICAS
            </h2>
            <div className="bg-white border rounded-lg p-4" style={{ borderColor: '#EAEAEA' }}>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#333333' }}>
                {prescriptionData.observations}
              </p>
            </div>
          </div>
        )}

        {/* 👨‍⚕️ MÉDICO PRESCRITOR */}
        <div className="border-t-2 pt-6" style={{ borderColor: '#EAEAEA' }}>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#1F5E3B', fontFamily: 'Inter, Montserrat, Lato, sans-serif' }}>
            MÉDICO PRESCRITOR
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs mb-1" style={{ color: '#666666' }}>Nome Completo</p>
              <p className="text-base font-semibold" style={{ color: '#333333' }}>
                {doctorData.name || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: '#666666' }}>CRM + UF</p>
              <p className="text-base" style={{ color: '#333333' }}>
                {crmNumber !== 'N/A' ? `CRM-${crmNumber}${crmUF !== 'N/A' ? `/${crmUF}` : ''}` : 'N/A'}
              </p>
            </div>
            {doctorData.specialization && (
              <div>
                <p className="text-xs mb-1" style={{ color: '#666666' }}>Especialidade</p>
                <p className="text-base" style={{ color: '#333333' }}>{doctorData.specialization}</p>
              </div>
            )}
          </div>
          
          {/* Área de Assinatura */}
          <div className="mt-6 pt-4 border-t" style={{ borderColor: '#EAEAEA' }}>
            <p className="text-xs mb-2" style={{ color: '#666666' }}>Assinatura</p>
            <div className="h-16 border-b-2 border-dashed flex items-center" style={{ borderColor: '#EAEAEA' }}>
              <p className="text-xs italic" style={{ color: '#999999' }}>
                Assinatura Digital - Receita emitida através da plataforma CannaLize
              </p>
            </div>
          </div>
        </div>

        {/* ⚖️ RODAPÉ LEGAL + RASTREABILIDADE */}
        <div className="border-t-2 pt-6" style={{ borderColor: '#EAEAEA' }}>
          <div className="space-y-2 text-xs leading-relaxed" style={{ color: '#666666' }}>
            <p className="font-medium" style={{ color: '#333333' }}>
              Prescrição realizada para fins medicinais conforme legislação vigente e normas da Anvisa.
            </p>
            <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t" style={{ borderColor: '#EAEAEA' }}>
              <div className="flex items-center gap-2">
                <Hash size={12} style={{ color: '#1F5E3B' }} />
                <span>
                  <span className="font-medium">Hash: </span>
                  <span className="font-mono">{documentHash}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={12} style={{ color: '#1F5E3B' }} />
                <span>
                  <span className="font-medium">Data/Hora: </span>
                  {issuedDateFormatted} {issuedTimeFormatted}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Shield size={12} style={{ color: '#1F5E3B' }} />
                <span>
                  <span className="font-medium">Sistema: </span>
                  CannaLize
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
