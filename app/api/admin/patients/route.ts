import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleApiError, checkAuth } from '@/lib/error-handler';
import { canAccessAdmin } from '@/lib/roles-permissions';
import { createAndSendSetupToken } from '@/lib/account-setup';
import { createAuditLog, AuditAction, AuditEntity } from '@/lib/audit';

// GET - Listar pacientes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const authError = checkAuth(session);
    if (authError) return authError;
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    if (!canAccessAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Não autorizado. Apenas administradores podem acessar.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || 'PATIENT';
    const format = searchParams.get('format');

    // Construir filtros
    const where: any = {
      role: role,
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { cpf: { contains: search } },
      ];
    }

    const patients = await prisma.user.findMany({
      where,
      include: {
        consultations: {
          select: { id: true, status: true, scheduledAt: true },
          orderBy: { scheduledAt: 'desc' },
          take: 5,
        },
        prescriptions: {
          select: { id: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
        patientPathologies: {
          include: { pathology: { select: { name: true } } },
        },
        patientCard: {
          select: { status: true, approvalStatus: true, cardNumber: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'csv') {
      const headers = [
        'ID',
        'Nome',
        'Email',
        'Telefone',
        'CPF',
        'Data nascimento',
        'Endereço',
        'Criado em',
      ];
      const rows = patients.map((p) => [
        p.id,
        p.name ?? '',
        p.email ?? '',
        p.phone ?? '',
        p.cpf ?? '',
        p.birthDate ? new Date(p.birthDate).toISOString().slice(0, 10) : '',
        (p as any).address ?? '',
        p.createdAt.toISOString().slice(0, 19),
      ]);
      const csv = [
        headers.join(';'),
        ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')),
      ].join('\r\n');
      const bom = '\uFEFF';
      return new NextResponse(bom + csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="pacientes.csv"',
        },
      });
    }

    return NextResponse.json({ patients });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST - Cadastro assistido: criar paciente e opcionalmente enviar convite (e-mail/WhatsApp)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session);
    if (authError) return authError;
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    if (!canAccessAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Não autorizado. Apenas administradores podem cadastrar pacientes.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      cpf,
      address,
      sendInvite = true,
    } = body as {
      name: string;
      email: string;
      phone?: string;
      cpf?: string;
      address?: string;
      sendInvite?: boolean;
    };

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: 'Nome e e-mail são obrigatórios.' },
        { status: 400 }
      );
    }

    const emailNorm = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email: emailNorm },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Já existe um usuário com este e-mail.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: emailNorm,
        role: 'PATIENT',
        phone: phone?.trim() || null,
        cpf: cpf ? String(cpf).replace(/\D/g, '') : null,
        address: address?.trim() || null,
        password: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });

    if (sendInvite) {
      const origin =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.APP_URL ||
        request.headers.get('origin') ||
        request.headers.get('referer')?.replace(/\/[^/]*$/, '') ||
        process.env.NEXTAUTH_URL ||
        'http://localhost:3000';
      try {
        await createAndSendSetupToken(
          user.id,
          user.email,
          user.name,
          origin,
          user.phone || undefined
        );
      } catch (err) {
        console.error('Erro ao enviar convite de conclusão de cadastro:', err);
        await createAuditLog({
          userId: session!.user!.id,
          action: AuditAction.CREATE,
          entity: AuditEntity.USER,
          entityId: user.id,
          metadata: { role: 'PATIENT', email: user.email, sendInviteFailed: true },
        }).catch(() => {});
        return NextResponse.json(
          {
            user,
            message: 'Paciente criado, mas o envio do convite (e-mail/WhatsApp) falhou. Tente reenviar o convite pela edição do paciente.',
          },
          { status: 201 }
        );
      }
    }

    await createAuditLog({
      userId: session!.user!.id,
      action: AuditAction.CREATE,
      entity: AuditEntity.USER,
      entityId: user.id,
      metadata: { role: 'PATIENT', email: user.email, sendInvite: !!sendInvite },
    }).catch(() => {});

    return NextResponse.json(
      {
        user,
        message: sendInvite
          ? 'Paciente criado e convite enviado por e-mail e WhatsApp (se informado).'
          : 'Paciente criado.',
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error as Error);
  }
}
