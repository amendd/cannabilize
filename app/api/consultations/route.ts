import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { notifyConsultationScheduled } from '@/lib/notifications';
import { Prisma } from '@prisma/client';
import {
  assignDoctorToConsultation,
  isSlotAvailable,
  isDoctorOnline,
} from '@/lib/availability';
import {
  getMinAdvanceBookingMinutesOnline,
  getMinAdvanceBookingMinutesOffline,
} from '@/lib/consultation-config';
import {
  validateFormSubmission,
  extractFormData,
} from '@/lib/security/validate-form-submission';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  sendConsultationConfirmationEmail,
  sendAccountWelcomeEmail,
} from '@/lib/email';
import { createAndSendSetupToken } from '@/lib/account-setup';

const consultationSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(10),
  cpf: z.string().min(11),
  birthDate: z.string(),
  pathologies: z.array(z.string()).min(1),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/),
  anamnesis: z.object({
    previousTreatments: z.string().optional(),
    currentMedications: z.string().optional(),
    allergies: z.string().optional(),
    additionalInfo: z.string().optional(),
  }),
  // Campos de segurança (não validados pelo schema Zod)
  recaptchaToken: z.string().optional(),
  honeypot: z.string().optional(),
  formStartTime: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Extrair dados do formulário
    const body = await extractFormData(request);
    
    // Validar segurança ANTES de validar dados do negócio
    const securityValidation = await validateFormSubmission(
      body,
      request,
      {
        formType: 'appointment',
        requireRecaptcha: !!process.env.RECAPTCHA_SECRET_KEY,
        requireHoneypot: true,
        requireFillTime: true,
        fieldCount: 12, // Aproximadamente o número de campos no formulário
        allowedFields: [
          'name', 'email', 'phone', 'cpf', 'birthDate',
          'pathologies', 'scheduledDate', 'scheduledTime',
          'anamnesis', 'recaptchaToken', 'honeypot', 'formStartTime'
        ],
      }
    );

    if (!securityValidation.valid) {
      return NextResponse.json(
        {
          error: 'Atividade suspeita detectada',
          details: securityValidation.errors,
        },
        { status: 403 }
      );
    }

    // Remover campos de segurança antes de validar com Zod
    const { recaptchaToken, honeypot, formStartTime, ...formData } = body;
    
    // Validar dados do negócio
    const validationResult = consultationSchema.omit({
      recaptchaToken: true,
      honeypot: true,
      formStartTime: true,
    }).safeParse(formData);
    
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }
    
    const data = validationResult.data;

    // Criar ou buscar usuário
    let user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    const isNewUser = !user;
    if (!user) {
      // Evitar erro 500: CPF já cadastrado com outro email (constraint única)
      // Nesse caso, orientar o paciente a usar o mesmo email / fazer login.
      if (data.cpf) {
        const existingCpfUser = await prisma.user.findFirst({
          where: { cpf: data.cpf },
          select: { id: true, email: true },
        });
        if (existingCpfUser) {
          return NextResponse.json(
            {
              error:
                'CPF já cadastrado. Use o mesmo e-mail do cadastro ou faça login para agendar.',
            },
            { status: 400 }
          );
        }
      }

      user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          phone: data.phone,
          cpf: data.cpf,
          birthDate: new Date(data.birthDate),
          role: 'PATIENT',
        },
      });

      // Enviar email de boas-vindas para novos usuários (não bloqueia a resposta)
      sendAccountWelcomeEmail({
        to: data.email,
        patientName: data.name,
      }).catch(error => {
        console.error('Erro ao enviar email de boas-vindas:', error);
      });

      // Enviar email de conclusão de cadastro (para definir senha)
      // Só envia se o usuário não tiver senha
      if (!user.password) {
        const origin = new URL(request.url).origin;
        createAndSendSetupToken(user.id, user.email, user.name, origin).catch(
          error => {
            console.error('Erro ao enviar email de conclusão de cadastro:', error);
          }
        );
      }
    }
    
    // Se usuário já existe, completar dados ausentes (sem bloquear agendamento)
    // (ex.: paciente agendou antes sem CPF/telefone, agora preencheu)
    if (user) {
      const shouldUpdate =
        (!user.phone && data.phone) ||
        (!user.cpf && data.cpf) ||
        (!user.birthDate && data.birthDate);

      if (shouldUpdate) {
        try {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              phone: user.phone || data.phone,
              cpf: user.cpf || data.cpf,
              birthDate: user.birthDate || new Date(data.birthDate),
            },
          });
        } catch (e) {
          // Se cair em constraint única de CPF ao tentar completar, retornar mensagem amigável.
          if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            const target = (e.meta?.target as string[] | undefined) || [];
            if (target.includes('cpf')) {
              return NextResponse.json(
                {
                  error:
                    'CPF já cadastrado. Use o mesmo e-mail do cadastro ou faça login para agendar.',
                },
                { status: 400 }
              );
            }
          }
          throw e;
        }
      }
    }

    // Criar patologias se não existirem e associar ao paciente
    for (const pathologyName of data.pathologies) {
      let pathology = await prisma.pathology.findUnique({
        where: { name: pathologyName },
      });

      if (!pathology) {
        pathology = await prisma.pathology.create({
          data: { name: pathologyName, active: true },
        });
      }

      // Associar patologia ao paciente
      await prisma.patientPathology.upsert({
        where: {
          patientId_pathologyId: {
            patientId: user.id,
            pathologyId: pathology.id,
          },
        },
        create: {
          patientId: user.id,
          pathologyId: pathology.id,
        },
        update: {},
      });
    }

    const now = new Date();
    const [year, month, day] = data.scheduledDate.split('-').map(Number);
    const [hours, minutes] = data.scheduledTime.split(':').map(Number);
    const scheduledAt = new Date(year, month - 1, day, hours, minutes, 0, 0);

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const scheduledDay = new Date(year, month - 1, day);
    const isToday = scheduledDay.getTime() === today.getTime();

    // Bloqueio definitivo: não permitir horário já passado (ou muito próximo)
    // (protege contra slots "vencidos" por cache/atraso/fluxo de pagamento)
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    if (scheduledAt < fiveMinutesFromNow) {
      return NextResponse.json(
        { error: 'O horário selecionado já passou. Por favor, selecione um horário futuro.' },
        { status: 400 }
      );
    }
    
    // Verificar se o horário está disponível primeiro (para obter o médico atribuído)
    const slotAvailable = await isSlotAvailable(data.scheduledDate, data.scheduledTime);
    if (!slotAvailable) {
      return NextResponse.json(
        { error: 'Horário não disponível. Por favor, selecione outro horário.' },
        { status: 400 }
      );
    }

    // Atribuir médico automaticamente usando sistema de distribuição
    const assignedDoctorId = await assignDoctorToConsultation(
      data.scheduledDate,
      data.scheduledTime
    );

    if (!assignedDoctorId) {
      return NextResponse.json(
        { error: 'Nenhum médico disponível para este horário. Por favor, selecione outro horário.' },
        { status: 400 }
      );
    }

    // Se for hoje, verificar antecedência baseada no status do médico
    if (isToday) {
      const doctorIsOnline = await isDoctorOnline(assignedDoctorId);
      const minMinutesOnline = await getMinAdvanceBookingMinutesOnline();
      const minMinutesOffline = await getMinAdvanceBookingMinutesOffline();
      const requiredMinutes = doctorIsOnline ? minMinutesOnline : minMinutesOffline;
      const minTimeFromNow = new Date(now.getTime() + requiredMinutes * 60 * 1000);
      
      if (scheduledAt < minTimeFromNow) {
        return NextResponse.json(
          { 
            error: `Para agendamentos no dia atual, é necessário pelo menos ${requiredMinutes} minutos de antecedência${doctorIsOnline ? ' (médico online)' : ' (médico offline)'}.` 
          },
          { status: 400 }
        );
      }
    }

    // Converter anamnesis para string JSON (SQLite não suporta Json)
    const anamnesisString = data.anamnesis ? JSON.stringify(data.anamnesis) : null;

    const consultation = await prisma.consultation.create({
      data: {
        patientId: user.id,
        doctorId: assignedDoctorId,
        scheduledAt,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        status: 'SCHEDULED',
        anamnesis: anamnesisString,
        name: data.name,
        email: data.email,
        phone: data.phone,
      },
      include: {
        doctor: true,
      },
    });

    // Criar pagamento pendente
    await prisma.payment.create({
      data: {
        patientId: user.id,
        consultationId: consultation.id,
        amount: 50.0, // Float para SQLite
        currency: 'BRL',
        status: 'PENDING',
      },
    });

    // Buscar médico designado
    const doctor = await prisma.doctor.findUnique({
      where: { id: consultation.doctorId! },
      include: { user: true },
    });

    // Buscar admin para notificação
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    // Enviar notificações (não bloqueia a resposta)
    if (doctor || admin) {
      notifyConsultationScheduled({
        consultationId: consultation.id,
        patientName: data.name,
        patientEmail: data.email,
        patientPhone: data.phone,
        doctorName: doctor?.name || 'Não designado',
        doctorEmail: doctor?.email || doctor?.user?.email || '',
        doctorPhone: doctor?.phone || doctor?.user?.phone || undefined,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        adminEmail: admin?.email || undefined,
        adminPhone: admin?.phone || undefined,
      }).catch(error => {
        // Log do erro mas não falha a criação da consulta
        console.error('Erro ao enviar notificações:', error);
      });
    }

    // Email de confirmação para o paciente (não bloqueia a resposta)
    sendConsultationConfirmationEmail({
      to: data.email,
      patientName: data.name,
      consultationDateTime: scheduledAt,
      meetingLink: consultation.meetingLink || undefined,
    }).catch(error => {
      console.error('Erro ao enviar email de confirmação de consulta:', error);
    });

    return NextResponse.json({
      id: consultation.id,
      message: 'Consulta agendada com sucesso',
    });
  } catch (error) {
    console.error('Error creating consultation:', error);
    
    // Retornar mensagem de erro mais detalhada
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Error details:', errorMessage);
    
    // Mensagens específicas para erros conhecidos (ex.: constraint única)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = (error.meta?.target as string[] | undefined) || [];
        if (target.includes('cpf')) {
          return NextResponse.json(
            {
              error:
                'CPF já cadastrado. Use o mesmo e-mail do cadastro ou faça login para agendar.',
            },
            { status: 400 }
          );
        }
        if (target.includes('email')) {
          return NextResponse.json(
            { error: 'Email já cadastrado. Use outro email ou faça login.' },
            { status: 400 }
          );
        }
      }
    }

    return NextResponse.json(
      {
        error: 'Erro ao agendar consulta',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json(
        { error: 'patientId é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar permissão: paciente só pode ver suas próprias consultas, admin pode ver qualquer uma
    if (session.user.role === 'PATIENT' && patientId !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    const consultations = await prisma.consultation.findMany({
      where: { patientId },
      include: {
        doctor: true,
        prescription: true,
        payment: true,
      },
      orderBy: { scheduledAt: 'desc' },
    });

    return NextResponse.json(consultations);
  } catch (error) {
    console.error('Error fetching consultations:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar consultas' },
      { status: 500 }
    );
  }
}
