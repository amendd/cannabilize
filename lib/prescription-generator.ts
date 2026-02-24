import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Prescription } from '@prisma/client';

interface PrescriptionData {
  medications?: Array<{
    medicationName?: string;
    name?: string;
    productType?: string;
    composition?: string;
    spectrum?: string;
    route?: string;
    dosage?: string;
    instructions?: string;
    quantity?: string;
    initialDose?: string;
    escalation?: string;
    maxDose?: string;
    suggestedTimes?: string;
    duration?: string;
  }>;
  observations?: string;
  diagnosis?: string;
  cid10?: string | string[];
  emissionLocation?: string;
}

interface DoctorData {
  name: string;
  crm: string;
  specialization?: string;
  email?: string;
  phone?: string;
  cpf?: string;
  address?: string;
}

interface PatientData {
  name: string;
  cpf?: string;
  birthDate?: Date;
  address?: string;
  phone?: string;
  email?: string;
}

export async function generatePrescriptionPDF(
  prescription: Prescription,
  patientData: PatientData | string,
  doctorData: DoctorData | { name: string; crm: string },
  authenticityQrCodeUrl?: string,
  patientCardQrCodeUrl?: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595, 842]); // A4 size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Cores
  const darkGreen = rgb(0.122, 0.369, 0.231); // #1F5E3B
  const darkGray = rgb(0.2, 0.2, 0.2); // #333333
  const lightGray = rgb(0.918, 0.918, 0.918); // #EAEAEA
  const mediumGray = rgb(0.4, 0.4, 0.4); // #666666

  let y = 800;
  const margin = 50;
  const lineHeight = 16; // Aumentado de 14 para 16
  const sectionSpacing = 35; // Aumentado de 25 para 35
  const subsectionSpacing = 18; // Aumentado de 12 para 18
  const minBottomMargin = 100; // Aumentado de 80 para 100

  // pdf-lib com StandardFonts usa WinAnsi (não suporta emoji e alguns símbolos Unicode).
  // Sanitizamos textos para evitar erros do tipo: "WinAnsi cannot encode ...".
  const sanitizePdfText = (input: unknown): string => {
    const s = String(input ?? '');
    return s
      .replace(/\r?\n/g, ' ')
      .replace(/\u00A0/g, ' ')
      .replace(/[–—]/g, '-') // travessões
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      // remove tudo fora de Latin-1 (inclui emojis/símbolos)
      .replace(/[^\u0020-\u00FF]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const drawTextSafe = (text: unknown, options: any) => {
    page.drawText(sanitizePdfText(text), options);
  };

  // Helper para quebrar texto em múltiplas linhas
  const drawMultilineText = (text: string, x: number, startY: number, maxWidth: number, size: number, fontType: any, color: any): number => {
    const safe = sanitizePdfText(text);
    const words = safe ? safe.split(' ') : [];
    let line = '';
    let currentY = startY;
    let linesDrawn = 0;
    const maxLines = 15;
    
    for (const word of words) {
      if (linesDrawn >= maxLines) break;
      
      const testLine = line + (line ? ' ' : '') + word;
      const textWidth = fontType.widthOfTextAtSize(testLine, size);
      
      if (textWidth > maxWidth && line) {
        drawTextSafe(line, { x, y: currentY, size, font: fontType, color });
        currentY -= lineHeight;
        linesDrawn++;
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line && linesDrawn < maxLines) {
      drawTextSafe(line, { x, y: currentY, size, font: fontType, color });
      currentY -= lineHeight;
    }
    return currentY;
  };

  // Verificar espaço e criar nova página se necessário
  const checkAndAddPage = (requiredSpace: number) => {
    if (y - requiredSpace < minBottomMargin) {
      page = pdfDoc.addPage([595, 842]);
      y = 800;
      return true;
    }
    return false;
  };

  // Normalizar dados
  const patient = typeof patientData === 'string' 
    ? { name: patientData } 
    : patientData;
  
  const doctor = typeof doctorData === 'string'
    ? { name: doctorData, crm: '' }
    : doctorData;

  // Parsear prescriptionData
  const prescriptionData: PrescriptionData = typeof prescription.prescriptionData === 'string'
    ? JSON.parse(prescription.prescriptionData)
    : prescription.prescriptionData || {};

  // Extrair CRM e UF
  const crmParts = doctor.crm ? doctor.crm.split('-') : [];
  const crmNumber = crmParts[0]?.replace('CRM', '').trim() || doctor.crm || '';
  const crmUF = crmParts[1]?.trim() || '';

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
  const location = prescriptionData.emissionLocation || 'Brasil';
  const documentHash = prescription.id.slice(0, 16).toUpperCase();

  // ========== CABEÇALHO (Médico à esquerda, Logo à direita) ==========
  const headerY = 800;
  
  // Coluna esquerda: Dados do médico
  drawTextSafe(doctor.name, {
    x: margin,
    y: headerY,
    size: 13,
    font: boldFont,
    color: darkGray,
  });
  drawTextSafe('MEDICO', {
    x: margin,
    y: headerY - lineHeight * 1.5,
    size: 10,
    font: boldFont,
    color: darkGray,
  });
  drawTextSafe(`CRM: ${crmNumber}${crmUF ? `-${crmUF}` : ''}`, {
    x: margin,
    y: headerY - lineHeight * 3,
    size: 10,
    font,
    color: darkGray,
  });
  
  let currentDoctorY = headerY - lineHeight * 4.2;
  if (doctor.phone) {
    drawTextSafe(`Telefone: ${doctor.phone}`, {
      x: margin,
      y: currentDoctorY,
      size: 10,
      font,
      color: darkGray,
    });
    currentDoctorY -= lineHeight * 1.3;
  }
  
  let doctorInfoBottomY = currentDoctorY;
  if (doctor.address) {
    doctorInfoBottomY = drawMultilineText(doctor.address, margin, currentDoctorY, 280, 10, font, darkGray) - lineHeight * 0.5;
  }

  // Coluna direita: Logo Cannabilize
  const logoRightX = 350;
  drawTextSafe('Cannabilize', {
    x: logoRightX,
    y: headerY,
    size: 20,
    font: boldFont,
    color: darkGreen,
  });
  drawTextSafe('MEDICINA INTEGRATIVA', {
    x: logoRightX,
    y: headerY - lineHeight * 1.8,
    size: 9,
    font,
    color: mediumGray,
  });
  drawTextSafe('NUTROLOGIA E CANNABIS', {
    x: logoRightX,
    y: headerY - lineHeight * 3.2,
    size: 9,
    font,
    color: mediumGray,
  });

  // Linha separadora (usar o menor Y entre logo e info do médico)
  y = Math.min(doctorInfoBottomY, headerY - lineHeight * 4.5) - lineHeight * 2;
  page.drawLine({
    start: { x: margin, y },
    end: { x: 545, y },
    thickness: 1,
    color: darkGray,
  });
  y -= lineHeight * 2;

  // ========== NOME DO PACIENTE (em destaque) ==========
  checkAndAddPage(30);
  
  drawTextSafe(`Nome do Paciente: ${patient.name}`, {
    x: margin,
    y,
    size: 12,
    font: boldFont,
    color: darkGray,
  });
  y -= lineHeight * 2;

  // Linha separadora
  page.drawLine({
    start: { x: margin, y },
    end: { x: 545, y },
    thickness: 1,
    color: darkGray,
  });
  y -= lineHeight * 1.5;

  const cid10List = Array.isArray(prescriptionData.cid10)
    ? prescriptionData.cid10
    : prescriptionData.cid10
      ? [prescriptionData.cid10]
      : [];

  // ========== DIAGNÓSTICO (opcional, mais compacto) ==========
  if (cid10List.length > 0 || prescriptionData.diagnosis) {
    checkAndAddPage(50);
    
    if (cid10List.length > 0) {
      const cidLabel = `CID-10: ${cid10List.join(', ')}`;
      y = drawMultilineText(cidLabel, margin, y, 495, 10, boldFont, darkGray);
      y -= lineHeight * 0.5;
    }

    if (prescriptionData.diagnosis) {
      y = drawMultilineText(prescriptionData.diagnosis, margin, y, 495, 10, font, darkGray);
      y -= lineHeight * 1.5;
    }
    y -= lineHeight * 2;
  }

  // ========== RECEITA (Lista numerada simples) ==========
  if (prescriptionData.medications && prescriptionData.medications.length > 0) {
    const medLines = prescriptionData.medications.length * 15;
    checkAndAddPage(medLines);
    
    // Número da receita e tipo de uso
    const routeType = prescriptionData.medications[0]?.route || 'ORAL';
    const routeLabel = routeType === 'INHALATION' ? 'USO INALATORIO' : 
                      routeType === 'SUBLINGUAL' ? 'USO SUBLINGUAL' :
                      routeType === 'TOPICAL' ? 'USO TOPICO' : 'USO ORAL';
    
    drawTextSafe('1', {
      x: margin,
      y,
      size: 12,
      font: boldFont,
      color: darkGray,
    });
    drawTextSafe(routeLabel, {
      x: margin + 20,
      y,
      size: 12,
      font: boldFont,
      color: darkGray,
    });
    y -= lineHeight * 2;

    // Lista numerada de medicamentos (formato linha única, estilo da imagem)
    prescriptionData.medications.forEach((med, index) => {
      const medicationName = med.medicationName || med.name || 'Medicamento';
      
      // Construir linha completa do medicamento (formato: "1)PRODUTO COMPOSIÇÃO ---- QUANTIDADE DOSAGEM INSTRUÇÕES")
      // Seguindo o padrão da imagem: "1)FLOR DE CANNABIS SATIVA IN NATURA RICA EM CBD 5G/PACOTE---- 05 PACOTES/MÊS VAPORIZAR SE CRISE."
      let medLine = `${index + 1})${medicationName.toUpperCase()}`;
      
      // Adicionar composição se houver (formato: "RICA EM CBD" ou "RICA EM CBD E THC")
      if (med.composition) {
        // Simplificar composição para formato mais legível na linha
        const compUpper = med.composition.toUpperCase();
        if (compUpper.includes('CBD') && compUpper.includes('THC')) {
          medLine += ` RICA EM CBD E THC`;
        } else if (compUpper.includes('CBD')) {
          medLine += ` RICA EM CBD`;
        } else if (compUpper.includes('THC')) {
          medLine += ` RICA EM THC`;
        } else {
          // Se tiver outros canabinoides, adicionar resumo
          medLine += ` ${compUpper.split('/').slice(0, 2).join(' / ')}`;
        }
      }
      
      // Adicionar tipo de produto se houver (ex: "5G/PACOTE")
      if (med.productType) {
        const productTypeLabel = med.productType === 'FLOWER' ? 'IN NATURA' : 
                                 med.productType === 'OIL' ? 'OLEO' :
                                 med.productType === 'CAPSULES' ? 'CAPSULAS' :
                                 med.productType === 'GUMMIES' ? 'GUMMIES' :
                                 med.productType;
        medLine += ` ${productTypeLabel}`;
      }
      
      // Adicionar quantidade com separador "----"
      if (med.quantity) {
        medLine += `---- ${med.quantity.toUpperCase()}`;
      }
      
      // Adicionar dosagem/instruções
      if (med.dosage) {
        medLine += ` ${med.dosage.toUpperCase()}`;
      }
      if (med.instructions) {
        medLine += ` ${med.instructions.toUpperCase()}`;
      }
      
      // Desenhar linha completa (quebrar se necessário)
      const lineWidth = 495;
      if (font.widthOfTextAtSize(medLine, 10) > lineWidth) {
        y = drawMultilineText(medLine, margin, y, lineWidth, 10, font, darkGray);
      } else {
        drawTextSafe(medLine, {
          x: margin,
          y,
          size: 10,
          font,
          color: darkGray,
        });
        y -= lineHeight * 1.8;
      }
    });
    y -= lineHeight;
  }

  // ========== OBSERVAÇÕES (se houver) ==========
  if (prescriptionData.observations) {
    checkAndAddPage(80);
    y -= lineHeight * 1.5; // Espaço antes das observações
    y = drawMultilineText(prescriptionData.observations, margin, y, 495, 10, font, darkGray);
    y -= lineHeight * 2;
  }

  // ========== RODAPÉ (Duas colunas: Info médico + QR code) ==========
  const hasQrCodes = !!(authenticityQrCodeUrl || patientCardQrCodeUrl);
  const footerMinHeight = hasQrCodes ? 200 : 120;
  checkAndAddPage(footerMinHeight);

  // Para se aproximar do layout de referência, garantimos que o rodapé
  // fique consistentemente mais próximo da borda inferior da folha A4.
  // Se ainda houver muito espaço em branco, reposicionamos o início do rodapé.
  if (y > 220) {
    y = 220;
  }
  
  // Linha separadora acima do bloco do rodapé
  page.drawLine({
    start: { x: margin, y },
    end: { x: 545, y },
    thickness: 1,
    color: darkGray,
  });
  y -= lineHeight * 1.5;

  // Helper para embutir QR code
  const embedQrPng = async (dataOrUrl: string) => {
    if (dataOrUrl.startsWith('data:image')) {
      const base64Data = dataOrUrl.split(',')[1] || '';
      const imageBytes = Uint8Array.from(Buffer.from(base64Data, 'base64'));
      return await pdfDoc.embedPng(imageBytes);
    }
    const qrCodeResponse = await fetch(dataOrUrl);
    const qrCodeBuffer = await qrCodeResponse.arrayBuffer();
    return await pdfDoc.embedPng(qrCodeBuffer);
  };

  const footerStartY = y;
  const footerLeftWidth = hasQrCodes ? 300 : 495;

  // ========== COLUNA ESQUERDA: Informações do médico ==========
  let footerLeftY = footerStartY;
  
  // Dados completos do médico com melhor espaçamento
  const doctorInfo = [
    `Medico(a): ${doctor.name}`,
    `CRM: ${crmNumber}${crmUF ? ` UF: ${crmUF}` : ''}`,
    doctor.address ? `Endereco: ${doctor.address}` : '',
    doctor.phone ? `Telefone: ${doctor.phone}` : '',
    doctor.email ? `Email: ${doctor.email}` : '',
  ].filter(Boolean);

  doctorInfo.forEach((info) => {
    drawTextSafe(info, {
      x: margin,
      y: footerLeftY,
      size: 9,
      font,
      color: darkGray,
    });
    footerLeftY -= lineHeight * 1.5; // Aumentado de 1.2 para 1.5
  });

  footerLeftY -= lineHeight * 1;
  drawTextSafe('Prescricao Digital Emitida em Cannabilize', {
    x: margin,
    y: footerLeftY,
    size: 8,
    font: boldFont,
    color: mediumGray,
  });
  footerLeftY -= lineHeight * 1.5;

  drawTextSafe(`Emissao: ${issuedDateFormatted} - ${issuedTimeFormatted}`, {
    x: margin,
    y: footerLeftY,
    size: 8,
    font,
    color: darkGray,
  });
  footerLeftY -= lineHeight * 2;

  // Caixa de validação digital (verde com checkmark)
  const validationBoxY = footerLeftY - 28;
  page.drawRectangle({
    x: margin,
    y: validationBoxY,
    width: 280,
    height: 28,
    color: darkGreen,
  });
  
  drawTextSafe('✓ Assinada e Validada Digitalmente', {
    x: margin + 5,
    y: validationBoxY + 8,
    size: 9,
    font: boldFont,
    color: rgb(1, 1, 1), // branco
  });
  
  footerLeftY = validationBoxY - lineHeight * 1.5;
  drawTextSafe(`Assinado digitalmente por ${doctor.name.toUpperCase()} CRM ${crmNumber}${crmUF ? `-${crmUF}` : ''}`, {
    x: margin,
    y: footerLeftY,
    size: 8,
    font,
    color: darkGray,
  });

  // ========== COLUNA DIREITA: QR Code e informações ==========
  if (hasQrCodes) {
    const qrSize = 110; // QR code maior (aumentado de 100 para 110)
    const qrRightX = 320;
    const qrRightY = footerStartY;

    // Informações acima do QR com melhor espaçamento
    let qrInfoY = footerStartY;
    drawTextSafe(`ID da Receita: ${prescription.id.slice(0, 8).toUpperCase()}`, {
      x: qrRightX,
      y: qrInfoY,
      size: 9,
      font: boldFont,
      color: darkGray,
    });
    qrInfoY -= lineHeight * 1.8;

    drawTextSafe(`Codigo do Paciente: ${prescription.patientId.slice(0, 4)}`, {
      x: qrRightX,
      y: qrInfoY,
      size: 8,
      font,
      color: darkGray,
    });
    qrInfoY -= lineHeight * 2;

    // QR Code de Autenticidade (principal, grande)
    if (authenticityQrCodeUrl) {
      try {
        const qr = await embedQrPng(authenticityQrCodeUrl);
        page.drawImage(qr, {
          x: qrRightX,
          y: qrInfoY - qrSize,
          width: qrSize,
          height: qrSize,
        });
      } catch (error) {
        console.error('Erro ao adicionar QR de autenticidade ao PDF:', error);
      }
    }

    // Informações abaixo do QR com melhor espaçamento
    qrInfoY = qrInfoY - qrSize - lineHeight * 1.8;
    drawTextSafe('Dispensacao pelo site', {
      x: qrRightX,
      y: qrInfoY,
      size: 8,
      font,
      color: mediumGray,
    });
    qrInfoY -= lineHeight * 1.3;
    drawTextSafe('cannalize.com.br', {
      x: qrRightX,
      y: qrInfoY,
      size: 8,
      font: boldFont,
      color: darkGreen,
    });
  } else {
    // Se não houver QR, mostrar apenas informações
    drawTextSafe(`ID da Receita: ${prescription.id.slice(0, 8).toUpperCase()}`, {
      x: margin,
      y: footerLeftY - lineHeight * 2,
      size: 9,
      font: boldFont,
      color: darkGray,
    });
  }

  return pdfDoc.save();
}
