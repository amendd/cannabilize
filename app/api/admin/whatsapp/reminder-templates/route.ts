import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  FLOW_STATE_LABELS,
  FLOW_STATE_REMINDER_MESSAGES,
} from '@/lib/whatsapp-reminder-messages';

const CONFIG_KEY_PREFIX = 'whatsapp_reminder_';
const KEY_AUTO_ENABLED = 'whatsapp_reminder_auto_enabled';
const KEY_AUTO_HOURS = 'whatsapp_reminder_auto_hours';
const KEY_AUTO_MIN_INTERVAL_DAYS = 'whatsapp_reminder_auto_min_interval_days';

const DEFAULT_AUTO_HOURS = 24;
const DEFAULT_AUTO_MIN_INTERVAL_DAYS = 7;

/** GET - Retorna mensagens de lembrete por etapa + configuração de envio automático. */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const keys = Object.keys(FLOW_STATE_REMINDER_MESSAGES).map(
      (state) => `${CONFIG_KEY_PREFIX}${state}`
    );
    const allKeys = [...keys, KEY_AUTO_ENABLED, KEY_AUTO_HOURS, KEY_AUTO_MIN_INTERVAL_DAYS];
    const configs = await prisma.systemConfig.findMany({
      where: { key: { in: allKeys } },
      select: { key: true, value: true },
    });
    const byKey = Object.fromEntries(configs.map((c) => [c.key, c.value]));

    const messages: Record<string, string> = {};
    for (const state of Object.keys(FLOW_STATE_REMINDER_MESSAGES)) {
      const key = `${CONFIG_KEY_PREFIX}${state}`;
      messages[state] = (byKey[key]?.trim() || FLOW_STATE_REMINDER_MESSAGES[state]) ?? '';
    }

    const autoEnabled = byKey[KEY_AUTO_ENABLED] === 'true';
    const autoHours = Math.max(1, parseInt(byKey[KEY_AUTO_HOURS] ?? '', 10) || DEFAULT_AUTO_HOURS);
    const autoMinIntervalDays = Math.max(0, parseInt(byKey[KEY_AUTO_MIN_INTERVAL_DAYS] ?? '', 10) ?? DEFAULT_AUTO_MIN_INTERVAL_DAYS);

    return NextResponse.json({
      messages,
      labels: FLOW_STATE_LABELS,
      autoReminder: {
        enabled: autoEnabled,
        inactivityHours: autoHours,
        minIntervalDays: autoMinIntervalDays,
      },
    });
  } catch (err) {
    console.error('[admin whatsapp reminder-templates GET]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao carregar mensagens' },
      { status: 500 }
    );
  }
}

/** PUT - Salva mensagens de lembrete por etapa e/ou configuração de envio automático. */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const messages = body?.messages;
    const autoReminder = body?.autoReminder;

    let saved = 0;

    if (messages && typeof messages === 'object') {
      const validStates = new Set(Object.keys(FLOW_STATE_REMINDER_MESSAGES));
      for (const [state, value] of Object.entries(messages)) {
        if (!validStates.has(state)) continue;
        const key = `${CONFIG_KEY_PREFIX}${state}`;
        const text = typeof value === 'string' ? value : '';
        await prisma.systemConfig.upsert({
          where: { key },
          create: { key, value: text },
          update: { value: text },
        });
        saved++;
      }
    }

    if (autoReminder && typeof autoReminder === 'object') {
      if (typeof autoReminder.enabled === 'boolean') {
        await prisma.systemConfig.upsert({
          where: { key: KEY_AUTO_ENABLED },
          create: { key: KEY_AUTO_ENABLED, value: autoReminder.enabled ? 'true' : 'false' },
          update: { value: autoReminder.enabled ? 'true' : 'false' },
        });
        saved++;
      }
      if (typeof autoReminder.inactivityHours === 'number' && autoReminder.inactivityHours >= 1) {
        await prisma.systemConfig.upsert({
          where: { key: KEY_AUTO_HOURS },
          create: { key: KEY_AUTO_HOURS, value: String(autoReminder.inactivityHours) },
          update: { value: String(autoReminder.inactivityHours) },
        });
        saved++;
      }
      if (typeof autoReminder.minIntervalDays === 'number' && autoReminder.minIntervalDays >= 0) {
        await prisma.systemConfig.upsert({
          where: { key: KEY_AUTO_MIN_INTERVAL_DAYS },
          create: { key: KEY_AUTO_MIN_INTERVAL_DAYS, value: String(autoReminder.minIntervalDays) },
          update: { value: String(autoReminder.minIntervalDays) },
        });
        saved++;
      }
    }

    return NextResponse.json({ ok: true, saved });
  } catch (err) {
    console.error('[admin whatsapp reminder-templates PUT]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao salvar mensagens' },
      { status: 500 }
    );
  }
}
