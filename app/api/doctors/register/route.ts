import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validação para cadastro público
const doctorRegisterSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  crm: z.string().min(4, 'CRM é obrigatório').refine(
    (val) => /^(CRM|CRM-)?\d+$/i.test(val.replace(/\s/g, '')),
    'Formato inválido. Use: CRM-12345 ou CRM12345'
  ),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  specialization: z.string().min(3, 'Especialização é obrigatória'),
  availability: z.string().optional(),
  photo: z.string().optional(), // Base64 da imagem
});

// POST - Cadastro público de médico (aguarda aprovação)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extrair dados do FormData
    const name = formData.get('name') as string;
    const crm = formData.get('crm') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const specialization = formData.get('specialization') as string;
    const availability = formData.get('availability') as string | null;
    const photoFile = formData.get('photo') as File | null;

    // Processar foto se existir
    let photoBase64: string | undefined;
    if (photoFile && photoFile.size > 0) {
      const buffer = await photoFile.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = photoFile.type || 'image/jpeg';
      photoBase64 = `data:${mimeType};base64,${base64}`;
    }

    // Preparar dados para validação
    const dataToValidate = {
      name,
      crm,
      email,
      phone,
      specialization,
      availability: availability || undefined,
      photo: photoBase64,
    };

    // Validar dados
    let validatedData;
    try {
      validatedData = doctorRegisterSchema.parse(dataToValidate);
    } catch (validationError: any) {
      if (validationError instanceof z.ZodError) {
        const firstError = validationError.errors[0];
        return NextResponse.json(
          { 
            error: `Dados inválidos: ${firstError.message}`,
            details: validationError.errors
          },
          { status: 400 }
        );
      }
      throw validationError;
    }

    const {
      name: validatedName,
      crm: validatedCrm,
      email: validatedEmail,
      phone: validatedPhone,
      specialization: validatedSpecialization,
      availability: validatedAvailability,
      photo,
    } = validatedData;

    // Normalizar CRM (remover espaços, padronizar formato)
    const normalizedCrm = validatedCrm
      .replace(/\s/g, '')
      .toUpperCase()
      .replace(/^CRM-?/, 'CRM-');

    // Verificar se CRM já existe
    const existingCrm = await prisma.doctor.findUnique({
      where: { crm: normalizedCrm },
    });
    if (existingCrm) {
      return NextResponse.json(
        { error: `CRM ${normalizedCrm} já está cadastrado. Entre em contato conosco se você já é parceiro.` },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const existingEmail = await prisma.user.findUnique({
      where: { email: validatedEmail },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: `Email ${validatedEmail} já está cadastrado. Use outro email ou recupere a senha.` },
        { status: 400 }
      );
    }

    // Criar usuário e médico em transação
    // IMPORTANTE: active=false - médico precisa ser aprovado por um admin
    const result = await prisma.$transaction(async (tx) => {
      // Criar usuário (sem senha - será definida após aprovação)
      const user = await tx.user.create({
        data: {
          email: validatedEmail,
          name: validatedName,
          phone: validatedPhone,
          role: 'DOCTOR',
          image: photo, // Salvar foto como base64
        },
      });

      // Criar médico (inativo até aprovação)
      const doctor = await tx.doctor.create({
        data: {
          name: validatedName,
          crm: normalizedCrm,
          email: validatedEmail,
          phone: validatedPhone,
          specialization: validatedSpecialization,
          availability: validatedAvailability || null,
          active: false, // IMPORTANTE: precisa de aprovação
          userId: user.id,
        },
      });

      return { user, doctor };
    });

    // TODO: Enviar email de notificação para admin sobre novo cadastro
    // TODO: Enviar email de confirmação para o médico

    return NextResponse.json(
      { 
        message: 'Cadastro realizado com sucesso! Aguarde a aprovação da nossa equipe. Você receberá um email quando seu cadastro for aprovado.',
        doctorId: result.doctor.id
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro ao cadastrar médico:', error);

    // Erros específicos do Prisma
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'campo';
      return NextResponse.json(
        { error: `${field === 'crm' ? 'CRM' : field === 'email' ? 'Email' : 'Campo'} já está cadastrado.` },
        { status: 400 }
      );
    }

    // Erro genérico com detalhes em desenvolvimento
    return NextResponse.json(
      { 
        error: 'Erro ao realizar cadastro. Verifique os dados e tente novamente.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
