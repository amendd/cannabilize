import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Criar templates padrão
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const defaultTemplates = [
      // Templates para Pacientes
      {
        code: 'ACCOUNT_WELCOME',
        name: 'Boas-vindas',
        description: 'Enviada quando o paciente é novo (primeiro agendamento)',
        category: 'PACIENT',
        enabled: true,
        content: `👋 *Bem-vindo(a) ao CannabiLizi!*

Olá {{patientName}}!

Ficamos felizes em tê-lo(a) conosco. Aqui você terá acesso a:

✅ Consultas médicas especializadas em cannabis medicinal
✅ Receitas digitais seguras
✅ Acompanhamento do seu tratamento
✅ Carteirinha digital

Qualquer dúvida, estamos à disposição.

CannabiLizi 💚`,
        variables: JSON.stringify({ patientName: 'Nome do paciente' }),
      },
      {
        code: 'ACCOUNT_SETUP',
        name: 'Conclusão de Cadastro',
        description: 'Enviada quando o paciente precisa definir senha (link de setup)',
        category: 'PACIENT',
        enabled: true,
        content: `🔐 *Conclua seu cadastro*

Olá {{patientName}}!

Para acessar sua conta no CannabiLizi e acompanhar consultas e receitas, defina sua senha:

🔗 {{setupUrl}}

⏰ Este link expira em 7 dias.

Se você não solicitou este link, ignore esta mensagem.

CannabiLizi 💚`,
        variables: JSON.stringify({
          patientName: 'Nome do paciente',
          setupUrl: 'Link para definir senha',
        }),
      },
      {
        code: 'CONSULTATION_CONFIRMED',
        name: 'Confirmação de Consulta',
        description: 'Enviada quando uma consulta é agendada/confirmada',
        category: 'PACIENT',
        enabled: true,
        content: `📅 *Consulta Agendada com Sucesso!*

Olá {{patientName}}! Sua consulta foi confirmada:

👨‍⚕️ *Médico:* Dr. {{doctorName}}
📅 *Data:* {{date}}
⏰ *Horário:* {{time}}
{{#meetingLink}}🔗 *Link:* {{meetingLink}}{{/meetingLink}}

{{#platform}}💻 A consulta será realizada via {{platform}}.{{/platform}}

Em caso de dúvidas, estamos à disposição.

CannabiLizi 💚`,
        variables: JSON.stringify({
          patientName: 'Nome do paciente',
          doctorName: 'Nome do médico',
          date: 'Data da consulta',
          time: 'Horário da consulta',
          meetingLink: 'Link da reunião (opcional)',
          platform: 'Plataforma (opcional)',
        }),
      },
      {
        code: 'PAYMENT_CONFIRMED',
        name: 'Confirmação de Pagamento',
        description: 'Enviada quando um pagamento é confirmado',
        category: 'PACIENT',
        enabled: true,
        content: `✅ *Pagamento Confirmado!*

Olá {{patientName}}! Seu pagamento foi processado:

💰 *Valor:* R$ {{amount}}
📅 *Data:* {{date}}
{{#transactionId}}📄 *ID:* {{transactionId}}{{/transactionId}}

Sua consulta está confirmada!

CannabiLizi 💚`,
        variables: JSON.stringify({
          patientName: 'Nome do paciente',
          amount: 'Valor do pagamento',
          date: 'Data do pagamento',
          transactionId: 'ID da transação (opcional)',
        }),
      },
      {
        code: 'PRESCRIPTION_ISSUED',
        name: 'Receita Emitida',
        description: 'Enviada quando uma receita médica é emitida',
        category: 'PACIENT',
        enabled: true,
        content: `📋 *Receita Médica Emitida*

Olá {{patientName}}! Sua receita foi emitida:

👨‍⚕️ *Médico:* Dr. {{doctorName}}
📅 *Data:* {{date}}
{{#medications}}💊 *Medicamentos:* {{medications}}{{/medications}}

📄 Acesse sua área do paciente para visualizar e baixar a receita.

CannabiLizi 💚`,
        variables: JSON.stringify({
          patientName: 'Nome do paciente',
          doctorName: 'Nome do médico',
          date: 'Data da receita',
          medications: 'Lista de medicamentos (opcional)',
        }),
      },
      {
        code: 'RESCHEDULE_INVITE',
        name: 'Convite para Adiantar Consulta',
        description: 'Enviada quando médico oferece adiantar consulta',
        category: 'PACIENT',
        enabled: true,
        content: `🎯 *Oportunidade de Adiantar Consulta!*

Olá {{patientName}}! O Dr. {{doctorName}} tem disponibilidade para adiantar sua consulta:

📅 *Data Atual:* {{currentDate}} às {{currentTime}}
📅 *Nova Data:* {{newDate}} às {{newTime}}

✅ *Aceitar:* {{acceptLink}}
❌ *Recusar:* {{rejectLink}}

⏱️ Este convite é válido por 24 horas.

CannabiLizi 💚`,
        variables: JSON.stringify({
          patientName: 'Nome do paciente',
          doctorName: 'Nome do médico',
          currentDate: 'Data atual da consulta',
          currentTime: 'Horário atual',
          newDate: 'Nova data proposta',
          newTime: 'Novo horário proposto',
          acceptLink: 'Link para aceitar',
          rejectLink: 'Link para recusar',
        }),
      },
      {
        code: 'CONSULTATION_REMINDER_1H',
        name: 'Lembrete de Consulta (1h antes)',
        description: 'Enviada 1 hora antes da consulta',
        category: 'PACIENT',
        enabled: true,
        content: `⏰ *Lembrete de Consulta*

Olá {{patientName}}! Sua consulta começa em 1 hora!

👨‍⚕️ *Médico:* Dr. {{doctorName}}
⏰ *Horário:* {{time}}
{{#meetingLink}}🔗 *Link:* {{meetingLink}}{{/meetingLink}}

Por favor, esteja pronto para a consulta.

CannabiLizi 💚`,
        variables: JSON.stringify({
          patientName: 'Nome do paciente',
          doctorName: 'Nome do médico',
          time: 'Horário',
          meetingLink: 'Link da reunião (opcional)',
        }),
      },
      {
        code: 'CONSULTATION_REMINDER_10MIN',
        name: 'Lembrete de Consulta (10 min antes)',
        description: 'Enviada 10 minutos antes da consulta',
        category: 'PACIENT',
        enabled: true,
        content: `⏰ *Sua consulta começa em 10 minutos!*

Olá {{patientName}}!

👨‍⚕️ *Médico:* Dr. {{doctorName}}
⏰ *Horário:* {{time}}
{{#meetingLink}}🔗 *Link:* {{meetingLink}}{{/meetingLink}}

Entre na sala alguns minutos antes. Até já!

CannabiLizi 💚`,
        variables: JSON.stringify({
          patientName: 'Nome do paciente',
          doctorName: 'Nome do médico',
          time: 'Horário',
          meetingLink: 'Link da reunião (opcional)',
        }),
      },
      // Templates para Médicos
      {
        code: 'DOCTOR_CONSULTATION_ASSIGNED',
        name: 'Nova Consulta Designada',
        description: 'Enviada quando um médico é designado para uma consulta',
        category: 'DOCTOR',
        enabled: true,
        content: `🔔 *Nova Consulta Designada*

Dr. {{doctorName}}! Você foi designado para uma nova consulta:

👤 *Paciente:* {{patientName}}
📧 Email: {{patientEmail}}
{{#patientPhone}}📱 Telefone: {{patientPhone}}{{/patientPhone}}
📅 *Data:* {{date}}
⏰ *Horário:* {{time}}

{{#consultationLink}}📋 Ver consulta (anamnese, documentos): {{consultationLink}}{{/consultationLink}}

CannabiLizi 💚`,
        variables: JSON.stringify({
          doctorName: 'Nome do médico',
          patientName: 'Nome do paciente',
          patientEmail: 'Email do paciente',
          patientPhone: 'Telefone do paciente (opcional)',
          date: 'Data da consulta',
          time: 'Horário da consulta',
          consultationLink: 'Link da consulta (anamnese, documentos)',
        }),
      },
      // Templates para Admins
      {
        code: 'ADMIN_CONSULTATION_SCHEDULED',
        name: 'Nova Consulta Agendada',
        description: 'Enviada quando uma nova consulta é agendada no sistema',
        category: 'ADMIN',
        enabled: true,
        content: `🔔 *Nova Consulta Agendada*

Nova consulta no sistema:

👤 *Paciente:* {{patientName}}
👨‍⚕️ *Médico:* {{doctorName}}
📅 *Data:* {{date}}
⏰ *Horário:* {{time}}
💰 *Valor:* R$ {{amount}}
💳 *Forma de pagamento:* {{paymentMethod}}

📋 Ver: [Link Admin]

CannabiLizi 💚`,
        variables: JSON.stringify({
          patientName: 'Nome do paciente',
          doctorName: 'Nome do médico',
          date: 'Data da consulta',
          time: 'Horário da consulta',
          amount: 'Valor da consulta',
          paymentMethod: 'Forma de pagamento (ou Aguardando pagamento)',
        }),
      },
    ];

    // Verificar se o modelo existe no Prisma Client
    if (!prisma.whatsAppTemplate) {
      console.error('Modelo WhatsAppTemplate não encontrado no Prisma Client');
      return NextResponse.json(
        { 
          error: 'Modelo WhatsAppTemplate não encontrado. Execute: npx prisma generate',
          code: 'MODEL_NOT_FOUND'
        },
        { status: 500 }
      );
    }

    // Criar templates (ignorar se já existirem)
    const created = [];
    const errors = [];
    
    for (const template of defaultTemplates) {
      try {
        // Validar dados antes de inserir
        if (!template.code || !template.name || !template.category || !template.content) {
          throw new Error(`Template ${template.code} está incompleto: faltam campos obrigatórios`);
        }

        const createdTemplate = await prisma.whatsAppTemplate.upsert({
          where: { code: template.code },
          update: {
            name: template.name,
            description: template.description,
            category: template.category,
            enabled: template.enabled,
            content: template.content,
            defaultContent: template.content,
            variables: template.variables,
          },
          create: {
            code: template.code,
            name: template.name,
            description: template.description,
            category: template.category,
            enabled: template.enabled,
            content: template.content,
            defaultContent: template.content,
            variables: template.variables,
          },
        });
        created.push(createdTemplate);
        console.log(`Template ${template.code} criado/atualizado com sucesso`);
      } catch (error: any) {
        console.error(`Erro ao criar template ${template.code}:`, error);
        console.error(`Detalhes do erro:`, {
          code: error?.code,
          message: error?.message,
          meta: error?.meta,
          stack: error?.stack?.split('\n').slice(0, 5).join('\n'),
        });
        errors.push({
          code: template.code,
          error: error?.message || 'Erro desconhecido',
          codeError: error?.code,
          details: process.env.NODE_ENV === 'development' ? {
            meta: error?.meta,
            stack: error?.stack?.split('\n').slice(0, 3).join('\n'),
          } : undefined,
        });
      }
    }

    if (errors.length > 0) {
      console.error('Erros ao criar templates:', errors);
    }

    return NextResponse.json({
      success: true,
      message: `${created.length} templates criados/atualizados${errors.length > 0 ? `, ${errors.length} com erro` : ''}`,
      templates: created,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Erro ao criar templates padrão:', error);
    
    // Verificar se é erro de tabela não existente
    if (error?.code === 'P2021' || error?.message?.includes('does not exist') || error?.message?.includes('não existe')) {
      return NextResponse.json(
        { 
          error: 'Tabela de templates não existe no banco de dados. Execute: npx prisma db push',
          code: 'TABLE_NOT_FOUND',
          details: error?.message 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Erro ao criar templates padrão',
        code: error?.code || 'UNKNOWN',
        details: error?.message || 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
