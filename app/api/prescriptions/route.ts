import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePrescriptionPDF } from '@/lib/prescription-generator';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createPatientCardRequest, generateQRCode } from '@/lib/patient-card';
import {
  sendPrescriptionIssuedEmail,
  sendConsultationFollowupEmail,
} from '@/lib/email';

// PrescriptionStatus: "DRAFT", "ISSUED", "USED", "EXPIRED", "CANCELLED"

export async function POST(request: NextRequest) {
  // Mantém no escopo do catch para logs seguros
  let safeConsultationId: string | undefined;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { consultationId, prescriptionData } = body;
    safeConsultationId = consultationId;

    // Buscar consulta
    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
      include: { 
        patient: true, 
        doctor: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!consultation) {
      return NextResponse.json(
        { error: 'Consulta não encontrada' },
        { status: 404 }
      );
    }

    // Se não houver médico atribuído e for ADMIN, buscar um médico padrão ou criar um temporário
    let doctorId = consultation.doctorId;
    if (!doctorId && session.user.role === 'ADMIN') {
      // Buscar primeiro médico ativo
      const defaultDoctor = await prisma.doctor.findFirst({
        where: { active: true },
        include: { user: true },
      });
      if (defaultDoctor) {
        doctorId = defaultDoctor.id;
        // Atualizar consulta com o médico
        await prisma.consultation.update({
          where: { id: consultationId },
          data: { doctorId: defaultDoctor.id },
        });
      }
    }

    // Verificar se já existe receita emitida
    const existingIssued = await prisma.prescription.findFirst({
      where: {
        consultationId,
        status: 'ISSUED',
      },
    });

    let prescription;
    
    // Se for ADMIN, permitir atualizar receita existente (para testes)
    if (existingIssued && session.user.role === 'ADMIN') {
      // Garantir que temos um doctorId válido
      let finalDoctorId = doctorId || existingIssued.doctorId;
      if (!finalDoctorId) {
        const anyDoctor = await prisma.doctor.findFirst({
          where: { active: true },
        });
        if (anyDoctor) {
          finalDoctorId = anyDoctor.id;
        }
      }
      
      // Atualizar receita existente
      prescription = await prisma.prescription.update({
        where: { id: existingIssued.id },
        data: {
          prescriptionData: JSON.stringify(prescriptionData),
          doctorId: finalDoctorId || existingIssued.doctorId,
          issuedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
          status: 'ISSUED',
        },
      });
    } else if (existingIssued) {
      return NextResponse.json(
        { error: 'Receita já foi emitida para esta consulta' },
        { status: 400 }
      );
    }

    // Se ainda não temos uma receita, criar ou atualizar rascunho
    if (!prescription) {
      // Garantir que temos um doctorId válido antes de continuar
      let finalDoctorId = doctorId || consultation.doctorId;
      if (!finalDoctorId && session.user.role === 'ADMIN') {
        // Buscar qualquer médico ativo
        const anyDoctor = await prisma.doctor.findFirst({
          where: { active: true },
        });
        if (anyDoctor) {
          finalDoctorId = anyDoctor.id;
          // Atualizar consulta com o médico
          await prisma.consultation.update({
            where: { id: consultationId },
            data: { doctorId: anyDoctor.id },
          });
        } else {
          return NextResponse.json(
            { error: 'Nenhum médico cadastrado no sistema. Cadastre um médico em /admin/medicos primeiro.' },
            { status: 400 }
          );
        }
      }
      
      if (!finalDoctorId) {
        return NextResponse.json(
          { error: 'Consulta não possui médico atribuído. Atribua um médico à consulta primeiro.' },
          { status: 400 }
        );
      }

      // Buscar rascunho existente
      const existingDraft = await prisma.prescription.findFirst({
        where: {
          consultationId,
          status: 'DRAFT',
        },
      });

      if (existingDraft) {
        // Atualizar rascunho para receita emitida
        prescription = await prisma.prescription.update({
          where: { id: existingDraft.id },
          data: {
            prescriptionData: JSON.stringify(prescriptionData),
            doctorId: finalDoctorId,
            issuedAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
            status: 'ISSUED',
          },
        });
      } else {
        // Criar nova receita
        prescription = await prisma.prescription.create({
          data: {
            consultationId,
            patientId: consultation.patientId,
            doctorId: finalDoctorId,
            prescriptionData: JSON.stringify(prescriptionData),
            issuedAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
            status: 'ISSUED',
          },
        });
      }
    }

    // Gerar PDF - buscar médico da receita
    let doctor = await prisma.doctor.findUnique({
      where: { id: prescription.doctorId },
      include: { user: true },
    });

    // Se não encontrar, tentar buscar da consulta
    if (!doctor && consultation.doctor) {
      doctor = consultation.doctor;
      if (!doctor.user) {
        doctor = await prisma.doctor.findUnique({
          where: { id: doctor.id },
          include: { user: true },
        });
      }
    }

    // Se ainda não encontrar, buscar qualquer médico ativo (fallback para ADMIN)
    if (!doctor && session.user.role === 'ADMIN') {
      doctor = await prisma.doctor.findFirst({
        where: { active: true },
        include: { user: true },
      });
    }

    if (!doctor) {
      return NextResponse.json(
        { error: 'Dados do médico não encontrados. Certifique-se de que há um médico cadastrado no sistema.' },
        { status: 404 }
      );
    }

    // QR codes:
    // - Autenticidade da Receita: exclusivo para validar o documento
    // - Carteirinha: validação da carteirinha digital do paciente (quando existir)
    let authenticityQrCodeUrl: string | undefined;
    let patientCardQrCodeUrl: string | undefined;
    try {
      const patientCard = await prisma.patientCard.findUnique({
        where: { patientId: consultation.patientId },
        select: { qrCodeUrl: true, approvalStatus: true, status: true },
      });
      // Só mostramos QR da carteirinha se houver um QR gerado (pode ser PENDING/ACTIVE) e existir no banco
      patientCardQrCodeUrl = patientCard?.qrCodeUrl || undefined;
    } catch (error) {
      console.error('Erro ao buscar carteirinha (não crítico):', error);
    }

    // Gerar QR de autenticidade da receita (sempre que possível)
    try {
      const origin = new URL(request.url).origin;
      // Página pública de verificação da receita (autenticidade do documento)
      const qrCodeData = `${origin}/receita/${prescription.id}`;
      authenticityQrCodeUrl = await generateQRCode(qrCodeData);
    } catch (qrError) {
      console.error('Erro ao gerar QR de autenticidade (não crítico):', qrError);
    }

    const pdfBytes = await generatePrescriptionPDF(
      prescription,
      {
        name: consultation.patient.name,
        cpf: consultation.patient.cpf || undefined,
        birthDate: consultation.patient.birthDate || undefined,
        address: consultation.patient.address || undefined,
        phone: consultation.patient.phone || undefined,
        email: consultation.patient.email || undefined,
      },
      {
        name: doctor.name,
        crm: doctor.crm,
        specialization: doctor.specialization || undefined,
        email: doctor.email || undefined,
        phone: doctor.phone || undefined,
        cpf: doctor.user?.cpf || undefined,
        address: doctor.user?.address || undefined,
      },
      authenticityQrCodeUrl,
      patientCardQrCodeUrl
    );

    // Salvar PDF como base64 (em produção, usar S3 ou similar)
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
    const pdfUrl = `data:application/pdf;base64,${pdfBase64}`;

    // Atualizar receita com pdfUrl
    prescription = await prisma.prescription.update({
      where: { id: prescription.id },
      data: { pdfUrl },
    });

    // Atualizar consulta
    await prisma.consultation.update({
      where: { id: consultationId },
      data: { status: 'COMPLETED' },
    });

    // Criar solicitação de carteirinha (status PENDING - aguarda aprovação do admin)
    try {
      await createPatientCardRequest(consultation.patientId, prescription.id);
      console.log('Solicitação de carteirinha criada para o paciente:', consultation.patientId);
    } catch (cardError) {
      // Não falhar a criação da receita se houver erro na carteirinha
      console.error('Erro ao criar solicitação de carteirinha (não crítico):', cardError);
    }

    // Enviar email para o paciente informando que a receita foi emitida
    try {
      if (consultation.patient.email) {
        const origin = new URL(request.url).origin;
        const prescriptionUrl = `${origin}/receita/${prescription.id}`;

        await sendPrescriptionIssuedEmail({
          to: consultation.patient.email,
          patientName: consultation.patient.name,
          prescriptionUrl,
        });
      }
    } catch (emailError) {
      console.error('Erro ao enviar email de receita emitida (não crítico):', emailError);
    }

    // Enviar email de follow-up pós-consulta (não bloqueia a resposta)
    try {
      if (consultation.patient.email) {
        const origin = new URL(request.url).origin;
        const prescriptionUrl = `${origin}/receita/${prescription.id}`;

        sendConsultationFollowupEmail({
          to: consultation.patient.email,
          patientName: consultation.patient.name,
          prescriptionUrl,
        }).catch(error => {
          console.error('Erro ao enviar email de follow-up pós-consulta:', error);
        });
      }
    } catch (emailError) {
      console.error('Erro ao enviar email de follow-up (não crítico):', emailError);
    }

    return NextResponse.json({
      id: prescription.id,
      pdfBase64,
      message: 'Receita emitida com sucesso',
    });
  } catch (error: any) {
    console.error('Error creating prescription:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      consultationId: safeConsultationId,
    });
    return NextResponse.json(
      { error: error.message || 'Erro ao emitir receita' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const consultationId = searchParams.get('consultationId');
    const doctorId = searchParams.get('doctorId');
    const limit = searchParams.get('limit');

    // Se for médico, permitir buscar suas próprias receitas
    if (session?.user.role === 'DOCTOR' && !patientId && !consultationId && !doctorId) {
      // Buscar doctorId do médico logado
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
      });
      if (doctor) {
        const prescriptions = await prisma.prescription.findMany({
          where: { doctorId: doctor.id },
          include: {
            consultation: {
              include: { patient: true, doctor: true },
            },
            doctor: true,
            medications: {
              include: {
                medication: true,
              },
            },
          },
          orderBy: { issuedAt: 'desc' },
          take: limit ? parseInt(limit) : undefined,
        });
        return NextResponse.json(prescriptions);
      } else {
        // Médico sem registro na tabela Doctor, retornar array vazio
        return NextResponse.json([]);
      }
    }

    // Se for admin sem parâmetros, retornar todas as receitas
    if (session?.user.role === 'ADMIN' && !patientId && !consultationId && !doctorId) {
      const prescriptions = await prisma.prescription.findMany({
        include: {
          consultation: {
            include: { patient: true, doctor: true },
          },
          doctor: true,
          medications: {
            include: {
              medication: true,
            },
          },
        },
        orderBy: { issuedAt: 'desc' },
        take: limit ? parseInt(limit) : undefined,
      });
      return NextResponse.json(prescriptions);
    }

    if (!patientId && !consultationId && !doctorId) {
      return NextResponse.json(
        { error: 'patientId, consultationId ou doctorId é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar permissão: paciente só pode ver suas próprias receitas, admin pode ver qualquer uma
    if (patientId && session?.user.role === 'PATIENT' && patientId !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    const where: any = {};
    if (patientId) where.patientId = patientId;
    if (consultationId) where.consultationId = consultationId;
    if (doctorId) where.doctorId = doctorId;

    const prescriptions = await prisma.prescription.findMany({
      where,
      include: {
        consultation: {
          include: { patient: true, doctor: true },
        },
        doctor: true,
        medications: {
          include: {
            medication: true,
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
      take: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar receitas' },
      { status: 500 }
    );
  }
}
