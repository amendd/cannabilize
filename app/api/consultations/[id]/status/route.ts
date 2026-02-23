import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canAccessAdmin } from '@/lib/roles-permissions';

const ALLOWED_STATUSES = new Set(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']);

function isAllowedTransition(from: string, to: string, isAdmin: boolean) {
  if (from === to) return true;
  // Admin/operador: pode mover entre qualquer status (fluxo completo)
  if (isAdmin) return true;
  // Médico: regras restritas
  if (from === 'SCHEDULED' && (to === 'IN_PROGRESS' || to === 'COMPLETED')) return true;
  if (from === 'IN_PROGRESS' && to === 'COMPLETED') return true;
  return false;
}

/**
 * PUT - Atualizar status da consulta (apenas médico/admin)
 * Body: { status: 'IN_PROGRESS' | 'COMPLETED' }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    const isAdmin = session && canAccessAdmin(session.user?.role);
    const isDoctor = session?.user?.role === 'DOCTOR';
    if (!session || (!isDoctor && !isAdmin)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const nextStatus = String(body?.status || '').toUpperCase();

    if (!ALLOWED_STATUSES.has(nextStatus)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      );
    }

    const consultation = await prisma.consultation.findUnique({
      where: { id: params.id },
      select: { id: true, status: true, doctorId: true },
    });

    if (!consultation) {
      return NextResponse.json({ error: 'Consulta não encontrada' }, { status: 404 });
    }

    if (!isAdmin) {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });

      if (!doctor) {
        return NextResponse.json(
          { error: 'Médico não encontrado. Verifique se sua conta está vinculada a um médico.' },
          { status: 403 }
        );
      }

      if (consultation.doctorId && consultation.doctorId !== doctor.id) {
        return NextResponse.json(
          { error: 'Não autorizado a atualizar esta consulta. Esta consulta pertence a outro médico.' },
          { status: 403 }
        );
      }

      // Se a consulta não tem médico atribuído, atribuir ao médico logado
      if (!consultation.doctorId) {
        await prisma.consultation.update({
          where: { id: params.id },
          data: { doctorId: doctor.id },
        });
      }
    }

    const fromStatus = String(consultation.status || '').toUpperCase();
    if (!isAllowedTransition(fromStatus, nextStatus, !!isAdmin)) {
      return NextResponse.json(
        { error: `Transição de status não permitida (${fromStatus} -> ${nextStatus})` },
        { status: 400 }
      );
    }

    const updated = await prisma.consultation.update({
      where: { id: params.id },
      data: { status: nextStatus as any },
      select: { id: true, status: true },
    });

    return NextResponse.json({ success: true, consultation: updated });
  } catch (error) {
    console.error('Erro ao atualizar status da consulta:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar status da consulta' },
      { status: 500 }
    );
  }
}

