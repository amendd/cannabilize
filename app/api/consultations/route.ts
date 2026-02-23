import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { notifyConsultationScheduled } from '@/lib/notifications';
import { Prisma } from '@prisma/client';
import {
  assignDoctorToConsultation,
  isSlotAvailable,
  isDoctorOnline,
  isDateTodayForAvailability,
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
import { getConsultationDefaultAmount } from '@/lib/consultation-price';
import { getAppOrigin } from '@/lib/app-url';
import crypto from 'crypto';

// Normaliza CPF para só dígitos (aceita com ou sem máscara)
function normalizeCPF(v: string): string {
  return (v || '').replace(/\D/g, '');
}

const consultationSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(10),
  cpf: z.string().min(1, 'CPF é obrigatório').refine(
    (v) => normalizeCPF(v).length === 11,
    { message: 'CPF deve ter 11 dígitos (com ou sem pontuação).' }
  ),
  birthDate: z.string(),
  pathologies: z.array(z.string()).min(1),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/),
  // Anamnese removida do agendamento; paciente preenche após o pagamento na área logada
  anamnesis: z.object({
    previousTreatments: z.string().optional(),
    currentMedications: z.string().optional(),
    allergies: z.string().optional(),
    additionalInfo: z.string().optional(),
  }).optional(),
  recaptchaToken: z.string().optional(),
  honeypot: z.string().optional(),
  formStartTime: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Ler body uma única vez (não dá para ler duas vezes)
    const contentType = request.headers.get('content-type') || '';
    let body: Record<string, unknown> = {};
    if (contentType.includes('application/json')) {
      const raw = await request.text();
      if (raw && raw.trim()) {
        try {
          const parsed = JSON.parse(raw);
          const obj = typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {};
          // Clonar para garantir objeto simples (evita proxy/getters que possam falhar ao acessar props)
          body = JSON.parse(JSON.stringify(obj)) as Record<string, unknown>;
        } catch {
          console.error('POST /api/consultations: JSON inválido, raw length:', raw.length);
        }
      } else {
        console.warn('POST /api/consultations: body vazio ou só espaços, length:', raw?.length ?? 0);
      }
    } else {
      const extracted = (await extractFormData(request)) as Record<string, unknown>;
      body = JSON.parse(JSON.stringify(extracted || {})) as Record<string, unknown>;
    }
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'Corpo da requisição vazio. Preencha todos os campos do formulário e tente novamente.', details: 'body_empty' },
        { status: 400 }
      );
    }

    // Snapshot dos campos do formulário (chaves ausentes viram string vazia/array vazio para evitar "Required" e dar mensagem clara)
    const formData = {
      name: body.name != null ? String(body.name) : '',
      email: body.email != null ? String(body.email) : '',
      phone: body.phone != null ? String(body.phone) : '',
      cpf: body.cpf != null ? String(body.cpf) : '',
      birthDate: body.birthDate != null ? String(body.birthDate) : '',
      pathologies: Array.isArray(body.pathologies) ? body.pathologies : [],
      scheduledDate: body.scheduledDate != null ? String(body.scheduledDate) : '',
      scheduledTime: body.scheduledTime != null ? String(body.scheduledTime) : '',
      anamnesis: body.anamnesis,
    };

    // Validar segurança ANTES de validar dados do negócio
    const securityValidation = await validateFormSubmission(
      body,
      request,
      {
        formType: 'appointment',
        requireRecaptcha: !!process.env.RECAPTCHA_SECRET_KEY,
        requireHoneypot: true,
        requireFillTime: true,
        fieldCount: 10,
        allowedFields: [
          'name', 'email', 'phone', 'cpf', 'birthDate',
          'pathologies', 'scheduledDate', 'scheduledTime',
          'anamnesis', 'recaptchaToken', 'honeypot', 'website_url', 'formStartTime',
          'consentPrivacy', 'consentTerms'
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

    // Consentimento LGPD: aceitar quando vier true ou quando não vier (envio do formulário = aceite)
    const consentPrivacy = body.consentPrivacy;
    const consentTerms = body.consentTerms;
    const hasConsent = consentPrivacy !== false && consentTerms !== false;
    if (!hasConsent) {
      return NextResponse.json(
        { error: 'Você deve aceitar a Política de Privacidade e os Termos de Uso para continuar.' },
        { status: 400 }
      );
    }
    
    // Validar dados do negócio
    const validationResult = consultationSchema.omit({
      recaptchaToken: true,
      honeypot: true,
      formStartTime: true,
    }).safeParse(formData);
    
    if (!validationResult.success) {
      // Não logar validationResult.error inteiro: o objeto Zod pode causar erro no util.inspect do Node (reading 'value')
      console.error('Validation error:', validationResult.error.errors);
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }
    
    const data = validationResult.data;
    data.cpf = normalizeCPF(data.cpf);

    // Criar ou buscar usuário: email → CPF → telefone (permite agendar/pagar por outra pessoa sem dar acesso à conta)
    let user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user && data.cpf) {
      user = await prisma.user.findFirst({
        where: { cpf: data.cpf },
      }) ?? undefined;
    }
    if (!user && data.phone) {
      user = await prisma.user.findFirst({
        where: { phone: data.phone },
      }) ?? undefined;
    }

    const isNewUser = !user;
    if (!user) {
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

      // Enviar email de boas-vindas apenas para usuário novo (não bloqueia a resposta)
      sendAccountWelcomeEmail({
        to: user.email,
        patientName: user.name,
      }).catch(error => {
        console.error('Erro ao enviar email de boas-vindas:', error);
      });

      // Enviar WhatsApp de boas-vindas para novos usuários (se tiver telefone)
      if (user.phone) {
        const { notifyPatientByWhatsApp } = await import('@/lib/notifications');
        notifyPatientByWhatsApp({
          patientName: user.name,
          patientPhone: user.phone,
          type: 'ACCOUNT_WELCOME',
        }).catch(error => {
          console.error('Erro ao enviar WhatsApp de boas-vindas:', error);
        });
      }

      // Enviar email de conclusão de cadastro (para definir senha)
      if (!user.password) {
        const origin = getAppOrigin(new URL(request.url).origin);
        createAndSendSetupToken(user.id, user.email, user.name, origin, user.phone || undefined).catch(
          error => {
            console.error('Erro ao enviar email de conclusão de cadastro:', error);
          }
        );
      }
    }
    
    // Se usuário já existe (por email, CPF ou telefone), completar dados ausentes (nunca alterar email da conta)
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
          if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            const target = (e.meta?.target as string[] | undefined) || [];
            if (target.includes('cpf')) {
              return NextResponse.json(
                {
                  error:
                    'CPF já cadastrado com outra conta. Use o e-mail do cadastro ou faça login para agendar.',
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

    // Usar mesma lógica de "hoje" que a listagem de slots (timezone Brasil)
    const isToday = isDateTodayForAvailability(data.scheduledDate);

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

    // Se for hoje, verificar antecedência: 30 min só se médico online E aceita agendamento online
    if (isToday) {
      const doctorIsOnline = await isDoctorOnline(assignedDoctorId);
      const doctor = await prisma.doctor.findUnique({
        where: { id: assignedDoctorId },
        select: { acceptsOnlineBooking: true },
      });
      const acceptsOnline = doctor?.acceptsOnlineBooking === true;
      const canUseShortNotice = doctorIsOnline && acceptsOnline;
      const minMinutesOnline = await getMinAdvanceBookingMinutesOnline();
      const minMinutesOffline = await getMinAdvanceBookingMinutesOffline();
      const requiredMinutes = canUseShortNotice ? minMinutesOnline : minMinutesOffline;
      const minTimeFromNow = new Date(now.getTime() + requiredMinutes * 60 * 1000);

      if (scheduledAt < minTimeFromNow) {
        return NextResponse.json(
          {
            error: `Para agendamentos no dia atual, é necessário pelo menos ${requiredMinutes} minutos de antecedência${canUseShortNotice ? ' (médico online e aceita 30 min)' : ' (médico offline ou não aceita 30 min)'}.`,
          },
          { status: 400 }
        );
      }
    }

    const anamnesisString = data.anamnesis ? JSON.stringify(data.anamnesis) : null;
    const defaultAmount = await getConsultationDefaultAmount();

    const consultation = await prisma.consultation.create({
      data: {
        patientId: user.id,
        doctorId: assignedDoctorId,
        scheduledAt,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        status: 'SCHEDULED',
        anamnesis: anamnesisString,
        name: user.name,
        email: user.email,
        phone: user.phone || data.phone,
      },
      include: {
        doctor: true,
      },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.consultationConfirmationToken.create({
      data: {
        consultationId: consultation.id,
        token,
        expiresAt,
      },
    });

    await prisma.payment.create({
      data: {
        patientId: user.id,
        consultationId: consultation.id,
        amount: defaultAmount,
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

    const origin = getAppOrigin(new URL(request.url).origin);

    // Notificações para o dono da conta (paciente), não para quem preencheu o formulário
    if (doctor || admin) {
      notifyConsultationScheduled({
        consultationId: consultation.id,
        patientName: user.name,
        patientEmail: user.email,
        patientPhone: user.phone || data.phone,
        doctorName: doctor?.name || 'Não designado',
        doctorEmail: doctor?.email || doctor?.user?.email || '',
        doctorPhone: doctor?.phone || doctor?.user?.phone || undefined,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        adminEmail: admin?.email || undefined,
        adminPhone: admin?.phone || undefined,
        amount: defaultAmount,
        paymentMethod: undefined, // na nova consulta ainda não há pagamento → "Aguardando pagamento"
        origin,
      }).catch(error => {
        console.error('Erro ao enviar notificações:', error);
      });
    }
    const confirmationUrl = `${origin}/consultas/${consultation.id}/confirmacao?token=${token}`;

    sendConsultationConfirmationEmail({
      to: user.email,
      patientName: user.name,
      consultationDateTime: scheduledAt,
      meetingLink: consultation.meetingLink || undefined,
      confirmationUrl,
    }).catch(error => {
      console.error('Erro ao enviar email de confirmação de consulta:', error);
    });

    return NextResponse.json({
      id: consultation.id,
      confirmationToken: token,
      message: 'Consulta agendada com sucesso',
    });
  } catch (error) {
    console.error('Error creating consultation:', error);
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack);
    }
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

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
    const limitParam = searchParams.get('limit');
    const cursor = searchParams.get('cursor');
    const limit = Math.min(Math.max(1, parseInt(limitParam || '100', 10)), 500);

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
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const nextCursor =
      consultations.length === limit ? consultations[consultations.length - 1].id : null;

    return NextResponse.json({ consultations, nextCursor });
  } catch (error) {
    console.error('Error fetching consultations:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar consultas' },
      { status: 500 }
    );
  }
}
