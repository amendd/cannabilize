/**
 * Configuração de lembretes WhatsApp (mensagens por etapa + envio automático).
 * Lê/grava no SystemConfig. Usado pelo admin e pelo cron de envio automático.
 */

import { prisma } from './prisma';
import { FLOW_STATE_REMINDER_MESSAGES } from './whatsapp-reminder-messages';

const CONFIG_KEY_PREFIX = 'whatsapp_reminder_';
export const KEY_AUTO_ENABLED = 'whatsapp_reminder_auto_enabled';
export const KEY_AUTO_HOURS = 'whatsapp_reminder_auto_hours';
export const KEY_AUTO_MIN_INTERVAL_DAYS = 'whatsapp_reminder_auto_min_interval_days';

const DEFAULT_AUTO_HOURS = 24;
const DEFAULT_AUTO_MIN_INTERVAL_DAYS = 7;

export async function loadReminderMessages(): Promise<Record<string, string>> {
  const keys = Object.keys(FLOW_STATE_REMINDER_MESSAGES).map(
    (s) => `${CONFIG_KEY_PREFIX}${s}`
  );
  const configs = await prisma.systemConfig.findMany({
    where: { key: { in: keys } },
    select: { key: true, value: true },
  });
  const byKey = Object.fromEntries(configs.map((c) => [c.key, c.value]));
  const messages: Record<string, string> = {};
  for (const state of Object.keys(FLOW_STATE_REMINDER_MESSAGES)) {
    const key = `${CONFIG_KEY_PREFIX}${state}`;
    messages[state] =
      (byKey[key]?.trim() || FLOW_STATE_REMINDER_MESSAGES[state]) ?? '';
  }
  return messages;
}

export interface AutoReminderConfig {
  enabled: boolean;
  inactivityHours: number;
  minIntervalDays: number;
}

export async function loadAutoReminderConfig(): Promise<AutoReminderConfig> {
  const configs = await prisma.systemConfig.findMany({
    where: {
      key: { in: [KEY_AUTO_ENABLED, KEY_AUTO_HOURS, KEY_AUTO_MIN_INTERVAL_DAYS] },
    },
    select: { key: true, value: true },
  });
  const byKey = Object.fromEntries(configs.map((c) => [c.key, c.value]));
  return {
    enabled: byKey[KEY_AUTO_ENABLED] === 'true',
    inactivityHours: Math.max(
      1,
      parseInt(byKey[KEY_AUTO_HOURS] ?? '', 10) || DEFAULT_AUTO_HOURS
    ),
    minIntervalDays: Math.max(
      0,
      parseInt(byKey[KEY_AUTO_MIN_INTERVAL_DAYS] ?? '', 10) ?? DEFAULT_AUTO_MIN_INTERVAL_DAYS
    ),
  };
}
