import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { getPaymentReminderMessage } from '@/lib/whatsapp-templates';
function isCronAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  if (auth === `Bearer ${secret}`) return true;
  const url = new URL(request.url);
  return url.searchParams.get('secret') === secret;
}

type ReminderWindow = '48H' | '24H' | 'TODAY';

/**
 * Envia lembretes de pagamento pendente por WhatsApp.
 * GET /api/cron/send-payment-reminders?window=48H|24H|TODAY
 * Auth: Authorization: Bearer CRON_SECRET ou ?secret=CRON_SECRET
 */
export async function GET(request: NextRequest) {
  try {
    if (!isCronAuthorized(request)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const window = (searchParams.get('window') || '24H') as ReminderWindow;
    if (!['48H', '24H', 'TODAY'].includes(window)) {
      return NextResponse.json(
        { error: 'Use ?window=48H, ?window=24H ou ?window=TODAY' },
        { status: 400 }
      );
    }

    const now = new Date();
    let start: Date;
    let end: Date;

    if (window === '48H') {
      const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      start = new Date(in48h.getTime() - 2 * 60 * 60 * 1000);
      end = new Date(in48h.getTime() + 2 * 60 * 60 * 1000);
    } else if (window === '24H') {
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      start = new Date(in24h.getTime() - 2 * 60 * 60 * 1000);
      end = new Date(in24h.getTime() + 2 * 60 * 60 * 1000);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    }

    const charges = await prisma.charge.findMany({
      where: {
        status: { in: ['CREATED', 'SENT'] },
        dueDate: { gte: start, lte: end },
        patient: { phone: { not: null } },
      },
      include: { patient: true },
    });

    const results = { processed: 0, errors: 0, items: [] as Array<{ chargeId: string; status: string }> };

    for (const charge of charges) {
      const phone = charge.patient.phone;
      if (!phone) continue;
      try {
        const message = getPaymentReminderMessage({
          patientName: charge.patient.name,
          amount: charge.amount,
          date: charge.dueDate,
          dueDate: charge.dueDate,
        });
        await sendWhatsAppMessage({ to: phone, message });
        results.processed++;
        results.items.push({ chargeId: charge.id, status: 'whatsapp:sent' });
      } catch (error) {
        results.errors++;
        results.items.push({
          chargeId: charge.id,
          status: `whatsapp:${error instanceof Error ? error.message : 'error'}`,
        });
        console.error(`Erro lembrete pagamento charge ${charge.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      window,
      total: charges.length,
      ...results,
    });
  } catch (error) {
    console.error('Erro ao processar lembretes de pagamento:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao processar lembretes de pagamento',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
