import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getRescheduleInvitesEnabled,
  getMinAdvanceBookingEnabled,
} from '@/lib/consultation-config';

/**
 * GET - Retorna se as ferramentas de agendamento estão ativadas.
 * Usado pelo dashboard do médico (esconder botão "Sugerir Adiantamento" quando desativado).
 * Requer sessão (qualquer role).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { rescheduleInvitesEnabled: true, minAdvanceBookingEnabled: true },
        { status: 200 }
      );
    }

    const [rescheduleInvitesEnabled, minAdvanceBookingEnabled] = await Promise.all([
      getRescheduleInvitesEnabled(),
      getMinAdvanceBookingEnabled(),
    ]);

    return NextResponse.json({
      rescheduleInvitesEnabled,
      minAdvanceBookingEnabled,
    });
  } catch (error) {
    console.error('Erro ao buscar booking-features:', error);
    return NextResponse.json(
      { rescheduleInvitesEnabled: true, minAdvanceBookingEnabled: true },
      { status: 200 }
    );
  }
}
