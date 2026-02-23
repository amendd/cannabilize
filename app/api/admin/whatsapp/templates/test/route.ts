import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { generateMessage } from '@/lib/whatsapp-templates-service';
import { formatPhoneNumber } from '@/lib/whatsapp';
import { getAppOrigin } from '@/lib/app-url';

// POST - Testar template enviando mensagem
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { templateId, phoneNumber } = body;

    if (!templateId || !phoneNumber) {
      return NextResponse.json(
        { error: 'Template ID e número de telefone são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar template
    const template = await prisma.whatsAppTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se WhatsApp está configurado
    const whatsappConfig = await prisma.whatsAppConfig.findFirst({
      where: { enabled: true },
    });

    if (!whatsappConfig) {
      return NextResponse.json(
        { error: 'WhatsApp não está configurado ou habilitado' },
        { status: 400 }
      );
    }

    // Gerar dados de exemplo baseados no template
    const exampleData = generateExampleData(template.code, template.variables);

    // Processar template com dados de exemplo
    const message = await generateMessage(
      template.code,
      exampleData,
      template.content
    );

    // Formatar número de telefone
    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Enviar mensagem
    const result = await sendWhatsAppMessage({
      to: formattedPhone,
      message,
      template: template.code,
    });

    return NextResponse.json({
      success: true,
      message: 'Mensagem de teste enviada com sucesso!',
      messageId: result.messageId,
    });
  } catch (error: any) {
    console.error('Erro ao testar template:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao enviar mensagem de teste' },
      { status: 500 }
    );
  }
}

/**
 * Gera dados de exemplo baseados no código do template
 */
function generateExampleData(templateCode: string, variablesJson: string | null): Record<string, any> {
  // Dados padrão para todos os templates
  const defaultData: Record<string, any> = {
    patientName: 'João Silva',
    doctorName: 'Dr. Carlos Mendes',
    date: new Date().toLocaleDateString('pt-BR'),
    time: '14:30',
    amount: '150,00',
    transactionId: 'TXN-123456',
    patientEmail: 'joao.silva@email.com',
    patientPhone: '+55 79 99999-9999',
    medications: 'Canabidiol 10mg, THC 5mg',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    platform: 'Google Meet',
    currentDate: new Date().toLocaleDateString('pt-BR'),
    currentTime: '16:00',
    newDate: new Date(Date.now() + 86400000).toLocaleDateString('pt-BR'),
    newTime: '10:00',
    acceptLink: 'https://app.cannalize.com.br/consultas/123/aceitar',
    rejectLink: 'https://app.cannalize.com.br/consultas/123/recusar',
    consultationId: 'CONS-123456',
  };

  // Dados específicos por template
  const templateSpecificData: Record<string, Record<string, any>> = {
    CONSULTATION_CONFIRMED: {
      patientName: 'Maria Santos',
      doctorName: 'Dr. Ana Costa',
      date: new Date(Date.now() + 86400000 * 3).toLocaleDateString('pt-BR'),
      time: '15:00',
      meetingLink: 'https://meet.google.com/test-123',
      platform: 'Google Meet',
    },
    PAYMENT_CONFIRMED: {
      patientName: 'Pedro Oliveira',
      amount: '200,00',
      date: new Date().toLocaleDateString('pt-BR'),
      transactionId: 'TXN-789012',
    },
    PRESCRIPTION_ISSUED: {
      patientName: 'Ana Paula',
      doctorName: 'Dr. Roberto Lima',
      date: new Date().toLocaleDateString('pt-BR'),
      medications: 'Canabidiol 20mg (2x ao dia), THC 10mg (1x ao dia)',
    },
    RESCHEDULE_INVITE: {
      patientName: 'Lucas Ferreira',
      doctorName: 'Dr. Mariana Souza',
      currentDate: new Date(Date.now() + 86400000 * 5).toLocaleDateString('pt-BR'),
      currentTime: '16:00',
      newDate: new Date(Date.now() + 86400000 * 2).toLocaleDateString('pt-BR'),
      newTime: '10:00',
      acceptLink: 'https://app.cannalize.com.br/consultas/test/aceitar',
      rejectLink: 'https://app.cannalize.com.br/consultas/test/recusar',
    },
    DOCTOR_CONSULTATION_ASSIGNED: {
      doctorName: 'Dr. Carlos Mendes',
      patientName: 'Fernanda Alves',
      patientEmail: 'fernanda.alves@email.com',
      patientPhone: '+55 79 98888-8888',
      date: new Date(Date.now() + 86400000 * 2).toLocaleDateString('pt-BR'),
      time: '14:00',
      consultationId: 'CONS-789012',
      consultationLink: `${getAppOrigin()}/medico/consultas/CONS-789012`,
    },
    ADMIN_CONSULTATION_SCHEDULED: {
      patientName: 'Ricardo Gomes',
      doctorName: 'Dr. Juliana Rocha',
      date: new Date(Date.now() + 86400000 * 4).toLocaleDateString('pt-BR'),
      time: '11:00',
      amount: '180,00',
      paymentMethod: 'PIX',
      consultationId: 'CONS-456789',
    },
  };

  // Mesclar dados padrão com dados específicos do template
  const specificData = templateSpecificData[templateCode] || {};
  const mergedData = { ...defaultData, ...specificData };

  // Se o template tem variáveis definidas, usar apenas essas
  if (variablesJson) {
    try {
      const variables = JSON.parse(variablesJson);
      const filteredData: Record<string, any> = {};
      
      Object.keys(variables).forEach(key => {
        if (mergedData[key] !== undefined) {
          filteredData[key] = mergedData[key];
        }
      });

      return Object.keys(filteredData).length > 0 ? filteredData : mergedData;
    } catch (error) {
      console.error('Erro ao processar variáveis do template:', error);
    }
  }

  return mergedData;
}
