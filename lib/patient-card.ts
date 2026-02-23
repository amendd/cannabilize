import QRCode from 'qrcode';
import { prisma } from './prisma';

/**
 * Gera um QR code em base64 para a carteirinha do paciente
 * O QR code aponta para uma URL pública que exibe a receita
 */
export async function generateQRCode(data: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2,
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Erro ao gerar QR code:', error);
    throw new Error('Falha ao gerar QR code');
  }
}

/**
 * Cria uma solicitação de carteirinha (status PENDING)
 * A carteirinha só será gerada após aprovação do admin
 */
export async function createPatientCardRequest(
  patientId: string,
  prescriptionId: string
): Promise<any> {
  try {
    // Verificar se já existe uma solicitação
    const existingCard = await prisma.patientCard.findUnique({
      where: { patientId },
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const ensureQr = async (cardId: string) => {
      const qrCodeData = `${baseUrl}/carteirinha/${cardId}`;
      const qrCodeUrl = await generateQRCode(qrCodeData);
      return { qrCodeData, qrCodeUrl };
    };

    if (existingCard) {
      // Se já existe e está aprovada, não criar nova
      if (existingCard.approvalStatus === 'APPROVED') {
        return existingCard;
      }
      // Se está pendente ou rejeitada, atualizar com nova receita
      const updated = await prisma.patientCard.update({
        where: { patientId },
        data: {
          activePrescriptionId: prescriptionId,
          approvalStatus: 'PENDING',
          status: 'PENDING',
          rejectionReason: null,
          updatedAt: new Date(),
        },
      });
      // Garantir que exista um QR code da carteirinha (mesmo em PENDING)
      if (!updated.qrCodeUrl) {
        const qr = await ensureQr(updated.id);
        return await prisma.patientCard.update({
          where: { patientId },
          data: {
            qrCodeUrl: qr.qrCodeUrl,
            qrCodeData: qr.qrCodeData,
            updatedAt: new Date(),
          },
        });
      }
      return updated;
    }

    // Criar nova solicitação
    const patientCard = await prisma.patientCard.create({
      data: {
        patientId,
        activePrescriptionId: prescriptionId,
        approvalStatus: 'PENDING',
        status: 'PENDING',
      },
    });

    // Gerar QR code da carteirinha (mesmo pendente) apontando para a validação pública
    try {
      const qr = await ensureQr(patientCard.id);
      const updated = await prisma.patientCard.update({
        where: { patientId },
        data: {
          qrCodeUrl: qr.qrCodeUrl,
          qrCodeData: qr.qrCodeData,
          updatedAt: new Date(),
        },
      });
      return updated;
    } catch (qrError) {
      console.error('Erro ao gerar QR code da carteirinha (não crítico):', qrError);
      return patientCard;
    }
  } catch (error) {
    console.error('Erro ao criar solicitação de carteirinha:', error);
    throw error;
  }
}

/**
 * Aprova e gera a carteirinha digital do paciente
 * Esta função só deve ser chamada pelo admin após aprovação
 */
export async function approveAndGeneratePatientCard(
  patientId: string,
  approvedBy: string
): Promise<any> {
  try {
    // Buscar solicitação pendente
    const cardRequest = await prisma.patientCard.findUnique({
      where: { patientId },
      include: {
        activePrescription: true,
        patient: true,
      },
    });

    if (!cardRequest) {
      throw new Error('Solicitação de carteirinha não encontrada');
    }

    if (!cardRequest.activePrescription) {
      throw new Error('Receita ativa não encontrada');
    }

    // Gerar número único da carteirinha (formato: CC-YYYYMMDD-XXXX)
    const cardNumber = `CC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${patientId.substring(0, 4).toUpperCase()}`;

    // URL pública da carteirinha (QR exclusivo da carteirinha, diferente do QR de autenticidade da receita)
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const qrCodeData = `${baseUrl}/carteirinha/${cardRequest.id}`;

    // Gerar QR code
    const qrCodeUrl = await generateQRCode(qrCodeData);

    // Atualizar carteirinha com dados gerados
    const patientCard = await prisma.patientCard.update({
      where: { patientId },
      data: {
        cardNumber,
        qrCodeUrl,
        qrCodeData,
        approvalStatus: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
        issuedAt: new Date(),
        expiresAt: cardRequest.activePrescription.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        rejectionReason: null,
        updatedAt: new Date(),
      },
    });

    return patientCard;
  } catch (error) {
    console.error('Erro ao aprovar e gerar carteirinha:', error);
    throw error;
  }
}

/** Gera ou atualiza a solicitação de carteirinha (compatível com a API). */
export async function generateOrUpdatePatientCard(
  patientId: string,
  prescriptionId: string
): Promise<any> {
  return createPatientCardRequest(patientId, prescriptionId);
}

/**
 * Busca a carteirinha do paciente
 */
export async function getPatientCard(patientId: string) {
  try {
    const card = await prisma.patientCard.findUnique({
      where: { patientId },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            cpf: true,
            email: true,
            phone: true,
            birthDate: true,
            address: true,
            image: true,
          },
        },
        activePrescription: {
          include: {
            doctor: {
              select: {
                name: true,
                crm: true,
              },
            },
            consultation: {
              select: {
                scheduledAt: true,
              },
            },
          },
        },
      },
    });

    return card;
  } catch (error) {
    console.error('Erro ao buscar carteirinha:', error);
    throw error;
  }
}
