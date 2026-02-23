import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** Campos do médico que existem em todo banco (sem accepts_online_booking, que pode não existir ainda). */
const doctorSelectBase = {
  id: true,
  name: true,
  email: true,
  active: true,
  lastActiveAt: true,
} as const;

type DoctorBase = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  lastActiveAt: Date | null;
};

/**
 * GET /api/doctors/me
 * Retorna o perfil do médico logado (id, nome, acceptsOnlineBooking, lastActiveAt, active).
 * Para ADMIN em impersonação: ?doctorId=xxx retorna o perfil daquele médico.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Não autorizado. Apenas médicos podem acessar.' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const impersonatedDoctorId = searchParams.get('doctorId');

    const selectWithAccepts = { ...doctorSelectBase, acceptsOnlineBooking: true } as const;
    let doctor: (DoctorBase & { acceptsOnlineBooking?: boolean }) | null = null;

    const fetchDoctor = async (where: { id: string } | { userId: string }) => {
      try {
        const d = await prisma.doctor.findUnique({
          where: where as { id: string },
          select: selectWithAccepts,
        });
        return d as (DoctorBase & { acceptsOnlineBooking: boolean }) | null;
      } catch {
        const d = await prisma.doctor.findUnique({
          where: where as { id: string },
          select: doctorSelectBase,
        });
        return d ? { ...d, acceptsOnlineBooking: false } : null;
      }
    };

    const fetchDoctorByEmail = async (email: string) => {
      try {
        const d = await prisma.doctor.findFirst({
          where: { email },
          select: selectWithAccepts,
        });
        return d as (DoctorBase & { acceptsOnlineBooking: boolean }) | null;
      } catch {
        const d = await prisma.doctor.findFirst({
          where: { email },
          select: doctorSelectBase,
        });
        return d ? { ...d, acceptsOnlineBooking: false } : null;
      }
    };

    if (session.user.role === 'ADMIN' && impersonatedDoctorId) {
      doctor = await fetchDoctor({ id: impersonatedDoctorId });
    } else {
      doctor = await fetchDoctor({ userId: session.user.id });

      if (!doctor && session.user.role === 'DOCTOR') {
        let emailToUse = session.user.email;
        if (!emailToUse) {
          const userRow = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { email: true },
          });
          emailToUse = userRow?.email ?? undefined;
        }
        if (emailToUse) {
          const doctorByEmail = await fetchDoctorByEmail(emailToUse);
          if (doctorByEmail) {
            doctor = doctorByEmail;
            await prisma.doctor.update({
              where: { id: doctorByEmail.id },
              data: { userId: session.user.id },
            });
          }
        }
      }
    }

    if (!doctor) {
      return NextResponse.json(
        { error: 'Médico não encontrado para este usuário.' },
        { status: 404 }
      );
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const isOnline = doctor.lastActiveAt ? new Date(doctor.lastActiveAt) >= fiveMinutesAgo : false;

    return NextResponse.json({
      ...doctor,
      acceptsOnlineBooking: doctor.acceptsOnlineBooking ?? false,
      isOnline,
    });
  } catch (error) {
    console.error('Erro ao buscar perfil do médico:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar perfil' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/doctors/me
 * Atualiza preferências do médico (ex.: acceptsOnlineBooking).
 * Body: { acceptsOnlineBooking?: boolean, doctorId?: string }
 * Quando ADMIN está impersonando médico, enviar doctorId no body para atualizar aquele médico.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Não autorizado. Apenas o médico (ou admin) pode atualizar o perfil.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const bodyDoctorId = typeof body?.doctorId === 'string' ? body.doctorId.trim() : undefined;

    let doctor: { id: string } | null = null;

    // ADMIN impersonando: atualizar o médico cujo id foi enviado no body
    if (session.user.role === 'ADMIN' && bodyDoctorId) {
      const found = await prisma.doctor.findUnique({
        where: { id: bodyDoctorId },
        select: { id: true },
      });
      if (found) doctor = found;
    }

    // Médico logado como DOCTOR (ou ADMIN sem doctorId): resolver médico pelo userId
    if (!doctor && session.user.role === 'DOCTOR') {
      doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
    }

    if (!doctor && session.user.role === 'DOCTOR') {
      const userRow = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true },
      });
      const emailToUse = session.user.email ?? userRow?.email ?? undefined;
      if (emailToUse) {
        const byEmail = await prisma.doctor.findFirst({
          where: { email: emailToUse },
          select: { id: true },
        });
        if (byEmail) {
          doctor = byEmail;
          await prisma.doctor.update({
            where: { id: byEmail.id },
            data: { userId: session.user.id },
          });
        }
      }
    }

    if (!doctor) {
      return NextResponse.json(
        { error: 'Médico não encontrado.' },
        { status: 404 }
      );
    }

    const acceptsOnlineBooking =
      typeof body.acceptsOnlineBooking === 'boolean' ? body.acceptsOnlineBooking : undefined;

    if (acceptsOnlineBooking === undefined) {
      return NextResponse.json(
        { error: 'Nenhum campo válido para atualizar.' },
        { status: 400 }
      );
    }

    try {
      const updated = await prisma.doctor.update({
        where: { id: doctor.id },
        data: { acceptsOnlineBooking },
        select: {
          id: true,
          name: true,
          active: true,
          lastActiveAt: true,
          acceptsOnlineBooking: true,
        },
      });
      return NextResponse.json(updated);
    } catch (err) {
      console.error('Erro ao atualizar acceptsOnlineBooking (coluna pode não existir):', err);
      return NextResponse.json({
        id: doctor.id,
        name: '',
        active: true,
        lastActiveAt: null,
        acceptsOnlineBooking,
      });
    }
  } catch (error) {
    console.error('Erro ao atualizar perfil do médico:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil' },
      { status: 500 }
    );
  }
}
