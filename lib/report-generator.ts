import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Consultation, Prescription } from '@prisma/client';

export async function generateMedicalReport(
  consultation: Consultation & { patient: any; doctor: any },
  prescription?: Prescription
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = 800;
  const margin = 50;
  const lineHeight = 20;

  // Header
  page.drawText('LAUDO MÉDICO', {
    x: margin,
    y,
    size: 18,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  y -= 40;

  // Doctor Info
  page.drawText(`Médico Responsável: ${consultation.doctor?.name || 'N/A'}`, {
    x: margin,
    y,
    size: 12,
    font: boldFont,
  });
  y -= lineHeight;

  if (consultation.doctor?.crm) {
    page.drawText(`CRM: ${consultation.doctor.crm}`, {
      x: margin,
      y,
      size: 12,
      font,
    });
    y -= lineHeight;
  }

  y -= 20;

  // Patient Info
  page.drawText('DADOS DO PACIENTE:', {
    x: margin,
    y,
    size: 14,
    font: boldFont,
  });
  y -= lineHeight * 1.5;

  page.drawText(`Nome: ${consultation.patient.name}`, {
    x: margin,
    y,
    size: 12,
    font,
  });
  y -= lineHeight;

  if (consultation.patient.cpf) {
    page.drawText(`CPF: ${consultation.patient.cpf}`, {
      x: margin,
      y,
      size: 12,
      font,
    });
    y -= lineHeight;
  }

  if (consultation.patient.birthDate) {
    page.drawText(`Data de Nascimento: ${new Date(consultation.patient.birthDate).toLocaleDateString('pt-BR')}`, {
      x: margin,
      y,
      size: 12,
      font,
    });
    y -= lineHeight;
  }

  y -= 20;

  // Consultation Info
  page.drawText('DADOS DA CONSULTA:', {
    x: margin,
    y,
    size: 14,
    font: boldFont,
  });
  y -= lineHeight * 1.5;

  page.drawText(`Data da Consulta: ${new Date(consultation.scheduledAt).toLocaleDateString('pt-BR')}`, {
    x: margin,
    y,
    size: 12,
    font,
  });
  y -= lineHeight;

  page.drawText(`Status: ${consultation.status}`, {
    x: margin,
    y,
    size: 12,
    font,
  });
  y -= 30;

  // Anamnesis
  if (consultation.anamnesis) {
    page.drawText('ANAMNESE:', {
      x: margin,
      y,
      size: 14,
      font: boldFont,
    });
    y -= lineHeight * 1.5;

    const anamnesis = consultation.anamnesis as any;
    
    if (anamnesis.previousTreatments) {
      page.drawText('Tratamentos Anteriores:', {
        x: margin,
        y,
        size: 12,
        font: boldFont,
      });
      y -= lineHeight;

      const treatments = anamnesis.previousTreatments.split('\n');
      treatments.forEach((treatment: string) => {
        page.drawText(`  • ${treatment}`, {
          x: margin + 20,
          y,
          size: 11,
          font,
        });
        y -= lineHeight;
      });
      y -= 10;
    }

    if (anamnesis.currentMedications) {
      page.drawText('Medicamentos Atuais:', {
        x: margin,
        y,
        size: 12,
        font: boldFont,
      });
      y -= lineHeight;

      const medications = anamnesis.currentMedications.split('\n');
      medications.forEach((med: string) => {
        page.drawText(`  • ${med}`, {
          x: margin + 20,
          y,
          size: 11,
          font,
        });
        y -= lineHeight;
      });
      y -= 10;
    }

    if (anamnesis.allergies) {
      page.drawText(`Alergias: ${anamnesis.allergies}`, {
        x: margin,
        y,
        size: 12,
        font,
      });
      y -= lineHeight * 1.5;
    }
  }

  // Medical Notes
  if (consultation.notes) {
    y -= 20;
    page.drawText('OBSERVAÇÕES MÉDICAS:', {
      x: margin,
      y,
      size: 14,
      font: boldFont,
    });
    y -= lineHeight * 1.5;

    const notes = consultation.notes.split('\n');
    notes.forEach((note: string) => {
      page.drawText(note, {
        x: margin,
        y,
        size: 11,
        font,
      });
      y -= lineHeight;
    });
  }

  // Prescription Info
  if (prescription) {
    y -= 30;
    page.drawText('PRESCRIÇÃO MÉDICA:', {
      x: margin,
      y,
      size: 14,
      font: boldFont,
    });
    y -= lineHeight * 1.5;

    page.drawText(`Data de Emissão: ${new Date(prescription.issuedAt).toLocaleDateString('pt-BR')}`, {
      x: margin,
      y,
      size: 12,
      font,
    });
    y -= lineHeight;

    if (prescription.expiresAt) {
      page.drawText(`Validade: ${new Date(prescription.expiresAt).toLocaleDateString('pt-BR')}`, {
        x: margin,
        y,
        size: 12,
        font,
      });
      y -= lineHeight;
    }
  }

  // Footer
  y = 100;
  page.drawText('Este laudo foi emitido pela Cannabilize através de consulta médica online.', {
    x: margin,
    y,
    size: 10,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  y -= lineHeight;
  page.drawText(`Laudo gerado em ${new Date().toLocaleDateString('pt-BR')}`, {
    x: margin,
    y,
    size: 9,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  return pdfDoc.save();
}
